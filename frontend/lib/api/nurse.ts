import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// Get auth token from localStorage
const getToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('token');
    }
    return null;
};

// Create axios instance with auth
const createAuthConfig = () => ({
    headers: { Authorization: `Bearer ${getToken()}` }
});

// Types
export interface LabOrder {
    order_id: number;
    order_number: string;
    patient_id: number;
    patient_name: string;
    mrn_number: string;
    patient_phone: string;
    doctor_name: string;
    nurse_name: string | null;
    branch_name: string;
    test_name: string;
    test_code: string | null;
    test_category: string;
    priority: 'Routine' | 'Urgent' | 'STAT';
    status: 'Ordered' | 'In-Progress' | 'Completed' | 'Cancelled';
    ordered_at: string;
    scheduled_for: string | null;
    completed_at: string | null;
    instructions: string | null;
    notes: string | null;
    result_summary: string | null;
    assigned_nurse_id: number | null;
    source: string; // 'billing_master' (in-house) or 'medical_service' (external)
}

export interface StatusCounts {
    Ordered: number;
    'In-Progress': number;
    Completed: number;
    Cancelled: number;
}

export interface OPDEntry {
    opd_id: number;
    opd_number: string;
    patient_id: number;
    patient_name: string;
    mrn_number: string;
    contact_number: string;
    token_number: number | null;
    visit_type: string;
    visit_status: string;
    visit_date: string;
    visit_time: string;
    doctor_name: string;
    vital_signs: Record<string, any> | null;
    symptoms: string | null;
    chief_complaint: string | null;
    checked_in_time: string | null;
}

export interface Patient {
    patient_id: number;
    first_name: string;
    last_name: string;
    mrn_number: string;
    contact_number: string;
    age: number;
    gender: string;
    blood_group: string | null;
}

export interface LabOrderFilters {
    status?: string;
    priority?: string;
    category?: string;
    date?: string;
    includeCompleted?: boolean;
}

// Fetch lab orders with filters
export const fetchLabOrders = async (filters: LabOrderFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.category) params.append('category', filters.category);
    if (filters.date) params.append('date', filters.date);
    if (filters.includeCompleted) params.append('includeCompleted', 'true');

    const response = await axios.get(`${API_BASE}/lab-orders?${params.toString()}`, createAuthConfig());
    return response.data;
};

// Fetch today's OPD entries
export const fetchOPDEntries = async (date?: string) => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);

    const response = await axios.get(`${API_BASE}/opd?${params.toString()}`, createAuthConfig());
    return response.data;
};

// Search patients (general search - searches name, phone, mrn, code)
export const searchPatients = async (query: string, type?: 'phone' | 'mrn' | 'code') => {
    const params = new URLSearchParams();
    params.append('q', query);
    if (type) params.append('type', type);

    const response = await axios.get(`${API_BASE}/patients/search?${params.toString()}`, createAuthConfig());
    return response.data;
};

// Update lab order status
export const updateLabOrderStatus = async (orderId: number, status: string, notes?: string) => {
    const response = await axios.patch(
        `${API_BASE}/lab-orders/${orderId}/status`,
        { status, notes },
        createAuthConfig()
    );
    return response.data;
};

// Assign nurse to lab order
export const assignNurseToOrder = async (orderId: number, nurseId?: number) => {
    const response = await axios.patch(
        `${API_BASE}/lab-orders/${orderId}/assign`,
        { nurse_id: nurseId },
        createAuthConfig()
    );
    return response.data;
};

// Get patient by ID
export const getPatientById = async (patientId: number) => {
    const response = await axios.get(`${API_BASE}/patients/${patientId}`, createAuthConfig());
    return response.data;
};

// Get OPD entry details
export const getOPDEntryById = async (opdId: number) => {
    const response = await axios.get(`${API_BASE}/opd/${opdId}`, createAuthConfig());
    return response.data;
};
