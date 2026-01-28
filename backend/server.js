const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const db = require('./config/db');
const { initializeDatabase } = require('./config/initDb');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Initialize Express app
const app = express();

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
}));

app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // HTTP request logger

// Initialize database (creates tables if they don't exist)
(async () => {
    try {
        await db.query('SELECT NOW()');
        console.log('✅ Connected to PostgreSQL database');

        // Auto-initialize database schema and seed data
        await initializeDatabase();

    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    }
})();

// Mount API routes
app.use('/api', routes);
app.use('/uploads', express.static('uploads'));

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`📍 API available at http://localhost:${PORT}/api`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});
