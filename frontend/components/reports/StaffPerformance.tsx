// import React, { useState } from 'react';
// import {
//     BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
// } from 'recharts';
// import { UserCheck, Clock, Activity, Search } from 'lucide-react';

// interface StaffData {
//     id: number;
//     first_name: string;
//     last_name: string;
//     role_detail: string;
//     task_count: string;
//     performance_metric: string;
//     // New optional fields
//     walk_in_count?: string;
//     referral_count?: string;
//     completed_appointments?: string;
//     total_appointments?: string;
//     late_days?: string;
//     absent_days?: string;
//     confirmed_appts?: string;
//     total_confirmed?: string;
//     opd_checkins?: string;
//     no_show_count?: string;
//     cancellations_handled?: string;
// }

// interface Props {
//     data: StaffData[];
//     type: 'DOCTOR' | 'NURSE' | 'RECEPTIONIST';
// }

// export default function StaffPerformance({ data, type }: Props) {
//     const [searchTerm, setSearchTerm] = useState('');

//     if (!data || !Array.isArray(data)) return <div className="p-4 text-center text-gray-500">No data available</div>;

//     const filteredData = data.filter(d =>
//         `${d.first_name} ${d.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
//     );

//     const chartData = filteredData.map(d => ({
//         name: `${d.first_name || 'Unknown'} ${d.last_name || ''}`,
//         Count: parseInt(d.task_count || '0'),
//         Metric: parseFloat(d.performance_metric || '0')
//     })).sort((a, b) => b.Metric - a.Metric).slice(0, 10);

//     const metricLabel = type === 'DOCTOR' ? 'Revenue (₹)' : type === 'NURSE' ? 'Present Days' : 'Cancellations/No-shows';
//     const countLabel = type === 'DOCTOR' ? 'Patients Seen' : type === 'NURSE' ? 'Shifts Assigned' : 'Total Interactions';

//     return (
//         <div className="space-y-8">
//             {/* Controls */}
//             <div className="flex justify-end">
//                 <div className="relative w-64">
//                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//                     <input
//                         type="text"
//                         placeholder={`Search ${type.toLowerCase()}...`}
//                         value={searchTerm}
//                         onChange={(e) => setSearchTerm(e.target.value)}
//                         className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
//                     />
//                 </div>
//             </div>

//             {/* Performance Chart */}
//             <div className="glass-panel p-6 rounded-3xl border border-white/60">
//                 <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
//                     <Activity className="w-5 h-5 text-blue-500" />
//                     Top Performers
//                 </h3>
//                 <div className="h-96">
//                     <ResponsiveContainer width="100%" height="100%">
//                         <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
//                             <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="rgba(200,200,200,0.2)" />
//                             <XAxis type="number" hide />
//                             <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
//                             <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
//                             <Legend />
//                             <Bar dataKey="Count" name={countLabel} fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
//                             <Bar dataKey="Metric" name={metricLabel} fill="#cbd5e1" radius={[0, 4, 4, 0]} barSize={20} />
//                         </BarChart>
//                     </ResponsiveContainer>
//                 </div>
//             </div>

//             {/* Detailed List */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                 {filteredData.map((staff) => (
//                     <div key={staff.id} className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition flex flex-col gap-4">
//                         <div className="flex items-center gap-4">
//                             <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">
//                                 {(staff.first_name && staff.first_name.length > 0) ? staff.first_name[0] : '?'}
//                             </div>
//                             <div className="flex-1">
//                                 <h4 className="font-bold text-gray-800">{staff.first_name || 'Unknown'} {staff.last_name || ''}</h4>
//                                 <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">{staff.role_detail}</p>
//                             </div>
//                         </div>

//                         {/* Main Stats */}
//                         <div className="flex items-center justify-between text-sm py-2 border-t border-gray-50">
//                             <div className="flex flex-col">
//                                 <span className="text-gray-400 text-xs">{countLabel}</span>
//                                 <span className="font-semibold text-gray-700">{staff.task_count}</span>
//                             </div>
//                             <div className="flex flex-col text-right">
//                                 <span className="text-gray-400 text-xs">{metricLabel}</span>
//                                 <span className={`font-bold ${type === 'DOCTOR' ? 'text-emerald-600' : 'text-blue-600'}`}>
//                                     {type === 'DOCTOR' && '₹'}{parseFloat(staff.performance_metric || '0').toLocaleString()}
//                                 </span>
//                             </div>
//                         </div>

