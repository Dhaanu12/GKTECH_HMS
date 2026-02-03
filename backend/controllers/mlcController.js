const { pool } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

class MlcController {
    static async getMlcDetails(req, res, next) {
        try {
            const { opdId } = req.params;
            const result = await pool.query(`
                SELECT m.*, 
                       p.first_name, p.last_name, p.age, p.gender, p.address, p.city,
                       d.first_name as doctor_first_name, d.last_name as doctor_last_name, d.qualification, d.registration_number,
                       b.branch_name, b.address_line1 as branch_address, b.city as branch_city
                FROM mlc_entries m
                JOIN patients p ON m.patient_id = p.patient_id
                JOIN doctors d ON m.doctor_id = d.doctor_id
                LEFT JOIN branches b ON m.branch_id = b.branch_id
                WHERE m.opd_id = $1
            `, [opdId]);

            if (result.rows.length === 0) {
                // Check if OPD is MLC
                const opdCheck = await pool.query('SELECT is_mlc, attender_name FROM opd_entries WHERE opd_id = $1', [opdId]);
                if (opdCheck.rows.length > 0 && opdCheck.rows[0].is_mlc) {
                    return res.status(200).json({
                        status: 'success',
                        data: {
                            exists: false,
                            mlc: null,
                            suggestedData: {
                                brought_by: opdCheck.rows[0].attender_name
                            }
                        }
                    });
                }
                // If not MLC or not found at all, return null or specific message
                // Actually returning exists: false is better than 404 if we want to just say "no certificate yet"
                // But if OPD is NOT MLC, it should be an error?
                // Frontend only calls this if OPD is MLC.
                return res.status(200).json({
                    status: 'success',
                    data: { exists: false, mlc: null }
                });
            }

            res.status(200).json({
                status: 'success',
                data: {
                    exists: true,
                    mlc: result.rows[0]
                }
            });

        } catch (error) {
            console.error('Get MLC details error:', error);
            next(new AppError('Failed to fetch MLC details', 500));
        }
    }

    static async createOrUpdateMlc(req, res, next) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const {
                opd_id, patient_id,
                police_station, police_station_district, brought_by,
                history_alleged, injury_description, nature_of_injury, opinion,
                // Wound Cert Fields
                incident_date_time, alleged_cause, danger_to_life, age_of_injuries, treatment_given, remarks, examination_findings
            } = req.body;

            // Get doctor_id securely
            const userId = req.user.user_id;
            const doctorRes = await client.query('SELECT doctor_id FROM doctors WHERE user_id = $1', [userId]);
            if (doctorRes.rows.length === 0) throw new Error('Doctor profile not found');
            const doctor_id = doctorRes.rows[0].doctor_id;

            const branch_id = req.user.branch_id;

            // Check if exists
            const existing = await client.query('SELECT mlc_id FROM mlc_entries WHERE opd_id = $1', [opd_id]);

            let mlcResult;
            if (existing.rows.length > 0) {
                // Update
                const updateQuery = `
                    UPDATE mlc_entries 
                    SET police_station = $1, police_station_district = $2, brought_by = $3, 
                        history_alleged = $4, injury_description = $5, nature_of_injury = $6, opinion = $7,
                        incident_date_time = $8, alleged_cause = $9, danger_to_life = $10, 
                        age_of_injuries = $11, treatment_given = $12, remarks = $13, examination_findings = $14,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE opd_id = $15
                    RETURNING *
                `;
                mlcResult = await client.query(updateQuery, [
                    police_station, police_station_district, brought_by,
                    history_alleged, injury_description, nature_of_injury, opinion,
                    incident_date_time, alleged_cause, danger_to_life,
                    age_of_injuries, treatment_given, remarks, examination_findings,
                    opd_id
                ]);
            } else {
                // Create
                // Generate MLC Number
                const currentYear = new Date().getFullYear();
                const pattern = `MLC-${currentYear}-%`;
                const maxResult = await client.query(`
                    SELECT mlc_number FROM mlc_entries 
                    WHERE mlc_number LIKE $1 
                    ORDER BY mlc_id DESC 
                    LIMIT 1
                `, [pattern]);

                let nextSequence = 1;
                if (maxResult.rows.length > 0) {
                    const lastNumber = maxResult.rows[0].mlc_number;
                    const parts = lastNumber.split('-');
                    if (parts.length === 3) {
                        nextSequence = parseInt(parts[2]) + 1;
                    }
                }
                const mlc_number = `MLC-${currentYear}-${String(nextSequence).padStart(4, '0')}`;

                const insertQuery = `
                    INSERT INTO mlc_entries (
                        mlc_number, opd_id, patient_id, doctor_id, branch_id,
                        police_station, police_station_district, brought_by,
                        history_alleged, injury_description, nature_of_injury, opinion,
                        incident_date_time, alleged_cause, danger_to_life, 
                        age_of_injuries, treatment_given, remarks, examination_findings
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
                    RETURNING *
                `;
                mlcResult = await client.query(insertQuery, [
                    mlc_number, opd_id, patient_id, doctor_id, branch_id,
                    police_station, police_station_district, brought_by,
                    history_alleged, injury_description, nature_of_injury, opinion,
                    incident_date_time, alleged_cause, danger_to_life,
                    age_of_injuries, treatment_given, remarks, examination_findings
                ]);
            }

            await client.query('COMMIT');

            // Re-fetch with details for response
            const finalQuery = `
                SELECT m.*, 
                       p.first_name, p.last_name, p.age, p.gender, p.address, p.city,
                       d.first_name as doctor_first_name, d.last_name as doctor_last_name, d.qualification, d.registration_number,
                       b.branch_name, b.address_line1 as branch_address, b.city as branch_city
                FROM mlc_entries m
                JOIN patients p ON m.patient_id = p.patient_id
                JOIN doctors d ON m.doctor_id = d.doctor_id
                LEFT JOIN branches b ON m.branch_id = b.branch_id
                WHERE m.mlc_id = $1
            `;
            const finalResult = await pool.query(finalQuery, [mlcResult.rows[0].mlc_id]);

            res.status(200).json({
                status: 'success',
                message: 'MLC entry saved successfully',
                data: { mlc: finalResult.rows[0] }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Save MLC Error:', error);
            next(new AppError('Failed to save MLC entry', 500));
        } finally {
            client.release();
        }
    }
}

module.exports = MlcController;
