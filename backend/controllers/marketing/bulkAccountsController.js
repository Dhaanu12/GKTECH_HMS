const db = require('../../config/db');

/**
 * Helper to get assigned hospital IDs for a user
 */
async function getAssignedHospitalIds(user) {
    const assignedHospitalsQuery = `
        SELECT DISTINCT b.hospital_id
        FROM staff s
        JOIN staff_branches sb ON s.staff_id = sb.staff_id
        JOIN branches b ON sb.branch_id = b.branch_id
        WHERE s.user_id = $1 AND sb.is_active = true
    `;
    const assignedHospitals = await db.query(assignedHospitalsQuery, [user.user_id]);
    return assignedHospitals.rows.length > 0
        ? assignedHospitals.rows.map(row => row.hospital_id)
        : [user.hospital_id].filter(Boolean);
}

/**
 * Helper to get assigned branch IDs for a user
 */
async function getAssignedBranchIds(user) {
    const assignedBranchesQuery = `
        SELECT branch_id FROM staff_branches sb
        JOIN staff s ON sb.staff_id = s.staff_id
        WHERE s.user_id = $1 AND sb.is_active = true
    `;
    const assignedBranches = await db.query(assignedBranchesQuery, [user.user_id]);
    return assignedBranches.rows.length > 0
        ? assignedBranches.rows.map(row => row.branch_id)
        : [user.branch_id].filter(Boolean);
}

/**
 * Bulk insert service percentages for multiple doctors
 */
