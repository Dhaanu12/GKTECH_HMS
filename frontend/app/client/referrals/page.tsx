'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, UserPlus, X, Save, Plus, Trash2, Link as LinkIcon } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function ReferralsPage() {
    const [activeTab, setActiveTab] = useState('hospitals');
    const [loading, setLoading] = useState(false);

    // Referral Hospitals State
    const [referralHospitals, setReferralHospitals] = useState<any[]>([]);
    const [showHospitalModal, setShowHospitalModal] = useState(false);
    const [editingHospital, setEditingHospital] = useState<any>(null);
    const [hospitalForm, setHospitalForm] = useState({
        hospital_name: '',
        hospital_address: '',
        city: '',
        state: '',
        phone_number: '',
        email: '',
        hospital_type: 'Private',
        specialties: [] as string[]
    });

    // Referral Doctors State
    const [referralDoctors, setReferralDoctors] = useState<any[]>([]);
    const [showDoctorModal, setShowDoctorModal] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState<any>(null);
    const [doctorForm, setDoctorForm] = useState({
        referral_hospital_id: '',
        doctor_name: '',
        specialization: '',
        department: '',
        phone_number: '',
        email: '',
        qualifications: ''
    });

    const [newSpecialty, setNewSpecialty] = useState('');

    useEffect(() => {
        fetchReferralHospitals();
        fetchReferralDoctors();
    }, []);

    const fetchReferralHospitals = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/referrals/hospitals`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReferralHospitals(response.data.data.referralHospitals || []);
        } catch (error) {
            console.error('Error fetching referral hospitals:', error);
        }
    };

    const fetchReferralDoctors = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/referrals/doctors`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReferralDoctors(response.data.data.referralDoctors || []);
        } catch (error) {
            console.error('Error fetching referral doctors:', error);
        }
    };

    const handleCreateHospital = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (editingHospital) {
                await axios.patch(`${API_URL}/referrals/hospitals/${editingHospital.referral_hospital_id}`, hospitalForm, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Referral hospital updated successfully!');
            } else {
                await axios.post(`${API_URL}/referrals/hospitals`, hospitalForm, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Referral hospital created successfully!');
            }
            setShowHospitalModal(false);
            resetHospitalForm();
            fetchReferralHospitals();
        } catch (error: any) {
            console.error('Error saving hospital:', error);
            alert(error.response?.data?.message || 'Failed to save hospital');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDoctor = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (editingDoctor) {
                await axios.patch(`${API_URL}/referrals/doctors/${editingDoctor.referral_doctor_id}`, doctorForm, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Referral doctor updated successfully!');
            } else {
                await axios.post(`${API_URL}/referrals/doctors`, doctorForm, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Referral doctor created successfully!');
            }
            setShowDoctorModal(false);
            resetDoctorForm();
            fetchReferralDoctors();
        } catch (error: any) {
            console.error('Error saving doctor:', error);
            alert(error.response?.data?.message || 'Failed to save doctor');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleMapping = async (hospitalId: number, isMapped: boolean) => {
        try {
            const token = localStorage.getItem('token');
            if (isMapped) {
                // Find and delete mapping
                const hospital = referralHospitals.find(h => h.referral_hospital_id === hospitalId);
                if (hospital?.mapping_id) {
                    await axios.delete(`${API_URL}/referrals/mappings/${hospital.mapping_id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }
            } else {
                await axios.post(`${API_URL}/referrals/mappings`, {
                    referral_hospital_id: hospitalId
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            fetchReferralHospitals();
        } catch (error) {
            console.error('Error toggling mapping:', error);
            alert('Failed to update hospital mapping');
        }
    };

    const handleDeleteHospital = async (id: number) => {
        if (!confirm('Are you sure you want to delete this referral hospital?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/referrals/hospitals/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Hospital deleted successfully!');
            fetchReferralHospitals();
        } catch (error) {
            console.error('Error deleting hospital:', error);
            alert('Failed to delete hospital');
        }
    };

    const handleDeleteDoctor = async (id: number) => {
        if (!confirm('Are you sure you want to delete this referral doctor?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/referrals/doctors/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Doctor deleted successfully!');
            fetchReferralDoctors();
        } catch (error) {
            console.error('Error deleting doctor:', error);
            alert('Failed to delete doctor');
        }
    };

    const resetHospitalForm = () => {
        setHospitalForm({
            hospital_name: '',
            hospital_address: '',
            city: '',
            state: '',
            phone_number: '',
            email: '',
            hospital_type: 'Private',
            specialties: []
        });
        setEditingHospital(null);
    };

    const resetDoctorForm = () => {
        setDoctorForm({
            referral_hospital_id: '',
            doctor_name: '',
            specialization: '',
            department: '',
            phone_number: '',
            email: '',
            qualifications: ''
        });
        setEditingDoctor(null);
    };

    const editHospital = (hospital: any) => {
        setEditingHospital(hospital);
        setHospitalForm({
            hospital_name: hospital.hospital_name,
            hospital_address: hospital.hospital_address || '',
            city: hospital.city || '',
            state: hospital.state || '',
            phone_number: hospital.phone_number || '',
            email: hospital.email || '',
            hospital_type: hospital.hospital_type || 'Private',
            specialties: hospital.specialties || []
        });
        setShowHospitalModal(true);
    };

    const editDoctor = (doctor: any) => {
        setEditingDoctor(doctor);
        setDoctorForm({
            referral_hospital_id: doctor.referral_hospital_id,
            doctor_name: doctor.doctor_name,
            specialization: doctor.specialization,
            department: doctor.department || '',
            phone_number: doctor.phone_number || '',
            email: doctor.email || '',
            qualifications: doctor.qualifications || ''
        });
        setShowDoctorModal(true);
    };

    const addSpecialty = () => {
        if (newSpecialty.trim() && !hospitalForm.specialties.includes(newSpecialty.trim())) {
            setHospitalForm({
                ...hospitalForm,
                specialties: [...hospitalForm.specialties, newSpecialty.trim()]
            });
            setNewSpecialty('');
        }
    };

    const removeSpecialty = (specialty: string) => {
        setHospitalForm({
            ...hospitalForm,
            specialties: hospitalForm.specialties.filter(s => s !== specialty)
        });
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Referral Management</h1>
                <p className="text-gray-600 mt-1">Manage external referral hospitals and doctors</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('hospitals')}
                    className={`px-4 py-2 font-medium transition ${activeTab === 'hospitals'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Building2 className="w-4 h-4 inline mr-2" />
                    Referral Hospitals
                </button>
                <button
                    onClick={() => setActiveTab('doctors')}
                    className={`px-4 py-2 font-medium transition ${activeTab === 'doctors'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <UserPlus className="w-4 h-4 inline mr-2" />
                    Referral Doctors
                </button>
            </div>

            {/* Hospitals Tab */}
            {activeTab === 'hospitals' && (
                <div>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => { resetHospitalForm(); setShowHospitalModal(true); }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            Add Referral Hospital
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {referralHospitals.map((hospital) => (
                            <div key={hospital.referral_hospital_id} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold text-gray-900">{hospital.hospital_name}</h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleToggleMapping(hospital.referral_hospital_id, hospital.is_mapped)}
                                            className={`p-1.5 rounded ${hospital.is_mapped ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                                            title={hospital.is_mapped ? 'Unlink from branch' : 'Link to branch'}
                                        >
                                            <LinkIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => editHospital(hospital)}
                                            className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteHospital(hospital.referral_hospital_id)}
                                            className="p-1.5 bg-red-50 text-red-700 rounded hover:bg-red-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <p><span className="font-medium">Type:</span> {hospital.hospital_type}</p>
                                    {hospital.city && <p><span className="font-medium">City:</span> {hospital.city}</p>}
                                    {hospital.phone_number && <p><span className="font-medium">Phone:</span> {hospital.phone_number}</p>}
                                    {hospital.specialties && hospital.specialties.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {hospital.specialties.map((spec: string, idx: number) => (
                                                <span key={idx} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                                    {spec}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {hospital.is_mapped && (
                                    <div className="mt-3 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full inline-block">
                                        ✓ Linked to branch
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Doctors Tab */}
            {activeTab === 'doctors' && (
                <div>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => { resetDoctorForm(); setShowDoctorModal(true); }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            Add Referral Doctor
                        </button>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Doctor Name</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Hospital</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Specialization</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Department</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Contact</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {referralDoctors.map((doctor) => (
                                    <tr key={doctor.referral_doctor_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{doctor.doctor_name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{doctor.hospital_name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{doctor.specialization}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{doctor.department || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{doctor.phone_number || '-'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => editDoctor(doctor)}
                                                    className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDoctor(doctor.referral_doctor_id)}
                                                    className="px-3 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Hospital Modal */}
            {showHospitalModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl">
                            <h2 className="text-xl font-bold">{editingHospital ? 'Edit' : 'Add'} Referral Hospital</h2>
                            <button onClick={() => { setShowHospitalModal(false); resetHospitalForm(); }} className="text-white hover:bg-white/20 p-2 rounded-lg">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateHospital} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={hospitalForm.hospital_name}
                                        onChange={(e) => setHospitalForm({ ...hospitalForm, hospital_name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <textarea
                                        rows={2}
                                        value={hospitalForm.hospital_address}
                                        onChange={(e) => setHospitalForm({ ...hospitalForm, hospital_address: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                    <input
                                        type="text"
                                        value={hospitalForm.city}
                                        onChange={(e) => setHospitalForm({ ...hospitalForm, city: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                    <input
                                        type="text"
                                        value={hospitalForm.state}
                                        onChange={(e) => setHospitalForm({ ...hospitalForm, state: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        value={hospitalForm.phone_number}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, "");
                                            if (value.length <= 10) {
                                                setHospitalForm({ ...hospitalForm, phone_number: value });
                                            }
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        maxLength={10}
                                        placeholder="10-digit number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={hospitalForm.email}
                                        onChange={(e) => setHospitalForm({ ...hospitalForm, email: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        value={hospitalForm.hospital_type}
                                        onChange={(e) => setHospitalForm({ ...hospitalForm, hospital_type: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Government">Government</option>
                                        <option value="Private">Private</option>
                                        <option value="Specialty">Specialty</option>
                                        <option value="Trust">Trust</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Specialties</label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={newSpecialty}
                                            onChange={(e) => setNewSpecialty(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Add specialty..."
                                        />
                                        <button
                                            type="button"
                                            onClick={addSpecialty}
                                            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {hospitalForm.specialties.map((spec, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full flex items-center gap-2">
                                                {spec}
                                                <button
                                                    type="button"
                                                    onClick={() => removeSpecialty(spec)}
                                                    className="hover:bg-purple-200 rounded-full p-0.5"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => { setShowHospitalModal(false); resetHospitalForm(); }}
                                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                                >
                                    <Save className="w-5 h-5" />
                                    {loading ? 'Saving...' : editingHospital ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Doctor Modal */}
            {showDoctorModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl">
                            <h2 className="text-xl font-bold">{editingDoctor ? 'Edit' : 'Add'} Referral Doctor</h2>
                            <button onClick={() => { setShowDoctorModal(false); resetDoctorForm(); }} className="text-white hover:bg-white/20 p-2 rounded-lg">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateDoctor} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Referral Hospital *</label>
                                    <select
                                        required
                                        value={doctorForm.referral_hospital_id}
                                        onChange={(e) => setDoctorForm({ ...doctorForm, referral_hospital_id: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Hospital</option>
                                        {referralHospitals.map((hospital) => (
                                            <option key={hospital.referral_hospital_id} value={hospital.referral_hospital_id}>
                                                {hospital.hospital_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={doctorForm.doctor_name}
                                        onChange={(e) => setDoctorForm({ ...doctorForm, doctor_name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Specialization *</label>
                                    <input
                                        type="text"
                                        required
                                        value={doctorForm.specialization}
                                        onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                    <input
                                        type="text"
                                        value={doctorForm.department}
                                        onChange={(e) => setDoctorForm({ ...doctorForm, department: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        value={doctorForm.phone_number}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, "");
                                            if (value.length <= 10) {
                                                setDoctorForm({ ...doctorForm, phone_number: value });
                                            }
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        maxLength={10}
                                        placeholder="10-digit number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={doctorForm.email}
                                        onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Qualifications</label>
                                    <textarea
                                        rows={2}
                                        value={doctorForm.qualifications}
                                        onChange={(e) => setDoctorForm({ ...doctorForm, qualifications: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="MBBS, MD, etc."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => { setShowDoctorModal(false); resetDoctorForm(); }}
                                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                                >
                                    <Save className="w-5 h-5" />
                                    {loading ? 'Saving...' : editingDoctor ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
