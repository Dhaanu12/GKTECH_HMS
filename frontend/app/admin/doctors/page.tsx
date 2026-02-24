'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Stethoscope, Loader2, Edit2, Search, Eye } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import SearchableSelect from '../../../components/ui/SearchableSelect';

const API_URL = 'http://localhost:5000/api';

export default function DoctorsPage() {
    const { user } = useAuth();
    const [doctors, setDoctors] = useState<any[]>([]);
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [allBranches, setAllBranches] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [selectedHospitalId, setSelectedHospitalId] = useState('');
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [viewingDoctor, setViewingDoctor] = useState<any>(null);
    const [editingDoctor, setEditingDoctor] = useState<any>(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        phone_number: '',
        first_name: '',
        last_name: '',
        specialization: '',
        registration_number: '',
        branch_ids: [] as number[]
    });
    const [errors, setErrors] = useState<any>({});

    useEffect(() => {
        if (user) {
            fetchDoctors();
            fetchBranches();
            if (user.role_code === 'SUPER_ADMIN') {
                fetchHospitals();
            }
        }
    }, [user, selectedHospitalId, selectedBranchId, searchTerm]);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            let url = `${API_URL}/doctors?`;

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
            setDoctors(response.data.data?.doctors || response.data.data || []);
        } catch (error) {
            console.error('Error fetching doctors:', error);
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
            setFormData(prev => ({ ...prev, branch_ids: [] }));
        }
    };

    const validateForm = () => {
        const newErrors: any = {};
        if (!formData.first_name) newErrors.first_name = 'First name is required';
        if (!formData.last_name) newErrors.last_name = 'Last name is required';
        if (!editingDoctor) {
            if (!formData.username) newErrors.username = 'Username is required';
            if (!formData.password) newErrors.password = 'Password is required';
        }
        if (!formData.email) newErrors.email = 'Email is required';
        if (!formData.specialization) newErrors.specialization = 'Specialization is required';
        if (!editingDoctor && formData.branch_ids.length === 0) newErrors.branch_ids = 'Branch is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const token = localStorage.getItem('token');
            if (editingDoctor) {
                await axios.put(`${API_URL}/doctors/${editingDoctor.doctor_id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_URL}/doctors`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setShowModal(false);
            setEditingDoctor(null);
            fetchDoctors();
            resetForm();
        } catch (error: any) {
            console.error('Error saving doctor:', error);
            alert(error.response?.data?.message || 'Failed to save doctor');
        }
    };

    const handleEdit = (doctor: any) => {
        setEditingDoctor(doctor);
        setFormData({
            username: doctor.username || '',
            email: doctor.email || '',
            password: '',
            phone_number: doctor.phone_number || '',
            first_name: doctor.first_name || '',
            last_name: doctor.last_name || '',
            specialization: doctor.specialization || '',
            registration_number: doctor.registration_number || '',
            branch_ids: doctor.branch_id ? [doctor.branch_id] : []
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            username: '',
            email: '',
            password: '',
            phone_number: '',
            first_name: '',
            last_name: '',
            specialization: '',
            registration_number: '',
            branch_ids: []
        });
        setErrors({});
        setEditingDoctor(null);
    };

    const branchOptions = branches.map((branch: any) => ({
        value: Number(branch.branch_id),
        label: branch.branch_name,
        code: branch.branch_code
    }));

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Doctors</h1>
                    <p className="text-gray-600 text-sm mt-1">Manage all doctors in the system</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-lg shadow-blue-500/30"
                >
                    <Plus className="w-5 h-5" />
                    Add Doctor
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 space-y-3 md:space-y-0 md:flex md:gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by name, specialization, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {user?.role_code === 'SUPER_ADMIN' && (
                    <div className="w-full md:w-56">
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

                <div className="w-full md:w-56">
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
                    {doctors.map((doctor: any) => (
                        <div key={doctor.doctor_id || doctor.user_id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition group relative">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center group-hover:bg-teal-600 transition-colors duration-300">
                                    <Stethoscope className="w-6 h-6 text-teal-600 group-hover:text-white transition-colors duration-300" />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setViewingDoctor(doctor)}
                                        className="text-gray-400 hover:text-blue-600 transition"
                                        title="View Details"
                                    >
                                        <Eye className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(doctor)}
                                        className="text-gray-400 hover:text-blue-600 transition"
                                        title="Edit Doctor"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-semibold text-lg text-gray-900 mb-1">
                                Dr. {doctor.first_name} {doctor.last_name}
                            </h3>
                            <p className="text-sm text-teal-600 font-medium mb-1">{doctor.specialization || 'General'}</p>
                            {doctor.doctor_code && (
                                <p className="text-xs text-gray-500 mb-1">Code: {doctor.doctor_code}</p>
                            )}
                            <p className="text-sm text-gray-500">{doctor.email}</p>
                            {(doctor.branch_name || doctor.hospital_name) && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {doctor.hospital_name && (
                                        <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                                            {doctor.hospital_name}
                                        </span>
                                    )}
                                    {doctor.branch_name && (
                                        <span className="inline-block px-2 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-full border border-teal-200">
                                            {doctor.branch_name}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    {doctors.length === 0 && (
                        <div className="col-span-3 text-center py-12 text-gray-500">
                            No doctors found matching your criteria.
                        </div>
                    )}
                </div>
            )}

            {/* View Modal */}
            {viewingDoctor && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Doctor Details</h2>
                            <button onClick={() => setViewingDoctor(null)} className="text-gray-400 hover:text-gray-600">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                                    <Stethoscope className="w-8 h-8 text-teal-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">Dr. {viewingDoctor.first_name} {viewingDoctor.last_name}</h3>
                                    <p className="text-teal-600 font-medium">{viewingDoctor.specialization || 'General'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                                    <p className="text-gray-900 font-medium">{viewingDoctor.email || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Phone</label>
                                    <p className="text-gray-900 font-medium">{viewingDoctor.phone_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Registration No.</label>
                                    <p className="text-gray-900 font-medium">{viewingDoctor.registration_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Doctor Code</label>
                                    <p className="text-gray-900 font-medium">{viewingDoctor.doctor_code || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Branch</label>
                                    <p className="text-gray-900 font-medium">{viewingDoctor.branch_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Hospital</label>
                                    <p className="text-gray-900 font-medium">{viewingDoctor.hospital_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${viewingDoctor.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {viewingDoctor.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button
                                onClick={() => setViewingDoctor(null)}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
                        <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-teal-50 to-teal-100">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
                                {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {editingDoctor ? 'Update doctor information' : 'Create a new doctor profile'}
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
                                        className={`w-full px-4 py-2.5 border ${errors.first_name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white/80`}
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
                                        className={`w-full px-4 py-2.5 border ${errors.last_name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white/80`}
                                    />
                                    {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
                                </div>

                                {!editingDoctor && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.username}
                                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                className={`w-full px-4 py-2.5 border ${errors.username ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white/80`}
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
                                                className={`w-full px-4 py-2.5 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white/80`}
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
                                        className={`w-full px-4 py-2.5 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white/80`}
                                    />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone_number}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            if (value.length <= 10) setFormData({ ...formData, phone_number: value });
                                        }}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white/80"
                                        placeholder="10-digit number"
                                        maxLength={10}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Specialization *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.specialization}
                                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                        className={`w-full px-4 py-2.5 border ${errors.specialization ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white/80`}
                                        placeholder="e.g. Cardiology"
                                    />
                                    {errors.specialization && <p className="text-red-500 text-xs mt-1">{errors.specialization}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                                    <input
                                        type="text"
                                        value={formData.registration_number}
                                        onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white/80"
                                        placeholder="MCI-12345"
                                    />
                                </div>

                                {/* Hospital Selection for Super Admin */}
                                {user?.role_code === 'SUPER_ADMIN' && !editingDoctor && (
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
                                        value={formData.branch_ids[0] ?? ''}
                                        onChange={(val) => setFormData({ ...formData, branch_ids: val ? [Number(val)] : [] })}
                                        placeholder={user?.role_code === 'SUPER_ADMIN' && !selectedHospitalId ?
                                            'Select a hospital first' : 'Select a branch'}
                                        error={errors.branch_ids}
                                        disabled={user?.role_code === 'SUPER_ADMIN' && !selectedHospitalId && !editingDoctor}
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
                                    className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 transition font-medium shadow-lg shadow-teal-500/30"
                                >
                                    {editingDoctor ? 'Update Doctor' : 'Create Doctor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
