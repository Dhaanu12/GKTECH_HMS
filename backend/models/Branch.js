const BaseModel = require('./BaseModel');

class Branch extends BaseModel {
    constructor() {
        super('branches', 'branch_id');
    }

    /**
     * Get all branches of a hospital
     * @param {Number} hospitalId
     * @returns {Promise<Array>}
     */
    async findByHospital(hospitalId) {
        return await this.findAll({ hospital_id: hospitalId }, { orderBy: 'branch_name ASC' });
    }

    /**
     * Get active branches of a hospital
     * @param {Number} hospitalId
     * @returns {Promise<Array>}
     */
    async findActiveByHospital(hospitalId) {
        return await this.findAll({ hospital_id: hospitalId, is_active: true });
    }

    /**
     * Find branch by code and hospital
     * @param {Number} hospitalId
     * @param {String} branchCode
     * @returns {Promise<Object|null>}
     */
    async findByCode(hospitalId, branchCode) {
        return await this.findOne({ hospital_id: hospitalId, branch_code: branchCode });
    }

    /**
     * Get branches by city
     * @param {String} city
     * @returns {Promise<Array>}
     */
    async findByCity(city) {
        return await this.findAll({ city: city, is_active: true });
    }

    /**
     * Get branches with emergency facilities
     * @param {Number} hospitalId
     * @returns {Promise<Array>}
     */
    async findWithEmergency(hospitalId) {
        return await this.findAll({
            hospital_id: hospitalId,
            emergency_available: true,
            is_active: true
        });
    }
    /**
     * Search branches
     * @param {String} searchTerm
     * @returns {Promise<Array>}
     */
    async search(searchTerm) {
        const query = `
            SELECT b.*, h.hospital_name
            FROM branches b
            JOIN hospitals h ON b.hospital_id = h.hospital_id
            WHERE (
                b.branch_name ILIKE $1 OR
                b.branch_code ILIKE $1 OR
                h.hospital_name ILIKE $1
            )
            ORDER BY b.branch_name ASC
        `;
        const result = await this.executeQuery(query, [`%${searchTerm}%`]);
        return result.rows;
    }
}

module.exports = new Branch();
