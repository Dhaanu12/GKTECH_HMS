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
    },
    // ============ NEW READ-ONLY TOOLS ============
    {
        type: 'function',
        function: {
            name: 'getFollowUps',
            description: 'Get follow-up appointments that are overdue, due today, or upcoming. Useful for receptionist workflow.',
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
            name: 'getPatientFollowUp',
            description: 'Get follow-up status for a specific patient.',
            parameters: {
                type: 'object',
                properties: {
                    patientId: { type: 'number', description: 'The patient ID' }
                },
                required: ['patientId']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'getPendingBills',
            description: 'Get all pending bills/payments that need clearance. Shows OPD number, patient, amount, and items.',
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
            name: 'getBillDetails',
            description: 'Get detailed breakdown of a specific bill by bill ID.',
            parameters: {
                type: 'object',
                properties: {
                    billId: { type: 'number', description: 'The bill ID to look up' }
                },
                required: ['billId']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'getPendingBillItems',
            description: 'Get pending bill items for a specific OPD visit.',
            parameters: {
                type: 'object',
                properties: {
                    opdId: { type: 'number', description: 'The OPD entry ID' }
                },
                required: ['opdId']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'getDoctorAvailability',
            description: 'Get available doctors on a specific date. Useful for scheduling appointments.',
            parameters: {
                type: 'object',
                properties: {
                    date: { type: 'string', description: 'Date in YYYY-MM-DD format' }
                },
                required: ['date']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'getDoctorSchedule',
            description: 'Get schedule for a specific doctor at a branch.',
            parameters: {
                type: 'object',
                properties: {
                    doctorId: { type: 'number', description: 'The doctor ID' },
                    branchId: { type: 'number', description: 'The branch ID' }
                },
                required: ['doctorId', 'branchId']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'getBranchDoctors',
            description: 'Get all doctors at the current branch. Returns doctor names, departments, and specializations.',
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
            name: 'getDepartments',
            description: 'Get all departments in the hospital.',
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
            name: 'getLatestVitals',
            description: 'Get only the most recent vital signs for a patient. Faster than full vitals history.',
            parameters: {
                type: 'object',
                properties: {
                    patientId: { type: 'number', description: 'The patient ID' }
                },
                required: ['patientId']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'getVitalsStats',
            description: 'Get vitals statistics and trends over time for a patient.',
            parameters: {
                type: 'object',
                properties: {
                    patientId: { type: 'number', description: 'The patient ID' }
                },
                required: ['patientId']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'searchNotes',
            description: 'Search within a patient\'s clinical notes by keyword.',
            parameters: {
                type: 'object',
                properties: {
                    patientId: { type: 'number', description: 'The patient ID' },
                    query: { type: 'string', description: 'Search keyword to find in notes' }
                },
                required: ['patientId', 'query']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'getAllLabOrders',
            description: 'Get all lab orders across the branch. Can filter by status, category, or priority.',
            parameters: {
                type: 'object',
                properties: {
                    status: { type: 'string', description: 'Filter: Ordered, In-Progress, Completed (optional)' },
                    priority: { type: 'string', description: 'Filter: STAT, Urgent, Routine (optional)' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'getLabOrderDetail',
            description: 'Get full details of a specific lab order by ID, including results.',
            parameters: {
                type: 'object',
                properties: {
                    labOrderId: { type: 'number', description: 'The lab order ID' }
                },
                required: ['labOrderId']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'searchServices',
            description: 'Search hospital services and their pricing. Useful for looking up test costs or service availability.',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Search term for service name' }
                },
                required: ['query']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'getPatientDocuments',
            description: 'Get list of uploaded documents for a patient (lab reports, prescriptions, scans, etc.).',
            parameters: {
                type: 'object',
                properties: {
                    patientId: { type: 'number', description: 'The patient ID' }
                },
                required: ['patientId']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'getMlcDetails',
            description: 'Get Medico-Legal Case (MLC) details for an OPD visit.',
            parameters: {
                type: 'object',
                properties: {
                    opdId: { type: 'number', description: 'The OPD entry ID' }
                },
                required: ['opdId']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'checkDuplicateOPD',
            description: 'Check if a patient already has an OPD entry for today to prevent duplicates.',
            parameters: {
                type: 'object',
                properties: {
                    patientId: { type: 'number', description: 'The patient ID' },
                    doctorId: { type: 'number', description: 'The doctor ID' }
                },
                required: ['patientId']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'checkDuplicateAppointment',
            description: 'Check if a patient already has an appointment on a specific date to prevent double-booking.',
            parameters: {
                type: 'object',
                properties: {
                    patientId: { type: 'number', description: 'The patient ID' },
                    date: { type: 'string', description: 'Date in YYYY-MM-DD format' }
                },
                required: ['patientId', 'date']
            }
        }
    },
    // ============ WRITE TOOLS (require confirmation) ============
    {
        type: 'function',
        function: {
            name: 'createAppointment',
            description: 'Book a new appointment for a patient with a doctor. REQUIRES USER CONFIRMATION before execution.',
            parameters: {
                type: 'object',
                properties: {
                    patientId: { type: 'number', description: 'The patient ID' },
                    doctorId: { type: 'number', description: 'The doctor ID' },
                    date: { type: 'string', description: 'Appointment date YYYY-MM-DD' },
                    time: { type: 'string', description: 'Appointment time HH:MM' },
                    type: { type: 'string', description: 'Appointment type: New Visit, Follow Up, Consultation' }
                },
                required: ['patientId', 'doctorId', 'date', 'time']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'updateAppointmentStatus',
            description: 'Update an appointment status (Confirmed, Cancelled, No Show, Completed). REQUIRES USER CONFIRMATION.',
            parameters: {
                type: 'object',
                properties: {
                    appointmentId: { type: 'number', description: 'The appointment ID' },
                    status: { type: 'string', description: 'New status: Confirmed, Cancelled, No Show, Completed' }
                },
                required: ['appointmentId', 'status']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'rescheduleAppointment',
            description: 'Reschedule an existing appointment to a new date/time. REQUIRES USER CONFIRMATION.',
            parameters: {
                type: 'object',
                properties: {
                    appointmentId: { type: 'number', description: 'The appointment ID' },
                    newDate: { type: 'string', description: 'New date YYYY-MM-DD' },
                    newTime: { type: 'string', description: 'New time HH:MM' }
                },
                required: ['appointmentId', 'newDate', 'newTime']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'createClinicalNote',
            description: 'Create a new clinical note for a patient. REQUIRES USER CONFIRMATION.',
            parameters: {
                type: 'object',
                properties: {
                    patientId: { type: 'number', description: 'The patient ID' },
                    noteType: { type: 'string', description: 'Note type: General, SOAP, Progress, Assessment, Nursing, etc.' },
                    content: { type: 'string', description: 'The note content text' },
                    opdId: { type: 'number', description: 'OPD entry ID to associate with (optional)' }
                },
                required: ['patientId', 'noteType', 'content']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'pinNote',
            description: 'Pin or unpin a clinical note. REQUIRES USER CONFIRMATION.',
            parameters: {
                type: 'object',
                properties: {
                    noteId: { type: 'number', description: 'The clinical note ID' }
                },
                required: ['noteId']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'updateLabOrderStatus',
            description: 'Update lab order status (In-Progress, Completed, etc.). REQUIRES USER CONFIRMATION.',
            parameters: {
                type: 'object',
                properties: {
                    labOrderId: { type: 'number', description: 'The lab order ID' },
                    status: { type: 'string', description: 'New status: In-Progress, Completed' }
                },
                required: ['labOrderId', 'status']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'assignLabOrder',
            description: 'Assign a nurse to a lab order. REQUIRES USER CONFIRMATION.',
            parameters: {
                type: 'object',
                properties: {
                    labOrderId: { type: 'number', description: 'The lab order ID' },
                    nurseId: { type: 'number', description: 'The nurse user ID to assign (optional, defaults to current user)' }
                },
                required: ['labOrderId']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'updateOpdPayment',
            description: 'Update OPD payment status (mark as paid). REQUIRES USER CONFIRMATION.',
            parameters: {
                type: 'object',
                properties: {
                    opdId: { type: 'number', description: 'The OPD entry ID' },
                    paymentMethod: { type: 'string', description: 'Payment method: Cash, Card, UPI, Insurance' },
                    amount: { type: 'number', description: 'Amount paid' }
                },
                required: ['opdId', 'paymentMethod']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'updateOpdStatus',
            description: 'Update OPD visit status. REQUIRES USER CONFIRMATION.',
            parameters: {
                type: 'object',
                properties: {
                    opdId: { type: 'number', description: 'The OPD entry ID' },
                    status: { type: 'string', description: 'New status: Waiting, In Consultation, Completed, Cancelled' }
                },
                required: ['opdId', 'status']
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
