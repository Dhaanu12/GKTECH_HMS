/**
 * AI Agent Tool Executor
 * Executes tool calls by querying existing APIs with user's auth token
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

/**
 * Convert UTC timestamp to IST (UTC+5:30) formatted string
 * @param {string|Date} timestamp - UTC timestamp
 * @returns {string} Formatted IST string (e.g., "03 Feb 2026, 2:30 PM")
 */
function toIST(timestamp) {
    if (!timestamp) return null;

    try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return timestamp; // Return original if invalid

        // Format in IST timezone
        return date.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    } catch {
        return timestamp;
    }
}

/**
 * Convert to IST date only (no time)
 */
function toISTDate(timestamp) {
    if (!timestamp) return null;

    try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return timestamp;

        return date.toLocaleDateString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch {
        return timestamp;
    }
}

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
            // Client Admin Tools
            case 'getClientAdminDashboardStats':
                result = await executeGetClientAdminDashboardStats(args, headers);
                break;
            case 'getBranchPerformance':
                result = await executeGetBranchPerformance(args, headers);
                break;
            case 'getOverallRevenue':
                result = await executeGetOverallRevenue(args, headers);
                break;
            case 'getHospitalActivity':
                result = await executeGetHospitalActivity(args, headers);
                break;
            // New read-only tools
            case 'getFollowUps':
                result = await executeGetFollowUps(args, headers);
                break;
            case 'getPatientFollowUp':
                result = await executeGetPatientFollowUp(args, headers);
                break;
            case 'getPendingBills':
                result = await executeGetPendingBills(args, headers);
                break;
            case 'getBillDetails':
                result = await executeGetBillDetails(args, headers);
                break;
            case 'getPendingBillItems':
                result = await executeGetPendingBillItems(args, headers);
                break;
            case 'getBills':
                result = await executeGetBills(args, headers);
                break;
            case 'getDoctorAvailability':
                result = await executeGetDoctorAvailability(args, headers);
                break;
            case 'getDoctorSchedule':
                result = await executeGetDoctorSchedule(args, headers);
                break;
            case 'getBranchDoctors':
                result = await executeGetBranchDoctors(args, headers);
                break;
            case 'getDepartments':
                result = await executeGetDepartments(args, headers);
                break;
            case 'getLatestVitals':
                result = await executeGetLatestVitals(args, headers);
                break;
            case 'getVitalsStats':
                result = await executeGetVitalsStats(args, headers);
                break;
            case 'searchNotes':
                result = await executeSearchNotes(args, headers);
                break;
            case 'getAllLabOrders':
                result = await executeGetAllLabOrders(args, headers);
                break;
            case 'getLabOrderDetail':
                result = await executeGetLabOrderDetail(args, headers);
                break;
            case 'searchServices':
                result = await executeSearchServices(args, headers);
                break;
            case 'getPatientDocuments':
                result = await executeGetPatientDocuments(args, headers);
                break;
            case 'getMlcDetails':
                result = await executeGetMlcDetails(args, headers);
                break;
            case 'checkDuplicateOPD':
                result = await executeCheckDuplicateOPD(args, headers);
                break;
            case 'checkDuplicateAppointment':
                result = await executeCheckDuplicateAppointment(args, headers);
                break;
            // Write tools (return confirmation proposals)
            case 'createAppointment':
            case 'updateAppointmentStatus':
            case 'rescheduleAppointment':
            case 'createClinicalNote':
            case 'pinNote':
            case 'updateLabOrderStatus':
            case 'assignLabOrder':
            case 'updateOpdPayment':
            case 'updateOpdStatus':
                result = createWriteProposal(toolName, args);
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
    let patients = [];

    // Try full query first
    const response = await axios.get(`${API_URL}/patients/search`, {
        params: { q: query },
        headers
    });
    patients = response.data?.data?.patients || [];

    // If no results and query contains spaces, try different parts
    if (patients.length === 0 && query.includes(' ')) {
        const parts = query.trim().split(/\s+/);

        // Try each part individually until we find results
        for (const part of parts) {
            if (part.length < 2) continue; // Skip single letters like initials

            const response2 = await axios.get(`${API_URL}/patients/search`, {
                params: { q: part },
                headers
            });
            patients = response2.data?.data?.patients || [];

            if (patients.length > 0) break;
        }
    }

    if (patients.length === 0) {
        return { message: 'No patients found matching the search criteria.' };
    }

    // Format for AI context - include key info
    return {
        count: patients.length,
        patients: patients.slice(0, 10).map(p => ({
            id: p.patient_id,
            name: `${p.first_name} ${p.last_name}`,
            mrn: p.mrn_number || p.mrn,
            age: p.age,
            gender: p.gender,
            phone: p.contact_number || p.phone,
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
        dateOfBirth: toISTDate(patient.date_of_birth),
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
            recordedAt: toIST(v.recorded_at),
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
            orderedAt: toIST(o.created_at),
            orderedBy: o.doctor_name,
            resultSummary: o.result_summary || null,
            completedAt: toIST(o.completed_at)
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
            createdAt: toIST(n.created_at),
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
            date: toISTDate(a.appointment_date),
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
            date: toIST(c.consultation_date || c.created_at),
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
            visitDate: toIST(e.visit_date || e.created_at),
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
            createdAt: toIST(f.created_at),
            isAddressed: f.is_addressed
        }))
    };
}

