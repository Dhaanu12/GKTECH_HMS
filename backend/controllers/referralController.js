const { query } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

class ReferralController {
    /**
     * Create referral hospital
     * POST /api/referrals/hospitals
     */
    static async createReferralHospital(req, res, next) {
        try {
            const {
                hospital_name, hospital_address, city, state,
                phone_number, email, hospital_type, specialties, type
            } = req.body;

            console.log('🏥 Creating referral hospital:', hospital_name);
            console.log('👤 User info:', {
                user_id: req.user.user_id,
                branch_id: req.user.branch_id,
                role: req.user.role
            });

            // Create the hospital
            const hospitalSql = `
                INSERT INTO referral_hospitals (
                    hospital_name, hospital_address, city, state,
                    phone_number, email, hospital_type, specialties, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `;

            const hospitalResult = await query(hospitalSql, [
                hospital_name, hospital_address, city, state,
                phone_number, email, hospital_type, specialties, req.user.user_id
            ]);

            const newHospital = hospitalResult.rows[0];
            console.log('✅ Hospital created with ID:', newHospital.referral_hospital_id);

            // Get branch_id from staff_branches table using staff_id from staff table
            let branch_id = null;
            try {
                const staffQuery = `
                    SELECT sb.branch_id 
                    FROM staff s
                    JOIN staff_branches sb ON s.staff_id = sb.staff_id
                    WHERE s.user_id = $1 
                    LIMIT 1
                `;
                console.log('📝 Executing staff query for user_id:', req.user.user_id);
                const staffResult = await query(staffQuery, [req.user.user_id]);

                branch_id = staffResult.rows[0]?.branch_id;
                console.log('👤 User info from staff_branches:', {
                    user_id: req.user.user_id,
                    branch_id: branch_id,
                    rows_found: staffResult.rows.length
                });
            } catch (staffError) {
                console.error('❌ Staff query error:', staffError.message);
                // Try alternative query without join
                try {
                    console.log('⚠️ Trying alternative: querying staff table directly');
                    const altQuery = `SELECT branch_id FROM staff WHERE user_id = $1 LIMIT 1`;
                    const altResult = await query(altQuery, [req.user.user_id]);
                    branch_id = altResult.rows[0]?.branch_id;
                    console.log('👤 Branch from staff table:', branch_id);
                } catch (altError) {
                    console.error('❌ Alternative query also failed:', altError.message);
                }
            }

            if (branch_id) {
                console.log('🔗 Creating mapping for branch_id:', branch_id);
                const mappingSql = `
                    INSERT INTO referral_hospital_mapping (
                        branch_id, referral_hospital_id, created_by
                    ) VALUES ($1, $2, $3)
                    ON CONFLICT (branch_id, referral_hospital_id) DO NOTHING
                    RETURNING *
                `;
                const mappingResult = await query(mappingSql, [branch_id, newHospital.referral_hospital_id, req.user.user_id]);
                console.log('✅ Mapping created:', mappingResult.rows[0]);
            } else {
                console.warn('⚠️ No branch_id found for user. Mapping not created.');
            }

            res.status(201).json({
                status: 'success',
                message: 'Referral hospital created and mapped to your branch',
                data: { referralHospital: newHospital }
            });
        } catch (error) {
            console.error('❌ Create referral hospital error:', error);
            next(new AppError('Failed to create referral hospital', 500));
        }
    }

    /**
     * Get all referral hospitals
     * GET /api/referrals/hospitals
     */
    static async getReferralHospitals(req, res, next) {
        try {
            // Get branch_id based on user role
            let branch_id = null;
            console.log('🔍 [GET Hospitals] Fetching branch_id for user_id:', req.user.user_id, 'role:', req.user.role);

            // Try doctor_branches first (for doctors)
            const doctorQuery = `
                SELECT db.branch_id 
                FROM doctors d
                JOIN doctor_branches db ON d.doctor_id = db.doctor_id
                WHERE d.user_id = $1 
                LIMIT 1
            `;
            const doctorResult = await query(doctorQuery, [req.user.user_id]);
            branch_id = doctorResult.rows[0]?.branch_id;

            // If not found, try staff_branches (for client admins)
            if (!branch_id) {
                const staffQuery = `
                    SELECT sb.branch_id 
                    FROM staff s
                    JOIN staff_branches sb ON s.staff_id = sb.staff_id
                    WHERE s.user_id = $1 
                    LIMIT 1
                `;
                const staffResult = await query(staffQuery, [req.user.user_id]);
                branch_id = staffResult.rows[0]?.branch_id;
            }

            console.log('🔍 [GET Hospitals] Found branch_id:', branch_id);

            if (!branch_id) {
                return res.status(200).json({
                    status: 'success',
                    data: { referralHospitals: [] }
                });
            }

            const { mapped_only } = req.query;

            // Only return hospitals that are mapped to this branch
            let sql = `
                SELECT rh.*, 
                       rhm.mapping_id,
                       true as is_mapped
                FROM referral_hospitals rh
                INNER JOIN referral_hospital_mapping rhm 
                    ON rh.referral_hospital_id = rhm.referral_hospital_id 
                    AND rhm.branch_id = $1
                WHERE rh.is_active = true
                ORDER BY rh.hospital_name ASC
            `;

            console.log('🔍 [GET Hospitals] Fetching hospitals for branch_id:', branch_id);
            const result = await query(sql, [branch_id]);
            console.log('🔍 [GET Hospitals] Found', result.rows.length, 'mapped hospitals');

            res.status(200).json({
                status: 'success',
                data: { referralHospitals: result.rows }
            });
        } catch (error) {
            console.error('Get referral hospitals error:', error);
            next(new AppError('Failed to fetch referral hospitals', 500));
        }
    }

