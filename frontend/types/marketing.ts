export interface ReferralDoctor {
    id: number;
    doctor_name: string;
    clinic_name?: string;
    mobile_number: string;
    speciality_type?: string;
    department_id?: number;
    address?: string;
    medical_council_membership_number?: string;
    council?: string;
    pan_card_number?: string;
    aadhar_card_number?: string;
    bank_name?: string;
    bank_branch?: string;
    bank_address?: string;
    bank_account_number?: string;
    bank_ifsc_code?: string;
    referral_pay?: number;
    geo_latitude?: string;
    geo_longitude?: string;
    geo_accuracy?: string;
    photo_upload_path?: string;
    pan_upload_path?: string;
    aadhar_upload_path?: string;
    clinic_photo_path?: string;
    kyc_upload_path?: string;
    created_at?: string;
    updated_at?: string;
    status?: string;
    referral_means?: string;
    means_id?: number;
    branch_id?: number | null;
    created_by_name?: string;
}

export interface ReferralAgent {
    id: number;
    name: string;
    mobile: string;
    company?: string;
    role?: string;
    remarks?: string;
    email?: string;
    status: string;
    created_at?: string;
    created_by?: string;
    created_by_name?: string;
    tenant_id?: number;
    // Bank Details
    bank_name?: string;
    bank_branch?: string;
    bank_account_number?: string;
    bank_ifsc_code?: string;
    // Identity
    pan_card_number?: string;
    pan_upload_path?: string;
    // Commissions
    referral_patient_commission?: number;
    referral_doc_commission?: number;
}

export interface ServicePercentage {
    id: number;
    referral_doctor_id: number;
    service_name: string;
    percentage: number;
    created_at?: string;
    updated_at?: string;
}

export interface Service {
    id: number;
    service_name: string;
    department_id?: number;
    base_price?: number;
}
