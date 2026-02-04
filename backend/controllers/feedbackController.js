const db = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

/**
 * Create new patient feedback
 * POST /api/feedback
 */
exports.createFeedback = async (req, res) => {
    try {
        const { 
            patient_id, 
            patient_name, 
            mrn, 
            service_context, 
            rating, 
            tags, 
            comment,
            opd_id 
        } = req.body;

        // Get nurse_id and branch_id from authenticated user
        const nurse_id = req.userId;
        const branch_id = req.user?.branch_id;

        // Auto-calculate sentiment
        let sentiment = 'Neutral';
        if (rating >= 4) sentiment = 'Positive';
        if (rating <= 2) sentiment = 'Negative';

        const newFeedback = await db.query(
            `INSERT INTO patient_feedback 
            (patient_id, patient_name, mrn, service_context, rating, tags, comment, nurse_id, sentiment, branch_id, opd_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
            RETURNING *`,
            [
                patient_id || null,
                patient_name,
                mrn || null,
                service_context,
                rating,
                JSON.stringify(tags || []),
                comment,
                nurse_id,
                sentiment,
                branch_id || null,
                opd_id || null
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

/**
 * Get all feedback with filtering, pagination, and nurse name
 * GET /api/feedback
 * Query params: page, limit, sentiment, startDate, endDate, addressed
 */
exports.getAllFeedback = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 50, 
            sentiment, 
            startDate, 
            endDate, 
            addressed,
            search 
        } = req.query;
        
        const branch_id = req.user?.branch_id;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        let whereConditions = [];
        let values = [];
        let paramCount = 1;

        // Branch filtering (if user has branch_id)
        if (branch_id) {
            whereConditions.push(`pf.branch_id = $${paramCount++}`);
            values.push(branch_id);
        }

        // Sentiment filter
        if (sentiment && sentiment !== 'All') {
            if (sentiment === 'Critical') {
                whereConditions.push(`(pf.sentiment = 'Negative' OR pf.rating <= 2)`);
            } else if (sentiment === 'Suggestions') {
                whereConditions.push(`(pf.sentiment = 'Neutral' OR pf.rating = 3)`);
            } else {
                whereConditions.push(`pf.sentiment = $${paramCount++}`);
                values.push(sentiment);
            }
        }

        // Date range filter
        if (startDate) {
            whereConditions.push(`pf.created_at >= $${paramCount++}`);
            values.push(startDate);
        }
        if (endDate) {
            whereConditions.push(`pf.created_at <= $${paramCount++}`);
            values.push(endDate + ' 23:59:59');
        }

        // Addressed filter
        if (addressed !== undefined && addressed !== '') {
            whereConditions.push(`pf.is_addressed = $${paramCount++}`);
            values.push(addressed === 'true');
        }

        // Search filter
        if (search) {
            whereConditions.push(`(
                pf.patient_name ILIKE $${paramCount} OR 
                pf.mrn ILIKE $${paramCount} OR 
                pf.comment ILIKE $${paramCount}
            )`);
            values.push(`%${search}%`);
            paramCount++;
        }

        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ') 
            : '';

        // Get feedback with nurse name
        const query = `
            SELECT 
                pf.*,
                u.username as collected_by_name,
                COALESCE(n.first_name || ' ' || n.last_name, u.username) as nurse_name,
                au.username as addressed_by_name
            FROM patient_feedback pf
            LEFT JOIN users u ON pf.nurse_id = u.user_id
            LEFT JOIN nurses n ON u.user_id = n.user_id
            LEFT JOIN users au ON pf.addressed_by = au.user_id
            ${whereClause}
            ORDER BY pf.created_at DESC
            LIMIT $${paramCount++} OFFSET $${paramCount}
        `;
        values.push(parseInt(limit), offset);

        const result = await db.query(query, values);

        // Get total count for pagination
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM patient_feedback pf 
            ${whereClause}
        `;
        const countResult = await db.query(countQuery, values.slice(0, -2));
        const total = parseInt(countResult.rows[0].total);

        // Get statistics
        const statsQuery = `
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE sentiment = 'Positive') as positive,
                COUNT(*) FILTER (WHERE sentiment = 'Negative') as negative,
                COUNT(*) FILTER (WHERE sentiment = 'Neutral') as neutral,
                COUNT(*) FILTER (WHERE is_addressed = true) as addressed,
                ROUND(AVG(rating)::numeric, 1) as avg_rating
            FROM patient_feedback pf
            ${branch_id ? 'WHERE branch_id = $1' : ''}
        `;
        const statsResult = await db.query(statsQuery, branch_id ? [branch_id] : []);

        res.status(200).json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            },
            stats: statsResult.rows[0]
        });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Get single feedback by ID
 * GET /api/feedback/:id
 */
exports.getFeedbackById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(`
            SELECT 
                pf.*,
                u.username as collected_by_name,
                COALESCE(n.first_name || ' ' || n.last_name, u.username) as nurse_name,
                au.username as addressed_by_name
            FROM patient_feedback pf
            LEFT JOIN users u ON pf.nurse_id = u.user_id
            LEFT JOIN nurses n ON u.user_id = n.user_id
            LEFT JOIN users au ON pf.addressed_by = au.user_id
            WHERE pf.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        res.status(200).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Update feedback
 * PATCH /api/feedback/:id
 */
exports.updateFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            patient_name, 
            service_context, 
            rating, 
            tags, 
            comment 
        } = req.body;

        // Recalculate sentiment if rating changed
        let sentiment = undefined;
        if (rating !== undefined) {
            sentiment = 'Neutral';
            if (rating >= 4) sentiment = 'Positive';
            if (rating <= 2) sentiment = 'Negative';
        }

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (patient_name !== undefined) {
            updates.push(`patient_name = $${paramCount++}`);
            values.push(patient_name);
        }
        if (service_context !== undefined) {
            updates.push(`service_context = $${paramCount++}`);
            values.push(service_context);
        }
        if (rating !== undefined) {
            updates.push(`rating = $${paramCount++}`);
            values.push(rating);
            updates.push(`sentiment = $${paramCount++}`);
            values.push(sentiment);
        }
        if (tags !== undefined) {
            updates.push(`tags = $${paramCount++}`);
            values.push(JSON.stringify(tags));
        }
        if (comment !== undefined) {
            updates.push(`comment = $${paramCount++}`);
            values.push(comment);
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const result = await db.query(`
            UPDATE patient_feedback 
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Feedback updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Mark feedback as addressed with follow-up notes
 * PATCH /api/feedback/:id/address
 */
exports.addressFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const { follow_up_notes, is_addressed = true } = req.body;
        const addressed_by = req.userId;

        const result = await db.query(`
            UPDATE patient_feedback 
            SET 
                is_addressed = $1,
                addressed_at = CASE WHEN $1 = true THEN CURRENT_TIMESTAMP ELSE NULL END,
                addressed_by = CASE WHEN $1 = true THEN $2 ELSE NULL END,
                follow_up_notes = COALESCE($3, follow_up_notes),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING *
        `, [is_addressed, addressed_by, follow_up_notes, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        res.status(200).json({
            success: true,
            message: is_addressed ? 'Feedback marked as addressed' : 'Feedback marked as pending',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error addressing feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Delete feedback
 * DELETE /api/feedback/:id
 */
exports.deleteFeedback = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'DELETE FROM patient_feedback WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Feedback deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Get feedback statistics and trends
 * GET /api/feedback/stats/trends
 */
exports.getFeedbackTrends = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const branch_id = req.user?.branch_id;

        const branchFilter = branch_id ? 'AND branch_id = $1' : '';
        const values = branch_id ? [branch_id, parseInt(days)] : [parseInt(days)];
        const daysParam = branch_id ? '$2' : '$1';

        // Daily sentiment trends
        const trendsQuery = `
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE sentiment = 'Positive') as positive,
                COUNT(*) FILTER (WHERE sentiment = 'Negative') as negative,
                COUNT(*) FILTER (WHERE sentiment = 'Neutral') as neutral,
                ROUND(AVG(rating)::numeric, 1) as avg_rating
            FROM patient_feedback
            WHERE created_at >= NOW() - INTERVAL '1 day' * ${daysParam}
            ${branchFilter}
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `;

        const trendsResult = await db.query(trendsQuery, values);

        // Top tags
        const tagsQuery = `
            SELECT tag, COUNT(*) as count
            FROM (
                SELECT jsonb_array_elements_text(tags::jsonb) as tag
                FROM patient_feedback
                WHERE created_at >= NOW() - INTERVAL '1 day' * ${daysParam}
                ${branchFilter}
                AND tags IS NOT NULL AND tags != '[]'
            ) t
            GROUP BY tag
            ORDER BY count DESC
            LIMIT 10
        `;

        let tagsResult = { rows: [] };
        try {
            tagsResult = await db.query(tagsQuery, values);
        } catch (e) {
            // Tags might not be valid JSON in all cases
            console.log('Tags query failed:', e.message);
        }

        res.status(200).json({
            success: true,
            data: {
                trends: trendsResult.rows,
                topTags: tagsResult.rows
            }
        });
    } catch (error) {
        console.error('Error fetching feedback trends:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Export feedback to CSV
 * GET /api/feedback/export
 */
exports.exportFeedback = async (req, res) => {
    try {
        const { startDate, endDate, sentiment } = req.query;
        const branch_id = req.user?.branch_id;

        let whereConditions = [];
        let values = [];
        let paramCount = 1;

        if (branch_id) {
            whereConditions.push(`pf.branch_id = $${paramCount++}`);
            values.push(branch_id);
        }

        if (startDate) {
            whereConditions.push(`pf.created_at >= $${paramCount++}`);
            values.push(startDate);
        }
        if (endDate) {
            whereConditions.push(`pf.created_at <= $${paramCount++}`);
            values.push(endDate + ' 23:59:59');
        }
        if (sentiment && sentiment !== 'All') {
            whereConditions.push(`pf.sentiment = $${paramCount++}`);
            values.push(sentiment);
        }

        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ') 
            : '';

        const query = `
            SELECT 
                pf.id,
                pf.patient_name,
                pf.mrn,
                pf.service_context,
                pf.rating,
                pf.sentiment,
                pf.comment,
                pf.tags,
                pf.is_addressed,
                pf.follow_up_notes,
                pf.created_at,
                COALESCE(n.first_name || ' ' || n.last_name, u.username) as collected_by
            FROM patient_feedback pf
            LEFT JOIN users u ON pf.nurse_id = u.user_id
            LEFT JOIN nurses n ON u.user_id = n.user_id
            ${whereClause}
            ORDER BY pf.created_at DESC
        `;

        const result = await db.query(query, values);

        // Convert to CSV
        const headers = [
            'ID', 'Patient Name', 'MRN', 'Service Context', 'Rating', 
            'Sentiment', 'Comment', 'Tags', 'Addressed', 'Follow-up Notes', 
            'Created At', 'Collected By'
        ];

        let csv = headers.join(',') + '\n';

        result.rows.forEach(row => {
            const values = [
                row.id,
                `"${(row.patient_name || '').replace(/"/g, '""')}"`,
                row.mrn || '',
                row.service_context || '',
                row.rating,
                row.sentiment,
                `"${(row.comment || '').replace(/"/g, '""')}"`,
                `"${row.tags || '[]'}"`,
                row.is_addressed ? 'Yes' : 'No',
                `"${(row.follow_up_notes || '').replace(/"/g, '""')}"`,
                row.created_at,
                `"${(row.collected_by || '').replace(/"/g, '""')}"`
            ];
            csv += values.join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=feedback_export_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);

    } catch (error) {
        console.error('Error exporting feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
