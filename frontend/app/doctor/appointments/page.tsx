'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, User, FileText, Loader2, PlayCircle, ClipboardList, XCircle, Activity, Sparkles, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = 'http://localhost:5000/api';

export default function DoctorAppointments() {
    const [waitingQueue, setWaitingQueue] = useState<any[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [completedConsultations, setCompletedConsultations] = useState<any[]>([]);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [aiInsight, setAiInsight] = useState<string | null>(null);

    useEffect(() => {
        fetchSchedule();
    }, [filterDate]);

    // Simulate AI Insight after data load
    useEffect(() => {
        if (!loading && waitingQueue.length > 5) {
            setAiInsight("You're running about 15 minutes behind schedule. I can notify the next 3 patients to arrive slightly later.");
        } else if (!loading && waitingQueue.length > 0) {
            setAiInsight("Smooth flow detected. You're on track to finish the morning OPD by 1:00 PM.");
        } else {
            setAiInsight(null);
        }
    }, [loading, waitingQueue]);

    const fetchSchedule = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/doctors/schedule?date=${filterDate}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const queue = response.data.data.waitingQueue || [];
            // Sort: MLC first, then by existing order (assuming token/time)
            const sortedQueue = queue.sort((a: any, b: any) => {
                if (a.is_mlc && !b.is_mlc) return -1;
                if (!a.is_mlc && b.is_mlc) return 1;
                return 0;
            });
            setWaitingQueue(sortedQueue);
            setAppointments(response.data.data.appointments || []);
            setCompletedConsultations(response.data.data.completedConsultations || []);
        } catch (error) {
            console.error('Error fetching schedule:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelAppointment = async (appointmentId: number) => {
        if (!confirm('Are you sure you want to cancel this appointment?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_URL}/appointments/${appointmentId}/status`,
                { status: 'Cancelled' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchSchedule();
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            alert('Failed to cancel appointment');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header & Date Picker */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-4xl font-heading font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                        Clinical Cockpit
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">Manage your patient flow and schedule.</p>
                </div>

                <div className="flex items-center gap-4 bg-white/60 p-2 rounded-xl border border-white/60 shadow-sm backdrop-blur-sm">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-2">Schedule For:</span>
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="bg-white/80 border-none rounded-lg text-slate-700 font-semibold focus:ring-2 focus:ring-blue-500/20 shadow-inner px-3 py-1.5"
                    />
                </div>
            </div>

            {/* AI Insight Banner */}
            <AnimatePresence>
                {aiInsight && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass-panel p-4 rounded-xl border-l-4 border-l-indigo-500 flex items-start gap-4 bg-gradient-to-r from-indigo-50/80 to-blue-50/80"
                    >
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 animate-pulse">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        {/* <div>
                            <h3 className="font-bold text-indigo-900 text-sm uppercase tracking-wide">AI Assistant Insight</h3>
                            <p className="text-indigo-800 font-medium mt-1">{aiInsight}</p>
                        </div> */}
                    </motion.div>
                )}
            </AnimatePresence>

            {loading ? (
                <div className="flex justify-center items-center p-24">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: The "Patient Flow Stream" (Waiting Queue) - Span 7 */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-600" />
                                Live Patient Stream (OPD)
                            </h2>
                            <span className="px-3 py-1 bg-blue-100/50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
                                {waitingQueue.length} {new Date(filterDate) < new Date(new Date().toISOString().split('T')[0]) ? 'Waited' : 'Waiting'}
                            </span>
                        </div>

                        {waitingQueue.length > 0 ? (
                            <div className="space-y-4">
                                {waitingQueue.map((visit, index) => {
                                    const isMlc = visit.is_mlc;
                                    return (
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            key={`opd-${visit.opd_id}`}
                                            className={`group relative glass-card p-0 rounded-2xl transition-all duration-300 overflow-hidden 
                                                ${isMlc
                                                    ? 'border border-red-500/50 bg-red-50/10 shadow-lg shadow-red-500/10 hover:shadow-red-500/20'
                                                    : 'border border-white/60 shadow-sm hover:shadow-xl hover:shadow-blue-500/10'
                                                }
                                                ${!isMlc && index === 0 ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-50' : ''}
                                                ${isMlc ? 'ring-2 ring-red-400 ring-offset-2 ring-offset-gray-50' : ''}
                                            `}
                                        >
                                            {/* Status Bar */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isMlc ? 'bg-gradient-to-b from-red-500 to-orange-600 animate-pulse' : 'bg-gradient-to-b from-blue-500 to-indigo-600'}`}></div>

                                            <div className="p-5 pl-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <div className="flex items-center gap-5">
                                                    <div className="relative">
                                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner border 
                                                            ${isMlc ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gradient-to-br from-slate-100 to-white text-slate-700 border-slate-200/50'}`}>
                                                            {visit.token_number}
                                                        </div>
                                                        {index === 0 && !isMlc && filterDate === new Date().toISOString().split('T')[0] && (
                                                            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-bounce">
                                                                NEXT
                                                            </span>
                                                        )}
                                                        {isMlc && (
                                                            <span className="absolute -top-2 -right-4 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-red-500/40 animate-pulse flex items-center gap-1">
                                                                <AlertCircle className="w-3 h-3" /> PRIORITY
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-700 transition-colors">{visit.patient_name}</h3>
                                                            {isMlc && (
                                                                <span className="px-2 py-0.5 bg-red-100/50 text-red-600 text-[10px] font-bold rounded-full border border-red-200 uppercase tracking-wide flex items-center gap-1">
                                                                    MLC
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 font-medium">
                                                            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {visit.age} / {visit.gender}</span>
                                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                            <span className={isMlc ? 'text-red-600 font-bold' : ''}>{visit.visit_type}</span>
                                                        </div>
                                                        {visit.chief_complaint && (
                                                            <p className={`text-sm mt-2 italic px-2 py-1 rounded-md border inline-block ${isMlc ? 'bg-red-50/50 text-red-800 border-red-100' : 'bg-slate-50/50 text-slate-600 border-slate-100'}`}>
                                                                "{visit.chief_complaint}"
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                                                    <Link
                                                        href={`/doctor/patients/${visit.patient_id}`}
                                                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 text-white rounded-xl font-semibold shadow-lg transition-all text-sm hover:-translate-y-0.5
                                                            ${isMlc
                                                                ? 'bg-gradient-to-r from-red-600 to-orange-600 shadow-red-500/30 hover:shadow-red-500/40'
                                                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/30 hover:shadow-blue-500/40'
                                                            }`}
                                                    >
                                                        {new Date(filterDate) < new Date(new Date().toISOString().split('T')[0]) ? (
                                                            <>View <ArrowRight className="w-4 h-4" /></>
                                                        ) : (
                                                            <>Start <ArrowRight className="w-4 h-4" /></>
                                                        )}
                                                    </Link>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="glass-panel p-12 text-center rounded-3xl border-dashed border-2 border-slate-200">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                    <Activity className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-400">Waiting Room Empty</h3>
                                <p className="text-slate-400 text-sm mt-1">Great job! You've cleared the queue.</p>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Upcoming & Completed - Span 5 */}
                    <div className="lg:col-span-5 space-y-8">

                        {/* Upcoming Section */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-purple-600" />
                                Upcoming Schedule
                            </h2>
                            <div className="glass-panel p-2 rounded-2xl bg-white/40 max-h-[400px] overflow-y-auto custom-scrollbar">
                                {appointments.length > 0 ? (
                                    <div className="space-y-2">
                                        {appointments.map((apt) => {
                                            // Precise Date & Time Handling from Database
                                            const apptDateRaw = apt.appointment_date;
                                            // The backend sends a UTC string or Date string. 
                                            // We must respect the intent: "What date is stored in the DB?"
                                            // If apptDateRaw is "2026-02-05T00:00:00.000Z", it means Midnight UTC.
                                            // Converted to local time (IST), this is Feb 5 05:30. So the Local Date IS Feb 5.

                                            // Determine the Local Date Object
                                            let apptDateObj = new Date(filterDate);
                                            if (apptDateRaw) {
                                                apptDateObj = new Date(apptDateRaw);
                                            }

                                            // Construct the exact appointment datetime for comparison
                                            const apptTimeStr = apt.appointment_time; // e.g., "14:30:00"
                                            const [hours, minutes] = apptTimeStr.split(':');

                                            const apptDateTime = new Date(apptDateObj);
                                            apptDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

                                            const now = new Date();

                                            // Check if it is strictly in the past
                                            const isPast = apptDateTime < now;

                                            // Check if it is TODAY (Locally)
                                            const isToday = now.toDateString() === apptDateObj.toDateString();

                                            // Missed Logic
                                            let displayStatus = apt.reason_for_visit || 'General Visit';
                                            let isMissed = false;

                                            if (isToday && isPast && apt.status !== 'Completed' && apt.status !== 'Cancelled') {
                                                displayStatus = 'Missed';
                                                isMissed = true;
                                            }

                                            return (
                                                <div key={`apt-${apt.appointment_id}`} className={`p-4 rounded-xl border transition-colors flex items-center justify-between group 
                                                    ${isMissed ? 'bg-red-50 border-red-100' : 'bg-white/60 border-white/50 hover:bg-white'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg border 
                                                            ${isMissed ? 'bg-red-100 text-red-700 border-red-200' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>
                                                            <span className="text-xs font-bold uppercase">
                                                                {new Date(`2000-01-01T${apt.appointment_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).split(' ')[0]}
                                                            </span>
                                                            <span className={`text-[10px] uppercase ${isMissed ? 'text-red-500' : 'text-purple-400'}`}>
                                                                {new Date(`2000-01-01T${apt.appointment_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).split(' ')[1]}
                                                            </span>
                                                            <span className="text-[9px] font-medium text-slate-500 -mt-0.5 pt-0.5 border-t border-slate-200/50 w-full text-center">
                                                                {apptDateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className={`font-bold text-sm ${isMissed ? 'text-red-800' : 'text-slate-800'}`}>{apt.patient_name}</p>
                                                            <div className="flex items-center gap-2">
                                                                <p className={`text-xs ${isMissed ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                                                                    {displayStatus}
                                                                </p>
                                                                {isMissed && (
                                                                    <span className="flex h-2 w-2 relative">
                                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleCancelAppointment(apt.appointment_id)}
                                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                                            title="Cancel"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                        <Link href={`/doctor/appointments/${apt.appointment_id}`} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition">
                                                            <ArrowRight className="w-4 h-4" />
                                                        </Link>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-slate-400">
                                        <p className="text-sm">No upcoming appointments.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Completed Section (Compact) */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                Completed Today
                            </h2>
                            <div className="glass-card p-4 rounded-2xl bg-gradient-to-br from-green-50/50 to-emerald-50/50 border border-green-100/50">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-medium text-slate-500">Total Patients Seen</span>
                                    <span className="text-2xl font-bold text-green-700">{completedConsultations.length}</span>
                                </div>
                                <div className="space-y-2">
                                    {completedConsultations.slice(0, 3).map((consult) => (
                                        <div key={`comp-${consult.outcome_id}`} className="flex items-center justify-between text-sm py-2 border-b border-green-100 last:border-0">
                                            <span className="font-medium text-slate-700">{consult.patient_name}</span>
                                            <span className="text-xs text-slate-400">{consult.visit_time?.slice(0, 5)}</span>
                                        </div>
                                    ))}
                                </div>
                                {completedConsultations.length > 3 && (
                                    <button className="w-full mt-3 text-xs font-semibold text-green-600 hover:text-green-800 transition">
                                        View All History
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
