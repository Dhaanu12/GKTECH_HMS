'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/lib/AuthContext';
import {
    FileText, Users, Calendar, Clock, Activity, Loader2, ArrowRight, Sparkles,
    ChevronRight, Stethoscope, AlertCircle, DollarSign, UserCheck,
    PlayCircle, ListTodo, CalendarClock, Pill, Bell
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API_URL = 'http://localhost:5000/api';

export default function DoctorDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({
        todayAppointments: 0,
        todayOpd: 0,
        totalPatients: 0,
        consultationsIssued: 0
    });
    const [loading, setLoading] = useState(true);

    // New state for enhanced dashboard
    const [waitingPatients, setWaitingPatients] = useState<any[]>([]);
    const [pendingPrescriptions, setPendingPrescriptions] = useState<any[]>([]);
    const [todayRevenue, setTodayRevenue] = useState(0);
    const [completedToday, setCompletedToday] = useState(0);

    // Follow-up stats for this doctor
    const [followUpStats, setFollowUpStats] = useState<any>({
        overdue_count: 0,
        due_today_count: 0,
        upcoming_week_count: 0
    });
    const [followUpPatients, setFollowUpPatients] = useState<any[]>([]);

    useEffect(() => {
        fetchStats();
        fetchWaitingQueue();
        fetchFollowUpData();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/doctors/dashboard-stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 'success') {
                setStats(response.data.data);
            }
        } catch (error: any) {
            // Silent handling for 401 errors
            if (error.response?.status !== 401) {
                console.error('Error fetching dashboard stats:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    // const fetchWaitingQueue = async () => {
    //     try {
    //         const token = localStorage.getItem('token');
    //         const today = new Date().toISOString().split('T')[0];

    //         // Use the same API as My Appointments page - returns pre-filtered data for this doctor
    //         const response = await axios.get(`${API_URL}/doctors/schedule?date=${today}`, {
    //             headers: { Authorization: `Bearer ${token}` }
    //         });

    //         if (response.data.status === 'success') {
    //             const data = response.data.data;

    //             // Waiting queue from API (already filtered for this doctor)
    //             const queue = data.waitingQueue || [];
    //             // Sort: MLC first, then by token/time
    //             const sortedQueue = queue.sort((a: any, b: any) => {
    //                 if (a.is_mlc && !b.is_mlc) return -1;
    //                 if (!a.is_mlc && b.is_mlc) return 1;
    //                 return 0;
    //             });
    //             setWaitingPatients(sortedQueue);

    //             // Completed today
    //             setCompletedToday((data.completedConsultations || []).length);

    //             // Pending prescriptions = waiting patients that need Rx (approximate)
    //             const inProgress = (data.waitingQueue || []).filter((p: any) =>
    //                 p.visit_status === 'In-consultation'
    //             );
    //             setPendingPrescriptions(inProgress);

    //             // Calculate today's revenue from completed consultations
    //             const revenue = (data.completedConsultations || [])
    //                 .reduce((sum: number, c: any) => sum + (parseFloat(c.consultation_fee) || 0), 0);
    //             setTodayRevenue(revenue);
    //         }
    //     } catch (error) {
    //         console.error('Error fetching waiting queue:', error);
    //     }
    // };

    // // Fetch doctor's pending follow-ups
    // const fetchFollowUpData = async () => {
    //     try {
    //         const token = localStorage.getItem('token');
    //         const [statsRes, dueRes] = await Promise.all([
    //             axios.get(`${API_URL}/follow-ups/stats`, {
    //                 headers: { Authorization: `Bearer ${token}` }
    //             }),
    //             axios.get(`${API_URL}/follow-ups/due?range=all`, {
    //                 headers: { Authorization: `Bearer ${token}` }
    //             })
    //         ]);

    //         if (statsRes.data.status === 'success') {
    //             setFollowUpStats(statsRes.data.data);
    //         }
    //         if (dueRes.data.status === 'success') {
    //             // Combine overdue and due_today for display
    //             const allDue = [
    //                 ...(dueRes.data.data.overdue || []),
    //                 ...(dueRes.data.data.due_today || [])
    //             ].slice(0, 3); // Show top 3
    //             setFollowUpPatients(allDue);
    //         }
    //     } catch (error) {
    //         console.error('Error fetching follow-up data:', error);
    //         // Set default empty values to prevent UI errors
    //         setFollowUpStats({ overdue_count: 0, due_today_count: 0, upcoming_week_count: 0 });
    //         setFollowUpPatients([]);
    //     }
    // };

    // Handle "Next Patient" click - Navigate to first waiting patient
    const fetchWaitingQueue = async () => {
        try {
            const token = localStorage.getItem('token');
            const today = new Date().toISOString().split('T')[0];

            // Use the same API as My Appointments page - returns pre-filtered data for this doctor
            const response = await axios.get(`${API_URL}/doctors/schedule?date=${today}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 'success') {
                const data = response.data.data;

                // Waiting queue from API (already filtered for this doctor)
                const queue = data.waitingQueue || [];
                // Sort: MLC first, then by token/time
                const sortedQueue = queue.sort((a: any, b: any) => {
                    if (a.is_mlc && !b.is_mlc) return -1;
                    if (!a.is_mlc && b.is_mlc) return 1;
                    return 0;
                });
                setWaitingPatients(sortedQueue);

                // Completed today
                setCompletedToday((data.completedConsultations || []).length);

                // Pending prescriptions = waiting patients that need Rx (approximate)
                const inProgress = (data.waitingQueue || []).filter((p: any) =>
                    p.visit_status === 'In-consultation'
                );
                setPendingPrescriptions(inProgress);

                // Calculate today's revenue from completed consultations
                const revenue = (data.completedConsultations || [])
                    .reduce((sum: number, c: any) => sum + (parseFloat(c.consultation_fee) || 0), 0);
                setTodayRevenue(revenue);
            }
        } catch (error: any) {
            // Silent handling for 401 errors
            if (error.response?.status !== 401) {
                console.error('Error fetching waiting queue:', error);
            }
        }
    };

    // Fetch doctor's pending follow-ups
    const fetchFollowUpData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [statsRes, dueRes] = await Promise.all([
                axios.get(`${API_URL}/follow-ups/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/follow-ups/due?range=all`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (statsRes.data.status === 'success') {
                setFollowUpStats(statsRes.data.data);
            }
            if (dueRes.data.status === 'success') {
                // Combine overdue and due_today for display
                const allDue = [
                    ...(dueRes.data.data.overdue || []),
                    ...(dueRes.data.data.due_today || [])
                ].slice(0, 3); // Show top 3
                setFollowUpPatients(allDue);
            }
        } catch (error: any) {
            // Silent handling for 401 errors
            if (error.response?.status !== 401) {
                console.error('Error fetching follow-up data:', error);
            }
        }
    };

    const handleNextPatient = () => {
        if (waitingPatients.length > 0) {
            const nextPatient = waitingPatients[0];
            router.push(`/doctor/patients/${nextPatient.patient_id}`);
        }
    };

    const actionableCards = [
        {
            title: 'Waiting Now',
            value: waitingPatients.length,
            icon: Clock,
            color: 'bg-[#D97706]',
            subLabel: 'Patients in queue',
            action: waitingPatients.length > 0 ? handleNextPatient : undefined,
            actionLabel: 'NEXT →'
        },
        {
            title: 'Completed Today',
            value: completedToday,
            icon: UserCheck,
            color: 'bg-[#009A66]',
            subLabel: 'Consultations done'
        },
        {
            title: 'Pending Rx',
            value: pendingPrescriptions.length,
            icon: Pill,
            color: 'bg-[#D11C5F]',
            subLabel: 'Prescriptions pending',
            urgent: pendingPrescriptions.length > 0
        },
        {
            title: 'Revenue Today',
            value: `₹${todayRevenue.toLocaleString()}`,
            icon: DollarSign,
            color: 'bg-[#146AF5]',
            subLabel: 'Total earnings today'
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header with Smart Briefing */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-100 max-w-fit animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
                    <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
                    <span>
                        {waitingPatients.length > 0
                            ? <>You have <span className="text-amber-600 font-bold">{waitingPatients.length} patients waiting</span>. First patient: <span className="text-blue-700 font-bold">{waitingPatients[0]?.patient_name}</span></>
                            : <>No patients waiting. Your next appointment info will appear here.</>
                        }
                    </span>
                </div>

                <div className="text-sm font-medium text-slate-400 bg-white/50 px-4 py-2 rounded-full border border-slate-200/50 backdrop-blur-sm self-center md:self-auto">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Actionable Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {actionableCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.title}
                            className={`${stat.color} p-6 rounded-[2rem] text-white relative overflow-hidden group hover:-translate-y-2 transition-all duration-300 shadow-xl shadow-slate-200/50 flex flex-col justify-between h-48 ${stat.action ? 'cursor-pointer active:scale-95' : ''}`}
                            onClick={stat.action}
                        >
                            <div className="flex justify-between items-start relative z-10">
                                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl ring-1 ring-white/30 border border-white/20">
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                                    {stat.action && (
                                        <button className="text-[10px] font-black px-3 py-1.5 rounded-full bg-white text-slate-900 shadow-lg transition-all animate-pulse">
                                            {stat.actionLabel}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="relative z-10">
                                <h4 className="text-white/90 text-sm font-semibold mb-1">{stat.title}</h4>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-3xl font-bold tracking-tight">
                                        {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : stat.value}
                                    </p>
                                </div>
                                <p className="text-white/70 text-xs font-medium mt-2">{stat.subLabel}</p>
                            </div>

                            {/* Decorative background shapes */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full -ml-12 -mb-12 blur-2xl pointer-events-none"></div>
                        </div>
                    );
                })}
            </div>

            {/* Main Content: Queue + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Live Patient Queue Panel */}
                <div className="lg:col-span-2 glass-panel p-6 rounded-3xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                                <Users className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">Patient Queue</h2>
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                                {waitingPatients.length} waiting
                            </span>
                        </div>
                        {waitingPatients.length > 0 && (
                            <button
                                onClick={handleNextPatient}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF5E00] to-[#FF21A0] text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-orange-500/30 transition-all hover:-translate-y-0.5"
                            >
                                <PlayCircle className="w-4 h-4" />
                                Start Next
                            </button>
                        )}
                    </div>

                    {waitingPatients.length > 0 ? (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            {waitingPatients.map((patient, index) => {
                                const isMlc = patient.is_mlc;
                                return (
                                    <div
                                        key={patient.opd_id}
                                        onClick={() => router.push(`/doctor/patients/${patient.patient_id}`)}
                                        className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md 
                                            ${isMlc
                                                ? 'bg-red-50/20 border-red-200 shadow-sm'
                                                : index === 0
                                                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm'
                                                    : 'bg-white/60 border-slate-100 hover:bg-white'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm relative 
                                                ${isMlc
                                                    ? 'bg-red-100 text-red-600 border border-red-200 shadow-red-500/20 shadow-lg'
                                                    : index === 0
                                                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {index + 1}
                                                {isMlc && (
                                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 flex items-center gap-2">
                                                    {patient.patient_name}
                                                    {index === 0 && !isMlc && (
                                                        <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                                            NEXT
                                                        </span>
                                                    )}
                                                    {isMlc && (
                                                        <span className="text-[10px] font-extrabold text-white bg-red-600 px-2 py-0.5 rounded-full shadow-lg shadow-red-500/30 animate-pulse">
                                                            PRIORITY
                                                        </span>
                                                    )}
                                                </p>
                                                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                                                    <span>{patient.gender}, {patient.age} yrs</span>
                                                    <span>•</span>
                                                    <span className={isMlc ? 'text-red-600 font-bold' : 'text-amber-600 font-medium'}>
                                                        {patient.chief_complaint?.slice(0, 30) || (isMlc ? 'Emergency' : 'No complaint')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="text-xs text-slate-400">Wait time</p>
                                                <p className={`text-sm font-bold ${isMlc ? 'text-red-700' : 'text-slate-700'}`}>
                                                    {(() => {
                                                        const waitMinutes = Math.floor((Date.now() - new Date(patient.created_at || patient.visit_date).getTime()) / 60000);
                                                        if (waitMinutes >= 60) {
                                                            const hours = Math.floor(waitMinutes / 60);
                                                            const mins = waitMinutes % 60;
                                                            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
                                                        }
                                                        return `${waitMinutes} min`;
                                                    })()}
                                                </p>
                                            </div>
                                            <ChevronRight className={`w-5 h-5 ${isMlc ? 'text-red-300' : 'text-slate-300'}`} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <UserCheck className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 mb-1">No Patients Waiting</h3>
                            <p className="text-slate-500 text-sm">Your queue is clear! New patients will appear here when registered.</p>
                        </div>
                    )}
                </div>

                {/* Quick Actions Sidebar */}
                <div className="space-y-6">
                    {/* Primary Action: Next Patient (prominent) */}
                    {waitingPatients.length > 0 && (
                        <button
                            onClick={handleNextPatient}
                            className="w-full p-6 bg-gradient-to-r from-[#FF5E00] to-[#FF21A0] hover:saturate-150 rounded-2xl text-white shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 transition-all hover:-translate-y-1 group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Stethoscope className="w-7 h-7" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-blue-100 text-xs font-medium uppercase tracking-wider">Next Patient</p>
                                        <p className="text-xl font-bold">{waitingPatients[0]?.patient_name}</p>
                                        <p className="text-blue-200 text-xs">{waitingPatients[0]?.chief_complaint?.slice(0, 25) || 'View details'}</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </button>
                    )}

                    {/* Quick Links */}
                    <div className="glass-card p-5 rounded-2xl">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <Link href="/doctor/patients" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition group">
                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-800">My Patients</p>
                                    <p className="text-xs text-slate-500">View all records</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                            </Link>


                            {/* PRESCRIPTIONS - TEMPORARILY DISABLED 
                            <Link href="/doctor/prescriptions" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition group">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-800">Prescriptions</p>
                                    <p className="text-xs text-slate-500">Create & manage Rx</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                            </Link>
                            */}

                            <Link href="/doctor/appointments" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition group">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-800">Appointments</p>
                                    <p className="text-xs text-slate-500">{stats.todayAppointments} scheduled today</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                            </Link>
                        </div>
                    </div>

                    {/* Pending Follow-ups Widget */}
                    <div className="glass-card p-5 rounded-2xl border border-purple-100 bg-purple-50/30">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Bell className="w-4 h-4 text-purple-600" />
                                <h3 className="text-sm font-bold text-purple-700">Pending Follow-ups</h3>
                            </div>
                            {(followUpStats.overdue_count + followUpStats.due_today_count) > 0 && (
                                <span className="px-2 py-0.5 bg-purple-500 text-white text-xs font-bold rounded-full">
                                    {followUpStats.overdue_count + followUpStats.due_today_count}
                                </span>
                            )}
                        </div>

                        {followUpPatients.length > 0 ? (
                            <div className="space-y-2 mb-3">
                                {followUpPatients.map((fu: any) => (
                                    <Link
                                        key={fu.outcome_id}
                                        href={`/doctor/patients/${fu.patient_id}`}
                                        className={`flex items-center gap-3 p-2 rounded-lg transition ${fu.follow_up_status === 'overdue' ? 'bg-red-50 hover:bg-red-100' : 'bg-green-50 hover:bg-green-100'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${fu.follow_up_status === 'overdue' ? 'bg-red-200 text-red-700' : 'bg-green-200 text-green-700'}`}>
                                            {fu.patient_first_name?.[0]}{fu.patient_last_name?.[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-800 text-sm truncate">
                                                {fu.patient_first_name} {fu.patient_last_name}
                                            </p>
                                            <p className={`text-xs font-medium ${fu.follow_up_status === 'overdue' ? 'text-red-600' : 'text-green-600'}`}>
                                                {fu.follow_up_status === 'overdue' ? `${fu.days_overdue} days overdue` : 'Due today'}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-sm mb-3">
                                No patients due for follow-up this week.
                            </p>
                        )}

                        {(followUpStats.overdue_count + followUpStats.due_today_count) > 3 && (
                            <Link href="/doctor/patients" className="text-purple-600 text-sm font-bold hover:underline">
                                View All ({followUpStats.overdue_count + followUpStats.due_today_count}) →
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
