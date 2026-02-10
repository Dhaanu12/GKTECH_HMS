const { pool } = require('../config/db');

async function killIdleConnections() {
    const client = await pool.connect();
    try {
        console.log('🔧 Checking database connections...\n');

        // Get current connection count
        const countResult = await client.query(`
            SELECT count(*) as total_connections 
            FROM pg_stat_activity 
            WHERE datname = current_database()
        `);
        console.log(`Total connections to database: ${countResult.rows[0].total_connections}`);

        // Show active connections
        const activeResult = await client.query(`
            SELECT pid, usename, application_name, state, state_change 
            FROM pg_stat_activity 
            WHERE datname = current_database()
            ORDER BY state_change DESC
        `);

        console.log('\nActive connections:');
        activeResult.rows.forEach(row => {
            console.log(`  PID: ${row.pid}, User: ${row.usename}, App: ${row.application_name}, State: ${row.state}`);
        });

        // Kill idle connections (except current one)
        const killResult = await client.query(`
            SELECT pg_terminate_backend(pid) 
            FROM pg_stat_activity 
            WHERE datname = current_database()
                AND pid <> pg_backend_pid()
                AND state = 'idle'
                AND state_change < NOW() - INTERVAL '5 minutes'
        `);

        console.log(`\n✅ Terminated ${killResult.rowCount} idle connections`);

        // Get new connection count
        const newCountResult = await client.query(`
            SELECT count(*) as total_connections 
            FROM pg_stat_activity 
            WHERE datname = current_database()
        `);
        console.log(`New total connections: ${newCountResult.rows[0].total_connections}`);

        console.log('\n✅ Database connection cleanup complete!');
        console.log('You can now try logging in again.');

    } catch (error) {
        console.error('❌ Error cleaning up connections:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

killIdleConnections()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
