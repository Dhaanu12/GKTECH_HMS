'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/lib/AuthContext';
import { FileText, Users, Calendar, Clock, Activity, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

const API_URL = 'http://localhost:5000/api';

export default function DoctorDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        todayAppointments: 0,
        todayOpd: 0,
        totalPatients: 0,
        consultationsIssued: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
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
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: 'Today\'s Appointments',
            value: stats.todayAppointments,
            icon: Calendar,
            color: 'from-blue-500 to-blue-600',
            bg: 'bg-blue-50',
            text: 'text-blue-600'
        },
        {
            title: 'OPD Consultations',
            value: stats.todayOpd,
            icon: Clock,
            color: 'from-orange-400 to-orange-500',
            bg: 'bg-orange-50',
            text: 'text-orange-600'
        },
        {
            title: 'Total Patients',
            value: stats.totalPatients,
            icon: Users,
            color: 'from-green-500 to-emerald-600',
            bg: 'bg-green-50',
            text: 'text-green-600'
        },
        {
            title: 'Total OPD Visits',
            value: stats.consultationsIssued,
            icon: FileText,
            color: 'from-purple-500 to-indigo-600',
            bg: 'bg-purple-50',
            text: 'text-purple-600'
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header Content */}
            {/* Smart Briefing */}
            {/* Header Content */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                {/* Smart Briefing */}
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-100 max-w-fit animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
                    <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
                    <span>AI Insight: You have <span className="text-blue-700 font-bold">{stats.todayAppointments} appointments</span> today. 2 slot gaps available in the afternoon.</span>
                </div>

                <div className="text-sm font-medium text-slate-400 bg-white/50 px-4 py-2 rounded-full border border-slate-200/50 backdrop-blur-sm self-center md:self-auto">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Stats Grid - "Visionary" Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.title} className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className={`p-3 rounded-xl ${stat.bg} ${stat.text} transition-colors`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className={`text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-500 group-hover:bg-white/80 transition`}>
                                    Stats
                                </div>
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-slate-500 text-sm font-semibold mb-1">{stat.title}</h4>
                                <p className="text-3xl font-bold text-slate-800 tracking-tight">
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : stat.value}
                                </p>
                            </div>
                            {/* Decorative Background */}
                            <div className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-gradient-to-br ${stat.color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-500`}></div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quick Actions Panel */}
                <div className="lg:col-span-2 glass-panel p-8 rounded-3xl relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">Quick Actions</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                        <Link href="/doctor/prescriptions" className="group relative p-6 bg-white/60 hover:bg-white rounded-2xl border border-white/60 hover:border-blue-200 shadow-sm hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
                            <div className="flex flex-col items-start gap-4 h-full">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-700 transition-colors">Prescriptions</h3>
                                    <p className="text-slate-500 text-xs mt-1">Create & manage Rx</p>
                                </div>
                                <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                    <ArrowRight className="w-5 h-5 text-blue-500" />
                                </div>
                            </div>
                        </Link>

                        <Link href="/doctor/appointments" className="group relative p-6 bg-white/60 hover:bg-white rounded-2xl border border-white/60 hover:border-purple-200 shadow-sm hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
                            <div className="flex flex-col items-start gap-4 h-full">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-purple-700 transition-colors">Appointments</h3>
                                    <p className="text-slate-500 text-xs mt-1">View Schedule</p>
                                </div>
                                <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                    <ArrowRight className="w-5 h-5 text-purple-500" />
                                </div>
                            </div>
                        </Link>

                        <Link href="/doctor/patients" className="group relative p-6 bg-white/60 hover:bg-white rounded-2xl border border-white/60 hover:border-emerald-200 shadow-sm hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
                            <div className="flex flex-col items-start gap-4 h-full">
                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">My Patients</h3>
                                    <p className="text-slate-500 text-xs mt-1">Medical Records</p>
                                </div>
                                <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                    <ArrowRight className="w-5 h-5 text-emerald-500" />
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Right Column: Mini Schedule or Status */}
                <div className="glass-card p-6 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none"></div>
                    <div className="p-4 bg-blue-100 rounded-full text-blue-600 mb-4 relative z-10">
                        <Activity className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2 relative z-10">AI Assistance</h3>
                    <p className="text-slate-500 text-sm mb-6 relative z-10">Your AI Clinical Scribe is active and ready to assist with today's consultations.</p>
                    <button className="px-6 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition relative z-10">
                        View Settings
                    </button>
                </div>
            </div>
        </div >
    );
}
