'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Building2, Search, Edit2, Loader2, Power, Upload, Stethoscope } from 'lucide-react';
import MedicalServicesSelector from '@/components/MedicalServicesSelector';

const API_URL = 'http://localhost:5000/api';

const ACCESS_MODULES = [
    { id: 'doc', label: 'Doctor' },
    { id: 'nurse', label: 'Nurse' },
    { id: 'lab', label: 'Laboratory' },
    { id: 'pharma', label: 'Pharmacy' },
    { id: 'market', label: 'Marketing' },
    { id: 'acc', label: 'Accountant' },
    { id: 'reception', label: 'Receptionist' }
];

interface ModuleConfig {
    id: string;
    is_active: boolean;
}

export default function HospitalsPage() {
    const [departments, setDepartments] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingHospital, setEditingHospital] = useState<any>(null);
    const [formData, setFormData] = useState({
        hospital_name: '',
        hospital_code: '',
        hospital_type: 'Private',
        headquarters_address: '',
        contact_number: '',
        email: '',
        established_date: '',
        total_beds: '',
        admin_name: '',
        admin_username: '',
        admin_email: '',
        admin_phone: '',
        admin_password: '',
        department_ids: [] as number[],
        service_ids: [] as number[],
        enabled_modules: [] as ModuleConfig[],
        logo: null as File | null
    });
    const [errors, setErrors] = useState<any>({});

    const [searchTerm, setSearchTerm] = useState('');
    const [viewingHospital, setViewingHospital] = useState<any>(null);
    const [managingServicesHospital, setManagingServicesHospital] = useState<any>(null);

    useEffect(() => {
        fetchHospitals();
        fetchDepartments();
        fetchServices();
    }, []);

    const fetchHospitals = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/hospitals`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const hospitalsData = response.data.data.hospitals || [];

            // Fetch medical services count for each hospital
            const hospitalsWithCounts = await Promise.all(
                hospitalsData.map(async (hospital: any) => {
                    try {
                        const servicesRes = await axios.get(
                            `${API_URL}/medical-services/hospital/${hospital.hospital_id}`,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        return {
                            ...hospital,
                            medical_services_count: servicesRes.data.services?.length || 0
                        };
                    } catch (err) {
                        return { ...hospital, medical_services_count: 0 };
                    }
                })
            );

            setHospitals(hospitalsWithCounts);
        } catch (error) {
            console.error('Error fetching hospitals:', error);
        } finally {
            setLoading(false);
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

    const filteredHospitals = hospitals.filter((hospital: any) =>
        hospital.hospital_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hospital.hospital_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const validateForm = () => {
        const newErrors: any = {};

        if (!formData.hospital_name) newErrors.hospital_name = 'Hospital name is required';
        if (!formData.hospital_code) newErrors.hospital_code = 'Hospital code is required';

        // Only validate admin fields when creating (not editing)
        if (!editingHospital) {
            if (!formData.admin_name) newErrors.admin_name = 'Admin name is required';
            if (!formData.admin_email) newErrors.admin_email = 'Admin email is required';
            if (!formData.admin_password) newErrors.admin_password = 'Admin password is required';
            if (!formData.admin_username) newErrors.admin_username = 'Admin username is required';

            if (formData.admin_email && !/\S+@\S+\.\S+/.test(formData.admin_email)) {
                newErrors.admin_email = 'Invalid email format';
            }

            if (formData.admin_password && formData.admin_password.length < 8) {
                newErrors.admin_password = 'Password must be at least 8 characters';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            const token = localStorage.getItem('token');

            const formDataPayload = new FormData();

            // Append all text fields
            formDataPayload.append('hospital_name', formData.hospital_name);
            formDataPayload.append('hospital_code', formData.hospital_code);
            formDataPayload.append('hospital_type', formData.hospital_type);
            formDataPayload.append('headquarters_address', formData.headquarters_address);
            formDataPayload.append('contact_number', formData.contact_number);
            formDataPayload.append('email', formData.email);
            formDataPayload.append('established_date', formData.established_date);

            // Only append total_beds if it has a value
            if (formData.total_beds && formData.total_beds !== '') {
                formDataPayload.append('total_beds', formData.total_beds);
            }

            // Append enabled_modules as JSON string
            formDataPayload.append('enabled_modules', JSON.stringify(formData.enabled_modules));

            // Append logo if exists
            if (formData.logo) {
                formDataPayload.append('logo', formData.logo);
            }

            // Append arrays and objects
            if (!editingHospital) {
                formDataPayload.append('admin_name', formData.admin_name);
                formDataPayload.append('admin_username', formData.admin_username);
                formDataPayload.append('admin_email', formData.admin_email);
                formDataPayload.append('admin_phone', formData.admin_phone);
                formDataPayload.append('admin_password', formData.admin_password);
            }

            // Append mappings for both Create and Edit
            formData.department_ids.forEach(id => formDataPayload.append('department_ids[]', id.toString()));
            formData.service_ids.forEach(id => formDataPayload.append('service_ids[]', id.toString()));

            if (editingHospital) {
                // Update existing hospital
                await axios.put(`${API_URL}/hospitals/${editingHospital.hospital_id}`, formDataPayload, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
            } else {
                // Create new hospital
                await axios.post(`${API_URL}/hospitals`, formDataPayload, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
            }

            setShowModal(false);
            fetchHospitals();
            resetForm();
        } catch (error: any) {
            console.error('Error saving hospital:', error);
            alert(error.response?.data?.message || 'Failed to save hospital');
        }
    };

    const toggleStatus = async (hospitalId: number, currentStatus: boolean) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_URL}/hospitals/${hospitalId}/status`,
                { is_active: !currentStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchHospitals();
        } catch (error: any) {
            console.error('Error toggling hospital status:', error);
            alert(error.response?.data?.message || 'Failed to update hospital status');
        }
    };

    const handleEdit = async (hospital: any) => {
        setEditingHospital(hospital);
        // Format date for input field (YYYY-MM-DD)
        const formattedDate = hospital.established_date ? new Date(hospital.established_date).toISOString().split('T')[0] : '';

        setFormData({
            hospital_name: hospital.hospital_name,
            hospital_code: hospital.hospital_code,
            hospital_type: hospital.hospital_type,
            headquarters_address: hospital.headquarters_address || '',
            contact_number: hospital.contact_number || '',
            email: hospital.email || '',
            established_date: formattedDate,
            total_beds: hospital.total_beds || '',
            admin_name: '',
            admin_username: '',
            admin_email: '',
            admin_phone: '',
            admin_password: '',
            department_ids: [],
            service_ids: [],
            enabled_modules: Array.isArray(hospital.enabled_modules)
                ? hospital.enabled_modules.map((m: any) => typeof m === 'string' ? { id: m, is_active: true } : m)
                : [],
            logo: null
        });
        setShowModal(true);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/hospitals/${hospital.hospital_id}/mappings`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const deptIds = response.data.data.departments.map((d: any) => Number(d.department_id));
            const svcIds = response.data.data.services.map((s: any) => Number(s.service_id));

            setFormData(prev => ({
                ...prev,
                department_ids: deptIds,
                service_ids: svcIds
            }));
        } catch (error) {
            console.error('Error fetching hospital mappings:', error);
        }
    };

    const handleView = (hospital: any) => {
        setViewingHospital(hospital);
    };

    const resetForm = () => {
        setEditingHospital(null);
        setFormData({
            hospital_name: '',
            hospital_code: '',
            hospital_type: 'Private',
            headquarters_address: '',
            contact_number: '',
            email: '',
            established_date: '',
            total_beds: '',
            admin_name: '',
            admin_username: '',
            admin_email: '',
            admin_phone: '',
            admin_password: '',
            department_ids: [],
            service_ids: [],
            enabled_modules: [],
            logo: null
        });
        setErrors({});
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Hospitals</h1>
                    <p className="text-gray-600 text-sm mt-1">Manage all hospitals in the system</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5" />
                        Add Hospital
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredHospitals.map((hospital: any) => (
                        <div key={hospital.hospital_id} className={`bg-white border rounded-lg p-6 hover:shadow-lg transition group ${!hospital.is_active ? 'opacity-60 border-gray-300' : 'border-gray-200'}`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
                                    <Building2 className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleView(hospital)}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                        title="View Details"
                                    >
                                        <Search className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setManagingServicesHospital(hospital)}
                                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                        title="Manage Medical Services"
                                    >
                                        <Stethoscope className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(hospital)}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                        title="Edit"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => toggleStatus(hospital.hospital_id, hospital.is_active)}
                                        className={`p-2 rounded-lg transition ${hospital.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
                                        title={hospital.is_active ? 'Deactivate' : 'Activate'}
                                    >
                                        <Power className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-semibold text-lg text-gray-900 mb-2">{hospital.hospital_name}</h3>
                            <p className="text-sm text-gray-600 mb-1">Code: <span className="font-medium text-gray-800">{hospital.hospital_code}</span></p>
                            <p className="text-sm text-gray-600">Type: <span className="font-medium text-gray-800">{hospital.hospital_type}</span></p>
                            {!hospital.is_active && (
                                <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Inactive</span>
                            )}
                        </div>
                    ))}
                    {filteredHospitals.length === 0 && (
                        <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <p className="text-lg font-medium text-gray-600">No hospitals found</p>
                            <p className="text-sm text-gray-400">Try adjusting your search or add a new hospital</p>
                        </div>
                    )}
                </div>
            )}

            {/* View Modal */}
            {viewingHospital && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{viewingHospital.hospital_name}</h2>
                                <p className="text-sm text-gray-500">{viewingHospital.hospital_code}</p>
                            </div>
                            <button
                                onClick={() => setViewingHospital(null)}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</label>
                                <p className="text-gray-900 font-medium mt-1">{viewingHospital.hospital_type}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</label>
                                <p className={`font-medium mt-1 ${viewingHospital.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                    {viewingHospital.is_active ? 'Active' : 'Inactive'}
                                </p>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Headquarters Address</label>
                                <p className="text-gray-900 mt-1">{viewingHospital.headquarters_address || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact Number</label>
                                <p className="text-gray-900 mt-1">{viewingHospital.contact_number || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</label>
                                <p className="text-gray-900 mt-1">{viewingHospital.email || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Established Date</label>
                                <p className="text-gray-900 mt-1">
                                    {viewingHospital.established_date ? new Date(viewingHospital.established_date).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Beds</label>
                                <p className="text-gray-900 mt-1">{viewingHospital.total_beds || 0}</p>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Enabled Modules</label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {viewingHospital.enabled_modules && viewingHospital.enabled_modules.length > 0 ? (
                                        viewingHospital.enabled_modules.map((mod: any) => {
                                            const modId = typeof mod === 'string' ? mod : mod.id;
                                            const isActive = typeof mod === 'string' ? true : mod.is_active;

                                            const updateMod = ACCESS_MODULES.find(m => m.id === modId);
                                            if (!updateMod) return null;

                                            return (
                                                <span key={modId} className={`px-2 py-1 text-xs rounded-md border flex items-center gap-1 ${isActive ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                                    {updateMod.label}
                                                    {!isActive && <span className="text-[10px] uppercase bg-gray-200 px-1 rounded">Inactive</span>}
                                                </span>
                                            );
                                        })
                                    ) : (
                                        <span className="text-gray-500 italic">No modules enabled</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button
                                onClick={() => setViewingHospital(null)}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium shadow-sm"
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
                        <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-blue-100">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                                {editingHospital ? 'Edit Hospital' : 'Add New Hospital'}
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {editingHospital ? 'Update hospital information' : 'Create a new hospital with admin account'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Hospital Details */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hospital Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.hospital_name}
                                            onChange={(e) => setFormData({ ...formData, hospital_name: e.target.value })}
                                            className={`w-full px-4 py-2.5 border ${errors.hospital_name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80`}
                                            placeholder="Enter hospital name"
                                        />
                                        {errors.hospital_name && <p className="text-red-500 text-xs mt-1">{errors.hospital_name}</p>}
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Logo</label>
                                        <div className="flex items-center justify-center w-full">
                                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <Upload className="w-8 h-8 mb-3 text-gray-400" />
                                                    <p className="text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                    <p className="text-xs text-gray-500">SVG, PNG, JPG or GIF (MAX. 5MB)</p>
                                                </div>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        if (e.target.files && e.target.files[0]) {
                                                            setFormData({ ...formData, logo: e.target.files[0] });
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                        {formData.logo && (
                                            <p className="text-sm text-blue-600 mt-2">Selected: {formData.logo.name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Code *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.hospital_code}
                                            onChange={(e) => setFormData({ ...formData, hospital_code: e.target.value.toUpperCase() })}
                                            className={`w-full px-4 py-2.5 border ${errors.hospital_code ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80`}
                                            placeholder="e.g., HSP001"
                                        />
                                        {errors.hospital_code && <p className="text-red-500 text-xs mt-1">{errors.hospital_code}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Type</label>
                                        <select
                                            value={formData.hospital_type}
                                            onChange={(e) => setFormData({ ...formData, hospital_type: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                        >
                                            <option value="Private">Private</option>
                                            <option value="Government">Government</option>
                                            <option value="Trust">Trust</option>
                                            <option value="Corporate">Corporate</option>
                                        </select>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Headquarters Address</label>
                                        <textarea
                                            value={formData.headquarters_address}
                                            onChange={(e) => setFormData({ ...formData, headquarters_address: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                            rows={2}
                                            placeholder="Enter full address"
                                        />
                                    </div>

                                    <div>
                                        {/* <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                        <input
                                            type="tel"
                                            value={formData.contact_number}
                                            onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                            placeholder="+91-XXXXXXXXXX"
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                            placeholder="hospital@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Established Date</label>
                                        <input
                                            type="date"
                                            value={formData.established_date}
                                            onChange={(e) => setFormData({ ...formData, established_date: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Beds</label>
                                        <input
                                            type="number"
                                            value={formData.total_beds}
                                            onChange={(e) => setFormData({ ...formData, total_beds: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                            placeholder="0"
                                            min="0"
                                        />
                                    </div>
                                    <div className="col-span-2 mt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Access Control (Enabled Modules)</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                            {ACCESS_MODULES.map((module) => {
                                                const config = formData.enabled_modules.find(m => m.id === module.id);
                                                const isAssigned = !!config;

                                                return (
                                                    <div key={module.id} className={`p-3 rounded-lg border transition-all ${isAssigned ? 'bg-white border-blue-200 shadow-sm' : 'bg-gray-50 border-gray-200 border-dashed'}`}>
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className={`text-sm font-medium ${isAssigned ? 'text-gray-900' : 'text-gray-500'}`}>{module.label}</span>
                                                            {isAssigned ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newModules = formData.enabled_modules.filter(m => m.id !== module.id);
                                                                        setFormData({ ...formData, enabled_modules: newModules });
                                                                    }}
                                                                    className="text-gray-400 hover:text-red-500 transition"
                                                                    title="Unassign Module"
                                                                >
                                                                    <span className="text-lg">&times;</span>
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setFormData({
                                                                            ...formData,
                                                                            enabled_modules: [...formData.enabled_modules, { id: module.id, is_active: true }]
                                                                        });
                                                                    }}
                                                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                                                                >
                                                                    <Plus className="w-4 h-4" /> Assign
                                                                </button>
                                                            )}
                                                        </div>

                                                        {isAssigned && (
                                                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                                                                <span className="text-xs text-gray-500">Status</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newModules = formData.enabled_modules.map(m => {
                                                                            if (m.id === module.id) return { ...m, is_active: !m.is_active };
                                                                            return m;
                                                                        });
                                                                        setFormData({ ...formData, enabled_modules: newModules });
                                                                    }}
                                                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${config?.is_active ? 'bg-blue-600' : 'bg-gray-200'}`}
                                                                >
                                                                    <span
                                                                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${config?.is_active ? 'translate-x-5' : 'translate-x-1'}`}
                                                                    />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Users with roles corresponding to disabled modules will not be able to login.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Admin Details - Only show when creating*/}
                            {!editingHospital && (
                                <div className="pt-6 border-t border-gray-200/50">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Admin Account</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Name *</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.admin_name}
                                                onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                                                className={`w-full px-4 py-2.5 border ${errors.admin_name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80`}
                                                placeholder="Enter full name (e.g. John Doe)"
                                            />
                                            {errors.admin_name && <p className="text-red-500 text-xs mt-1">{errors.admin_name}</p>}
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Username *</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.admin_username}
                                                onChange={(e) => setFormData({ ...formData, admin_username: e.target.value })}
                                                className={`w-full px-4 py-2.5 border ${errors.admin_username ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80`}
                                                placeholder="Enter username"
                                            />
                                            {errors.admin_username && <p className="text-red-500 text-xs mt-1">{errors.admin_username}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email *</label>
                                            <input
                                                type="email"
                                                required
                                                value={formData.admin_email}
                                                onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                                                className={`w-full px-4 py-2.5 border ${errors.admin_email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80`}
                                                placeholder="admin@example.com"
                                            />
                                            {errors.admin_email && <p className="text-red-500 text-xs mt-1">{errors.admin_email}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Phone</label>
                                            <input
                                                type="tel"
                                                value={formData.admin_phone}
                                                onChange={(e) => setFormData({ ...formData, admin_phone: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                                placeholder="+91-XXXXXXXXXX"
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Password *</label>
                                            <input
                                                type="password"
                                                required
                                                value={formData.admin_password}
                                                onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                                                className={`w-full px-4 py-2.5 border ${errors.admin_password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80`}
                                                placeholder="Minimum 8 characters"
                                            />
                                            {errors.admin_password && <p className="text-red-500 text-xs mt-1">{errors.admin_password}</p>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Departments & Services Selection */}
                            <div className="pt-6 border-t border-gray-200/50">
                                <div className="space-y-6">
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
                                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg hover:from-blue-700 hover:to-blue-900 transition font-medium shadow-lg shadow-blue-500/30"
                                >
                                    {editingHospital ? 'Update Hospital' : 'Create Hospital'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Medical Services Management Modal */}
            {managingServicesHospital && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                                    Manage Medical Services
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    {managingServicesHospital.hospital_name}
                                </p>
                            </div>
                            <button
                                onClick={() => setManagingServicesHospital(null)}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                            <MedicalServicesSelector
                                hospitalId={managingServicesHospital.hospital_id}
                                onSave={() => {
                                    setManagingServicesHospital(null);
                                    fetchHospitals();
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
