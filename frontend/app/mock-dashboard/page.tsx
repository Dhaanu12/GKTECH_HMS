'use client';

import React, { useState } from 'react';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    ComposedChart
} from 'recharts';
import {
    LayoutDashboard, Building2, Stethoscope, IndianRupee,
    Calendar, Users, TrendingUp, AlertTriangle, Activity,
    Clock, Search, Bell, Menu, Download, Filter, ChevronDown,
    ShieldCheck, UserPlus, FileText, CheckCircle, XCircle
} from 'lucide-react';

// --- MOCK DATA ---

const REVENUE_DATA = [
    { name: 'Jan', revenue: 40000, insurance: 24000, cash: 16000 },
    { name: 'Feb', revenue: 30000, insurance: 13980, cash: 16020 },
    { name: 'Mar', revenue: 20000, insurance: 9800, cash: 10200 },
    { name: 'Apr', revenue: 27800, insurance: 19080, cash: 8720 },
    { name: 'May', revenue: 18900, insurance: 14800, cash: 4100 },
    { name: 'Jun', revenue: 23900, insurance: 18000, cash: 5900 },
    { name: 'Jul', revenue: 34900, insurance: 23000, cash: 11900 },
];

const REVENUE_BREAKDOWN = [
    { name: 'Consultation', value: 45, color: '#3b82f6' },
    { name: 'Lab', value: 30, color: '#10b981' },
    { name: 'Procedures', value: 15, color: '#f59e0b' },
    { name: 'Insurance', value: 10, color: '#6366f1' },
];

const DIAGNOSIS_DATA = [
    { name: 'Hypertension', count: 120 },
    { name: 'Diabetes', count: 98 },
    { name: 'Viral Fever', count: 86 },
    { name: 'Migraine', count: 54 },
    { name: 'Gastritis', count: 42 },
];

const DISEASE_TREND = [
    { name: 'W1', cases: 40 },
    { name: 'W2', cases: 30 },
    { name: 'W3', cases: 60 },
    { name: 'W4', cases: 45 },
];

const PATIENT_RETENTION = [
    { name: 'Returning', value: 65, color: '#3b82f6' },
    { name: 'New', value: 35, color: '#e2e8f0' },
];

const HOURLY_PATIENTS = [
    { time: '9AM', patients: 12 },
    { time: '10AM', patients: 25 },
    { time: '11AM', patients: 32 },
    { time: '12PM', patients: 28 },
    { time: '1PM', patients: 15 },
    { time: '2PM', patients: 20 },
    { time: '3PM', patients: 22 },
    { time: '4PM', patients: 18 },
    { time: '5PM', patients: 10 },
];

const DOCTOR_HEATMAP = [
    { doctor: 'Dr. Smith', t9: 4, t10: 5, t11: 5, t12: 3, t1: 1, t2: 4, t3: 4, t4: 3 },
    { doctor: 'Dr. Jane', t9: 2, t10: 4, t11: 4, t12: 5, t1: 2, t2: 3, t3: 5, t4: 4 },
    { doctor: 'Dr. Mike', t9: 5, t10: 5, t11: 3, t12: 2, t1: 0, t2: 2, t3: 3, t4: 2 },
];

// --- COMPONENTS ---

const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-100 p-5 ${className}`}>
        {children}
    </div>
);

const KPICard = ({ title, value, subtext, trend, color = 'blue' }: any) => {
    const colors: any = {
        green: 'text-emerald-600 bg-emerald-50',
        blue: 'text-blue-600 bg-blue-50',
        red: 'text-rose-600 bg-rose-50',
        yellow: 'text-amber-600 bg-amber-50',
    };

    return (
        <Card>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
                </div>
                <div className={`p-2 rounded-lg ${colors[color]}`}>
                    <Activity className="w-5 h-5" />
                </div>
            </div>
            {(subtext || trend) && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                    {trend && (
                        <span className={`font-semibold ${trend > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {trend > 0 ? '+' : ''}{trend}%
                        </span>
                    )}
                    <span className="text-slate-400">{subtext}</span>
                </div>
            )}
        </Card>
    );
};

const SectionHeader = ({ title, icon: Icon }: any) => (
    <div className="flex items-center gap-2 mb-4 mt-8">
        <div className="p-1.5 bg-blue-100 rounded-md text-blue-700">
            <Icon className="w-4 h-4" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
    </div>
);

