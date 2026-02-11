/**
 * AI Service - Main entry point for AI functionality
 * Uses provider abstraction to support multiple AI backends (OpenAI, Gemini)
 * Supports function calling for database lookups
 */

const { getProvider, getActiveProviderName } = require('./ai/providerFactory');
const { SYSTEM_PROMPTS } = require('./ai/systemPrompts');
const { getOpenAITools, executeTool } = require('./ai/tools');

// Maximum tool call iterations to prevent infinite loops
const MAX_TOOL_ITERATIONS = 5;

/**
 * General chat completion (no tools)
 */
async function chat(messages, options = {}) {
    const provider = getProvider();
    const systemPrompt = options.systemPrompt || SYSTEM_PROMPTS.general;
    
    return provider.chat(messages, { ...options, systemPrompt });
}

/**
 * Agent chat with tool execution capability
 * This enables the AI to look up data from the database
 * @param {Array} messages - Chat messages
 * @param {Object} options - Options including authToken for API calls
 */
async function agentChat(messages, options = {}) {
    const provider = getProvider();
    const systemPrompt = options.systemPrompt || SYSTEM_PROMPTS.general;
    const authToken = options.authToken;
    const tools = getOpenAITools();
    
    // Initial chat request with tools
    let response = await provider.chat(messages, {
        ...options,
        systemPrompt,
        tools
    });

    // If no tool calls, return immediately
    if (!response.toolCalls || response.toolCalls.length === 0) {
        return response;
    }

    // Tool execution loop
    let conversationMessages = [...messages];
    let iterations = 0;

    while (response.toolCalls && response.toolCalls.length > 0 && iterations < MAX_TOOL_ITERATIONS) {
        iterations++;
        
        // Add assistant message with tool calls
        conversationMessages.push({
            role: 'assistant',
            content: response.message || '',
            tool_calls: response.toolCalls
        });

        // Execute each tool call
        let confirmationPayload = null;
        for (const toolCall of response.toolCalls) {
            console.log(`Executing tool: ${toolCall.name}`, toolCall.arguments);
            
            const toolResult = await executeTool(toolCall.name, toolCall.arguments, authToken);
            
            // Check if this is a write tool proposal requiring confirmation
            if (toolResult && toolResult.requiresConfirmation) {
                confirmationPayload = {
                    action: toolResult.action,
                    label: toolResult.label,
                    params: toolResult.params,
                    summary: toolResult.summary
                };
                // Tell the AI it proposed an action needing confirmation
                conversationMessages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    name: toolCall.name,
                    content: JSON.stringify({ status: 'pending_confirmation', summary: toolResult.summary })
                });
            } else {
                // Add tool result to conversation
                conversationMessages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    name: toolCall.name,
                    content: JSON.stringify(toolResult)
                });
            }
        }

        // If a confirmation is needed, get the AI's description and embed the payload
        if (confirmationPayload) {
            if (provider.continueWithToolResult) {
                response = await provider.continueWithToolResult(conversationMessages, {
                    ...options,
                    systemPrompt,
                    tools
                });
            } else {
                response = await provider.chat(conversationMessages, {
                    ...options,
                    systemPrompt,
                    tools
                });
            }
            // Append the confirmation payload to the message
            const aiText = response.message || '';
            response.message = aiText + `\n[CONFIRM_ACTION]${JSON.stringify(confirmationPayload)}[/CONFIRM_ACTION]`;
            response.toolCalls = null; // Stop the loop
            break;
        }

        // Continue conversation with tool results
        if (provider.continueWithToolResult) {
            response = await provider.continueWithToolResult(conversationMessages, {
                ...options,
                systemPrompt,
                tools
            });
        } else {
            // Fallback for providers without dedicated method
            response = await provider.chat(conversationMessages, {
                ...options,
                systemPrompt,
                tools
            });
        }
    }

    if (iterations >= MAX_TOOL_ITERATIONS) {
        console.warn('Max tool iterations reached');
    }

    return response;
}

/**
 * Stream chat completion for real-time responses
 */
async function* streamChat(messages, options = {}) {
    const provider = getProvider();
    const systemPrompt = options.systemPrompt || SYSTEM_PROMPTS.general;
    
    yield* provider.streamChat(messages, { ...options, systemPrompt });
}

/**
 * Analyze patient vitals
 */
async function analyzeVitals(vitalsData) {
    const prompt = `Analyze the following patient vitals data and provide insights:

${JSON.stringify(vitalsData, null, 2)}

Provide:
1. Overall trend assessment
2. Any concerning values with context
3. Recommended actions (if any)`;

    return chat(
        [{ role: 'user', content: prompt }],
        { systemPrompt: SYSTEM_PROMPTS.vitalsAnalysis, temperature: 0.3 }
    );
}

/**
 * Interpret lab results
 */
async function interpretLabResults(labData) {
    const prompt = `Interpret the following lab results:

Test: ${labData.testName || 'Unknown'}
Results: ${labData.resultSummary || JSON.stringify(labData.results, null, 2)}
${labData.referenceRanges ? `Reference Ranges: ${labData.referenceRanges}` : ''}

Provide a plain-language interpretation highlighting key findings.`;

    return chat(
        [{ role: 'user', content: prompt }],
        { systemPrompt: SYSTEM_PROMPTS.labInterpretation, temperature: 0.3 }
    );
}

/**
 * Assist with clinical notes
 */
