/**
 * PrescriptionTemplate Model
 * 
 * Handles database operations for prescription templates and template medications.
 */

const BaseModel = require('./BaseModel');
const { query } = require('../config/db');

class PrescriptionTemplate extends BaseModel {
    constructor() {
        super('prescription_templates', 'template_id');
    }

    /**
     * Find all templates available to a doctor (global + personal)
     * @param {number} doctorId - Doctor ID
     * @param {string} specialty - Optional specialty filter
     * @returns {Promise<Array>} Array of templates
     */
    async findAllForDoctor(doctorId, specialty = null) {
        let sql = `
            SELECT 
                pt.*,
                (SELECT COUNT(*) FROM template_medications tm WHERE tm.template_id = pt.template_id) as medication_count,
                COALESCE(dtu.times_used, 0) as usage_count,
                dtu.last_used_at
            FROM prescription_templates pt
            LEFT JOIN doctor_template_usage dtu ON pt.template_id = dtu.template_id AND dtu.doctor_id = $1
            WHERE pt.is_active = true
              AND (pt.is_global = true OR pt.doctor_id = $1)
        `;

        const params = [doctorId];

        if (specialty) {
            sql += ` AND (pt.specialty IS NULL OR pt.specialty = $2)`;
            params.push(specialty);
        }

        sql += ` ORDER BY COALESCE(dtu.times_used, 0) DESC, pt.name ASC`;

        const result = await this.executeQuery(sql, params);
        return result.rows;
    }

    /**
     * Find templates matching a diagnosis
     * @param {string} diagnosisName - Diagnosis to search for
     * @param {number} doctorId - Doctor ID for personalization
     * @param {string} specialty - Optional specialty filter
     * @returns {Promise<Array>} Matching templates
     */
    async findByDiagnosis(diagnosisName, doctorId, specialty = null) {
        const searchTerms = diagnosisName.toLowerCase().split(/\s+/);

        let sql = `
            SELECT 
                pt.*,
                COALESCE(dtu.times_used, 0) as usage_count,
                dtu.last_used_at,
                (
                    SELECT array_agg(
                        json_build_object(
                            'template_med_id', tm.template_med_id,
                            'drug_name', tm.drug_name,
                            'drug_strength', tm.drug_strength,
                            'dose', tm.dose,
                            'frequency', tm.frequency,
                            'duration_days', tm.duration_days,
                            'duration_text', tm.duration_text,
                            'route', tm.route,
                            'instructions', tm.instructions,
                            'is_optional', tm.is_optional,
                            'contraindicated_allergies', tm.contraindicated_allergies,
                            'age_min', tm.age_min,
                            'age_max', tm.age_max
                        ) ORDER BY tm.sort_order, tm.template_med_id
                    )
                    FROM template_medications tm
                    WHERE tm.template_id = pt.template_id
                ) as medications
            FROM prescription_templates pt
            LEFT JOIN doctor_template_usage dtu ON pt.template_id = dtu.template_id AND dtu.doctor_id = $1
            WHERE pt.is_active = true
              AND (pt.is_global = true OR pt.doctor_id = $1)
              AND (
                  -- Match diagnosis_name (case-insensitive partial)
                  LOWER(pt.diagnosis_name) LIKE $2
                  -- OR match any diagnosis keyword
                  OR pt.diagnosis_keywords && $3
              )
        `;

        const params = [
            doctorId,
            `%${diagnosisName.toLowerCase()}%`,
            searchTerms
        ];

        if (specialty) {
            sql += ` AND (pt.specialty IS NULL OR pt.specialty = $4)`;
            params.push(specialty);
        }

        sql += ` ORDER BY 
            CASE WHEN LOWER(pt.diagnosis_name) = $2 THEN 0 ELSE 1 END,
            COALESCE(dtu.times_used, 0) DESC,
            pt.name ASC
        `;

        const result = await this.executeQuery(sql, params);
        return result.rows;
    }

    /**
     * Get a template with all its medications
     * @param {number} templateId - Template ID
     * @returns {Promise<Object|null>} Template with medications
     */
    async findByIdWithMedications(templateId) {
        const templateResult = await this.executeQuery(`
            SELECT * FROM prescription_templates WHERE template_id = $1
        `, [templateId]);

        if (templateResult.rows.length === 0) {
            return null;
        }

        const template = templateResult.rows[0];

        const medsResult = await this.executeQuery(`
            SELECT 
                tm.*,
                ms.service_code,
                ms.category as service_category
            FROM template_medications tm
            LEFT JOIN medical_services ms ON tm.service_id = ms.service_id
            WHERE tm.template_id = $1
            ORDER BY tm.sort_order, tm.template_med_id
        `, [templateId]);

        template.medications = medsResult.rows;
        return template;
    }

