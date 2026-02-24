'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Users, Loader2, Edit2, Shield } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import SearchableSelect from '../../../components/ui/SearchableSelect';

const API_URL = 'http://localhost:5000/api';

export default function AccountantsPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'accountants' | 'managers'>('accountants');
    const [accountants, setAccountants] = useState([]);
    const [branches, setBranches] = useState([]);
    const [allBranches, setAllBranches] = useState([]); // Store all branches for Super Admin
    const [hospitals, setHospitals] = useState([]); // For Super Admin
    const [selectedHospitalId, setSelectedHospitalId] = useState(''); // For filtering branches
    const [selectedBranchId, setSelectedBranchId] = useState(''); // For filtering accountants
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        phone_number: '',
        first_name: '',
        last_name: '',
        branch_ids: [] as number[],
        role_code: 'ACCOUNTANT' // Default role
    });
    const [errors, setErrors] = useState<any>({});

    useEffect(() => {
        if (user) {
            fetchAccountants();
            fetchBranches();
            if (user.role_code === 'SUPER_ADMIN') {
                fetchHospitals();
            }
        }
    }, [user, selectedHospitalId, selectedBranchId]);

    const fetchAccountants = async () => {
        try {
            const token = localStorage.getItem('token');
            let url = `${API_URL}/accountant`;
            const params: string[] = [];
            if (user?.role_code === 'CLIENT_ADMIN' && user.hospital_id) {
                params.push(`hospital_id=${user.hospital_id}`);
            } else if (selectedHospitalId) {
                params.push(`hospital_id=${selectedHospitalId}`);
            }
            if (selectedBranchId) {
                params.push(`branch_id=${selectedBranchId}`);
            }
            if (params.length) url += '?' + params.join('&');

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAccountants(response.data.data.accountants || []);
        } catch (error) {
            console.error('Error fetching accountants:', error);
        } finally {
            setLoading(false);
        }
    };

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
            const fetchedBranches = response.data.data.branches || [];

            if (user?.role_code === 'SUPER_ADMIN') {
                setAllBranches(fetchedBranches);
                setBranches([]); // Start empty until hospital selected
            } else {
                setBranches(fetchedBranches);
            }
        } catch (error) {
            console.error('Error fetching branches:', error);
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

    const handleHospitalChange = (hospitalId: string) => {
        setSelectedHospitalId(hospitalId);
        setSelectedBranchId(''); // reset branch when hospital changes
        if (hospitalId) {
            const filteredBranches = allBranches.filter((b: any) =>
                b.hospital_id === parseInt(hospitalId)
            );
            setBranches(filteredBranches);
        } else {
            setBranches([]);
        }
        setFormData({ ...formData, branch_ids: [] });
    };

    const validateForm = () => {
        const newErrors: any = {};
        if (!formData.first_name) newErrors.first_name = 'First name is required';
        if (!formData.last_name) newErrors.last_name = 'Last name is required';
        if (!formData.username) newErrors.username = 'Username is required';
        if (!formData.email) newErrors.email = 'Email is required';
        if (!formData.password) newErrors.password = 'Password is required';
        if (formData.branch_ids.length === 0) newErrors.branch_ids = 'At least one branch is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/accountant`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowModal(false);
            fetchAccountants();
            resetForm();
        } catch (error: any) {
            console.error('Error creating accountant:', error);
            alert(error.response?.data?.message || 'Failed to create accountant');
        }
    };

    const resetForm = () => {
        setFormData({
            username: '',
            email: '',
            password: '',
            phone_number: '',
            first_name: '',
            last_name: '',
            branch_ids: [],
            role_code: activeTab === 'managers' ? 'ACCOUNTANT_MANAGER' : 'ACCOUNTANT'
        });
        setErrors({});
    };

    const branchOptions = branches.map((branch: any) => ({
        value: branch.branch_id,
        label: branch.branch_name,
        code: branch.branch_code
    }));

    // Filter accountants based on active tab
    const filteredAccountants = accountants.filter((acc: any) =>
        activeTab === 'managers'
            ? acc.role_code === 'ACCOUNTANT_MANAGER'
            : acc.role_code === 'ACCOUNTANT'
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Accountants & Managers</h1>
                    <p className="text-gray-600 text-sm mt-1">Manage financial staff and access</p>
                </div>
                <div>
                    <button
                        onClick={() => {
                            setFormData({ ...formData, role_code: activeTab === 'managers' ? 'ACCOUNTANT_MANAGER' : 'ACCOUNTANT' });
                            setShowModal(true);
                        }}
                        className={`flex items-center gap-2 px-4 py-2.5 text-white rounded-lg transition font-medium shadow-lg ${activeTab === 'managers'
                            ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/30'
                            : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                            }`}
                    >
                        <Plus className="w-5 h-5" />
                        {activeTab === 'managers' ? 'Add Manager' : 'Add Accountant'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-fit mb-8">
                <button
                    onClick={() => setActiveTab('accountants')}
                    className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'accountants'
                        ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    <Users className="w-4 h-4" />
                    Accountants
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'accountants' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                        {accountants.filter((a: any) => a.role_code === 'ACCOUNTANT').length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('managers')}
                    className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'managers'
                        ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-200 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    <Shield className="w-4 h-4" />
                    Managers
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'managers' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                        {accountants.filter((a: any) => a.role_code === 'ACCOUNTANT_MANAGER').length}
                    </span>
                </button>
            </div>

            {/* Filters for Super Admin */}
            {user?.role_code === 'SUPER_ADMIN' && (
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex gap-4 flex-wrap">
                    <div className="flex-1 min-w-[180px]">
                        <select
                            value={selectedHospitalId}
                            onChange={(e) => handleHospitalChange(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Hospitals</option>
                            {hospitals.map((h: any) => (
                                <option key={h.hospital_id} value={h.hospital_id}>
                                    {h.hospital_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[180px]">
                        <select
                            value={selectedBranchId}
                            onChange={(e) => setSelectedBranchId(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={!selectedHospitalId}
                        >
                            <option value="">All Branches</option>
                            {branches.map((b: any) => (
                                <option key={b.branch_id} value={b.branch_id}>
                                    {b.branch_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAccountants.map((accountant: any) => (
                        <div key={accountant.staff_id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition group">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors duration-300 ${accountant.role_code === 'ACCOUNTANT_MANAGER'
                                    ? 'bg-purple-100 group-hover:bg-purple-600'
                                    : 'bg-blue-100 group-hover:bg-blue-600'
                                    }`}>
                                    {accountant.role_code === 'ACCOUNTANT_MANAGER' ? (
                                        <Shield className={`w-6 h-6 transition-colors duration-300 ${accountant.role_code === 'ACCOUNTANT_MANAGER' ? 'text-purple-600 group-hover:text-white' : 'text-blue-600 group-hover:text-white'
                                            }`} />
                                    ) : (
                                        <Users className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
                                    )}
                                </div>
                                <button className="text-gray-400 hover:text-blue-600 transition">
                                    <Edit2 className="w-5 h-5" />
                                </button>
                            </div>
                            <h3 className="font-semibold text-lg text-gray-900 mb-2">
                                {accountant.first_name} {accountant.last_name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-1">{accountant.email}</p>

                            <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col gap-2">
                                <div>
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Username</span>
                                    <p className="text-sm font-medium text-gray-900">{accountant.username}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Branches</span>
                                    <p className="text-sm text-gray-600 line-clamp-2" title={accountant.branches}>
                                        {accountant.branches || 'No branches assigned'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredAccountants.length === 0 && (
                        <div className="col-span-3 text-center py-12 text-gray-500">
                            No {activeTab === 'managers' ? 'managers' : 'accountants'} found.
                        </div>
                    )}
                </div>
            )}

            {/* Modal with Glass Effect */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
                        <div className={`p-6 border-b border-gray-200/50 bg-gradient-to-r ${formData.role_code === 'ACCOUNTANT_MANAGER' ? 'from-purple-50 to-purple-100' : 'from-blue-50 to-blue-100'}`}>
                            <h2 className={`text-2xl font-bold bg-gradient-to-r ${formData.role_code === 'ACCOUNTANT_MANAGER' ? 'from-purple-600 to-purple-700' : 'from-blue-600 to-blue-700'} bg-clip-text text-transparent`}>
                                {formData.role_code === 'ACCOUNTANT_MANAGER' ? 'Add New Accountant Manager' : 'Add New Accountant'}
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">Create a new {formData.role_code === 'ACCOUNTANT_MANAGER' ? 'manager' : 'accountant'} profile</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className={`w-full px-4 py-2.5 border ${errors.first_name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80`}
                                    />
                                    {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        className={`w-full px-4 py-2.5 border ${errors.last_name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80`}
                                    />
                                    {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className={`w-full px-4 py-2.5 border ${errors.username ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80`}
                                    />
                                    {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className={`w-full px-4 py-2.5 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80`}
                                    />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone_number}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, "");
                                            if (value.length <= 10) {
                                                setFormData({ ...formData, phone_number: value });
                                            }
                                        }}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                        maxLength={10}
                                        placeholder="10-digit number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className={`w-full px-4 py-2.5 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80`}
                                    />
                                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                                </div>
                            </div>

                            {/* Hospital Selection for Super Admin */}
                            {user?.role_code === 'SUPER_ADMIN' && (
                                <div className="col-span-2">
                                    <SearchableSelect
                                        label="Select Hospital First *"
                                        options={hospitals.map((h: any) => ({
                                            value: h.hospital_id,
                                            label: h.hospital_name,
                                            code: h.hospital_code
                                        }))}
                                        value={selectedHospitalId}
                                        onChange={handleHospitalChange}
                                        placeholder="Choose a hospital to see branches"
                                    />
                                </div>
                            )}

                            <div className="col-span-2">
                                <SearchableSelect
                                    label="Assign Branches *"
                                    options={branchOptions}
                                    value={formData.branch_ids}
                                    onChange={(val) => setFormData({ ...formData, branch_ids: val })}
                                    placeholder={user?.role_code === 'SUPER_ADMIN' && !selectedHospitalId ?
                                        "Select a hospital first" : "Select branches"}
                                    multiple={true}
                                    error={errors.branch_ids}
                                    disabled={user?.role_code === 'SUPER_ADMIN' && !selectedHospitalId}
                                />
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
                                    className={`px-6 py-2.5 bg-gradient-to-r ${formData.role_code === 'ACCOUNTANT_MANAGER' ? 'from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-purple-500/30' : 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-500/30'} text-white rounded-lg transition font-medium shadow-lg`}
                                >
                                    Create {formData.role_code === 'ACCOUNTANT_MANAGER' ? 'Manager' : 'Accountant'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
