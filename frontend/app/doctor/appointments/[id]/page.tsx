'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, Clock, User, Phone, Mail, FileText, ArrowLeft, Loader2, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function AppointmentDetails() {
    const params = useParams();
    const router = useRouter();
    const [appointment, setAppointment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAppointment = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/appointments/${params.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAppointment(response.data.data.appointment);
            } catch (err) {
                console.error('Error fetching appointment:', err);
                setError('Failed to load appointment details. It may not exist or you do not have permission.');
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchAppointment();
        }
    }, [params.id]);

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!appointment) return <div className="p-8 text-center text-gray-500">Appointment not found</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-blue-600 mb-6 transition"
            >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Schedule
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Appointment Details</h1>
                        <p className="text-sm text-gray-500 mt-1">Reference: {appointment.appointment_number}</p>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${appointment.appointment_status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                        appointment.appointment_status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                            appointment.appointment_status === 'Completed' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        {appointment.appointment_status}
                    </span>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Patient Info */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
                            <User className="w-4 h-4" /> Patient Information
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500">Name</p>
                                <p className="font-semibold text-gray-900 text-lg">
                                    {appointment.patient_first_name ? `${appointment.patient_first_name} ${appointment.patient_last_name}` : appointment.patient_name}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Gender / Age</p>
                                    <p className="font-medium text-gray-900">
                                        {appointment.patient_gender || appointment.gender || '-'} / {appointment.patient_age || appointment.age || '-'} Yrs
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">MRN</p>
                                    <p className="font-medium text-gray-900 font-mono">{appointment.mrn_number || 'Unregistered'}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Contact</p>
                                <div className="space-y-1">
                                    <p className="font-medium text-gray-900 flex items-center gap-2">
                                        <Phone className="w-3 h-3 text-gray-400" />
                                        {appointment.patient_contact || appointment.phone_number || 'N/A'}
                                    </p>
                                    {(appointment.patient_email || appointment.email) && (
                                        <p className="font-medium text-gray-900 flex items-center gap-2">
                                            <Mail className="w-3 h-3 text-gray-400" />
                                            {appointment.patient_email || appointment.email}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Link to Full Profile if Registered */}
                        {appointment.patient_id && (
                            <div className="mt-6">
                                <Link
                                    href={`/doctor/patients/${appointment.patient_id}`}
                                    className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 hover:underline"
                                >
                                    View Full Patient History <ArrowLeft className="w-3 h-3 rotate-180" />
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Appointment Info */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Visit Details
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Date</p>
                                    <p className="font-medium text-gray-900">
                                        {new Date(appointment.appointment_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Time</p>
                                    <p className="font-medium text-gray-900 flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-gray-400" />
                                        {appointment.appointment_time?.slice(0, 5)}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500 mb-1">Doctor</p>
                                <p className="font-medium text-gray-900">
                                    Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}
                                </p>
                                <p className="text-xs text-blue-600">{appointment.specialization}</p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <p className="text-sm text-gray-500 mb-2 font-medium">Reason for Visit</p>
                                <p className="text-gray-900">{appointment.reason_for_visit || 'Not specified'}</p>

                                {appointment.notes && (
                                    <>
                                        <div className="my-3 border-t border-gray-200"></div>
                                        <p className="text-sm text-gray-500 mb-2 font-medium">Notes</p>
                                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{appointment.notes}</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
