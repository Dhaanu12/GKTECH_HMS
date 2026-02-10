import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Helper to get auth headers
const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Create axios instance for AI endpoints
const aiApi = axios.create({
    baseURL: `${API_BASE}/ai`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth interceptor
aiApi.interceptors.request.use((config) => {
    const headers = getAuthHeaders();
    config.headers = { ...config.headers, ...headers };
    return config;
});

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface AIContext {
    page?: string;
    role?: string;
    patientInfo?: string;
}

export interface AIResponse {
    success: boolean;
    message: string;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    sentiment?: 'positive' | 'neutral' | 'negative';
    error?: string;
}

export interface VitalsData {
    recorded_at: string;
    heart_rate?: number;
    blood_pressure_systolic?: number;
    blood_pressure_diastolic?: number;
    temperature?: number;
    oxygen_saturation?: number;
    respiratory_rate?: number;
    weight?: number;
    height?: number;
    blood_glucose?: number;
    pain_level?: number;
}

export interface PatientInfo {
    first_name?: string;
    last_name?: string;
    age?: number;
    gender?: string;
    mrn?: string;
    date_of_birth?: string;
    medical_history?: string;
}

export interface RateLimitInfo {
    limit: number;
    remaining: number;
    resetAt: string;
}

/**
 * General AI chat
 */
export async function chat(messages: ChatMessage[], context?: AIContext): Promise<AIResponse> {
    try {
        const response = await aiApi.post('/chat', { messages, context });
        return response.data.data;
    } catch (error: any) {
        if (error.response?.status === 429) {
            return {
                success: false,
                message: error.response.data.message || 'Rate limit exceeded. Please try again later.',
            };
        }
        return {
            success: false,
            message: error.response?.data?.message || 'AI service temporarily unavailable.',
        };
    }
}

/**
 * Stream AI chat response (for real-time display)
 */
export async function streamChat(
    messages: ChatMessage[],
    context: AIContext | undefined,
    onChunk: (content: string) => void,
    onComplete: () => void,
    onError: (error: string) => void
): Promise<void> {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/ai/chat/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ messages, context }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            onError(errorData.message || 'Stream failed');
            return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
            onError('Stream not available');
            return;
        }

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                        onComplete();
                        return;
                    }
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.content) {
                            onChunk(parsed.content);
                        }
                        if (parsed.error) {
                            onError(parsed.error);
                            return;
                        }
                    } catch {
                        // Skip invalid JSON
                    }
                }
            }
        }
        onComplete();
    } catch (error: any) {
        onError(error.message || 'Stream connection failed');
    }
}

/**
 * Analyze patient vitals
 */
export async function analyzeVitals(vitals: VitalsData[], patientInfo?: PatientInfo): Promise<AIResponse> {
    try {
        const response = await aiApi.post('/analyze-vitals', { vitals, patientInfo });
        return response.data.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Failed to analyze vitals.',
        };
    }
}

/**
 * Interpret lab results
 */
export async function interpretLabResults(
    testName: string,
    resultSummary?: string,
    results?: any,
    referenceRanges?: string
): Promise<AIResponse> {
    try {
        const response = await aiApi.post('/interpret-lab', {
            testName,
            resultSummary,
            results,
            referenceRanges,
        });
        return response.data.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Failed to interpret lab results.',
        };
    }
}

/**
 * Get clinical notes suggestions
 */
export async function suggestNotes(
    content: string,
    action: 'improve' | 'summarize' | 'expand' = 'improve'
): Promise<AIResponse> {
    try {
        const response = await aiApi.post('/suggest-notes', { content, action });
        return response.data.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Failed to get note suggestions.',
        };
    }
}

/**
 * Generate patient summary
 */
export async function summarizePatient(
    patient: PatientInfo,
    vitals?: VitalsData[],
    labs?: any[],
    notes?: string,
    conditions?: string
): Promise<AIResponse> {
    try {
        const response = await aiApi.post('/summarize-patient', {
            patient,
            vitals,
            labs,
            notes,
            conditions,
        });
        return response.data.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Failed to generate patient summary.',
        };
    }
}

/**
 * Analyze patient feedback
 */
export async function analyzeFeedback(
    rating?: number,
    comment?: string,
    tags?: string[]
): Promise<AIResponse> {
    try {
        const response = await aiApi.post('/analyze-feedback', { rating, comment, tags });
        return response.data.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Failed to analyze feedback.',
        };
    }
}

/**
 * Get scheduling optimization suggestions
 */
export async function optimizeSchedule(data: {
    doctorName?: string;
    requestedTime?: string;
    patientName?: string;
    patientHistory?: string;
    existingAppointments?: any[];
    availableSlots?: any[];
}): Promise<AIResponse> {
    try {
        const response = await aiApi.post('/optimize-schedule', data);
        return response.data.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Failed to get scheduling suggestions.',
        };
    }
}

/**
 * Generate dashboard insights
 */
export async function getDashboardInsights(metrics: any): Promise<AIResponse> {
    try {
        const response = await aiApi.post('/dashboard-insights', { metrics });
        return response.data.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Failed to generate insights.',
        };
    }
}

/**
 * Get AI service status and rate limits
 */
export async function getAIStatus(): Promise<{
    service: { available: boolean; model?: string; reason?: string };
    rateLimit: RateLimitInfo;
    tokenUsage: { totalRequests: number; estimatedCost: string };
}> {
    try {
        const response = await aiApi.get('/status');
        return response.data.data;
    } catch (error: any) {
        return {
            service: { available: false, reason: 'Status check failed' },
            rateLimit: { limit: 50, remaining: 0, resetAt: new Date().toISOString() },
            tokenUsage: { totalRequests: 0, estimatedCost: '0' },
        };
    }
}