// ============ NEW READ-ONLY TOOL IMPLEMENTATIONS ============

async function executeGetFollowUps(args, headers) {
    try {
        const response = await axios.get(`${API_URL}/follow-ups/due`, { headers });
        const data = response.data.data || response.data;
        return {
            overdue: (data.overdue || []).slice(0, 10).map(f => ({
                patientName: `${f.patient_first_name || ''} ${f.patient_last_name || ''}`.trim(),
                patientId: f.patient_id,
                followUpDate: toISTDate(f.follow_up_date),
                reason: f.reason || f.notes,
                doctorName: `${f.doctor_first_name || ''} ${f.doctor_last_name || ''}`.trim()
            })),
            dueToday: (data.due_today || []).slice(0, 10).map(f => ({
                patientName: `${f.patient_first_name || ''} ${f.patient_last_name || ''}`.trim(),
                patientId: f.patient_id,
                followUpDate: toISTDate(f.follow_up_date),
                reason: f.reason || f.notes,
                doctorName: `${f.doctor_first_name || ''} ${f.doctor_last_name || ''}`.trim()
            })),
            upcoming: (data.upcoming || []).slice(0, 10).map(f => ({
                patientName: `${f.patient_first_name || ''} ${f.patient_last_name || ''}`.trim(),
                patientId: f.patient_id,
                followUpDate: toISTDate(f.follow_up_date),
                reason: f.reason || f.notes,
                doctorName: `${f.doctor_first_name || ''} ${f.doctor_last_name || ''}`.trim()
            })),
            summary: data.summary || { overdue_count: (data.overdue || []).length, due_today_count: (data.due_today || []).length, upcoming_count: (data.upcoming || []).length }
        };
    } catch (error) {
        return { error: `Failed to fetch follow-ups: ${error.response?.data?.message || error.message}` };
    }
}

async function executeGetPatientFollowUp(args, headers) {
    try {
        const response = await axios.get(`${API_URL}/follow-ups/patient/${args.patientId}`, { headers });
        const data = response.data.data || response.data;
        const followUps = Array.isArray(data) ? data : (data.followUps || []);
        return {
            count: followUps.length,
            followUps: followUps.map(f => ({
                followUpDate: toISTDate(f.follow_up_date),
                reason: f.reason || f.notes,
                status: f.status,
                doctorName: `${f.doctor_first_name || ''} ${f.doctor_last_name || ''}`.trim(),
                createdAt: toIST(f.created_at)
            }))
        };
    } catch (error) {
        return { error: `Failed to fetch patient follow-ups: ${error.response?.data?.message || error.message}` };
    }
}

