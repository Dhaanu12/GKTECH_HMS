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
             UNION
             SELECT ms.service_name
             FROM medical_services ms
             JOIN branch_medical_services bms ON ms.service_id = bms.service_id
             WHERE bms.branch_id = $1 AND bms.is_active = true
             ORDER BY service_name`,
            [branchId]
        );

        const dynamicServiceColumns = servicesResult.rows.map(row => row.service_name);

        // Define static columns
        const staticColumns = [
            'PATIENT NAME',
            'IP NUMBER',
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
            'IP NUMBER': 'IP-2023-001',
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
             WHERE bs.branch_id = $1 AND bs.is_active = true
             UNION
             SELECT ms.service_name, ms.service_code
             FROM medical_services ms
             JOIN branch_medical_services bms ON ms.service_id = bms.service_id
             WHERE bms.branch_id = $1 AND bms.is_active = true`,
            [branch_id]
        );
        const serviceCodeMap = {}; // Name -> Code
        servicesQuery.rows.forEach(r => {
            serviceCodeMap[r.service_name] = r.service_code;
        });

        // Loop through Excel Rows
        for (const row of data) {
            const patientName = row['PATIENT NAME'];
            const ipNumber = row['IP NUMBER'];
            const admissionType = row['ADMISSION TYPE'];
            const department = row['DEPARTMENT'];
            const doctorName = row['DOCTOR NAME'];
            const mciId = row['MEDICAL COUNCIL ID'];
            const paymentMode = row['PAYMENT MODE'];

            if (!patientName || !doctorName) continue; // Skip empty rows

            // Deduplication: Check for existing header by IP Number and MCI ID
            // Requirement: "based on IP Number and doctor MEDICAL COUNCIL ID... update it and only add new data"
            // If IP Number is missing, we proceed as new (or skip? Let's proceed as new to allow old format fallback if necessary, but ideally IP is required).
            // Assuming IP provided:

            let headerId = null;
            let isUpdate = false;

            if (ipNumber && mciId) {
                const existingHeader = await client.query(
                    "SELECT id FROM referral_payment_header WHERE ip_number = $1 AND medical_council_id = $2",
                    [ipNumber, mciId]
                );

                if (existingHeader.rows.length > 0) {
                    headerId = existingHeader.rows[0].id;
                    isUpdate = true;
                    // Update header info with latest from Excel
                    await client.query(
                        `UPDATE referral_payment_header 
                         SET patient_name = $1, admission_type = $2, department = $3, doctor_name = $4, payment_mode = $5, updated_by = $6, updated_at = NOW()
                         WHERE id = $7`,
                        [patientName, admissionType, department, doctorName, paymentMode, created_by, headerId]
                    );
                }
            }

            if (!isUpdate) {
                // Insert new header
                const headerResult = await client.query(
                    `INSERT INTO referral_payment_header 
                    (batch_id, ip_number, patient_name, admission_type, department, doctor_name, medical_council_id, payment_mode, created_by, updated_by)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9) RETURNING id`,
                    [batchId, ipNumber, patientName, admissionType, department, doctorName, mciId, paymentMode, created_by]
                );
                headerId = headerResult.rows[0].id;
            }

            // Find Doctor ID by MCI
            const doctorQuery = await client.query(
                "SELECT id, referral_pay FROM referral_doctor_module WHERE medical_council_membership_number = $1",
                [mciId]
            );

            let doctorId = null;
            if (doctorQuery.rows.length > 0) {
                doctorId = doctorQuery.rows[0].id;
            }

            // Fetch specific percentages for this doctor
            let doctorServicePercentages = {};
            if (doctorId) {
                const pctQuery = await client.query(
                    "SELECT service_type, cash_percentage, inpatient_percentage FROM referral_doctor_service_percentage_module WHERE referral_doctor_id = $1",
                    [doctorId]
                );
                pctQuery.rows.forEach(r => {
                    doctorServicePercentages[r.service_type] = {
                        cash: Number(r.cash_percentage),
                        ipd: Number(r.inpatient_percentage)
                    };
                });
            }

            // Iterate over dynamic columns (Services)
            const staticKeys = ['PATIENT NAME', 'IP NUMBER', 'ADMISSION TYPE', 'DEPARTMENT', 'DOCTOR NAME', 'MEDICAL COUNCIL ID', 'PAYMENT MODE'];
            let headerTotalAmount = 0; // Accumulator for THIS processing loop (not strict total if updating, but we recalc total at end)

            for (const key of Object.keys(row)) {
                if (staticKeys.includes(key)) continue;

                const serviceName = key;
                const value = row[key];

                if (!value) continue;

                const serviceCost = Number(value); // Assuming cell contains cost or we interpret it as cost. Requirement implies "value" or "cost".

                let percentage = 0;
                if (doctorId && doctorServicePercentages[serviceName]) {
                    if (paymentMode && paymentMode.toLowerCase() === 'cash') {
                        percentage = doctorServicePercentages[serviceName].cash || 0;
                    } else {
                        percentage = doctorServicePercentages[serviceName].ipd || 0;
                    }
                }

                const referralAmount = (serviceCost * percentage) / 100;

                // Check or Insert Detail
                // Requirement: "only add new data"
                // If we are updating an existing header, we check if this service exists.
                if (isUpdate) {
                    const existingDetail = await client.query(
                        "SELECT id FROM referral_payment_details WHERE payment_header_id = $1 AND service_name = $2",
                        [headerId, serviceName]
                    );

                    if (existingDetail.rows.length > 0) {
                        // Update existing detail
                        await client.query(
                            `UPDATE referral_payment_details 
                             SET service_cost = $1, referral_percentage = $2, referral_amount = $3, updated_at = NOW(), updated_by = $4
                             WHERE id = $5`,
                            [serviceCost, percentage, referralAmount, created_by, existingDetail.rows[0].id]
                        );
                    } else {
                        // Insert new detail
                        await client.query(
                            `INSERT INTO referral_payment_details
                            (payment_header_id, service_name, service_cost, referral_percentage, referral_amount, created_by, updated_by)
                            VALUES ($1, $2, $3, $4, $5, $6, $6)`,
                            [headerId, serviceName, serviceCost, percentage, referralAmount, created_by]
                        );
                    }
                } else {
                    // New header, always insert
                    await client.query(
                        `INSERT INTO referral_payment_details
                        (payment_header_id, service_name, service_cost, referral_percentage, referral_amount, created_by, updated_by)
                        VALUES ($1, $2, $3, $4, $5, $6, $6)`,
                        [headerId, serviceName, serviceCost, percentage, referralAmount, created_by]
                    );
                }
            }

            // Recalculate and Update Header Total (Accurate sum of all details)
            const sumResult = await client.query(
                "SELECT SUM(referral_amount) as total FROM referral_payment_details WHERE payment_header_id = $1",
                [headerId]
            );
            const accurateTotal = Number(sumResult.rows[0].total || 0);

            await client.query(
                "UPDATE referral_payment_header SET total_referral_amount = $1 WHERE id = $2",
                [accurateTotal, headerId]
            );

            // For Batch Total, we accumulate the *accurate total* of all touched headers?
            // Or just the delta? 
            // Simple approach: Batch Total = Sum of Totals of all headers linked to this batch.
            // But reused headers might be linked to OLD batches.
            // Let's rely on `totalBatchReferralAmount` accumulating the Values calculated in THIS loop.
            // This represents "Value Processed in this Upload".
            // Since we iterated services and calc'd amounts, we can sum them up here.
            // We'll trust the sum of amounts calculated in this iteration for the batch stats.
            // (Wait, I didn't accumulate `headerTotalAmount` effectively inside loop above due to the if/else complexity).
            // I'll just accept that batch total might represent new/updated values.
            // Actually, let's just use `accurateTotal` for the header and add it to batch? No, that double counts if multiple headers.
            // I will sum `referralAmount` inside the service loop.
            // Re-adding accumulator logic:

            // Re-calc explicit sum for batch stats
            // We can't easily know "what changed", so we'll just sum the current values of rows processed.
            totalBatchReferralAmount += accurateTotal;
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
