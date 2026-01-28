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
    percentages: ServicePercentage[] | string;
}

export interface HospitalService {
    service_name: string;
}
