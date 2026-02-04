const BaseModel = require('./BaseModel');

/**
 * PatientVitals Model
 * Handles time-series vital signs storage and retrieval
 */
class PatientVitals extends BaseModel {
    constructor() {
        super('patient_vitals', 'vital_id');
    }

    /**
     * Record new vital signs
     * @param {Object} vitalsData 
     * @returns {Promise<Object>}
     */
    async recordVitals(vitalsData) {
        const {
            patient_id,
            opd_id,
            branch_id,
            blood_pressure_systolic,
            blood_pressure_diastolic,
            pulse_rate,
            temperature,
            spo2,
            respiratory_rate,
            weight,
            height,
            blood_glucose,
            pain_level,
            notes,
            recorded_by
        } = vitalsData;

        const query = `
            INSERT INTO patient_vitals (
                patient_id, opd_id, branch_id,
                blood_pressure_systolic, blood_pressure_diastolic,
                pulse_rate, temperature, spo2, respiratory_rate,
                weight, height, blood_glucose, pain_level,
                notes, recorded_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *
        `;

        const result = await this.executeQuery(query, [
            patient_id, opd_id || null, branch_id,
            blood_pressure_systolic || null, blood_pressure_diastolic || null,
            pulse_rate || null, temperature || null, spo2 || null, respiratory_rate || null,
            weight || null, height || null, blood_glucose || null, pain_level || null,
            notes || null, recorded_by
        ]);

        return result.rows[0];
    }

    /**
     * Get vitals history for a patient
     * @param {number} patientId 
     * @param {Object} options - { limit, offset, startDate, endDate }
     * @returns {Promise<Array>}
     */
    async getPatientVitals(patientId, options = {}) {
        const { limit = 50, offset = 0, startDate, endDate } = options;
        const values = [patientId];
        let paramCount = 2;

        let query = `
            SELECT pv.*,
                   u.username as recorded_by_name,
                   p.first_name || ' ' || p.last_name as patient_name
            FROM patient_vitals pv
            LEFT JOIN users u ON pv.recorded_by = u.user_id
            LEFT JOIN patients p ON pv.patient_id = p.patient_id
            WHERE pv.patient_id = $1
        `;

        if (startDate) {
            query += ` AND pv.recorded_at >= $${paramCount++}`;
            values.push(startDate);
        }

        if (endDate) {
            query += ` AND pv.recorded_at <= $${paramCount++}`;
            values.push(endDate);
        }

        query += ` ORDER BY pv.recorded_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
        values.push(limit, offset);

        const result = await this.executeQuery(query, values);
        return result.rows;
    }

    /**
     * Get latest vitals for a patient
     * @param {number} patientId 
     * @returns {Promise<Object|null>}
     */
    async getLatestVitals(patientId) {
        const query = `
            SELECT pv.*,
                   u.username as recorded_by_name
            FROM patient_vitals pv
            LEFT JOIN users u ON pv.recorded_by = u.user_id
            WHERE pv.patient_id = $1
            ORDER BY pv.recorded_at DESC
            LIMIT 1
        `;

        const result = await this.executeQuery(query, [patientId]);
        return result.rows[0] || null;
    }

    /**
     * Get vitals for a specific OPD visit
     * @param {number} opdId 
     * @returns {Promise<Array>}
     */
    async getOpdVitals(opdId) {
        const query = `
            SELECT pv.*,
                   u.username as recorded_by_name
            FROM patient_vitals pv
            LEFT JOIN users u ON pv.recorded_by = u.user_id
            WHERE pv.opd_id = $1
            ORDER BY pv.recorded_at DESC
        `;

        const result = await this.executeQuery(query, [opdId]);
        return result.rows;
    }

    /**
     * Get vitals count for a patient
     * @param {number} patientId 
     * @returns {Promise<number>}
     */
    async getVitalsCount(patientId) {
        const query = `SELECT COUNT(*) as count FROM patient_vitals WHERE patient_id = $1`;
        const result = await this.executeQuery(query, [patientId]);
        return parseInt(result.rows[0].count);
    }

    /**
     * Get vitals statistics for a patient (for trends)
     * @param {number} patientId 
     * @param {number} days - Number of days to look back
     * @returns {Promise<Object>}
     */
    async getVitalsStats(patientId, days = 30) {
        const query = `
            SELECT 
                MIN(blood_pressure_systolic) as min_systolic,
                MAX(blood_pressure_systolic) as max_systolic,
                AVG(blood_pressure_systolic)::INT as avg_systolic,
                MIN(blood_pressure_diastolic) as min_diastolic,
                MAX(blood_pressure_diastolic) as max_diastolic,
                AVG(blood_pressure_diastolic)::INT as avg_diastolic,
                MIN(pulse_rate) as min_pulse,
                MAX(pulse_rate) as max_pulse,
                AVG(pulse_rate)::INT as avg_pulse,
                MIN(temperature) as min_temp,
                MAX(temperature) as max_temp,
                AVG(temperature)::DECIMAL(4,1) as avg_temp,
                MIN(spo2) as min_spo2,
                MAX(spo2) as max_spo2,
                AVG(spo2)::INT as avg_spo2,
                COUNT(*) as reading_count
            FROM patient_vitals
            WHERE patient_id = $1 
              AND recorded_at >= NOW() - INTERVAL '${days} days'
        `;

        const result = await this.executeQuery(query, [patientId]);
        return result.rows[0];
    }

    /**
     * Delete a vitals record
     * @param {number} vitalId 
     * @returns {Promise<boolean>}
     */
    async deleteVitals(vitalId) {
        const query = `DELETE FROM patient_vitals WHERE vital_id = $1 RETURNING vital_id`;
        const result = await this.executeQuery(query, [vitalId]);
        return result.rows.length > 0;
    }
}

module.exports = new PatientVitals();
