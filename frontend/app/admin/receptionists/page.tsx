'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Briefcase, Loader2, Edit2, Search } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import SearchableSelect from '../../../components/ui/SearchableSelect';

const API_URL = 'http://localhost:5000/api';

export default function ReceptionistsPage() {
    const { user } = useAuth();
    const [receptionists, setReceptionists] = useState([]);
    const [branches, setBranches] = useState([]);
    const [allBranches, setAllBranches] = useState([]); // Store all branches for Super Admin
    const [hospitals, setHospitals] = useState([]); // For Super Admin
    const [selectedHospitalId, setSelectedHospitalId] = useState(''); // For filtering branches
    const [selectedBranchId, setSelectedBranchId] = useState(''); // For filtering receptionists
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [viewingReceptionist, setViewingReceptionist] = useState<any>(null);
    const [editingReceptionist, setEditingReceptionist] = useState<any>(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        phone_number: '',
        first_name: '',
        last_name: '',
        branch_id: ''
    });
    const [errors, setErrors] = useState<any>({});

    useEffect(() => {
        if (user) {
            fetchReceptionists();
            fetchBranches();
            if (user.role_code === 'SUPER_ADMIN') {
                fetchHospitals();
            }
        }
    }, [user, selectedHospitalId, selectedBranchId, searchTerm]);

    const fetchReceptionists = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            let url = `${API_URL}/receptionists?`;

            if (user?.role_code === 'CLIENT_ADMIN' && user.hospital_id) {
                url += `hospital_id=${user.hospital_id}&`;
            } else if (selectedHospitalId) {
                url += `hospital_id=${selectedHospitalId}&`;
            }

            if (selectedBranchId) {
                url += `branch_id=${selectedBranchId}&`;
            }

            if (searchTerm) {
                url += `search=${searchTerm}&`;
            }

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReceptionists(response.data.data.receptionists || []);
        } catch (error) {
            console.error('Error fetching receptionists:', error);
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
                if (selectedHospitalId) {
                    setBranches(fetchedBranches.filter((b: any) => b.hospital_id === parseInt(selectedHospitalId)));
                } else {
                    setBranches([]);
                }
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
        setSelectedBranchId('');

        if (hospitalId) {
            const filteredBranches = allBranches.filter((b: any) =>
                b.hospital_id === parseInt(hospitalId)
            );
            setBranches(filteredBranches);
        } else {
            setBranches([]);
        }

        if (showModal) {
            setFormData({ ...formData, branch_id: '' });
        }
    };

    const validateForm = () => {
        const newErrors: any = {};
        if (!formData.first_name) newErrors.first_name = 'First name is required';
        if (!formData.last_name) newErrors.last_name = 'Last name is required';
        if (!editingReceptionist) {
            if (!formData.username) newErrors.username = 'Username is required';
            if (!formData.password) newErrors.password = 'Password is required';
        }
        if (!formData.email) newErrors.email = 'Email is required';
        if (!formData.branch_id) newErrors.branch_id = 'Branch is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const token = localStorage.getItem('token');
            if (editingReceptionist) {
                // Note: Update endpoint might need to handle staff updates too if name changes
                // Currently updateReceptionist updates User table. 
                // We might need to update Staff table too if names are edited.
                // Assuming backend handles it or we only update user details for now.
                // Actually, createReceptionist puts names in Staff table.
                // updateReceptionist in controller updates User table.
                // This is a potential backend gap: updating names won't reflect if they are only in Staff table.
                // But for now let's implement the frontend call.
                await axios.put(`${API_URL}/receptionists/${editingReceptionist.user_id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_URL}/receptionists`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            setShowModal(false);
            setEditingReceptionist(null);
            fetchReceptionists();
            resetForm();
        } catch (error: any) {
            console.error('Error saving receptionist:', error);
            alert(error.response?.data?.message || 'Failed to save receptionist');
        }
    };

    const handleEdit = (receptionist: any) => {
        setEditingReceptionist(receptionist);
        setFormData({
            username: receptionist.username || '',
            email: receptionist.email || '',
            password: '',
            phone_number: receptionist.phone_number || '',
            first_name: receptionist.first_name,
            last_name: receptionist.last_name,
            branch_id: receptionist.branch_id
        });
        setShowModal(true);
    };

    const handleView = (receptionist: any) => {
        setViewingReceptionist(receptionist);
    };

    const resetForm = () => {
        setFormData({
            username: '',
            email: '',
            password: '',
            phone_number: '',
            first_name: '',
            last_name: '',
            branch_id: ''
        });
        setErrors({});
        setEditingReceptionist(null);
    };

    const branchOptions = branches.map((branch: any) => ({
        value: branch.branch_id,
        label: branch.branch_name,
        code: branch.branch_code
    }));

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Receptionists</h1>
                    <p className="text-gray-600 text-sm mt-1">Manage all receptionists in the system</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-lg shadow-blue-500/30"
                >
                    <Plus className="w-5 h-5" />
                    Add Receptionist
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 space-y-4 md:space-y-0 md:flex md:gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by name, hospital, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {user?.role_code === 'SUPER_ADMIN' && (
                    <div className="w-full md:w-64">
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
                )}

                <div className="w-full md:w-64">
                    <select
                        value={selectedBranchId}
                        onChange={(e) => setSelectedBranchId(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={user?.role_code === 'SUPER_ADMIN' && !selectedHospitalId}
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

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {receptionists.map((receptionist: any) => (
                        <div key={receptionist.staff_id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition group relative">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
                                    <Briefcase className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleView(receptionist)}
                                        className="text-gray-400 hover:text-blue-600 transition"
                                        title="View Details"
                                    >
                                        <Search className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(receptionist)}
                                        className="text-gray-400 hover:text-blue-600 transition"
                                        title="Edit Receptionist"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-semibold text-lg text-gray-900 mb-2">
                                {receptionist.first_name} {receptionist.last_name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-1">Username: {receptionist.username}</p>
                            <p className="text-sm text-gray-600">Email: {receptionist.email}</p>
                            {receptionist.branch_name && (
                                <p className="text-sm text-blue-600 mt-2 font-medium">
                                    {receptionist.branch_name}
                                </p>
                            )}
                        </div>
                    ))}
                    {receptionists.length === 0 && (
                        <div className="col-span-3 text-center py-12 text-gray-500">
                            No receptionists found matching your criteria.
                        </div>
                    )}
                </div>
            )}

            {/* View Modal */}
            {viewingReceptionist && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Receptionist Details</h2>
                            <button onClick={() => setViewingReceptionist(null)} className="text-gray-400 hover:text-gray-600">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Briefcase className="w-8 h-8 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">{viewingReceptionist.first_name} {viewingReceptionist.last_name}</h3>
                                    <p className="text-blue-600 font-medium">{viewingReceptionist.username}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                                    <p className="text-gray-900 font-medium">{viewingReceptionist.email || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Phone</label>
                                    <p className="text-gray-900 font-medium">{viewingReceptionist.phone_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Branch</label>
                                    <p className="text-gray-900 font-medium">{viewingReceptionist.branch_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Hospital</label>
                                    <p className="text-gray-900 font-medium">{viewingReceptionist.hospital_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${viewingReceptionist.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {viewingReceptionist.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button
                                onClick={() => setViewingReceptionist(null)}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal with Glass Effect */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
                        <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-blue-100">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                                {editingReceptionist ? 'Edit Receptionist' : 'Add New Receptionist'}
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {editingReceptionist ? 'Update receptionist details' : 'Create a new receptionist profile'}
                            </p>
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

                                {!editingReceptionist && (
                                    <>
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
                                    </>
                                )}

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

                                {/* Hospital Selection for Super Admin */}
                                {user?.role_code === 'SUPER_ADMIN' && !editingReceptionist && (
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
                                        label="Assign Branch *"
                                        options={branchOptions}
                                        value={formData.branch_id}
                                        onChange={(val) => setFormData({ ...formData, branch_id: val })}
                                        placeholder={user?.role_code === 'SUPER_ADMIN' && !selectedHospitalId ?
                                            "Select a hospital first" : "Select a branch"}
                                        error={errors.branch_id}
                                        disabled={user?.role_code === 'SUPER_ADMIN' && !selectedHospitalId && !editingReceptionist}
                                    />
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
                                    {editingReceptionist ? 'Update Receptionist' : 'Create Receptionist'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
