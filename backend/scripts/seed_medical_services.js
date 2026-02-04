/**
 * Database Seeding Script for Medical Services
 * Uses existing backend DB configuration to seed medical_services table
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Database configuration from environment (matching backend config)
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hms_db_13',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root'
});

async function seedMedicalServices() {
    const client = await pool.connect();

    try {
        console.log('Starting medical services seeding...');

        // Create the table
        await client.query(`
            CREATE TABLE IF NOT EXISTS medical_services (
                service_id SERIAL PRIMARY KEY,
                service_code VARCHAR(20),
                service_name TEXT NOT NULL,
                category VARCHAR(50) NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Table created/verified.');

        // Create indexes
        await client.query(`CREATE INDEX IF NOT EXISTS idx_medical_services_category ON medical_services(category);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_medical_services_name ON medical_services(service_name);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_medical_services_search ON medical_services USING gin(to_tsvector('english', service_name));`);
        console.log('Indexes created.');

        // Check if already seeded
        const countResult = await client.query('SELECT COUNT(*) FROM medical_services');
        const existingCount = parseInt(countResult.rows[0].count);

        if (existingCount > 0) {
            console.log(`Table already has ${existingCount} records. Skipping seeding.`);
            console.log('To re-seed, run: DELETE FROM medical_services;');
            return;
        }

        // Load the master JSON file
        const dataPath = path.join(__dirname, '..', 'data', 'medical_services_master.json');
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        console.log(`Loaded ${data.length} records from JSON.`);

        // Insert in batches of 100
        const batchSize = 100;
        let inserted = 0;

        for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, i + batchSize);

            const values = batch.map((item, idx) => {
                const offset = i + idx + 1;
                const code = `${item.category.substring(0, 3).toUpperCase()}-${String(item.id).padStart(4, '0')}`;
                // Clean name - replace newlines with spaces
                const name = item.name.replace(/[\r\n]+/g, ' ').trim();
                return `($${offset * 3 - 2}, $${offset * 3 - 1}, $${offset * 3})`;
            });

            // Build params array
            const params = [];
            batch.forEach(item => {
                const code = `${item.category.substring(0, 3).toUpperCase()}-${String(item.id).padStart(4, '0')}`;
                const name = item.name.replace(/[\r\n]+/g, ' ').trim();
                params.push(code, name, item.category);
            });

            // Build INSERT statement
            const placeholders = batch.map((_, idx) =>
                `($${idx * 3 + 1}, $${idx * 3 + 2}, $${idx * 3 + 3})`
            ).join(', ');

            await client.query(
                `INSERT INTO medical_services (service_code, service_name, category) VALUES ${placeholders}`,
                params
            );

            inserted += batch.length;
            console.log(`Inserted ${inserted}/${data.length} records...`);
        }

        console.log(`\nSeeding complete! Total records: ${inserted}`);

        // Show summary by category
        const summaryResult = await client.query(`
            SELECT category, COUNT(*) as count 
            FROM medical_services 
            GROUP BY category 
            ORDER BY count DESC
        `);

        console.log('\nSummary by category:');
        summaryResult.rows.forEach(row => {
            console.log(`  ${row.category}: ${row.count} items`);
        });

    } catch (error) {
        console.error('Seeding error:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the seeding
seedMedicalServices()
    .then(() => {
        console.log('\nMedical services database seeding completed successfully!');
        process.exit(0);
    })
    .catch(err => {
        console.error('\nSeeding failed:', err.message);
        process.exit(1);
    });
