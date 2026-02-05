const PatientVitals = require('../models/PatientVitals');
const OpdEntry = require('../models/OpdEntry');
const { query } = require('../config/db');
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

            console.log('User object:', req.user);
            console.log('User ID:', req.userId);
            console.log('Branch ID from user:', req.user?.branch_id);

            let branch_id = req.user?.branch_id;

            // Fallback: Try to get branch_id from OPD record if missing
            if (!branch_id && opd_id) {
                try {
                    console.log('User has no branch_id, attempting to fetch from OPD record:', opd_id);
                    const opdEntry = await OpdEntry.findById(opd_id);
                    if (opdEntry && opdEntry.branch_id) {
                        branch_id = opdEntry.branch_id;
                        console.log('Retrieved branch_id from OPD record:', branch_id);
                    } else {
                        console.log('OPD record found but no branch_id:', opdEntry);
                    }
                } catch (err) {
                    console.error('Error fetching OPD entry for branch fallback:', err);
                }
            }

            if (!branch_id) {
                console.error('Branch ID not found. User object:', JSON.stringify(req.user, null, 2));
                // Return detailed error to frontend for debugging
                return res.status(400).json({
                    status: 'error',
                    message: 'Branch not found for user. Please contact administrator.',
                    debug: { userId: req.user?.user_id, opdId: opd_id }
                });
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

            console.log('Vitals data to save:', vitalsData);

            const vitals = await PatientVitals.recordVitals(vitalsData);

            console.log('Vitals saved successfully:', vitals);

            // Sync with opd_entries table for backward compatibility and to ensure GET /api/opd/:id returns latest data
            if (opd_id) {
                try {
                    const legacyVitals = {
                        grbs: blood_glucose,
                        spo2,
                        pulse: pulse_rate,
                        temperature,
                        bp_systolic: blood_pressure_systolic,
                        bp_diastolic: blood_pressure_diastolic,
                        height,
                        weight,
                        respiratory_rate,
                        pain_level,
                        notes
                    };

                    await query('UPDATE opd_entries SET vital_signs = $1 WHERE opd_id = $2', [
                        JSON.stringify(legacyVitals),
                        opd_id
                    ]);
                    console.log('Synced vitals to opd_entries table for OPD ID:', opd_id);
                } catch (syncError) {
                    console.error('Error syncing to opd_entries (non-fatal):', syncError);
                }
            }

            res.status(201).json({
                status: 'success',
                message: 'Vitals recorded successfully',
                data: { vitals }
            });
        } catch (error) {
            console.error('Record vitals error:', error);
            console.error('Error stack:', error.stack);
            // Return explicit JSON error for debugging
            res.status(500).json({
                status: 'error',
                message: error.message,
                stack: error.stack,
                details: 'Error saving vitals record'
            });
        }
    }

    /**
     * Get vitals history for a patient
     * GET /api/vitals/patient/:patientId
     * Query params: limit, offset, startDate, endDate, opdId
     * Roles: NURSE, DOCTOR, RECEPTIONIST, CLIENT_ADMIN
     */
    static async getPatientVitals(req, res, next) {
        try {
            const { patientId } = req.params;
            const { limit, offset, startDate, endDate, opdId } = req.query;

            const vitals = await PatientVitals.getPatientVitals(patientId, {
                limit: limit ? parseInt(limit) : 50,
                offset: offset ? parseInt(offset) : 0,
                startDate,
                endDate,
                opdId: opdId ? parseInt(opdId) : null
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
