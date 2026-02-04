const PatientVitals = require('../models/PatientVitals');
const { AppError } = require('../middleware/errorHandler');

/**
 * Vitals Controller
 * Handles patient vital signs recording and retrieval
 */
class VitalsController {
    /**
     * Record new vital signs
     * POST /api/vitals
     * Roles: NURSE, DOCTOR, RECEPTIONIST
     */
    static async recordVitals(req, res, next) {
        try {
            const {
                patient_id,
                opd_id,
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
                notes
            } = req.body;

            if (!patient_id) {
                return next(new AppError('patient_id is required', 400));
            }

            // Check if at least one vital is provided
            const hasVitals = blood_pressure_systolic || blood_pressure_diastolic || 
                              pulse_rate || temperature || spo2 || respiratory_rate ||
                              weight || height || blood_glucose || pain_level !== undefined;

            if (!hasVitals) {
                return next(new AppError('At least one vital sign is required', 400));
            }

            const branch_id = req.user.branch_id;
            if (!branch_id) {
                return next(new AppError('Branch not found for user', 400));
            }

            const vitalsData = {
                patient_id,
                opd_id: opd_id || null,
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
                recorded_by: req.userId
            };

            const vitals = await PatientVitals.recordVitals(vitalsData);

            res.status(201).json({
                status: 'success',
                message: 'Vitals recorded successfully',
                data: { vitals }
            });
        } catch (error) {
            console.error('Record vitals error:', error);
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Get vitals history for a patient
     * GET /api/vitals/patient/:patientId
     * Roles: NURSE, DOCTOR, RECEPTIONIST, CLIENT_ADMIN
     */
    static async getPatientVitals(req, res, next) {
        try {
            const { patientId } = req.params;
            const { limit, offset, startDate, endDate } = req.query;

            const vitals = await PatientVitals.getPatientVitals(patientId, {
                limit: limit ? parseInt(limit) : 50,
                offset: offset ? parseInt(offset) : 0,
                startDate,
                endDate
            });

            const count = await PatientVitals.getVitalsCount(patientId);

            res.status(200).json({
                status: 'success',
                data: {
                    vitals,
                    total: count,
                    limit: limit ? parseInt(limit) : 50,
                    offset: offset ? parseInt(offset) : 0
                }
            });
        } catch (error) {
            console.error('Get patient vitals error:', error);
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Get latest vitals for a patient
     * GET /api/vitals/patient/:patientId/latest
     * Roles: NURSE, DOCTOR, RECEPTIONIST, CLIENT_ADMIN
     */
    static async getLatestVitals(req, res, next) {
        try {
            const { patientId } = req.params;
            const vitals = await PatientVitals.getLatestVitals(patientId);

            res.status(200).json({
                status: 'success',
                data: { vitals }
            });
        } catch (error) {
            console.error('Get latest vitals error:', error);
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Get vitals statistics/trends for a patient
     * GET /api/vitals/patient/:patientId/stats
     * Roles: NURSE, DOCTOR, CLIENT_ADMIN
     */
    static async getVitalsStats(req, res, next) {
        try {
            const { patientId } = req.params;
            const { days } = req.query;

            const stats = await PatientVitals.getVitalsStats(
                patientId, 
                days ? parseInt(days) : 30
            );

            res.status(200).json({
                status: 'success',
                data: { stats }
            });
        } catch (error) {
            console.error('Get vitals stats error:', error);
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Get vitals for an OPD visit
     * GET /api/vitals/opd/:opdId
     * Roles: NURSE, DOCTOR, RECEPTIONIST, CLIENT_ADMIN
     */
    static async getOpdVitals(req, res, next) {
        try {
            const { opdId } = req.params;
            const vitals = await PatientVitals.getOpdVitals(opdId);

            res.status(200).json({
                status: 'success',
                data: { vitals }
            });
        } catch (error) {
            console.error('Get OPD vitals error:', error);
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Delete a vitals record
     * DELETE /api/vitals/:vitalId
     * Roles: NURSE, DOCTOR, CLIENT_ADMIN
     */
    static async deleteVitals(req, res, next) {
        try {
            const { vitalId } = req.params;
            const deleted = await PatientVitals.deleteVitals(vitalId);

            if (!deleted) {
                return next(new AppError('Vitals record not found', 404));
            }

            res.status(200).json({
                status: 'success',
                message: 'Vitals record deleted successfully'
            });
        } catch (error) {
            console.error('Delete vitals error:', error);
            next(new AppError(error.message, 500));
        }
    }
}

module.exports = VitalsController;
