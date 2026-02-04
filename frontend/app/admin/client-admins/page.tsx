'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, UserPlus, Loader2, Edit2, Building, Search } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import SearchableSelect from '../../../components/ui/SearchableSelect';

const API_URL = 'http://localhost:5000/api';

export default function ClientAdminsPage() {
    const { user } = useAuth();
    const [admins, setAdmins] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [selectedHospitalId, setSelectedHospitalId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [viewingAdmin, setViewingAdmin] = useState<any>(null);
    const [editingAdmin, setEditingAdmin] = useState<any>(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        phone_number: '',
        first_name: '',
        last_name: '',
        hospital_id: ''
    });
    const [errors, setErrors] = useState<any>({});

    useEffect(() => {
        if (user) {
            fetchAdmins();
            fetchHospitals();
        }
    }, [user, selectedHospitalId, searchTerm]);

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            let url = `${API_URL}/clientadmins?`;

            if (selectedHospitalId) {
                url += `hospital_id=${selectedHospitalId}&`;
            }

            if (searchTerm) {
                url += `search=${searchTerm}&`;
            }

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAdmins(response.data.data.clientAdmins || []);
        } catch (error) {
            console.error('Error fetching client admins:', error);
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

    const validateForm = () => {
        const newErrors: any = {};
        if (!formData.first_name) newErrors.first_name = 'First name is required';
        if (!formData.last_name) newErrors.last_name = 'Last name is required';
        if (!editingAdmin) {
            if (!formData.username) newErrors.username = 'Username is required';
            if (!formData.password) newErrors.password = 'Password is required';
        }
        if (!formData.email) newErrors.email = 'Email is required';
        if (!formData.hospital_id) newErrors.hospital_id = 'Hospital is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const token = localStorage.getItem('token');
            if (editingAdmin) {
                await axios.put(`${API_URL}/clientadmins/${editingAdmin.user_id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_URL}/clientadmins`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            setShowModal(false);
            setEditingAdmin(null);
            fetchAdmins();
            resetForm();
        } catch (error: any) {
            console.error('Error saving client admin:', error);
            alert(error.response?.data?.message || 'Failed to save client admin');
        }
    };

    const handleEdit = (admin: any) => {
        setEditingAdmin(admin);
        setFormData({
            username: admin.username || '',
            email: admin.email || '',
            password: '',
            phone_number: admin.phone_number || '',
            first_name: admin.first_name,
            last_name: admin.last_name,
            hospital_id: admin.hospital_id
        });
        setShowModal(true);
    };

    const handleView = (admin: any) => {
        setViewingAdmin(admin);
    };

    const resetForm = () => {
        setFormData({
            username: '',
            email: '',
            password: '',
            phone_number: '',
            first_name: '',
            last_name: '',
            hospital_id: ''
        });
        setErrors({});
        setEditingAdmin(null);
    };

    const hospitalOptions = hospitals.map((hospital: any) => ({
        value: hospital.hospital_id,
        label: hospital.hospital_name,
        code: hospital.hospital_code
    }));

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Client Admins</h1>
                    <p className="text-gray-600 text-sm mt-1">Manage hospital administrators</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-lg shadow-blue-500/30"
                >
                    <Plus className="w-5 h-5" />
                    Add Client Admin
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
                            onChange={(e) => setSelectedHospitalId(e.target.value)}
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
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {admins.map((admin: any) => (
                        <div key={admin.staff_id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition group relative">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
                                    <UserPlus className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleView(admin)}
                                        className="text-gray-400 hover:text-blue-600 transition"
                                        title="View Details"
                                    >
                                        <Search className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(admin)}
                                        className="text-gray-400 hover:text-blue-600 transition"
                                        title="Edit Admin"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-semibold text-lg text-gray-900 mb-2">
                                {admin.first_name} {admin.last_name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-1">Username: {admin.username}</p>
                            <p className="text-sm text-gray-600">Email: {admin.email}</p>
                            {admin.hospital_name && (
                                <div className="flex items-center gap-1 mt-2 text-sm text-blue-600 font-medium">
                                    <Building className="w-4 h-4" />
                                    {admin.hospital_name}
                                </div>
                            )}
                        </div>
                    ))}
                    {admins.length === 0 && (
                        <div className="col-span-3 text-center py-12 text-gray-500">
                            No client admins found matching your criteria.
                        </div>
                    )}
                </div>
            )}

            {/* View Modal */}
            {viewingAdmin && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Client Admin Details</h2>
                            <button onClick={() => setViewingAdmin(null)} className="text-gray-400 hover:text-gray-600">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                    <UserPlus className="w-8 h-8 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">{viewingAdmin.first_name} {viewingAdmin.last_name}</h3>
                                    <p className="text-blue-600 font-medium">{viewingAdmin.username}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                                    <p className="text-gray-900 font-medium">{viewingAdmin.email || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Phone</label>
                                    <p className="text-gray-900 font-medium">{viewingAdmin.phone_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Hospital</label>
                                    <p className="text-gray-900 font-medium">{viewingAdmin.hospital_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Assigned Branch</label>
                                    <p className="text-gray-900 font-medium">{viewingAdmin.branch_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${viewingAdmin.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {viewingAdmin.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button
                                onClick={() => setViewingAdmin(null)}
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
                                {editingAdmin ? 'Edit Client Admin' : 'Add New Client Admin'}
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {editingAdmin ? 'Update administrator details' : 'Create a new hospital administrator'}
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

                                {!editingAdmin && (
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
                                <div className="col-span-2">
                                    <SearchableSelect
                                        label="Assign Hospital *"
                                        options={hospitalOptions}
                                        value={formData.hospital_id}
                                        onChange={(val) => setFormData({ ...formData, hospital_id: val })}
                                        placeholder="Select a hospital"
                                        error={errors.hospital_id}
                                        disabled={!!editingAdmin} // Prevent changing hospital on edit as it's complex
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
                                    {editingAdmin ? 'Update Client Admin' : 'Create Client Admin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
