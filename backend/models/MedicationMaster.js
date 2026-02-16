const BaseModel = require('./BaseModel');

class MedicationMaster extends BaseModel {
    constructor() {
        super('medication_master', 'id');
    }

    async findByHospital(hospitalId, { branchId, search, page = 1, limit = 20, onlySelected = false }) {
        const offset = (page - 1) * limit;
        const searchPattern = search ? `%${search}%` : null;

        let whereClause = `(m.is_global = true OR m.hospital_id = $1)`;
        const params = [hospitalId];
        let paramIndex = 2;

        if (search) {
            whereClause += ` AND (m.medicine_name ILIKE $${paramIndex} OR m.generic_name ILIKE $${paramIndex})`;
            params.push(searchPattern);
            paramIndex++;
        }

        // Main Query
        // We join with branch_medications first to use it in WHERE if needed
        let query = `
            SELECT 
                m.id,
                m.medicine_name,
                m.generic_name,
                m.strength,
                m.dosage_form,
                m.prescription_required,
                m.is_global,
                m.hospital_id,
                mm.name as manufacturer_name,
                CASE WHEN bm.id IS NOT NULL THEN true ELSE false END as "isSelected"
            FROM medication_master m
            LEFT JOIN medication_manufacturers mm ON m.manufacturer_id = mm.id
            LEFT JOIN branch_medications bm ON m.id = bm.medication_id AND bm.branch_id = $${paramIndex} AND bm.is_active = true
        `;

        if (onlySelected) {
            whereClause += ` AND bm.id IS NOT NULL`;
        }

        query += `
            WHERE ${whereClause}
            ORDER BY "isSelected" DESC, m.medicine_name ASC
            LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}
        `;

        // Count Query
        const countQuery = `
            SELECT COUNT(*) 
            FROM medication_master m
            LEFT JOIN branch_medications bm ON m.id = bm.medication_id AND bm.branch_id = $${paramIndex} AND bm.is_active = true
            WHERE ${whereClause}
        `;

        params.push(branchId, limit, offset);

        const result = await this.executeQuery(query, params);

        // Count params (same as main but limit/offset are not used in count, and paramIndex order matters)
        // We reused paramIndex for branchId in main query. 
        // Let's reconstruct params for count query carefully.
        // Params for main: [hospitalId, search?, branchId, limit, offset]

        // Params for count: [hospitalId, search?, branchId]
        const countParams = [hospitalId];
        if (search) countParams.push(searchPattern);
        countParams.push(branchId);

        const countResult = await this.executeQuery(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        return {
            data: result.rows,
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async findByNameAndStrength(name, strength, hospitalId) {
        // Return first match, useful for basic checks but strict checks need manufacturer
        const query = `
            SELECT m.*, mm.name as manufacturer_name 
            FROM medication_master m
            LEFT JOIN medication_manufacturers mm ON m.manufacturer_id = mm.id
            WHERE m.medicine_name ILIKE $1 
            AND m.strength ILIKE $2
            AND (m.is_global = true OR m.hospital_id = $3)
        `;
        const result = await this.executeQuery(query, [name, strength, hospitalId || null]);
        return result.rows[0];
    }

    async findExactDuplicate(name, strength, manufacturerId, hospitalId) {
        const query = `
            SELECT id FROM medication_master 
            WHERE medicine_name ILIKE $1 
            AND strength ILIKE $2
            AND manufacturer_id = $3
            AND (is_global = true OR hospital_id = $4)
        `;
        const result = await this.executeQuery(query, [name, strength, manufacturerId, hospitalId || null]);
        return result.rows[0];
    }
}

module.exports = new MedicationMaster();
