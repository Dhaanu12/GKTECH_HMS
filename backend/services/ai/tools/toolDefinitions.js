/**
 * AI Agent Tool Definitions
 * Function schemas for database lookup capabilities
 * Compatible with both OpenAI and Gemini function calling
 */

const TOOLS = [
    {
        type: 'function',
        function: {
            name: 'searchPatients',
            description: 'Search for patients by name, MRN (Medical Record Number), or phone number. Use this when the user asks about a specific patient or wants to find patients.',
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'The search term - patient name, MRN, or phone number'
                    }
                },
                required: ['query']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'getPatientDetails',
            description: 'Get detailed information about a specific patient including demographics, medical history, allergies, and blood group. Use this after finding a patient ID from search.',
            parameters: {
                type: 'object',
                properties: {
                    patientId: {
                        type: 'number',
                        description: 'The patient ID to look up'
                    }
                },
                required: ['patientId']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'getPatientVitals',
            description: 'Get vital signs history for a patient including pulse rate, blood pressure, temperature, SpO2 (oxygen saturation), respiratory rate, weight, height, and blood glucose.',
            parameters: {
                type: 'object',
                properties: {
                    patientId: {
                        type: 'number',
                        description: 'The patient ID'
                    },
                    limit: {
                        type: 'number',
                        description: 'Maximum number of records to return (default 10)'
                    }
                },
                required: ['patientId']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'getPatientLabOrders',
            description: 'Get lab orders and test results for a patient. Includes test names, status, and result summaries.',
            parameters: {
                type: 'object',
                properties: {
                    patientId: {
                        type: 'number',
                        description: 'The patient ID'
                    },
                    includeCompleted: {
                        type: 'boolean',
                        description: 'Whether to include completed orders (default true)'
                    }
                },
                required: ['patientId']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'getPatientNotes',
            description: 'Get clinical notes for a patient. Includes nursing notes, assessments, and other clinical documentation.',
            parameters: {
                type: 'object',
                properties: {
                    patientId: {
                        type: 'number',
                        description: 'The patient ID'
                    },
                    noteType: {
                        type: 'string',
                        description: 'Filter by note type (e.g., "Nursing", "SOAP", "Progress")'
                    }
                },
                required: ['patientId']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'getAppointments',
            description: 'Get appointments. Can filter by date, doctor, or patient.',
            parameters: {
                type: 'object',
                properties: {
                    patientId: {
                        type: 'number',
                        description: 'Filter by patient ID (optional)'
                    },
                    doctorId: {
                        type: 'number',
                        description: 'Filter by doctor ID (optional)'
                    },
                    date: {
                        type: 'string',
                        description: 'Filter by date in YYYY-MM-DD format (optional)'
                    },
                    status: {
                        type: 'string',
                        description: 'Filter by status: scheduled, completed, cancelled, no_show (optional)'
                    }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'getPatientConsultations',
            description: 'Get consultation history for a patient, including diagnoses, prescriptions, and doctor notes.',
            parameters: {
                type: 'object',
                properties: {
                    patientId: {
                        type: 'number',
                        description: 'The patient ID'
                    }
                },
                required: ['patientId']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'getOpdEntries',
            description: 'Get OPD (Outpatient Department) entries. Shows patient visits, payment status, and current status in the workflow.',
            parameters: {
                type: 'object',
                properties: {
                    patientId: {
                        type: 'number',
                        description: 'Filter by patient ID (optional)'
                    },
                    date: {
                        type: 'string',
                        description: 'Filter by date in YYYY-MM-DD format (optional)'
                    }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'getDashboardStats',
            description: 'Get dashboard statistics and metrics like patient counts, appointment counts, and other operational data.',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'getPatientFeedback',
            description: 'Get patient feedback and satisfaction surveys.',
            parameters: {
                type: 'object',
                properties: {
                    patientId: {
                        type: 'number',
                        description: 'Filter by patient ID (optional)'
                    }
                },
                required: []
            }
        }
    }
];

/**
 * Convert tool definitions to Gemini format
 * Gemini uses a slightly different structure
 */
function getGeminiTools() {
    return TOOLS.map(tool => ({
        functionDeclarations: [{
            name: tool.function.name,
            description: tool.function.description,
            parameters: tool.function.parameters
        }]
    }));
}

/**
 * Get OpenAI-compatible tool definitions
 */
function getOpenAITools() {
    return TOOLS;
}

/**
 * Get tool by name
 */
function getToolByName(name) {
    return TOOLS.find(t => t.function.name === name);
}

/**
 * Get all tool names
 */
function getToolNames() {
    return TOOLS.map(t => t.function.name);
}

module.exports = {
    TOOLS,
    getGeminiTools,
    getOpenAITools,
    getToolByName,
    getToolNames
};
