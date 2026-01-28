import api from '../axios';

export const getBranches = async (hospitalId?: string) => {
    const url = hospitalId ? `/branches/hospital/${hospitalId}` : '/branches';
    const response = await api.get<{ status: string, data: { branches: any[] } }>(url);
    // Controller returns data: { branches: [] } for getAllBranches too?
    // BranchController.getAllBranches: data: { branches }
    // BranchController.getBranchesByHospital: data: { branches }
    return { success: response.data.status === 'success', data: response.data.data.branches };
};
