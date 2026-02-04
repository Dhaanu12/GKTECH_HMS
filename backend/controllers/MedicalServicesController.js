const db = require('../config/db');
const MedicalService = require('../models/MedicalService');

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
}

module.exports = new MedicalServicesController();