async function suggestNotes(noteData) {
    const action = noteData.action || 'improve';
    
    let prompt;
    if (action === 'generate') {
        prompt = `Based on the following patient information, generate a concise clinical note. Use only the facts provided — do not fabricate any details.\n\n${noteData.content}`;
    } else if (action === 'improve') {
        prompt = `Improve the following clinical note for clarity, completeness, and professionalism. Use the patient context provided to fill in relevant clinical details.\n\n${noteData.content}`;
    } else if (action === 'summarize') {
        prompt = `Summarize the following clinical note concisely:\n\n"${noteData.content}"`;
    } else if (action === 'expand') {
        prompt = `Expand the following brief note into a more complete clinical note:\n\n"${noteData.content}"`;
    } else {
        prompt = `Help with the following clinical note:\n\n"${noteData.content}"`;
    }

    return chat(
        [{ role: 'user', content: prompt }],
        { systemPrompt: SYSTEM_PROMPTS.clinicalNotes, temperature: 0.5 }
    );
}

/**
 * Generate patient summary
 */
async function summarizePatient(patientData) {
    // Build a compact data block to minimize token usage
    const parts = [`${patientData.name}, ${patientData.age || '?'}y ${patientData.gender || ''}, MRN: ${patientData.mrn || 'N/A'}`];

    if (patientData.vitals?.length) {
        const v = patientData.vitals[0];
        const vParts = [];
        if (v.blood_pressure_systolic) vParts.push(`BP ${v.blood_pressure_systolic}/${v.blood_pressure_diastolic}`);
        if (v.pulse_rate) vParts.push(`HR ${v.pulse_rate}`);
        if (v.temperature) vParts.push(`Temp ${v.temperature}°F`);
        if (v.spo2) vParts.push(`SpO2 ${v.spo2}%`);
        if (vParts.length) parts.push(`Vitals: ${vParts.join(', ')}`);
    }

    if (patientData.labs?.length) {
        parts.push(`Labs: ${patientData.labs.map(l => `${l.test_name} (${l.status})`).join(', ')}`);
    }

    if (patientData.notes) {
        parts.push(`Notes: ${patientData.notes.substring(0, 300)}`);
    }

    if (patientData.conditions) {
        parts.push(`History: ${patientData.conditions.substring(0, 150)}`);
    }

    const prompt = `Patient snapshot — reply in 3-4 lines max:\n${parts.join('\n')}`;

    return chat(
        [{ role: 'user', content: prompt }],
        { systemPrompt: SYSTEM_PROMPTS.patientSummary, temperature: 0.4 }
    );
}

/**
 * Analyze patient feedback
 */
async function analyzeFeedback(feedbackData) {
    const prompt = `Analyze the following patient feedback:

Rating: ${feedbackData.rating || 'N/A'}/5
Comment: "${feedbackData.comment || ''}"
Tags: ${feedbackData.tags?.join(', ') || 'None'}

Provide:
1. Sentiment classification (positive/neutral/negative) with confidence (high/medium/low)
2. Key themes identified
3. Suggested response approach`;

    const response = await chat(
        [{ role: 'user', content: prompt }],
        { systemPrompt: SYSTEM_PROMPTS.feedbackAnalysis, temperature: 0.3 }
    );

    // Try to parse structured data from response
    if (response.success) {
        const message = response.message.toLowerCase();
        let sentiment = 'neutral';
        if (message.includes('positive')) sentiment = 'positive';
        if (message.includes('negative')) sentiment = 'negative';
        
        response.sentiment = sentiment;
    }

    return response;
}

/**
 * Optimize appointment scheduling
 */
async function optimizeSchedule(scheduleData) {
    const prompt = `Help optimize this appointment scheduling:

Doctor: ${scheduleData.doctorName || 'Unknown'}
Requested Time: ${scheduleData.requestedTime || 'Not specified'}
Patient: ${scheduleData.patientName || 'Unknown'}
Patient History: ${scheduleData.patientHistory || 'No history available'}
Current Bookings: ${JSON.stringify(scheduleData.existingAppointments || [], null, 2)}
Available Slots: ${JSON.stringify(scheduleData.availableSlots || [], null, 2)}

Provide scheduling recommendations and any relevant considerations.`;

    return chat(
        [{ role: 'user', content: prompt }],
        { systemPrompt: SYSTEM_PROMPTS.scheduling, temperature: 0.4 }
    );
}

/**
 * Generate dashboard insights
 */
async function generateDashboardInsights(metricsData) {
    const prompt = `Analyze these hospital dashboard metrics and provide insights:

${JSON.stringify(metricsData, null, 2)}

Focus on:
1. Notable trends or patterns
2. Any anomalies or concerns
3. Actionable recommendations

Keep insights brief and operationally focused.`;

    return chat(
        [{ role: 'user', content: prompt }],
        { systemPrompt: SYSTEM_PROMPTS.dashboardInsights, temperature: 0.4 }
    );
}

/**
 * Check if AI service is available
 */
async function healthCheck() {
    const provider = getProvider();
    const health = await provider.healthCheck();
    return {
        ...health,
        provider: getActiveProviderName(),
    };
}

/**
 * Get current token usage statistics
 */
function getTokenUsageStats() {
    const provider = getProvider();
    return {
        ...provider.getUsageStats(),
        provider: getActiveProviderName(),
    };
}

/**
 * Reset token usage statistics
 */
function resetTokenUsage() {
    const provider = getProvider();
    provider.resetUsageStats();
}

module.exports = {
    chat,
    agentChat,
    streamChat,
    analyzeVitals,
    interpretLabResults,
    suggestNotes,
    summarizePatient,
    analyzeFeedback,
    optimizeSchedule,
    generateDashboardInsights,
    healthCheck,
    getTokenUsageStats,
    resetTokenUsage,
    getActiveProviderName,
    SYSTEM_PROMPTS,
};
