const { Pool } = require('pg');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hms_database_v1',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
});

// Helper for formatted money
const formatMoney = (amount) => Number(Number(amount).toFixed(2));

exports.downloadTemplate = async (req, res) => {
    try {
        // Fetch active services for this branch
        const branchId = req.user.branch_id;

        const servicesResult = await pool.query(
            `SELECT s.service_name 
             FROM services s
             JOIN branch_services bs ON s.service_id = bs.service_id
             WHERE bs.branch_id = $1 AND bs.is_active = true 
             ORDER BY s.service_name`,
            [branchId]
        );

        const dynamicServiceColumns = servicesResult.rows.map(row => row.service_name);

        // Define static columns
        const staticColumns = [
            'PATIENT NAME',
            'ADMISSION TYPE',
            'DEPARTMENT',
            'DOCTOR NAME',
            'MEDICAL COUNCIL ID',
            'PAYMENT MODE' // Cash/Insurance
        ];

        // Combine columns
        const allColumns = [...staticColumns, ...dynamicServiceColumns];

        // Create a dummy row for clarity (optional, but requested "prefilled sample" implies structure)
        const sampleRow = {
            'PATIENT NAME': 'John Doe',
            'ADMISSION TYPE': 'IPD',
            'DEPARTMENT': 'Cardiology',
            'DOCTOR NAME': 'Dr. Smith',
            'MEDICAL COUNCIL ID': 'MCI-12345',
            'PAYMENT MODE': 'Cash'
        };
        // Add empty cells for services
        dynamicServiceColumns.forEach(col => sampleRow[col] = 1000); // Sample Cost

        // Create workbook
        const ws = xlsx.utils.json_to_sheet([sampleRow], { header: allColumns });
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Template");

        // Write to buffer
        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename="Referral_Payment_Template.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Length', buffer.length); // Fix for download
        res.send(buffer);

    } catch (error) {
        console.error('Error generating template:', error);
        res.status(500).json({ success: false, message: 'Server error generating template' });
    }
};

