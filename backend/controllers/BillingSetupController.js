const BillingSetupMaster = require('../models/BillingSetupMaster');
const BillingSetupPackageDetail = require('../models/BillingSetupPackageDetail');
const MedicalService = require('../models/MedicalService');
const db = require('../config/db');
const ExcelService = require('../services/ExcelService');

class BillingSetupController {
    /**
     * Search medical services from both In-House and External sources
     * @param {Object} req 
     * @param {Object} res 
     */
    async searchServices(req, res) {
        try {
            const { term, category, branchId } = req.query;
            const cleanedTerm = (term || '').trim();
            console.log(`[Diagnostic] Search Request: term="${cleanedTerm}", category="${category}", branchId="${branchId}"`);

            if (!cleanedTerm) {
                return res.status(400).json({ message: 'Search term is required' });
            }

            let services = [];
            const limit = 50;
            let parsedBranchId = parseInt(branchId);
            const actualBranchId = (!isNaN(parsedBranchId) && branchId !== 'undefined' && branchId !== 'null') ? parsedBranchId : 1;

            // 1. In-House (Billing Master) - Global Search
            try {
                let billingQuery = `
                    SELECT bsm.billing_setup_id as id, bsm.service_name, bsm.type_of_service as category, bsm.patient_charge as price, bsm.branch_id, bsm.is_active
                    FROM billing_setup_master bsm
                    WHERE (bsm.is_active = true OR bsm.is_active IS NULL OR bsm.is_active = false)
                    AND bsm.service_name ILIKE $1
                `;
                const billingParams = [`%${cleanedTerm}%`];

                if (category) {
                    // Use ILIKE for category to be resilient to case/space issues
                    billingQuery += ` AND bsm.type_of_service ILIKE $2`;
                    billingParams.push(category);
                }

                // Order: 0:Current Branch, 1:Global(1), 2:Others
                billingQuery += ` ORDER BY 
                    CASE 
                        WHEN bsm.branch_id = $${billingParams.length + 1} THEN 0 
                        WHEN bsm.branch_id = 1 THEN 1 
                        ELSE 2 
                    END, bsm.service_name ASC LIMIT $${billingParams.length + 2}`;

                billingParams.push(actualBranchId);
                billingParams.push(limit);

                const billingRes = await db.query(billingQuery, billingParams);
                console.log(`[Diagnostic] In-House matches: ${billingRes.rows.length}`);

                services.push(...billingRes.rows.map(row => ({
                    ...row,
                    source: 'billing_setup_master'
                })));
            } catch (err) {
                console.error('[Diagnostic] In-House Search Error:', err);
            }

            // 2. External (Medical Services) - Global Search
            try {
                let medicalQuery = `
                    SELECT ms.service_id as id, ms.service_name, ms.category
                    FROM medical_services ms
                    WHERE (ms.is_active = true OR ms.is_active IS NULL)
                    AND ms.service_name ILIKE $1
                `;
                const medicalParams = [`%${cleanedTerm}%`];

                if (category) {
                    medicalQuery += ` AND ms.category ILIKE $2`;
                    medicalParams.push(category);
                }

                medicalQuery += ` ORDER BY ms.service_name ASC LIMIT $${medicalParams.length + 1}`;
                medicalParams.push(limit);

                const medicalRes = await db.query(medicalQuery, medicalParams);
                console.log(`[Diagnostic] External matches: ${medicalRes.rows.length}`);

                services.push(...medicalRes.rows.map(row => ({
                    ...row,
                    source: 'medical_service',
                    price: null
                })));
            } catch (err) {
                console.error('[Diagnostic] External Search Error:', err);
            }

            // 3. Final Sort: In-House first, then alphabetical
            services.sort((a, b) => {
                const isAInHouse = a.source === 'billing_setup_master';
                const isBInHouse = b.source === 'billing_setup_master';
                if (isAInHouse && !isBInHouse) return -1;
                if (!isAInHouse && isBInHouse) return 1;
                return (a.service_name || '').localeCompare(b.service_name || '');
            });

            res.json(services);
        } catch (error) {
            console.error('[Diagnostic] Fatal search error:', error);
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
                    // Use raw insert to include type_of_service
                    await client.query(`
                        INSERT INTO billing_setup_package_details 
                        (package_uuid, type_of_service, service_name, patient_charge, b2b_charge, special_charge, created_at, updated_at, created_by, updated_by)
                        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7, $8)
                    `, [
                        createdMaster.uuid,
                        detail.type,
                        detail.service_name,
                        detail.patient_charge || 0,
                        detail.b2b_charge || 0,
                        detail.special_charge || 0,
                        req.user ? req.user.id : null,
                        req.user ? req.user.id : null
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
                        await client.query(`
                            INSERT INTO billing_setup_package_details 
                            (package_uuid, type_of_service, service_name, patient_charge, b2b_charge, special_charge, created_at, updated_at, created_by, updated_by)
                            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7, $8)
                         `, [
                            updatedMaster.uuid,
                            detail.type,
                            detail.service_name,
                            detail.patient_charge || 0,
                            detail.b2b_charge || 0,
                            detail.special_charge || 0,
                            req.user ? req.user.id : null,
                            req.user ? req.user.id : null
                        ]);
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
                    bs.type_of_service as category,
                    bs.type_of_service,
                    bs.billing_setup_id,
                    bs.uuid,
                    bs.patient_charge,
                    bs.b2b_charge,
                    bs.special_charge,
                    false as is_package
                FROM billing_setup_master bs
                WHERE bs.branch_id = $1 
                AND bs.type_of_service != 'package'
                AND bs.is_active = true
                AND bs.service_name NOT IN (SELECT service_name FROM medical_services)
                AND bs.service_name NOT IN (SELECT service_name FROM services)
                
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

    /**
     * Download billing configuration as Excel file
     * GET /api/billing-setup/:branchId/excel-download
     */
    async downloadBillingExcel(req, res) {
        try {
            const { branchId } = req.params;

            // Fetch all services with pricing using existing method logic
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
                    bs.type_of_service as category,
                    bs.type_of_service,
                    bs.billing_setup_id,
                    bs.uuid,
                    bs.patient_charge,
                    bs.b2b_charge,
                    bs.special_charge,
                    false as is_package
                FROM billing_setup_master bs
                WHERE bs.branch_id = $1 
                AND bs.type_of_service != 'package'
                AND bs.is_active = true
                AND bs.service_name NOT IN (SELECT service_name FROM medical_services)
                AND bs.service_name NOT IN (SELECT service_name FROM services)
                
                ORDER BY is_package ASC, service_name ASC
            `;

            const result = await db.query(servicesQuery, [branchId]);
            const allData = result.rows;

            // Fetch packages
            const packagesQuery = `
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
                ORDER BY service_name ASC
            `;

            const packagesResult = await db.query(packagesQuery, [branchId]);
            const packages = packagesResult.rows;

            // Generate Excel file
            const excelBuffer = ExcelService.generateBillingExcel(allData, packages);

            // Send file
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=billing-setup-branch-${branchId}.xlsx`);
            res.send(excelBuffer);
        } catch (error) {
            console.error('Error generating billing Excel:', error);
            res.status(500).json({ message: 'Failed to generate Excel file' });
        }
    }

    /**
     * Upload billing configuration Excel file
     * POST /api/billing-setup/:branchId/excel-upload
     */
    async uploadBillingExcel(req, res) {
        const client = await db.getClient();
        try {
            const { branchId } = req.params;

            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            // Parse Excel file
            const parseResult = ExcelService.parseBillingExcel(req.file.buffer);

            if (parseResult.errors.length > 0) {
                return res.status(400).json({
                    message: 'Excel file contains errors',
                    errors: parseResult.errors
                });
            }

            await client.query('BEGIN');

            const userId = req.user ? req.user.id : null;
            let servicesUpdated = 0;
            let packagesUpdated = 0;

            // Update Services
            for (const service of parseResult.services) {
                const { service_name, category, patient_charge, b2b_charge, special_charge } = service;

                // Check if billing setup already exists
                const checkResult = await client.query(`
                    SELECT billing_setup_id 
                    FROM billing_setup_master 
                    WHERE branch_id = $1 
                    AND service_name = $2 
                    AND type_of_service = $3
                `, [branchId, service_name, category]);

                if (checkResult.rows.length > 0) {
                    // Update existing record
                    await client.query(`
                        UPDATE billing_setup_master
                        SET 
                            patient_charge = $1,
                            b2b_charge = $2,
                            special_charge = $3,
                            updated_at = NOW(),
                            updated_by = $4
                        WHERE billing_setup_id = $5
                    `, [patient_charge, b2b_charge, special_charge, userId, checkResult.rows[0].billing_setup_id]);
                } else {
                    // Insert new record
                    await client.query(`
                        INSERT INTO billing_setup_master 
                        (branch_id, service_name, type_of_service, patient_charge, b2b_charge, special_charge, created_at, updated_at, created_by, updated_by)
                        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7, $7)
                    `, [branchId, service_name, category, patient_charge, b2b_charge, special_charge, userId]);
                }

                servicesUpdated++;
            }

            // Update Packages
            for (const pkg of parseResult.packages) {
                const { uuid, patient_charge, b2b_charge, special_charge } = pkg;

                // Update package pricing by UUID
                const updateResult = await client.query(`
                    UPDATE billing_setup_master
                    SET 
                        patient_charge = $1,
                        b2b_charge = $2,
                        special_charge = $3,
                        updated_at = NOW(),
                        updated_by = $4
                    WHERE uuid = $5 AND branch_id = $6
                `, [patient_charge, b2b_charge, special_charge, userId, uuid, branchId]);

                if (updateResult.rowCount > 0) {
                    packagesUpdated++;
                }
            }

            await client.query('COMMIT');

            res.json({
                message: 'Billing configuration imported successfully from Excel',
                servicesUpdated,
                packagesUpdated,
                total: servicesUpdated + packagesUpdated
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error uploading billing Excel:', error);
            res.status(500).json({ message: 'Failed to process Excel file' });
        } finally {
            client.release();
        }
    }
}

module.exports = new BillingSetupController();
