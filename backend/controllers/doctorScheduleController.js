const db = require('../config/db');

exports.createSchedule = async (req, res, next) => {
    try {
        const { doctor_id, branch_id, day_of_week, start_time, end_time, avg_consultation_time } = req.body;

        const query = `
            INSERT INTO doctor_weekly_schedules 
            (doctor_id, branch_id, day_of_week, start_time, end_time, avg_consultation_time)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (doctor_id, branch_id, day_of_week, start_time) 
            DO UPDATE SET 
                end_time = EXCLUDED.end_time,
                avg_consultation_time = EXCLUDED.avg_consultation_time,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;

        const result = await db.query(query, [
            doctor_id, branch_id, day_of_week, start_time, end_time, avg_consultation_time || 15
        ]);

        res.status(201).json({
            status: 'success',
            data: { schedule: result.rows[0] }
        });
    } catch (error) {
        next(error);
    }
};

exports.getDoctorSchedule = async (req, res, next) => {
    try {
        const { doctor_id, branch_id } = req.params;
        const query = `
            SELECT * FROM doctor_weekly_schedules 
            WHERE doctor_id = $1 AND branch_id = $2 AND is_active = true
            ORDER BY 
                CASE 
                    WHEN day_of_week = 'Monday' THEN 1
                    WHEN day_of_week = 'Tuesday' THEN 2
                    WHEN day_of_week = 'Wednesday' THEN 3
                    WHEN day_of_week = 'Thursday' THEN 4
                    WHEN day_of_week = 'Friday' THEN 5
                    WHEN day_of_week = 'Saturday' THEN 6
                    WHEN day_of_week = 'Sunday' THEN 7
                END,
                start_time ASC;
        `;
        const result = await db.query(query, [doctor_id, branch_id]);

        res.status(200).json({
            status: 'success',
            data: { schedules: result.rows }
        });
    } catch (error) {
        next(error);
    }
};

exports.getAllSchedules = async (req, res, next) => {
    try {
        const { branch_id } = req.query;

        let query = `
            SELECT dws.*, d.first_name, d.last_name, d.specialization
            FROM doctor_weekly_schedules dws
            JOIN doctors d ON dws.doctor_id = d.doctor_id
            WHERE dws.is_active = true
        `;

        const params = [];
        if (branch_id) {
            query += ` AND dws.branch_id = $1`;
            params.push(branch_id);
        }

        query += ` ORDER BY dws.doctor_id, 
            CASE 
                WHEN day_of_week = 'Monday' THEN 1
                WHEN day_of_week = 'Tuesday' THEN 2
                WHEN day_of_week = 'Wednesday' THEN 3
                WHEN day_of_week = 'Thursday' THEN 4
                WHEN day_of_week = 'Friday' THEN 5
                WHEN day_of_week = 'Saturday' THEN 6
                WHEN day_of_week = 'Sunday' THEN 7
            END,
            start_time ASC;
        `;

        const result = await db.query(query, params);

        res.status(200).json({
            status: 'success',
            results: result.rows.length,
            data: { schedules: result.rows }
        });
    } catch (error) {
        next(error);
    }
};

exports.getAvailableDoctorsByDate = async (req, res, next) => {
    try {
        const { date, branch_id } = req.query; // date in YYYY-MM-DD format

        if (!date || !branch_id) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide date and branch_id'
            });
        }

        const inputDate = new Date(date);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeek = days[inputDate.getDay()];

        const query = `
            SELECT 
                d.doctor_id, 
                d.first_name, 
                d.last_name, 
                d.specialization, 
                d.profile_photo,
                ds.shift_date as today_shift_date,
                ds.attendance_status,
                dws.start_time,
                dws.end_time,
                dws.avg_consultation_time
            FROM doctors d
            JOIN doctor_weekly_schedules dws ON d.doctor_id = dws.doctor_id
            LEFT JOIN doctor_shifts ds ON d.doctor_id = ds.doctor_id AND ds.shift_date = $1
            WHERE dws.day_of_week = $2 
            AND dws.branch_id = $3
            AND d.is_active = true
            AND dws.is_active = true
            ORDER BY dws.start_time ASC;
        `;

        const result = await db.query(query, [date, dayOfWeek, branch_id]);

        res.status(200).json({
            status: 'success',
            results: result.rows.length,
            data: { doctors: result.rows, day: dayOfWeek, date: date }
        });

    } catch (error) {
        next(error);
    }
};

exports.deleteSchedule = async (req, res, next) => {
    try {
        const { schedule_id } = req.params;
        await db.query('DELETE FROM doctor_weekly_schedules WHERE schedule_id = $1', [schedule_id]);
        res.status(204).json({ status: 'success', data: null });
    } catch (error) {
        next(error);
    }
};
