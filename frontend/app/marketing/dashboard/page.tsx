'use client';

import {
    Users,
    UserPlus,
    Stethoscope,
    Briefcase,
    ArrowRight,
    TrendingUp,
    AlertCircle,
    Activity,
    Calendar
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/lib/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface DashboardStats {
    referral_doctors: number;
    referral_patients: number;
    referral_agents: number;
    referral_doctor_distribution: { referral_means: string, count: string }[];
    referral_patient_distribution: { referral_means: string, count: string }[];
    referral_doctor_status_distribution: { status: string, count: string }[];
    added_this_month: {
        doctors: number;
        patients: number;
        agents: number;
    };
    team_stats?: {
        team_members: number;
        total_doctors: number;
        total_patients: number;
        total_agents: number;
    };
}

const COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6'];
const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
    'Active': { color: '#10b981', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Active' },
    'Pending': { color: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Pending' },
    'Initialization': { color: '#3b82f6', bg: 'bg-sky-50', border: 'border-sky-200', label: 'Init' },
};

export default function MarketingDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/marketing/dashboard-stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch dashboard stats', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600"></div>
                    </div>
                    <p className="mt-6 text-gray-500 font-medium">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    const statusChartData = (stats?.referral_doctor_status_distribution || []).map(item => ({
        name: item.status || 'Unknown',
        value: parseInt(item.count)
    }));

    const getStatusCount = (status: string) => {
        const found = (stats?.referral_doctor_status_distribution || []).find(s => s.status === status);
        return found ? parseInt(found.count) : 0;
    };

    const totalDoctors = stats?.referral_doctors || 0;
    const monthlyTotal = (stats?.added_this_month?.doctors || 0) + (stats?.added_this_month?.patients || 0) + (stats?.added_this_month?.agents || 0);

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Marketing Dashboard</h1>
                    <p className="mt-1 text-sm text-gray-500">Welcome back! Here&apos;s your performance overview.</p>
                </div>
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">
                        {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    {monthlyTotal > 0 && (
                        <span className="ml-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            +{monthlyTotal} added
                        </span>
                    )}
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 border border-red-100">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {/* Main Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* Referral Doctors */}
                <div className="group bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg shadow-blue-500/15 text-white relative overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="absolute -top-4 -right-4 w-28 h-28 bg-white/10 rounded-full blur-sm"></div>
                    <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-white/5 rounded-full"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-5">
                            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Stethoscope className="w-5 h-5" />
                            </div>
                            {(stats?.added_this_month?.doctors ?? 0) > 0 && (
                                <span className="text-xs font-semibold bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" /> +{stats!.added_this_month.doctors}
                                </span>
                            )}
                        </div>
                        <p className="text-xs font-medium text-blue-100 uppercase tracking-wider">Referral Doctors</p>
                        <h3 className="text-4xl font-extrabold mt-1 tracking-tight">{stats?.referral_doctors || 0}</h3>
                    </div>
                </div>

                {/* Referral Patients */}
                <div className="group bg-gradient-to-br from-violet-600 to-purple-700 p-6 rounded-2xl shadow-lg shadow-purple-500/15 text-white relative overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="absolute -top-4 -right-4 w-28 h-28 bg-white/10 rounded-full blur-sm"></div>
                    <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-white/5 rounded-full"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-5">
                            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Users className="w-5 h-5" />
                            </div>
                            {(stats?.added_this_month?.patients ?? 0) > 0 && (
                                <span className="text-xs font-semibold bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" /> +{stats!.added_this_month.patients}
                                </span>
                            )}
                        </div>
                        <p className="text-xs font-medium text-purple-100 uppercase tracking-wider">Referral Patients</p>
                        <h3 className="text-4xl font-extrabold mt-1 tracking-tight">{stats?.referral_patients || 0}</h3>
                    </div>
                </div>

                {/* Referral Agents */}
                <div className="group bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-2xl shadow-lg shadow-amber-500/15 text-white relative overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="absolute -top-4 -right-4 w-28 h-28 bg-white/10 rounded-full blur-sm"></div>
                    <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-white/5 rounded-full"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-5">
                            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Briefcase className="w-5 h-5" />
                            </div>
                            {(stats?.added_this_month?.agents ?? 0) > 0 && (
                                <span className="text-xs font-semibold bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" /> +{stats!.added_this_month.agents}
                                </span>
                            )}
                        </div>
                        <p className="text-xs font-medium text-amber-100 uppercase tracking-wider">Network Agents</p>
                        <h3 className="text-4xl font-extrabold mt-1 tracking-tight">{stats?.referral_agents || 0}</h3>
                    </div>
                </div>
            </div>

            {/* Doctor Status Analysis Section */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {/* Status Breakdown Cards */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-4 h-4 text-gray-500" />
                        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Doctor Status Analysis</h2>
                    </div>

                    {/* Status mini-cards */}
                    <div className="grid grid-cols-3 gap-3">
                        {(['Active', 'Pending', 'Initialization'] as const).map(status => {
                            const config = STATUS_CONFIG[status];
                            const count = getStatusCount(status);
                            const pct = totalDoctors > 0 ? Math.round((count / totalDoctors) * 100) : 0;
                            return (
                                <div key={status} className={`${config.bg} ${config.border} border rounded-xl p-4 text-center`}>
                                    <div className="text-2xl font-extrabold" style={{ color: config.color }}>{count}</div>
                                    <div className="text-xs font-semibold text-gray-500 mt-1">{config.label}</div>
                                    <div className="mt-2 w-full bg-white rounded-full h-1.5">
                                        <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: config.color }}></div>
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-1">{pct}%</div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Added This Month Summary */}
                    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Added This Month</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="text-center">
                                <div className="text-xl font-bold text-blue-600">{stats?.added_this_month?.doctors || 0}</div>
                                <div className="text-[11px] text-gray-400 font-medium">Doctors</div>
                            </div>
                            <div className="text-center border-x border-gray-100">
                                <div className="text-xl font-bold text-purple-600">{stats?.added_this_month?.patients || 0}</div>
                                <div className="text-[11px] text-gray-400 font-medium">Patients</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xl font-bold text-amber-600">{stats?.added_this_month?.agents || 0}</div>
                                <div className="text-[11px] text-gray-400 font-medium">Agents</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="lg:col-span-3 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Doctor Status Distribution</h3>
                    {statusChartData.length > 0 ? (
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={95}
                                        paddingAngle={4}
                                        dataKey="value"
                                        strokeWidth={2}
                                        stroke="#fff"
                                    >
                                        {statusChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={STATUS_CONFIG[entry.name]?.color || COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '13px' }}
                                        formatter={(value: number, name: string) => [`${value} doctors`, name]}
                                    />
                                    <Legend
                                        iconType="circle"
                                        iconSize={8}
                                        wrapperStyle={{ fontSize: '12px', fontWeight: 500 }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
                            No doctor data available yet
                        </div>
                    )}
                </div>
            </div>

            {/* Team Performance (Only for Managers) */}
            {stats?.team_stats && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Users className="w-4 h-4" />
                        </div>
                        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Team Overview</h2>
                        <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
                            {stats.team_stats.team_members} Members
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Team Doctors', value: stats.team_stats.total_doctors, color: 'blue' },
                            { label: 'Team Patients', value: stats.team_stats.total_patients, color: 'purple' },
                            { label: 'Team Agents', value: stats.team_stats.total_agents, color: 'amber' },
                            { label: 'Marketing Staff', value: stats.team_stats.team_members, color: 'indigo' }
                        ].map((item, i) => (
                            <div key={i} className={`bg-gradient-to-br from-${item.color}-50 to-white p-5 rounded-xl border border-${item.color}-100 shadow-sm`}>
                                <p className={`text-xs font-semibold text-${item.color}-600 uppercase tracking-wide`}>{item.label}</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-2">{item.value}</h3>
                            </div>
                        ))}
                    </div>

                    {/* Performance Bar Chart */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Performance Comparison</h3>
                            <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                                    <span className="text-gray-500 font-medium">You</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                                    <span className="text-gray-500 font-medium">Rest of Team</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={[
                                        { name: 'Doctors', Self: stats.referral_doctors, Team: Math.max(0, stats.team_stats.total_doctors - stats.referral_doctors) },
                                        { name: 'Patients', Self: stats.referral_patients, Team: Math.max(0, stats.team_stats.total_patients - stats.referral_patients) },
                                        { name: 'Agents', Self: stats.referral_agents, Team: Math.max(0, stats.team_stats.total_agents - stats.referral_agents) }
                                    ]}
                                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '13px' }}
                                    />
                                    <Bar dataKey="Self" name="You" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={36} />
                                    <Bar dataKey="Team" name="Rest of Team" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={36} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div>
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        {
                            href: '/marketing/doctors/add',
                            icon: Stethoscope,
                            title: 'Add Doctor',
                            desc: 'Register a new referral doctor',
                            gradient: 'from-blue-600 to-indigo-600',
                            shadow: 'shadow-blue-500/20',
                            hintColor: 'text-blue-200'
                        },
                        {
                            href: '/marketing/patients/add',
                            icon: UserPlus,
                            title: 'Add Patient',
                            desc: 'Register a new referral patient',
                            gradient: 'from-violet-600 to-purple-600',
                            shadow: 'shadow-purple-500/20',
                            hintColor: 'text-purple-200'
                        },
                        {
                            href: '/marketing/agents/add',
                            icon: Briefcase,
                            title: 'Add Agent',
                            desc: 'Register a new referral agent',
                            gradient: 'from-amber-500 to-orange-500',
                            shadow: 'shadow-amber-500/20',
                            hintColor: 'text-amber-200'
                        }
                    ].map((action, i) => (
                        <Link key={i} href={action.href}
                            className={`group bg-gradient-to-br ${action.gradient} p-5 rounded-2xl shadow-lg ${action.shadow} text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200`}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <action.icon className="w-5 h-5" />
                                </div>
                                <ArrowRight className={`w-4 h-4 ${action.hintColor} group-hover:translate-x-1 transition-transform`} />
                            </div>
                            <h3 className="text-base font-bold">{action.title}</h3>
                            <p className={`${action.hintColor} text-xs mt-1`}>{action.desc}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
