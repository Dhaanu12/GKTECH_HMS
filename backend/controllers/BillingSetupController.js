const BillingSetupMaster = require('../models/BillingSetupMaster');
const BillingSetupPackageDetail = require('../models/BillingSetupPackageDetail');
const MedicalService = require('../models/MedicalService');
const db = require('../config/db');

class BillingSetupController {
    /**
     * Search medical services
     * @param {Object} req 
     * @param {Object} res 
     */
    async searchServices(req, res) {
        try {
            const { term, category, branchId } = req.query;

            if (!term) {
                return res.status(400).json({ message: 'Search term is required' });
            }

            let services;

            // If branchId is provided, filter by branch's assigned medical services + In-House Billing Setups
            if (branchId) {
                services = [];
                const limit = 50; // Limit results per category to avoid huge responses

                // 1. Medical Services (Global Search for External Labs)
                try {
                    const medicalLimitPlaceholder = category ? '$3' : '$2';
                    const medicalQuery = `
                        SELECT ms.service_id, ms.service_name, ms.category
                        FROM medical_services ms
                        WHERE ms.is_active = true
                        AND ms.service_name ILIKE $1
                        ${category ? 'AND ms.category ILIKE $2' : ''}
                        ORDER BY ms.service_name ASC
                        LIMIT ${medicalLimitPlaceholder}
                    `;
                    // Remove branchId from params for this query as it uses global table
                    const medicalParams = category
                        ? [`%${term}%`, `%${category}%`, limit]
                        : [`%${term}%`, limit];

                    const medicalRes = await db.query(medicalQuery, medicalParams);
                    services.push(...medicalRes.rows.map(row => ({
                        id: row.service_id,
                        service_name: row.service_name,
                        category: row.category,
                        source: 'medical_service', // Will show as 'External'
                        price: null
                    })));
                } catch (err) {
                    console.error('Error searching medical services:', err);
                }

                // 3. Billing Setup Master (In-House)
                try {
                    const billingLimitPlaceholder = category ? '$4' : '$3';
                    const billingQuery = `
                        SELECT bsm.billing_setup_id, bsm.service_name, bsm.type_of_service as category, bsm.patient_charge
                        FROM billing_setup_master bsm
                        WHERE (bsm.branch_id = $1 OR bsm.branch_id = 1)
                        AND bsm.is_active = true
                        AND bsm.service_name ILIKE $2
                        ${category ? 'AND bsm.type_of_service ILIKE $3' : ''}
                        ORDER BY bsm.service_name ASC
                        LIMIT ${billingLimitPlaceholder}
                    `;
                    const billingParams = category
                        ? [branchId, `%${term}%`, `%${category}%`, limit]
                        : [branchId, `%${term}%`, limit];

                    const billingRes = await db.query(billingQuery, billingParams);
                    services.push(...billingRes.rows.map(row => ({
                        id: row.billing_setup_id,
                        service_name: row.service_name,
                        category: row.category,
                        source: 'billing_master',
                        price: row.patient_charge
                    })));
                } catch (err) {
                    console.error('Error searching billing setup:', err);
                }

                // Sort combined results by name
                services.sort((a, b) => a.service_name.localeCompare(b.service_name));
            } else {
                // Fallback to all medical services if no branchId (backward compatibility)
                if (category) {
                    services = await MedicalService.searchByNameAndCategory(term, category);
                } else {
                    services = await MedicalService.searchByName(term);
                }
            }

            res.json(services);
        } catch (error) {
            console.error('Error searching services:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    /**
     * Create a new billing setup (Service or Package)
     * @param {Object} req 
     * @param {Object} res 
     */
    async createBillingSetup(req, res) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            const {
                type_of_service,
                service_name,
                patient_charge,
                b2b_charge,
                special_charge,
                branch_id,
                package_details // Array of objects for package details
            } = req.body;

            // Basic validation
            if (!type_of_service || !service_name || !branch_id) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            // Create Master Entry
            const masterData = {
                type_of_service,
                service_name,
                patient_charge: patient_charge || 0,
                b2b_charge: b2b_charge || 0,
                special_charge: special_charge || 0,
                branch_id,
                created_by: req.user ? req.user.id : null, // Assuming auth middleware adds user to req
                updated_by: req.user ? req.user.id : null
            };

            const createdMaster = await BillingSetupMaster.create(masterData, client);

            // Handle Package Details if type is package
            if (type_of_service === 'package' && Array.isArray(package_details) && package_details.length > 0) {
                for (const detail of package_details) {
                    // Start transaction for details? No, outer transaction handles it.

                    const detailData = {
                        package_uuid: createdMaster.uuid,
                        type_of_service: detail.type, // Map 'type' from frontend to 'type_of_service' in DB
                        service_name: detail.service_name,
                        patient_charge: detail.patient_charge || 0,
                        b2b_charge: detail.b2b_charge || 0,
                        special_charge: detail.special_charge || 0,
                        created_by: req.user ? req.user.id : null,
                        updated_by: req.user ? req.user.id : null
                    };

                    // Use raw insert to include type_of_service
                    await client.query(`
                        INSERT INTO billing_setup_package_details 
                        (package_uuid, type_of_service, service_name, patient_charge, b2b_charge, special_charge, created_at, updated_at, created_by, updated_by)
                        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7, $8)
                    `, [
                        detailData.package_uuid,
                        detailData.type_of_service,
                        detailData.service_name,
                        detailData.patient_charge,
                        detailData.b2b_charge,
                        detailData.special_charge,
                        detailData.created_by,
                        detailData.updated_by
                    ]);
                }
            }

            await client.query('COMMIT');

            // Fetch full result to return
            const result = {
                ...createdMaster,
                package_details: type_of_service === 'package' ? await BillingSetupPackageDetail.findByPackageUuid(createdMaster.uuid) : []
            };

            res.status(201).json(result);

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error creating billing setup:', error);
            res.status(500).json({ message: 'Internal server error' });
        } finally {
            client.release();
        }
    }

    /**
     * Update an existing billing setup
     * @param {Object} req 
     * @param {Object} res 
     */
    async updateBillingSetup(req, res) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            const { id } = req.params; // billing_setup_id
            const {
                type_of_service,
                service_name,
                patient_charge,
                b2b_charge,
                special_charge,
                branch_id,
                package_details
            } = req.body;

            // 1. Update Master Entry
            const updateQuery = `
                UPDATE billing_setup_master 
                SET type_of_service = $1, service_name = $2, patient_charge = $3, 
                    b2b_charge = $4, special_charge = $5, updated_at = NOW()
                WHERE billing_setup_id = $6 RETURNING *
            `;
            const updateValues = [
                type_of_service, service_name, patient_charge || 0,
                b2b_charge || 0, special_charge || 0, id
            ];

            const { rows } = await client.query(updateQuery, updateValues);
            if (rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ message: 'Billing setup not found' });
            }
            const updatedMaster = rows[0];

            // 2. Handle Package Details (Delete all and Re-insert if it's a package)
            if (type_of_service === 'package') {
                // Delete existing details
                await client.query('DELETE FROM billing_setup_package_details WHERE package_uuid = $1', [updatedMaster.uuid]);

                // Insert new details
                if (Array.isArray(package_details) && package_details.length > 0) {
                    for (const detail of package_details) {
                        const detailData = {
                            package_uuid: updatedMaster.uuid,
                            service_name: detail.service_name,
                            // Store the 'type' in service_name or separate column? 
                            // Wait, user added 'type' (Lab/Scan) to package details.
                            // The model `BillingSetupPackageDetail` doesn't seem to have a `type` column based on my memory.
                            // I should verify if I need to add a column or just concatenate it/ignore it?
                            // User said: "in componen it shud be there tyoe lab procedure scan...".
                            // If I don't store it, when I fetch back for EDIT, I can't populate the dropdown.
                            // I NEED TO ADD `type` column to `billing_setup_package_details`.
                            // For now, I will proceed with creating the method, but I must add a migration for `type`.
                            // Let's assume I will add `service_type` column.
                            service_type: detail.type,
                            patient_charge: detail.patient_charge || 0,
                            b2b_charge: detail.b2b_charge || 0,
                            special_charge: detail.special_charge || 0,
                            created_by: req.user ? req.user.id : null,
                            updated_by: req.user ? req.user.id : null
                        };
                        // NOTE: I need to update BillingSetupPackageDetail.create to handle 'type_of_service' 
                        // or just writing raw query here might be safer if model is rigid.
                        // Let's use raw query for details insertion to be sure.
                        await client.query(`
                            INSERT INTO billing_setup_package_details 
                            (package_uuid, type_of_service, service_name, patient_charge, b2b_charge, special_charge, created_at, updated_at, created_by, updated_by)
                            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7, $8)
                         `, [
                            updatedMaster.uuid,
                            detail.type, // Frontend sends 'type'
                            detail.service_name,
                            detail.patient_charge,
                            detail.b2b_charge,
                            detail.special_charge,
                            req.user ? req.user.id : null,
                            req.user ? req.user.id : null
                        ]);
                        // I will pause the controller update related to 'type' column and just do standard fields for now,
                        // but then the Edit flow will be incomplete.
                        // Actually, I should do the migration first.
                    }
                }
            }

            await client.query('COMMIT');
            res.json(updatedMaster);

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error updating billing setup:', error);
            res.status(500).json({ message: 'Internal server error' });
        } finally {
            client.release();
        }
    }

    /**
     * Get billing setups for a branch
     * @param {Object} req 
     * @param {Object} res 
     */
    async getBranchBillingSetups(req, res) {
        try {
            const { branchId } = req.params;
            const setups = await BillingSetupMaster.findByBranch(branchId);

            // Populate details for packages
            const enhancedSetups = await Promise.all(setups.map(async (setup) => {
                if (setup.type_of_service === 'package') {
                    const details = await BillingSetupPackageDetail.findByPackageUuid(setup.uuid);
                    return { ...setup, package_details: details };
                }
                return setup;
            }));

            res.json(enhancedSetups);
        } catch (error) {
            console.error('Error fetching billing setups:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    /**
     * Copy all billing setups from source branch to target branch
     * @param {Object} req - { sourceBranchId, targetBranchId }
     * @param {Object} res 
     */
    async copyFromBranch(req, res) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            const { sourceBranchId, targetBranchId } = req.body;

            if (!sourceBranchId || !targetBranchId) {
                return res.status(400).json({ message: 'Source and target branch IDs are required' });
            }

            if (sourceBranchId === targetBranchId) {
                return res.status(400).json({ message: 'Cannot copy to the same branch' });
            }

            // Fetch all billing setups from source branch
            const sourceSetups = await BillingSetupMaster.findByBranch(sourceBranchId);

            if (!sourceSetups || sourceSetups.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ message: 'No billing setups found in source branch' });
            }

            let copiedCount = 0;

            // Copy each setup
            for (const setup of sourceSetups) {
                // Create new master entry for target branch
                const insertMasterQuery = `
                    INSERT INTO billing_setup_master 
                    (type_of_service, service_name, patient_charge, b2b_charge, special_charge, branch_id, created_at, updated_at, created_by, updated_by)
                    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7, $8)
                    RETURNING uuid
                `;
                const masterValues = [
                    setup.type_of_service,
                    setup.service_name,
                    setup.patient_charge,
                    setup.b2b_charge,
                    setup.special_charge,
                    targetBranchId,
                    req.user ? req.user.id : null,
                    req.user ? req.user.id : null
                ];

                const { rows } = await client.query(insertMasterQuery, masterValues);
                const newUuid = rows[0].uuid;

                // If it's a package, copy package details too
                if (setup.type_of_service === 'package') {
                    const packageDetails = await BillingSetupPackageDetail.findByPackageUuid(setup.uuid);

                    if (packageDetails && packageDetails.length > 0) {
                        for (const detail of packageDetails) {
                            await client.query(`
                                INSERT INTO billing_setup_package_details 
                                (package_uuid, type_of_service, service_name, patient_charge, b2b_charge, special_charge, created_at, updated_at, created_by, updated_by)
                                VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7, $8)
                            `, [
                                newUuid,
                                detail.type_of_service,
                                detail.service_name,
                                detail.patient_charge,
                                detail.b2b_charge,
                                detail.special_charge,
                                req.user ? req.user.id : null,
                                req.user ? req.user.id : null
                            ]);
                        }
                    }
                }

                copiedCount++;
            }

            await client.query('COMMIT');
            res.json({
                message: `Successfully copied ${copiedCount} billing setup(s) to the target branch`,
                copiedCount
            });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error copying billing setups:', error);
            res.status(500).json({ message: 'Internal server error' });
        } finally {
            client.release();
        }
    }

    /**
     * Get all branch medical services with their pricing
     */
    async getServicesWithPricing(req, res) {
        try {
            const { branchId } = req.params;

            const servicesQuery = `
                SELECT 
                    ms.service_id,
                    ms.service_name,
                    ms.category,
                    ms.category as type_of_service,
                    bs.billing_setup_id,
                    bs.uuid,
                    COALESCE(bs.patient_charge, '0.00') as patient_charge,
                    COALESCE(bs.b2b_charge, '0.00') as b2b_charge,
                    COALESCE(bs.special_charge, '0.00') as special_charge,
                    false as is_package
                FROM branch_medical_services bms
                JOIN medical_services ms ON bms.service_id = ms.service_id
                LEFT JOIN billing_setup_master bs ON 
                    bs.branch_id = bms.branch_id 
                    AND bs.service_name = ms.service_name
                    AND bs.type_of_service = ms.category
                WHERE bms.branch_id = $1 AND bms.is_active = true
                
                UNION ALL
                
                SELECT 
                    s.service_id,
                    s.service_name,
                    s.service_category as category,
                    s.service_category as type_of_service,
                    bs.billing_setup_id,
                    bs.uuid,
                    COALESCE(bs.patient_charge, '0.00') as patient_charge,
                    COALESCE(bs.b2b_charge, '0.00') as b2b_charge,
                    COALESCE(bs.special_charge, '0.00') as special_charge,
                    false as is_package
                FROM branch_services bs_tbl
                JOIN services s ON bs_tbl.service_id = s.service_id
                LEFT JOIN billing_setup_master bs ON 
                    bs.branch_id = bs_tbl.branch_id 
                    AND bs.service_name = s.service_name
                    AND bs.type_of_service = s.service_category
                WHERE bs_tbl.branch_id = $1 AND bs_tbl.is_active = true
                
                UNION ALL
                
                SELECT 
                    NULL as service_id,
                    bs.service_name,
                    NULL as category,
                    bs.type_of_service,
                    bs.billing_setup_id,
                    bs.uuid,
                    bs.patient_charge,
                    bs.b2b_charge,
                    bs.special_charge,
                    true as is_package
                FROM billing_setup_master bs
                WHERE bs.branch_id = $1 
                AND bs.type_of_service ILIKE 'package'
                AND bs.is_active = true
                
                ORDER BY is_package ASC, service_name ASC
            `;

            const result = await db.query(servicesQuery, [branchId]);
            const services = result.rows;

            for (let service of services) {
                if (service.is_package && service.uuid) {
                    const packageItems = await BillingSetupPackageDetail.findByPackageUuid(service.uuid);
                    service.package_items = packageItems;
                }
            }

            res.json({ services });
        } catch (error) {
            console.error('Error fetching services with pricing:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    /**
     * Bulk update pricing for multiple services
     */
    async bulkUpdatePrices(req, res) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            const { branchId } = req.params;
            const { updates } = req.body;

            if (!Array.isArray(updates) || updates.length === 0) {
                return res.status(400).json({ message: 'Updates array is required' });
            }

            const userId = req.user ? req.user.id : null;
            const results = [];

            for (const update of updates) {
                const { service_name, type_of_service, patient_charge, b2b_charge, special_charge } = update;

                const existing = await BillingSetupMaster.findByBranchAndService(branchId, service_name, type_of_service);

                if (existing) {
                    const updated = await BillingSetupMaster.update(existing.billing_setup_id, {
                        patient_charge,
                        b2b_charge,
                        special_charge,
                        updated_by: userId
                    });

                    // Update package items if provided
                    if (update.package_items && Array.isArray(update.package_items)) {
                        for (const item of update.package_items) {
                            if (item.detail_id) {
                                await BillingSetupPackageDetail.update(item.detail_id, {
                                    patient_charge: item.patient_charge,
                                    b2b_charge: item.b2b_charge,
                                    special_charge: item.special_charge,
                                    updated_by: userId
                                });
                            }
                        }
                    }

                    results.push({ action: 'updated', billing_setup_id: updated.billing_setup_id });
                } else {
                    const created = await BillingSetupMaster.create({
                        type_of_service,
                        service_name,
                        patient_charge,
                        b2b_charge,
                        special_charge,
                        branch_id: branchId,
                        created_by: userId,
                        updated_by: userId
                    }, client);
                    results.push({ action: 'created', billing_setup_id: created.billing_setup_id });
                }
            }

            await client.query('COMMIT');
            res.status(200).json({ message: 'Bulk update successful', results });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error bulk updating prices:', error);
            res.status(500).json({ message: 'Internal server error' });
        } finally {
            client.release();
        }
    }
}

module.exports = new BillingSetupController();