//                         {/* Detailed Stats Badge Area */}
//                         <div className="flex flex-wrap gap-2 text-xs">
//                             {/* Doctor Specifics */}
//                             {type === 'DOCTOR' && (
//                                 <>
//                                     <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-md border border-amber-100">
//                                         Walk-in: <b>{staff.walk_in_count || 0}</b>
//                                     </span>
//                                     <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md border border-purple-100">
//                                         Ref: <b>{staff.referral_count || 0}</b>
//                                     </span>
//                                     {/* Conversion Rate */}
//                                     {parseInt(staff.total_appointments || '0') > 0 && (
//                                         <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">
//                                             Conv: <b>{Math.round((parseInt(staff.completed_appointments || '0') / parseInt(staff.total_appointments || '1')) * 100)}%</b>
//                                         </span>
//                                     )}
//                                 </>
//                             )}

//                             {/* Nurse Specifics */}
//                             {type === 'NURSE' && (
//                                 <>
//                                     <span className="px-2 py-1 bg-red-50 text-red-700 rounded-md border border-red-100">
//                                         Late: <b>{staff.late_days || 0}</b>
//                                     </span>
//                                     <span className="px-2 py-1 bg-gray-50 text-gray-700 rounded-md border border-gray-200">
//                                         Absent: <b>{staff.absent_days || 0}</b>
//                                     </span>
//                                 </>
//                             )}

//                             {/* Receptionist Specifics */}
//                             {type === 'RECEPTIONIST' && (
//                                 <>
//                                     <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100" title="Appointments Confirmed">
//                                         Booked: <b>{staff.total_confirmed || staff.confirmed_appts || 0}</b>
//                                     </span>
//                                     <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded-md border border-teal-100" title="OPD Check-ins">
//                                         OPD: <b>{staff.opd_checkins || 0}</b>
//                                     </span>
//                                     {/* No-Show Rate as quality indicator */}
//                                     {parseInt(staff.total_confirmed || '0') > 0 && (
//                                         <span className={`px-2 py-1 rounded-md border ${(parseInt(staff.no_show_count || '0') / parseInt(staff.total_confirmed || '1')) > 0.2
//                                                 ? 'bg-red-50 text-red-700 border-red-100'
//                                                 : 'bg-emerald-50 text-emerald-700 border-emerald-100'
//                                             }`} title="Conversion / Success Rate (Lower No-show is better)">
//                                             No-Show: <b>{Math.round((parseInt(staff.no_show_count || '0') / parseInt(staff.total_confirmed || '1')) * 100)}%</b>
//                                         </span>
//                                     )}
//                                     <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded-md border border-orange-100" title="Cancellations Processed">
//                                         Cancelled: <b>{staff.cancellations_handled || 0}</b>
//                                     </span>
//                                 </>
//                             )}
//                         </div>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// }

