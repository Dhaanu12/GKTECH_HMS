const db = require('../config/db');

exports.createFeedback = async (req, res) => {
    try {
        const { patient_id, patient_name, mrn, service_context, rating, tags, comment, nurse_id } = req.body;

        // Auto-calculate sentiment
        let sentiment = 'Neutral';
        if (rating >= 4) sentiment = 'Positive';
        if (rating <= 2) sentiment = 'Negative';

        const newFeedback = await db.query(
            `INSERT INTO patient_feedback 
            (patient_id, patient_name, mrn, service_context, rating, tags, comment, nurse_id, sentiment) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING *`,
            [
                patient_id || null,
                patient_name,
                mrn,
                service_context,
                rating,
                JSON.stringify(tags),
                comment,
                nurse_id,
                sentiment
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            data: newFeedback.rows[0]
        });

    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

exports.getAllFeedback = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM patient_feedback ORDER BY created_at DESC');
        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