    /**
     * Update referral hospital
     * PATCH /api/referrals/hospitals/:id
     */
    static async updateReferralHospital(req, res, next) {
        try {
            const { id } = req.params;
            const {
                hospital_name, hospital_address, city, state,
                phone_number, email, hospital_type, specialties, type
            } = req.body;

            const sql = `
                UPDATE referral_hospitals SET
                    hospital_name = COALESCE($1, hospital_name),
                    hospital_address = COALESCE($2, hospital_address),
                    city = COALESCE($3, city),
                    state = COALESCE($4, state),
                    phone_number = COALESCE($5, phone_number),
                    email = COALESCE($6, email),
                    hospital_type = COALESCE($7, hospital_type),
                    specialties = COALESCE($8, specialties),
                    updated_at = CURRENT_TIMESTAMP
                WHERE referral_hospital_id = $9
                RETURNING *
            `;

            const result = await query(sql, [
                hospital_name, hospital_address, city, state,
                phone_number, email, hospital_type, specialties, id
            ]);

            if (result.rows.length === 0) {
                return next(new AppError('Referral hospital not found', 404));
            }

            res.status(200).json({
                status: 'success',
                message: 'Referral hospital updated successfully',
                data: { referralHospital: result.rows[0] }
            });
        } catch (error) {
            console.error('Update referral hospital error:', error);
            next(new AppError('Failed to update referral hospital', 500));
        }
    }

    /**
     * Delete (deactivate) referral hospital
     * DELETE /api/referrals/hospitals/:id
     */
    static async deleteReferralHospital(req, res, next) {
        try {
            const { id } = req.params;

            const sql = `
                UPDATE referral_hospitals 
                SET is_active = false, updated_at = CURRENT_TIMESTAMP
                WHERE referral_hospital_id = $1
                RETURNING *
            `;

            const result = await query(sql, [id]);

            if (result.rows.length === 0) {
                return next(new AppError('Referral hospital not found', 404));
            }

            res.status(200).json({
                status: 'success',
                message: 'Referral hospital deleted successfully'
            });
        } catch (error) {
            console.error('Delete referral hospital error:', error);
            next(new AppError('Failed to delete referral hospital', 500));
        }
    }

