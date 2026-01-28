'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { User, Phone, MapPin, Calendar, Stethoscope, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function AddReferralPatientPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [fetchingDoctors, setFetchingDoctors] = useState(true);
    const [error, setError] = useState('');
    const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
    const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);

    const [formData, setFormData] = useState({
        patient_name: '',
        mobile_number: '',
        gender: '',
        age: '',
        place: '',
        referral_doctor_id: '',
        service_required: '',
        remarks: '',
        referral_patient_id: '',
        payment_type: 'Cash'
    });



    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        try {
            const token = localStorage.getItem('token');
            const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || '';
            const apiUrl = `${baseUrl}/api/marketing/referral-doctors`;

            const response = await axios.get(apiUrl, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setDoctors(response.data.data.filter((d: any) => d.status === 'Active' || d.status === 'Pending' || !d.status)); // Show Active and Pending doctors
            }
        } catch (err) {
            console.error('Error fetching doctors:', err);
            setError('Failed to load referral doctors. Please refresh.');
        } finally {
            setFetchingDoctors(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const filteredDoctors = doctors.filter(doc =>
        doc.doctor_name.toLowerCase().includes(doctorSearchTerm.toLowerCase()) ||
        doc.mobile_number.includes(doctorSearchTerm)
    );

    const handleDoctorSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDoctorSearchTerm(e.target.value);
        setIsDoctorDropdownOpen(true);
        // Clear selected ID when searching/typing, force re-selection
        if (formData.referral_doctor_id) {
            setFormData(prev => ({ ...prev, referral_doctor_id: '' }));
        }
    };

    const handleDoctorSelect = (doc: any) => {
        setFormData(prev => ({ ...prev, referral_doctor_id: doc.id }));
        setDoctorSearchTerm(`${doc.doctor_name} (${doc.speciality_type})`);
        setIsDoctorDropdownOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Basic validation
        if (!formData.patient_name || !formData.mobile_number || !formData.referral_doctor_id) {
            setError('Please fill in all required fields (Name, Mobile, Doctor).');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');

            const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || '';
            const apiUrl = `${baseUrl}/api/marketing/referral-patients`;

            const response = await axios.post(apiUrl, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setSubmitSuccess(true);
                // Reset form after delay or redirect
                setTimeout(() => {
                    // router.push('/marketing/dashboard'); // Or stay here to add more?
                    // Let's reset for now
                    setFormData({
                        patient_name: '',
                        mobile_number: '',
                        gender: '',
                        age: '',
                        place: '',
                        referral_doctor_id: '',
                        service_required: '',
                        remarks: '',
                        referral_patient_id: '',
                        payment_type: 'Cash'
                    });
                    setSubmitSuccess(false);
                }, 2000);
            }
        } catch (err: any) {
            console.error('Submit error:', err);
            setError(err.response?.data?.message || 'Failed to add patient. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Add Referral Patient</h1>

            {submitSuccess && (
                <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <Check className="w-5 h-5" />
                    Patient added successfully!
                </div>
            )}

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
                <div className="p-6 md:p-8 space-y-6">

                    {/* Patient Information */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-600" />
                            Patient Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Referral Patient ID <span className="text-xs text-gray-400 font-normal">(Optional, Auto-generated if empty)</span></label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        name="referral_patient_id"
                                        value={formData.referral_patient_id}
                                        onChange={handleChange}
                                        placeholder="Enter ID"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Payment Type</label>
                                <div className="flex items-center gap-6 mt-2 h-[42px]">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="payment_type"
                                            value="Cash"
                                            checked={formData.payment_type === 'Cash'}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                        />
                                        <span className="text-gray-700">Cash</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="payment_type"
                                            value="Insurance"
                                            checked={formData.payment_type === 'Insurance'}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                        />
                                        <span className="text-gray-700">Insurance</span>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Patient Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="patient_name"
                                    value={formData.patient_name}
                                    onChange={handleChange}
                                    placeholder="Enter full name"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Mobile Number <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <input
                                        type="tel"
                                        name="mobile_number"
                                        value={formData.mobile_number}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, "");
                                            if (value.length <= 10) {
                                                setFormData({ ...formData, mobile_number: value });
                                            }
                                        }}
                                        placeholder="10-digit number"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        required
                                        maxLength={10}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Gender</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Age</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <input
                                        type="number"
                                        name="age"
                                        value={formData.age}
                                        onChange={handleChange}
                                        placeholder="Years"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-gray-700">Place/City</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        name="place"
                                        value={formData.place}
                                        onChange={handleChange}
                                        placeholder="Enter city or town"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Referral Details */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <Stethoscope className="w-5 h-5 text-blue-600" />
                            Referral Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-gray-700">Referral Doctor <span className="text-red-500">*</span></label>
                                {fetchingDoctors ? (
                                    <div className="text-sm text-gray-500 flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Loading doctors...
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={doctorSearchTerm}
                                            onChange={handleDoctorSearchChange}
                                            onFocus={() => setIsDoctorDropdownOpen(true)}
                                            placeholder="Search doctor by name or mobile..."
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        />
                                        {isDoctorDropdownOpen && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                {filteredDoctors.length > 0 ? (
                                                    filteredDoctors.map(doc => (
                                                        <div
                                                            key={doc.id}
                                                            onClick={() => handleDoctorSelect(doc)}
                                                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                                                        >
                                                            <div className="font-medium text-gray-800">{doc.doctor_name}</div>
                                                            <div className="text-gray-500 text-xs">{doc.speciality_type} • {doc.mobile_number}</div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-2 text-sm text-gray-500">No doctors found.</div>
                                                )}
                                            </div>
                                        )}
                                        {/* Hidden input to enforce required validation if needed, though client-side check exists in handleSubmit */}
                                        <input
                                            type="hidden"
                                            name="referral_doctor_id"
                                            value={formData.referral_doctor_id}
                                            required
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-gray-700">Service Required</label>
                                <input
                                    type="text"
                                    name="service_required"
                                    value={formData.service_required}
                                    onChange={handleChange}
                                    placeholder="e.g. Consultation, X-Ray, Surgery..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-gray-700">Remarks</label>
                                <textarea
                                    name="remarks"
                                    value={formData.remarks}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Any additional notes..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? 'Saving...' : 'Save Patient'}
                    </button>
                </div>
            </form>
        </div>
    );
}
