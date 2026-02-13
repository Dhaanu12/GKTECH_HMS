'use client';

import React, { useState, useEffect } from 'react';
import { createReferralDoctor, updateReferralDoctor, getReferralAgents } from '@/lib/api/marketing';
import { ReferralDoctor, ReferralAgent } from '@/types/marketing';
import { Save, MapPin, Upload, FileText, CreditCard, User, Building, CheckCircle2 } from 'lucide-react';

interface DoctorFormProps {
    doctor?: ReferralDoctor;
    onSuccess: () => void;
    onCancel: () => void;
    requireLocation?: boolean;
    variant?: 'default' | 'modal';
}

const DoctorForm: React.FC<DoctorFormProps> = ({ doctor, onSuccess, onCancel, requireLocation = false, variant = 'default' }) => {
    const isEdit = !!doctor;
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [agents, setAgents] = useState<ReferralAgent[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        // Personal
        doctor_name: doctor?.doctor_name || '',
        clinic_name: doctor?.clinic_name || '',
        mobile_number: doctor?.mobile_number || '',
        speciality_type: doctor?.speciality_type || '',
        department_id: doctor?.department_id || 1,
        address: doctor?.address || '',

        // KYC
        medical_council_membership_number: doctor?.medical_council_membership_number || '',
        council: doctor?.council || '',
        pan_card_number: doctor?.pan_card_number || '',
        aadhar_card_number: doctor?.aadhar_card_number || '',

        // Bank
        bank_name: doctor?.bank_name || '',
        bank_branch: doctor?.bank_branch || '',
        bank_address: doctor?.bank_address || '',
        bank_account_number: doctor?.bank_account_number || '',
        bank_ifsc_code: doctor?.bank_ifsc_code || '',

        // Internal
        referral_pay: doctor?.referral_pay || 0,

        // Location
        geo_latitude: doctor?.geo_latitude || '',
        geo_longitude: doctor?.geo_longitude || '',
        geo_accuracy: doctor?.geo_accuracy || '',

        // Referral Source
        referral_means: doctor?.referral_means || '',
        means_id: doctor?.means_id || ''
    });

    const [files, setFiles] = useState<{ photo?: File, pan?: File, aadhar?: File, clinic_photo?: File, kyc_document?: File }>({});
    const [locationError, setLocationError] = useState('');

    // Fetch agents for referral source dropdown
    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const res = await getReferralAgents();
                if (res.success) {
                    setAgents(res.data);
                }
            } catch (err) {
                console.error('Error fetching agents:', err);
            }
        };
        fetchAgents();
    }, []);

    // Auto-capture location on mount
    useEffect(() => {
        if (requireLocation && !doctor?.geo_latitude && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                setFormData(prev => ({
                    ...prev,
                    geo_latitude: position.coords.latitude.toString(),
                    geo_longitude: position.coords.longitude.toString(),
                    geo_accuracy: position.coords.accuracy.toString()
                }));
                setLocationError(''); // Clear any previous errors
            }, (error) => {
                // Handle location errors
                if (error.code === 1) {
                    // Permission denied
                    setLocationError('Location access denied. Please enable location permissions to continue.');
                } else if (error.code === 2) {
                    setLocationError('Location unavailable. Please check your device settings.');
                } else if (error.code === 3) {
                    setLocationError('Location request timed out. Please try again.');
                } else {
                    setLocationError('Failed to capture location: ' + error.message);
                }
            });
        }
    }, [doctor, requireLocation]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'mobile_number') {
            const numericValue = value.replace(/\D/g, '').slice(0, 10);
            setFormData({ ...formData, [name]: numericValue });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFiles({ ...files, [e.target.name]: e.target.files[0] });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate location is captured
        if (requireLocation && (!formData.geo_latitude || !formData.geo_longitude)) {
            setErrorMessage(locationError || 'Location is required. Please enable location permissions and refresh the page to capture your location.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setLoading(true);
        setSuccessMessage('');
        setErrorMessage('');

        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) data.append(key, String(value));
        });

        if (files.photo) data.append('photo', files.photo);
        if (files.pan) data.append('pan', files.pan);
        if (files.aadhar) data.append('aadhar', files.aadhar);
        if (files.clinic_photo) data.append('clinic_photo', files.clinic_photo);
        if (files.kyc_document) data.append('kyc_document', files.kyc_document);

        try {
            if (isEdit && doctor) {
                await updateReferralDoctor(doctor.id, data);
                setSuccessMessage('Doctor details updated successfully!');
            } else {
                await createReferralDoctor(data);
                setSuccessMessage('Referral Doctor added successfully!');
            }

            // Auto-dismiss success message and call onSuccess after 2 seconds
            setTimeout(() => {
                setSuccessMessage('');
                onSuccess();
            }, 2000);
        } catch (error) {
            console.error(error);
            const errorMsg = (error as any).response?.data?.message || (error as any).message || 'Error saving doctor details';
            setErrorMessage(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const SectionHeader = ({ title, icon: Icon, id }: { title: string, icon: any, id: string }) => (
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 text-blue-700">
            <Icon size={20} />
            <h3 className="font-semibold text-lg">{title}</h3>
        </div>
    );



    return (
        <form onSubmit={handleSubmit} className={variant === 'default' ? "bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" : "bg-white"}>
            {variant === 'default' && (
                <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-100 mb-6">
                    <h2 className="text-xl font-bold text-gray-800">{isEdit ? 'Edit Doctor Details' : 'Onboard New Referral Doctor'}</h2>
                    <p className="text-sm text-gray-500 mt-1">Please fill in all the required details to register the doctor.</p>
                </div>
            )}

            {/* Success Message */}
            {successMessage && (
                <div className="mx-6 mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 text-green-800 animate-fade-in">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-sm">{successMessage}</p>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {errorMessage && (
                <div className="mx-6 mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800 animate-fade-in">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-sm">Error</p>
                        <p className="text-sm mt-1">{errorMessage}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setErrorMessage('')}
                        className="text-red-400 hover:text-red-600 transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            <div className={`p-6 space-y-8 ${variant === 'modal' ? 'pt-6' : ''}`}>
                {/* 1. Personal & Professional Details */}
                <section>
                    {variant === 'default' && <SectionHeader title="Professional Information" icon={User} id="personal" />}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name *</label>
                            <input name="doctor_name" value={formData.doctor_name} onChange={handleChange} required
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50/50" placeholder="Dr. John Doe" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                            <input name="mobile_number" value={formData.mobile_number} onChange={handleChange} required
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50/50" placeholder="Enter mobile number" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Speciality / Department</label>
                            <input name="speciality_type" value={formData.speciality_type} onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50/50" placeholder="e.g. Cardiology" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Clinic/Hospital Name</label>
                            <input name="clinic_name" value={formData.clinic_name} onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50/50" placeholder="e.g. Sunrise Clinic" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Clinic/Hospital Address</label>
                            <textarea name="address" value={formData.address} onChange={handleChange} rows={2}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50/50" placeholder="Full address" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo</label>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <label className="cursor-pointer px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-600">
                                        <Upload size={16} /> Choose File
                                        <input type="file" name="photo" onChange={handleFileChange} className="hidden" accept="image/*" />
                                    </label>
                                    {files.photo && <span className="text-xs text-green-600 truncate max-w-[150px]">{files.photo.name}</span>}
                                </div>
                                {doctor?.photo_upload_path && !files.photo && (
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                        <CheckCircle2 size={12} className="text-green-500" />
                                        <span>Current: </span>
                                        <a href={`http://localhost:5000/${doctor.photo_upload_path}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-[200px] inline-block align-bottom">
                                            {doctor.photo_upload_path.split(/[\\/]/).pop()}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Clinic/Hospital Photo</label>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <label className="cursor-pointer px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-600">
                                        <Building size={16} /> Choose File
                                        <input type="file" name="clinic_photo" onChange={handleFileChange} className="hidden" accept="image/*" />
                                    </label>
                                    {files.clinic_photo && <span className="text-xs text-green-600 truncate max-w-[150px]">{files.clinic_photo.name}</span>}
                                </div>
                                {doctor?.clinic_photo_path && !files.clinic_photo && (
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                        <CheckCircle2 size={12} className="text-green-500" />
                                        <span>Current: </span>
                                        <a href={`http://localhost:5000/${doctor.clinic_photo_path}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-[200px] inline-block align-bottom">
                                            {doctor.clinic_photo_path.split(/[\\/]/).pop()}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. KYC Details */}
                <section>
                    <SectionHeader title="KYC Compliance" icon={FileText} id="kyc" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Medical Council Number</label>
                            <input name="medical_council_membership_number" value={formData.medical_council_membership_number} onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50/50" placeholder="Registration No." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Medical Council Name</label>
                            <input name="council" value={formData.council} onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50/50" placeholder="e.g. Karnataka Medical Council" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                            <input name="pan_card_number" value={formData.pan_card_number} onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50/50 uppercase" placeholder="ABCDE1234F" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">PAN Document</label>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <label className="cursor-pointer px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-600">
                                        <Upload size={16} /> Upload PAN
                                        <input type="file" name="pan" onChange={handleFileChange} className="hidden" />
                                    </label>
                                    {files.pan && <span className="text-xs text-green-600 truncate max-w-[150px]">{files.pan.name}</span>}
                                </div>
                                {doctor?.pan_upload_path && !files.pan && (
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                        <CheckCircle2 size={12} className="text-green-500" />
                                        <span>Current: </span>
                                        <a href={`http://localhost:5000/${doctor.pan_upload_path}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-[200px] inline-block align-bottom">
                                            {doctor.pan_upload_path.split(/[\\/]/).pop()}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Number</label>
                            <input name="aadhar_card_number" value={formData.aadhar_card_number} onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50/50" placeholder="12-digit number" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Document</label>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <label className="cursor-pointer px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-600">
                                        <Upload size={16} /> Upload Aadhaar
                                        <input type="file" name="aadhar" onChange={handleFileChange} className="hidden" />
                                    </label>
                                    {files.aadhar && <span className="text-xs text-green-600 truncate max-w-[150px]">{files.aadhar.name}</span>}
                                </div>
                                {doctor?.aadhar_upload_path && !files.aadhar && (
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                        <CheckCircle2 size={12} className="text-green-500" />
                                        <span>Current: </span>
                                        <a href={`http://localhost:5000/${doctor.aadhar_upload_path}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-[200px] inline-block align-bottom">
                                            {doctor.aadhar_upload_path.split(/[\\/]/).pop()}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">KYC Document</label>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <label className="cursor-pointer px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-600">
                                        <Upload size={16} /> Upload Document
                                        <input type="file" name="kyc_document" onChange={handleFileChange} className="hidden" />
                                    </label>
                                    {files.kyc_document && <span className="text-xs text-green-600 truncate max-w-[150px]">{files.kyc_document.name}</span>}
                                </div>
                                {doctor?.kyc_upload_path && !files.kyc_document && (
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                        <CheckCircle2 size={12} className="text-green-500" />
                                        <span>Current: </span>
                                        <a href={`http://localhost:5000/${doctor.kyc_upload_path}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-[200px] inline-block align-bottom">
                                            {doctor.kyc_upload_path.split(/[\\/]/).pop()}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. Bank Details */}
                <section>
                    <SectionHeader title="Banking Details" icon={CreditCard} id="bank" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                            <input name="bank_account_number" value={formData.bank_account_number} onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50/50" placeholder="Account Number" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                            <input name="bank_name" value={formData.bank_name} onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50/50" placeholder="Bank Name" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                            <input name="bank_branch" value={formData.bank_branch} onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50/50" placeholder="Branch Name" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                            <input name="bank_ifsc_code" value={formData.bank_ifsc_code} onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50/50 uppercase" placeholder="IFSC Code" />
                        </div>
                        <div className="md:col-span-2 lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Address</label>
                            <input name="bank_address" value={formData.bank_address} onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50/50" placeholder="Full Bank Address" />
                        </div>
                    </div>
                </section>

                {/* 5. Introduction / Referral Source */}
                <section>
                    <SectionHeader title="Source / Introduction" icon={User} id="source" />
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">How were they introduced?</label>
                        <div className="flex gap-4">
                            {['Agent', 'Self', 'Other'].map(type => (
                                <label key={type} className={`flex-1 cursor-pointer border rounded-lg p-3 flex items-center justify-center gap-2 transition ${formData.referral_means === type ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                    <input type="radio" name="referral_means" value={type} checked={formData.referral_means === type} onChange={handleChange} className="hidden" />
                                    <span className="font-medium">{type}</span>
                                </label>
                            ))}
                        </div>

                        {formData.referral_means === 'Agent' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Agent</label>
                                <select name="means_id" value={formData.means_id} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50/50">
                                    <option value="">-- Select Agent --</option>
                                    {agents.map(agent => (
                                        <option key={agent.id} value={agent.id}>{agent.name} - {agent.role}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </section>

                {/* 4. Geolocation (Auto-Captured) - HIDDEN from UI but active in background */}
                {/* Location is captured via useEffect and validated on submit */}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 z-10">
                <button type="button" onClick={onCancel} className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition shadow-sm">
                    Cancel
                </button>
                <button type="submit" disabled={loading} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-70">
                    <Save size={18} />
                    {loading ? 'Saving details...' : 'Save Doctor Details'}
                </button>
            </div>
        </form>
    );
};

export default DoctorForm;