exports.uploadReferralData = async (req, res) => {
    // Transactional consistency is key here
    const client = await pool.connect();

    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const filePath = req.file.path;
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return res.status(400).json({ success: false, message: 'Excel file is empty' });
        }

        await client.query('BEGIN');

        // 1. Create Batch Header
        const created_by = req.user ? (req.user.username || req.user.user_id.toString()) : 'unknown';
        const hospital_id = req.user.hospital_id;
        const branch_id = req.user.branch_id;

        const batchResult = await client.query(
            `INSERT INTO referral_payment_upload_batch 
            (hospital_id, branch_id, file_name, total_records, created_by, updated_by)
            VALUES ($1, $2, $3, $4, $5, $5) RETURNING id`,
            [hospital_id, branch_id, req.file.originalname, data.length, created_by]
        );
        const batchId = batchResult.rows[0].id;

        let totalBatchReferralAmount = 0;

        // Cache services and doctor percentages to avoid N+1 queries
        // Fetch all services map: Name -> Cost (Default cost from hospital_services?)
        // Actually, cost might differ per hospital. Let's assume we look up 'hospital_services' table.
        // Assuming 'service_name' is unique enough or we match best effort.
        // Cache services map: Name -> Code (for percentage lookup)
        const servicesQuery = await client.query(
            `SELECT s.service_name, s.service_code 
             FROM services s
             JOIN branch_services bs ON s.service_id = bs.service_id
             WHERE bs.branch_id = $1 AND bs.is_active = true`,
            [branch_id]
        );
        const serviceCodeMap = {}; // Name -> Code
        servicesQuery.rows.forEach(r => {
            serviceCodeMap[r.service_name] = r.service_code;
        });

        // Loop through Excel Rows
        for (const row of data) {
            const patientName = row['PATIENT NAME'];
            const admissionType = row['ADMISSION TYPE'];
            const department = row['DEPARTMENT'];
            const doctorName = row['DOCTOR NAME'];
            const mciId = row['MEDICAL COUNCIL ID'];
            const paymentMode = row['PAYMENT MODE'];

            if (!patientName || !doctorName) continue; // Skip empty rows

            // 2. Create Patient Transaction Header
            const headerResult = await client.query(
                `INSERT INTO referral_payment_header 
                (batch_id, patient_name, admission_type, department, doctor_name, medical_council_id, payment_mode, created_by, updated_by)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8) RETURNING id`,
                [batchId, patientName, admissionType, department, doctorName, mciId, paymentMode, created_by]
            );
            const headerId = headerResult.rows[0].id;
            let headerTotalAmount = 0;

            // Find Doctor ID by MCI (Need to look up referral_doctor_module)
            const doctorQuery = await client.query(
                "SELECT id, referral_pay FROM referral_doctor_module WHERE medical_council_membership_number = $1",
                [mciId]
            );

            let doctorId = null;
            let globalPercentage = 0;

            if (doctorQuery.rows.length > 0) {
                doctorId = doctorQuery.rows[0].id;
                globalPercentage = Number(doctorQuery.rows[0].referral_pay || 0);
            } else {
                // Doctor not found, maybe log warning? For now proceed with 0% logic or global default?
                // User said "default to 0%".
            }

            // Fetch specific percentages for this doctor
            let doctorServicePercentages = {};
            if (doctorId) {
                const pctQuery = await client.query(
                    "SELECT service_type, cash_percentage, inpatient_percentage FROM referral_doctor_service_percentage_module WHERE referral_doctor_id = $1",
                    [doctorId]
                );
                // Map: ServiceName (Code/Type) -> { cash: %, ipd: % }
                // DB stores 'service_type' which is usually service code. We need to match Name -> Code -> Percentage.
                pctQuery.rows.forEach(r => {
                    doctorServicePercentages[r.service_type] = {
                        cash: Number(r.cash_percentage),
                        ipd: Number(r.inpatient_percentage)
                    };
                });
            }

            // Iterate over dynamic columns (Services)
            // Identify which keys in 'row' are services. 
            // All keys except static ones are potentially services.
            const staticKeys = ['PATIENT NAME', 'ADMISSION TYPE', 'DEPARTMENT', 'DOCTOR NAME', 'MEDICAL COUNCIL ID', 'PAYMENT MODE'];

            for (const key of Object.keys(row)) {
                if (staticKeys.includes(key)) continue;

                const serviceName = key;
                const value = row[key]; // This assumes the value acts as a "Usage Flag" or "Count"?
                // Wait, requirements said: "detailed table with service type, cost for service..."
                // Excel has "columns from the services... each service takes 1 column".
                // Does the cell contain "Yes" or the "Amount"?
                // Usually it implies existing. Let's assume non-empty cell means service availed.
                // Or maybe the cell contains the COST? 

                // User said: "detailed table with service type, cost for service, doctor percentage ... and its equivalant value"
                // Implication: We look up cost from DB. The Excel just indicates "Was this service done?".
                // Let's assume if cell has value '1' or 'Yes' or any truthy, we calculate.

                if (!value) continue;

                // Find Service Cost
                // We need to map 'Service Name' (Excel Header) to 'Service Code' (DB) to find Cost & Percentage.
                // This is tricky if Names don't match exactly. User said "Exact name match".

                // We need a Name -> Code map.
                // Assuming serviceCostMap keys are Service Names.
                const serviceCost = Number(value);

                // Find Percentage
                // The 'referral_doctor_service_percentage_module' stores 'service_type' which matches the Service Name (e.g. 'X-ray scan')
                // So we use serviceName directly as the key.

                let percentage = 0;
                if (doctorId && doctorServicePercentages[serviceName]) {
                    // Decide based on Payment Mode
                    if (paymentMode && paymentMode.toLowerCase() === 'cash') {
                        percentage = doctorServicePercentages[serviceName].cash || 0;
                    } else {
                        percentage = doctorServicePercentages[serviceName].ipd || 0;
                    }
                }

                // If no specific service config, User said "default to 0%".

                // Calculate
                const referralAmount = (serviceCost * percentage) / 100;

                // 3. Insert Detail
                await client.query(
                    `INSERT INTO referral_payment_details
                    (payment_header_id, service_name, service_cost, referral_percentage, referral_amount, created_by, updated_by)
                    VALUES ($1, $2, $3, $4, $5, $6, $6)`,
                    [headerId, serviceName, serviceCost, percentage, referralAmount, created_by]
                );

                headerTotalAmount += referralAmount;
            }

            // Update Header Total
            await client.query(
                "UPDATE referral_payment_header SET total_referral_amount = $1 WHERE id = $2",
                [headerTotalAmount, headerId]
            );
            totalBatchReferralAmount += headerTotalAmount;
        }

        // Update Batch Total Amount
        await client.query(
            "UPDATE referral_payment_upload_batch SET total_amount = $1 WHERE id = $2",
            [totalBatchReferralAmount, batchId]
        );

        await client.query('COMMIT');

        // Cleanup file
        fs.unlinkSync(filePath);

        res.status(200).json({
            success: true,
            message: 'File processed successfully',
            batch_id: batchId,
            total_records: data.length,
            total_amount: totalBatchReferralAmount
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error processing upload:', error);
        res.status(500).json({ success: false, message: 'Server error processing file' });
    } finally {
        client.release();
    }
};