async function executeGetPendingBills(args, headers) {
    try {
        const { date } = args;
        // If date is provided, use /billing endpoint with status=Pending and date filter
        if (date) {
            const params = { status: 'Pending', startDate: date, endDate: date };
            const response = await axios.get(`${API_URL}/billing`, { params, headers });
            const items = response.data.data?.bills || [];
            return {
                date: toISTDate(date),
                count: items.length,
                totalPending: items.reduce((sum, i) => sum + (parseFloat(i.total_amount) || 0), 0),
                bills: items.slice(0, 15).map(b => ({
                    billId: b.bill_master_id,
                    opdId: b.opd_id,
                    patientName: b.patient_name || `${b.first_name || ''} ${b.last_name || ''}`.trim(),
                    amount: b.total_amount,
                    billingDate: toISTDate(b.billing_date),
                    doctor: b.doctor_name,
                    status: b.status
                }))
            };
        }
        // No date — use original pending-clearances endpoint
        const response = await axios.get(`${API_URL}/billing/pending-clearances`, { headers });
        const items = response.data.data?.pending || response.data.data?.pendingItems || response.data.data || [];
        return {
            count: items.length,
            totalPending: items.reduce((sum, i) => sum + (parseFloat(i.total_pending_amount || i.total_amount) || 0), 0),
            bills: items.slice(0, 15).map(b => ({
                opdId: b.opd_id,
                patientName: b.patient_name || `${b.first_name || ''} ${b.last_name || ''}`.trim(),
                amount: b.total_pending_amount || b.total_amount,
                visitDate: toISTDate(b.visit_date),
                doctor: b.doctor_name,
                items: b.items || b.service_name
            }))
        };
    } catch (error) {
        return { error: `Failed to fetch pending bills: ${error.response?.data?.message || error.message}` };
    }
}

async function executeGetBillDetails(args, headers) {
    try {
        const response = await axios.get(`${API_URL}/billing/${args.billId}`, { headers });
        const bill = response.data.data?.bill || response.data.data || response.data;
        return {
            billId: bill.bill_id || bill.id,
            patientName: bill.patient_name,
            totalAmount: bill.total_amount,
            paidAmount: bill.paid_amount,
            paymentStatus: bill.payment_status,
            paymentMethod: bill.payment_method,
            createdAt: toIST(bill.created_at),
            items: (bill.items || bill.details || []).map(item => ({
                serviceName: item.service_name,
                amount: item.amount,
                quantity: item.quantity
            }))
        };
    } catch (error) {
        return { error: `Failed to fetch bill details: ${error.response?.data?.message || error.message}` };
    }
}

async function executeGetPendingBillItems(args, headers) {
    try {
        const response = await axios.get(`${API_URL}/billing/pending/${args.opdId}`, { headers });
        const data = response.data.data || response.data;
        const items = Array.isArray(data) ? data : (data.items || data.pendingItems || []);
        return {
            opdId: args.opdId,
            count: items.length,
            totalPending: items.reduce((sum, i) => sum + (parseFloat(i.amount || i.total_amount) || 0), 0),
            items: items.map(i => ({
                serviceName: i.service_name,
                amount: i.amount || i.total_amount,
                status: i.payment_status || i.status
            }))
        };
    } catch (error) {
        return { error: `Failed to fetch pending bill items: ${error.response?.data?.message || error.message}` };
    }
}

