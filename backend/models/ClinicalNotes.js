const BaseModel = require('./BaseModel');

/**
 * ClinicalNotes Model
 * Handles time-series clinical notes storage and retrieval
 */
class ClinicalNotes extends BaseModel {
    constructor() {
        super('clinical_notes', 'note_id');
    }

    /**
     * Create a new clinical note
     * @param {Object} noteData 
     * @returns {Promise<Object>}
     */
    async createNote(noteData) {
        const {
            patient_id,
            opd_id,
            branch_id,
            note_type,
            title,
            content,
            diagnosis_codes,
            is_confidential,
            is_pinned,
            created_by
        } = noteData;

        const query = `
            INSERT INTO clinical_notes (
                patient_id, opd_id, branch_id, note_type, title, content,
                diagnosis_codes, is_confidential, is_pinned, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;

        const result = await this.executeQuery(query, [
            patient_id,
            opd_id || null,
            branch_id,
            note_type || 'General',
            title || null,
            content,
            diagnosis_codes || null,
            is_confidential || false,
            is_pinned || false,
            created_by
        ]);

        return result.rows[0];
    }

    /**
     * Get notes for a patient with full details
     * @param {number} patientId 
     * @param {Object} options - { limit, offset, noteType, includeDeleted, opdId, startDate, endDate }
     * @returns {Promise<Array>}
     */
    async getPatientNotes(patientId, options = {}) {
        const { limit = 50, offset = 0, noteType, includeDeleted = false, opdId, startDate, endDate } = options;
        const values = [patientId];
        let paramCount = 2;

        let query = `
            SELECT cn.*,
                   u.username as created_by_name,
                   COALESCE(n.first_name || ' ' || n.last_name, d.first_name || ' ' || d.last_name, u.username) as author_name,
                   uu.username as updated_by_name,
                   o.opd_number,
                   o.visit_date as opd_visit_date,
                   o.visit_type as opd_visit_type,
                   od.first_name || ' ' || od.last_name as opd_doctor_name
            FROM clinical_notes cn
            LEFT JOIN users u ON cn.created_by = u.user_id
            LEFT JOIN nurses n ON u.user_id = n.user_id
            LEFT JOIN doctors d ON u.user_id = d.user_id
            LEFT JOIN users uu ON cn.updated_by = uu.user_id
            LEFT JOIN opd_entries o ON cn.opd_id = o.opd_id
            LEFT JOIN doctors od ON o.doctor_id = od.doctor_id
            WHERE cn.patient_id = $1
        `;

        if (!includeDeleted) {
            query += ` AND cn.is_deleted = false`;
        }

        if (noteType) {
            query += ` AND cn.note_type = $${paramCount++}`;
            values.push(noteType);
        }

        if (opdId) {
            query += ` AND cn.opd_id = $${paramCount++}`;
            values.push(opdId);
        }

        if (startDate) {
            query += ` AND cn.created_at >= $${paramCount++}`;
            values.push(startDate);
        }

        if (endDate) {
            query += ` AND cn.created_at <= $${paramCount++}`;
            values.push(endDate);
        }

        // Pinned notes first, then by date
        query += ` ORDER BY cn.is_pinned DESC, cn.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
        values.push(limit, offset);

        const result = await this.executeQuery(query, values);
        return result.rows;
    }

    /**
     * Get notes count for a patient
     * @param {number} patientId 
     * @returns {Promise<number>}
     */
    async getNotesCount(patientId) {
        const query = `SELECT COUNT(*) as count FROM clinical_notes WHERE patient_id = $1 AND is_deleted = false`;
        const result = await this.executeQuery(query, [patientId]);
        return parseInt(result.rows[0].count);
    }

    /**
     * Get a single note by ID
     * @param {number} noteId 
     * @returns {Promise<Object|null>}
     */
    async getNoteById(noteId) {
        const query = `
            SELECT cn.*,
                   u.username as created_by_name,
                   COALESCE(n.first_name || ' ' || n.last_name, d.first_name || ' ' || d.last_name, u.username) as author_name,
                   o.opd_number,
                   o.visit_date as opd_visit_date,
                   o.visit_type as opd_visit_type,
                   od.first_name || ' ' || od.last_name as opd_doctor_name
            FROM clinical_notes cn
            LEFT JOIN users u ON cn.created_by = u.user_id
            LEFT JOIN nurses n ON u.user_id = n.user_id
            LEFT JOIN doctors d ON u.user_id = d.user_id
            LEFT JOIN opd_entries o ON cn.opd_id = o.opd_id
            LEFT JOIN doctors od ON o.doctor_id = od.doctor_id
            WHERE cn.note_id = $1 AND cn.is_deleted = false
        `;

        const result = await this.executeQuery(query, [noteId]);
        return result.rows[0] || null;
    }

