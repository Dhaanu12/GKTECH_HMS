const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_NAME = process.env.DB_NAME || 'hms_database_v1';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD;

const backupDir = path.join(__dirname, 'backups');
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const fileName = `backup_${DB_NAME}_${timestamp}.sql`;
const filePath = path.join(backupDir, fileName);

console.log(`Starting backup for database: ${DB_NAME}`);
console.log(`Target file: ${filePath}`);

// Set PGPASSWORD environment variable to avoid password prompt
const env = { ...process.env, PGPASSWORD: DB_PASSWORD };

// pg_dump command
// -F p (plain text SQL)
// -b (include large objects)
// -v (verbose)
// -f (output file)
const cmd = `pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -F p -b -v -f "${filePath}" ${DB_NAME}`;

exec(cmd, { env }, (error, stdout, stderr) => {
    if (error) {
        console.error(`Backup failed: ${error.message}`);
        return;
    }
    if (stderr) {
        // pg_dump writes verbose output to stderr, verify if it's actually an error or just progress
        // console.error(`stderr: ${stderr}`); // Only log if needed, verbose output is huge
    }
    console.log(`Backup completed successfully!`);
    console.log(`File saved at: ${filePath}`);
});