    /**
     * Create a new template with medications
     * @param {Object} templateData - Template data
     * @param {Array} medications - Array of medication objects
     * @returns {Promise<Object>} Created template
     */
    async createWithMedications(templateData, medications) {
        const client = await require('../config/db').pool.connect();

        try {
            await client.query('BEGIN');

            // Insert template
            const templateResult = await client.query(`
                INSERT INTO prescription_templates (
                    name, diagnosis_keywords, diagnosis_name, description,
                    specialty, is_global, doctor_id, branch_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `, [
                templateData.name,
                templateData.diagnosis_keywords || [],
                templateData.diagnosis_name,
                templateData.description || null,
                templateData.specialty || null,
                templateData.is_global || false,
                templateData.doctor_id || null,
                templateData.branch_id || null
            ]);

            const template = templateResult.rows[0];

            // Insert medications
            if (medications && medications.length > 0) {
                for (let i = 0; i < medications.length; i++) {
                    const med = medications[i];
                    await client.query(`
                        INSERT INTO template_medications (
                            template_id, service_id, drug_name, drug_strength,
                            dose, frequency, duration_days, duration_text,
                            route, instructions, contraindicated_allergies,
                            age_min, age_max, is_optional, sort_order
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                    `, [
                        template.template_id,
                        med.service_id || null,
                        med.drug_name,
                        med.drug_strength || null,
                        med.dose || null,
                        med.frequency || null,
                        med.duration_days || null,
                        med.duration_text || null,
                        med.route || 'Oral',
                        med.instructions || null,
                        med.contraindicated_allergies || [],
                        med.age_min || null,
                        med.age_max || null,
                        med.is_optional || false,
                        i
                    ]);
                }
            }

            await client.query('COMMIT');

            return await this.findByIdWithMedications(template.template_id);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Update template usage tracking
     * @param {number} doctorId - Doctor ID
     * @param {number} templateId - Template ID
     * @param {number} patientId - Patient ID (optional)
     * @param {Object} modifications - Any modifications made (optional)
     */
    async updateUsage(doctorId, templateId, patientId = null, modifications = null) {
        await this.executeQuery(`
            INSERT INTO doctor_template_usage (doctor_id, template_id, patient_id, modifications, times_used, last_used_at)
            VALUES ($1, $2, $3, $4, 1, CURRENT_TIMESTAMP)
            ON CONFLICT (doctor_id, template_id) 
            DO UPDATE SET 
                times_used = doctor_template_usage.times_used + 1,
                times_modified = CASE WHEN $4 IS NOT NULL THEN doctor_template_usage.times_modified + 1 ELSE doctor_template_usage.times_modified END,
                modifications = COALESCE($4, doctor_template_usage.modifications),
                last_used_at = CURRENT_TIMESTAMP
        `, [doctorId, templateId, patientId, modifications ? JSON.stringify(modifications) : null]);
    }

    /**
     * Get top templates for a doctor (most used)
     * @param {number} doctorId - Doctor ID
     * @param {number} limit - Number of templates to return
     * @returns {Promise<Array>} Top templates
     */
    async getTopTemplatesForDoctor(doctorId, limit = 5) {
        const result = await this.executeQuery(`
            SELECT 
                pt.*,
                dtu.times_used,
                dtu.last_used_at
            FROM prescription_templates pt
            INNER JOIN doctor_template_usage dtu ON pt.template_id = dtu.template_id
            WHERE dtu.doctor_id = $1 AND pt.is_active = true
            ORDER BY dtu.times_used DESC, dtu.last_used_at DESC
            LIMIT $2
        `, [doctorId, limit]);

        return result.rows;
    }

    /**
     * Search drugs in medical_services for autocomplete
     * @param {string} searchTerm - Search term
     * @param {number} limit - Max results
     * @returns {Promise<Array>} Matching services
     */
    async searchDrugs(searchTerm, limit = 20) {
        const result = await this.executeQuery(`
            SELECT service_id, service_code, service_name, category
            FROM medical_services
            WHERE to_tsvector('english', service_name) @@ plainto_tsquery($1)
               OR service_name ILIKE $2
            ORDER BY 
                CASE WHEN service_name ILIKE $3 THEN 0 ELSE 1 END,
                service_name
            LIMIT $4
        `, [searchTerm, `%${searchTerm}%`, `${searchTerm}%`, limit]);

        return result.rows;
    }
}

module.exports = new PrescriptionTemplate();
