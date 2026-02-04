const Doctor = require('../models/Doctor');
const User = require('../models/User');
const DoctorBranch = require('../models/DoctorBranch');
const { PasswordUtils } = require('../utils/authUtils');
const { AppError } = require('../middleware/errorHandler');
const { pool } = require('../config/db');

class DoctorController {
    // ... createDoctor and updateDoctor methods remain same ...
    static async createDoctor(req, res, next) {
        // Re-implementing to keep file complete or I can use replace_file_content if I knew the exact content.
        // Since I'm overwriting, I must include previous logic.
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const {
                username, email, password, phone_number,
                first_name, last_name, specialization, registration_number,
                qualification, experience_years, consultation_fee,
                branch_ids, address, bank_name, account_number, ifsc_code,
                doctor_type, gender, date_of_birth
            } = req.body;

            const signature_url = req.file ? req.file.path : null;

            const roleResult = await client.query("SELECT role_id FROM roles WHERE role_code = 'DOCTOR'");
            const roleId = roleResult.rows[0]?.role_id;
            if (!roleId) throw new AppError('Doctor role not found', 500);

            const passwordHash = await PasswordUtils.hashPassword(password);

            const userQuery = `
          INSERT INTO users (username, email, phone_number, password_hash, role_id, is_active, is_email_verified)
          VALUES ($1, $2, $3, $4, $5, true, true)
          RETURNING user_id
        `;
            const userResult = await client.query(userQuery, [username, email, phone_number, passwordHash, roleId]);
            const userId = userResult.rows[0].user_id;

            const doctorCode = 'DOC' + Date.now().toString().slice(-6);

            // Convert empty strings to null for numeric fields and dates
            const experienceYears = experience_years === '' ? null : experience_years;
            const consultationFee = consultation_fee === '' ? null : consultation_fee;
            const dateOfBirth = date_of_birth === '' ? null : date_of_birth;

            const doctorQuery = `
          INSERT INTO doctors (
              user_id, first_name, last_name, doctor_code, specialization, 
              registration_number, qualification, experience_years, consultation_fee, 
              address, bank_name, account_number, ifsc_code, doctor_type, signature_url,
              gender, date_of_birth, is_active
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, true)
          RETURNING *
        `;
            const doctorValues = [
                userId, first_name, last_name, doctorCode, specialization,
                registration_number, qualification, experienceYears, consultationFee,
                address, bank_name, account_number, ifsc_code, doctor_type || 'In-house', signature_url,
                gender, date_of_birth
            ];
            const doctorResult = await client.query(doctorQuery, doctorValues);
            const newDoctor = doctorResult.rows[0];

            let branchesToAssign = branch_ids;
            if (branchesToAssign && !Array.isArray(branchesToAssign)) {
                branchesToAssign = [branchesToAssign];
            }

            if (branchesToAssign && branchesToAssign.length > 0) {
                const uniqueBranches = [...new Set(branchesToAssign)];
                for (const branchId of uniqueBranches) {
                    if (branchId) {
                        await client.query(
                            'INSERT INTO doctor_branches (doctor_id, branch_id) VALUES ($1, $2)',
                            [newDoctor.doctor_id, branchId]
                        );
                    }
                }
            }

            if (req.body.department_id) {
                await client.query(
                    'INSERT INTO doctor_departments (doctor_id, department_id, is_primary_department) VALUES ($1, $2, $3)',
                    [newDoctor.doctor_id, req.body.department_id, true]
                );
            }

            await client.query('COMMIT');

            res.status(201).json({
                status: 'success',
                message: 'Doctor created successfully',
                data: { doctor: newDoctor }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Create Doctor Error:', error);
            next(new AppError(error.message, 500));
        } finally {
            client.release();
        }
    }

    /**
     * Get doctors for logged-in user's branch (for Receptionist)
     * GET /api/doctors/my-branch
     */
    static async getMyBranchDoctors(req, res, next) {
        try {
            const branch_id = req.user.branch_id;

            if (!branch_id) {
                return next(new AppError('Branch not linked to your account', 403));
            }

            const doctors = await Doctor.findByBranch(branch_id);

            res.status(200).json({
                status: 'success',
                data: { doctors }
            });
        } catch (error) {
            console.error('Get my branch doctors error:', error);
            next(new AppError('Failed to fetch doctors', 500));
        }
    }

    static async updateDoctor(req, res, next) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const updatedDoctor = await Doctor.update(id, updates);
            if (!updatedDoctor) return next(new AppError('Doctor not found', 404));
            res.status(200).json({ status: 'success', data: { doctor: updatedDoctor } });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Get All Doctors with Filters
     * Supports: ?hospital_id=1, ?department_id=2, ?branch_id=3, ?code=DOC123
     */
    static async getAllDoctors(req, res, next) {
        try {
            const { hospital_id, department_id, branch_id, code, registration_number, search } = req.query;
            let doctors = [];

            if (search) {
                doctors = await Doctor.search(search);
            } else if (code) {
                const doctor = await Doctor.findByCode(code);
                doctors = doctor ? [doctor] : [];
            } else if (registration_number) {
                const doctor = await Doctor.findByRegistration(registration_number);
                doctors = doctor ? [doctor] : [];
            } else if (hospital_id && department_id) {
                doctors = await Doctor.findByHospitalAndDepartment(hospital_id, department_id);
            } else if (hospital_id) {
                doctors = await Doctor.findByHospital(hospital_id);
            } else if (branch_id) {
                doctors = await Doctor.findByBranch(branch_id);
            } else if (department_id) {
                doctors = await Doctor.findByDepartment(department_id);
            } else {
                doctors = await Doctor.findAllWithDetails();
            }

            res.status(200).json({
                status: 'success',
                results: doctors.length,
                data: { doctors }
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Get Single Doctor by ID
     */
    static async getDoctorById(req, res, next) {
        try {
            const { id } = req.params;
            const doctor = await Doctor.findById(id);
            if (!doctor) return next(new AppError('Doctor not found', 404));
            res.status(200).json({ status: 'success', data: { doctor } });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Assign Doctor to Department
     */
    static async assignDepartment(req, res, next) {
        try {
            const { id } = req.params;
            const { department_id, is_primary } = req.body;

            // Check if assignment exists
            const existing = await Doctor.pool.query(
                'SELECT * FROM doctor_departments WHERE doctor_id = $1 AND department_id = $2',
                [id, department_id]
            );

            if (existing.rows.length > 0) {
                return next(new AppError('Doctor already assigned to this department', 400));
            }

            await Doctor.pool.query(
                'INSERT INTO doctor_departments (doctor_id, department_id, is_primary) VALUES ($1, $2, $3)',
                [id, department_id, is_primary || false]
            );

            res.status(200).json({ status: 'success', message: 'Doctor assigned to department successfully' });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }
    static async getDoctorBranches(req, res, next) {
        try {
            const { id } = req.params;
            const branches = await Doctor.getBranches(id);
            res.status(200).json({ status: 'success', data: { branches } });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Get Today's Schedule (OPD Queue + Appointments + Completed Consultations)
     * GET /api/doctors/schedule?date=YYYY-MM-DD
     */
    static async getDoctorSchedule(req, res, next) {
        try {
            const doctor_user_id = req.user.user_id; // This is user_id, need to find doctor_id

            // Get date from query params, default to today
            const filterDate = req.query.date || new Date().toISOString().split('T')[0];

            // First get doctor_id from user_id
            // Assuming Doctor model or simple query. Let's use direct query to be safe and fast.
            const doctorResult = await pool.query('SELECT doctor_id FROM doctors WHERE user_id = $1', [doctor_user_id]);

            if (doctorResult.rows.length === 0) {
                return next(new AppError('Doctor profile not found for this user', 404));
            }
            const doctor_id = doctorResult.rows[0].doctor_id;

            // 1. Fetch Waiting Room (OPD Entries for the SELECTED date)
            // Statuses: 'Registered', 'In-consultation'
            // NOTE: Usually Waiting Queue is relevant for Today, but if viewing past/future, we strictly filter by date.
            const opdQuery = `
                SELECT o.*, 
                       p.first_name || ' ' || p.last_name as patient_name, 
                       p.age, p.gender, p.mrn_number,
                       'OPD' as source
                FROM opd_entries o
                JOIN patients p ON o.patient_id = p.patient_id
                WHERE o.doctor_id = $1 
                AND o.visit_date = $2 
                AND o.visit_status IN ('Registered', 'In-consultation')
                ORDER BY o.visit_time ASC
            `;
            const opdQueue = await pool.query(opdQuery, [doctor_id, filterDate]);

            // 2. Fetch Appointments for the SELECTED date
            // This enables the "Schedule For" picker to show appointments for that specific day.
            const apptQuery = `
                SELECT a.*, 
                       COALESCE(p.first_name || ' ' || p.last_name, a.patient_name) as patient_name,
                       'Appointment' as source
                FROM appointments a
                LEFT JOIN patients p ON a.patient_id = p.patient_id
                WHERE a.doctor_id = $1 
                AND a.appointment_status NOT IN ('Completed', 'Cancelled')
                AND a.appointment_date = $2
                ORDER BY a.appointment_time ASC
            `;
            const appointments = await pool.query(apptQuery, [doctor_id, filterDate]);

            // 3. Fetch Completed Consultations for the specified date
            const completedQuery = `
                SELECT c.outcome_id, c.opd_id, c.patient_id, c.created_at,
                       p.first_name || ' ' || p.last_name as patient_name,
                       p.age, p.gender, p.mrn_number,
                       o.visit_time, o.chief_complaint, o.consultation_fee,
                       c.diagnosis,
                       'Completed' as source
                FROM consultation_outcomes c
                JOIN patients p ON c.patient_id = p.patient_id
                JOIN opd_entries o ON c.opd_id = o.opd_id
                WHERE c.doctor_id = $1
                AND c.consultation_status = 'Completed'
                AND DATE(c.created_at) = $2
                ORDER BY c.created_at DESC
            `;
            const completedConsultations = await pool.query(completedQuery, [doctor_id, filterDate]);

            res.status(200).json({
                status: 'success',
                data: {
                    waitingQueue: opdQueue.rows,
                    appointments: appointments.rows,
                    completedConsultations: completedConsultations.rows,
                    filterDate: filterDate
                }
            });

        } catch (error) {
            console.error("Get Schedule Error:", error);
            next(new AppError('Failed to fetch schedule', 500));
        }
    }

    /**
     * Get Analytics for Logged-in Doctor
     * GET /api/doctors/analytics
     */
    static async getAnalytics(req, res, next) {
        try {
            const doctor_user_id = req.user.user_id;
            const { startDate, endDate } = req.query;

            // First get doctor_id from user_id
            const doctorResult = await pool.query('SELECT doctor_id FROM doctors WHERE user_id = $1', [doctor_user_id]);

            if (doctorResult.rows.length === 0) {
                return next(new AppError('Doctor profile not found for this user', 404));
            }
            const doctor_id = doctorResult.rows[0].doctor_id;

            // Default to current date if not provided
            const start = startDate || new Date().toISOString().split('T')[0];
            const end = endDate || new Date().toISOString().split('T')[0];

            const client = await pool.connect();
            try {
                // 1. Summary Stats (Total Patients, Revenue, MLCs) - for this doctor only
                const summaryRes = await client.query(`
                    SELECT 
                        COUNT(*) as total_opd_visits,
                        COUNT(CASE WHEN o.is_mlc = true THEN 1 END) as total_mlc,
                        SUM(COALESCE(o.consultation_fee, 0)) as total_revenue,
                        COUNT(DISTINCT o.patient_id) as unique_patients
                    FROM opd_entries o
                    WHERE o.doctor_id = $1
                    AND o.visit_date >= $2::date AND o.visit_date <= $3::date
                `, [doctor_id, start, end]);

                // 2. Doctor Performance (just this doctor, but keeping same structure for frontend)
                const doctorRes = await client.query(`
                    SELECT 
                        d.first_name, 
                        d.last_name, 
                        d.specialization,
                        COUNT(o.opd_id) as patient_count,
                        SUM(COALESCE(o.consultation_fee, 0)) as revenue_generated
                    FROM opd_entries o
                    JOIN doctors d ON o.doctor_id = d.doctor_id
                    WHERE o.doctor_id = $1
                    AND o.visit_date >= $2::date AND o.visit_date <= $3::date
                    GROUP BY d.doctor_id, d.first_name, d.last_name, d.specialization
                `, [doctor_id, start, end]);

                // 3. Department Analysis (for this doctor's patients)
                const deptRes = await client.query(`
                    SELECT 
                        dp.department_name,
                        COUNT(o.opd_id) as patient_count
                    FROM opd_entries o
                    JOIN departments dp ON o.department_id = dp.department_id
                    WHERE o.doctor_id = $1
                    AND o.visit_date >= $2::date AND o.visit_date <= $3::date
                    GROUP BY dp.department_id, dp.department_name
                    ORDER BY patient_count DESC
                `, [doctor_id, start, end]);

                // 4. Daily Trend (within selected range, for this doctor)
                const trendRes = await client.query(`
                    SELECT 
                        TO_CHAR(o.visit_date, 'YYYY-MM-DD') as period_label,
                        COUNT(o.opd_id) as count
                    FROM opd_entries o
                    WHERE o.doctor_id = $1
                    AND o.visit_date >= $2::date AND o.visit_date <= $3::date
                    GROUP BY o.visit_date
                    ORDER BY o.visit_date ASC
                `, [doctor_id, start, end]);

                res.status(200).json({
                    status: 'success',
                    data: {
                        summary: summaryRes.rows[0],
                        doctorStats: doctorRes.rows,
                        deptStats: deptRes.rows,
                        trends: trendRes.rows
                    }
                });
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Get analytics error:', error);
            next(new AppError('Failed to fetch analytics', 500));
        }
    }

    /**
     * Get Dashboard Statistics for Logged-in Doctor
     * GET /api/doctors/dashboard-stats
     */
    static async getDashboardStats(req, res, next) {
        try {
            const doctor_user_id = req.user.user_id;

            // First get doctor_id from user_id
            const doctorResult = await pool.query('SELECT doctor_id FROM doctors WHERE user_id = $1', [doctor_user_id]);

            if (doctorResult.rows.length === 0) {
                return next(new AppError('Doctor profile not found for this user', 404));
            }
            const doctor_id = doctorResult.rows[0].doctor_id;

            const client = await pool.connect();
            try {
                const today = new Date().toISOString().split('T')[0];

                // Get all stats in parallel
                const [appointmentsRes, opdTodayRes, totalPatientsRes, opdTotalRes] = await Promise.all([
                    // Today's appointments
                    client.query(`
                        SELECT COUNT(*) as count
                        FROM appointments
                        WHERE doctor_id = $1 AND appointment_date = $2
                    `, [doctor_id, today]),

                    // Today's OPD entries
                    client.query(`
                        SELECT COUNT(*) as count
                        FROM opd_entries
                        WHERE doctor_id = $1 AND visit_date = $2
                    `, [doctor_id, today]),

                    // Total unique patients (lifetime)
                    client.query(`
                        SELECT COUNT(DISTINCT patient_id) as count
                        FROM opd_entries
                        WHERE doctor_id = $1
                    `, [doctor_id]),

                    // Total OPD entries (all time)
                    client.query(`
                        SELECT COUNT(*) as count
                        FROM opd_entries
                        WHERE doctor_id = $1
                    `, [doctor_id])
                ]);

                res.status(200).json({
                    status: 'success',
                    data: {
                        todayAppointments: parseInt(appointmentsRes.rows[0].count) || 0,
                        todayOpd: parseInt(opdTodayRes.rows[0].count) || 0,
                        totalPatients: parseInt(totalPatientsRes.rows[0].count) || 0,
                        consultationsIssued: parseInt(opdTotalRes.rows[0].count) || 0
                    }
                });
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Get dashboard stats error:', error);
            next(new AppError('Failed to fetch dashboard statistics', 500));
        }
    }
}

module.exports = DoctorController;
