const { Client } = require('pg');

async function clearDB() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'hms_database_beta',
        user: 'postgres',
        password: 'root'
    });

    try {
        await client.connect();

        // Use CASCADE to handle any foreign key dependencies
        const query = `
            TRUNCATE TABLE 
                bill_details,
                billing_master,
                opd_entries,
                appointments,
                patients
            CASCADE;
        `;

        await client.query(query);
        console.log("Successfully truncated patients, opd_entries, appointments, and billing tables!");
    } catch (err) {
        console.error("Error clearing database tables:", err);
    } finally {
        await client.end();
    }
}

clearDB();
