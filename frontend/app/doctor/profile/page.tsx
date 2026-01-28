'use client';

import { useAuth } from '@/lib/AuthContext';
import { User, Mail, Phone, Building, Stethoscope, Hash, Award } from 'lucide-react';

export default function DoctorProfile() {
    const { user } = useAuth();

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                <p className="text-gray-600 mt-1">View and manage your personal information</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header Banner */}
                <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-700"></div>

                <div className="px-8 pb-8">
                    {/* Profile Image & Name */}
                    <div className="relative flex justify-between items-end -mt-12 mb-8">
                        <div className="flex items-end gap-6">
                            <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg">
                                <div className=" w-full h-full bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-3xl font-bold">
                                    {user.username?.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div className="mb-1">
                                <h2 className="text-2xl font-bold text-gray-900">{user.username}</h2>
                                <p className="text-blue-600 font-medium flex items-center gap-1">
                                    <Stethoscope className="w-4 h-4" />
                                    {user.specialization || 'General Practitioner'}
                                </p>
                            </div>
                        </div>
                        <div className="mb-1">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {user.is_active ? 'Active Status' : 'Inactive'}
                            </span>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal Information</h3>

                            <div className="flex items-start gap-3">
                                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Full Name</p>
                                    <p className="font-medium text-gray-900">{user.username}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Email Address</p>
                                    <p className="font-medium text-gray-900">{user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Phone Number</p>
                                    <p className="font-medium text-gray-900">{user.phone_number}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Professional Details</h3>

                            <div className="flex items-start gap-3">
                                <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Doctor Code</p>
                                    <p className="font-medium text-gray-900">{user.doctor_code || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Award className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Registration Number</p>
                                    <p className="font-medium text-gray-900">{user.registration_number || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Hospital / Branch</p>
                                    <p className="font-medium text-gray-900">
                                        {user.hospital_name || 'Main Hospital'}
                                        {user.branch_name && ` - ${user.branch_name}`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
