const { pool } = require('./config/db');

async function testReceptionistQuery() {
    const client = await pool.connect();
    try {
        console.log('Testing Receptionist Query...\n');

        // Test with a sample hospital_id and date range
        const hospital_id = 1; // Adjust as needed
        const startDate = '2026-01-01';
        const endDate = '2026-12-31';

        const query = `
            SELECT 
                s.staff_id as id,
                s.first_name,
                s.last_name,
                'Receptionist' as role_detail,
                -- Total Actions (Bookings + Checkins)
                (
                    (SELECT COUNT(*) FROM appointments a 
                     WHERE a.appointment_date >= $2::date AND a.appointment_date <= $3::date 
                     AND a.confirmed_by = s.user_id)
                    +
                    (SELECT COUNT(*) FROM opd_entries o 
                     WHERE o.visit_date >= $2::date AND o.visit_date <= $3::date 
                     AND o.checked_in_by IS NOT NULL 
                     AND o.checked_in_by ~ '^[0-9]+$'
                     AND o.checked_in_by::INTEGER = s.user_id)
                ) as task_count,
                -- Primary Performance Metric (Cancellations + No-shows handled/recorded)
                (SELECT COUNT(*) FROM appointments a 
                 WHERE a.appointment_date >= $2::date AND a.appointment_date <= $3::date 
                 AND (a.cancelled_by = s.user_id OR (a.confirmed_by = s.user_id AND a.appointment_status = 'No-show'))) as performance_metric,
                 
                 -- Detailed Breakdown
                 (SELECT COUNT(*) FROM appointments a WHERE a.confirmed_by = s.user_id AND a.appointment_date >= $2::date AND a.appointment_date <= $3::date) as total_confirmed,
                 (SELECT COUNT(*) FROM opd_entries o WHERE o.checked_in_by IS NOT NULL AND o.checked_in_by ~ '^[0-9]+$' AND o.checked_in_by::INTEGER = s.user_id AND o.visit_date >= $2::date AND o.visit_date <= $3::date) as opd_checkins,
                 (SELECT COUNT(*) FROM appointments a WHERE a.confirmed_by = s.user_id AND a.appointment_status = 'No-show' AND a.appointment_date >= $2::date AND a.appointment_date <= $3::date) as no_show_count,
                 (SELECT COUNT(*) FROM appointments a WHERE a.cancelled_by = s.user_id AND a.appointment_date >= $2::date AND a.appointment_date <= $3::date) as cancellations_handled
            FROM staff s
            JOIN staff_branches sb ON s.staff_id = sb.staff_id
            JOIN branches b ON sb.branch_id = b.branch_id
            WHERE b.hospital_id = $1 AND s.staff_type = 'RECEPTIONIST'
            GROUP BY s.staff_id, s.first_name, s.last_name, s.user_id
        `;

        console.log('Executing query with params:', { hospital_id, startDate, endDate });
        const result = await client.query(query, [hospital_id, startDate, endDate]);

        console.log('\n✅ Query executed successfully!');
        console.log(`Found ${result.rows.length} receptionists\n`);

        result.rows.forEach((row, index) => {
            console.log(`${index + 1}. ${row.first_name} ${row.last_name}`);
            console.log(`   - Task Count: ${row.task_count}`);
            console.log(`   - Performance Metric: ${row.performance_metric}`);
            console.log(`   - Total Confirmed: ${row.total_confirmed}`);
            console.log(`   - OPD Checkins: ${row.opd_checkins}`);
            console.log(`   - No Shows: ${row.no_show_count}`);
            console.log(`   - Cancellations: ${row.cancellations_handled}\n`);
        });

    } catch (error) {
        console.error('\n❌ Error executing query:');
        console.error('Error Message:', error.message);
        console.error('Error Detail:', error.detail);
        console.error('Error Code:', error.code);
        console.error('Error Position:', error.position);
        console.error('\nFull error:', error);
    } finally {
        client.release();
        process.exit(0);
    }
}

testReceptionistQuery();