async function executeGetBills(args, headers) {
    try {
        const params = {};
        if (args.startDate) params.startDate = args.startDate;
        if (args.endDate) params.endDate = args.endDate;
        if (args.status) params.status = args.status;
        if (args.search) params.search = args.search;

        const response = await axios.get(`${API_URL}/billing`, { params, headers });
        const bills = response.data.data?.bills || [];

        const totalAmount = bills.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
        const paidBills = bills.filter(b => b.status === 'Paid');
        const pendingBills = bills.filter(b => b.status === 'Pending');
        const paidTotal = paidBills.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
        const pendingTotal = pendingBills.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);

        return {
            totalBills: bills.length,
            totalAmount,
            paidCount: paidBills.length,
            paidTotal,
            pendingCount: pendingBills.length,
            pendingTotal,
            dateRange: args.startDate && args.endDate
                ? (args.startDate === args.endDate ? toISTDate(args.startDate) : `${toISTDate(args.startDate)} to ${toISTDate(args.endDate)}`)
                : 'all',
            bills: bills.slice(0, 15).map(b => ({
                billId: b.bill_master_id,
                invoiceNumber: b.invoice_number,
                patientName: b.patient_name,
                amount: b.total_amount,
                status: b.status,
                billingDate: toISTDate(b.billing_date),
                doctor: b.doctor_name
            }))
        };
    } catch (error) {
        return { error: `Failed to fetch bills: ${error.response?.data?.message || error.message}` };
    }
}

async function executeGetDoctorAvailability(args, headers) {
    try {
        const response = await axios.get(`${API_URL}/doctor-schedules/available`, {
            params: { date: args.date },
            headers
        });
        const doctors = response.data.data?.doctors || response.data.data || [];
        return {
            date: args.date,
            availableDoctors: (Array.isArray(doctors) ? doctors : []).map(d => ({
                doctorId: d.doctor_id || d.id,
                name: `Dr. ${d.first_name || ''} ${d.last_name || ''}`.trim(),
                department: d.department_name || d.department,
                specialization: d.specialization,
                availableSlots: d.available_slots || d.slots
            }))
        };
    } catch (error) {
        return { error: `Failed to fetch doctor availability: ${error.response?.data?.message || error.message}` };
    }
}

async function executeGetDoctorSchedule(args, headers) {
    try {
        const response = await axios.get(`${API_URL}/doctor-schedules/doctor/${args.doctorId}/${args.branchId}`, { headers });
        const schedule = response.data.data?.schedule || response.data.data || [];
        return {
            doctorId: args.doctorId,
            schedule: (Array.isArray(schedule) ? schedule : []).map(s => ({
                day: s.day_of_week || s.day,
                startTime: s.start_time,
                endTime: s.end_time,
                slotDuration: s.slot_duration_minutes || s.slot_duration,
                maxPatients: s.max_patients
            }))
        };
    } catch (error) {
        return { error: `Failed to fetch doctor schedule: ${error.response?.data?.message || error.message}` };
    }
}

async function executeGetBranchDoctors(args, headers) {
    try {
        const response = await axios.get(`${API_URL}/doctors/my-branch`, { headers });
        const doctors = response.data.data?.doctors || response.data.data || [];
        return {
            count: doctors.length,
            doctors: (Array.isArray(doctors) ? doctors : []).map(d => ({
                doctorId: d.doctor_id || d.user_id || d.id,
                name: `Dr. ${d.first_name || ''} ${d.last_name || ''}`.trim(),
                department: d.department_name || d.department,
                specialization: d.specialization,
                phone: d.contact_number || d.phone
            }))
        };
    } catch (error) {
        return { error: `Failed to fetch branch doctors: ${error.response?.data?.message || error.message}` };
    }
}

async function executeGetDepartments(args, headers) {
    try {
        const response = await axios.get(`${API_URL}/departments/hospital`, { headers });
        const depts = response.data.data?.departments || response.data.data || [];
        return {
            count: depts.length,
            departments: (Array.isArray(depts) ? depts : []).map(d => ({
                id: d.department_id || d.id,
                name: d.name || d.department_name,
                description: d.description
            }))
        };
    } catch (error) {
        return { error: `Failed to fetch departments: ${error.response?.data?.message || error.message}` };
    }
}

