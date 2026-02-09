const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { aiRateLimiter, getRateLimitStatus } = require('../middleware/aiRateLimiter');
const aiService = require('../services/aiService');

// Apply authentication and rate limiting to all AI routes
router.use(authenticate);
router.use(aiRateLimiter);

/**
 * POST /api/ai/chat
 * General conversational AI assistant with database lookup capability
 */
router.post('/chat', async (req, res) => {
    try {
        const { messages, context, useTools = true } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Messages array is required',
            });
        }

        // Add context to system prompt if provided
        let systemPrompt = aiService.SYSTEM_PROMPTS.general;
        if (context) {
            systemPrompt += `\n\nCurrent context: User is on the ${context.page || 'unknown'} page as a ${context.role || 'staff member'}.`;
            if (context.patientInfo) {
                systemPrompt += `\nViewing patient: ${context.patientInfo}`;
            }
        }

        // Get the auth token for tool execution
        const authToken = req.headers.authorization;

        // Use agentChat for tool-enabled conversations, otherwise use regular chat
        const result = useTools 
            ? await aiService.agentChat(messages, { systemPrompt, authToken })
            : await aiService.chat(messages, { systemPrompt });

        res.json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        console.error('AI chat error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to process AI request',
        });
    }
});

/**
 * POST /api/ai/chat/stream
 * Streaming chat for real-time responses with database lookup capability
 * Note: Tool calls are executed before streaming the final response
 */
router.post('/chat/stream', async (req, res) => {
    try {
        const { messages, context, useTools = true } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Messages array is required',
            });
        }

        // Set up SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        let systemPrompt = aiService.SYSTEM_PROMPTS.general;
        if (context) {
            systemPrompt += `\n\nCurrent context: User is on the ${context.page || 'unknown'} page as a ${context.role || 'staff member'}.`;
            if (context.patientInfo) {
                systemPrompt += `\nViewing patient: ${context.patientInfo}`;
            }
        }

        // Get the auth token for tool execution
        const authToken = req.headers.authorization;

        if (useTools) {
            // Use agentChat to handle tool calls first, then send the result
            // This ensures data lookup happens before responding
            const result = await aiService.agentChat(messages, { systemPrompt, authToken });
            
            if (result.success && result.message) {
                // Stream the response character by character for a streaming effect
                const words = result.message.split(' ');
                for (let i = 0; i < words.length; i++) {
                    const chunk = (i === 0 ? '' : ' ') + words[i];
                    res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
                    // Small delay for streaming effect
                    await new Promise(resolve => setTimeout(resolve, 20));
                }
            } else if (!result.success) {
                res.write(`data: ${JSON.stringify({ content: result.message || 'AI service unavailable.' })}\n\n`);
            }
        } else {
            // Regular streaming without tools
            const stream = aiService.streamChat(messages, { systemPrompt });

            for await (const chunk of stream) {
                res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
            }
        }

        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error) {
        console.error('AI stream error:', error);
        res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
        res.end();
    }
});

/**
 * POST /api/ai/analyze-vitals
 * Analyze patient vitals for trends and anomalies
 */
router.post('/analyze-vitals', async (req, res) => {
    try {
        const { vitals, patientInfo } = req.body;

        if (!vitals || !Array.isArray(vitals)) {
            return res.status(400).json({
                status: 'error',
                message: 'Vitals array is required',
            });
        }

        const vitalsData = {
            patientInfo: patientInfo || {},
            readings: vitals.map(v => ({
                recordedAt: v.recorded_at,
                heartRate: v.heart_rate,
                bloodPressureSystolic: v.blood_pressure_systolic,
                bloodPressureDiastolic: v.blood_pressure_diastolic,
                temperature: v.temperature,
                oxygenSaturation: v.oxygen_saturation,
                respiratoryRate: v.respiratory_rate,
                weight: v.weight,
                height: v.height,
                bloodGlucose: v.blood_glucose,
                painLevel: v.pain_level,
            })),
        };

        const result = await aiService.analyzeVitals(vitalsData);

        res.json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        console.error('AI vitals analysis error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to analyze vitals',
        });
    }
});

/**
 * POST /api/ai/interpret-lab
 * Interpret lab results in plain language
 */
