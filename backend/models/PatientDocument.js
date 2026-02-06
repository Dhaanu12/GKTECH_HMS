const BaseModel = require('./BaseModel');

/**
 * Patient Document Model
 * Manages encrypted patient documents stored in the database
 */
class PatientDocument extends BaseModel {
    constructor() {
        super('patient_documents', 'document_id');
    }

    /**
     * Find documents by patient ID (excludes deleted by default)
     * @param {number} patientId 
     * @param {Object} options - { includeDeleted: boolean, documentType: string, opdId: number }
     * @returns {Promise<Array>}
     */
    async findByPatient(patientId, options = {}) {
        const values = [patientId];
        let paramCount = 2;
        
        // Don't include file_data in list queries - too large
        let query = `
            SELECT 
                pd.document_id,
                pd.patient_id,
                pd.lab_order_id,
                pd.document_type,
                pd.file_name,
                pd.original_file_name,
                pd.file_mime_type,
                pd.file_size,
                pd.file_checksum,
                pd.description,
                pd.uploaded_by,
                pd.is_deleted,
                pd.created_at,
                u.username as uploaded_by_username,
                lo.order_number as lab_order_number,
                lo.test_name as lab_order_test_name,
                lo.opd_id,
                o.opd_number,
                o.visit_date as opd_visit_date
            FROM patient_documents pd
            LEFT JOIN users u ON pd.uploaded_by = u.user_id
            LEFT JOIN lab_orders lo ON pd.lab_order_id = lo.order_id
            LEFT JOIN opd_entries o ON lo.opd_id = o.opd_id
            WHERE pd.patient_id = $1
        `;
        
        if (!options.includeDeleted) {
            query += ` AND pd.is_deleted = FALSE`;
        }
        
        if (options.documentType) {
            query += ` AND pd.document_type = $${paramCount++}`;
            values.push(options.documentType);
        }

        if (options.opdId) {
            query += ` AND lo.opd_id = $${paramCount++}`;
            values.push(options.opdId);
        }
        
        query += ` ORDER BY pd.created_at DESC`;
        
        const result = await this.executeQuery(query, values);
        return result.rows;
    }

    /**
     * Find documents by lab order ID
     * @param {number} labOrderId 
     * @returns {Promise<Array>}
     */
    async findByLabOrder(labOrderId) {
        const query = `
            SELECT 
                pd.document_id,
                pd.patient_id,
                pd.lab_order_id,
                pd.document_type,
                pd.file_name,
                pd.original_file_name,
                pd.file_mime_type,
                pd.file_size,
                pd.file_checksum,
                pd.description,
                pd.uploaded_by,
                pd.is_deleted,
                pd.created_at,
                u.username as uploaded_by_username
            FROM patient_documents pd
            LEFT JOIN users u ON pd.uploaded_by = u.user_id
            WHERE pd.lab_order_id = $1 AND pd.is_deleted = FALSE
            ORDER BY pd.created_at DESC
        `;
        
        const result = await this.executeQuery(query, [labOrderId]);
        return result.rows;
    }

    /**
     * Get document metadata by ID (without file data)
     * @param {number} documentId 
     * @returns {Promise<Object|null>}
     */
    async getMetadata(documentId) {
        const query = `
            SELECT 
                pd.document_id,
                pd.patient_id,
                pd.lab_order_id,
                pd.document_type,
                pd.file_name,
                pd.original_file_name,
                pd.file_mime_type,
                pd.file_size,
                pd.file_checksum,
                pd.description,
                pd.uploaded_by,
                pd.is_deleted,
                pd.deleted_at,
                pd.deleted_by,
                pd.created_at,
                u.username as uploaded_by_username,
                p.first_name || ' ' || p.last_name as patient_name,
                p.mrn_number
            FROM patient_documents pd
            LEFT JOIN users u ON pd.uploaded_by = u.user_id
            LEFT JOIN patients p ON pd.patient_id = p.patient_id
            WHERE pd.document_id = $1
        `;
        
        const result = await this.executeQuery(query, [documentId]);
        return result.rows[0] || null;
    }

    /**
     * Get full document including encrypted file data
     * @param {number} documentId 
     * @returns {Promise<Object|null>}
     */
    async getFileData(documentId) {
        const query = `
            SELECT 
                document_id,
                patient_id,
                file_name,
                original_file_name,
                file_mime_type,
                file_size,
                file_data,
                encryption_iv,
                file_checksum,
                is_deleted
            FROM patient_documents
            WHERE document_id = $1
        `;
        
        const result = await this.executeQuery(query, [documentId]);
        return result.rows[0] || null;
    }

    /**
     * Soft delete a document
     * @param {number} documentId 
     * @param {number} userId - User performing the delete
     * @returns {Promise<Object>}
     */
    async softDelete(documentId, userId) {
        return this.update(documentId, {
            is_deleted: true,
            deleted_at: new Date(),
            deleted_by: userId
        });
    }

    /**
     * Restore a soft-deleted document
     * @param {number} documentId 
     * @returns {Promise<Object>}
     */
    async restore(documentId) {
        return this.update(documentId, {
            is_deleted: false,
            deleted_at: null,
            deleted_by: null
        });
    }

    /**
     * Hard delete a document (admin only) - removes file data
     * @param {number} documentId 
     * @returns {Promise<boolean>}
     */
    async hardDelete(documentId) {
        // First nullify the file data for security, then delete
        await this.executeQuery(`
            UPDATE patient_documents 
            SET file_data = NULL, encryption_iv = NULL 
            WHERE document_id = $1
        `, [documentId]);
        
        return this.delete(documentId);
    }

    /**
     * Get document counts by type for a patient
     * @param {number} patientId 
     * @returns {Promise<Object>}
     */
    async getTypeCounts(patientId) {
        const query = `
            SELECT 
                document_type,
                COUNT(*) as count
            FROM patient_documents
            WHERE patient_id = $1 AND is_deleted = FALSE
            GROUP BY document_type
        `;
        
        const result = await this.executeQuery(query, [patientId]);
        
        const counts = {};
        result.rows.forEach(row => {
            counts[row.document_type] = parseInt(row.count);
        });
        
        return counts;
    }

    /**
     * Check if a document belongs to a patient in a specific branch
     * @param {number} documentId 
     * @param {number} branchId 
     * @returns {Promise<boolean>}
     */
    async belongsToBranch(documentId, branchId) {
        const query = `
            SELECT 1 FROM patient_documents pd
            JOIN patients p ON pd.patient_id = p.patient_id
            JOIN opd_entries oe ON p.patient_id = oe.patient_id
            WHERE pd.document_id = $1 AND oe.branch_id = $2
            LIMIT 1
        `;
        
        const result = await this.executeQuery(query, [documentId, branchId]);
        return result.rows.length > 0;
    }
}

// Export singleton instance
module.exports = new PatientDocument();