import React, { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { UserCheck, Clock, Activity, Search, TrendingUp } from 'lucide-react';

interface StaffData {
    id: number;
    first_name: string;
    last_name: string;
    role_detail: string;
    task_count: string;
    performance_metric: string;
    // New optional fields
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
}

interface Props {
    data: StaffData[];
    type: 'DOCTOR' | 'NURSE' | 'RECEPTIONIST';
}

export default function StaffPerformance({ data, type }: Props) {
    const [searchTerm, setSearchTerm] = useState('');

    if (!data || !Array.isArray(data)) return <div className="p-4 text-center text-gray-500">No data available</div>;

    const filteredData = data.filter(d =>
        `${d.first_name} ${d.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Prepare chart data based on staff type with proper calculations
    const chartData = filteredData.map(d => {
        const taskCount = parseInt(d.task_count || '0');
        const metric = parseFloat(d.performance_metric || '0');

        return {
            name: `${d.first_name || 'Unknown'} ${d.last_name || ''}`,
            Count: taskCount,
            Metric: metric,
            // Doctor-specific meaningful metrics
            AvgRevenue: type === 'DOCTOR' && taskCount > 0
                ? metric / taskCount
                : 0,
            CompletionRate: type === 'DOCTOR' && parseInt(d.total_appointments || '0') > 0
                ? (parseInt(d.completed_appointments || '0') / parseInt(d.total_appointments || '1')) * 100
                : 0,
            WalkInCount: type === 'DOCTOR' ? parseInt(d.walk_in_count || '0') : 0,
            ReferralCount: type === 'DOCTOR' ? parseInt(d.referral_count || '0') : 0
        };
    }).sort((a, b) => b.Metric - a.Metric).slice(0, 10);

    const metricLabel = type === 'DOCTOR' ? 'Revenue (₹)' : type === 'NURSE' ? 'Present Days' : 'Total Interactions';
    const countLabel = type === 'DOCTOR' ? 'Patients Seen' : type === 'NURSE' ? 'Shifts Assigned' : 'Appointments Confirmed';

    return (
        <div className="space-y-8">
            {/* Controls */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className={`px-4 py-2 rounded-xl font-semibold ${type === 'DOCTOR' ? 'bg-blue-100 text-blue-700' :
                            type === 'NURSE' ? 'bg-purple-100 text-purple-700' :
                                'bg-emerald-100 text-emerald-700'
                        }`}>
                        {filteredData.length} {type.toLowerCase()}{filteredData.length !== 1 ? 's' : ''}
                    </div>
                </div>

                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={`Search ${type.toLowerCase()}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>
            </div>

            {/* Performance Charts */}
            {type === 'DOCTOR' ? (
                <>
                    {/* Summary Stats for Doctors */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="glass-panel p-4 rounded-2xl border border-white/60">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 rounded-xl">
                                    <UserCheck className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold">Total Patients</p>
                                    <p className="text-2xl font-bold text-gray-800">
                                        {chartData.reduce((sum, d) => sum + d.Count, 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="glass-panel p-4 rounded-2xl border border-white/60">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-emerald-100 rounded-xl">
                                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold">Total Revenue</p>
                                    <p className="text-2xl font-bold text-emerald-600">
                                        ₹{chartData.reduce((sum, d) => sum + d.Metric, 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="glass-panel p-4 rounded-2xl border border-white/60">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-amber-100 rounded-xl">
                                    <Activity className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold">Avg per Patient</p>
                                    <p className="text-2xl font-bold text-gray-800">
                                        ₹{(chartData.reduce((sum, d) => sum + d.AvgRevenue, 0) / chartData.length).toFixed(0)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="glass-panel p-4 rounded-2xl border border-white/60">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-100 rounded-xl">
                                    <Clock className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold">Avg Completion</p>
                                    <p className="text-2xl font-bold text-gray-800">
                                        {(chartData.reduce((sum, d) => sum + d.CompletionRate, 0) / chartData.length).toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Doctor Performance Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Patient Volume Chart */}
                        <div className="glass-panel p-6 rounded-3xl border border-white/60">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <UserCheck className="w-5 h-5 text-blue-500" />
                                Patient Volume Comparison
                            </h3>
                            <div className="h-96">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="rgba(200,200,200,0.2)" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="Count" name="Patients Seen" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Revenue Chart */}
                        <div className="glass-panel p-6 rounded-3xl border border-white/60">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                                Total Revenue Generated
                            </h3>
                            <div className="h-96">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="rgba(200,200,200,0.2)" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                            formatter={(value: number) => `₹${value.toLocaleString()}`}
                                        />
                                        <Legend />
                                        <Bar dataKey="Metric" name="Total Revenue (₹)" fill="#10b981" radius={[0, 8, 8, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Average Revenue per Patient */}
                        <div className="glass-panel p-6 rounded-3xl border border-white/60">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-purple-500" />
                                Revenue Efficiency (Avg per Patient)
                            </h3>
                            <div className="h-96">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="rgba(200,200,200,0.2)" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                            formatter={(value: number) => `₹${value.toFixed(2)}`}
                                        />
                                        <Legend />
                                        <Bar dataKey="AvgRevenue" name="Avg Revenue per Patient (₹)" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Completion Rate */}
                        <div className="glass-panel p-6 rounded-3xl border border-white/60">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-amber-500" />
                                Appointment Completion Rate
                            </h3>
                            <div className="h-96">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="rgba(200,200,200,0.2)" />
                                        <XAxis type="number" domain={[0, 100]} />
                                        <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(245, 158, 11, 0.1)' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                            formatter={(value: number) => `${value.toFixed(1)}%`}
                                        />
                                        <Legend />
                                        <Bar dataKey="CompletionRate" name="Completion Rate (%)" fill="#f59e0b" radius={[0, 8, 8, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                /* Original chart for Nurses and Receptionists */
                <div className="glass-panel p-6 rounded-3xl border border-white/60">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-500" />
                        Top Performers
                    </h3>
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="rgba(200,200,200,0.2)" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                <Legend />
                                <Bar dataKey="Count" name={countLabel} fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={24} />
                                <Bar dataKey="Metric" name={metricLabel} fill="#10b981" radius={[0, 8, 8, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Detailed List */}
            <div className="glass-panel rounded-3xl border border-white/60 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-slate-800">Individual Performance Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                    {filteredData.map((staff) => (
                        <div key={staff.id} className="bg-white p-5 rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl ${type === 'DOCTOR' ? 'bg-blue-100 text-blue-600' :
                                        type === 'NURSE' ? 'bg-purple-100 text-purple-600' :
                                            'bg-emerald-100 text-emerald-600'
                                    }`}>
                                    {(staff.first_name && staff.first_name.length > 0) ? staff.first_name[0] : '?'}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-800 text-base">
                                        {staff.first_name || 'Unknown'} {staff.last_name || ''}
                                    </h4>
                                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">{staff.role_detail}</p>
                                </div>
                            </div>

                            {/* Main Stats */}
                            <div className="flex items-center justify-between py-3 mb-3 border-y border-gray-100">
                                <div className="flex flex-col">
                                    <span className="text-gray-400 text-xs font-medium">{countLabel}</span>
                                    <span className="font-bold text-gray-700 text-lg">{staff.task_count}</span>
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="text-gray-400 text-xs font-medium">{metricLabel}</span>
                                    <span className={`font-bold text-lg ${type === 'DOCTOR' ? 'text-emerald-600' : type === 'NURSE' ? 'text-purple-600' : 'text-blue-600'}`}>
                                        {type === 'DOCTOR' && '₹'}{parseFloat(staff.performance_metric || '0').toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Detailed Stats Badge Area */}
                            <div className="flex flex-wrap gap-2 text-xs">
                                {/* Doctor Specifics */}
                                {type === 'DOCTOR' && (
                                    <>
                                        <span className="px-2.5 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 font-medium">
                                            Walk-in: <b>{staff.walk_in_count || 0}</b>
                                        </span>
                                        <span className="px-2.5 py-1.5 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 font-medium">
                                            Referral: <b>{staff.referral_count || 0}</b>
                                        </span>
                                        {/* Average Revenue per Patient */}
                                        {parseInt(staff.task_count || '0') > 0 && (
                                            <span className="px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 font-medium">
                                                Avg/Patient: <b>₹{Math.round(parseFloat(staff.performance_metric || '0') / parseInt(staff.task_count || '1'))}</b>
                                            </span>
                                        )}
                                        {/* Completion Rate */}
                                        {parseInt(staff.total_appointments || '0') > 0 && (
                                            <span className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 font-medium">
                                                Completion: <b>{Math.round((parseInt(staff.completed_appointments || '0') / parseInt(staff.total_appointments || '1')) * 100)}%</b>
                                            </span>
                                        )}
                                    </>
                                )}

                                {/* Nurse Specifics */}
                                {type === 'NURSE' && (
                                    <>
                                        <span className="px-2.5 py-1.5 bg-red-50 text-red-700 rounded-lg border border-red-200 font-medium">
                                            Late: <b>{staff.late_days || 0}</b>
                                        </span>
                                        <span className="px-2.5 py-1.5 bg-gray-100 text-gray-700 rounded-lg border border-gray-300 font-medium">
                                            Absent: <b>{staff.absent_days || 0}</b>
                                        </span>
                                        {/* Attendance Rate */}
                                        {parseInt(staff.task_count || '0') > 0 && (
                                            <span className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 font-medium">
                                                Attendance: <b>{Math.round((parseFloat(staff.performance_metric || '0') / parseInt(staff.task_count || '1')) * 100)}%</b>
                                            </span>
                                        )}
                                    </>
                                )}

                                {/* Receptionist Specifics */}
                                {type === 'RECEPTIONIST' && (
                                    <>
                                        <span className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200 font-medium" title="Appointments Confirmed">
                                            Booked: <b>{staff.total_confirmed || staff.confirmed_appts || 0}</b>
                                        </span>
                                        <span className="px-2.5 py-1.5 bg-teal-50 text-teal-700 rounded-lg border border-teal-200 font-medium" title="OPD Check-ins">
                                            OPD: <b>{staff.opd_checkins || 0}</b>
                                        </span>
                                        {/* No-Show Rate as quality indicator */}
                                        {parseInt(staff.total_confirmed || '0') > 0 && (
                                            <span className={`px-2.5 py-1.5 rounded-lg border font-medium ${(parseInt(staff.no_show_count || '0') / parseInt(staff.total_confirmed || '1')) > 0.2
                                                ? 'bg-red-50 text-red-700 border-red-200'
                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                }`} title="No-show Rate (Lower is better)">
                                                No-Show: <b>{Math.round((parseInt(staff.no_show_count || '0') / parseInt(staff.total_confirmed || '1')) * 100)}%</b>
                                            </span>
                                        )}
                                        <span className="px-2.5 py-1.5 bg-orange-50 text-orange-700 rounded-lg border border-orange-200 font-medium" title="Cancellations Processed">
                                            Cancelled: <b>{staff.cancellations_handled || 0}</b>
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}