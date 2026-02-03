import api from '../axios';
import { Module, ClientModule } from '@/types/marketing';

// Modules CRUD
export const getModules = async () => {
    const response = await api.get<{ success: boolean, data: Module[] }>('/modules');
    return response.data;
};

export const createModule = async (data: Partial<Module>) => {
    const response = await api.post<{ success: boolean, data: Module }>('/modules', data);
    return response.data;
};

export const updateModule = async (id: number, data: Partial<Module>) => {
    const response = await api.put<{ success: boolean, data: Module }>(`/modules/${id}`, data);
    return response.data;
};

// Client Assignment
export const assignModuleToClient = async (data: { client_id: string, module_id: number, marketing_id?: number, status?: string, branch_id?: string }) => {
    const response = await api.post<{ success: boolean, data: ClientModule }>('/modules/assign', data);
    return response.data;
};

export const getClientModules = async (clientId: string, branchId?: string) => {
    const url = branchId
        ? `/modules/client/${clientId}?branch_id=${branchId}`
        : `/modules/client/${clientId}`;
    const response = await api.get<{ success: boolean, data: ClientModule[] }>(url);
    return response.data;
};

export const updateClientModule = async (id: number, data: { marketing_id?: number, status?: string }) => {
    const response = await api.put<{ success: boolean, data: ClientModule }>(`/modules/client-modules/${id}`, data);
    return response.data;
};
