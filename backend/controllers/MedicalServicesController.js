const db = require('../config/db');
const MedicalService = require('../models/MedicalService');
const ExcelService = require('../services/ExcelService');

class MedicalServicesController {
    /**
     * Get all services with pagination and filtering
     * GET /api/medical-services?category=&search=&page=1&limit=50
     */
    async getAllServices(req, res) {
        try {
            const { category, search, page = 1, limit = 50 } = req.query;
            const offset = (page - 1) * limit;

            let whereClause = 'WHERE is_active = true';
            const params = [];
            let paramIndex = 1;

            if (category && category !== 'all') {
                whereClause += ` AND category = $${paramIndex}`;
                params.push(category);
                paramIndex++;
            }

            if (search) {
                whereClause += ` AND service_name ILIKE $${paramIndex}`;
                params.push(`%${search}%`);
                paramIndex++;
            }

            // Get total count
            const countQuery = `SELECT COUNT(*) FROM medical_services ${whereClause}`;
            const countResult = await db.query(countQuery, params);
            const total = parseInt(countResult.rows[0].count);

            // Get paginated results
            const dataQuery = `
                SELECT service_id, service_name, service_code, category
                FROM medical_services
                ${whereClause}
                ORDER BY service_name ASC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;
            const dataResult = await db.query(dataQuery, [...params, limit, offset]);

            res.json({
                services: dataResult.rows,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Error fetching services:', error);
            res.status(500).json({ message: 'Failed to fetch services' });
        }
    }

    /**
     * Get all service categories
     * GET /api/medical-services/categories
     */
    async getCategories(req, res) {
        try {
            const query = `
                SELECT DISTINCT category
                FROM medical_services
                WHERE is_active = true AND category IS NOT NULL
                ORDER BY category ASC
            `;
            const result = await db.query(query);
            res.json({ categories: result.rows.map(r => r.category) });
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({ message: 'Failed to fetch categories' });
        }
    }

    /**
     * Get services assigned to a hospital
     * GET /api/medical-services/hospital/:hospitalId
     */
    async getHospitalServices(req, res) {
        try {
            const { hospitalId } = req.params;

            const query = `
                SELECT ms.service_id, ms.service_name, ms.service_code, ms.category
                FROM hospital_medical_services hms
                JOIN medical_services ms ON hms.service_id = ms.service_id
                WHERE hms.hospital_id = $1 AND hms.is_active = true
                ORDER BY ms.service_name ASC
            `;
            const result = await db.query(query, [hospitalId]);
            res.json({ services: result.rows });
        } catch (error) {
            console.error('Error fetching hospital services:', error);
            res.status(500).json({ message: 'Failed to fetch hospital services' });
        }
    }

    /**
     * Get services assigned to a branch
     * GET /api/medical-services/branch/:branchId
     */
    async getBranchServices(req, res) {
        try {
            const { branchId } = req.params;

            const query = `
                SELECT ms.service_id, ms.service_name, ms.service_code, ms.category
                FROM branch_medical_services bms
                JOIN medical_services ms ON bms.service_id = ms.service_id
                WHERE bms.branch_id = $1 AND bms.is_active = true
                ORDER BY ms.service_name ASC
            `;
            const result = await db.query(query, [branchId]);
            res.json({ services: result.rows });
        } catch (error) {
            console.error('Error fetching branch services:', error);
            res.status(500).json({ message: 'Failed to fetch branch services' });
        }
    }

    /**
     * Bulk assign services to a hospital
     * POST /api/medical-services/hospital/:hospitalId/assign
     * Body: { serviceIds: [1, 2, 3] }
     */
    async assignHospitalServices(req, res) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            const { hospitalId } = req.params;
            const { serviceIds } = req.body;

            if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
                return res.status(400).json({ message: 'serviceIds array is required' });
            }

            // Delete existing assignments
            await client.query('DELETE FROM hospital_medical_services WHERE hospital_id = $1', [hospitalId]);

            // Insert new assignments
            for (const serviceId of serviceIds) {
                await client.query(`
                    INSERT INTO hospital_medical_services (hospital_id, service_id, is_active, created_by, updated_by, created_at, updated_at)
                    VALUES ($1, $2, true, $3, $3, NOW(), NOW())
                    ON CONFLICT (hospital_id, service_id) DO NOTHING
                `, [hospitalId, serviceId, req.user ? req.user.id : null]);
            }

            await client.query('COMMIT');
            res.json({ message: 'Services assigned successfully', count: serviceIds.length });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error assigning hospital services:', error);
            res.status(500).json({ message: 'Failed to assign services' });
        } finally {
            client.release();
        }
    }

    /**
     * Bulk assign services to a branch
     * POST /api/medical-services/branch/:branchId/assign
     * Body: { serviceIds: [1, 2, 3] }
     */
    async assignBranchServices(req, res) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            const { branchId } = req.params;
            const { serviceIds } = req.body;

            if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
                return res.status(400).json({ message: 'serviceIds array is required' });
            }

            // Delete existing assignments
            await client.query('DELETE FROM branch_medical_services WHERE branch_id = $1', [branchId]);

            // Insert new assignments
            for (const serviceId of serviceIds) {
                await client.query(`
                    INSERT INTO branch_medical_services (branch_id, service_id, is_active, created_by, updated_by, created_at, updated_at)
                    VALUES ($1, $2, true, $3, $3, NOW(), NOW())
                    ON CONFLICT (branch_id, service_id) DO NOTHING
                `, [branchId, serviceId, req.user ? req.user.id : null]);
            }

            await client.query('COMMIT');
            res.json({ message: 'Services assigned successfully', count: serviceIds.length });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error assigning branch services:', error);
            res.status(500).json({ message: 'Failed to assign services' });
        } finally {
            client.release();
        }
    }

    /**
     * Download Excel file with all services for a branch
     * GET /api/medical-services/branch/:branchId/excel-download
     */
    async downloadBranchServicesExcel(req, res) {
        try {
            const { branchId } = req.params;

            // Get all active medical services
            const allServicesQuery = `
                SELECT service_id, service_name, service_code, category
                FROM medical_services
                WHERE is_active = true
                ORDER BY category ASC, service_name ASC
            `;
            const allServicesResult = await db.query(allServicesQuery);

            // Get currently assigned services for this branch
            const assignedServicesQuery = `
                SELECT service_id
                FROM branch_medical_services
                WHERE branch_id = $1 AND is_active = true
            `;
            const assignedServicesResult = await db.query(assignedServicesQuery, [branchId]);
            const assignedServiceIds = assignedServicesResult.rows.map(r => r.service_id);

            // Generate Excel file
            const excelBuffer = ExcelService.generateServicesExcel(
                allServicesResult.rows,
                assignedServiceIds
            );

            // Send file
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=medical-services-branch-${branchId}.xlsx`);
            res.send(excelBuffer);
        } catch (error) {
            console.error('Error generating Excel file:', error);
            res.status(500).json({ message: 'Failed to generate Excel file' });
        }
    }

    /**
     * Upload Excel file to assign services to a branch
     * POST /api/medical-services/branch/:branchId/excel-upload
     */
    async uploadBranchServicesExcel(req, res) {
        try {
            const { branchId } = req.params;

            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            // Parse Excel file
            const parseResult = ExcelService.parseServicesExcel(req.file.buffer);

            if (parseResult.errors.length > 0) {
                return res.status(400).json({
                    message: 'Excel file contains errors',
                    errors: parseResult.errors
                });
            }

            // Get all valid service IDs from medical_services
            const allServicesQuery = `
                SELECT service_id, service_name, category
                FROM medical_services
                WHERE is_active = true
            `;
            const allServicesResult = await db.query(allServicesQuery);
            const validServiceIds = new Set(allServicesResult.rows.map(s => s.service_id));

            // Separate existing master services from new custom services
            const masterServiceIds = [];
            const newCustomServices = [];

            parseResult.serviceDetails.forEach(service => {
                if (service.service_id && validServiceIds.has(service.service_id)) {
                    // This service exists in master list
                    masterServiceIds.push(service.service_id);
                } else if (service.service_name) {
                    // This is a new custom service (no valid service_id or blank)
                    newCustomServices.push(service);
                }
            });

            // Use transaction for both operations
            const client = await db.getClient();
            try {
                await client.query('BEGIN');

                const userId = req.user ? req.user.id : null;

                // First, deactivate all existing assignments for this branch
                await client.query(
                    'UPDATE branch_medical_services SET is_active = false, updated_at = NOW() WHERE branch_id = $1',
                    [branchId]
                );

                // Insert or update master services (existing behavior)
                for (const serviceId of masterServiceIds) {
                    await client.query(`
                        INSERT INTO branch_medical_services (branch_id, service_id, is_active, created_by, updated_by, created_at, updated_at)
                        VALUES ($1, $2, true, $3, $3, NOW(), NOW())
                        ON CONFLICT (branch_id, service_id)
                        DO UPDATE SET is_active = true, updated_by = $3, updated_at = NOW()
                    `, [branchId, serviceId, userId]);
                }

                // Create new custom services in billing_setup_master
                let customServicesCreated = 0;
                for (const service of newCustomServices) {
                    // Check if this custom service already exists in billing_setup_master
                    const existingCustom = await client.query(`
                        SELECT billing_setup_id 
                        FROM billing_setup_master 
                        WHERE branch_id = $1 
                        AND service_name = $2 
                        AND type_of_service = $3
                    `, [branchId, service.service_name, service.category]);

                    if (existingCustom.rows.length === 0) {
                        // Create new custom service with default pricing (0.00)
                        await client.query(`
                            INSERT INTO billing_setup_master 
                            (branch_id, service_name, type_of_service, patient_charge, b2b_charge, special_charge, created_at, updated_at, created_by, updated_by)
                            VALUES ($1, $2, $3, 0.00, 0.00, 0.00, NOW(), NOW(), $4, $4)
                        `, [branchId, service.service_name, service.category, userId]);
                        customServicesCreated++;
                    }
                }

                await client.query('COMMIT');

                const response = {
                    message: 'Services imported successfully from Excel',
                    masterServicesEnabled: masterServiceIds.length
                };

                if (customServicesCreated > 0) {
                    response.customServicesCreated = customServicesCreated;
                    response.message += `. ${customServicesCreated} new custom service(s) created in Billing Setup`;
                }

                res.json(response);
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error uploading Excel file:', error);
            res.status(500).json({ message: 'Failed to process Excel file' });
        }
    }

    /**
     * Download Excel file with all services for a hospital
     * GET /api/medical-services/hospital/:hospitalId/excel-download
     */
    async downloadHospitalServicesExcel(req, res) {
        try {
            const { hospitalId } = req.params;

            // Get all active medical services
            const allServicesQuery = `
                SELECT service_id, service_name, service_code, category
                FROM medical_services
                WHERE is_active = true
                ORDER BY category ASC, service_name ASC
            `;
            const allServicesResult = await db.query(allServicesQuery);

            // Get currently assigned services for this hospital
            const assignedServicesQuery = `
                SELECT service_id
                FROM hospital_medical_services
                WHERE hospital_id = $1 AND is_active = true
            `;
            const assignedServicesResult = await db.query(assignedServicesQuery, [hospitalId]);
            const assignedServiceIds = assignedServicesResult.rows.map(r => r.service_id);

            // Generate Excel file
            const excelBuffer = ExcelService.generateServicesExcel(
                allServicesResult.rows,
                assignedServiceIds
            );

            // Send file
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=medical-services-hospital-${hospitalId}.xlsx`);
            res.send(excelBuffer);
        } catch (error) {
            console.error('Error generating Excel file:', error);
            res.status(500).json({ message: 'Failed to generate Excel file' });
        }
    }

    /**
     * Upload Excel file to assign services to a hospital
     * POST /api/medical-services/hospital/:hospitalId/excel-upload
     */
    async uploadHospitalServicesExcel(req, res) {
        try {
            const { hospitalId } = req.params;

            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            // Parse Excel file
            const parseResult = ExcelService.parseServicesExcel(req.file.buffer);

            if (parseResult.errors.length > 0) {
                return res.status(400).json({
                    message: 'Excel file contains errors',
                    errors: parseResult.errors
                });
            }

            // Get all valid service IDs from medical_services
            const allServicesQuery = `
                SELECT service_id, service_name, category
                FROM medical_services
                WHERE is_active = true
            `;
            const allServicesResult = await db.query(allServicesQuery);
            const validServiceIds = new Set(allServicesResult.rows.map(s => s.service_id));

            // Separate existing master services from new custom services
            const masterServiceIds = [];
            const newCustomServices = [];

            parseResult.serviceDetails.forEach(service => {
                if (service.service_id && validServiceIds.has(service.service_id)) {
                    // This service exists in master list
                    masterServiceIds.push(service.service_id);
                } else if (service.service_name) {
                    // This is a new custom service (no valid service_id or blank)
                    newCustomServices.push(service);
                }
            });

            // Use transaction for both operations
            const client = await db.getClient();
            try {
                await client.query('BEGIN');

                const userId = req.user ? req.user.id : null;

                // First, deactivate all existing assignments for this hospital
                await client.query(
                    'UPDATE hospital_medical_services SET is_active = false, updated_at = NOW() WHERE hospital_id = $1',
                    [hospitalId]
                );

                // Insert or update master services (existing behavior)
                for (const serviceId of masterServiceIds) {
                    await client.query(`
                        INSERT INTO hospital_medical_services (hospital_id, service_id, is_active, created_by, updated_by, created_at, updated_at)
                        VALUES ($1, $2, true, $3, $3, NOW(), NOW())
                        ON CONFLICT (hospital_id, service_id)
                        DO UPDATE SET is_active = true, updated_by = $3, updated_at = NOW()
                    `, [hospitalId, serviceId, userId]);
                }

                // Note: For hospitals, we don't create custom services in billing_setup_master
                // because billing_setup is branch-specific. Custom services from hospital Excel
                // would need to be added manually to each branch's billing setup.
                let customServicesSkipped = newCustomServices.length;

                await client.query('COMMIT');

                const response = {
                    message: 'Services imported successfully from Excel',
                    masterServicesEnabled: masterServiceIds.length
                };

                if (customServicesSkipped > 0) {
                    response.customServicesSkipped = customServicesSkipped;
                    response.note = `${customServicesSkipped} new service(s) were skipped. Custom services must be added at the branch level via Billing Setup.`;
                }

                res.json(response);
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error uploading Excel file:', error);
            res.status(500).json({ message: 'Failed to process Excel file' });
        }
    }
}

module.exports = new MedicalServicesController();