router.post('/interpret-lab', async (req, res) => {
    try {
        const { testName, resultSummary, results, referenceRanges } = req.body;

        if (!testName && !resultSummary && !results) {
            return res.status(400).json({
                status: 'error',
                message: 'Test name, result summary, or results are required',
            });
        }

        const labData = {
            testName,
            resultSummary,
            results,
            referenceRanges,
        };

        const result = await aiService.interpretLabResults(labData);

        res.json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        console.error('AI lab interpretation error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to interpret lab results',
        });
    }
});

/**
 * POST /api/ai/suggest-notes
 * Assist with clinical note writing
 */
router.post('/suggest-notes', async (req, res) => {
    try {
        const { content, action } = req.body;

        if (!content) {
            return res.status(400).json({
                status: 'error',
                message: 'Note content is required',
            });
        }

        const noteData = {
            content,
            action: action || 'improve', // 'improve', 'summarize', 'expand'
        };

        const result = await aiService.suggestNotes(noteData);

        res.json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        console.error('AI notes suggestion error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to generate note suggestions',
        });
    }
});

/**
 * POST /api/ai/summarize-patient
 * Generate patient summary for handoff
 */
router.post('/summarize-patient', async (req, res) => {
    try {
        const { patient, vitals, labs, notes, conditions } = req.body;

        if (!patient) {
            return res.status(400).json({
                status: 'error',
                message: 'Patient information is required',
            });
        }

        const patientData = {
            name: `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown',
            age: patient.age || calculateAge(patient.date_of_birth),
            gender: patient.gender,
            mrn: patient.mrn,
            vitals: vitals || [],
            labs: labs || [],
            notes: notes || '',
            conditions: conditions || patient.medical_history || '',
        };

        const result = await aiService.summarizePatient(patientData);

        res.json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        console.error('AI patient summary error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to generate patient summary',
        });
    }
});

/**
 * POST /api/ai/analyze-feedback
 * Analyze patient feedback for sentiment and themes
 */
router.post('/analyze-feedback', async (req, res) => {
    try {
        const { rating, comment, tags } = req.body;

        if (!comment && !rating) {
            return res.status(400).json({
                status: 'error',
                message: 'Rating or comment is required',
            });
        }

        const feedbackData = {
            rating,
            comment,
            tags,
        };

        const result = await aiService.analyzeFeedback(feedbackData);

        res.json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        console.error('AI feedback analysis error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to analyze feedback',
        });
    }
});

/**
 * POST /api/ai/optimize-schedule
 * Get scheduling recommendations
 */
router.post('/optimize-schedule', async (req, res) => {
    try {
        const { 
            doctorName, 
            requestedTime, 
            patientName, 
            patientHistory, 
            existingAppointments, 
            availableSlots 
        } = req.body;

        const scheduleData = {
            doctorName,
            requestedTime,
            patientName,
            patientHistory,
            existingAppointments,
            availableSlots,
        };

        const result = await aiService.optimizeSchedule(scheduleData);

        res.json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        console.error('AI scheduling error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to generate scheduling recommendations',
        });
    }
});

/**
 * POST /api/ai/dashboard-insights
 * Generate insights from dashboard metrics
 */
router.post('/dashboard-insights', async (req, res) => {
    try {
        const { metrics } = req.body;

        if (!metrics) {
            return res.status(400).json({
                status: 'error',
                message: 'Dashboard metrics are required',
            });
        }

        const result = await aiService.generateDashboardInsights(metrics);

        res.json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        console.error('AI dashboard insights error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to generate dashboard insights',
        });
    }
});

/**
 * GET /api/ai/status
 * Check AI service status and rate limits
 */
router.get('/status', async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.user_id;
        const health = await aiService.healthCheck();
        const rateLimit = getRateLimitStatus(userId);
        const tokenUsage = aiService.getTokenUsageStats();

        res.json({
            status: 'success',
            data: {
                service: health,
                rateLimit,
                tokenUsage: {
                    totalRequests: tokenUsage.requestCount,
                    estimatedCost: tokenUsage.estimatedCost,
                },
            },
        });
    } catch (error) {
        console.error('AI status check error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to check AI status',
        });
    }
});

/**
 * Helper function to calculate age from date of birth
 */
function calculateAge(dateOfBirth) {
    if (!dateOfBirth) return 'Unknown';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

module.exports = router;
