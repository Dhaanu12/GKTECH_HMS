/**
 * AI Agent Tool Executor
 * Executes tool calls by querying existing APIs with user's auth token
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

/**
 * Execute a tool call
 * @param {string} toolName - Name of the tool to execute
 * @param {object} args - Tool arguments
 * @param {string} authToken - User's auth token for API calls
 * @returns {Promise<object>} Tool execution result
 */
async function executeTool(toolName, args, authToken) {
    const headers = {
        Authorization: authToken,
        'Content-Type': 'application/json'
    };

    try {
        let result;
        
        switch (toolName) {
            case 'searchPatients':
                result = await executeSearchPatients(args, headers);
                break;
            case 'getPatientDetails':
                result = await executeGetPatientDetails(args, headers);
                break;
            case 'getPatientVitals':
                result = await executeGetPatientVitals(args, headers);
                break;
            case 'getPatientLabOrders':
                result = await executeGetPatientLabOrders(args, headers);
                break;
            case 'getPatientNotes':
                result = await executeGetPatientNotes(args, headers);
                break;
            case 'getAppointments':
                result = await executeGetAppointments(args, headers);
                break;
            case 'getPatientConsultations':
                result = await executeGetPatientConsultations(args, headers);
                break;
            case 'getOpdEntries':
                result = await executeGetOpdEntries(args, headers);
                break;
            case 'getDashboardStats':
                result = await executeGetDashboardStats(args, headers);
                break;
            case 'getPatientFeedback':
                result = await executeGetPatientFeedback(args, headers);
                break;
            default:
                return { error: `Unknown tool: ${toolName}` };
        }

        return result;
    } catch (error) {
        console.error(`Tool execution error (${toolName}):`, error.message);
        
        if (error.response?.status === 401) {
            return { error: 'Authentication failed. User may not have permission to access this data.' };
        }
        if (error.response?.status === 403) {
            return { error: 'Access denied. User does not have permission to access this data.' };
        }
        if (error.response?.status === 404) {
            return { error: 'Data not found.' };
        }
        
        return { error: `Failed to execute ${toolName}: ${error.message}` };
    }
}

// ============ Tool Implementations ============

async function executeSearchPatients(args, headers) {
    const { query } = args;
    const response = await axios.get(`${API_URL}/patients/search`, {
        params: { q: query },
        headers
    });
    
    const patients = response.data?.data?.patients || [];
    
    if (patients.length === 0) {
        return { message: 'No patients found matching the search criteria.' };
    }
    
    // Format for AI context - include key info
    return {
        count: patients.length,
        patients: patients.slice(0, 10).map(p => ({
            id: p.patient_id,
            name: `${p.first_name} ${p.last_name}`,
            mrn: p.mrn,
            age: p.age,
            gender: p.gender,
            phone: p.phone,
            bloodGroup: p.blood_group
        }))
    };
}

async function executeGetPatientDetails(args, headers) {
    const { patientId } = args;
    const response = await axios.get(`${API_URL}/patients/${patientId}`, { headers });
    
    const patient = response.data?.data?.patient;
    if (!patient) {
        return { error: 'Patient not found' };
    }
    
    return {
        id: patient.patient_id,
        name: `${patient.first_name} ${patient.last_name}`,
        mrn: patient.mrn,
        dateOfBirth: patient.date_of_birth,
        age: patient.age,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        bloodGroup: patient.blood_group,
        allergies: patient.allergies || 'None known',
        medicalHistory: patient.medical_history || 'None recorded',
        emergencyContact: patient.emergency_contact_name,
        emergencyPhone: patient.emergency_contact_phone
    };
}

async function executeGetPatientVitals(args, headers) {
    const { patientId, limit = 10 } = args;
    const response = await axios.get(`${API_URL}/vitals/patient/${patientId}`, { headers });
    
    const vitals = response.data?.data?.vitals || [];
    
    if (vitals.length === 0) {
        return { message: 'No vitals recorded for this patient.' };
    }
    
    return {
        count: vitals.length,
        vitals: vitals.slice(0, limit).map(v => ({
            recordedAt: v.recorded_at,
            pulseRate: v.pulse_rate ? `${v.pulse_rate} bpm` : null,
            bloodPressure: v.blood_pressure_systolic && v.blood_pressure_diastolic 
                ? `${v.blood_pressure_systolic}/${v.blood_pressure_diastolic} mmHg` 
                : null,
            temperature: v.temperature ? `${v.temperature}°F` : null,
            spO2: v.spo2 ? `${v.spo2}%` : null,
            respiratoryRate: v.respiratory_rate ? `${v.respiratory_rate}/min` : null,
            weight: v.weight ? `${v.weight} kg` : null,
            height: v.height ? `${v.height} cm` : null,
            bloodGlucose: v.blood_glucose ? `${v.blood_glucose} mg/dL` : null,
            painLevel: v.pain_level
        }))
    };
}

