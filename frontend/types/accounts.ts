export interface ServicePercentage {
    referral_doctor_id?: number;
    service_type: string;
    cash_percentage: number;
    inpatient_percentage: number;
    referral_pay: string;
    status?: string;
}

export interface ReferralDoctor {
    id: number;
    doctor_name: string;
    speciality_type: string;
    mobile_number: string;
    status?: string;
    medical_council_membership_number?: string;
    clinic_name?: string;
    hospital_name?: string;
    percentages: ServicePercentage[] | string;
    created_at?: string; // For sorting
}

export interface HospitalService {
    service_name: string;
}

export interface GSTCalculationRequest {
    service_amount: number;
    referral_percentage: number;
    gst_rate: number;
}

export interface GSTCalculation {
    service_amount: string;
    referral_percentage: string;
    referral_amount: string;
    gst_rate: string;
    gst_amount: string;
    total_payable: string;
}

export interface ReferralSummary {
    referral_doctor_id: number;
    doctor_name: string;
    speciality_type: string;
    service_type: string;
    cash_percentage: number;
    inpatient_percentage: number;
    service_name: string;
    gst_rate: number;
}
