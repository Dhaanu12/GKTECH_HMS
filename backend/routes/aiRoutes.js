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
        const userRole = req.user?.role || 'staff member';
        const branchId = req.user?.branch_id || null;

        systemPrompt += `\n\nCurrent user context: Role is ${userRole}.`;
        if (branchId) {
            systemPrompt += ` Branch ID: ${branchId}.`;
        }

        if (context) {
            systemPrompt += ` User is currently viewing the ${context.page || 'unknown'} page.`;
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
        res.setHeader('X-Accel-Buffering', 'no');  // Disable Nginx/proxy buffering
        res.flushHeaders();                         // Send headers immediately

        let systemPrompt = aiService.SYSTEM_PROMPTS.general;
        const userRole = req.user?.role || 'staff member';
        const branchId = req.user?.branch_id || null;

        systemPrompt += `\n\nCurrent user context: Role is ${userRole}.`;
        if (branchId) {
            systemPrompt += ` Branch ID: ${branchId}.`;
        }

        if (context) {
            systemPrompt += ` User is currently viewing the ${context.page || 'unknown'} page.`;
            if (context.patientInfo) {
                systemPrompt += `\nViewing patient: ${context.patientInfo}`;
            }
        }

        // Get the auth token for tool execution
        const authToken = req.headers.authorization;

        if (useTools) {
            // Provide instant streaming feedback so the user knows tools are running
            res.write(`data: ${JSON.stringify({ content: "⏳ *Checking live data...*\n\n" })}\n\n`);

            // agentChatStream executes tools (blocking), then streams the final answer in real time
            for await (const chunk of aiService.agentChatStream(messages, { systemPrompt, authToken })) {
                if (typeof chunk === 'string') {
                    // Regular text chunk — send directly to frontend
                    res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
                } else if (chunk && chunk.toolsComplete) {
                    // Tools done — signal frontend to clear the loading indicator before real content starts
                    res.write(`data: ${JSON.stringify({ clearIndicator: true })}\n\n`);
                } else if (chunk && chunk.confirmationMessage) {
                    // Write-tool confirmation — not streamed, send entire message at once
                    res.write(`data: ${JSON.stringify({ clearIndicator: true })}\n\n`);
                    const confirmText = chunk.confirmationMessage;
                    res.write(`data: ${JSON.stringify({ content: confirmText })}\n\n`);
                }
            }
        } else {
            // Regular streaming without tools — ai generates and streams at same time
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

/**
 * POST /api/ai/execute-action
 * Execute a confirmed write action from the AI agent
 */
router.post('/execute-action', async (req, res) => {
    try {
        const { action, params } = req.body;

        if (!action || !params) {
            return res.status(400).json({ status: 'error', message: 'Action and params are required' });
        }

        const authToken = req.headers.authorization;
        const headers = { Authorization: authToken };
        const axios = require('axios');
        const API_URL = 'http://localhost:5000/api';

        let result;

        switch (action) {
            case 'createAppointment':
                result = await axios.post(`${API_URL}/appointments`, {
                    patient_id: params.patientId,
                    doctor_id: params.doctorId,
                    appointment_date: params.date,
                    appointment_time: params.time,
                    type: params.type || 'New Visit'
                }, { headers });
                break;

            case 'updateAppointmentStatus':
                result = await axios.patch(`${API_URL}/appointments/${params.appointmentId}/status`, {
                    status: params.status
                }, { headers });
                break;

            case 'rescheduleAppointment':
                result = await axios.patch(`${API_URL}/appointments/${params.appointmentId}/reschedule`, {
                    new_date: params.newDate,
                    new_time: params.newTime
                }, { headers });
                break;

            case 'createClinicalNote':
                result = await axios.post(`${API_URL}/clinical-notes`, {
                    patient_id: params.patientId,
                    note_type: params.noteType,
                    content: params.content,
                    opd_id: params.opdId || null
                }, { headers });
                break;

            case 'pinNote':
                result = await axios.patch(`${API_URL}/clinical-notes/${params.noteId}/pin`, {}, { headers });
                break;

            case 'updateLabOrderStatus':
                result = await axios.patch(`${API_URL}/lab-orders/${params.labOrderId}/status`, {
                    status: params.status
                }, { headers });
                break;

            case 'assignLabOrder':
                result = await axios.patch(`${API_URL}/lab-orders/${params.labOrderId}/assign`, {
                    nurse_id: params.nurseId || req.user.id
                }, { headers });
                break;

            case 'updateOpdPayment':
                result = await axios.patch(`${API_URL}/opd/${params.opdId}/payment`, {
                    payment_method: params.paymentMethod,
                    amount: params.amount
                }, { headers });
                break;

            case 'updateOpdStatus':
                result = await axios.patch(`${API_URL}/opd/${params.opdId}/status`, {
                    status: params.status
                }, { headers });
                break;

            default:
                return res.status(400).json({ status: 'error', message: `Unknown action: ${action}` });
        }

        res.json({
            status: 'success',
            message: `${action} executed successfully`,
            data: result.data
        });
    } catch (error) {
        console.error('Execute action error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            status: 'error',
            message: error.response?.data?.message || error.message || 'Failed to execute action'
        });
    }
});

module.exports = router;
