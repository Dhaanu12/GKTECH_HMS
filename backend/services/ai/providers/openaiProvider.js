/**
 * OpenAI Provider Implementation
 */

const BaseProvider = require('./baseProvider');

class OpenAIProvider extends BaseProvider {
    constructor() {
        super('openai');

        // Lazy initialization - only create client when needed
        this._client = null;
        this.model = process.env.OPENAI_MODEL || 'gpt-5-mini';
        this.maxTokens = 4096; // Increased for complex responses with tool results

        // Token usage tracking
        this.usage = {
            totalPromptTokens: 0,
            totalCompletionTokens: 0,
            requestCount: 0,
            lastReset: new Date(),
        };
    }

    /**
     * Get OpenAI client (lazy initialization)
     */
    get client() {
        if (!this._client) {
            const OpenAI = require('openai');
            this._client = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
        }
        return this._client;
    }

    /**
     * Track token usage from API response
     */
    _trackUsage(usage) {
        if (usage) {
            this.usage.totalPromptTokens += usage.prompt_tokens || 0;
            this.usage.totalCompletionTokens += usage.completion_tokens || 0;
            this.usage.requestCount += 1;
        }
    }

    /**
     * Calculate estimated cost
     */
    _calculateCost() {
        // GPT-5-mini pricing (approximate)
        const inputCost = (this.usage.totalPromptTokens / 1000000) * 0.15;
        const outputCost = (this.usage.totalCompletionTokens / 1000000) * 0.60;
        return (inputCost + outputCost).toFixed(4);
    }

    async chat(messages, options = {}) {
        try {
            const systemPrompt = options.systemPrompt || '';
            const tools = options.tools || null;

            const requestParams = {
                model: options.model || this.model,
                messages: [
                    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                    ...messages,
                ],
                max_completion_tokens: options.maxTokens || this.maxTokens,
            };

            // Add tools if provided
            if (tools && tools.length > 0) {
                requestParams.tools = tools;
                requestParams.tool_choice = 'auto';
            }

            const response = await this.client.chat.completions.create(requestParams);

            this._trackUsage(response.usage);

            const choice = response.choices[0];

            // Check if the model wants to call a function
            if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
                return {
                    success: true,
                    message: choice.message.content || '',
                    toolCalls: choice.message.tool_calls.map(tc => ({
                        id: tc.id,
                        type: 'function',
                        function: {
                            name: tc.function.name,
                            arguments: tc.function.arguments
                        },
                        // Also keep flat versions for tool executor
                        name: tc.function.name,
                        arguments: JSON.parse(tc.function.arguments)
                    })),
                    usage: response.usage,
                };
            }

            return {
                success: true,
                message: choice.message.content,
                usage: response.usage,
            };
        } catch (error) {
            console.error('OpenAI chat error:', error);
            return {
                success: false,
                message: 'AI service temporarily unavailable. Please try again.',
                error: error.message,
            };
        }
    }

    /**
     * Continue conversation after tool execution
     * @param {Array} messages - Full message history including tool results
     * @param {Object} options - Chat options
     */
    async continueWithToolResult(messages, options = {}) {
        try {
            const systemPrompt = options.systemPrompt || '';
            const tools = options.tools || null;

            const requestParams = {
                model: options.model || this.model,
                messages: [
                    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                    ...messages,
                ],
                max_completion_tokens: options.maxTokens || this.maxTokens,
            };

            if (tools && tools.length > 0) {
                requestParams.tools = tools;
                requestParams.tool_choice = 'auto';
            }

            const response = await this.client.chat.completions.create(requestParams);
            this._trackUsage(response.usage);

            const choice = response.choices[0];
            console.log('OpenAI continueWithToolResult response:', {
                finish_reason: choice.finish_reason,
                hasContent: !!choice.message.content,
                contentLength: choice.message.content?.length || 0,
                hasToolCalls: !!choice.message.tool_calls
            });

            // Check if more tool calls are needed
            if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
                return {
                    success: true,
                    message: choice.message.content || '',
                    toolCalls: choice.message.tool_calls.map(tc => ({
                        id: tc.id,
                        type: 'function',
                        function: {
                            name: tc.function.name,
                            arguments: tc.function.arguments
                        },
                        // Also keep flat versions for tool executor
                        name: tc.function.name,
                        arguments: JSON.parse(tc.function.arguments)
                    })),
                    usage: response.usage,
                };
            }

            return {
                success: true,
                message: choice.message.content || '',
                usage: response.usage,
            };
        } catch (error) {
            console.error('OpenAI continue error:', error);
            return {
                success: false,
                message: 'AI service temporarily unavailable. Please try again.',
                error: error.message,
            };
        }
    }

    /**
     * Stream the final response after tool results have been gathered.
     * OpenAI natively supports tool result messages in streaming mode.
     */
    async *streamWithToolResults(messages, options = {}) {
        try {
            const systemPrompt = options.systemPrompt || '';
            const tools = options.tools || null;

            const requestParams = {
                model: options.model || this.model,
                messages: [
                    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                    ...messages,
                ],
                max_completion_tokens: options.maxTokens || this.maxTokens,
                stream: true,
            };

            // Pass tools so OpenAI understands the conversation history (tool_calls in assistant messages)
            // Use tool_choice:'none' to force a text response — all tools already ran
            if (tools && tools.length > 0) {
                requestParams.tools = tools;
                requestParams.tool_choice = 'none';
            }

            const stream = await this.client.chat.completions.create(requestParams);

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content;
                if (content) {
                    yield content;
                }
            }
        } catch (error) {
            console.error('OpenAI stream-with-tools error:', error);
            yield 'AI service temporarily unavailable.';
        }
    }

    async *streamChat(messages, options = {}) {
        try {
            const systemPrompt = options.systemPrompt || '';

            const stream = await this.client.chat.completions.create({
                model: options.model || this.model,
                messages: [
                    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                    ...messages,
                ],
                max_completion_tokens: options.maxTokens || this.maxTokens,
                stream: true,
            });

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content;
                if (content) {
                    yield content;
                }
            }
        } catch (error) {
            console.error('OpenAI stream error:', error);
            yield 'AI service temporarily unavailable.';
        }
    }

    async healthCheck() {
        try {
            if (!process.env.OPENAI_API_KEY) {
                return { available: false, reason: 'API key not configured' };
            }

            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [{ role: 'user', content: 'Hi' }],
                max_completion_tokens: 5,
            });

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

module.exports = OpenAIProvider;