// ============================================
// Bulk Insert Service Percentages
// ============================================
exports.bulkInsertServicePercentages = async (req, res) => {
    let client;
    try {
        console.log('Bulk insert request received:', {
            doctor_count: req.body.doctor_ids?.length,
            service_count: req.body.services?.length
        });

        client = await db.getClient();
        const { doctor_ids, services } = req.body;

        if (!services || !Array.isArray(services) || services.length === 0) {
            return res.status(400).json({ success: false, message: 'services array is required' });
        }

        // Security check: Ensure all doctors belong to assigned hospitals
        const hospitalIds = await getAssignedHospitalIds(req.user);
        const validDoctorsCheck = await client.query(
            'SELECT id FROM referral_doctor_module WHERE id = ANY($1) AND tenant_id = ANY($2)',
            [doctor_ids, hospitalIds]
        );

        if (validDoctorsCheck.rows.length !== doctor_ids.length) {
            return res.status(403).json({ success: false, message: 'Unauthorized: One or more doctors do not belong to your assigned hospitals' });
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

        // Activate all affected doctors
        // Update status for all affected doctors based on active services
        if (doctor_ids.length > 0) {
            await client.query(
                `UPDATE referral_doctor_module d
                 SET status = CASE 
                    WHEN (
                        SELECT COUNT(*) 
                        FROM referral_doctor_service_percentage_module s 
                        WHERE s.referral_doctor_id = d.id 
                          AND s.status = 'Active'
                          AND s.referral_pay = 'Y' 
                          AND (s.cash_percentage > 0 OR s.inpatient_percentage > 0)
                    ) > 0 THEN 'Active'
                    ELSE 'Inactive'
                 END,
                 updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
                 WHERE id = ANY($1)`,
                [doctor_ids]
            );
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

        if (!target_doctor_ids || !Array.isArray(target_doctor_ids) || target_doctor_ids.length === 0) {
            return res.status(400).json({ success: false, message: 'target_doctor_ids array is required' });
        }

        // Security check: Ensure source and target doctors belong to assigned hospitals
        const hospitalIds = await getAssignedHospitalIds(req.user);
        const allDoctorIds = [...new Set([source_doctor_id, ...target_doctor_ids])];
        const validDoctorsCheck = await client.query(
            'SELECT id FROM referral_doctor_module WHERE id = ANY($1) AND tenant_id = ANY($2)',
            [allDoctorIds, hospitalIds]
        );

        if (validDoctorsCheck.rows.length !== allDoctorIds.length) {
            return res.status(403).json({ success: false, message: 'Unauthorized: One or more doctors do not belong to your assigned hospitals' });
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

        // Activate all target doctors
        // Update status for all affected doctors based on active services
        if (target_doctor_ids.length > 0) {
            await client.query(
                `UPDATE referral_doctor_module d
                 SET status = CASE 
                    WHEN (
                        SELECT COUNT(*) 
                        FROM referral_doctor_service_percentage_module s 
                        WHERE s.referral_doctor_id = d.id 
                          AND s.status = 'Active'
                          AND s.referral_pay = 'Y' 
                          AND (s.cash_percentage > 0 OR s.inpatient_percentage > 0)
                    ) > 0 THEN 'Active'
                    ELSE 'Inactive'
                 END,
                 updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
                 WHERE id = ANY($1)`,
                [target_doctor_ids]
            );
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
        if (client) await client.query('ROLLBACK');
        console.error('Copy service percentages error:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (client) client.release();
    }
};

/**
 * Get doctors without service percentages (for bulk setup)
 */
exports.getDoctorsWithoutPercentages = async (req, res) => {
    try {
        const hospitalIds = await getAssignedHospitalIds(req.user);

        const result = await db.query(
            `SELECT rd.id, rd.doctor_name, rd.speciality_type, rd.mobile_number, rd.status
             FROM referral_doctor_module rd
             LEFT JOIN referral_doctor_service_percentage_module rdsp ON rd.id = rdsp.referral_doctor_id
             WHERE rdsp.id IS NULL AND rd.tenant_id = ANY($1)
             ORDER BY rd.doctor_name`,
            [hospitalIds]
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
        const hospitalIds = await getAssignedHospitalIds(req.user);
        const branchIds = await getAssignedBranchIds(req.user);

        // Get all doctors and services for template
        const doctors = await db.query(
            `SELECT id, doctor_name FROM referral_doctor_module WHERE status = 'Active' AND tenant_id = ANY($1) ORDER BY doctor_name`,
            [hospitalIds]
        );

        const services = await db.query(
            `SELECT DISTINCT s.service_name as service_type 
             FROM services s
             JOIN branch_services bs ON s.service_id = bs.service_id
             WHERE bs.is_active = true AND bs.branch_id = ANY($1)
             UNION
             SELECT DISTINCT ms.service_name as service_type
             FROM medical_services ms
             JOIN branch_medical_services bms ON ms.service_id = bms.service_id
             WHERE bms.is_active = true AND bms.branch_id = ANY($1)
             ORDER BY service_type`,
            [branchIds]
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
 * Export actual doctor configurations as CSV
 */
exports.exportDoctorConfigs = async (req, res) => {
    try {
        const { status } = req.query; // 'configured', 'unconfigured', or 'all'

        // 1. Get assigned contexts
        const hospitalIds = await getAssignedHospitalIds(req.user);
        const branchIds = await getAssignedBranchIds(req.user);

        // 2. Fetch all available services (active and inactive)
        const servicesQuery = `
            SELECT DISTINCT s.service_name as service_type 
            FROM services s
            JOIN branch_services bs ON s.service_id = bs.service_id
            WHERE bs.branch_id = ANY($1)
            UNION
            SELECT DISTINCT ms.service_name as service_type
            FROM medical_services ms
            JOIN branch_medical_services bms ON ms.service_id = bms.service_id
            WHERE bms.branch_id = ANY($1)
            ORDER BY service_type
        `;

        const servicesResult = await db.query(servicesQuery, [branchIds]);
        const allServices = servicesResult.rows;

        // 3. Fetch Doctors based on filter
        let doctorsQuery = `
            SELECT rd.id, rd.doctor_name, rd.mobile_number
            FROM referral_doctor_module rd
            WHERE rd.tenant_id = ANY($1) AND rd.status != 'Deleted' AND rd.status != 'Initialization'
        `;

        if (status === 'configured') {
            doctorsQuery += ` AND EXISTS (SELECT 1 FROM referral_doctor_service_percentage_module rdsp WHERE rdsp.referral_doctor_id = rd.id)`;
        } else if (status === 'unconfigured') {
            doctorsQuery += ` AND NOT EXISTS (SELECT 1 FROM referral_doctor_service_percentage_module rdsp WHERE rdsp.referral_doctor_id = rd.id)`;
        }

        doctorsQuery += ` ORDER BY rd.doctor_name`;

        const doctorsResult = await db.query(doctorsQuery, [hospitalIds]);
        const doctors = doctorsResult.rows;

        // 4. Fetch Existing Configurations/Permissions
        const doctorIds = doctors.map(d => d.id);
        let existingConfigs = [];

        if (doctorIds.length > 0) {
            const configQuery = `
                SELECT referral_doctor_id, service_type, referral_pay, cash_percentage, inpatient_percentage
                FROM referral_doctor_service_percentage_module
                WHERE referral_doctor_id = ANY($1)
            `;
            const configResult = await db.query(configQuery, [doctorIds]);
            existingConfigs = configResult.rows;
        }

        // Map configs
        const configMap = {};
        existingConfigs.forEach(cfg => {
            if (!configMap[cfg.referral_doctor_id]) configMap[cfg.referral_doctor_id] = {};
            configMap[cfg.referral_doctor_id][cfg.service_type] = cfg;
        });

        // 5. Generate CSV
        let csv = 'Doctor ID,Doctor Name,Mobile Number,Service Type,Referral Pay (Y/N),Cash Percentage,Insurance Percentage\n';

        if (doctors.length === 0) {
            csv += 'No doctors found matching criteria.\n';
        } else if (allServices.length === 0) {
            csv += 'No services found in your branches.\n';
        } else {
            doctors.forEach(doc => {
                allServices.forEach(svc => {
                    const config = configMap[doc.id]?.[svc.service_type];

                    const refPay = config ? config.referral_pay : 'N';
                    const cashPct = config ? config.cash_percentage : 0;
                    const inpatientPct = config ? config.inpatient_percentage : 0;

                    csv += `${doc.id},"${doc.doctor_name.replace(/"/g, '""')}","${doc.mobile_number || ''}","${svc.service_type.replace(/"/g, '""')}",${refPay},${cashPct},${inpatientPct}\n`;
                });
            });
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=referral_config_${status || 'all'}_${new Date().toISOString().split('T')[0]}.csv`);
        res.status(200).send(csv);

    } catch (error) {
        console.error('Export doctor configs error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Import service percentages from CSV
 */
exports.importCSV = async (req, res) => {
    let client;

    try {
        const { csv_data, dry_run } = req.body;

        console.log(`📥 Received CSV import request (Dry Run: ${dry_run})`);

        if (!csv_data || !Array.isArray(csv_data) || csv_data.length === 0) {
            return res.status(400).json({ success: false, message: 'csv_data array is required and cannot be empty' });
        }

        client = await db.getClient();

        // 1. Security Check: Validate Doctors
        const hospitalIds = await getAssignedHospitalIds(req.user);
        const doctorIdsInCSV = [...new Set(csv_data.map(row => row.doctor_id).filter(id => id != null))];

        const validDoctorsCheck = await client.query(
            'SELECT id FROM referral_doctor_module WHERE id = ANY($1) AND tenant_id = ANY($2)',
            [doctorIdsInCSV, hospitalIds]
        );

        const validDoctorIds = new Set(validDoctorsCheck.rows.map(row => row.id.toString()));

        // 2. Process Rows
        if (!dry_run) await client.query('BEGIN');

        const summary = {
            to_insert: 0,
            to_update: 0,
            unchanged: 0,
            errors: 0,
            details: []
        };
        const affectedDoctorIds = new Set();
        const insertedRecords = []; // For response compatibility

        for (let i = 0; i < csv_data.length; i++) {
            const row = csv_data[i];

            try {
                // Validate Data Structure
                if (!row.doctor_id || !row.service_type) {
                    summary.errors++;
                    summary.details.push({ row: i + 1, error: 'Missing doctor_id or service_type', data: row });
                    continue;
                }

                // Security Check
                if (!validDoctorIds.has(row.doctor_id.toString())) {
                    summary.errors++;
                    summary.details.push({ row: i + 1, error: 'Unauthorized: Doctor not assigned to user', data: row });
                    continue;
                }

                // Parse Values (Ensure correct types)
                const newCash = parseFloat(row.cash_percentage) || 0;
                const newInpatient = parseFloat(row.inpatient_percentage) || 0;
                const newRefPay = row.referral_pay === 'Y' ? 'Y' : 'N';
                const serviceType = row.service_type.trim();

                // Check Existing
                const existingCheck = await client.query(
                    `SELECT percentage_id, cash_percentage, inpatient_percentage, referral_pay 
                     FROM referral_doctor_service_percentage_module 
                     WHERE referral_doctor_id = $1 AND TRIM(service_type) = $2`,
                    [row.doctor_id, serviceType]
                );

                if (existingCheck.rows.length > 0) {
                    const current = existingCheck.rows[0];

                    // DEBUG LOGGING
                    console.log(`\n🔍 Comparison for ${row.doctor_id} - ${serviceType}:`);
                    console.log(`   Current (DB): Cash=${current.cash_percentage} (${typeof current.cash_percentage}), Inpatient=${current.inpatient_percentage} (${typeof current.inpatient_percentage}), Pay=${current.referral_pay} (${typeof current.referral_pay})`);
                    console.log(`   New (CSV):    Cash=${newCash} (${typeof newCash}), Inpatient=${newInpatient} (${typeof newInpatient}), Pay=${newRefPay} (${typeof newRefPay})`);

                    // Compare values (Handle string/number differences)
                    const isChanged =
                        parseFloat(current.cash_percentage) !== newCash ||
                        parseFloat(current.inpatient_percentage) !== newInpatient ||
                        current.referral_pay !== newRefPay;

                    console.log(`   Result: isChanged=${isChanged}`);

                    if (isChanged) {
                        summary.to_update++;
                        if (dry_run) {
                            summary.details.push({
                                row: i + 1,
                                status: 'Update',
                                diff: {
                                    doctor: row.doctor_id,
                                    service: serviceType,
                                    old: { cash: current.cash_percentage, inpatient: current.inpatient_percentage, pay: current.referral_pay },
                                    new: { cash: newCash, inpatient: newInpatient, pay: newRefPay }
                                }
                            });
                        } else {
                            await client.query(
                                `UPDATE referral_doctor_service_percentage_module 
                                 SET cash_percentage = $1, inpatient_percentage = $2, referral_pay = $3, status = 'Active', updated_by = 'Bulk Import', updated_at = CURRENT_TIMESTAMP
                                 WHERE percentage_id = $4`,
                                [newCash, newInpatient, newRefPay, current.percentage_id]
                            );
                            affectedDoctorIds.add(row.doctor_id);
                            insertedRecords.push({ status: 'updated', ...row });
                        }
                    } else {
                        summary.unchanged++;
                        // In real run, we might just ignore, or maybe ensuring 'Active' status is useful?
                        // For now, treat as no-op.
                    }
                } else {
                    summary.to_insert++;
                    if (dry_run) {
                        summary.details.push({ row: i + 1, status: 'Insert', data: { doctor: row.doctor_id, service: serviceType, cash: newCash, inpatient: newInpatient } });
                    } else {
                        const result = await client.query(
                            `INSERT INTO referral_doctor_service_percentage_module (
                                referral_doctor_id, service_type, cash_percentage,
                                inpatient_percentage, referral_pay, status
                            ) VALUES ($1, $2, $3, $4, $5, $6)
                            RETURNING *`,
                            [row.doctor_id, serviceType, newCash, newInpatient, newRefPay, 'Active']
                        );
                        affectedDoctorIds.add(row.doctor_id);
                        insertedRecords.push({ status: 'inserted', ...result.rows[0] });
                    }
                }

            } catch (rowError) {
                console.error(`Row ${i + 1} error:`, rowError);
                summary.errors++;
                summary.details.push({ row: i + 1, error: rowError.message });
            }
        }

        if (dry_run) {
            return res.status(200).json({
                success: true,
                dry_run: true,
                summary: summary
            });
        }

        // Commit Changes
        if (affectedDoctorIds.size > 0) {
            const doctorIds = Array.from(affectedDoctorIds);
            await client.query(
                `UPDATE referral_doctor_module d
                 SET status = CASE 
                    WHEN (
                        SELECT COUNT(*) 
                        FROM referral_doctor_service_percentage_module s 
                        WHERE s.referral_doctor_id = d.id 
                          AND s.status = 'Active'
                          AND s.referral_pay = 'Y' 
                          AND (s.cash_percentage > 0 OR s.inpatient_percentage > 0)
                    ) > 0 THEN 'Active'
                    ELSE 'Inactive'
                 END,
                 updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
                 WHERE id = ANY($1)`,
                [doctorIds]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            dry_run: false,
            message: `Imported ${insertedRecords.length} records (${summary.to_update} updated, ${summary.to_insert} inserted, ${summary.unchanged} unchanged)`,
            data: {
                inserted: insertedRecords.length,
                stats: summary
            }
        });

    } catch (error) {
        if (client && !req.body.dry_run) await client.query('ROLLBACK');
        console.error('Import CSV error:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (client) client.release();
    }
};

// Keep existing functions...
// (savePaymentRecord, getPaymentHistory, updatePaymentStatus, etc.)
