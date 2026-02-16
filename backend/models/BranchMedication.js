const BaseModel = require('./BaseModel');

class BranchMedication extends BaseModel {
    constructor() {
        super('branch_medications', 'id');
    }

    async findByBranch(branchId) {
        const query = `
            SELECT bm.*, mm.*
            FROM branch_medications bm
            JOIN medication_master mm ON bm.medication_id = mm.id
            WHERE bm.branch_id = $1 AND bm.is_active = true
            ORDER BY mm.medicine_name ASC
        `;
        const result = await this.executeQuery(query, [branchId]);
        return result.rows;
    }

    async findByBranchAndMedication(branchId, medicationId) {
        return await this.findOne({ branch_id: branchId, medication_id: medicationId });
    }

    async toggleMedication(branchId, medicationId, isActive) {
        const existing = await this.findByBranchAndMedication(branchId, medicationId);

        if (existing) {
            return await this.update(existing.id, { is_active: isActive });
        } else {
            return await this.create({
                branch_id: branchId,
                medication_id: medicationId,
                is_active: isActive
            });
        }
    }
}

module.exports = new BranchMedication();
