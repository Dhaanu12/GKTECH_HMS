'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/lib/AuthContext';
import { FileText, Users, Calendar, Clock, Activity, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function ReceptionistDashboard() {
    const { user } = useAuth();
    const [statsData, setStatsData] = useState({
        todayOpd: 0,
        newPatients: 0,
        todayAppointments: 0,
        pendingOpd: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:5000/api/opd/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStatsData(response.data.data.stats);
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            }
        };
        fetchStats();
    }, []);

    const stats = [
        {
            title: 'Today\'s OPD Visits',
            value: statsData.todayOpd,
            icon: FileText,
            color: 'from-blue-500 to-blue-600',
            bg: 'bg-blue-50',
            text: 'text-blue-600'
        },
        {
            title: 'New Patients',
            value: statsData.newPatients,
            icon: Users,
            color: 'from-green-500 to-emerald-600',
            bg: 'bg-green-50',
            text: 'text-green-600'
        },
        {
            title: 'Today\'s Appointments',
            value: statsData.todayAppointments,
            icon: Calendar,
            color: 'from-purple-500 to-indigo-600',
            bg: 'bg-purple-50',
            text: 'text-purple-600'
        },
        {
            title: 'Pending Visits',
            value: statsData.pendingOpd,
            icon: Clock,
            color: 'from-amber-400 to-orange-500',
            bg: 'bg-orange-50',
            text: 'text-orange-600'
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header Content */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 font-heading">Welcome back, {user?.first_name || user?.username}</h2>
                    <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-600 bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100 max-w-fit animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
                        <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                        <span>Live Update: <span className="text-indigo-700 font-bold">{statsData.todayOpd} Registrations</span> processed today.</span>
                    </div>
                </div>
                <div className="text-sm font-medium text-slate-400 bg-white/50 px-4 py-2 rounded-full border border-slate-200/50 backdrop-blur-sm">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Stats Grid - "Visionary" Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.title} className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className={`p-3 rounded-xl ${stat.bg} ${stat.text} transition-colors`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className={`text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-500 group-hover:bg-white/80 transition`}>
                                    Today
                                </div>
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-slate-500 text-sm font-semibold mb-1">{stat.title}</h4>
                                <p className="text-3xl font-bold text-slate-800 tracking-tight">{stat.value}</p>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                        <Link href="/receptionist/opd" className="group relative p-6 bg-white/60 hover:bg-white rounded-2xl border border-white/60 hover:border-blue-200 shadow-sm hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                                    <FileText className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-700 transition-colors">New OPD Entry</h3>
                                    <p className="text-slate-500 text-sm mt-0.5">Register patient visit</p>
                                </div>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                    <ArrowRight className="w-5 h-5 text-blue-500" />
                                </div>
                            </div>
                        </Link>

                        <Link href="/receptionist/patients" className="group relative p-6 bg-white/60 hover:bg-white rounded-2xl border border-white/60 hover:border-emerald-200 shadow-sm hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                                    <Users className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">Patient Records</h3>
                                    <p className="text-slate-500 text-sm mt-0.5">Manage details</p>
                                </div>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                    <ArrowRight className="w-5 h-5 text-emerald-500" />
                                </div>
                            </div>
                        </Link>

                        <Link href="/receptionist/appointments" className="group relative p-6 bg-white/60 hover:bg-white rounded-2xl border border-white/60 hover:border-purple-200 shadow-sm hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                                    <Calendar className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-purple-700 transition-colors">Appointments</h3>
                                    <p className="text-slate-500 text-sm mt-0.5">Schedule doctors</p>
                                </div>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                    <ArrowRight className="w-5 h-5 text-purple-500" />
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Background Decoration */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl pointer-events-none"></div>
                </div>

                {/* Right Column: Info/Status (Placeholder for now, can be notifications) */}
                <div className="glass-card p-6 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none"></div>
                    <div className="p-4 bg-orange-100 rounded-full text-orange-600 mb-4 relative z-10">
                        <Activity className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2 relative z-10">System Status</h3>
                    <p className="text-slate-500 text-sm mb-6 relative z-10">All systems are running smoothly. No critical alerts at this time.</p>
                    <div className="w-full bg-slate-100 rounded-xl p-4 text-left relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-slate-500">SERVER LOAD</span>
                            <span className="text-xs font-bold text-green-600">OPTIMAL</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full w-[20%] rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
