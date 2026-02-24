/**
 * Google Gemini Provider Implementation
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const BaseProvider = require('./baseProvider');

class GeminiProvider extends BaseProvider {
    constructor() {
        super('gemini');

        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
        }

        this.model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
        this.maxTokens = 1024;

        // Token usage tracking (estimated for Gemini)
        this.usage = {
            totalPromptTokens: 0,
            totalCompletionTokens: 0,
            requestCount: 0,
            lastReset: new Date(),
        };
    }

    /**
     * Convert OpenAI-style messages to Gemini format
     */
    _convertMessages(messages, systemPrompt) {
        // Gemini uses a different format - combine system prompt with first user message
        // and use 'user' and 'model' roles
        const contents = [];
        let systemContext = systemPrompt ? systemPrompt + '\n\n' : '';

        for (const msg of messages) {
            if (msg.role === 'system') {
                systemContext += msg.content + '\n\n';
            } else if (msg.role === 'user') {
                // Prepend system context to first user message
                const content = systemContext ? systemContext + msg.content : msg.content;
                systemContext = ''; // Clear after using
                contents.push({
                    role: 'user',
                    parts: [{ text: content }],
                });
            } else if (msg.role === 'assistant') {
                contents.push({
                    role: 'model',
                    parts: [{ text: msg.content }],
                });
            }
        }

        return contents;
    }

    /**
     * Estimate token count (rough approximation)
     */
    _estimateTokens(text) {
        // Rough estimate: ~4 characters per token
        return Math.ceil((text || '').length / 4);
    }

    /**
     * Track usage
     */
    _trackUsage(promptText, responseText) {
        this.usage.totalPromptTokens += this._estimateTokens(promptText);
        this.usage.totalCompletionTokens += this._estimateTokens(responseText);
        this.usage.requestCount += 1;
    }

    /**
     * Calculate estimated cost
     */
    _calculateCost() {
        // Gemini pricing (approximate for flash model)
        const inputCost = (this.usage.totalPromptTokens / 1000000) * 0.075;
        const outputCost = (this.usage.totalCompletionTokens / 1000000) * 0.30;
        return (inputCost + outputCost).toFixed(4);
    }

    /**
     * Convert OpenAI-style tools to Gemini function declarations
     */
    _convertTools(tools) {
        if (!tools || tools.length === 0) return null;

        return [{
            functionDeclarations: tools.map(tool => ({
                name: tool.function.name,
                description: tool.function.description,
                parameters: tool.function.parameters
            }))
        }];
    }

    async chat(messages, options = {}) {
        try {
            if (!this.genAI) {
                return {
                    success: false,
                    message: 'Gemini API key not configured.',
                    error: 'Missing GEMINI_API_KEY',
                };
            }

            const tools = options.tools ? this._convertTools(options.tools) : null;

            const modelConfig = {
                model: options.model || this.model,
                generationConfig: {
                    maxOutputTokens: options.maxTokens || this.maxTokens,
                    temperature: options.temperature || 0.7,
                },
            };

            // Add tools if provided
            if (tools) {
                modelConfig.tools = tools;
            }

            const model = this.genAI.getGenerativeModel(modelConfig);

            const contents = this._convertMessages(messages, options.systemPrompt);

            // Get the last user message for simple generation
            // or use chat for multi-turn
            let result;

            if (contents.length === 1) {
                // Single message - use generateContent
                result = await model.generateContent(contents[0].parts[0].text);
            } else {
                // Multi-turn - use chat
                const chat = model.startChat({
                    history: contents.slice(0, -1),
                });
                const lastMessage = contents[contents.length - 1];
                result = await chat.sendMessage(lastMessage.parts[0].text);
            }

            const response = result.response;
            const candidate = response.candidates[0];

            // Check for function calls
            const functionCalls = candidate.content.parts.filter(p => p.functionCall);

            if (functionCalls.length > 0) {
                // Track usage
                const promptText = contents.map(c => c.parts[0]?.text || '').join(' ');
                this._trackUsage(promptText, '');

                return {
                    success: true,
                    message: '',
                    toolCalls: functionCalls.map((fc, idx) => ({
                        id: `call_${idx}`,
                        name: fc.functionCall.name,
                        arguments: fc.functionCall.args
                    })),
                    usage: {
                        prompt_tokens: this._estimateTokens(promptText),
                        completion_tokens: 0,
                    },
                };
            }

            // Regular text response
            const responseText = response.text();

            // Track usage
            const promptText = contents.map(c => c.parts[0]?.text || '').join(' ');
            this._trackUsage(promptText, responseText);

            return {
                success: true,
                message: responseText,
                usage: {
                    prompt_tokens: this._estimateTokens(promptText),
                    completion_tokens: this._estimateTokens(responseText),
                },
            };
        } catch (error) {
            console.error('Gemini chat error:', error);
            return {
                success: false,
                message: 'AI service temporarily unavailable. Please try again.',
                error: error.message,
            };
        }
    }

    /**
     * Continue conversation after tool execution
     * For Gemini, we use generateContent directly with the full conversation
     * including function calls and responses
     * @param {Array} messages - Full message history including tool results
     * @param {Object} options - Chat options
     */
    async continueWithToolResult(messages, options = {}) {
        try {
            if (!this.genAI) {
                return {
                    success: false,
                    message: 'Gemini API key not configured.',
                    error: 'Missing GEMINI_API_KEY',
                };
            }

            const tools = options.tools ? this._convertTools(options.tools) : null;

            const modelConfig = {
                model: options.model || this.model,
                generationConfig: {
                    maxOutputTokens: options.maxTokens || this.maxTokens,
                    temperature: options.temperature || 0.7,
                },
            };

            if (tools) {
                modelConfig.tools = tools;
            }

            const model = this.genAI.getGenerativeModel(modelConfig);

            // For Gemini, convert messages to the correct format
            const contents = this._convertMessagesWithToolResults(messages, options.systemPrompt);

            // Use generateContent with the full conversation instead of chat history
            // This avoids the chat history validation issue with functionResponse
            const result = await model.generateContent({ contents });

            const response = result.response;
            const candidate = response.candidates[0];

            // Check for more function calls
            const functionCalls = candidate.content.parts.filter(p => p.functionCall);

            if (functionCalls.length > 0) {
                return {
                    success: true,
                    message: '',
                    toolCalls: functionCalls.map((fc, idx) => ({
                        id: `call_${idx}`,
                        name: fc.functionCall.name,
                        arguments: fc.functionCall.args
                    })),
                };
            }

            const responseText = response.text();
            const promptText = contents.map(c => c.parts[0]?.text || JSON.stringify(c.parts)).join(' ');
            this._trackUsage(promptText, responseText);

            return {
                success: true,
                message: responseText,
                usage: {
                    prompt_tokens: this._estimateTokens(promptText),
                    completion_tokens: this._estimateTokens(responseText),
                },
            };
        } catch (error) {
            console.error('Gemini continue error:', error);
            return {
                success: false,
                message: 'AI service temporarily unavailable. Please try again.',
                error: error.message,
            };
        }
    }

    /**
     * Convert messages including tool results to Gemini format
     * In Gemini, function responses must be role 'function', not 'user'
     */
    _convertMessagesWithToolResults(messages, systemPrompt) {
        const contents = [];
        let systemContext = systemPrompt ? systemPrompt + '\n\n' : '';

        for (const msg of messages) {
            if (msg.role === 'system') {
                systemContext += msg.content + '\n\n';
            } else if (msg.role === 'user') {
                const content = systemContext ? systemContext + msg.content : msg.content;
                systemContext = '';
                contents.push({
                    role: 'user',
                    parts: [{ text: content }],
                });
            } else if (msg.role === 'assistant') {
                if (msg.tool_calls) {
                    // Assistant message with function calls
                    contents.push({
                        role: 'model',
                        parts: msg.tool_calls.map(tc => ({
                            functionCall: {
                                name: tc.name,
                                args: tc.arguments
                            }
                        })),
                    });
                } else {
                    contents.push({
                        role: 'model',
                        parts: [{ text: msg.content }],
                    });
                }
            } else if (msg.role === 'tool') {
                // Tool/function response - in Gemini this uses role 'function'
                contents.push({
                    role: 'function',
                    parts: [{
                        functionResponse: {
                            name: msg.name,
                            response: typeof msg.content === 'string'
                                ? JSON.parse(msg.content)
                                : msg.content
                        }
                    }],
                });
            }
        }

        return contents;
    }

    /**
     * Stream the final response after tool results have been gathered.
     * Uses _convertMessagesWithToolResults to properly format tool messages for Gemini,
     * then calls generateContentStream to stream the answer as it's being generated.
     */
    async *streamWithToolResults(messages, options = {}) {
        try {
            if (!this.genAI) {
                yield 'Gemini API key not configured.';
                return;
            }

            const tools = options.tools ? this._convertTools(options.tools) : null;
            const modelConfig = {
                model: options.model || this.model,
                generationConfig: {
                    maxOutputTokens: options.maxTokens || this.maxTokens,
                    temperature: options.temperature || 0.7,
                },
            };
            if (tools) modelConfig.tools = tools;

            const model = this.genAI.getGenerativeModel(modelConfig);
            const contents = this._convertMessagesWithToolResults(messages, options.systemPrompt);

            const result = await model.generateContentStream({ contents });

            let fullResponse = '';
            for await (const chunk of result.stream) {
                const text = chunk.text();
                if (text) {
                    fullResponse += text;
                    yield text;
                }
            }

            const promptText = contents.map(c => c.parts[0]?.text || JSON.stringify(c.parts)).join(' ');
            this._trackUsage(promptText, fullResponse);

        } catch (error) {
            console.error('Gemini stream-with-tools error:', error);
            yield 'AI service temporarily unavailable.';
        }
    }

    async *streamChat(messages, options = {}) {
        try {
            if (!this.genAI) {
                yield 'Gemini API key not configured.';
                return;
            }

            const model = this.genAI.getGenerativeModel({
                model: options.model || this.model,
                generationConfig: {
                    maxOutputTokens: options.maxTokens || this.maxTokens,
                    temperature: options.temperature || 0.7,
                },
            });

            const contents = this._convertMessages(messages, options.systemPrompt);

            // For streaming, use generateContentStream
            const lastUserContent = contents[contents.length - 1]?.parts[0]?.text || '';

            let fullResponse = '';

            if (contents.length === 1) {
                const result = await model.generateContentStream(lastUserContent);
                for await (const chunk of result.stream) {
                    const text = chunk.text();
                    if (text) {
                        fullResponse += text;
                        yield text;
                    }
                }
            } else {
                // For multi-turn with streaming
                const chat = model.startChat({
                    history: contents.slice(0, -1),
                });
                const result = await chat.sendMessageStream(lastUserContent);
                for await (const chunk of result.stream) {
                    const text = chunk.text();
                    if (text) {
                        fullResponse += text;
                        yield text;
                    }
                }
            }

            // Track usage after complete
            const promptText = contents.map(c => c.parts[0].text).join(' ');
            this._trackUsage(promptText, fullResponse);

        } catch (error) {
            console.error('Gemini stream error:', error);
            yield 'AI service temporarily unavailable.';
        }
    }

    async healthCheck() {
        try {
            if (!process.env.GEMINI_API_KEY) {
                return { available: false, reason: 'API key not configured' };
            }

            if (!this.genAI) {
                return { available: false, reason: 'Gemini client not initialized' };
            }

            const model = this.genAI.getGenerativeModel({ model: this.model });
            const result = await model.generateContent('Hi');

            return { available: true };
        } catch (error) {
            return { available: false, reason: error.message };
        }
    }

    getUsageStats() {
        return {
            ...this.usage,
            totalTokens: this.usage.totalPromptTokens + this.usage.totalCompletionTokens,
            estimatedCost: this._calculateCost(),
        };
    }

    resetUsageStats() {
        this.usage = {
            totalPromptTokens: 0,
            totalCompletionTokens: 0,
            requestCount: 0,
            lastReset: new Date(),
        };
    }
}

module.exports = GeminiProvider;
