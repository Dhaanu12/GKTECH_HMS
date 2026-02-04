const BaseModel = require('./BaseModel');

/**
 * Document Access Log Model
 * Manages audit trail for document access
 */
class DocumentAccessLog extends BaseModel {
    constructor() {
        super('document_access_log', 'log_id');
    }

    /**
     * Log a document access event
     * @param {Object} logData - { documentId, userId, action, ipAddress, userAgent, metadata }
     * @returns {Promise<Object>}
     */
    async logAccess(logData) {
        const { documentId, userId, action, ipAddress, userAgent, metadata } = logData;
        
        return this.create({
            document_id: documentId,
            user_id: userId,
            action: action,
            ip_address: ipAddress || null,
            user_agent: userAgent || null,
            metadata: metadata ? JSON.stringify(metadata) : null,
            accessed_at: new Date()
        });
    }

    /**
     * Log an upload event
     */
    async logUpload(documentId, userId, ipAddress, userAgent, metadata = null) {
        return this.logAccess({
            documentId,
            userId,
            action: 'UPLOAD',
            ipAddress,
            userAgent,
            metadata
        });
    }

    /**
     * Log a view event
     */
    async logView(documentId, userId, ipAddress, userAgent) {
        return this.logAccess({
            documentId,
            userId,
            action: 'VIEW',
            ipAddress,
            userAgent
        });
    }

    /**
     * Log a download event
     */
    async logDownload(documentId, userId, ipAddress, userAgent) {
        return this.logAccess({
            documentId,
            userId,
            action: 'DOWNLOAD',
            ipAddress,
            userAgent
        });
    }

    /**
     * Log a soft delete event
     */
    async logDelete(documentId, userId, ipAddress, userAgent) {
        return this.logAccess({
            documentId,
            userId,
            action: 'DELETE',
            ipAddress,
            userAgent
        });
    }

    /**
     * Log a hard delete event (includes document metadata for audit)
     */
    async logHardDelete(documentId, userId, ipAddress, userAgent, documentMetadata) {
        return this.logAccess({
            documentId,
            userId,
            action: 'HARD_DELETE',
            ipAddress,
            userAgent,
            metadata: documentMetadata
        });
    }

    /**
     * Log a restore event
     */
    async logRestore(documentId, userId, ipAddress, userAgent) {
        return this.logAccess({
            documentId,
            userId,
            action: 'RESTORE',
            ipAddress,
            userAgent
        });
    }

    /**
     * Get access logs for a document
     * @param {number} documentId 
     * @returns {Promise<Array>}
     */
    async getLogsForDocument(documentId) {
        const query = `
            SELECT dal.*, 
                   u.username,
                   u.email
            FROM document_access_log dal
            LEFT JOIN users u ON dal.user_id = u.user_id
            WHERE dal.document_id = $1
            ORDER BY dal.accessed_at DESC
        `;
        
        const result = await this.executeQuery(query, [documentId]);
        return result.rows;
    }

    /**
     * Get access logs by user
     * @param {number} userId 
     * @param {Object} options - { limit, offset, action }
     * @returns {Promise<Array>}
     */
    async getLogsByUser(userId, options = {}) {
        const values = [userId];
        let paramCount = 2;
        
        let query = `
            SELECT dal.*, 
                   pd.original_file_name,
                   pd.document_type,
                   p.first_name || ' ' || p.last_name as patient_name
            FROM document_access_log dal
            LEFT JOIN patient_documents pd ON dal.document_id = pd.document_id
            LEFT JOIN patients p ON pd.patient_id = p.patient_id
            WHERE dal.user_id = $1
        `;
        
        if (options.action) {
            query += ` AND dal.action = $${paramCount++}`;
            values.push(options.action);
        }
        
        query += ` ORDER BY dal.accessed_at DESC`;
        
        if (options.limit) {
            query += ` LIMIT $${paramCount++}`;
            values.push(options.limit);
        }
        
        if (options.offset) {
            query += ` OFFSET $${paramCount++}`;
            values.push(options.offset);
        }
        
        const result = await this.executeQuery(query, values);
        return result.rows;
    }

    /**
     * Get recent access logs for audit dashboard
     * @param {Object} options - { limit, branchId, action }
     * @returns {Promise<Array>}
     */
    async getRecentLogs(options = {}) {
        const values = [];
        let paramCount = 1;
        
        let query = `
            SELECT dal.*, 
                   u.username,
                   pd.original_file_name,
                   pd.document_type,
                   p.first_name || ' ' || p.last_name as patient_name,
                   p.mrn_number
            FROM document_access_log dal
            LEFT JOIN users u ON dal.user_id = u.user_id
            LEFT JOIN patient_documents pd ON dal.document_id = pd.document_id
            LEFT JOIN patients p ON pd.patient_id = p.patient_id
            WHERE 1=1
        `;
        
        if (options.action) {
            query += ` AND dal.action = $${paramCount++}`;
            values.push(options.action);
        }
        
        query += ` ORDER BY dal.accessed_at DESC`;
        query += ` LIMIT $${paramCount++}`;
        values.push(options.limit || 50);
        
        const result = await this.executeQuery(query, values);
        return result.rows;
    }

    /**
     * Get access statistics for a document
     * @param {number} documentId 
     * @returns {Promise<Object>}
     */
    async getDocumentStats(documentId) {
        const query = `
            SELECT 
                action,
                COUNT(*) as count,
                MAX(accessed_at) as last_access
            FROM document_access_log
            WHERE document_id = $1
            GROUP BY action
        `;
        
        const result = await this.executeQuery(query, [documentId]);
        
        const stats = {
            totalViews: 0,
            totalDownloads: 0,
            lastViewed: null,
            lastDownloaded: null
        };
        
        result.rows.forEach(row => {
            if (row.action === 'VIEW') {
                stats.totalViews = parseInt(row.count);
                stats.lastViewed = row.last_access;
            } else if (row.action === 'DOWNLOAD') {
                stats.totalDownloads = parseInt(row.count);
                stats.lastDownloaded = row.last_access;
            }
        });
        
        return stats;
    }
}

// Export singleton instance
module.exports = new DocumentAccessLog();
