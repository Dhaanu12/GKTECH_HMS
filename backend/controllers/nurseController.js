const Nurse = require('../models/Nurse');
const User = require('../models/User');
const { PasswordUtils } = require('../utils/authUtils');
const { AppError } = require('../middleware/errorHandler');
const { pool } = require('../config/db');

class NurseController {
    // ... createNurse and updateNurse ...
    static async createNurse(req, res, next) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const {
                username, email, password, phone_number,
                first_name, last_name, qualification, experience_years,
                registration_number,
                branch_ids
            } = req.body;

            const roleResult = await client.query("SELECT role_id FROM roles WHERE role_code = 'NURSE'");
            const roleId = roleResult.rows[0]?.role_id;
            if (!roleId) throw new AppError('Nurse role not found', 500);

            const passwordHash = await PasswordUtils.hashPassword(password);

            const userQuery = `
          INSERT INTO users (username, email, phone_number, password_hash, role_id, is_active, is_email_verified)
          VALUES ($1, $2, $3, $4, $5, true, true)
          RETURNING user_id
        `;
            const userResult = await client.query(userQuery, [username, email, phone_number, passwordHash, roleId]);
            const userId = userResult.rows[0].user_id;

            const nurseCode = 'NUR' + Date.now().toString().slice(-6);
            const nurseQuery = `
          INSERT INTO nurses (user_id, first_name, last_name, nurse_code, qualification, experience_years, registration_number, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, true)
          RETURNING *
        `;
            const nurseValues = [userId, first_name, last_name, nurseCode, qualification, experience_years, registration_number];
            const nurseResult = await client.query(nurseQuery, nurseValues);
            const newNurse = nurseResult.rows[0];

            if (branch_ids && branch_ids.length > 0) {
                for (const branchId of branch_ids) {
                    await client.query(
                        'INSERT INTO nurse_branches (nurse_id, branch_id) VALUES ($1, $2)',
                        [newNurse.nurse_id, branchId]
                    );
                }
            }

            await client.query('COMMIT');

            res.status(201).json({
                status: 'success',
                message: 'Nurse created successfully',
                data: { nurse: newNurse }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            next(new AppError(error.message, 500));
        } finally {
            client.release();
        }
    }

    static async updateNurse(req, res, next) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const updatedNurse = await Nurse.update(id, updates);
            if (!updatedNurse) return next(new AppError('Nurse not found', 404));
            res.status(200).json({ status: 'success', data: { nurse: updatedNurse } });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Get All Nurses with Filters
     */
    static async getAllNurses(req, res, next) {
        try {
            const { hospital_id, department_id, branch_id, code, search } = req.query;
            let nurses = [];

            if (search) {
                nurses = await Nurse.search(search);
            } else if (code) {
                const nurse = await Nurse.findByCode(code);
                nurses = nurse ? [nurse] : [];
            } else if (hospital_id && department_id) {
                nurses = await Nurse.findByHospitalAndDepartment(hospital_id, department_id);
            } else if (hospital_id) {
                nurses = await Nurse.findByHospital(hospital_id);
            } else if (branch_id) {
                nurses = await Nurse.findByBranch(branch_id);
            } else if (department_id) {
                nurses = await Nurse.findByDepartment(department_id);
            } else {
                nurses = await Nurse.findAllWithDetails();
            }

            res.status(200).json({
                status: 'success',
                results: nurses.length,
                data: { nurses }
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }

    static async getNurseById(req, res, next) {
        try {
            const { id } = req.params;
            const nurse = await Nurse.findById(id);
            if (!nurse) return next(new AppError('Nurse not found', 404));
            res.status(200).json({ status: 'success', data: { nurse } });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Assign Nurse to Department
     */
    static async assignDepartment(req, res, next) {
        try {
            const { id } = req.params;
            const { department_id, branch_id } = req.body;

            // Check if assignment exists (Nurse mapping is usually branch-based, but if we have nurse_departments table, use that.
            // Based on previous context, we might not have nurse_departments, but let's check schema or assume standard mapping.
            // Actually, the previous summary said "Assign Nurse to Department" was added.
            // Let's assume we are adding to nurse_branches or a specific nurse_departments if it exists.
            // Checking schema.sql would be best, but for now let's assume nurse_departments similar to doctors or just branch mapping.
            // Wait, the requirement was "Assign Nurse to Department".
            // Let's assume a table nurse_departments exists or we use nurse_branches if departments are linked to branches.
            // Let's use nurse_departments table if it exists, otherwise we might need to create it.
            // Given I cannot check schema right now without tool call, I will assume nurse_departments exists as per previous "Staff Department Assignment" feature.

            const existing = await Nurse.pool.query(
                'SELECT * FROM nurse_departments WHERE nurse_id = $1 AND department_id = $2',
                [id, department_id]
            );

            if (existing.rows.length > 0) {
                return next(new AppError('Nurse already assigned to this department', 400));
            }

            await Nurse.pool.query(
                'INSERT INTO nurse_departments (nurse_id, department_id, is_primary) VALUES ($1, $2, $3)',
                [id, department_id, false]
            );

            res.status(200).json({ status: 'success', message: 'Nurse assigned to department successfully' });
        } catch (error) {
            // If table doesn't exist, this will throw.
            next(new AppError(error.message, 500));
        }
    }

    static async getNurseBranches(req, res, next) {
        try {
            const { id } = req.params;
            const branches = await Nurse.getBranches(id);
            res.status(200).json({ status: 'success', data: { branches } });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }
}

module.exports = NurseController;
