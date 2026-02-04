'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/lib/AuthContext';
import { Building2, Users, Stethoscope, Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
    const { user } = useAuth();
    const [statsData, setStatsData] = useState({
        hospitals: 0,
        doctors: 0,
        nurses: 0,
        receptionists: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('/api/admin/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStatsData(response.data.data.stats);
            } catch (error) {
                console.error('Error fetching admin dashboard stats:', error);
            }
        };
        fetchStats();
    }, []);

    const stats = [
        { title: 'Total Hospitals', value: statsData.hospitals, color: 'blue', icon: Building2 },
        { title: 'Total Doctors', value: statsData.doctors, color: 'green', icon: Stethoscope },
        { title: 'Total Nurses', value: statsData.nurses, color: 'purple', icon: Users },
        { title: 'Receptionists', value: statsData.receptionists, color: 'orange', icon: Briefcase },
    ];

    return (
        <div className="space-y-8">
            {/* Header Content */}
            <div>
                <h1 className="text-3xl font-heading font-bold text-slate-800">Dashboard</h1>
                <p className="text-slate-500 mt-1">Overview of your hospital network performance.</p>
            </div>

            {/* Welcome Card - Visionary Style */}
            <div className="glass-panel p-8 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                            <span className="text-2xl font-bold">{user?.username?.[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800 font-heading">Welcome back, {user?.username}!</h3>
                            <p className="text-slate-500">Super Admin • <span className="text-green-600 font-medium">● Active Session</span></p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white/40 rounded-2xl p-6 border border-white/40 backdrop-blur-sm">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Role Permission</p>
                            <p className="font-semibold text-slate-700">Full Access (Root)</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email ID</p>
                            <p className="font-semibold text-slate-700">{user?.email || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Last Login</p>
                            <p className="font-semibold text-slate-700">Just Now</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">System Status</p>
                            <p className="font-semibold text-emerald-600 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Operational
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid - Glass Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => {
                    const Icon = stat.icon;
                    // Dynamic Gradients for Icons
                    const gradients = {
                        blue: 'from-blue-500 to-blue-600',
                        green: 'from-emerald-500 to-emerald-600',
                        purple: 'from-violet-500 to-violet-600',
                        orange: 'from-amber-500 to-amber-600'
                    };
                    const shadowColors = {
                        blue: 'shadow-blue-500/30',
                        green: 'shadow-emerald-500/30',
                        purple: 'shadow-violet-500/30',
                        orange: 'shadow-amber-500/30'
                    };

                    return (
                        <div key={stat.title} className="glass-card p-6 rounded-2xl relative group overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 bg-gradient-to-br ${gradients[stat.color as keyof typeof gradients]} rounded-xl flex items-center justify-center text-white shadow-lg ${shadowColors[stat.color as keyof typeof shadowColors]} group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-medium bg-slate-100 px-2 py-1 rounded-full text-slate-500 group-hover:bg-white transition-colors">+12%</span>
                            </div>
                            <h4 className="text-slate-500 text-sm font-medium">{stat.title}</h4>
                            <p className="text-3xl font-bold text-slate-800 mt-1 font-heading group-hover:translate-x-1 transition-transform">{stat.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="glass-panel p-8 rounded-3xl">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Briefcase className="w-5 h-5" /></div>
                    <h3 className="text-xl font-bold text-slate-800">Quick Actions</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Link href="/admin/hospitals" className="group relative p-6 bg-white/60 hover:bg-white rounded-2xl border border-white/60 hover:border-blue-200 shadow-sm hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
                        <div className="flex flex-col gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-700 transition-colors">Add Hospital</h3>
                                <p className="text-slate-500 text-xs mt-1">Register new facility</p>
                            </div>
                        </div>
                    </Link>

                    <Link href="/admin/doctors" className="group relative p-6 bg-white/60 hover:bg-white rounded-2xl border border-white/60 hover:border-green-200 shadow-sm hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300">
                        <div className="flex flex-col gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                                <Stethoscope className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">Add Doctor</h3>
                                <p className="text-slate-500 text-xs mt-1">Onboard medical staff</p>
                            </div>
                        </div>
                    </Link>

                    <Link href="/admin/receptionists" className="group relative p-6 bg-white/60 hover:bg-white rounded-2xl border border-white/60 hover:border-orange-200 shadow-sm hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300">
                        <div className="flex flex-col gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 group-hover:text-orange-700 transition-colors">Add Receptionist</h3>
                                <p className="text-slate-500 text-xs mt-1">Front desk staff</p>
                            </div>
                        </div>
                    </Link>

                    <Link href="/admin/client-admins" className="group relative p-6 bg-white/60 hover:bg-white rounded-2xl border border-white/60 hover:border-purple-200 shadow-sm hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
                        <div className="flex flex-col gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                                <Briefcase className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 group-hover:text-purple-700 transition-colors">Add Client Admin</h3>
                                <p className="text-slate-500 text-xs mt-1">Manage hospital admins</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
