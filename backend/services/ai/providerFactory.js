/**
 * AI Provider Factory
 * Selects and returns the appropriate AI provider based on configuration
 * Uses lazy loading to avoid initializing unused providers
 */

// Cache provider instance for reuse
let providerInstance = null;
let currentProviderType = null;

/**
 * Get the configured AI provider
 * @returns {BaseProvider} The AI provider instance
 */
function getProvider() {
    const providerType = (process.env.AI_PROVIDER || 'openai').toLowerCase();
    
    // Return cached instance if provider type hasn't changed
    if (providerInstance && currentProviderType === providerType) {
        return providerInstance;
    }
    
    // Lazy require to avoid loading unused providers
    switch (providerType) {
        case 'gemini':
        case 'google':
            const GeminiProvider = require('./providers/geminiProvider');
            providerInstance = new GeminiProvider();
            break;
        case 'openai':
        default:
            const OpenAIProvider = require('./providers/openaiProvider');
            providerInstance = new OpenAIProvider();
            break;
    }
    
    currentProviderType = providerType;
    console.log(`AI Provider initialized: ${providerInstance.getName()}`);
    
    return providerInstance;
}

/**
 * Get the name of the currently active provider
 * @returns {string}
 */
function getActiveProviderName() {
    const provider = getProvider();
    return provider.getName();
}

/**
 * Check if a specific provider is available
 * @param {string} providerType - 'openai' or 'gemini'
 * @returns {Promise<{ available: boolean, reason?: string }>}
 */
async function checkProviderHealth(providerType) {
    let provider;
    
    // Lazy require
    switch (providerType.toLowerCase()) {
        case 'gemini':
        case 'google':
            const GeminiProvider = require('./providers/geminiProvider');
            provider = new GeminiProvider();
            break;
        case 'openai':
        default:
            const OpenAIProvider = require('./providers/openaiProvider');
            provider = new OpenAIProvider();
            break;
    }
    
    return provider.healthCheck();
}

module.exports = {
    getProvider,
    getActiveProviderName,
    checkProviderHealth,
};
