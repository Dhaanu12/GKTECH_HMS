'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/lib/AuthContext';
import { Loader2, Upload, Building2, User, Mail, Phone, MapPin, Calendar, Bed } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function ProfilePage() {
    const { user } = useAuth();
    const [hospital, setHospital] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        hospital_name: '',
        contact_number: '',
        email: '',
        total_beds: '',
        headquarters_address: ''
    });

    useEffect(() => {
        if (user?.hospital_id) {
            fetchHospitalDetails();
        }
    }, [user]);

    const fetchHospitalDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/hospitals/${user?.hospital_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data.data.hospital;
            setHospital(data);
            setFormData({
                hospital_name: data.hospital_name,
                contact_number: data.contact_number || '',
                email: data.email || '',
                total_beds: data.total_beds || '',
                headquarters_address: data.headquarters_address || ''
            });
        } catch (error) {
            console.error('Error fetching hospital details:', error);
            setMessage({ type: 'error', text: 'Failed to load hospital details' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('token');
            const formDataPayload = new FormData();

            formDataPayload.append('hospital_name', formData.hospital_name);
            formDataPayload.append('contact_number', formData.contact_number);
            formDataPayload.append('email', formData.email);
            formDataPayload.append('total_beds', formData.total_beds);
            formDataPayload.append('headquarters_address', formData.headquarters_address);

            if (logoFile) {
                formDataPayload.append('logo', logoFile);
            }

            await axios.put(`${API_URL}/hospitals/${user?.hospital_id}`, formDataPayload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setMessage({ type: 'success', text: 'Hospital details updated successfully' });
            fetchHospitalDetails(); // Refresh to get new logo url if updated
            setLogoFile(null); // Reset file input
        } catch (error: any) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!hospital) {
        return <div className="text-center py-12 text-gray-500">Hospital details not found</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Hospital Profile</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center overflow-hidden border border-blue-200">
                            {hospital.logo ? (
                                <img
                                    src={`http://localhost:5000/${hospital.logo}`}
                                    alt="Hospital Logo"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Building2 className="w-10 h-10 text-blue-600" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{hospital.hospital_name}</h2>
                            <p className="text-sm text-gray-500 font-medium">{hospital.hospital_code}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                {hospital.hospital_type}
                            </span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {message.text && (
                        <div className={`p-4 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Update Logo</label>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition bg-white">
                                    <Upload className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-600">Choose File</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => e.target.files && setLogoFile(e.target.files[0])}
                                    />
                                </label>
                                {logoFile && <span className="text-sm text-blue-600 font-medium">{logoFile.name}</span>}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Recommended size: 200x200px. Max 5MB.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    value={formData.hospital_name}
                                    onChange={(e) => setFormData({ ...formData, hospital_name: e.target.value })}
                                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            {/* <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="tel"
                                    value={formData.contact_number}
                                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div> */}
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
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Beds</label>
                            <div className="relative">
                                <Bed className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="number"
                                    value={formData.total_beds}
                                    onChange={(e) => setFormData({ ...formData, total_beds: e.target.value })}
                                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Headquarters Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                                <textarea
                                    value={formData.headquarters_address}
                                    onChange={(e) => setFormData({ ...formData, headquarters_address: e.target.value })}
                                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-600 text-white rounded-lg hover:from-blue-700 hover:to-blue-700 transition font-medium shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
