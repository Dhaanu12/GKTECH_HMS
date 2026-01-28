const { pool } = require('../config/db');

// @desc    Create a new lead
// @route   POST /api/leads
// @access  Public
const createLead = async (req, res) => {
    try {
        const { name, mobile_number, hospital_name, address, email, description, demo_date } = req.body;

        // Validation
        if (!name || !mobile_number) {
            return res.status(400).json({
                success: false,
                message: 'Name and Mobile Number are required fields.'
            });
        }

        if (mobile_number.length > 10) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number cannot exceed 10 digits.'
            });
        }

        const query = `
            INSERT INTO lead_data (name, mobile_number, hospital_name, address, email, description, demo_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;

        const values = [name, mobile_number, hospital_name, address, email, description, demo_date];
        const result = await pool.query(query, values);

        res.status(201).json({
            success: true,
            message: 'Lead submitted successfully',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error creating lead:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: Unable to save lead information.'
        });
    }
};

module.exports = {
    createLead
};
