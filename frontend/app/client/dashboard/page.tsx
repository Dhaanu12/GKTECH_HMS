// 'use client';

// import { useState, useEffect } from 'react';
// import axios from 'axios';
// import Link from 'next/link';
// import { useAuth } from '@/lib/AuthContext';
// import {
//     Calendar, Sparkles, Building2, Users, Settings, FileText, ArrowRight
// } from 'lucide-react';
// import { AIInsightCard, AILoadingIndicator } from '@/components/ai';
// import { getDashboardInsights } from '@/lib/api/ai';

// // New Dashboard Components
// import { KPIGrid } from '@/components/dashboard/KPIGrid';
// import { RevenueTrendChart, RevenueBreakdownPie } from '@/components/dashboard/RevenueCharts';
// import { TopDiagnosesChart, DiseaseTrendChart } from '@/components/dashboard/ClinicalCharts';
// import { PeakHoursChart, EfficiencyMetrics } from '@/components/dashboard/OperationalCharts';
// import { PatientRetentionChart, HighValuePatientsTable } from '@/components/dashboard/PatientCharts';

// export default function ClientDashboard() {
//     const { user } = useAuth();
//     const [statsData, setStatsData] = useState<any>(null);
//     const [loading, setLoading] = useState(true);

//     // AI insights state
//     const [aiInsights, setAiInsights] = useState<string | null>(null);
//     const [aiInsightsLoading, setAiInsightsLoading] = useState(false);

//     const fetchStats = async () => {
//         try {
//             const token = localStorage.getItem('token');
//             const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/clientadmins/executive-stats`, {
//                 headers: { Authorization: `Bearer ${token}` }
//             });
//             console.log('Dashboard Stats:', response.data.data);
//             setStatsData(response.data.data);
//         } catch (error) {
//             console.error('Error fetching dashboard stats:', error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchStats();
//     }, []);

//     const handleGenerateInsights = async () => {
//         if (!statsData) return;

//         setAiInsightsLoading(true);
//         setAiInsights(null);

//         try {
//             const result = await getDashboardInsights({
//                 totalPatients: statsData.kpi?.total_patients_today || 0,
//                 revenueMonth: statsData.kpi?.revenue_month || 0,
//                 diagnosisCount: statsData.diagnoses?.length || 0,
//                 roleType: 'Client Admin',
//                 hospitalName: user?.hospital_name || 'Unknown',
//                 timestamp: new Date().toISOString(),
//             });

//             if (result.success) {
//                 setAiInsights(result.message);
//             } else {
//                 setAiInsights(result.message);
//             }
//         } catch (err: any) {
//             setAiInsights('Failed to generate insights. Please try again.');
//         } finally {
//             setAiInsightsLoading(false);
//         }
//     };

//     if (loading) {
//         return (
//             <div className="flex items-center justify-center min-h-screen">
//                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//             </div>
//         );
//     }

//     return (
//         <div className="space-y-8 animate-in fade-in duration-500 pb-12">
//             {/* Header with Smart Briefing */}
//             <div className="flex flex-col md:flex-row justify-between items-end gap-4">
//                 <div>
//                     <h1 className="text-2xl font-bold text-slate-800">
//                         Executive Dashboard
//                     </h1>
//                     <p className="text-slate-500 mt-1">Real-time overview of hospital performance.</p>
//                 </div>

//                 <div className="text-sm font-medium text-slate-400 bg-white/50 px-4 py-2 rounded-full border border-slate-200/50 backdrop-blur-sm self-center md:self-auto flex items-center gap-2">
//                     <Calendar className="w-4 h-4" />
//                     {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
//                 </div>
//             </div>

//             {/* ROW 1: Executive KPI Cards */}
//             {statsData && <KPIGrid data={statsData} />}

//             {/* ROW 2: Revenue Intelligence */}
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                 <div className="lg:col-span-2">
//                     {statsData?.revenue_trend && <RevenueTrendChart data={statsData.revenue_trend} />}
//                 </div>
//                 <div>
//                     {statsData?.kpi && <RevenueBreakdownPie revenue={statsData.kpi.revenue_month} breakdown={statsData.revenue_breakdown} />}
//                 </div>
//             </div>

//             {/* ROW 3: Clinical Intelligence */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 {statsData?.diagnoses && <TopDiagnosesChart data={statsData.diagnoses} />}
//                 <DiseaseTrendChart data={[]} /> {/* Placeholder for now as backend returns empty */}
//             </div>

//             {/* ROW 4: Operational Efficiency */}
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                 <div className="lg:col-span-2">
//                     {statsData?.peak_hours && <PeakHoursChart data={statsData.peak_hours} />}
//                 </div>
//                 <div>
//                     <EfficiencyMetrics metrics={statsData?.efficiency} />
//                 </div>
//             </div>