async function executeGetLatestVitals(args, headers) {
    try {
        const response = await axios.get(`${API_URL}/vitals/patient/${args.patientId}/latest`, { headers });
        const v = response.data.data?.vitals || response.data.data || {};
        if (!v || Object.keys(v).length === 0) {
            return { message: 'No vitals recorded for this patient.' };
        }
        return {
            recordedAt: toIST(v.recorded_at),
            pulseRate: v.pulse_rate ? `${v.pulse_rate} bpm` : null,
            bloodPressure: v.blood_pressure_systolic && v.blood_pressure_diastolic
                ? `${v.blood_pressure_systolic}/${v.blood_pressure_diastolic} mmHg` : null,
            temperature: v.temperature ? `${v.temperature}°F` : null,
            spO2: v.spo2 ? `${v.spo2}%` : null,
            respiratoryRate: v.respiratory_rate ? `${v.respiratory_rate} /min` : null,
            weight: v.weight ? `${v.weight} kg` : null,
            height: v.height ? `${v.height} cm` : null,
            bloodGlucose: v.blood_glucose ? `${v.blood_glucose} mg/dL` : null
        };
    } catch (error) {
        return { error: `Failed to fetch latest vitals: ${error.response?.data?.message || error.message}` };
    }
}

async function executeGetVitalsStats(args, headers) {
    try {
        const response = await axios.get(`${API_URL}/vitals/patient/${args.patientId}/stats`, { headers });
        const stats = response.data.data || response.data;
        return stats;
    } catch (error) {
        return { error: `Failed to fetch vitals stats: ${error.response?.data?.message || error.message}` };
    }
}

async function executeSearchNotes(args, headers) {
    try {
        const response = await axios.get(`${API_URL}/clinical-notes/patient/${args.patientId}/search`, {
            params: { query: args.query },
            headers
        });
        const notes = response.data.data?.notes || response.data.data || [];
        if (notes.length === 0) {
            return { message: `No notes found matching "${args.query}".` };
        }
        return {
            count: notes.length,
            notes: notes.slice(0, 10).map(n => ({
                id: n.note_id || n.id,
                type: n.note_type,
                content: (n.content || '').substring(0, 200),
                createdAt: toIST(n.created_at),
                author: n.author_name || `${n.first_name || ''} ${n.last_name || ''}`.trim()
            }))
        };
    } catch (error) {
        return { error: `Failed to search notes: ${error.response?.data?.message || error.message}` };
    }
}

async function executeGetAllLabOrders(args, headers) {
    try {
        const params = {};
        if (args.status) params.status = args.status;
        if (args.priority) params.priority = args.priority;
        const response = await axios.get(`${API_URL}/lab-orders`, { params, headers });
        const orders = response.data.data?.orders || response.data.data || [];
        return {
            count: orders.length,
            orders: (Array.isArray(orders) ? orders : []).slice(0, 15).map(o => ({
                id: o.order_id || o.id,
                patientName: o.patient_name || `${o.first_name || ''} ${o.last_name || ''}`.trim(),
                testName: o.test_name || o.service_name,
                status: o.status,
                priority: o.priority,
                orderedAt: toIST(o.ordered_at || o.created_at),
                assignedNurse: o.assigned_nurse_name || o.nurse_name
            }))
        };
    } catch (error) {
        return { error: `Failed to fetch lab orders: ${error.response?.data?.message || error.message}` };
    }
}

async function executeGetLabOrderDetail(args, headers) {
    try {
        const response = await axios.get(`${API_URL}/lab-orders/${args.labOrderId}`, { headers });
        const order = response.data.data?.order || response.data.data || {};
        return {
            id: order.order_id || order.id,
            patientName: order.patient_name,
            testName: order.test_name || order.service_name,
            status: order.status,
            priority: order.priority,
            orderedAt: toIST(order.ordered_at || order.created_at),
            completedAt: order.completed_at ? toIST(order.completed_at) : null,
            results: order.results || order.result_data,
            notes: order.notes,
            assignedNurse: order.assigned_nurse_name
        };
    } catch (error) {
        return { error: `Failed to fetch lab order detail: ${error.response?.data?.message || error.message}` };
    }
}

