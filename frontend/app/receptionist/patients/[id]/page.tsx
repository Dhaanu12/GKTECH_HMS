'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { User, Phone, MapPin, Calendar, FileText, Activity, Clock, ArrowLeft, Loader2 } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function PatientDetails() {
    const params = useParams();
    const router = useRouter();
    const [patient, setPatient] = useState<any>(null);
    const [opdHistory, setOpdHistory] = useState<any[]>([]);
    const [consultationHistory, setConsultationHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchPatientDetails();
        }
    }, [params.id]);

    const fetchPatientDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const [patientRes, opdRes, consultRes] = await Promise.all([
                axios.get(`${API_URL}/patients/${params.id}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/opd/patient/${params.id}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/consultations/patient/${params.id}`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            setPatient(patientRes.data.data.patient);
            setOpdHistory(opdRes.data.data.opdHistory || []);
            setConsultationHistory(consultRes.data.data.consultations || []);
        } catch (error) {
            console.error('Error fetching patient details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!patient) {
        return <div>Patient not found</div>;
    }

    return (
        <div className="max-w-6xl mx-auto">
            <button
                onClick={() => router.push('/receptionist/patients')}
                className="flex items-center text-gray-600 hover:text-blue-600 mb-6 transition"
            >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Patients
            </button>

            {/* Patient Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-2xl font-bold">
                            {patient?.first_name?.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{patient?.first_name} {patient?.last_name}</h1>
                            <div className="flex items-center gap-3 text-gray-500 text-sm mt-1">
                                <span className="flex items-center gap-1"><User className="w-3 h-3" /> {patient?.age} Yrs / {patient?.gender}</span>
                                <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {patient?.mrn_number}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-6 border-t border-gray-100">
                    <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Contact</p>
                            <p className="text-gray-900">{patient?.contact_number}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Address</p>
                            <p className="text-gray-900">
                                {[patient?.address, patient?.address_line2, patient?.city, patient?.state, patient?.pincode]
                                    .filter(Boolean)
                                    .join(', ') || 'N/A'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Activity className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Blood Group</p>
                            <p className="text-gray-900">{patient?.blood_group || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* OPD History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        OPD Visit History
                    </h2>
                </div>

                <div className="divide-y divide-gray-200">
                    {opdHistory.length > 0 ? (
                        opdHistory.map((visit) => (
                            <div key={visit.opd_id} className="p-6 hover:bg-gray-50 transition">
                                <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(visit.visit_date).toLocaleDateString()}
                                        <span className="text-gray-300">|</span>
                                        <Clock className="w-4 h-4" />
                                        {visit.visit_time}
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full w-fit">
                                            {visit.visit_type}
                                        </span>
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full w-fit ${visit.visit_status === 'Completed' ? 'bg-green-50 text-green-700' :
                                            visit.visit_status === 'In-consultation' ? 'bg-yellow-50 text-yellow-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                            {visit.visit_status}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Reason & Symptoms</p>
                                        <p className="text-gray-900 font-medium mb-1">{visit.reason_for_visit}</p>
                                        <p className="text-gray-600 text-sm">{visit.symptoms}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Diagnosis & Vitals</p>
                                        <p className="text-gray-900 mb-1">{visit.diagnosis || 'No diagnosis recorded'}</p>
                                        <p className="text-gray-600 text-sm font-mono bg-gray-50 p-2 rounded inline-block">
                                            {visit.vital_signs ? JSON.stringify(visit.vital_signs).replace(/[{"}]/g, '').replace(/,/g, ', ') : 'No vitals'}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
                                    <div className="text-gray-500">
                                        Dr. {visit.doctor_first_name} {visit.doctor_last_name} ({visit.specialization})
                                    </div>
                                    <div className="text-gray-400">
                                        {visit.hospital_name} - {visit.branch_name}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center text-gray-500">
                            <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No OPD visits recorded</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Consultation History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Consultation History
                    </h2>
                </div>

                <div className="divide-y divide-gray-200">
                    {consultationHistory.length > 0 ? (
                        consultationHistory.map((consult) => (
                            <div key={consult.outcome_id} className="p-6 hover:bg-gray-50 transition">
                                <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(consult.created_at).toLocaleDateString()}
                                        <span className="text-gray-300">|</span>
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${consult.consultation_status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {consult.consultation_status}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Dr. {consult.doctor_first_name} {consult.doctor_last_name} ({consult.specialization})
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Diagnosis</p>
                                        <p className="text-gray-900 font-medium mb-3">{consult.diagnosis}</p>

                                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Clinical Notes</p>
                                        <p className="text-gray-600 text-sm">{consult.notes}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Prescription</p>
                                        {(() => {
                                            let meds = consult.prescription_medications;
                                            if (typeof meds === 'string') {
                                                try {
                                                    meds = JSON.parse(meds);
                                                } catch (e) {
                                                    meds = [];
                                                }
                                            }

                                            if (Array.isArray(meds) && meds.length > 0) {
                                                return (
                                                    <div className="space-y-1">
                                                        {meds.map((med: any, idx: number) => (
                                                            <div key={idx} className="text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded">
                                                                {med.name} - {med.dosage} ({med.frequency})
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            } else {
                                                return <p className="text-gray-500 text-sm italic">No medications prescribed</p>;
                                            }
                                        })()}

                                        <div className="mt-4">
                                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Next Visit</p>
                                            <div className="flex gap-2 text-sm">
                                                <span className="font-medium">{consult.next_visit_status}</span>
                                                {consult.next_visit_date && (
                                                    <span className="text-gray-500">on {new Date(consult.next_visit_date).toLocaleDateString()}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No consultation history available</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
