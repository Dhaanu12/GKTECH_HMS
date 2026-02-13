import api from '../axios';

export interface AgentReportRow {
    agent_id: number;
    agent_name: string;
    mobile: string;
    referral_patient_commission: number;
    referral_doc_commission: number;
    patient_count: number;
    doctor_count: number;
    total_patient_commission: number;
    total_doctor_commission: number;
    total_commission: number;
}

export interface AgentDashboardStats {
    total_agents: number;
    total_patients_referred: number;
    total_doctors_referred: number;
    total_commission_liability: number;
}

export const getAgentReferralReports = async (params: { fromDate?: string, toDate?: string, agentId?: string }) => {
    const queryString = new URLSearchParams(params as any).toString();
    const response = await api.get<{ success: boolean, count: number, data: AgentReportRow[] }>(`/referral-payment/agent-reports?${queryString}`);
    return response.data;
};

export const getAgentDashboardStats = async () => {
    const response = await api.get<{ success: boolean, data: AgentDashboardStats }>('/referral-payment/agent-stats');
    return response.data;
};