// --- DASHBOARD VIEWS ---

const ClientAdminView = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
        {/* ROW 1: Executive KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <KPICard title="Total Patients" value="142" subtext="Today" trend={12} color="blue" />
            <KPICard title="Total Revenue" value="₹2.4L" subtext="Month" trend={8.5} color="green" />
            <KPICard title="Avg/Patient" value="₹850" subtext="Revenue" color="blue" />
            <KPICard title="Claim Approval" value="92%" subtext="Insurance" trend={2} color="green" />
            <KPICard title="Retention" value="68%" subtext="Returning" color="yellow" />
            <KPICard title="Avg Wait Time" value="18m" subtext="-2m vs last week" color="yellow" />
        </div>

        {/* ROW 2: Revenue Intelligence */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
                <SectionHeader title="Revenue Trend" icon={TrendingUp} />
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={REVENUE_DATA}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>
            <Card>
                <SectionHeader title="Revenue Breakdown" icon={PieChart} />
                <div className="h-48 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={REVENUE_BREAKDOWN}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {REVENUE_BREAKDOWN.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                        <span className="text-2xl font-bold text-slate-800">₹2.4L</span>
                        <span className="text-xs text-slate-400">Total</span>
                    </div>
                </div>
                <div className="mt-4 space-y-2">
                    {REVENUE_BREAKDOWN.map(item => (
                        <div key={item.name} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-slate-600">{item.name}</span>
                            </div>
                            <span className="font-semibold text-slate-800">{item.value}%</span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>

        {/* ROW 3: Clinical Intelligence */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <SectionHeader title="Top Diagnoses" icon={Stethoscope} />
                    <select className="text-xs bg-slate-50 border-none rounded-md px-2 py-1 text-slate-600 outline-none">
                        <option>All Ages</option>
                        <option>Pediatric</option>
                        <option>Adult</option>
                        <option>Geriatric</option>
                    </select>
                </div>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={DIAGNOSIS_DATA}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
            <Card>
                <SectionHeader title="Disease Trend (Seasonal)" icon={Activity} />
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={DISEASE_TREND}>
                            <defs>
                                <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip />
                            <Area type="bump" dataKey="cases" stroke="#f59e0b" strokeWidth={3} fill="url(#colorCases)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>

        {/* ROW 4: Operational Efficiency */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
                <SectionHeader title="Peak Hour Analysis" icon={Clock} />
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={HOURLY_PATIENTS}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip />
                            <Bar dataKey="patients" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
            <Card>
                <SectionHeader title="Efficiency Metrics" icon={TrendingUp} />
                <div className="space-y-6 mt-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-500">Avg Consultation Time</p>
                        <div className="flex justify-between items-end">
                            <h3 className="text-2xl font-bold text-slate-800">12m 30s</h3>
                            <span className="text-xs text-emerald-600 font-medium bg-emerald-100 px-2 py-0.5 rounded">-10% vs target</span>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-500">Patients / Doctor / Day</p>
                        <div className="flex justify-between items-end">
                            <h3 className="text-2xl font-bold text-slate-800">24</h3>
                            <span className="text-xs text-amber-600 font-medium bg-amber-100 px-2 py-0.5 rounded">High Load</span>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-500">Idle Hours</p>
                        <div className="flex justify-between items-end">
                            <h3 className="text-2xl font-bold text-slate-800">12%</h3>
                            <span className="text-xs text-slate-400 font-medium">Within limits</span>
                        </div>
                    </div>
                </div>
            </Card>
        </div>

        {/* ROW 5: Patient Intelligence */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
                <SectionHeader title="Patient Retention" icon={Users} />
                <div className="h-48 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={PATIENT_RETENTION}
                                innerRadius={60}
                                outerRadius={80}
                                startAngle={90}
                                endAngle={-270}
                                dataKey="value"
                            >
                                {PATIENT_RETENTION.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                        <span className="text-3xl font-bold text-blue-600">65%</span>
                        <span className="text-xs text-slate-400">Retention</span>
                    </div>
                </div>
            </Card>
            <Card className="lg:col-span-2">
                <SectionHeader title="High Value Patients" icon={UserPlus} />
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="px-4 py-2 rounded-l-md">Patient Name</th>
                                <th className="px-4 py-2">Last Visit</th>
                                <th className="px-4 py-2">Total Spend</th>
                                <th className="px-4 py-2 rounded-r-md">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {[1, 2, 3].map((_, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-3 font-medium text-slate-700">Sarah Johnson</td>
                                    <td className="px-4 py-3 text-slate-500">2 days ago</td>
                                    <td className="px-4 py-3 font-semibold text-slate-700">₹45,200</td>
                                    <td className="px-4 py-3"><span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-xs">Active</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>

        {/* ROW 7: AI Insights Panel */}
        <div className="grid grid-cols-1">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-lg shadow-indigo-200">
                        <div className="animate-pulse"><TrendingUp className="w-5 h-5" /></div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">AI Insights & Forecasts</h2>
                        <p className="text-sm text-slate-500">Powered by CareNex Intelligence</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                        <div className="flex justify-between items-start mb-2">
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded uppercase">Forecast</span>
                            <TrendingUp className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                        </div>
                        <p className="text-slate-600 text-sm mb-1">Revenue Forecast (30 Days)</p>
                        <h4 className="text-lg font-bold text-slate-800">On track for ₹3.2M</h4>
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> +12% Growth Expected</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-rose-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                        <div className="flex justify-between items-start mb-2">
                            <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded uppercase">Alert</span>
                            <AlertTriangle className="w-4 h-4 text-rose-400 group-hover:text-rose-600" />
                        </div>
                        <p className="text-slate-600 text-sm mb-1">Risk Alert</p>
                        <h4 className="text-lg font-bold text-slate-800">High Disease Spike</h4>
                        <p className="text-xs text-rose-600 mt-1">Viral Fever cases +40% this week</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-amber-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                        <div className="flex justify-between items-start mb-2">
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded uppercase">Warning</span>
                            <Activity className="w-4 h-4 text-amber-400 group-hover:text-amber-600" />
                        </div>
                        <p className="text-slate-600 text-sm mb-1">Doctor Utilization</p>
                        <h4 className="text-lg font-bold text-slate-800">Underperforming Alert</h4>
                        <p className="text-xs text-slate-500 mt-1">Dr. Mike at 40% capacity</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const SuperAdminView = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
        {/* ROW 1: Global KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <KPICard title="Total Hospitals" value="12" subtext="Active" color="blue" />
            <KPICard title="Total Branches" value="48" subtext="Across 5 Cities" color="blue" />
            <KPICard title="Total Users" value="2,450" subtext="Staff & Admins" color="blue" />
            <KPICard title="Total Revenue" value="₹12.5Cr" subtext="YTD" trend={18} color="green" />
            <KPICard title="Growth" value="24%" subtext="YoY" trend={5} color="green" />
        </div>

        {/* ROW 2: Revenue Trend */}
        <Card>
            <SectionHeader title="Global Revenue Trend (All Hospitals)" icon={TrendingUp} />
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={REVENUE_DATA}>
                        <defs>
                            <linearGradient id="colorGlobal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fill="url(#colorGlobal)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>

        {/* ROW 3: Branch Scorecard */}
        <Card>
            <SectionHeader title="Branch Performance Scorecard" icon={Building2} />
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500">
                        <tr>
                            <th className="px-4 py-3 rounded-l-md">Branch</th>
                            <th className="px-4 py-3">Revenue Growth</th>
                            <th className="px-4 py-3">Patient Growth</th>
                            <th className="px-4 py-3">Claim Approval</th>
                            <th className="px-4 py-3">Utilization</th>
                            <th className="px-4 py-3 rounded-r-md text-right">Overall Score</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {[
                            { name: 'Downtown Main', rev: 12, pat: 8, claim: 94, util: 88, score: 92 },
                            { name: 'North Wing', rev: -2, pat: 1, claim: 88, util: 65, score: 74 },
                            { name: 'East City', rev: 25, pat: 18, claim: 96, util: 92, score: 98 },
                            { name: 'West Suburb', rev: 5, pat: 4, claim: 90, util: 70, score: 82 },
                        ].map((branch, i) => (
                            <tr key={i}>
                                <td className="px-4 py-3 font-medium text-slate-700">{branch.name}</td>
                                <td className="px-4 py-3 text-emerald-600 font-medium">+{branch.rev}%</td>
                                <td className="px-4 py-3 text-blue-600">+{branch.pat}%</td>
                                <td className="px-4 py-3 text-slate-600">{branch.claim}%</td>
                                <td className="px-4 py-3">
                                    <div className="w-24 bg-slate-100 rounded-full h-2">
                                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${branch.util}%` }}></div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span className={`px-2 py-1 text-xs font-bold rounded ${branch.score > 90 ? 'bg-emerald-100 text-emerald-700' : branch.score > 75 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {branch.score}/100
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>

        {/* ROW 4: Expansion Intelligence */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-xs text-emerald-600 uppercase font-bold tracking-wider mb-1">Top Performer</p>
                <h3 className="text-lg font-bold text-slate-800">East City Branch</h3>
                <p className="text-sm text-emerald-700 mt-1">+25% Growth YoY</p>
            </div>
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                <p className="text-xs text-rose-600 uppercase font-bold tracking-wider mb-1">Needs Attention</p>
                <h3 className="text-lg font-bold text-slate-800">North Wing</h3>
                <p className="text-sm text-rose-700 mt-1">-2% Revenue Drop</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-600 uppercase font-bold tracking-wider mb-1">Revenue / Sq.Ft</p>
                <h3 className="text-lg font-bold text-slate-800">₹450</h3>
                <p className="text-sm text-blue-700 mt-1">Sector Avg: ₹380</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-xs text-indigo-600 uppercase font-bold tracking-wider mb-1">Forecasted Growth</p>
                <h3 className="text-lg font-bold text-slate-800">18%</h3>
                <p className="text-sm text-indigo-700 mt-1">Next Quarter</p>
            </div>
        </div>
    </div>
);

const DoctorView = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <KPICard title="Patients Seen" value="28" subtext="Today" color="blue" />
            <KPICard title="Revenue Generated" value="₹18,500" subtext="Today" color="green" />
            <KPICard title="Avg Consult Time" value="14m" subtext="Getting faster" color="blue" />
            <KPICard title="Lab Conversion" value="42%" subtext="Tests Ordered" color="yellow" />
            <KPICard title="Follow-up Rate" value="60%" subtext="Retention" color="blue" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <SectionHeader title="Daily Patient Volume" icon={Users} />
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[{ name: 'Mon', val: 24 }, { name: 'Tue', val: 28 }, { name: 'Wed', val: 32 }, { name: 'Thu', val: 26 }, { name: 'Fri', val: 30 }, { name: 'Sat', val: 18 }]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip />
                            <Bar dataKey="val" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
            <Card>
                <SectionHeader title="Top Prescribed Drugs" icon={Stethoscope} />
                <div className="space-y-4">
                    {[
                        { name: 'Paracetamol 500mg', count: 142, pct: 85 },
                        { name: 'Amoxicillin 250mg', count: 86, pct: 45 },
                        { name: 'Cetirizine 10mg', count: 64, pct: 32 },
                        { name: 'Pantoprazole 40mg', count: 58, pct: 28 },
                    ].map((drug, i) => (
                        <div key={i}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-slate-700">{drug.name}</span>
                                <span className="text-slate-500">{drug.count} scripts</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${drug.pct}%` }}></div>
                            </div>
                        </div>
                    ))}
                    <div className="pt-4 mt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-slate-800">Antibiotic Usage Rate</span>
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded">Low Risk (12%)</span>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    </div>
);

const FinanceView = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard title="Total Revenue" value="₹24,50,000" subtext="This Month" color="green" />
            <KPICard title="Insurance Pending" value="₹4,20,000" subtext="18 Claims" color="yellow" />
            <KPICard title="Claim Rejection" value="3.2%" subtext="Low" color="green" />
            <KPICard title="Outstanding Bills" value="₹85,000" subtext="Patient Due" color="red" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
                <SectionHeader title="Payment Modes" icon={IndianRupee} />
                <div className="h-64 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={[{ name: 'Cash', value: 30 }, { name: 'UPI', value: 50 }, { name: 'Card', value: 15 }, { name: 'Insurance', value: 5 }]}
                                innerRadius={60}
                                outerRadius={80}
                                dataKey="value"
                            >
                                <Cell fill="#10b981" />
                                <Cell fill="#3b82f6" />
                                <Cell fill="#6366f1" />
                                <Cell fill="#f59e0b" />
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none mb-8">
                        <span className="text-xl font-bold text-slate-800">Mix</span>
                    </div>
                </div>
            </Card>
            <Card className="lg:col-span-2">
                <SectionHeader title="Claim Status Funnel" icon={ShieldCheck} />
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={[
                            { name: 'Submitted', value: 100, fill: '#3b82f6' },
                            { name: 'Processing', value: 60, fill: '#6366f1' },
                            { name: 'Approved', value: 52, fill: '#10b981' },
                            { name: 'Rejected', value: 8, fill: '#ef4444' }
                        ]}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} />
                            <Tooltip />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>

        <div className="grid grid-cols-1">
            <Card>
                <SectionHeader title="Rejection Reason Analysis" icon={AlertTriangle} />
                <div className="flex gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px] p-4 bg-slate-50 rounded-lg">
                        <h4 className="text-slate-800 font-semibold mb-2">Policy Expired</h4>
                        <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
                            <div className="bg-rose-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                        <span className="text-xs text-slate-500">45% of rejections</span>
                    </div>
                    <div className="flex-1 min-w-[200px] p-4 bg-slate-50 rounded-lg">
                        <h4 className="text-slate-800 font-semibold mb-2">Missing Docs</h4>
                        <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
                            <div className="bg-amber-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                        </div>
                        <span className="text-xs text-slate-500">30% of rejections</span>
                    </div>
                    <div className="flex-1 min-w-[200px] p-4 bg-slate-50 rounded-lg">
                        <h4 className="text-slate-800 font-semibold mb-2">Non-Covered</h4>
                        <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                        </div>
                        <span className="text-xs text-slate-500">25% of rejections</span>
                    </div>
                </div>
            </Card>
        </div>
    </div>
);

// --- MAIN LAYOUT & APP ---

export default function MockDashboardPage() {
    const [currentRole, setCurrentRole] = useState('client_admin');
    const [dateRange, setDateRange] = useState('This Month');

    const roles = [
        { id: 'client_admin', label: 'Client Admin (CEO)', icon: LayoutDashboard },
        { id: 'super_admin', label: 'Super Admin', icon: Building2 },
        { id: 'doctor', label: 'Doctor', icon: Stethoscope },
        { id: 'finance', label: 'Accountant', icon: IndianRupee },
    ];

    return (
        <div className="min-h-screen bg-gray-50/50 font-sans text-slate-900">
            {/* Top Navigation Bar */}
            <header className="fixed top-0 inset-x-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">C</div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">CareNex AI</h1>
                </div>

                <div className="flex items-center gap-4">
                    {/* Role Switcher (Mocking the multi-role view) */}
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        {roles.map(role => (
                            <button
                                key={role.id}
                                onClick={() => setCurrentRole(role.id)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${currentRole === role.id
                                        ? 'bg-white text-blue-700 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <role.icon className="w-4 h-4" />
                                <span className="hidden md:inline">{role.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="h-6 w-px bg-slate-200 mx-2"></div>

                    <div className="flex items-center gap-3">
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="w-8 h-8 bg-indigo-100 rounded-full border border-indigo-200 flex items-center justify-center text-indigo-700 font-semibold text-sm">
                            JD
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="pt-24 pb-12 px-6 max-w-[1600px] mx-auto">

                {/* Dashboard Header Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            {roles.find(r => r.id === currentRole)?.label} Dashboard
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Welcome back, {currentRole === 'doctor' ? 'Dr. John Doe' : 'Admin User'}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm gap-2 text-sm text-slate-600">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="bg-transparent outline-none cursor-pointer"
                            >
                                <option>Today</option>
                                <option>Yesterday</option>
                                <option>This Week</option>
                                <option>This Month</option>
                                <option>Last Quarter</option>
                            </select>
                        </div>

                        {currentRole === 'client_admin' && (
                            <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm gap-2 text-sm text-slate-600">
                                <Building2 className="w-4 h-4 text-slate-400" />
                                <select className="bg-transparent outline-none cursor-pointer">
                                    <option>All Branches</option>
                                    <option>Main Branch</option>
                                    <option>City Center</option>
                                </select>
                            </div>
                        )}

                        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors">
                            <Download className="w-4 h-4" />
                            Export Report
                        </button>
                    </div>
                </div>

                {/* Dashboard Role Content Render */}
                {currentRole === 'client_admin' && <ClientAdminView />}
                {currentRole === 'super_admin' && <SuperAdminView />}
                {currentRole === 'doctor' && <DoctorView />}
                {currentRole === 'finance' && <FinanceView />}

            </main>
        </div>
    );
}
