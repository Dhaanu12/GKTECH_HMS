import api from '../axios';
import { ReferralDoctor, ReferralAgent, ServicePercentage } from '@/types/marketing';

export const getReferralDoctors = async (mask = true) => {
    const response = await api.get<{ success: boolean, data: ReferralDoctor[] }>(`/marketing/referral-doctors?mask=${mask}`);
    return response.data;
};

export const getReferralDoctorById = async (id: number) => {
    const response = await api.get<{ success: boolean, data: ReferralDoctor }>(`/marketing/referral-doctors/${id}`);
    return response.data;
};

// Patients
// Using ANY for now as type definition for Patient is not fully in marketing.ts, but handled in component
export const getReferralPatients = async () => {
    const response = await api.get<{ success: boolean, data: any[] }>('/marketing/referral-patients');
    return response.data;
};

export const createReferralPatient = async (data: any) => {
    const response = await api.post<{ success: boolean, data: any }>('/marketing/referral-patients', data);
    return response.data;
};

export const createReferralDoctor = async (formData: FormData) => {
    // Note: Use FormData for file uploads
    const response = await api.post<{ success: boolean, data: ReferralDoctor }>('/marketing/referral-doctors', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const updateReferralDoctor = async (id: number, formData: FormData) => {
    const response = await api.put<{ success: boolean, data: ReferralDoctor }>(`/marketing/referral-doctors/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const getDoctorPercentages = async (doctorId: number) => {
    const response = await api.get<{ success: boolean, data: ServicePercentage[] }>(`/marketing/referral-doctors/${doctorId}/percentages`);
    return response.data;
};

export const upsertDoctorPercentage = async (data: Partial<ServicePercentage>) => {
    const response = await api.post<{ success: boolean, data: ServicePercentage }>('/marketing/referral-doctors/percentages', data);
    return response.data;
};

// Agents
export const getReferralAgents = async () => {
    const response = await api.get<{ success: boolean, data: ReferralAgent[] }>('/marketing/referral-agents');
    return response.data;
};

export const createReferralAgent = async (data: any) => {
    const response = await api.post<{ success: boolean, data: ReferralAgent }>('/marketing/referral-agents', data);
    return response.data;
};

export const updateReferralAgent = async (id: number, data: any) => {
    const response = await api.put<{ success: boolean, data: ReferralAgent }>(`/marketing/referral-agents/${id}`, data);
    return response.data;
};

export const deleteReferralAgent = async (id: number) => {
    const response = await api.delete<{ success: boolean, message: string }>(`/marketing/referral-agents/${id}`);
    return response.data;
};

export const bulkUpdateReferralAgents = async (agents: Partial<ReferralAgent>[]) => {
    const response = await api.put<{ success: boolean, message: string, updatedCount: number }>('/marketing/referral-agents/bulk', { agents });
    return response.data;
};
