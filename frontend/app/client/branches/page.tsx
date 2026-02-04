'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Building2, Loader2, Edit2, MapPin, Power, Stethoscope } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import SearchableSelect from '../../../components/ui/SearchableSelect';
import BillingSetupFormNew from '../../../components/BillingSetupFormNew';
import MedicalServicesSelector from '../../../components/MedicalServicesSelector';

const API_URL = 'http://localhost:5000/api';

export default function BranchesPage() {
    const { user } = useAuth();
    const [branches, setBranches] = useState<any[]>([]);
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBranch, setEditingBranch] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'billing'>('details');
    const [formData, setFormData] = useState({
        hospital_id: '',
        branch_name: '',
        branch_code: '',
        address_line1: '',
        city: '',
        state: '',
        pincode: '',
        contact_number: '',
        emergency_available: false,
        mlc_fee: '',
        department_ids: [] as number[],
        service_ids: [] as number[]
    });
    const [errors, setErrors] = useState<any>({});
    const [managingServicesBranch, setManagingServicesBranch] = useState<any>(null);

    useEffect(() => {
        if (user) {
            fetchBranches();
            fetchHospitals();
            fetchDepartments();
            fetchServices();
        }
    }, [user]);

    const fetchBranches = async () => {
        try {
            const token = localStorage.getItem('token');
            let url = `${API_URL}/branches`;

            if (user?.role_code === 'CLIENT_ADMIN' && user.hospital_id) {
                url = `${API_URL}/branches/hospital/${user.hospital_id}`;
            }

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const branchesData = response.data.data.branches || [];

            // Fetch medical services count for each branch
            const branchesWithCounts = await Promise.all(
                branchesData.map(async (branch: any) => {
                    try {
                        const servicesRes = await axios.get(
                            `${API_URL}/medical-services/branch/${branch.branch_id}`,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        return {
                            ...branch,
                            medical_services_count: servicesRes.data.services?.length || 0
                        };
                    } catch (err) {
                        return { ...branch, medical_services_count: 0 };
                    }
                })
            );

            setBranches(branchesWithCounts);
        } catch (error) {
            console.error('Error fetching branches:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHospitals = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/hospitals`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHospitals(response.data.data.hospitals || []);
        } catch (error) {
            console.error('Error fetching hospitals:', error);
        }
    };

    const fetchDepartments = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/departments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDepartments(response.data.data.departments || []);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const fetchServices = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/services`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setServices(response.data.data.services || []);
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    const validateForm = () => {
        const newErrors: any = {};
        if (!formData.hospital_id) newErrors.hospital_id = 'Hospital is required';
        if (!formData.branch_name) newErrors.branch_name = 'Branch name is required';
        if (!formData.branch_code) newErrors.branch_code = 'Branch code is required';
        if (!formData.city) newErrors.city = 'City is required';
        if (!formData.state) newErrors.state = 'State is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const token = localStorage.getItem('token');
            if (editingBranch) {
                await axios.put(`${API_URL}/branches/${editingBranch.branch_id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_URL}/branches`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setShowModal(false);
            fetchBranches();
            resetForm();
        } catch (error: any) {
            console.error('Error saving branch:', error);
            alert(error.response?.data?.message || 'Failed to save branch');
        }
    };

    const handleEdit = async (branch: any) => {
        setEditingBranch(branch);
        setActiveTab('details');
        setFormData({
            hospital_id: String(branch.hospital_id),
            branch_name: branch.branch_name,
            branch_code: branch.branch_code,
            address_line1: branch.address_line1 || '',
            city: branch.city,
            state: branch.state,
            pincode: branch.pincode || '',
            contact_number: branch.contact_number || '',
            emergency_available: branch.emergency_available || false,
            mlc_fee: branch.mlc_fee || '',
            department_ids: [],
            service_ids: []
        });
        setShowModal(true);

        try {
            const token = localStorage.getItem('token');
            const [deptRes, svcRes] = await Promise.all([
                axios.get(`${API_URL}/branches/${branch.branch_id}/departments`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/branches/${branch.branch_id}/services`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            const deptIds = deptRes.data.data.departments.map((d: any) => Number(d.department_id));
            const svcIds = svcRes.data.data.services.map((s: any) => Number(s.service_id));

            setFormData(prev => ({
                ...prev,
                department_ids: deptIds,
                service_ids: svcIds
            }));
        } catch (error) {
            console.error('Error fetching branch mappings:', error);
        }
    };

    const toggleStatus = async (branchId: number, currentStatus: boolean) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_URL}/branches/${branchId}/status`,
                { is_active: !currentStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchBranches();
        } catch (error: any) {
            console.error('Error toggling branch status:', error);
            alert(error.response?.data?.message || 'Failed to update branch status');
        }
    };

    const resetForm = () => {
        setEditingBranch(null);
        setFormData({
            hospital_id: '',
            branch_name: '',
            branch_code: '',
            address_line1: '',
            city: '',
            state: '',
            pincode: '',
            contact_number: '',
            emergency_available: false,
            mlc_fee: '',
            department_ids: [],
            service_ids: []
        });
        setErrors({});
    };

    const hospitalOptions = hospitals.map((hospital: any) => ({
        value: hospital.hospital_id,
        label: hospital.hospital_name,
        code: hospital.hospital_code
    }));

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
                    <p className="text-gray-600 text-sm mt-1">Manage hospital branches</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        if (user?.role_code === 'CLIENT_ADMIN' && user.hospital_id) {
                            setFormData(prev => ({ ...prev, hospital_id: String(user.hospital_id) }));
                        }
                        setActiveTab('details');
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-lg shadow-blue-500/30"
                >
                    <Plus className="w-5 h-5" />
                    Add Branch
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {branches.map((branch: any) => (
                        <div key={branch.branch_id} className={`bg-white border rounded-lg p-6 hover:shadow-lg transition group ${!branch.is_active ? 'opacity-60 border-gray-300' : 'border-gray-200'}`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
                                    <Building2 className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => toggleStatus(branch.branch_id, branch.is_active)}
                                        className={`p-2 rounded-lg transition ${branch.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
                                        title={branch.is_active ? 'Deactivate' : 'Activate'}
                                    >
                                        <Power className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setManagingServicesBranch(branch)}
                                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                        title="Manage Medical Services"
                                    >
                                        <Stethoscope className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(branch)}
                                        className="text-gray-400 hover:text-blue-600 transition"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Hospital Name Badge */}
                            <div className="mb-3">
                                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                                    {hospitals.find((h: any) => h.hospital_id === branch.hospital_id)?.hospital_name || 'Unknown Hospital'}
                                </span>
                            </div>

                            <h3 className="font-semibold text-lg text-gray-900 mb-2">
                                {branch.branch_name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-1">Code: {branch.branch_code}</p>
                            <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {branch.city}, {branch.state}
                            </p>
                            <div className="flex gap-2 mt-3 flex-wrap">
                                {!branch.is_active && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Inactive</span>
                                )}
                                {branch.emergency_available && (
                                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Emergency</span>
                                )}
                                {branch.medical_services_count > 0 && (
                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium flex items-center gap-1">
                                        <Stethoscope className="w-3 h-3" />
                                        {branch.medical_services_count} Services
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                    {branches.length === 0 && (
                        <div className="col-span-3 text-center py-12 text-gray-500">
                            No branches found. Add your first branch!
                        </div>
                    )}
                </div>
            )}

            {/* Modal with Glass Effect */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className={`bg-white/95 backdrop-blur-md rounded-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 transition-all duration-300 ${activeTab === 'billing' ? 'max-w-7xl' : 'max-w-3xl'}`}>
                        <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-blue-100">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                                {editingBranch ? 'Edit Branch' : 'Add New Branch'}
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {editingBranch ? 'Update branch information' : 'Create a new hospital branch'}
                            </p>
                        </div>

                        {editingBranch && (
                            <div className="px-6 pt-4 flex gap-4 border-b border-gray-100">
                                <button
                                    onClick={() => setActiveTab('details')}
                                    className={`pb-2 text-sm font-medium border-b-2 transition ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Branch Details
                                </button>
                                <button
                                    onClick={() => setActiveTab('billing')}
                                    className={`pb-2 text-sm font-medium border-b-2 transition ${activeTab === 'billing' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Billing Configuration
                                </button>
                            </div>
                        )}

                        {activeTab === 'billing' && editingBranch ? (
                            <div className="p-6">
                                <BillingSetupFormNew
                                    branchId={editingBranch.branch_id}
                                    onClose={() => setActiveTab('details')}
                                    branches={branches}
                                />
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {user?.role_code !== 'CLIENT_ADMIN' && (
                                    <div className="col-span-2">
                                        <SearchableSelect
                                            label="Select Hospital *"
                                            options={hospitalOptions}
                                            value={formData.hospital_id}
                                            onChange={(val) => setFormData({ ...formData, hospital_id: val })}
                                            placeholder="Select a hospital"
                                            error={errors.hospital_id}
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.branch_name}
                                            onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                                            className={`w-full px-4 py-2.5 border ${errors.branch_name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80`}
                                            placeholder="Downtown Medical Center"
                                        />
                                        {errors.branch_name && <p className="text-red-500 text-xs mt-1">{errors.branch_name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Branch Code *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.branch_code}
                                            onChange={(e) => setFormData({ ...formData, branch_code: e.target.value })}
                                            className={`w-full px-4 py-2.5 border ${errors.branch_code ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80`}
                                            placeholder="BR-001"
                                        />
                                        {errors.branch_code && <p className="text-red-500 text-xs mt-1">{errors.branch_code}</p>}
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                        <input
                                            type="text"
                                            value={formData.address_line1}
                                            onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                            placeholder="123 Main Street"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className={`w-full px-4 py-2.5 border ${errors.city ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80`}
                                            placeholder="New York"
                                        />
                                        {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                            className={`w-full px-4 py-2.5 border ${errors.state ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80`}
                                            placeholder="NY"
                                        />
                                        {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                                        <input
                                            type="text"
                                            value={formData.pincode}
                                            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                            placeholder="10001"
                                        />
                                    </div>
                                    <div>
                                        {/* <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                    <input
                                        type="tel"
                                        value={formData.contact_number}
                                        onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                        placeholder="+1 (555) 123-4567"
                                    /> */}
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Contact Number
                                        </label>

                                        <input
                                            type="tel"
                                            value={formData.contact_number}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, ""); // allow only digits
                                                setFormData({ ...formData, contact_number: value });
                                            }}
                                            maxLength={10}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                            placeholder="1234567890"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">MLC Fee (₹)</label>
                                        <input
                                            type="number"
                                            value={formData.mlc_fee}
                                            onChange={(e) => setFormData({ ...formData, mlc_fee: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-6 pt-4 border-t border-gray-200/50">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.emergency_available}
                                            onChange={(e) => setFormData({ ...formData, emergency_available: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Has Emergency Services</span>
                                    </label>
                                </div>

                                {/* Departments & Services Selection */}
                                <div className="space-y-6 pt-6 border-t border-gray-200/50">
                                    {/* Departments */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Departments</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50/50">
                                            {departments.map((dept: any) => (
                                                <label key={dept.department_id} className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                                    <input
                                                        type="checkbox"
                                                        value={dept.department_id}
                                                        checked={formData.department_ids.includes(Number(dept.department_id))}
                                                        onChange={(e) => {
                                                            const id = parseInt(e.target.value);
                                                            const newIds = e.target.checked
                                                                ? [...formData.department_ids, id]
                                                                : formData.department_ids.filter((i: number) => i !== id);
                                                            setFormData({ ...formData, department_ids: newIds });
                                                        }}
                                                        className="rounded text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span>{dept.department_name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Services */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Services</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50/50">
                                            {services.map((svc: any) => (
                                                <label key={svc.service_id} className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                                    <input
                                                        type="checkbox"
                                                        value={svc.service_id}
                                                        checked={formData.service_ids.includes(Number(svc.service_id))}
                                                        onChange={(e) => {
                                                            const id = parseInt(e.target.value);
                                                            const newIds = e.target.checked
                                                                ? [...formData.service_ids, id]
                                                                : formData.service_ids.filter((i: number) => i !== id);
                                                            setFormData({ ...formData, service_ids: newIds });
                                                        }}
                                                        className="rounded text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span>{svc.service_name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200/50">
                                    <button
                                        type="button"
                                        onClick={() => { setShowModal(false); resetForm(); }}
                                        className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-medium shadow-lg shadow-blue-500/30"
                                    >
                                        {editingBranch ? 'Update Branch' : 'Create Branch'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Medical Services Management Modal */}
            {managingServicesBranch && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                                    Manage Medical Services
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    {managingServicesBranch.branch_name}
                                </p>
                            </div>
                            <button
                                onClick={() => setManagingServicesBranch(null)}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                            <MedicalServicesSelector
                                branchId={managingServicesBranch.branch_id}
                                onSave={() => {
                                    setManagingServicesBranch(null);
                                    fetchBranches();
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
