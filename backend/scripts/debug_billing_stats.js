const { getClient } = require('../config/db');

async function debugBilling() {
    const client = await getClient();
    try {
        console.log('--- JSON DEBUG START ---');

        const timeRes = await client.query('SELECT CURRENT_DATE, CURRENT_TIMESTAMP, NOW()');

        // Fetch ALL bills created or billing_date is today
        // We use created_at as fallback to find if billing_date is wrong
        const allBills = await client.query(`
            SELECT 
                bill_master_id, 
                bill_number, 
                invoice_number,
                branch_id, 
                status, 
                payment_status, 
                payment_mode,
                total_amount, 
                paid_amount, 
                pending_amount, 
                TO_CHAR(billing_date, 'YYYY-MM-DD HH24:MI:SS') as billing_date_str,
                TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at_str
            FROM billing_master 
            WHERE DATE(created_at) = CURRENT_DATE OR DATE(billing_date) = CURRENT_DATE
        `);

        console.log(JSON.stringify({
            db_time: timeRes.rows[0],
            bills: allBills.rows
        }, null, 2));

        console.log('--- JSON DEBUG END ---');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
    }
}

debugBilling();
