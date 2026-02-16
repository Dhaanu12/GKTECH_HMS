import React, { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, Area, AreaChart, ComposedChart
} from 'recharts';
import { UserCheck, Search, TrendingUp, DollarSign, Activity, Users, Award, Clock } from 'lucide-react';

interface StaffData {
    id: number;
    first_name: string;
    last_name: string;
    role_detail: string;
    task_count: string;
    performance_metric: string;
    walk_in_count?: string;
    referral_count?: string;
    completed_appointments?: string;
    total_appointments?: string;
    late_days?: string;
    absent_days?: string;
    confirmed_appts?: string;
    total_confirmed?: string;
    opd_checkins?: string;
    no_show_count?: string;
    cancellations_handled?: string;
    labs_assigned?: string;
    labs_completed?: string;
    labs_pending?: string;
    patients_vitals_handled?: string;
    appointments_converted?: string;
    payments_collected?: string;
    pending_amount?: string;
    emergency_count?: string;
}

interface Props {
    data: StaffData[];
    type: 'DOCTOR' | 'NURSE' | 'RECEPTIONIST';
}

export default function StaffPerformance({ data, type }: Props) {
    const [searchTerm, setSearchTerm] = useState('');

    if (!data || !Array.isArray(data)) {
        return (
            <div className="flex items-center justify-center h-96 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300">
                <div className="text-center">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-semibold">No {type.toLowerCase()} data available</p>
                </div>
            </div>
        );
    }

    const filteredData = data.filter(d =>
        `${d.first_name} ${d.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Prepare chart data based on type
    const chartData = filteredData.map(d => {
        const fullName = `${d.first_name || 'Unknown'} ${d.last_name || ''}`.trim();

        if (type === 'DOCTOR') {
            const patients = parseInt(d.task_count || '0');
            const revenue = parseFloat(d.performance_metric || '0');
            return {
                name: fullName,
                patients: patients,
                revenue: revenue,
                avgRevenue: patients > 0 ? revenue / patients : 0,
                completionRate: parseInt(d.total_appointments || '0') > 0
                    ? (parseInt(d.completed_appointments || '0') / parseInt(d.total_appointments || '1')) * 100
                    : 0,
                walkIn: parseInt(d.walk_in_count || '0'),
                referral: parseInt(d.referral_count || '0')
            };
        } else if (type === 'NURSE') {
            return {
                name: fullName,
                labsAssigned: parseInt(d.labs_assigned || '0'),
                labsCompleted: parseInt(d.labs_completed || '0'),
                labsPending: parseInt(d.labs_pending || '0'),
                vitalsHandled: parseInt(d.patients_vitals_handled || '0'),
                presentDays: parseInt(d.performance_metric || '0'),
                lateDays: parseInt(d.late_days || '0'),
                absentDays: parseInt(d.absent_days || '0')
            };
        } else {
            return {
                name: fullName,
                opdCheckins: parseInt(d.opd_checkins || '0'),
                totalBooked: parseInt(d.total_confirmed || '0'),
                converted: parseInt(d.appointments_converted || '0'),
                cancelled: parseInt(d.cancellations_handled || '0'),
                noShows: parseInt(d.no_show_count || '0'),
                paymentsCollected: parseFloat(d.payments_collected || '0'),
                pending: parseFloat(d.pending_amount || '0'),
                walkInCount: parseInt(d.walk_in_count || '0'),
                emergencyCount: parseInt(d.emergency_count || '0')
            };
        }
    });

    // Calculate summary statistics
    const getSummaryStats = () => {
        if (type === 'DOCTOR') {
            const totalPatients = chartData.reduce((sum: number, d: any) => sum + d.patients, 0);
            const totalRevenue = chartData.reduce((sum: number, d: any) => sum + d.revenue, 0);
            const avgCompletionRate = chartData.reduce((sum: number, d: any) => sum + d.completionRate, 0) / chartData.length;
            return { totalPatients, totalRevenue, avgCompletionRate };
        } else if (type === 'NURSE') {
            const totalLabs = chartData.reduce((sum: number, d: any) => sum + d.labsCompleted, 0);
            const totalVitals = chartData.reduce((sum: number, d: any) => sum + d.vitalsHandled, 0);
            const avgAttendance = chartData.reduce((sum: number, d: any) => sum + d.presentDays, 0) / chartData.length;
            return { totalLabs, totalVitals, avgAttendance };
        } else {
            const totalOPD = chartData.reduce((sum: number, d: any) => sum + d.opdCheckins, 0);
            const totalAppointments = chartData.reduce((sum: number, d: any) => sum + d.totalBooked, 0);
            const totalConverted = chartData.reduce((sum: number, d: any) => sum + d.converted, 0);
            const totalWalkIn = chartData.reduce((sum: number, d: any) => sum + d.walkInCount, 0);
            const totalEmergency = chartData.reduce((sum: number, d: any) => sum + d.emergencyCount, 0);

            const conversionRate = totalAppointments > 0 ? (totalConverted / totalAppointments) * 100 : 0;
            return { totalOPD, totalAppointments, conversionRate, totalConverted, totalWalkIn, totalEmergency };
        }
    };

    const stats: any = getSummaryStats();

    // Sort data for ranking
    const topPerformers = [...chartData].sort((a: any, b: any) => {
        if (type === 'DOCTOR') return b.revenue - a.revenue;
        if (type === 'NURSE') return b.labsCompleted - a.labsCompleted;
        return b.totalBooked - a.totalBooked;
    }).slice(0, 10);

    return (
        <div className="space-y-6">
            {/* Header with Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        {type === 'DOCTOR' && <div className="p-2 bg-blue-100 rounded-xl"><UserCheck className="w-6 h-6 text-blue-600" /></div>}
                        {type === 'NURSE' && <div className="p-2 bg-purple-100 rounded-xl"><Activity className="w-6 h-6 text-purple-600" /></div>}
                        {type === 'RECEPTIONIST' && <div className="p-2 bg-emerald-100 rounded-xl"><Users className="w-6 h-6 text-emerald-600" /></div>}
                        {type === 'DOCTOR' ? 'Doctor Performance' : type === 'NURSE' ? 'Nurse Performance' : 'Reception Performance'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">{filteredData.length} staff members</p>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder={`Search ${type.toLowerCase()}s...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                    />
                </div>
            </div>

            {/* Summary Cards */}
            {type === 'DOCTOR' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute inset-0" style={{
                                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                                backgroundSize: '20px 20px'
                            }}></div>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl shadow-lg">
                                    <Users className="w-7 h-7 text-white" />
                                </div>
                            </div>
                            <p className="text-white/90 text-sm font-medium mb-1 uppercase tracking-wider">Total Patients Treated</p>
                            <p className="text-4xl font-bold text-white">{stats.totalPatients.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute inset-0" style={{
                                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                                backgroundSize: '20px 20px'
                            }}></div>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl shadow-lg">
                                    <DollarSign className="w-7 h-7 text-white" />
                                </div>
                            </div>
                            <p className="text-white/90 text-sm font-medium mb-1 uppercase tracking-wider">Total Revenue Generated</p>
                            <p className="text-4xl font-bold text-white">₹{stats.totalRevenue.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute inset-0" style={{
                                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                                backgroundSize: '20px 20px'
                            }}></div>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl shadow-lg">
                                    <TrendingUp className="w-7 h-7 text-white" />
                                </div>
                            </div>
                            <p className="text-white/90 text-sm font-medium mb-1 uppercase tracking-wider">Avg Completion Rate</p>
                            <p className="text-4xl font-bold text-white">{stats.avgCompletionRate.toFixed(1)}%</p>
                        </div>
                    </div>
                </div>
            )}

            {type === 'NURSE' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl shadow-lg">
                                    <Activity className="w-7 h-7 text-white" />
                                </div>
                            </div>
                            <p className="text-white/90 text-sm font-medium mb-1 uppercase tracking-wider">Total Labs Completed</p>
                            <p className="text-4xl font-bold text-white">{stats.totalLabs.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl shadow-lg">
                                    <UserCheck className="w-7 h-7 text-white" />
                                </div>
                            </div>
                            <p className="text-white/90 text-sm font-medium mb-1 uppercase tracking-wider">Patients Vitals Handled</p>
                            <p className="text-4xl font-bold text-white">{stats.totalVitals.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl shadow-lg">
                                    <Clock className="w-7 h-7 text-white" />
                                </div>
                            </div>
                            <p className="text-white/90 text-sm font-medium mb-1 uppercase tracking-wider">Avg Attendance Days</p>
                            <p className="text-4xl font-bold text-white">{stats.avgAttendance.toFixed(0)}</p>
                        </div>
                    </div>
                </div>
            )}

            {type === 'RECEPTIONIST' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl shadow-lg">
                                    <Activity className="w-7 h-7 text-white" />
                                </div>
                            </div>
                            <p className="text-white/90 text-sm font-medium mb-1 uppercase tracking-wider">Total OPD Entries</p>
                            <p className="text-4xl font-bold mb-2 text-white">{stats.totalOPD.toLocaleString()}</p>
                            <div className="flex gap-3 text-xs font-semibold bg-white/20 p-2 rounded-lg text-white/90 backdrop-blur-sm">
                                <span title="Walk-ins">Walk-in: {stats.totalWalkIn}</span>
                                <span className="opacity-50">|</span>
                                <span title="Appointments">Appt: {stats.totalConverted}</span>
                                <span className="opacity-50">|</span>
                                <span title="Emergency">Emergency: {stats.totalEmergency}</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl shadow-lg">
                                    <Users className="w-7 h-7 text-white" />
                                </div>
                            </div>
                            <p className="text-white/90 text-sm font-medium mb-1 uppercase tracking-wider">Total Appointments</p>
                            <p className="text-4xl font-bold text-white">{stats.totalAppointments.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl shadow-lg">
                                    <TrendingUp className="w-7 h-7 text-white" />
                                </div>
                            </div>
                            <p className="text-white/90 text-sm font-medium mb-1 uppercase tracking-wider">Conversion Success</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-4xl font-bold text-white">{stats.conversionRate.toFixed(1)}%</p>
                                <span className="text-sm opacity-80 text-white/90">({stats.totalConverted.toLocaleString()} converted)</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Performance Charts */}
            {type === 'DOCTOR' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Patient Volume */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-100 rounded-xl">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Patient Volume</h3>
                                <p className="text-sm text-gray-500">Total patients treated</p>
                            </div>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topPerformers} layout="vertical" margin={{ left: 100 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="patients" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Revenue Generated */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-100 rounded-xl">
                                <DollarSign className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Revenue Generated</h3>
                                <p className="text-sm text-gray-500">Total earnings per doctor</p>
                            </div>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topPerformers} layout="vertical" margin={{ left: 100 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                    <XAxis type="number" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                                    <Tooltip
                                        formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="revenue" fill="#10b981" radius={[0, 8, 8, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Patient Source Distribution */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-100 rounded-xl">
                                <Activity className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Patient Sources</h3>
                                <p className="text-sm text-gray-500">Walk-in vs Referral</p>
                            </div>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={topPerformers} layout="vertical" margin={{ left: 100 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                    <Legend />
                                    <Bar dataKey="walkIn" name="Walk-in" fill="#f59e0b" radius={[0, 4, 4, 0]} stackId="a" />
                                    <Bar dataKey="referral" name="Referral" fill="#8b5cf6" radius={[0, 4, 4, 0]} stackId="a" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Completion Rate */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-orange-100 rounded-xl">
                                <Clock className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Completion Rate</h3>
                                <p className="text-sm text-gray-500">Appointment success rate</p>
                            </div>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topPerformers} layout="vertical" margin={{ left: 100 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                    <XAxis type="number" domain={[0, 100]} />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                                    <Tooltip
                                        formatter={(value: any) => [`${value.toFixed(1)}%`, 'Completion Rate']}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="completionRate" fill="#f59e0b" radius={[0, 8, 8, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {type === 'NURSE' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Lab Performance */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-100 rounded-xl">
                                <Activity className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Lab Task Completion</h3>
                                <p className="text-sm text-gray-500">Assigned vs Completed</p>
                            </div>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={topPerformers} layout="vertical" margin={{ left: 100 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                    <Legend />
                                    <Bar dataKey="labsCompleted" name="Completed" fill="#10b981" radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="labsPending" name="Pending" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Vitals Handled */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-100 rounded-xl">
                                <UserCheck className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Patients Handled</h3>
                                <p className="text-sm text-gray-500">Vitals recorded</p>
                            </div>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topPerformers} layout="vertical" margin={{ left: 100 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="vitalsHandled" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Attendance */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg lg:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-100 rounded-xl">
                                <Clock className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Attendance Overview</h3>
                                <p className="text-sm text-gray-500">Present, Late, and Absent days</p>
                            </div>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topPerformers}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                                    <YAxis />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                    <Legend />
                                    <Bar dataKey="presentDays" name="Present" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="lateDays" name="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="absentDays" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {type === 'RECEPTIONIST' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Booking Performance */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-100 rounded-xl">
                                <Users className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Booking Activity</h3>
                                <p className="text-sm text-gray-500">Total bookings handled</p>
                            </div>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topPerformers} layout="vertical" margin={{ left: 100 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="totalBooked" fill="#10b981" radius={[0, 8, 8, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Conversion & Issues */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-100 rounded-xl">
                                <Activity className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Conversions & Issues</h3>
                                <p className="text-sm text-gray-500">Success vs Problems</p>
                            </div>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={topPerformers} layout="vertical" margin={{ left: 100 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                    <Legend />
                                    <Bar dataKey="converted" name="Converted" fill="#10b981" radius={[0, 4, 4, 0]} stackId="a" />
                                    <Bar dataKey="cancelled" name="Cancelled" fill="#f59e0b" radius={[0, 4, 4, 0]} stackId="a" />
                                    <Bar dataKey="noShows" name="No Shows" fill="#ef4444" radius={[0, 4, 4, 0]} stackId="a" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Payment Collection */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg lg:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-100 rounded-xl">
                                <DollarSign className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Payment Collection</h3>
                                <p className="text-sm text-gray-500">Revenue collected by staff</p>
                            </div>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topPerformers}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                                    <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                                    <Tooltip
                                        formatter={(value: any) => [`₹${value.toLocaleString()}`, '']}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="paymentsCollected" name="Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed Staff Cards - Improved Design */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                    <Award className="w-6 h-6 text-gray-700" />
                    <h3 className="text-xl font-bold text-gray-900">Individual Performance Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredData.map((staff, index) => {
                        const Icon = type === 'DOCTOR' ? UserCheck : type === 'NURSE' ? Activity : Users;
                        // Map type to gradient start/end colors
                        const gradientClass = type === 'DOCTOR'
                            ? 'from-blue-500 to-cyan-600'
                            : type === 'NURSE'
                                ? 'from-purple-500 to-pink-600'
                                : 'from-emerald-500 to-teal-600';

                        const borderClass = 'border-white/20';

                        return (
                            <div
                                key={staff.id}
                                className={`relative overflow-hidden bg-gradient-to-br ${gradientClass} rounded-2xl border ${borderClass} p-6 hover:shadow-xl transition-all transform hover:-translate-y-1`}
                            >
                                {/* Background Pattern */}
                                <div className="absolute inset-0 opacity-10">
                                    <div className="absolute inset-0" style={{
                                        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                                        backgroundSize: '20px 20px'
                                    }}></div>
                                </div>

                                {/* Rank Badge for Top 3 */}
                                {index < 3 && (
                                    <div className={`relative z-10 absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                        index === 1 ? 'bg-gray-200 text-gray-700' :
                                            'bg-orange-400 text-orange-900'
                                        }`}>
                                        {index + 1}
                                    </div>
                                )}

                                <div className="relative z-10 flex items-center gap-4 mb-4">
                                    <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl bg-white/20 text-white backdrop-blur-md shadow-inner border border-white/10">
                                        {(staff.first_name && staff.first_name.length > 0) ? staff.first_name[0].toUpperCase() : '?'}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-white text-lg">
                                            {staff.first_name || 'Unknown'} {staff.last_name || ''}
                                        </h4>
                                        <p className="text-xs text-white/80 uppercase font-semibold tracking-wider">{staff.role_detail}</p>
                                    </div>
                                </div>

                                {/* Key Metrics - Type Specific */}
                                <div className="relative z-10">
                                    {type === 'DOCTOR' && (
                                        <div className="space-y-3 mb-4">
                                            <div className="flex justify-between items-center p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
                                                <span className="text-sm text-white/90">Patients</span>
                                                <span className="text-lg font-bold text-white">{staff.task_count}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
                                                <span className="text-sm text-white/90">Revenue</span>
                                                <span className="text-lg font-bold text-white">₹{parseFloat(staff.performance_metric || '0').toLocaleString()}</span>
                                            </div>
                                        </div>
                                    )}

                                    {type === 'NURSE' && (
                                        <div className="space-y-3 mb-4">
                                            <div className="flex justify-between items-center p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
                                                <span className="text-sm text-white/90">Labs Done</span>
                                                <span className="text-lg font-bold text-white">{staff.labs_completed || 0}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
                                                <span className="text-sm text-white/90">Vitals</span>
                                                <span className="text-lg font-bold text-white">{staff.patients_vitals_handled || 0}</span>
                                            </div>
                                        </div>
                                    )}

                                    {type === 'RECEPTIONIST' && (
                                        <div className="space-y-3 mb-4">
                                            <div className="flex justify-between items-center p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
                                                <span className="text-sm text-white/90">Bookings</span>
                                                <span className="text-lg font-bold text-white">{staff.total_confirmed || 0}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
                                                <span className="text-sm text-white/90">Payments</span>
                                                <span className="text-lg font-bold text-white">₹{parseFloat(staff.payments_collected || '0').toLocaleString()}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Additional Badges */}
                                    <div className="flex flex-wrap gap-2 pt-3 border-t border-white/20">
                                        {type === 'DOCTOR' && (
                                            <>
                                                <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-xs font-semibold backdrop-blur-md">
                                                    Walk-in: {staff.walk_in_count || 0}
                                                </span>
                                                <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-xs font-semibold backdrop-blur-md">
                                                    Referral: {staff.referral_count || 0}
                                                </span>
                                            </>
                                        )}
                                        {type === 'NURSE' && (
                                            <>
                                                <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-xs font-semibold backdrop-blur-md">
                                                    Present: {staff.performance_metric || 0}
                                                </span>
                                                <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-xs font-semibold backdrop-blur-md">
                                                    Late: {staff.late_days || 0}
                                                </span>
                                            </>
                                        )}
                                        {type === 'RECEPTIONIST' && (
                                            <>
                                                <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-xs font-semibold backdrop-blur-md">
                                                    OPD: {staff.opd_checkins || 0}
                                                </span>
                                                <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-xs font-semibold backdrop-blur-md">
                                                    Walk-in: {staff.walk_in_count || 0}
                                                </span>
                                                <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-xs font-semibold backdrop-blur-md">
                                                    Emergency: {staff.emergency_count || 0}
                                                </span>
                                                <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-xs font-semibold backdrop-blur-md">
                                                    Cancelled: {staff.cancellations_handled || 0}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}