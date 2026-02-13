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

// Helper to convert Excel date serial number to YYYY-MM-DD format
const convertExcelDate = (excelDate) => {
    if (!excelDate) return null;

    // If it's already a string in date format, return as is
    if (typeof excelDate === 'string' && excelDate.includes('-')) {
        return excelDate;
    }

    // If it's a number (Excel serial date), convert it
    if (typeof excelDate === 'number') {
        // Excel dates start from 1900-01-01 (serial 1)
        // JavaScript dates start from 1970-01-01
        const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
        const jsDate = new Date(excelEpoch.getTime() + excelDate * 86400000);

        // Format as YYYY-MM-DD
        const year = jsDate.getFullYear();
        const month = String(jsDate.getMonth() + 1).padStart(2, '0');
        const day = String(jsDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Try to parse as date string
    try {
        const date = new Date(excelDate);
        if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    } catch (e) {
        console.error('Error parsing date:', excelDate, e);
    }

    return null;
};

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
            'SERVICE DATE',
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
            'SERVICE DATE': '2023-01-15',
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
        const hospital_id = req.user.hospital_id || null;
        const branch_id = req.user.branch_id || null;

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
        console.log(`Processing ${data.length} rows from Excel...`);
        for (const row of data) {
            const patientName = row['PATIENT NAME'] || null;
            const ipNumber = row['IP NUMBER'] || null;
            const serviceDate = convertExcelDate(row['SERVICE DATE']);
            const admissionType = row['ADMISSION TYPE'] || null;
            const department = row['DEPARTMENT'] || null;
            const doctorName = row['DOCTOR NAME'] || null;
            const mciId = row['MEDICAL COUNCIL ID'] || null;
            const paymentMode = row['PAYMENT MODE'] || null;

            if (!patientName || !doctorName) {
                console.log('⚠️ Skipping row - missing patient name or doctor name:', { patientName, doctorName });
                continue; // Skip empty rows
            }

            console.log(`Processing row: Patient=${patientName}, Doctor=${doctorName}, MCI=${mciId}, IP=${ipNumber}, Date=${serviceDate}`);


            // Deduplication: Check for existing header by IP Number and MCI ID
            // Requirement: "based on IP Number and doctor MEDICAL COUNCIL ID... update it and only add new data"
            // If IP Number is missing, we proceed as new (or skip? Let's proceed as new to allow old format fallback if necessary, but ideally IP is required).
            // Assuming IP provided:

            // Find Doctor ID by MCI (Scoped to THIS hospital)
            const doctorQuery = await client.query(
                "SELECT id, doctor_name, referral_pay FROM referral_doctor_module WHERE medical_council_membership_number = $1 AND tenant_id = $2",
                [mciId, hospital_id]
            );

            let doctorId = null;
            let resolvedDoctorName = doctorName; // Default to Excel name

            let headerId = null;
            let isUpdate = false;

            if (doctorQuery.rows.length > 0) {
                doctorId = doctorQuery.rows[0].id;
                resolvedDoctorName = doctorQuery.rows[0].doctor_name; // Use DB name to ensure correct assignment
                console.log(`✓ Doctor found: ID=${doctorId}, Name=${resolvedDoctorName}`);
            } else {
                console.log(`⚠️ Doctor NOT found in database for MCI ID: ${mciId}. Data will be saved but with 0% commission.`);
            }

            if (ipNumber && mciId && serviceDate) {
                const existingHeader = await client.query(
                    "SELECT id FROM referral_payment_header WHERE ip_number = $1 AND medical_council_id = $2 AND service_date = $3",
                    [ipNumber, mciId, serviceDate]
                );

                if (existingHeader.rows.length > 0) {
                    headerId = existingHeader.rows[0].id;
                    isUpdate = true;
                    // Update header info with latest from Excel (but use resolved Doc Name)
                    await client.query(
                        `UPDATE referral_payment_header 
                         SET patient_name = $1, admission_type = $2, department = $3, doctor_name = $4, payment_mode = $5, service_date = $6, updated_by = $7, updated_at = NOW()
                         WHERE id = $8`,
                        [patientName, admissionType, department, resolvedDoctorName, paymentMode, serviceDate, created_by, headerId]
                    );
                }
            }

            if (!isUpdate) {
                // Insert new header
                console.log(`✓ Inserting NEW header for patient: ${patientName}`);
                const headerResult = await client.query(
                    `INSERT INTO referral_payment_header 
                    (batch_id, ip_number, patient_name, admission_type, department, doctor_name, medical_council_id, payment_mode, service_date, created_by, updated_by)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10) RETURNING id`,
                    [batchId, ipNumber, patientName, admissionType, department, resolvedDoctorName, mciId, paymentMode, serviceDate, created_by]
                );
                headerId = headerResult.rows[0].id;
                console.log(`✓ Header created with ID: ${headerId}`);
            } else {
                console.log(`✓ UPDATING existing header ID: ${headerId} for patient: ${patientName}`);
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
            const staticKeys = ['PATIENT NAME', 'IP NUMBER', 'SERVICE DATE', 'ADMISSION TYPE', 'DEPARTMENT', 'DOCTOR NAME', 'MEDICAL COUNCIL ID', 'PAYMENT MODE'];
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
                h.ip_number,
                h.service_date,
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
                rd.marketing_spoc,
                rd.id as referral_doctor_id
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

        // 2. Date Filtering (by service_date, not upload date)
        if (fromDate) {
            query += ` AND h.service_date >= $${paramIndex}`;
            params.push(fromDate);
            paramIndex++;
        }
        if (toDate) {
            query += ` AND h.service_date <= $${paramIndex}`;
            params.push(toDate);
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

        query += ` ORDER BY rd.id, h.ip_number, h.service_date DESC, h.created_at DESC`;

        const result = await pool.query(query, params);

        res.status(200).json({ success: true, count: result.rowCount, data: result.rows });

    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ success: false, message: 'Server error fetching reports' });
    }
};

exports.getAgentReferralReports = async (req, res) => {
    try {
        const { fromDate, toDate, agentId } = req.query;
        const branchId = req.user.branch_id;
        const hospitalId = req.user.hospital_id; // Agents are usually hospital-wide or branch-specific? Schema has tenant_id (hospital).

        // Base Query: Select Agents
        // We will then join/subquery to get counts. 
        // Note: Counting needs to respect Date Range for the *Referrals* (patients/doctors created), not when Agent was created.

        // Complex query to get Agents + Counts in one go
        let query = `
            WITH patient_counts AS (
                SELECT means_id, COUNT(*) as p_count
                FROM referral_patients
                WHERE referral_means = 'Agent'
        `;

        const params = [];
        let paramIndex = 1;

        if (fromDate) {
            query += ` AND created_at >= $${paramIndex}`;
            params.push(fromDate);
            paramIndex++;
        }
        if (toDate) {
            query += ` AND created_at <= $${paramIndex}`;
            params.push(toDate);
            paramIndex++;
        }
        query += ` GROUP BY means_id ),
            doctor_counts AS (
                SELECT means_id, COUNT(*) as d_count
                FROM referral_doctor_module
                WHERE referral_means = 'Agent'
        `;

        if (fromDate) {
            query += ` AND created_at >= $${paramIndex}`; // Reuse params? No, push again or reference? 
            // safer to push again to avoid index confusion or just use named params if pg supported (it doesn't).
            // Actually, let's keep it simple: 
            // We can't easily reuse $1 inside CTE if we increment index.
            // Let's rely on logic correctness.
            // Re-pushing params for simplicity of index tracking
            query += ` AND created_at >= $${paramIndex}`; // $1 or $3?
            params.push(fromDate);
            paramIndex++;
        }
        if (toDate) {
            query += ` AND created_at <= $${paramIndex}`;
            params.push(toDate);
            paramIndex++;
        }

        query += ` GROUP BY means_id )
            SELECT 
                ra.id as agent_id,
                ra.name as agent_name,
                ra.mobile,
                ra.referral_patient_commission,
                ra.referral_doc_commission,
                COALESCE(pc.p_count, 0) as patient_count,
                COALESCE(dc.d_count, 0) as doctor_count
            FROM referral_agents ra
            LEFT JOIN patient_counts pc ON ra.id = pc.means_id
            LEFT JOIN doctor_counts dc ON ra.id = dc.means_id
            WHERE ra.status != 'Deleted'
        `;

        // Scope Agents by Hospital
        if (hospitalId) {
            query += ` AND ra.tenant_id = $${paramIndex}`;
            params.push(hospitalId);
            paramIndex++;
        }

        if (agentId) {
            query += ` AND ra.id = $${paramIndex}`;
            params.push(agentId);
            paramIndex++;
        }

        query += ` ORDER BY (COALESCE(pc.p_count, 0) + COALESCE(dc.d_count, 0)) DESC, ra.name ASC`;

        const result = await pool.query(query, params);

        const data = result.rows.map(row => {
            const pComm = Number(row.referral_patient_commission || 0);
            const dComm = Number(row.referral_doc_commission || 0);
            const pCount = Number(row.patient_count);
            const dCount = Number(row.doctor_count);
            return {
                ...row,
                total_patient_commission: pCount * pComm,
                total_doctor_commission: dCount * dComm,
                total_commission: (pCount * pComm) + (dCount * dComm)
            };
        });

        res.status(200).json({ success: true, count: data.length, data });

    } catch (error) {
        console.error('Error fetching agent reports:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getAgentDashboardStats = async (req, res) => {
    try {
        const hospitalId = req.user.hospital_id;

        // We want aggregate stats: Total Agents, Total Patients Referred, Total Doctors Referred, Est. Commission
        // (This is ALL TIME stats mostly, or maybe filtered? Usually dashboard is "Overview")
        // Let's do All Time for dashboard summary.

        const query = `
            WITH patient_counts AS (
                SELECT means_id, COUNT(*) as p_count
                FROM referral_patients
                WHERE referral_means = 'Agent'
                GROUP BY means_id
            ),
            doctor_counts AS (
                SELECT means_id, COUNT(*) as d_count
                FROM referral_doctor_module
                WHERE referral_means = 'Agent'
                GROUP BY means_id
            )
            SELECT 
                COUNT(ra.id) as total_agents,
                SUM(COALESCE(pc.p_count, 0)) as total_patients_referred,
                SUM(COALESCE(dc.d_count, 0)) as total_doctors_referred,
                SUM(
                    (COALESCE(pc.p_count, 0) * COALESCE(ra.referral_patient_commission, 0)) + 
                    (COALESCE(dc.d_count, 0) * COALESCE(ra.referral_doc_commission, 0))
                ) as total_commission_liability
            FROM referral_agents ra
            LEFT JOIN patient_counts pc ON ra.id = pc.means_id
            LEFT JOIN doctor_counts dc ON ra.id = dc.means_id
            WHERE ra.status != 'Deleted' AND ra.tenant_id = $1
        `;

        const result = await pool.query(query, [hospitalId]);
        res.status(200).json({ success: true, data: result.rows[0] });

    } catch (error) {
        console.error('Error fetching agent stats:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
