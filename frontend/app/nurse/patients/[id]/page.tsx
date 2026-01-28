'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, Phone, MapPin, Calendar, Clock, Loader2, Activity } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function NursePatientDetails() {
    const params = useParams();
    const router = useRouter();
    const [patient, setPatient] = useState<any>(null);
    const [opdHistory, setOpdHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchPatientDetails();
        }
    }, [params.id]);

    const fetchPatientDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const [patientRes, opdRes] = await Promise.all([
                axios.get(`${API_URL}/patients/${params.id}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/opd/patient/${params.id}`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            setPatient(patientRes.data.data.patient);
            setOpdHistory(opdRes.data.data.opdHistory || []);

        } catch (error) {
            console.error('Error fetching patient details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!patient) {
        return <div className="p-8 text-center text-red-600">Patient not found</div>;
    }

    return (
        <div className="max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Patients
                </button>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            {patient.first_name} {patient.last_name}
                            <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {patient.mrn_number}
                            </span>
                        </h1>
                        <p className="text-gray-600 mt-1">Patient Dashboard</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Patient Info */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-600" />
                            Demographics
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">Age / Gender</label>
                                <p className="text-gray-900 font-medium">{patient.age} Years / {patient.gender}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">Blood Group</label>
                                <p className="text-gray-900 font-medium">{patient.blood_group || 'Not specified'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> Contact
                                </label>
                                <p className="text-gray-900 font-medium">{patient.contact_number}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> Address
                                </label>
                                <p className="text-gray-900 font-medium line-clamp-2">
                                    {patient.address}, {patient.city}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Medical History Summary (if available in patient object) */}
                    {(patient.allergies || patient.medical_history) && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-red-600" />
                                Medical Alerts
                            </h2>
                            <div className="space-y-4">
                                {patient.allergies && (
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Allergies</label>
                                        <p className="text-red-600 font-medium">{patient.allergies}</p>
                                    </div>
                                )}
                                {patient.medical_history && (
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Medical History</label>
                                        <p className="text-gray-700">{patient.medical_history}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - OPD History */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-green-600" />
                                Visit History
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Doctor</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Purpose</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {opdHistory.length > 0 ? (
                                        opdHistory.map((opd) => (
                                            <tr key={opd.opd_id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-900">
                                                            {new Date(opd.visit_date).toLocaleDateString()}
                                                        </span>
                                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" /> {opd.visit_time}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">
                                                        Dr. {opd.doctor_first_name} {opd.doctor_last_name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{opd.specialization}</div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {opd.reason_for_visit}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${opd.visit_status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                            opd.visit_status === 'In-consultation' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {opd.visit_status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-gray-500">
                                                No visit history found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
