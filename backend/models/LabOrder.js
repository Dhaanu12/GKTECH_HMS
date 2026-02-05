const BaseModel = require('./BaseModel');

/**
 * Lab Order Model
 * Manages lab tests and examinations ordered by doctors
 */
class LabOrder extends BaseModel {
    constructor() {
        super('lab_orders', 'order_id');
    }

    /**
     * Find orders by patient ID
     * @param {number} patientId 
     * @param {Object} options - { includeCompleted: boolean, opdId: number }
     * @returns {Promise<Array>}
     */
    async findByPatient(patientId, options = {}) {
        const values = [patientId];
        let paramCount = 2;

        let query = `
            SELECT lo.*, 
                   p.first_name || ' ' || p.last_name as patient_name,
                   p.mrn_number,
                   d.first_name || ' ' || d.last_name as doctor_name,
                   n.first_name || ' ' || n.last_name as nurse_name,
                   b.branch_name,
                   o.opd_number,
                   o.visit_date as opd_visit_date
            FROM lab_orders lo
            LEFT JOIN patients p ON lo.patient_id = p.patient_id
            LEFT JOIN doctors d ON lo.doctor_id = d.doctor_id
            LEFT JOIN nurses n ON lo.assigned_nurse_id = n.nurse_id
            LEFT JOIN branches b ON lo.branch_id = b.branch_id
            LEFT JOIN opd_entries o ON lo.opd_id = o.opd_id
            WHERE lo.patient_id = $1
        `;
        
        if (!options.includeCompleted) {
            query += ` AND lo.status NOT IN ('Completed', 'Cancelled')`;
        }

        if (options.opdId) {
            query += ` AND lo.opd_id = $${paramCount++}`;
            values.push(options.opdId);
        }
        
        query += ` ORDER BY lo.ordered_at DESC`;
        
        const result = await this.executeQuery(query, values);
        return result.rows;
    }

    /**
     * Find orders by branch ID with filters
     * @param {number} branchId 
     * @param {Object} filters - { status, priority, category, date, nurseId }
     * @returns {Promise<Array>}
     */
    async findByBranch(branchId, filters = {}) {
        const values = [branchId];
        let paramCount = 2;
        
        let query = `
            SELECT lo.*, 
                   p.first_name || ' ' || p.last_name as patient_name,
                   p.mrn_number,
                   p.contact_number as patient_phone,
                   d.first_name || ' ' || d.last_name as doctor_name,
                   n.first_name || ' ' || n.last_name as nurse_name,
                   b.branch_name
            FROM lab_orders lo
            LEFT JOIN patients p ON lo.patient_id = p.patient_id
            LEFT JOIN doctors d ON lo.doctor_id = d.doctor_id
            LEFT JOIN nurses n ON lo.assigned_nurse_id = n.nurse_id
            LEFT JOIN branches b ON lo.branch_id = b.branch_id
            WHERE lo.branch_id = $1
        `;
        
        if (filters.status) {
            query += ` AND lo.status = $${paramCount++}`;
            values.push(filters.status);
        }
        
        if (filters.priority) {
            query += ` AND lo.priority = $${paramCount++}`;
            values.push(filters.priority);
        }
        
        if (filters.category) {
            query += ` AND lo.test_category = $${paramCount++}`;
            values.push(filters.category);
        }
        
        if (filters.date) {
            query += ` AND DATE(lo.ordered_at) = $${paramCount++}`;
            values.push(filters.date);
        }
        
        if (filters.nurseId) {
            query += ` AND lo.assigned_nurse_id = $${paramCount++}`;
            values.push(filters.nurseId);
        }
        
        // Default: exclude completed unless specifically requested
        if (!filters.includeCompleted && !filters.status) {
            query += ` AND lo.status NOT IN ('Completed', 'Cancelled')`;
        }
        
        query += ` ORDER BY 
            CASE lo.priority 
                WHEN 'STAT' THEN 1 
                WHEN 'Urgent' THEN 2 
                ELSE 3 
            END,
            lo.scheduled_for ASC NULLS LAST,
            lo.ordered_at DESC`;
        
        const result = await this.executeQuery(query, values);
        return result.rows;
    }

