'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { User, Phone, MapPin, Calendar, Stethoscope, FileText, Check, AlertCircle, Loader2, Users, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { getReferralAgents } from '@/lib/api/marketing';

export default function AddReferralPatientPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Data Sources
    const [doctors, setDoctors] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);

    // Loading States
    const [fetchingDoctors, setFetchingDoctors] = useState(true);
    const [fetchingAgents, setFetchingAgents] = useState(true);

    const [error, setError] = useState('');

    // Search/Dropdown States
    const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
    const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);
    const [agentSearchTerm, setAgentSearchTerm] = useState('');
    const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState(false);

    const [referralMeans, setReferralMeans] = useState<'Doctor' | 'Agent' | 'Self'>('Doctor');

    const [formData, setFormData] = useState({
        patient_name: '',
        mobile_number: '',
        gender: '',
        age: '',
        place: '',
        referral_doctor_id: '', // Legacy/Fallback
        service_required: '',
        remarks: '',
        referral_patient_id: '',
        payment_type: 'Cash',
        referral_means: 'Doctor',
        means_id: ''
    });

    useEffect(() => {
        fetchDoctors();
        fetchAgents();
    }, []);

    // Sync referralMeans state with formData
    useEffect(() => {
        setFormData(prev => ({ ...prev, referral_means: referralMeans }));
    }, [referralMeans]);

    const fetchDoctors = async () => {
        try {
            const token = localStorage.getItem('token');
            const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || '';
            const apiUrl = `${baseUrl}/api/marketing/referral-doctors`;

            const response = await axios.get(apiUrl, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setDoctors(response.data.data.filter((d: any) => d.status === 'Active' || d.status === 'Pending' || !d.status));
            }
        } catch (err) {
            console.error('Error fetching doctors:', err);
            setError('Failed to load referral doctors.');
        } finally {
            setFetchingDoctors(false);
        }
    };

    const fetchAgents = async () => {
        try {
            const res = await getReferralAgents();
            if (res.success) {
                setAgents(res.data);
            }
        } catch (err) {
            console.error('Error fetching agents:', err);
        } finally {
            setFetchingAgents(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // --- Search Filtering ---
    const filteredDoctors = doctors.filter(doc =>
        doc.doctor_name.toLowerCase().includes(doctorSearchTerm.toLowerCase()) ||
        doc.mobile_number.includes(doctorSearchTerm)
    );

    const filteredAgents = agents.filter(agent =>
        agent.name.toLowerCase().includes(agentSearchTerm.toLowerCase()) ||
        agent.mobile.includes(agentSearchTerm)
    );

    // --- Handlers ---
    const handleDoctorSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDoctorSearchTerm(e.target.value);
        setIsDoctorDropdownOpen(true);
        if (formData.means_id) {
            setFormData(prev => ({ ...prev, means_id: '', referral_doctor_id: '' }));
        }
    };

    const handleDoctorSelect = (doc: any) => {
        setFormData(prev => ({ ...prev, means_id: doc.id, referral_doctor_id: doc.id }));
        setDoctorSearchTerm(`${doc.doctor_name} (${doc.speciality_type})`);
        setIsDoctorDropdownOpen(false);
    };

    const handleAgentSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAgentSearchTerm(e.target.value);
        setIsAgentDropdownOpen(true);
        if (formData.means_id) {
            setFormData(prev => ({ ...prev, means_id: '' }));
        }
    };

    const handleAgentSelect = (agent: any) => {
        setFormData(prev => ({ ...prev, means_id: agent.id }));
        setAgentSearchTerm(`${agent.name} (${agent.role || 'Agent'})`);
        setIsAgentDropdownOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validation
        if (!formData.patient_name || !formData.mobile_number) {
            setError('Please fill in Name and Mobile Number.');
            setLoading(false);
            return;
        }

        if (referralMeans === 'Doctor' && !formData.means_id) {
            setError('Please select a Referral Doctor.');
            setLoading(false);
            return;
        }

        if (referralMeans === 'Agent' && !formData.means_id) {
            setError('Please select a Referral Agent.');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || '';
            const apiUrl = `${baseUrl}/marketing/referral-patients`;

            // Ensure referral_doctor_id is populated for backward compatibility if Doctor is selected
            // If Agent/Self, referral_doctor_id can be null or ignored by backend if updated
            const payload = {
                ...formData,
                referral_doctor_id: referralMeans === 'Doctor' ? formData.means_id : null
            };

            const response = await axios.post(apiUrl, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setSubmitSuccess(true);
                setTimeout(() => {
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
                        payment_type: 'Cash',
                        referral_means: 'Doctor',
                        means_id: ''
                    });
                    setReferralMeans('Doctor');
                    setDoctorSearchTerm('');
                    setAgentSearchTerm('');
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
            <div className="flex items-center gap-4 mb-6">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                    title="Go Back"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Add Referral Patient</h1>
            </div>

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
                                <label className="text-sm font-medium text-gray-700">Referral Patient ID <span className="text-xs text-gray-400 font-normal">(Optional)</span></label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        name="referral_patient_id"
                                        value={formData.referral_patient_id}
                                        onChange={handleChange}
                                        placeholder="Enter ID"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Payment Type</label>
                                <div className="flex items-center gap-6 mt-2 h-[42px]">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="payment_type" value="Cash" checked={formData.payment_type === 'Cash'} onChange={handleChange} className="w-4 h-4 text-blue-600" />
                                        <span className="text-gray-700">Cash</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="payment_type" value="Insurance" checked={formData.payment_type === 'Insurance'} onChange={handleChange} className="w-4 h-4 text-blue-600" />
                                        <span className="text-gray-700">Insurance</span>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Patient Name <span className="text-red-500">*</span></label>
                                <input name="patient_name" value={formData.patient_name} onChange={handleChange} placeholder="Enter full name" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Mobile Number <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <input type="tel" name="mobile_number" value={formData.mobile_number} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); if (v.length <= 10) setFormData({ ...formData, mobile_number: v }); }} placeholder="10-digit number" className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required maxLength={10} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Gender</label>
                                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
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
                                    <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="Years" className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-gray-700">Place/City</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <input name="place" value={formData.place} onChange={handleChange} placeholder="Enter city or town" className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Referral Details */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <Stethoscope className="w-5 h-5 text-blue-600" />
                            Referral Source
                        </h2>

                        {/* Source Toggle */}
                        <div className="flex gap-4 mb-6">
                            <button
                                type="button"
                                onClick={() => { setReferralMeans('Doctor'); setFormData(p => ({ ...p, means_id: '', referral_doctor_id: '' })); }}
                                className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition ${referralMeans === 'Doctor' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                <Stethoscope size={16} /> Doctor
                            </button>
                            <button
                                type="button"
                                onClick={() => { setReferralMeans('Agent'); setFormData(p => ({ ...p, means_id: '', referral_doctor_id: '' })); }}
                                className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition ${referralMeans === 'Agent' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                <Users size={16} /> Agent / Other
                            </button>
                            <button
                                type="button"
                                onClick={() => { setReferralMeans('Self'); setFormData(p => ({ ...p, means_id: '', referral_doctor_id: '' })); }}
                                className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition ${referralMeans === 'Self' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                <User size={16} /> Self / Direct
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {referralMeans === 'Doctor' && (
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-700">Select Doctor <span className="text-red-500">*</span></label>
                                    {fetchingDoctors ? (
                                        <div className="text-sm text-gray-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading doctors...</div>
                                    ) : (
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={doctorSearchTerm}
                                                onChange={handleDoctorSearchChange}
                                                onFocus={() => setIsDoctorDropdownOpen(true)}
                                                placeholder="Search doctor by name..."
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                            {isDoctorDropdownOpen && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                    {filteredDoctors.length > 0 ? (
                                                        filteredDoctors.map(doc => (
                                                            <div key={doc.id} onClick={() => handleDoctorSelect(doc)} className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm">
                                                                <div className="font-medium">{doc.doctor_name}</div>
                                                                <div className="text-xs text-gray-500">{doc.speciality_type}</div>
                                                            </div>
                                                        ))
                                                    ) : <div className="p-2 text-sm text-gray-500">No doctors found.</div>}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {referralMeans === 'Agent' && (
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-700">Select Agent <span className="text-red-500">*</span></label>
                                    {fetchingAgents ? (
                                        <div className="text-sm text-gray-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading agents...</div>
                                    ) : (
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={agentSearchTerm}
                                                onChange={handleAgentSearchChange}
                                                onFocus={() => setIsAgentDropdownOpen(true)}
                                                placeholder="Search agent by name..."
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                            {isAgentDropdownOpen && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                    {filteredAgents.length > 0 ? (
                                                        filteredAgents.map(agent => (
                                                            <div key={agent.id} onClick={() => handleAgentSelect(agent)} className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm">
                                                                <div className="font-medium">{agent.name}</div>
                                                                <div className="text-xs text-gray-500">{agent.role}</div>
                                                            </div>
                                                        ))
                                                    ) : <div className="p-2 text-sm text-gray-500">No agents found.</div>}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-gray-700">Service Required</label>
                                <input name="service_required" value={formData.service_required} onChange={handleChange} placeholder="e.g. Consultation..." className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-gray-700">Remarks</label>
                                <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows={3} placeholder="Notes..." className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100">
                    <button type="button" onClick={() => router.back()} className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition">Cancel</button>
                    <button type="submit" disabled={loading} className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2">{loading && <Loader2 className="w-4 h-4 animate-spin" />} Save Patient</button>
                </div>
            </form>
        </div>
    );
}