async function executeGetPatientLabOrders(args, headers) {
    const { patientId, includeCompleted = true } = args;
    const response = await axios.get(`${API_URL}/lab-orders/patient/${patientId}`, {
        params: { includeCompleted },
        headers
    });
    
    const orders = response.data?.data?.orders || [];
    
    if (orders.length === 0) {
        return { message: 'No lab orders found for this patient.' };
    }
    
    return {
        count: orders.length,
        orders: orders.map(o => ({
            id: o.lab_order_id,
            testName: o.test_name,
            status: o.status,
            orderedAt: o.created_at,
            orderedBy: o.doctor_name,
            resultSummary: o.result_summary || null,
            completedAt: o.completed_at
        }))
    };
}

async function executeGetPatientNotes(args, headers) {
    const { patientId, noteType } = args;
    let url = `${API_URL}/clinical-notes/patient/${patientId}`;
    
    const response = await axios.get(url, { headers });
    
    let notes = response.data?.data?.notes || [];
    
    if (noteType) {
        notes = notes.filter(n => n.note_type?.toLowerCase() === noteType.toLowerCase());
    }
    
    if (notes.length === 0) {
        return { message: 'No clinical notes found for this patient.' };
    }
    
    return {
        count: notes.length,
        notes: notes.slice(0, 10).map(n => ({
            id: n.note_id,
            type: n.note_type,
            content: n.content?.substring(0, 500) + (n.content?.length > 500 ? '...' : ''),
            createdAt: n.created_at,
            createdBy: n.created_by_name,
            isPinned: n.is_pinned
        }))
    };
}

async function executeGetAppointments(args, headers) {
    const { patientId, doctorId, date, status } = args;
    const params = {};
    
    if (patientId) params.patientId = patientId;
    if (doctorId) params.doctorId = doctorId;
    if (date) params.date = date;
    if (status) params.status = status;
    
    const response = await axios.get(`${API_URL}/appointments`, {
        params,
        headers
    });
    
    const appointments = response.data?.data?.appointments || [];
    
    if (appointments.length === 0) {
        return { message: 'No appointments found matching the criteria.' };
    }
    
    return {
        count: appointments.length,
        appointments: appointments.slice(0, 15).map(a => ({
            id: a.appointment_id,
            patientName: a.patient_name,
            doctorName: a.doctor_name,
            date: a.appointment_date,
            time: a.appointment_time,
            status: a.status,
            type: a.appointment_type,
            notes: a.notes
        }))
    };
}

async function executeGetPatientConsultations(args, headers) {
    const { patientId } = args;
    const response = await axios.get(`${API_URL}/consultations/patient/${patientId}`, { headers });
    
    const consultations = response.data?.data?.consultations || response.data?.data || [];
    
    if (consultations.length === 0) {
        return { message: 'No consultations found for this patient.' };
    }
    
    return {
        count: consultations.length,
        consultations: consultations.slice(0, 10).map(c => ({
            id: c.consultation_id,
            date: c.consultation_date || c.created_at,
            doctorName: c.doctor_name,
            chiefComplaint: c.chief_complaint,
            diagnosis: c.diagnosis,
            notes: c.notes?.substring(0, 300) + (c.notes?.length > 300 ? '...' : ''),
            prescriptions: c.prescriptions || []
        }))
    };
}

async function executeGetOpdEntries(args, headers) {
    const { patientId, date } = args;
    
    let url;
    if (patientId) {
        url = `${API_URL}/opd/patient/${patientId}`;
    } else {
        url = `${API_URL}/opd`;
    }
    
    const params = {};
    if (date) params.date = date;
    
    const response = await axios.get(url, { params, headers });
    
    const entries = response.data?.data?.opdHistory || response.data?.data?.entries || [];
    
    if (entries.length === 0) {
        return { message: 'No OPD entries found.' };
    }
    
    return {
        count: entries.length,
        entries: entries.slice(0, 15).map(e => ({
            id: e.opd_id,
            patientName: e.patient_name,
            doctorName: e.doctor_name,
            visitDate: e.visit_date || e.created_at,
            status: e.status,
            paymentStatus: e.payment_status,
            chiefComplaint: e.chief_complaint
        }))
    };
}

async function executeGetDashboardStats(args, headers) {
    try {
        const response = await axios.get(`${API_URL}/opd/stats`, { headers });
        return response.data?.data || { message: 'Dashboard stats not available' };
    } catch (error) {
        // Try alternative endpoint
        try {
            const response = await axios.get(`${API_URL}/opd/stats/analytics`, { headers });
            return response.data?.data || { message: 'Dashboard stats not available' };
        } catch {
            return { message: 'Dashboard stats endpoint not accessible for this user role.' };
        }
    }
}

async function executeGetPatientFeedback(args, headers) {
    const { patientId } = args;
    const params = {};
    if (patientId) params.patientId = patientId;
    
    const response = await axios.get(`${API_URL}/feedback`, {
        params,
        headers
    });
    
    const feedback = response.data?.data?.feedback || [];
    
    if (feedback.length === 0) {
        return { message: 'No feedback found.' };
    }
    
    return {
        count: feedback.length,
        feedback: feedback.slice(0, 10).map(f => ({
            id: f.feedback_id,
            patientName: f.patient_name,
            rating: f.rating,
            comment: f.comment,
            category: f.category,
            createdAt: f.created_at,
            isAddressed: f.is_addressed
        }))
    };
}

module.exports = {
    executeTool
};
