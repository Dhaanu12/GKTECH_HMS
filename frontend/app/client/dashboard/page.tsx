'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import {
    Calendar, Sparkles, Building2, Users, Settings, FileText, TrendingUp, Activity, Zap,
    DollarSign, UserCheck, Clock, AlertCircle, ArrowRight, BarChart3
} from 'lucide-react';
import { AIInsightCard, AILoadingIndicator } from '@/components/ai';
import { getDashboardInsights } from '@/lib/api/ai';

export default function ClientDashboard() {
    const { user } = useAuth();
    const [statsData, setStatsData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [aiInsights, setAiInsights] = useState<string | null>(null);
    const [aiInsightsLoading, setAiInsightsLoading] = useState(false);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/clientadmins/executive-stats`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('Dashboard Stats:', response.data.data);
            setStatsData(response.data.data);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleGenerateInsights = async () => {
        if (!statsData) return;

        setAiInsightsLoading(true);
        setAiInsights(null);

        try {
            const result = await getDashboardInsights({
                totalPatients: statsData.kpi?.total_patients_today || 0,
                revenueMonth: statsData.kpi?.revenue_month || 0,
                diagnosisCount: statsData.diagnoses?.length || 0,
                roleType: 'Client Admin',
                hospitalName: user?.hospital_name || 'Unknown',
                timestamp: new Date().toISOString(),
            });

            if (result.success) {
                setAiInsights(result.message);
            } else {
                setAiInsights(result.message);
            }
        } catch (err: any) {
            setAiInsights('Failed to generate insights. Please try again.');
        } finally {
            setAiInsightsLoading(false);
        }
    };

    // Helper to determine greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="text-center">
                    <div className="relative inline-block">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0 left-0"></div>
                    </div>
                    <p className="mt-4 text-gray-600 font-semibold">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    // Today's KPIs
    const todayKPIs = [
        {
            label: 'Patients Today',
            value: statsData?.kpi?.total_patients_today || 0,
            icon: UserCheck,
            gradient: 'from-blue-500 to-cyan-600',
            bgGradient: 'from-blue-50 to-cyan-50',
            change: null
        },
        {
            label: 'Revenue This Month',
            value: `₹${(statsData?.kpi?.revenue_month || 0).toLocaleString()}`,
            icon: DollarSign,
            gradient: 'from-emerald-500 to-teal-600',
            bgGradient: 'from-emerald-50 to-teal-50',
            change: null
        },
        {
            label: 'Avg per Patient',
            value: `₹${(statsData?.kpi?.avg_revenue_per_patient || 0).toLocaleString()}`,
            icon: TrendingUp,
            gradient: 'from-purple-500 to-pink-600',
            bgGradient: 'from-purple-50 to-pink-50',
            change: null
        },
        {
            label: 'Claim Approval Rate',
            value: `${Math.round((statsData?.kpi?.claim_approval_rate || 0) * 100)}%`,
            icon: AlertCircle,
            gradient: 'from-orange-500 to-red-600',
            bgGradient: 'from-orange-50 to-red-50',
            change: null
        }
    ];

    // Quick Actions
    const quickActions = [
        {
            title: 'View Full Reports',
            description: 'Detailed analytics and insights',
            icon: BarChart3,
            href: '/client/reports',
            gradient: 'from-blue-500 to-indigo-600',
            iconBg: 'from-blue-100 to-indigo-100'
        },
        {
            title: 'Manage Branches',
            description: 'View and configure locations',
            icon: Building2,
            href: '/client/branches',
            gradient: 'from-purple-500 to-pink-600',
            iconBg: 'from-purple-100 to-pink-100'
        },
        {
            title: 'User Management',
            description: 'Staff and permissions',
            icon: Users,
            href: '/client/users',
            gradient: 'from-emerald-500 to-teal-600',
            iconBg: 'from-emerald-100 to-teal-100'
        },
        {
            title: 'Clinic Setup',
            description: 'Configuration and settings',
            icon: Settings,
            href: '/client/clinic-setup',
            gradient: 'from-slate-500 to-gray-600',
            iconBg: 'from-slate-100 to-gray-100'
        }
    ];

    return (
        <div className="space-y-8 pb-12 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header with Smart Greeting */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                        {getGreeting()}, <span className="text-blue-600">{user?.first_name || 'Admin'}</span>
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Here's your executive summary for today.</p>
                </div>

                <div className="text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm self-center md:self-auto flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Today's Key Metrics */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Today's Overview</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>Last updated: {new Date().toLocaleTimeString()}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {todayKPIs.map((kpi, index) => {
                        const Icon = kpi.icon;
                        return (
                            <div
                                key={index}
                                className={`relative overflow-hidden bg-gradient-to-br ${kpi.gradient} rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all transform hover:-translate-y-1`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 bg-white/20 backdrop-blur-md rounded-xl shadow-lg`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white/90 mb-1">{kpi.label}</p>
                                    <p className="text-3xl font-bold text-white">{kpi.value}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* AI Insights */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-lg border border-white/20 p-8">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white shadow-xl">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white">AI Insights</h3>
                                <p className="text-sm text-indigo-100 flex items-center gap-2 mt-1">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                    Smart analysis of your operations
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleGenerateInsights}
                            disabled={aiInsightsLoading}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            <Sparkles className="w-5 h-5" />
                            {aiInsightsLoading ? 'Analyzing...' : 'Generate Insights'}
                        </button>
                    </div>

                    <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-inner min-h-[120px]">
                        {aiInsightsLoading ? (
                            <AILoadingIndicator text="Analyzing today's performance..." />
                        ) : aiInsights ? (
                            <AIInsightCard
                                title="Today's Summary"
                                content={aiInsights}
                                type="info"
                                onDismiss={() => setAiInsights(null)}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
                                    <Sparkles className="w-8 h-8 text-indigo-600" />
                                </div>
                                <h4 className="text-gray-900 font-bold mb-1">Get AI-Powered Insights</h4>
                                <p className="text-gray-600 text-sm max-w-md">
                                    Click "Generate Insights" to get smart recommendations
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
                    <p className="text-sm text-gray-500">Jump to common tasks</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {quickActions.map((action, index) => {
                        const Icon = action.icon;
                        return (
                            <Link
                                key={index}
                                href={action.href}
                                className="group relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-2xl transition-all transform hover:-translate-y-2"
                            >
                                {/* Gradient accent bar */}
                                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${action.gradient}`}></div>

                                <div className="flex flex-col h-full">
                                    <div className={`p-3 bg-gradient-to-br ${action.iconBg} rounded-xl shadow-md mb-4 w-fit group-hover:scale-110 transition-transform`}>
                                        <Icon className="w-6 h-6 text-gray-700" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{action.title}</h3>
                                    <p className="text-sm text-gray-600 mb-4 flex-1">{action.description}</p>
                                    <div className="flex items-center text-sm font-semibold text-gray-700 group-hover:text-gray-900">
                                        <span>Open</span>
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-xl">
                            <Zap className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900">System Status</p>
                            <p className="text-sm text-gray-600">All systems operational</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Live data</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{statsData?.kpi?.total_patients_today || 0} active today</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
