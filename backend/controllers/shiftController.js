const Shift = require('../models/Shift');
const ShiftBranch = require('../models/ShiftBranch');
const DoctorShift = require('../models/DoctorShift');
const NurseShift = require('../models/NurseShift');
const { AppError } = require('../middleware/errorHandler');
const { pool } = require('../config/db');

class ShiftController {
    /**
     * Create Shift and Map to Branch
     * Accessible by: CLIENT_ADMIN
     */
    static async createShift(req, res, next) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const {
                shift_name, shift_code, start_time, end_time,
                shift_type, description, branch_id
            } = req.body;

            // 1. Create Shift
            // Calculate duration
            // Simple duration calc (assuming same day for now, or handle crossing midnight)
            // For simplicity, let DB handle it or just pass null if not critical

            const shiftQuery = `
        INSERT INTO shifts (shift_name, shift_code, start_time, end_time, shift_type, description, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        RETURNING *
      `;
            const shiftValues = [shift_name, shift_code, start_time, end_time, shift_type, description];
            const shiftResult = await client.query(shiftQuery, shiftValues);
            const newShift = shiftResult.rows[0];

            // 2. Map to Branch
            const mappingQuery = `
        INSERT INTO shift_branches (shift_id, branch_id, is_active)
        VALUES ($1, $2, true)
        RETURNING *
      `;
            await client.query(mappingQuery, [newShift.shift_id, branch_id]);

            await client.query('COMMIT');

            res.status(201).json({
                status: 'success',
                message: 'Shift created and mapped to branch successfully',
                data: { shift: newShift }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            next(new AppError(error.message, 500));
        } finally {
            client.release();
        }
    }

    /**
     * Get Shifts by Branch
     */
    static async getShiftsByBranch(req, res, next) {
        try {
            const { branchId } = req.params;
            const shifts = await ShiftBranch.findByBranch(branchId);
            res.status(200).json({
                status: 'success',
                data: { shifts }
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Assign Doctor to Shift (Rostering)
     * Creates a schedule entry for a specific date
     */
    static async assignDoctorToShift(req, res, next) {
        try {
            const { doctor_id, branch_id, shift_id, shift_date, department_id } = req.body;

            // Check if already assigned
            const existing = await DoctorShift.findOne({
                doctor_id, shift_date
            });

            if (existing) {
                return next(new AppError('Doctor is already assigned to a shift on this date', 409));
            }

            const assignment = await DoctorShift.create({
                doctor_id,
                branch_id,
                shift_id,
                department_id,
                shift_date,
                attendance_status: 'Present' // Default status, or 'Scheduled' if we had that enum
            });

            res.status(201).json({
                status: 'success',
                message: 'Doctor assigned to shift successfully',
                data: { assignment }
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Assign Nurse to Shift
     */
    static async assignNurseToShift(req, res, next) {
        try {
            const { nurse_id, branch_id, shift_id, shift_date, department_id } = req.body;

            const existing = await NurseShift.findOne({
                nurse_id, shift_date
            });

            if (existing) {
                return next(new AppError('Nurse is already assigned to a shift on this date', 409));
            }

            const assignment = await NurseShift.create({
                nurse_id,
                branch_id,
                shift_id,
                department_id,
                shift_date,
                attendance_status: 'Present'
            });

            res.status(201).json({
                status: 'success',
                message: 'Nurse assigned to shift successfully',
                data: { assignment }
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }
}

module.exports = ShiftController;
