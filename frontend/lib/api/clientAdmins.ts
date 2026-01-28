import api from '../axios';

export const getClientAdmins = async () => {
    const response = await api.get<{ success: boolean, data: { clientAdmins: any[] } }>('/clientadmins');
    return response.data;
};