async function executeSearchServices(args, headers) {
    try {
        const response = await axios.get(`${API_URL}/services/search`, {
            params: { q: args.query },
            headers
        });
        const services = response.data.data?.services || response.data.data || [];
        if (services.length === 0) {
            return { message: `No services found matching "${args.query}".` };
        }
        return {
            count: services.length,
            services: (Array.isArray(services) ? services : []).slice(0, 10).map(s => ({
                id: s.service_id || s.id,
                name: s.name || s.service_name,
                category: s.category,
                price: s.price || s.amount,
                description: s.description
            }))
        };
    } catch (error) {
        return { error: `Failed to search services: ${error.response?.data?.message || error.message}` };
    }
}

async function executeGetPatientDocuments(args, headers) {
    try {
        const response = await axios.get(`${API_URL}/patient-documents/patient/${args.patientId}`, { headers });
        const docs = response.data.data?.documents || response.data.data || [];
        if (docs.length === 0) {
            return { message: 'No documents found for this patient.' };
        }
        return {
            count: docs.length,
            documents: docs.map(d => ({
                id: d.document_id || d.id,
                name: d.document_name || d.name || d.file_name,
                type: d.document_type || d.type,
                uploadedAt: toIST(d.uploaded_at || d.created_at),
                uploadedBy: d.uploaded_by_name
            }))
        };
    } catch (error) {
        return { error: `Failed to fetch patient documents: ${error.response?.data?.message || error.message}` };
    }
}

async function executeGetMlcDetails(args, headers) {
    try {
        const response = await axios.get(`${API_URL}/mlc/opd/${args.opdId}`, { headers });
        const mlc = response.data.data?.mlc || response.data.data || {};
        if (!mlc || Object.keys(mlc).length === 0) {
            return { message: 'No MLC record found for this OPD visit.' };
        }
        return {
            mlcId: mlc.mlc_id || mlc.id,
            mlcNumber: mlc.mlc_number,
            type: mlc.type || mlc.case_type,
            status: mlc.status,
            policeStation: mlc.police_station,
            firNumber: mlc.fir_number,
            broughtBy: mlc.brought_by,
            incidentDetails: mlc.incident_details,
            createdAt: toIST(mlc.created_at)
        };
    } catch (error) {
        return { error: `Failed to fetch MLC details: ${error.response?.data?.message || error.message}` };
    }
}

async function executeCheckDuplicateOPD(args, headers) {
    try {
        const params = { patientId: args.patientId };
        if (args.doctorId) params.doctorId = args.doctorId;
        const response = await axios.get(`${API_URL}/opd/check-duplicate`, { params, headers });
        const data = response.data.data || response.data;
        return {
            isDuplicate: data.isDuplicate || data.exists || false,
            existingEntry: data.existingEntry || data.opd || null,
            message: (data.isDuplicate || data.exists) ? 'A duplicate OPD entry exists for this patient today.' : 'No duplicate OPD entry found.'
        };
    } catch (error) {
        return { error: `Failed to check duplicate OPD: ${error.response?.data?.message || error.message}` };
    }
}

async function executeCheckDuplicateAppointment(args, headers) {
    try {
        const response = await axios.get(`${API_URL}/appointments/check-duplicate`, {
            params: { patientId: args.patientId, date: args.date },
            headers
        });
        const data = response.data.data || response.data;
        return {
            isDuplicate: data.isDuplicate || data.exists || false,
            existingAppointment: data.existingAppointment || data.appointment || null,
            message: (data.isDuplicate || data.exists) ? `Patient already has an appointment on ${args.date}.` : 'No duplicate appointment found.'
        };
    } catch (error) {
        return { error: `Failed to check duplicate appointment: ${error.response?.data?.message || error.message}` };
    }
}

// ============ WRITE TOOL PROPOSAL (confirmation flow) ============

const WRITE_TOOL_LABELS = {
    createAppointment: 'Create Appointment',
    updateAppointmentStatus: 'Update Appointment Status',
    rescheduleAppointment: 'Reschedule Appointment',
    createClinicalNote: 'Create Clinical Note',
    pinNote: 'Pin/Unpin Note',
    updateLabOrderStatus: 'Update Lab Order Status',
    assignLabOrder: 'Assign Lab Order',
    updateOpdPayment: 'Update OPD Payment',
    updateOpdStatus: 'Update OPD Status'
};

