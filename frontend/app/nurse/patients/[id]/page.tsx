'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    User,
    Phone,
    MapPin,
    Calendar,
    Clock,
    Loader2,
    Activity,
    HeartPulse,
    FileText,
    TestTube,
    AlertTriangle,
    Thermometer,
    Wind,
    Droplets,
    Stethoscope,
    History
} from 'lucide-react';

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
            <div className="flex justify-center items-center h-screen bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50 gap-4">
                <div className="p-4 bg-white rounded-full shadow-sm">
                    <User className="w-8 h-8 text-slate-400" />
                </div>
                <div className="text-lg font-bold text-slate-800">Patient not found</div>
                <button
                    onClick={() => router.back()}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                >
                    Back to Directory
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-12 animate-in fade-in duration-500">
            {/* Top Navigation Bar */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.back()}
                    className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-500"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-slate-800 font-heading">Patient Dashboard</h1>
                    <p className="text-xs text-slate-500 font-medium">Viewing Record: {patient.mrn_number}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* --- LEFT SIDEBAR (Sticky) --- */}
                <div className="lg:col-span-4 xl:col-span-3 space-y-6">
                    {/* Identity Card */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 sticky top-6">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-28 h-28 rounded-full bg-slate-100 flex items-center justify-center text-4xl font-bold text-slate-700 mb-4 border-4 border-white shadow-lg shadow-slate-200">
                                {patient.first_name.charAt(0)}
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 font-heading">
                                {patient.first_name} {patient.last_name}
                            </h2>
                            <span className="mt-2 px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider rounded-full">
                                Admitted
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-6 border-t border-b border-slate-100 mb-6">
                            <div className="text-center">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Age</p>
                                <p className="font-bold text-slate-700">{patient.age}</p>
                            </div>
                            <div className="text-center border-l border-r border-slate-100">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Sex</p>
                                <p className="font-bold text-slate-700">{patient.gender === 'Male' ? 'M' : 'F'}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Blood</p>
                                <p className="font-bold text-slate-700">{patient.blood_group || '-'}</p>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <span className="font-medium text-slate-600">{patient.contact_number}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <span className="font-medium text-slate-600 truncate">{patient.city}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                                <Activity className="w-4 h-4" /> Record Vitals
                            </button>
                            <button className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                                <FileText className="w-4 h-4" /> Clinical Notes
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT CONTENT STREAM --- */}
                <div className="lg:col-span-8 xl:col-span-9 space-y-6">

                    {/* Alerts Banner */}
                    {(patient.allergies || patient.medical_history) && (
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-4">
                            <div className="p-2 bg-red-100 rounded-lg text-red-600 shrink-0">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-red-900 font-bold text-lg mb-1">Medical Alerts</h3>
                                {patient.allergies && (
                                    <p className="text-red-700 text-sm mb-1"><span className="font-bold">Allergies:</span> {patient.allergies}</p>
                                )}
                                {patient.medical_history && (
                                    <p className="text-red-700 text-sm"><span className="font-bold">History:</span> {patient.medical_history}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Vitals HUD Grid (Mock Data) */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4" /> Latest Vitals (Today, 10:00 AM)
                        </h3>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Heart Rate', value: '72', unit: 'bpm', icon: HeartPulse, color: 'text-rose-500', bg: 'bg-rose-50' },
                                { label: 'Blood Pressure', value: '120/80', unit: 'mmHg', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
                                { label: 'Oxygen Sat.', value: '98', unit: '%', icon: Wind, color: 'text-cyan-500', bg: 'bg-cyan-50' },
                                { label: 'Temperature', value: '36.6', unit: '°C', icon: Thermometer, color: 'text-amber-500', bg: 'bg-amber-50' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                                        <p className="text-2xl font-bold text-slate-800">{stat.value} <span className="text-xs text-slate-400 font-medium">{stat.unit}</span></p>
                                    </div>
                                    <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Clinical Journey (Visit History) */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <History className="w-4 h-4" /> Clinical Journey
                            </h3>
                            <button className="text-blue-600 text-xs font-bold hover:underline">View All History</button>
                        </div>

                        <div className="space-y-4">
                            {opdHistory.length > 0 ? (
                                opdHistory.map((opd) => (
                                    <div key={opd.opd_id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-blue-300 transition-colors group">
                                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-3">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-100 text-center leading-tight">
                                                    {new Date(opd.visit_date).getDate()}
                                                    <span className="block text-[8px] uppercase">{new Date(opd.visit_date).toLocaleString('default', { month: 'short' })}</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">
                                                        {opd.specialization || 'Consultation'}
                                                    </h4>
                                                    <p className="text-sm text-slate-500 font-medium flex items-center gap-1">
                                                        <Stethoscope className="w-3 h-3" /> Dr. {opd.doctor_first_name} {opd.doctor_last_name}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${opd.visit_status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                                {opd.visit_status}
                                            </span>
                                        </div>
                                        <div className="pl-0 md:pl-16">
                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600">
                                                <span className="font-bold text-slate-800 mr-2">Notes:</span>
                                                {opd.reason_for_visit}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                                    <p className="text-slate-400 font-medium">No clinical history recorded.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
