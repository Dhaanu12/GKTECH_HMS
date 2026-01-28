const BaseModel = require('./BaseModel');

class BranchService extends BaseModel {
    constructor() {
        super('branch_services', 'branch_service_id');
    }

    /**
     * Get all services in a branch
     * @param {Number} branchId
     * @returns {Promise<Array>}
     */
    async findByBranch(branchId) {
        const query = `
      SELECT bs.*, s.service_name, s.service_code, s.description
      FROM branch_services bs
      LEFT JOIN services s ON bs.service_id = s.service_id
      WHERE bs.branch_id = $1 AND bs.is_active = true
      ORDER BY s.service_name ASC
    `;
        const result = await this.executeQuery(query, [branchId]);
        return result.rows;
    }

    /**
     * Get all branches offering a service
     * @param {Number} serviceId
     * @returns {Promise<Array>}
     */
    async findByService(serviceId) {
        const query = `
      SELECT bs.*, b.branch_name, b.branch_code
      FROM branch_services bs
      LEFT JOIN branches b ON bs.branch_id = b.branch_id
      WHERE bs.service_id = $1 AND bs.is_active = true
      ORDER BY b.branch_name ASC
    `;
        const result = await this.executeQuery(query, [serviceId]);
        return result.rows;
    }
}

module.exports = new BranchService();
