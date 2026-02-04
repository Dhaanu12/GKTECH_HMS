import api from '../axios';

export const getHospitals = async () => {
    const response = await api.get('/hospitals');
    return {
        success: response.data.status === 'success',
        data: response.data.data.hospitals
    };
};
