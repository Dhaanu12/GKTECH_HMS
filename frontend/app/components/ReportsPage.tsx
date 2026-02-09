import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Calendar, Filter, Users, IndianRupee, FileText, Activity, TrendingUp, Sparkles, Download } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface AnalyticsData {
    summary: {
        total_opd_visits: string;
        total_mlc: string;
        total_revenue: string;
        unique_patients: string;
    };
    doctorStats: Array<{
        first_name: string;
        last_name: string;
        specialization: string;
        patient_count: string;
        revenue_generated: string;
    }>;
    deptStats: Array<{
        department_name: string;
        patient_count: string;
    }>;
    trends: Array<{
        period_label: string;
        count: string;
    }>;
}

export default function ReportsPage() {
    const { user } = useAuth();
    const [dateRange, setDateRange] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');

            // Determine API endpoint based on user role
            let apiEndpoint = '/api/clientadmins/analytics';
            if (user?.role_code === 'DOCTOR') {
                apiEndpoint = '/api/doctors/analytics';
            }

            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${apiEndpoint}`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate
                }
            });
            setData(response.data.data);
        } catch (err) {
            console.error('Error fetching analytics:', err);
            setError('Failed to load analytics data.');
        } finally {
            setLoading(false);
        }
    }, [dateRange, user?.role_code]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDateRange(prev => ({ ...prev, [name]: value }));
    };

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center p-24">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                    <Activity className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Analytics Unavailable</h3>
                <p className="text-slate-500 mt-2">{error}</p>
            </div>
        );
    }

    // Process data for charts
    const doctorData = (data?.doctorStats || []).map(doc => ({
        name: `Dr. ${doc.first_name} ${doc.last_name}`,
        patients: parseInt(doc.patient_count),
        revenue: parseFloat(doc.revenue_generated)
    }));

    const trendData = (data?.trends || []).map(t => ({
        name: t.period_label,
        visits: parseInt(t.count)
    }));

    const deptData = (data?.deptStats || []).map(d => ({
        name: d.department_name,
        value: parseInt(d.patient_count)
    }));

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <h1 className="text-4xl font-heading font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                        Analytics & Reports
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">Real-time insights on your practice performance.</p>
                </div>

                <div className="flex items-center gap-4 bg-white/60 p-2 rounded-xl border border-white/60 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-2 px-2 text-slate-500 font-medium">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wider font-bold">Range</span>
                    </div>
                    <input
                        type="date"
                        name="startDate"
                        value={dateRange.startDate}
                        onChange={handleDateChange}
                        className="bg-white/80 border-none rounded-lg text-slate-700 font-semibold focus:ring-2 focus:ring-blue-500/20 shadow-inner px-3 py-1.5 text-sm"
                    />
                    <span className="text-slate-300">|</span>
                    <input
                        type="date"
                        name="endDate"
                        value={dateRange.endDate}
                        onChange={handleDateChange}
                        className="bg-white/80 border-none rounded-lg text-slate-700 font-semibold focus:ring-2 focus:ring-blue-500/20 shadow-inner px-3 py-1.5 text-sm"
                    />
                    <button className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition" title="Refresh">
                        <Filter className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Smart Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total OPD Visits"
                    value={data?.summary.total_opd_visits || '0'}
                    icon={Users}
                    color="blue"
                    trend="+12% vs last week"
                />
                <StatCard
                    title="Revenue Generated"
                    value={`₹${parseFloat(data?.summary.total_revenue || '0').toLocaleString()}`}
                    icon={IndianRupee}
                    color="green"
                    trend="On Track"
                />
                <StatCard
                    title="MLC Cases"
                    value={data?.summary.total_mlc || '0'}
                    icon={FileText}
                    color="red"
                    subtext="Requires Legal Review"
                />
                <StatCard
                    title="Unique Patients"
                    value={data?.summary.unique_patients || '0'}
                    icon={Sparkles}
                    color="purple"
                    trend="High Retention"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Visit Trends (Area Chart) */}
                <div className="glass-panel p-6 rounded-3xl border border-white/60">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                            Visit Trends
                        </h3>
                        <button className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition">
                            Details
                        </button>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200,200,200,0.2)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="visits" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Department Distribution (Pie Chart) */}
                <div className="glass-panel p-6 rounded-3xl border border-white/60">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Department Share</h3>
                        <button className="p-2 text-slate-400 hover:text-slate-600 transition">
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={deptData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {deptData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                />
                                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ paddingLeft: '20px' }} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Doctor Performance (Bar Chart) - Full Width on large screens, only show if NOT Doctor Role (to avoid self-comparison anxiety in a personal view, or keep it?) -> Let's keep it as it's useful */}
                <div className="glass-panel p-6 rounded-3xl border border-white/60 lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Performance Overview</h3>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={doctorData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200,200,200,0.2)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" axisLine={false} tickLine={false} hide />
                                <YAxis yAxisId="right" orientation="right" stroke="#10b981" axisLine={false} tickLine={false} hide />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                />
                                <Legend />
                                <Bar yAxisId="left" dataKey="patients" name="Patients Handled" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={50} />
                                <Bar yAxisId="right" dataKey="revenue" name="Revenue (₹)" fill="#10b981" radius={[6, 6, 0, 0]} barSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, subtext, trend }: { title: string, value: string | number, icon: any, color: string, subtext?: string, trend?: string }) {
    const colorClasses: Record<string, string> = {
        blue: 'from-blue-500 to-blue-600 shadow-blue-500/30',
        green: 'from-emerald-500 to-teal-600 shadow-emerald-500/30',
        red: 'from-red-500 to-pink-600 shadow-red-500/30',
        purple: 'from-purple-500 to-indigo-600 shadow-purple-500/30',
        orange: 'from-orange-400 to-red-500 shadow-orange-500/30'
    };

    const bgClasses: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-emerald-50 text-emerald-600',
        red: 'bg-red-50 text-red-600',
        purple: 'bg-indigo-50 text-indigo-600',
        orange: 'bg-orange-50 text-orange-600'
    };

    return (
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-3 rounded-xl ${bgClasses[color]} transition-colors`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <div className={`text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100/80 text-slate-500`}>
                        {trend}
                    </div>
                )}
            </div>

            <div className="relative z-10">
                <h4 className="text-slate-500 text-sm font-semibold mb-1">{title}</h4>
                <p className="text-3xl font-bold text-slate-800 tracking-tight">{value}</p>
                {subtext && <p className="text-xs text-slate-400 mt-2 font-medium">{subtext}</p>}
            </div>

            {/* Decorative Background */}
            <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-br ${colorClasses[color]} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-500`}></div>
        </div>
    );
}