    /**
     * Update a clinical note
     * @param {number} noteId 
     * @param {Object} updates 
     * @param {number} updatedBy 
     * @returns {Promise<Object>}
     */
    async updateNote(noteId, updates, updatedBy) {
        const { note_type, title, content, is_confidential, is_pinned } = updates;
        
        const query = `
            UPDATE clinical_notes
            SET note_type = COALESCE($1, note_type),
                title = COALESCE($2, title),
                content = COALESCE($3, content),
                is_confidential = COALESCE($4, is_confidential),
                is_pinned = COALESCE($5, is_pinned),
                updated_by = $6,
                updated_at = CURRENT_TIMESTAMP
            WHERE note_id = $7 AND is_deleted = false
            RETURNING *
        `;

        const result = await this.executeQuery(query, [
            note_type, title, content, is_confidential, is_pinned, updatedBy, noteId
        ]);

        return result.rows[0];
    }

    /**
     * Soft delete a note
     * @param {number} noteId 
     * @param {number} deletedBy 
     * @returns {Promise<boolean>}
     */
    async deleteNote(noteId, deletedBy) {
        const query = `
            UPDATE clinical_notes
            SET is_deleted = true,
                deleted_at = CURRENT_TIMESTAMP,
                deleted_by = $1
            WHERE note_id = $2
            RETURNING note_id
        `;

        const result = await this.executeQuery(query, [deletedBy, noteId]);
        return result.rows.length > 0;
    }

    /**
     * Toggle pin status
     * @param {number} noteId 
     * @returns {Promise<Object>}
     */
    async togglePin(noteId) {
        const query = `
            UPDATE clinical_notes
            SET is_pinned = NOT is_pinned,
                updated_at = CURRENT_TIMESTAMP
            WHERE note_id = $1
            RETURNING *
        `;

        const result = await this.executeQuery(query, [noteId]);
        return result.rows[0];
    }

    /**
     * Get notes for an OPD visit
     * @param {number} opdId 
     * @returns {Promise<Array>}
     */
    async getOpdNotes(opdId) {
        const query = `
            SELECT cn.*,
                   u.username as created_by_name,
                   COALESCE(n.first_name || ' ' || n.last_name, d.first_name || ' ' || d.last_name, u.username) as author_name
            FROM clinical_notes cn
            LEFT JOIN users u ON cn.created_by = u.user_id
            LEFT JOIN nurses n ON u.user_id = n.user_id
            LEFT JOIN doctors d ON u.user_id = d.user_id
            WHERE cn.opd_id = $1 AND cn.is_deleted = false
            ORDER BY cn.created_at DESC
        `;

        const result = await this.executeQuery(query, [opdId]);
        return result.rows;
    }

    /**
     * Get pinned notes for a patient
     * @param {number} patientId 
     * @returns {Promise<Array>}
     */
    async getPinnedNotes(patientId) {
        const query = `
            SELECT cn.*,
                   u.username as created_by_name,
                   COALESCE(n.first_name || ' ' || n.last_name, u.username) as author_name
            FROM clinical_notes cn
            LEFT JOIN users u ON cn.created_by = u.user_id
            LEFT JOIN nurses n ON u.user_id = n.user_id
            WHERE cn.patient_id = $1 AND cn.is_pinned = true AND cn.is_deleted = false
            ORDER BY cn.created_at DESC
        `;

        const result = await this.executeQuery(query, [patientId]);
        return result.rows;
    }

    /**
     * Search notes
     * @param {number} patientId 
     * @param {string} searchTerm 
     * @returns {Promise<Array>}
     */
    async searchNotes(patientId, searchTerm) {
        const query = `
            SELECT cn.*,
                   u.username as created_by_name,
                   COALESCE(n.first_name || ' ' || n.last_name, u.username) as author_name
            FROM clinical_notes cn
            LEFT JOIN users u ON cn.created_by = u.user_id
            LEFT JOIN nurses n ON u.user_id = n.user_id
            WHERE cn.patient_id = $1 
              AND cn.is_deleted = false
              AND (cn.content ILIKE $2 OR cn.title ILIKE $2)
            ORDER BY cn.created_at DESC
            LIMIT 50
        `;

        const result = await this.executeQuery(query, [patientId, `%${searchTerm}%`]);
        return result.rows;
    }
}

module.exports = new ClinicalNotes();