//             {/* ROW 5: Patient Intelligence */}
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                 <div>
//                     {statsData?.retention && <PatientRetentionChart data={statsData.retention} />}
//                 </div>
//                 <div className="lg:col-span-2">
//                     <HighValuePatientsTable data={statsData?.high_value_patients} />
//                 </div>
//             </div>

//             {/* ROW 6: AI Insights Panel */}
//             <div className="grid grid-cols-1 gap-6">
//                 <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
//                     <div className="flex items-center justify-between mb-6">
//                         <div className="flex items-center gap-3">
//                             <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg text-white shadow-lg shadow-indigo-500/30">
//                                 <Sparkles className="w-5 h-5" />
//                             </div>
//                             <div>
//                                 <h3 className="text-lg font-bold text-slate-800">AI Insights</h3>
//                                 <p className="text-xs text-slate-500">Powered by Gemini Pro</p>
//                             </div>
//                         </div>
//                         <button
//                             onClick={handleGenerateInsights}
//                             disabled={aiInsightsLoading}
//                             className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
//                         >
//                             <Sparkles className="w-4 h-4 text-purple-500" />
//                             {aiInsightsLoading ? 'Analyzing...' : 'Generate New'}
//                         </button>
//                     </div>

//                     <div className="bg-white/50 rounded-2xl p-1 border border-white/60 min-h-[150px]">
//                         {aiInsightsLoading ? (
//                             <AILoadingIndicator text="Analyzing hospital metrics and performance data..." />
//                         ) : aiInsights ? (
//                             <AIInsightCard
//                                 title="Executive Summary"
//                                 content={aiInsights}
//                                 type="info"
//                                 onDismiss={() => setAiInsights(null)}
//                             />
//                         ) : (
//                             <div className="flex flex-col items-center justify-center py-10 text-center">
//                                 <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
//                                     <Sparkles className="w-8 h-8 text-indigo-300" />
//                                 </div>
//                                 <h4 className="text-slate-700 font-medium mb-1">No insights generated yet</h4>
//                                 <p className="text-slate-500 text-sm max-w-sm">
//                                     Generate an AI analysis to get a summary of your hospital's performance, resource allocation, and optimization tips.
//                                 </p>
//                                 <button
//                                     onClick={handleGenerateInsights}
//                                     className="mt-4 text-indigo-600 font-medium text-sm hover:underline"
//                                 >
//                                     Generate now &rarr;
//                                 </button>
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>

//             {/* Quick Actions Footer - moved to bottom to not clutter dashboard */}
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
//                 {[
//                     { title: 'Manage Branches', icon: Building2, href: '/client/branches', color: 'blue' },
//                     { title: 'User Management', icon: Users, href: '/client/users', color: 'purple' },
//                     { title: 'Clinic Setup', icon: Settings, href: '/client/clinic-setup', color: 'slate' },
//                     { title: 'View Reports', icon: FileText, href: '/client/reports', color: 'emerald' }
//                 ].map((action) => (
//                     <Link
//                         key={action.title}
//                         href={action.href}
//                         className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all"
//                     >
//                         <div className={`p-2 bg-${action.color}-50 text-${action.color}-600 rounded-lg`}>
//                             <action.icon className="w-5 h-5" />
//                         </div>
//                         <span className="font-semibold text-slate-700 text-sm">{action.title}</span>
//                     </Link>
//                 ))}
//             </div>
//         </div>
//     );
// }


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
        <div className="space-y-8 pb-12 max-w-7xl mx-auto">
            {/* Welcome Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-3xl shadow-2xl p-8">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }}></div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">
                                Welcome back, {user?.first_name || 'Admin'}!
                            </h1>
                            <p className="text-blue-200 text-lg flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                {new Date().toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                        <div className="hidden md:block">
                            <div className="p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
                                <Activity className="w-12 h-12 text-white" />
                            </div>
                        </div>
                    </div>
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
                                className={`relative overflow-hidden bg-gradient-to-br ${kpi.bgGradient} rounded-2xl shadow-lg border border-white p-6 hover:shadow-xl transition-all transform hover:-translate-y-1`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 bg-gradient-to-br ${kpi.gradient} rounded-xl shadow-lg`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">{kpi.label}</p>
                                    <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* AI Insights */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl shadow-lg border border-indigo-200 p-8">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-300/30 to-purple-300/30 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl text-white shadow-xl">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">AI Insights</h3>
                                <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Smart analysis of your operations
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleGenerateInsights}
                            disabled={aiInsightsLoading}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            <Sparkles className="w-5 h-5" />
                            {aiInsightsLoading ? 'Analyzing...' : 'Generate Insights'}
                        </button>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60 shadow-inner min-h-[120px]">
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
                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
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