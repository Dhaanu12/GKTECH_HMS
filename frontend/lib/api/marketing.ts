import api from '../axios';
import { ReferralDoctor, ServicePercentage } from '@/types/marketing';

export const getReferralDoctors = async (mask = true) => {
    const response = await api.get<{ success: boolean, data: ReferralDoctor[] }>(`/marketing/referral-doctors?mask=${mask}`);
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
