import api from '../axios';
import { ReferralDoctor, HospitalService, GSTCalculation, GSTCalculationRequest, ReferralSummary } from '@/types/accounts';

/**
 * Get all referral doctors with their service percentages
 */
export const getReferralDoctorsWithPercentages = async () => {
    const response = await api.get<{ success: boolean, data: ReferralDoctor[] }>('/marketing/referral-doctors-with-percentages');
    return response.data;
};

/**
 * Get all hospital services
 */
export const getHospitalServices = async () => {
    const response = await api.get<{ success: boolean, data: HospitalService[] }>('/marketing/hospital-services');
    return response.data;
};

/**
 * Calculate GST for a service
 */
export const calculateGST = async (data: GSTCalculationRequest) => {
    const response = await api.post<{ success: boolean, data: GSTCalculation }>('/marketing/calculate-gst', data);
    return response.data;
};

/**
 * Update GST rate for a hospital service
 */
export const updateServiceGSTRate = async (hosp_service_id: number, gst_rate: number) => {
    const response = await api.put<{ success: boolean, data: HospitalService }>(`/marketing/service-gst/${hosp_service_id}`, { gst_rate });
    return response.data;
};

/**
 * Get referral summary/report
 */
export const getReferralSummary = async (referral_doctor_id?: number) => {
    const params = referral_doctor_id ? `?referral_doctor_id=${referral_doctor_id}` : '';
    const response = await api.get<{ success: boolean, data: ReferralSummary[] }>(`/marketing/referral-summary${params}`);
    return response.data;
};

/**
 * Upsert service percentage (from existing marketing API)
 */
export const upsertServicePercentage = async (data: {
    referral_doctor_id: number;
    service_type: string;
    referral_pay: string;
    cash_percentage: number;
    inpatient_percentage: number;
    status: string;
}) => {
    const response = await api.post('/marketing/referral-doctors/percentages', data);
    return response.data;
};

/**
 * Bulk insert service percentages for multiple doctors
 */
export const bulkInsertServicePercentages = async (data: {
    doctor_ids: number[];
    services: Array<{
        service_type: string;
        cash_percentage: number;
        inpatient_percentage: number;
        referral_pay: string;
    }>;
}) => {
    const response = await api.post('/marketing/bulk-service-percentages', data);
    return response.data;
};

/**
 * Copy service percentages from one doctor to others
 */
export const copyServicePercentages = async (data: {
    source_doctor_id: number;
    target_doctor_ids: number[];
}) => {
    const response = await api.post('/marketing/copy-service-percentages', data);
    return response.data;
};

/**
 * Get doctors without service percentages
 */
export const getDoctorsWithoutPercentages = async () => {
    const response = await api.get('/marketing/doctors-without-percentages');
    return response.data;
};

/**
 * Export CSV template
 */
export const exportCSVTemplate = async () => {
    const response = await api.get('/marketing/export-csv-template', {
        responseType: 'blob'
    });
    return response.data;
};

/**
 * Import CSV data
 */
export const importCSV = async (csv_data: Array<{
    doctor_id: number;
    service_type: string;
    referral_pay: string;
    cash_percentage: number;
    inpatient_percentage: number;
}>, dry_run: boolean = false) => {
    const response = await api.post('/marketing/import-csv', { csv_data, dry_run });
    return response.data;
};

/**
 * Export actual doctor configurations
 */
export const exportDoctorConfigs = async (status?: string) => {
    const response = await api.get('/marketing/export-doctor-configs', {
        params: { status },
        responseType: 'blob'
    });
    return response.data;
};