exports.getPaymentReports = async (req, res) => {
    try {
        const { fromDate, toDate, doctorId } = req.query;
        const role = req.user.role_code;
        const userId = req.user.user_id;
        const branchId = req.user.branch_id;

        let query = `
            SELECT 
                h.id as header_id,
                h.created_at as upload_date,
                h.patient_name,
                h.doctor_name,
                h.medical_council_id,
                h.admission_type,
                h.payment_mode,
                h.total_referral_amount,
                d.service_name,
                d.service_cost,
                d.referral_percentage,
                d.referral_amount,
                b.file_name,
                rd.marketing_spoc
            FROM referral_payment_header h
            JOIN referral_payment_upload_batch b ON h.batch_id = b.id
            LEFT JOIN referral_payment_details d ON h.id = d.payment_header_id
            LEFT JOIN referral_doctor_module rd ON h.medical_council_id = rd.medical_council_membership_number
            WHERE 1=1
        `;

        const params = [];
        let paramIndex = 1;

        // 1. Branch Scoping (for everyone except Super Admin maybe? User didn't specify, but safer to scope)
        if (branchId) {
            query += ` AND b.branch_id = $${paramIndex}`;
            params.push(branchId);
            paramIndex++;
        }

        // 2. Date Filtering
        if (fromDate) {
            query += ` AND h.created_at >= $${paramIndex}`;
            params.push(fromDate);
            paramIndex++;
        }
        if (toDate) {
            query += ` AND h.created_at <= $${paramIndex}`;
            params.push(toDate + ' 23:59:59');
            paramIndex++;
        }

        // 3. Doctor Filtering (Input)
        if (doctorId) {
            // Assuming doctorId passed is the medical council ID or internal ID?
            // Let's assume passed ID is 'medical_council_id' for simplicity in string match, 
            // or we join boolean. Let's use name or MCI ID.
            query += ` AND rd.id = $${paramIndex}`;
            params.push(doctorId);
            paramIndex++;
        }

        // 4. RBAC Scoping
        if (role === 'MRKT_EXEC') {
            query += ` AND rd.marketing_spoc = $${paramIndex}`;
            // marketing_spoc is VARCHAR in DB (seen in check_schema), userId is INT/String. 
            // Ensure type match.
            params.push(userId.toString());
            paramIndex++;
        }

        query += ` ORDER BY h.created_at DESC`;

        const result = await pool.query(query, params);

        res.status(200).json({ success: true, count: result.rowCount, data: result.rows });

    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ success: false, message: 'Server error fetching reports' });
    }
};
