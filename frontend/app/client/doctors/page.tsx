'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Stethoscope, Search, Edit2, Loader2, Trash2, Building } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import SearchableSelect from '../../../components/ui/SearchableSelect';

const API_URL = 'http://localhost:5000/api';

export default function DoctorsPage() {
    const { user } = useAuth();
    const [doctors, setDoctors] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [viewingDoctor, setViewingDoctor] = useState<any>(null);
    const [editingDoctor, setEditingDoctor] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [selectedHospitalForForm, setSelectedHospitalForForm] = useState('');
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [availableBranches, setAvailableBranches] = useState<any[]>([]); // Branches for the form based on hospital
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        phone_number: '',
        first_name: '',
        last_name: '',
        department_id: '',
        specialization: '',
        registration_number: '',
        qualification: '',
        experience_years: '',
        consultation_fee: '',
        branch_ids: [] as number[],
        address: '',
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        doctor_type: 'In-house',
        gender: '',
        date_of_birth: ''
    });
    const [signatureFile, setSignatureFile] = useState<File | null>(null);
    const [errors, setErrors] = useState<any>({});

    useEffect(() => {
        if (user) {
            fetchDoctors();
            fetchBranches(); // For filter
            fetchHospitals(); // For Form
            // fetchDepartments(); // Don't fetch initially for form
        }
    }, [user, searchTerm, selectedBranchId]);

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

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            let url = `${API_URL}/doctors?`;
            if (user?.role_code === 'CLIENT_ADMIN' && user.hospital_id) {
                url += `hospital_id=${user.hospital_id}&`;
            }

            if (searchTerm) {
                url += `search=${searchTerm}&`;
            }

            if (selectedBranchId) {
                url += `branch_id=${selectedBranchId}&`;
            }

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDoctors(response.data.data.doctors || []);
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
            setBranches(response.data.data.branches || []);
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const fetchDepartments = async (branchIds: number[] = []) => {
        try {
            const token = localStorage.getItem('token');
            if (branchIds.length === 0) {
                setDepartments([]);
                return;
            }

            const allDepts: any[] = [];
            const deptIds = new Set();

            for (const bId of branchIds) {
                const response = await axios.get(`${API_URL}/branches/${bId}/departments`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const branchDepts = response.data.data.departments || [];
                branchDepts.forEach((d: any) => {
                    if (!deptIds.has(d.department_id)) {
                        deptIds.add(d.department_id);
                        allDepts.push(d);
                    }
                });
            }
            setDepartments(allDepts as any);

        } catch (error) {
            console.error('Error fetching departments:', error);
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
        if (!formData.registration_number) newErrors.registration_number = 'Registration number is required';
        if (formData.branch_ids.length === 0) newErrors.branch_ids = 'At least one branch is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                const value = (formData as any)[key];
                if (key === 'branch_ids') {
                    value.forEach((id: number) => formDataToSend.append('branch_ids[]', id.toString()));
                } else {
                    formDataToSend.append(key, value);
                }
            });
            if (signatureFile) {
                formDataToSend.append('signature', signatureFile);
            }
            // For SUPER ADMIN, if hospital is selected, ensure we are sending it or linked correctly? 
            // The backend doctor creation usually infers hospital from branch or logged in user? 
            // If Super Admin creates, they must select branch. Branch belongs to hospital. 
            // So hospital_id might not be strictly needed in body if branch is enough, but Doctor model has hospital_id. 
            // Branch->Hospital link exists. Backend should probably handle this, or we send hospital_id.
            // Let's assume selecting branch is enough for backend to resolve hospital or we pass it if needed.
            // Current formData doesn't store hospital_id explicitly except global 'user.hospital_id' logic which is for Client Admin.
            // BranchController createBranch uses hospital_id. 
            // DoctorController create likely needs it. 
            // IF Super Admin, we should probably append hospital_id if the backend expects it.
            // However, existing form didn't have hospital selection for Super Admin? 
            // Ah, existing form had `fetchDoctors` logic filtering by hospital but creation didn't seem to pick hospital?
            // Actually `validateForm` checks branch_ids.
            // Let's assume branch is sufficient.

            const token = localStorage.getItem('token');
            if (editingDoctor) {
                await axios.put(`${API_URL}/doctors/${editingDoctor.doctor_id}`, formDataToSend, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
            } else {
                await axios.post(`${API_URL}/doctors`, formDataToSend, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
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

    const handleEdit = async (doctor: any) => {
        setEditingDoctor(doctor);

        // Fetch doctor's branches
        let doctorBranches: number[] = [];
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/doctors/${doctor.doctor_id}/branches`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            doctorBranches = response.data.data.branches.map((b: any) => b.branch_id);

            // Fetch departments for these branches
            if (doctorBranches.length > 0) {
                await fetchDepartments(doctorBranches);
            }

            // If Super Admin, we should technically set the hospital selection based on the branch?
            // This is complex if valid across hospitals, but usually a doctor is in one hospital network.
            // We can try to find the hospital of the first branch.
            if (user?.role_code === 'SUPER_ADMIN' && doctorBranches.length > 0) {
                // Find branch details to get hospital_id
                // Since we only have IDs, maybe we need to fetch branch details?
                // Or just look up in 'branches' list if it contains all branches (it serves as filter list).
                // The 'branches' state fetchBranches() gets "all branches" for Super Admin.
                const branchInfo = branches.find((b: any) => b.branch_id === doctorBranches[0]);
                if (branchInfo) {
                    setSelectedHospitalForForm(branchInfo.hospital_id);
                    // Update available branches for this hospital
                    const hospBranches = branches.filter((b: any) => b.hospital_id === branchInfo.hospital_id);
                    setAvailableBranches(hospBranches);
                }
            }

        } catch (error) {
            console.error('Error fetching doctor branches:', error);
        }

        setFormData({
            username: doctor.username || '',
            email: doctor.email || '',
            password: '',
            phone_number: doctor.phone_number || '',
            first_name: doctor.first_name,
            last_name: doctor.last_name,
            department_id: doctor.department_id || '',
            specialization: doctor.specialization,
            registration_number: doctor.registration_number,
            qualification: doctor.qualification || '',
            experience_years: doctor.experience_years || '',
            consultation_fee: doctor.consultation_fee || '',
            branch_ids: doctorBranches,
            address: doctor.address || '',
            bank_name: doctor.bank_name || '',
            account_number: doctor.account_number || '',
            ifsc_code: doctor.ifsc_code || '',
            doctor_type: doctor.doctor_type || 'In-house',
            gender: doctor.gender || '',
            date_of_birth: doctor.date_of_birth ? new Date(doctor.date_of_birth).toISOString().split('T')[0] : ''
        });
        setSignatureFile(null);
        setShowModal(true);
    };

    const handleView = (doctor: any) => {
        setViewingDoctor(doctor);
    };

    const resetForm = () => {
        setFormData({
            username: '',
            email: '',
            password: '',
            phone_number: '',
            first_name: '',
            last_name: '',
            department_id: '',
            specialization: '',
            registration_number: '',
            qualification: '',
            experience_years: '',
            consultation_fee: '',
            branch_ids: [],
            address: '',
            bank_name: '',
            account_number: '',
            ifsc_code: '',
            doctor_type: 'In-house',
            gender: '',
            date_of_birth: ''
        });
        setSignatureFile(null);
        setErrors({});
        setEditingDoctor(null);
        setSignatureFile(null);
        setErrors({});
        setEditingDoctor(null);
        setSelectedHospitalForForm('');
        setAvailableBranches([]);
        setDepartments([]);
    };

    // Filter branches for the form based on selected hospital
    useEffect(() => {
        if (user?.role_code === 'CLIENT_ADMIN') {
            setAvailableBranches(branches); // Client admin sees their branches (already filtered by API)
        }
    }, [branches, user]);

    const handleHospitalChange = (hospitalId: string) => {
        setSelectedHospitalForForm(hospitalId);
        // Filter branches from the total list 'branches' which we fetched for filter. 
        // Or should we fetch specifically? 'branches' contains all branches for Super Admin.
        const hospBranches = branches.filter((b: any) => b.hospital_id.toString() === hospitalId);
        setAvailableBranches(hospBranches);
        setFormData({ ...formData, branch_ids: [], department_id: '' });
        setDepartments([]);
    };

    const formBranchOptions = (user?.role_code === 'SUPER_ADMIN' ? availableBranches : branches).map((branch: any) => ({
        value: branch.branch_id,
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
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 space-y-4 md:space-y-0 md:flex md:gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by name, hospital, ID, or registration number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div className="w-full md:w-64">
                    <select
                        value={selectedBranchId}
                        onChange={(e) => setSelectedBranchId(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        <div key={doctor.doctor_id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition group relative">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
                                    <Stethoscope className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleView(doctor)}
                                        className="text-gray-400 hover:text-blue-600 transition"
                                        title="View Details"
                                    >
                                        <Search className="w-5 h-5" />
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
                            <h3 className="font-semibold text-lg text-gray-900 mb-2">
                                Dr. {doctor.first_name} {doctor.last_name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-1">Specialization: {doctor.specialization}</p>
                            <p className="text-sm text-gray-600 mb-1">License: {doctor.registration_number}</p>
                            <p className="text-sm text-gray-600">Exp: {doctor.experience_years} years</p>
                            {doctor.all_hospitals && (
                                <div className="flex items-center gap-1 mt-2 text-sm text-blue-600 font-medium">
                                    <Building className="w-4 h-4" />
                                    {doctor.all_hospitals}
                                </div>
                            )}
                            {doctor.all_branches && (
                                <p className="text-xs text-gray-500 mt-1 ml-5">{doctor.all_branches}</p>
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
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Stethoscope className="w-8 h-8 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">Dr. {viewingDoctor.first_name} {viewingDoctor.last_name}</h3>
                                    <p className="text-blue-600 font-medium">{viewingDoctor.specialization}</p>
                                    {viewingDoctor.department_name && (
                                        <p className="text-sm text-gray-500 mt-1">{viewingDoctor.department_name}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Registration Number</label>
                                    <p className="text-gray-900 font-medium">{viewingDoctor.registration_number}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Doctor Code</label>
                                    <p className="text-gray-900 font-medium">{viewingDoctor.doctor_code}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                                    <p className="text-gray-900 font-medium">{viewingDoctor.email || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Phone</label>
                                    <p className="text-gray-900 font-medium">{viewingDoctor.phone_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Qualification</label>
                                    <p className="text-gray-900 font-medium">{viewingDoctor.qualification || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Experience</label>
                                    <p className="text-gray-900 font-medium">{viewingDoctor.experience_years} Years</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Consultation Fee</label>
                                    <p className="text-gray-900 font-medium">₹{viewingDoctor.consultation_fee || '0'}</p>
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

            {/* Modal with Glass Effect */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
                        <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-blue-100">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                                {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {editingDoctor ? 'Update doctor details' : 'Create a new doctor profile'}
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

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                    <select
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                    <input
                                        type="date"
                                        value={formData.date_of_birth}
                                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                    />
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

                                {user?.role_code === 'SUPER_ADMIN' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
                                        <select
                                            value={selectedHospitalForForm}
                                            onChange={(e) => handleHospitalChange(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                        >
                                            <option value="">Select Hospital</option>
                                            {hospitals.map((h: any) => (
                                                <option key={h.hospital_id} value={h.hospital_id}>
                                                    {h.hospital_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="col-span-2">
                                    <SearchableSelect
                                        label="Assign Branches *"
                                        options={formBranchOptions}
                                        value={formData.branch_ids}
                                        onChange={(val) => {
                                            setFormData({ ...formData, branch_ids: val, department_id: '' });
                                            fetchDepartments(val);
                                        }}
                                        placeholder="Select branches"
                                        multiple={true}
                                        error={errors.branch_ids}
                                    />
                                </div>

                                {/* Department Dropdown */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                    <select
                                        value={formData.department_id}
                                        onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map((dept: any) => (
                                            <option key={dept.department_id} value={dept.department_id}>
                                                {dept.department_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Specialization *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.specialization}
                                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                        className={`w-full px-4 py-2.5 border ${errors.specialization ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80`}
                                        placeholder="e.g., Cardiologist"
                                    />
                                    {errors.specialization && <p className="text-red-500 text-xs mt-1">{errors.specialization}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number /KMC *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.registration_number}
                                        onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                                        className={`w-full px-4 py-2.5 border ${errors.registration_number ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80`}
                                    />
                                    {errors.registration_number && <p className="text-red-500 text-xs mt-1">{errors.registration_number}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                                    <input
                                        type="text"
                                        value={formData.qualification}
                                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
                                    <input
                                        type="number"
                                        value={formData.experience_years}
                                        onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee</label>
                                    <input
                                        type="number"
                                        value={formData.consultation_fee}
                                        onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                    />
                                </div>
                            </div>

                            {/* New Fields: Address & Professional Info */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                    rows={2}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Type</label>
                                    <select
                                        value={formData.doctor_type}
                                        onChange={(e) => setFormData({ ...formData, doctor_type: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                    >
                                        <option value="In-house">In-house</option>
                                        <option value="Visiting">Visiting (VC)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Signature Upload</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            onChange={(e) => setSignatureFile(e.target.files ? e.target.files[0] : null)}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                        />
                                        {/* Show existing signature status if editing could be nice, but simple for now */}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Upload image or PDF (Max 5MB)</p>
                                </div>
                            </div>

                            {/* Bank Details */}
                            <div className="pt-4 border-t border-gray-200/50">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Details</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                                        <input
                                            type="text"
                                            value={formData.bank_name}
                                            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                                        <input
                                            type="text"
                                            value={formData.account_number}
                                            onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                                        <input
                                            type="text"
                                            value={formData.ifsc_code}
                                            onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                        />
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
                                    {editingDoctor ? 'Update Doctor' : 'Create Doctor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )
            }
        </div >
    );
}