    /**
     * Create referral doctor
     * POST /api/referrals/doctors
     */
    static async createReferralDoctor(req, res, next) {
        try {
            const {
                referral_hospital_id, doctor_name, specialization,
                department, phone_number, email, qualifications
            } = req.body;

            const sql = `
                INSERT INTO referral_doctors (
                    referral_hospital_id, doctor_name, specialization,
                    department, phone_number, email, qualifications, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;

            const result = await query(sql, [
                referral_hospital_id, doctor_name, specialization,
                department, phone_number, email, qualifications, req.user.user_id
            ]);

            res.status(201).json({
                status: 'success',
                message: 'Referral doctor created successfully',
                data: { referralDoctor: result.rows[0] }
            });
        } catch (error) {
            console.error('Create referral doctor error:', error);
            next(new AppError('Failed to create referral doctor', 500));
        }
    }

    /**
     * Get referral doctors
     * GET /api/referrals/doctors
     */
    static async getReferralDoctors(req, res, next) {
        try {
            // Get branch_id based on user role
            let branch_id = null;
            console.log('🔍 [GET Doctors] Fetching branch_id for user_id:', req.user.user_id, 'role:', req.user.role);

            // Try doctor_branches first (for doctors)
            const doctorQuery = `
                SELECT db.branch_id 
                FROM doctors d
                JOIN doctor_branches db ON d.doctor_id = db.doctor_id
                WHERE d.user_id = $1 
                LIMIT 1
            `;
            const doctorResult = await query(doctorQuery, [req.user.user_id]);
            branch_id = doctorResult.rows[0]?.branch_id;

            // If not found, try staff_branches (for client admins)
            if (!branch_id) {
                const staffQuery = `
                    SELECT sb.branch_id 
                    FROM staff s
                    JOIN staff_branches sb ON s.staff_id = sb.staff_id
                    WHERE s.user_id = $1 
                    LIMIT 1
                `;
                const staffResult = await query(staffQuery, [req.user.user_id]);
                branch_id = staffResult.rows[0]?.branch_id;
            }

            console.log('🔍 [GET Doctors] Found branch_id:', branch_id);

            if (!branch_id) {
                return res.status(200).json({
                    status: 'success',
                    data: { referralDoctors: [] }
                });
            }

            const { hospital_id } = req.query;

            // Only return doctors from hospitals mapped to this branch
            let sql = `
                SELECT rd.*, rh.hospital_name
                FROM referral_doctors rd
                JOIN referral_hospitals rh ON rd.referral_hospital_id = rh.referral_hospital_id
                JOIN referral_hospital_mapping rhm ON rh.referral_hospital_id = rhm.referral_hospital_id
                WHERE rd.is_active = true 
                AND rhm.branch_id = $1
            `;

            const params = [branch_id];

            if (hospital_id) {
                params.push(hospital_id);
                sql += ` AND rd.referral_hospital_id = $${params.length}`;
            }

            sql += ` ORDER BY rh.hospital_name ASC, rd.doctor_name ASC`;

            const result = await query(sql, params);

            res.status(200).json({
                status: 'success',
                data: { referralDoctors: result.rows }
            });
        } catch (error) {
            console.error('Get referral doctors error:', error);
            next(new AppError('Failed to fetch referral doctors', 500));
        }
    }

    /**
     * Update referral doctor
     * PATCH /api/referrals/doctors/:id
     */
    static async updateReferralDoctor(req, res, next) {
        try {
            const { id } = req.params;
            const {
                doctor_name, specialization, department,
                phone_number, email, qualifications
            } = req.body;

            const sql = `
                UPDATE referral_doctors SET
                    doctor_name = COALESCE($1, doctor_name),
                    specialization = COALESCE($2, specialization),
                    department = COALESCE($3, department),
                    phone_number = COALESCE($4, phone_number),
                    email = COALESCE($5, email),
                    qualifications = COALESCE($6, qualifications),
                    updated_at = CURRENT_TIMESTAMP
                WHERE referral_doctor_id = $7
                RETURNING *
            `;

            const result = await query(sql, [
                doctor_name, specialization, department,
                phone_number, email, qualifications, id
            ]);

            if (result.rows.length === 0) {
                return next(new AppError('Referral doctor not found', 404));
            }

            res.status(200).json({
                status: 'success',
                message: 'Referral doctor updated successfully',
                data: { referralDoctor: result.rows[0] }
            });
        } catch (error) {
            console.error('Update referral doctor error:', error);
            next(new AppError('Failed to update referral doctor', 500));
        }
    }

    /**
     * Delete (deactivate) referral doctor
     * DELETE /api/referrals/doctors/:id
     */
    static async deleteReferralDoctor(req, res, next) {
        try {
            const { id } = req.params;

            const sql = `
                UPDATE referral_doctors 
                SET is_active = false, updated_at = CURRENT_TIMESTAMP
                WHERE referral_doctor_id = $1
                RETURNING *
            `;

            const result = await query(sql, [id]);

            if (result.rows.length === 0) {
                return next(new AppError('Referral doctor not found', 404));
            }

            res.status(200).json({
                status: 'success',
                message: 'Referral doctor deleted successfully'
            });
        } catch (error) {
            console.error('Delete referral doctor error:', error);
            next(new AppError('Failed to delete referral doctor', 500));
        }
    }

    /**
     * Create hospital mapping
     * POST /api/referrals/mappings
     */
    static async createMapping(req, res, next) {
        try {
            const { referral_hospital_id } = req.body;
            const branch_id = req.user.branch_id;

            const sql = `
                INSERT INTO referral_hospital_mapping (
                    branch_id, referral_hospital_id, created_by
                ) VALUES ($1, $2, $3)
                ON CONFLICT (branch_id, referral_hospital_id) DO UPDATE
                SET is_active = true, created_at = CURRENT_TIMESTAMP
                RETURNING *
            `;

            const result = await query(sql, [branch_id, referral_hospital_id, req.user.user_id]);

            res.status(201).json({
                status: 'success',
                message: 'Hospital mapping created successfully',
                data: { mapping: result.rows[0] }
            });
        } catch (error) {
            console.error('Create mapping error:', error);
            next(new AppError('Failed to create hospital mapping', 500));
        }
    }

    /**
     * Delete hospital mapping
     * DELETE /api/referrals/mappings/:id
     */
    static async deleteMapping(req, res, next) {
        try {
            const { id } = req.params;

            const sql = `
                DELETE FROM referral_hospital_mapping 
                WHERE mapping_id = $1
                RETURNING *
            `;

            const result = await query(sql, [id]);

            if (result.rows.length === 0) {
                return next(new AppError('Mapping not found', 404));
            }

            res.status(200).json({
                status: 'success',
                message: 'Hospital mapping deleted successfully'
            });
        } catch (error) {
            console.error('Delete mapping error:', error);
            next(new AppError('Failed to delete hospital mapping', 500));
        }
    }
}

module.exports = ReferralController;
