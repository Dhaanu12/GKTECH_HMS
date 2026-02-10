/**
 * Base AI Provider Interface
 * All AI providers must implement these methods
 */

class BaseProvider {
    constructor(name) {
        this.name = name;
    }

    /**
     * Get the provider name
     * @returns {string}
     */
    getName() {
        return this.name;
    }

    /**
     * Standard chat completion
     * @param {Array} messages - Array of { role, content } objects
     * @param {Object} options - { systemPrompt, maxTokens, temperature }
     * @returns {Promise<{ success: boolean, message: string, usage?: object }>}
     */
    async chat(messages, options = {}) {
        throw new Error('chat() must be implemented by provider');
    }

    /**
     * Streaming chat completion (generator function)
     * @param {Array} messages - Array of { role, content } objects
     * @param {Object} options - { systemPrompt, maxTokens, temperature }
     * @yields {string} - Content chunks
     */
    async *streamChat(messages, options = {}) {
        throw new Error('streamChat() must be implemented by provider');
    }

    /**
     * Check if the provider is available and configured
     * @returns {Promise<{ available: boolean, reason?: string }>}
     */
    async healthCheck() {
        throw new Error('healthCheck() must be implemented by provider');
    }

    /**
     * Get token usage statistics (if supported)
     * @returns {Object}
     */
    getUsageStats() {
        return {
            totalPromptTokens: 0,
            totalCompletionTokens: 0,
            requestCount: 0,
            estimatedCost: '0.0000',
        };
    }

    /**
     * Reset usage statistics
     */
    resetUsageStats() {
        // Override in provider if tracking is supported
    }
}

module.exports = BaseProvider;