    /**
     * Find pending orders (Ordered or In-Progress)
     * @param {number} branchId 
     * @returns {Promise<Array>}
     */
    async findPending(branchId) {
        return this.findByBranch(branchId, { includeCompleted: false });
    }

    /**
     * Find orders by status
     * @param {number} branchId 
     * @param {string} status 
     * @returns {Promise<Array>}
     */
    async findByStatus(branchId, status) {
        return this.findByBranch(branchId, { status, includeCompleted: true });
    }

    /**
     * Update order status with history tracking
     * @param {number} orderId 
     * @param {string} newStatus 
     * @param {number} userId - User making the change
     * @param {string} notes - Optional notes
     * @returns {Promise<Object>}
     */
    async updateStatus(orderId, newStatus, userId, notes = null) {
        // Get current status
        const current = await this.findById(orderId);
        if (!current) {
            throw new Error('Lab order not found');
        }
        
        const previousStatus = current.status;
        
        // Update the order
        const updateData = { status: newStatus };
        if (newStatus === 'Completed') {
            updateData.completed_at = new Date();
        }
        
        const updated = await this.update(orderId, updateData);
        
        // Record status change in history
        await this.executeQuery(`
            INSERT INTO lab_order_status_history 
            (order_id, previous_status, new_status, changed_by, notes)
            VALUES ($1, $2, $3, $4, $5)
        `, [orderId, previousStatus, newStatus, userId, notes]);
        
        return updated;
    }

    /**
     * Assign a nurse to an order
     * @param {number} orderId 
     * @param {number} nurseId 
     * @returns {Promise<Object>}
     */
    async assignNurse(orderId, nurseId) {
        return this.update(orderId, { assigned_nurse_id: nurseId });
    }

    /**
     * Get order with full details
     * @param {number} orderId 
     * @returns {Promise<Object|null>}
     */
    async findByIdWithDetails(orderId) {
        const query = `
            SELECT lo.*, 
                   p.first_name || ' ' || p.last_name as patient_name,
                   p.mrn_number,
                   p.contact_number as patient_phone,
                   p.date_of_birth,
                   p.gender,
                   d.first_name || ' ' || d.last_name as doctor_name,
                   n.first_name || ' ' || n.last_name as nurse_name,
                   b.branch_name,
                   h.hospital_name
            FROM lab_orders lo
            LEFT JOIN patients p ON lo.patient_id = p.patient_id
            LEFT JOIN doctors d ON lo.doctor_id = d.doctor_id
            LEFT JOIN nurses n ON lo.assigned_nurse_id = n.nurse_id
            LEFT JOIN branches b ON lo.branch_id = b.branch_id
            LEFT JOIN hospitals h ON b.hospital_id = h.hospital_id
            WHERE lo.order_id = $1
        `;
        
        const result = await this.executeQuery(query, [orderId]);
        return result.rows[0] || null;
    }

    /**
     * Get status history for an order
     * @param {number} orderId 
     * @returns {Promise<Array>}
     */
    async getStatusHistory(orderId) {
        const query = `
            SELECT losh.*, 
                   u.username as changed_by_username,
                   u.email as changed_by_email
            FROM lab_order_status_history losh
            LEFT JOIN users u ON losh.changed_by = u.user_id
            WHERE losh.order_id = $1
            ORDER BY losh.changed_at DESC
        `;
        
        const result = await this.executeQuery(query, [orderId]);
        return result.rows;
    }

    /**
     * Get count of orders by status for a branch
     * @param {number} branchId 
     * @returns {Promise<Object>}
     */
    async getStatusCounts(branchId) {
        const query = `
            SELECT 
                status,
                COUNT(*) as count
            FROM lab_orders
            WHERE branch_id = $1
            GROUP BY status
        `;
        
        const result = await this.executeQuery(query, [branchId]);
        
        const counts = {
            'Ordered': 0,
            'In-Progress': 0,
            'Completed': 0,
            'Cancelled': 0
        };
        
        result.rows.forEach(row => {
            counts[row.status] = parseInt(row.count);
        });
        
        return counts;
    }
}

// Export singleton instance
module.exports = new LabOrder();
