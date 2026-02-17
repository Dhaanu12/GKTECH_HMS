const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'hms_database_beta',
    password: 'root',
    port: 5432,
});

async function verifyGrowth() {
    try {
        await client.connect();

        // 1. Get Today's Count
        const todayRes = await client.query(`
            SELECT COUNT(*) as count, CURRENT_DATE as date
            FROM opd_entries 
            WHERE visit_date = CURRENT_DATE
        `);
        const todayCount = parseInt(todayRes.rows[0].count);
        console.log(`Today (${todayRes.rows[0].date}): ${todayCount}`);

        // 2. Get Last Active Day Date
        const lastDayRes = await client.query(`
            SELECT MAX(visit_date) as last_date
            FROM opd_entries 
            WHERE visit_date < CURRENT_DATE
        `);
        const lastDate = lastDayRes.rows[0].last_date;
        console.log(`Last Active Day: ${lastDate}`);

        if (!lastDate) {
            console.log("No previous data found. Growth should be 100% (or 0% depending on interpretation of 'first day').");
            return;
        }

        // 3. Get Last Active Day Count
        const lastCountRes = await client.query(`
            SELECT COUNT(*) as count
            FROM opd_entries 
            WHERE visit_date = $1
        `, [lastDate]);
        const lastCount = parseInt(lastCountRes.rows[0].count);
        console.log(`Last Active Day Count: ${lastCount}`);

        // 4. Calculate Growth
        let growth = 0;
        if (lastCount > 0) {
            growth = Math.round(((todayCount - lastCount) / lastCount) * 100);
        } else {
            growth = todayCount > 0 ? 100 : 0;
        }

        console.log(`Calculated Growth: ${growth}%`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

verifyGrowth();
