const db = require('../../config/db');

/**
 * Bulk insert service percentages for multiple doctors
 */
exports.bulkInsertServicePercentages = async (req, res) => {
    let client;
    try {
        console.log('Bulk insert request received:', {
            doctor_count: req.body.doctor_ids?.length,
            service_count: req.body.services?.length
        });

        client = await db.getClient();
        const { doctor_ids, services } = req.body;

        if (!doctor_ids || !Array.isArray(doctor_ids) || doctor_ids.length === 0) {
            return res.status(400).json({ success: false, message: 'doctor_ids array is required' });
        }

        if (!services || !Array.isArray(services) || services.length === 0) {
            return res.status(400).json({ success: false, message: 'services array is required' });
        }

        await client.query('BEGIN');

        const insertedRecords = [];
        const skippedRecords = [];

        for (const doctorId of doctor_ids) {
            for (const service of services) {
                // Determine values with defaults
                const cashPct = service.cash_percentage !== undefined ? service.cash_percentage : 10;
                const inpatientPct = service.inpatient_percentage !== undefined ? service.inpatient_percentage : 8;
                const refPay = service.referral_pay || 'Y';

                // Check if already exists
                const existingCheck = await client.query(
                    `SELECT referral_doctor_id FROM referral_doctor_service_percentage_module 
                     WHERE referral_doctor_id = $1 AND service_type = $2`,
                    [doctorId, service.service_type]
                );

                if (existingCheck.rows.length > 0) {
                    skippedRecords.push({
                        doctor_id: doctorId,
                        service_type: service.service_type,
                        reason: 'Already exists'
                    });
                    continue;
                }

                // Insert new record
                const result = await client.query(
                    `INSERT INTO referral_doctor_service_percentage_module (
                        referral_doctor_id, service_type, cash_percentage,
                        inpatient_percentage, referral_pay, status
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *`,
                    [
                        doctorId,
                        service.service_type,
                        cashPct,
                        inpatientPct,
                        refPay,
                        'Active'
                    ]
                );

                insertedRecords.push(result.rows[0]);
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: `Successfully created ${insertedRecords.length} service configurations`,
            data: {
                inserted: insertedRecords.length,
                skipped: skippedRecords.length,
                skipped_details: skippedRecords
            }
        });

    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('Bulk insert error:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (client) client.release();
    }
};

/**
 * Copy service percentages from one doctor to others
 */
exports.copyServicePercentages = async (req, res) => {
    let client;
    try {
        client = await db.getClient();
        const { source_doctor_id, target_doctor_ids } = req.body;

        if (!source_doctor_id) {
            return res.status(400).json({ success: false, message: 'source_doctor_id is required' });
        }

        if (!target_doctor_ids || !Array.isArray(target_doctor_ids) || target_doctor_ids.length === 0) {
            return res.status(400).json({ success: false, message: 'target_doctor_ids array is required' });
        }

        // Get source doctor's service percentages
        const sourceServices = await client.query(
            `SELECT service_type, cash_percentage, inpatient_percentage, referral_pay
             FROM referral_doctor_service_percentage_module
             WHERE referral_doctor_id = $1 AND status = 'Active'`,
            [source_doctor_id]
        );

        if (sourceServices.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Source doctor has no service configurations'
            });
        }

        await client.query('BEGIN');

        const insertedRecords = [];
        const skippedRecords = [];

        for (const targetDoctorId of target_doctor_ids) {
            for (const service of sourceServices.rows) {
                // Check if already exists
                const existingCheck = await client.query(
                    `SELECT id FROM referral_doctor_service_percentage_module 
                     WHERE referral_doctor_id = $1 AND service_type = $2`,
                    [targetDoctorId, service.service_type]
                );

                if (existingCheck.rows.length > 0) {
                    skippedRecords.push({
                        doctor_id: targetDoctorId,
                        service_type: service.service_type,
                        reason: 'Already exists'
                    });
                    continue;
                }

                // Insert copied record
                const result = await client.query(
                    `INSERT INTO referral_doctor_service_percentage_module (
                        referral_doctor_id, service_type, cash_percentage,
                        inpatient_percentage, referral_pay, status
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *`,
                    [
                        targetDoctorId,
                        service.service_type,
                        service.cash_percentage,
                        service.inpatient_percentage,
                        service.referral_pay,
                        'Active'
                    ]
                );

                insertedRecords.push(result.rows[0]);
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: `Successfully copied ${insertedRecords.length} service configurations`,
            data: {
                inserted: insertedRecords.length,
                skipped: skippedRecords.length,
                source_services: sourceServices.rows.length,
                target_doctors: target_doctor_ids.length,
                skipped_details: skippedRecords
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Copy service percentages error:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

/**
 * Get doctors without service percentages (for bulk setup)
 */
exports.getDoctorsWithoutPercentages = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT rd.id, rd.doctor_name, rd.speciality_type, rd.mobile_number, rd.status
             FROM referral_doctor_module rd
             LEFT JOIN referral_doctor_service_percentage_module rdsp ON rd.id = rdsp.referral_doctor_id
             WHERE rdsp.id IS NULL
             ORDER BY rd.doctor_name`
        );

        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get doctors without percentages error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Export service percentages as CSV template
 */
exports.exportCSVTemplate = async (req, res) => {
    try {
        // Get all doctors and services for template
        const doctors = await db.query(
            `SELECT id, doctor_name FROM referral_doctor_module WHERE status = 'Active' ORDER BY doctor_name`
        );

        const services = await db.query(
            `SELECT DISTINCT s.service_name as service_type 
             FROM services s
             JOIN branch_services bs ON s.service_id = bs.service_id
             WHERE bs.is_active = true 
             ORDER BY s.service_name`
        );

        // Create CSV header
        let csv = 'Doctor ID,Doctor Name,Service Type,Referral Pay (Y/N),Cash Percentage,Insurance Percentage\n';

        // Add sample rows
        if (doctors.rows.length > 0 && services.rows.length > 0) {
            csv += `${doctors.rows[0].id},${doctors.rows[0].doctor_name},${services.rows[0].service_type},Y,10,8\n`;
            csv += `${doctors.rows[0].id},${doctors.rows[0].doctor_name},${services.rows[1]?.service_type || 'SERVICE-TYPE'},Y,12,10\n`;
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=service_percentages_template.csv');
        res.status(200).send(csv);

    } catch (error) {
        console.error('Export CSV template error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Import service percentages from CSV
 */
exports.importCSV = async (req, res) => {
    let client;

    try {
        const { csv_data } = req.body;

        console.log('📥 Received CSV import request');
        console.log('CSV data length:', csv_data?.length);
        console.log('First 3 rows:', JSON.stringify(csv_data?.slice(0, 3), null, 2));

        if (!csv_data || !Array.isArray(csv_data)) {
            return res.status(400).json({ success: false, message: 'csv_data array is required' });
        }

        if (csv_data.length === 0) {
            return res.status(400).json({ success: false, message: 'csv_data array is empty' });
        }

        client = await db.getClient();
        await client.query('BEGIN');

        const insertedRecords = [];
        const errors = [];

        for (let i = 0; i < csv_data.length; i++) {
            const row = csv_data[i];
            console.log(`\n🔄 Processing row ${i + 1}:`, row);

            try {
                // Validate row
                if (!row.doctor_id || !row.service_type) {
                    console.log(`⚠️ Row ${i + 1} validation failed:`, row);
                    errors.push({ row: i + 1, error: 'Missing doctor_id or service_type' });
                    continue;
                }

                console.log(`✅ Row ${i + 1} validation passed`);

                // Check if already exists
                console.log(`🔍 Checking if record exists for doctor ${row.doctor_id}, service ${row.service_type}`);
                const existingCheck = await client.query(
                    `SELECT id FROM referral_doctor_service_percentage_module 
                     WHERE referral_doctor_id = $1 AND service_type = $2`,
                    [row.doctor_id, row.service_type]
                );

                console.log(`📊 Existing check result: ${existingCheck.rows.length} rows found`);

                if (existingCheck.rows.length > 0) {
                    console.log(`⚠️ Row ${i + 1} already exists, skipping`);
                    errors.push({ row: i + 1, error: 'Record already exists' });
                    continue;
                }

                console.log(`💾 Inserting row ${i + 1}...`);
                // Insert record
                const result = await client.query(
                    `INSERT INTO referral_doctor_service_percentage_module (
                        referral_doctor_id, service_type, cash_percentage,
                        inpatient_percentage, referral_pay, status
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *`,
                    [
                        row.doctor_id,
                        row.service_type,
                        parseFloat(row.cash_percentage) || 0,
                        parseFloat(row.inpatient_percentage) || 0,
                        row.referral_pay === 'Y' ? 'Y' : 'N',
                        'Active'
                    ]
                );

                console.log(`✅ Row ${i + 1} inserted successfully:`, result.rows[0].percentage_id);
                insertedRecords.push(result.rows[0]);

            } catch (rowError) {
                console.error(`❌ Row ${i + 1} error:`, rowError.message);
                errors.push({ row: i + 1, error: rowError.message });
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: `Imported ${insertedRecords.length} records`,
            data: {
                inserted: insertedRecords.length,
                errors: errors.length,
                error_details: errors
            }
        });

    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('Import CSV error:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (client) client.release();
    }
};

// Keep existing functions...
// (savePaymentRecord, getPaymentHistory, updatePaymentStatus, etc.)
