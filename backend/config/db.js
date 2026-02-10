const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'hms_database_beta',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
  max: 30, // Maximum number of clients in the pool (increased from 20)
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds (increased from 2 seconds)
  query_timeout: 30000, // Query timeout 30 seconds
  statement_timeout: 30000, // Statement timeout 30 seconds
});

// Test the database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper function to execute queries
const query = (text, params) => pool.query(text, params);

// Helper function to get a client from the pool
const getClient = () => pool.connect();

module.exports = {
  pool,
  query,
  getClient,
};
