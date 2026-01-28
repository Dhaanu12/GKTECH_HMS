import api from '../axios';

export const createUser = async (data: any) => {
    const response = await api.post('/users', data);
    return response.data;
};

export const getUsers = async (filters: { branch_id?: string, role_code?: string, hospital_id?: string }) => {
    const params = new URLSearchParams();
    if (filters.branch_id) params.append('branch_id', filters.branch_id);
    if (filters.role_code) params.append('role_code', filters.role_code);
    if (filters.hospital_id) params.append('hospital_id', filters.hospital_id);

    const response = await api.get(`/users?${params.toString()}`);
    return response.data;
};