function createWriteProposal(toolName, args) {
    return {
        requiresConfirmation: true,
        action: toolName,
        label: WRITE_TOOL_LABELS[toolName] || toolName,
        params: args,
        summary: buildProposalSummary(toolName, args)
    };
}

function buildProposalSummary(toolName, args) {
    switch (toolName) {
        case 'createAppointment':
            return `Book appointment for patient #${args.patientId} with doctor #${args.doctorId} on ${args.date} at ${args.time}`;
        case 'updateAppointmentStatus':
            return `Change appointment #${args.appointmentId} status to "${args.status}"`;
        case 'rescheduleAppointment':
            return `Reschedule appointment #${args.appointmentId} to ${args.newDate} at ${args.newTime}`;
        case 'createClinicalNote':
            return `Add ${args.noteType} note for patient #${args.patientId}: "${(args.content || '').substring(0, 80)}"`;
        case 'pinNote':
            return `Toggle pin on note #${args.noteId}`;
        case 'updateLabOrderStatus':
            return `Update lab order #${args.labOrderId} status to "${args.status}"`;
        case 'assignLabOrder':
            return `Assign lab order #${args.labOrderId}${args.nurseId ? ` to nurse #${args.nurseId}` : ' to current user'}`;
        case 'updateOpdPayment':
            return `Mark OPD #${args.opdId} payment as received via ${args.paymentMethod}${args.amount ? ` (Rs.${args.amount})` : ''}`;
        case 'updateOpdStatus':
            return `Update OPD #${args.opdId} status to "${args.status}"`;
        default:
            return `Execute ${toolName} with ${JSON.stringify(args)}`;
    }
}

// ============ NEW CLIENT ADMIN TOOL IMPLEMENTATIONS ============

async function executeGetClientAdminDashboardStats(args, headers) {
    try {
        const response = await axios.get(`${API_URL}/clientadmins/stats`, { headers });
        const stats = response.data.data?.stats || {};
        return {
            totalBranches: stats.branches || 0,
            activeStaff: (stats.doctors || 0) + (stats.nurses || 0) + (stats.receptionists || 0),
            totalPatientsToday: "Use /clientadmins/analytics for detailed metrics",
            revenueToday: "Use /clientadmins/analytics for detailed metrics"
        };
    } catch (error) {
        return { error: `Failed to fetch client admin dashboard stats: ${error.response?.data?.message || error.message}` };
    }
}

async function executeGetBranchPerformance(args, headers) {
    try {
        const params = {};
        if (args.dateRange) params.startDate = args.dateRange;

        const response = await axios.get(`${API_URL}/clientadmins/reports/branch`, { params, headers });
        const data = response.data.data || [];

        return {
            count: data.length,
            branchPerformance: data.slice(0, 5).map(b => ({
                branchName: b.branch_name,
                appointments: b.total_appointments || 0,
                revenue: b.total_revenue || 0,
                patients: b.unique_patients || 0
            }))
        };
    } catch (error) {
        return { error: `Failed to fetch branch performance: ${error.response?.data?.message || error.message}` };
    }
}

async function executeGetOverallRevenue(args, headers) {
    try {
        const params = {};
        if (args.dateRange) params.startDate = args.dateRange;

        const response = await axios.get(`${API_URL}/clientadmins/analytics`, { params, headers });
        const data = response.data.data || {};
        const summary = data.summary || {};

        return {
            totalRevenue: summary.total_revenue || 0,
            totalOpdVisits: summary.total_opd_visits || 0,
            uniquePatients: summary.unique_patients || 0
        };
    } catch (error) {
        return { error: `Failed to fetch overall analytics/revenue: ${error.response?.data?.message || error.message}` };
    }
}

async function executeGetHospitalActivity(args, headers) {
    // There is no dedicated activity endpoint currently, returning a generic confirmation
    return {
        recentActivity: "Detailed hospital activity logs are currently unsupported via this API.",
        count: 0
    };
}

module.exports = {
    executeTool
};
