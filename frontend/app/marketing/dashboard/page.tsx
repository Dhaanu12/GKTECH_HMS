'use client';

import {
    Users,
    UserPlus,
    Stethoscope,
    Briefcase,
    ArrowRight,
    TrendingUp,
    AlertCircle
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
    team_stats?: {
        team_members: number;
        total_doctors: number;
        total_patients: number;
        total_agents: number;
    };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

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
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // Helper to format data for charts
    const formatChartData = (data: { referral_means: string, count: string }[] | undefined) => {
        if (!data) return [];
        return data.map(item => ({
            name: item.referral_means || 'Unknown',
            value: parseInt(item.count)
        }));
    };

    const doctorChartData = formatChartData(stats?.referral_doctor_distribution);
    const patientChartData = formatChartData(stats?.referral_patient_distribution);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Marketing Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">Overview of your marketing activities</p>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 border border-red-100">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Referral Doctors */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Stethoscope className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-lg">
                            Active
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Referral Doctors</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats?.referral_doctors || 0}</h3>
                    </div>
                </div>

                {/* Referral Patients */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <Users className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-lg">
                            Total
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Referral Patients</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats?.referral_patients || 0}</h3>
                    </div>
                </div>

                {/* Referral Agents */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <Briefcase className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-lg">
                            Network
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Agents</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats?.referral_agents || 0}</h3>
                    </div>
                </div>
            </div>

            {/* Team Performance (Only for Managers) */}
            {stats?.team_stats && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Users className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Team Overview</h2>
                        <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                            {stats.team_stats.team_members} Members
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Team Doctors */}
                        <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl border border-blue-100 shadow-sm">
                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Team Doctors</p>
                            <div className="flex items-baseline gap-2 mt-2">
                                <h3 className="text-2xl font-bold text-gray-900">{stats.team_stats.total_doctors}</h3>
                                <span className="text-xs text-blue-500 font-medium">Total</span>
                            </div>
                        </div>

                        {/* Team Patients */}
                        <div className="bg-gradient-to-br from-purple-50 to-white p-5 rounded-xl border border-purple-100 shadow-sm">
                            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Team Patients</p>
                            <div className="flex items-baseline gap-2 mt-2">
                                <h3 className="text-2xl font-bold text-gray-900">{stats.team_stats.total_patients}</h3>
                                <span className="text-xs text-purple-500 font-medium">Total</span>
                            </div>
                        </div>

                        {/* Team Agents */}
                        <div className="bg-gradient-to-br from-amber-50 to-white p-5 rounded-xl border border-amber-100 shadow-sm">
                            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Team Agents</p>
                            <div className="flex items-baseline gap-2 mt-2">
                                <h3 className="text-2xl font-bold text-gray-900">{stats.team_stats.total_agents}</h3>
                                <span className="text-xs text-amber-500 font-medium">Active</span>
                            </div>
                        </div>

                        {/* Marketing Team */}
                        <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-xl border border-indigo-100 shadow-sm">
                            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Marketing Team</p>
                            <div className="flex items-baseline gap-2 mt-2">
                                <h3 className="text-2xl font-bold text-gray-900">{stats.team_stats.team_members}</h3>
                                <span className="text-xs text-indigo-500 font-medium">Staff</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Charts Section */}
            <div className="space-y-8">
                {/* Manager vs Team Comparison (Only for Managers) */}
                {stats?.team_stats && (
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-800">Performance Comparison</h3>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    <span className="text-gray-600">You</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                                    <span className="text-gray-600">Rest of Team</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={[
                                        {
                                            name: 'Doctors',
                                            Self: stats.referral_doctors,
                                            Team: stats.team_stats.total_doctors - stats.referral_doctors
                                        },
                                        {
                                            name: 'Patients',
                                            Self: stats.referral_patients,
                                            Team: stats.team_stats.total_patients - stats.referral_patients
                                        },
                                        {
                                            name: 'Agents',
                                            Self: stats.referral_agents,
                                            Team: stats.team_stats.total_agents - stats.referral_agents
                                        }
                                    ]}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="Self" name="You" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                                    <Bar dataKey="Team" name="Rest of Team" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}


            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link
                        href="/marketing/doctors/add"
                        className="group bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg shadow-blue-500/20 text-white hover:scale-[1.02] transition-transform"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Stethoscope className="w-6 h-6 text-white" />
                            </div>
                            <ArrowRight className="w-5 h-5 text-blue-100 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Add Doctor</h3>
                            <p className="text-blue-100 text-sm mt-1">Register a new referral doctor</p>
                        </div>
                    </Link>

                    <Link
                        href="/marketing/patients/add"
                        className="group bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl shadow-lg shadow-purple-500/20 text-white hover:scale-[1.02] transition-transform"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                <UserPlus className="w-6 h-6 text-white" />
                            </div>
                            <ArrowRight className="w-5 h-5 text-purple-100 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Add Patient</h3>
                            <p className="text-purple-100 text-sm mt-1">Register a new referral patient</p>
                        </div>
                    </Link>

                    <Link
                        href="/marketing/agents/add"
                        className="group bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-2xl shadow-lg shadow-amber-500/20 text-white hover:scale-[1.02] transition-transform"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Briefcase className="w-6 h-6 text-white" />
                            </div>
                            <ArrowRight className="w-5 h-5 text-amber-100 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Add Agent</h3>
                            <p className="text-amber-100 text-sm mt-1">Register a new referral agent</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
