// // import React, { useState } from 'react';
// // import {
// //     BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
// // } from 'recharts';
// // import { UserCheck, Clock, Activity, Search } from 'lucide-react';

// // interface StaffData {
// //     id: number;
// //     first_name: string;
// //     last_name: string;
// //     role_detail: string;
// //     task_count: string;
// //     performance_metric: string;
// //     // New optional fields
// //     walk_in_count?: string;
// //     referral_count?: string;
// //     completed_appointments?: string;
// //     total_appointments?: string;
// //     late_days?: string;
// //     absent_days?: string;
// //     confirmed_appts?: string;
// //     total_confirmed?: string;
// //     opd_checkins?: string;
// //     no_show_count?: string;
// //     cancellations_handled?: string;
// // }

// // interface Props {
// //     data: StaffData[];
// //     type: 'DOCTOR' | 'NURSE' | 'RECEPTIONIST';
// // }

// // export default function StaffPerformance({ data, type }: Props) {
// //     const [searchTerm, setSearchTerm] = useState('');

// //     if (!data || !Array.isArray(data)) return <div className="p-4 text-center text-gray-500">No data available</div>;

// //     const filteredData = data.filter(d =>
// //         `${d.first_name} ${d.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
// //     );

// //     const chartData = filteredData.map(d => ({
// //         name: `${d.first_name || 'Unknown'} ${d.last_name || ''}`,
// //         Count: parseInt(d.task_count || '0'),
// //         Metric: parseFloat(d.performance_metric || '0')
// //     })).sort((a, b) => b.Metric - a.Metric).slice(0, 10);

// //     const metricLabel = type === 'DOCTOR' ? 'Revenue (₹)' : type === 'NURSE' ? 'Present Days' : 'Cancellations/No-shows';
// //     const countLabel = type === 'DOCTOR' ? 'Patients Seen' : type === 'NURSE' ? 'Shifts Assigned' : 'Total Interactions';

// //     return (
// //         <div className="space-y-8">
// //             {/* Controls */}
// //             <div className="flex justify-end">
// //                 <div className="relative w-64">
// //                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
// //                     <input
// //                         type="text"
// //                         placeholder={`Search ${type.toLowerCase()}...`}
// //                         value={searchTerm}
// //                         onChange={(e) => setSearchTerm(e.target.value)}
// //                         className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
// //                     />
// //                 </div>
// //             </div>

// //             {/* Performance Chart */}
// //             <div className="glass-panel p-6 rounded-3xl border border-white/60">
// //                 <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
// //                     <Activity className="w-5 h-5 text-blue-500" />
// //                     Top Performers
// //                 </h3>
// //                 <div className="h-96">
// //                     <ResponsiveContainer width="100%" height="100%">
// //                         <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
// //                             <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="rgba(200,200,200,0.2)" />
// //                             <XAxis type="number" hide />
// //                             <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
// //                             <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
// //                             <Legend />
// //                             <Bar dataKey="Count" name={countLabel} fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
// //                             <Bar dataKey="Metric" name={metricLabel} fill="#cbd5e1" radius={[0, 4, 4, 0]} barSize={20} />
// //                         </BarChart>
// //                     </ResponsiveContainer>
// //                 </div>
// //             </div>

// //             {/* Detailed List */}
// //             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
// //                 {filteredData.map((staff) => (
// //                     <div key={staff.id} className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition flex flex-col gap-4">
// //                         <div className="flex items-center gap-4">
// //                             <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">
// //                                 {(staff.first_name && staff.first_name.length > 0) ? staff.first_name[0] : '?'}
// //                             </div>
// //                             <div className="flex-1">
// //                                 <h4 className="font-bold text-gray-800">{staff.first_name || 'Unknown'} {staff.last_name || ''}</h4>
// //                                 <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">{staff.role_detail}</p>
// //                             </div>
// //                         </div>

// //                         {/* Main Stats */}
// //                         <div className="flex items-center justify-between text-sm py-2 border-t border-gray-50">
// //                             <div className="flex flex-col">
// //                                 <span className="text-gray-400 text-xs">{countLabel}</span>
// //                                 <span className="font-semibold text-gray-700">{staff.task_count}</span>
// //                             </div>
// //                             <div className="flex flex-col text-right">
// //                                 <span className="text-gray-400 text-xs">{metricLabel}</span>
// //                                 <span className={`font-bold ${type === 'DOCTOR' ? 'text-emerald-600' : 'text-blue-600'}`}>
// //                                     {type === 'DOCTOR' && '₹'}{parseFloat(staff.performance_metric || '0').toLocaleString()}
// //                                 </span>
// //                             </div>
// //                         </div>

// //                         {/* Detailed Stats Badge Area */}
// //                         <div className="flex flex-wrap gap-2 text-xs">
// //                             {/* Doctor Specifics */}
// //                             {type === 'DOCTOR' && (
// //                                 <>
// //                                     <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-md border border-amber-100">
// //                                         Walk-in: <b>{staff.walk_in_count || 0}</b>
// //                                     </span>
// //                                     <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md border border-purple-100">
// //                                         Ref: <b>{staff.referral_count || 0}</b>
// //                                     </span>
// //                                     {/* Conversion Rate */}
// //                                     {parseInt(staff.total_appointments || '0') > 0 && (
// //                                         <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">
// //                                             Conv: <b>{Math.round((parseInt(staff.completed_appointments || '0') / parseInt(staff.total_appointments || '1')) * 100)}%</b>
// //                                         </span>
// //                                     )}
// //                                 </>
// //                             )}

// //                             {/* Nurse Specifics */}
// //                             {type === 'NURSE' && (
// //                                 <>
// //                                     <span className="px-2 py-1 bg-red-50 text-red-700 rounded-md border border-red-100">
// //                                         Late: <b>{staff.late_days || 0}</b>
// //                                     </span>
// //                                     <span className="px-2 py-1 bg-gray-50 text-gray-700 rounded-md border border-gray-200">
// //                                         Absent: <b>{staff.absent_days || 0}</b>
// //                                     </span>
// //                                 </>
// //                             )}

// //                             {/* Receptionist Specifics */}
// //                             {type === 'RECEPTIONIST' && (
// //                                 <>
// //                                     <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100" title="Appointments Confirmed">
// //                                         Booked: <b>{staff.total_confirmed || staff.confirmed_appts || 0}</b>
// //                                     </span>
// //                                     <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded-md border border-teal-100" title="OPD Check-ins">
// //                                         OPD: <b>{staff.opd_checkins || 0}</b>
// //                                     </span>
// //                                     {/* No-Show Rate as quality indicator */}
// //                                     {parseInt(staff.total_confirmed || '0') > 0 && (
// //                                         <span className={`px-2 py-1 rounded-md border ${(parseInt(staff.no_show_count || '0') / parseInt(staff.total_confirmed || '1')) > 0.2
// //                                                 ? 'bg-red-50 text-red-700 border-red-100'
// //                                                 : 'bg-emerald-50 text-emerald-700 border-emerald-100'
// //                                             }`} title="Conversion / Success Rate (Lower No-show is better)">
// //                                             No-Show: <b>{Math.round((parseInt(staff.no_show_count || '0') / parseInt(staff.total_confirmed || '1')) * 100)}%</b>
// //                                         </span>
// //                                     )}
// //                                     <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded-md border border-orange-100" title="Cancellations Processed">
// //                                         Cancelled: <b>{staff.cancellations_handled || 0}</b>
// //                                     </span>
// //                                 </>
// //                             )}
// //                         </div>
// //                     </div>
// //                 ))}
// //             </div>
// //         </div>
// //     );
// // }

// import React, { useState } from 'react';
// import {
//     BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
// } from 'recharts';
// import { UserCheck, Clock, Activity, Search, TrendingUp } from 'lucide-react';

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
//     // New Lab Metrics (Nurse)
//     labs_assigned?: string;
//     labs_completed?: string;
//     labs_pending?: string;
//     patients_vitals_handled?: string;
//     // New Receptionist Metrics
//     appointments_converted?: string;
//     payments_collected?: string;
//     pending_amount?: string;
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

//     const metricLabel = type === 'DOCTOR' ? 'Revenue (₹)' : type === 'NURSE' ? 'Labs Completed' : 'Issues Handled';
//     const countLabel = type === 'DOCTOR' ? 'Patients Seen' : type === 'NURSE' ? 'Labs Assigned' : 'Positive Actions';

//     // Prepare chart data based on staff type with proper calculations
//     const chartData = filteredData.map(d => {
//         // Default to task_count/performance_metric, but override for Nurse
//         let taskCount = parseInt(d.task_count || '0');
//         let metric = parseFloat(d.performance_metric || '0');

//         if (type === 'NURSE') {
//             taskCount = parseInt(d.labs_assigned || '0');
//             metric = parseInt(d.labs_completed || '0');
//         }

//         return {
//             name: `${d.first_name || 'Unknown'} ${d.last_name || ''}`,
//             Count: taskCount,
//             Metric: metric,
//             VitalsCount: type === 'NURSE' ? parseInt(d.patients_vitals_handled || '0') : 0,
//             // Doctor-specific meaningful metrics
//             AvgRevenue: type === 'DOCTOR' && taskCount > 0
//                 ? metric / taskCount
//                 : 0,
//             CompletionRate: type === 'DOCTOR' && parseInt(d.total_appointments || '0') > 0
//                 ? (parseInt(d.completed_appointments || '0') / parseInt(d.total_appointments || '1')) * 100
//                 : 0,
//             WalkInCount: type === 'DOCTOR' ? parseInt(d.walk_in_count || '0') : 0,
//             ReferralCount: type === 'DOCTOR' ? parseInt(d.referral_count || '0') : 0
//         };
//     }).sort((a, b) => {
//         // Sort logic: Doctors/Nurses by Metric (Rev/Labs), Receptionist by Count (Activity)
//         if (type === 'RECEPTIONIST') return b.Count - a.Count;
//         return b.Metric - a.Metric;
//     }).slice(0, 10);

//     return (
//         <div className="space-y-8">
//             {/* Controls */}
//             <div className="flex justify-between items-center">
//                 <div className="flex items-center gap-3">
//                     <div className={`px-4 py-2 rounded-xl font-semibold ${type === 'DOCTOR' ? 'bg-blue-100 text-blue-700' :
//                         type === 'NURSE' ? 'bg-purple-100 text-purple-700' :
//                             'bg-emerald-100 text-emerald-700'
//                         }`}>
//                         {filteredData.length} {type.toLowerCase()}{filteredData.length !== 1 ? 's' : ''}
//                     </div>
//                 </div>

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

//             {/* Performance Charts */}
//             {type === 'DOCTOR' ? (
//                 <>
//                     {/* Summary Stats for Doctors */}
//                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pdf-capture">
//                         <div className="glass-panel p-4 rounded-2xl border border-white/60">
//                             <div className="flex items-center gap-3">
//                                 <div className="p-3 bg-blue-100 rounded-xl">
//                                     <UserCheck className="w-5 h-5 text-blue-600" />
//                                 </div>
//                                 <div>
//                                     <p className="text-xs text-gray-500 font-semibold">Total Patients</p>
//                                     <p className="text-2xl font-bold text-gray-800">
//                                         {chartData.reduce((sum, d) => sum + d.Count, 0).toLocaleString()}
//                                     </p>
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="glass-panel p-4 rounded-2xl border border-white/60">
//                             <div className="flex items-center gap-3">
//                                 <div className="p-3 bg-emerald-100 rounded-xl">
//                                     <TrendingUp className="w-5 h-5 text-emerald-600" />
//                                 </div>
//                                 <div>
//                                     <p className="text-xs text-gray-500 font-semibold">Total Revenue</p>
//                                     <p className="text-2xl font-bold text-emerald-600">
//                                         ₹{chartData.reduce((sum, d) => sum + d.Metric, 0).toLocaleString()}
//                                     </p>
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="glass-panel p-4 rounded-2xl border border-white/60">
//                             <div className="flex items-center gap-3">
//                                 <div className="p-3 bg-amber-100 rounded-xl">
//                                     <Activity className="w-5 h-5 text-amber-600" />
//                                 </div>
//                                 <div>
//                                     <p className="text-xs text-gray-500 font-semibold">Avg per Patient</p>
//                                     <p className="text-2xl font-bold text-gray-800">
//                                         ₹{(chartData.reduce((sum, d) => sum + d.AvgRevenue, 0) / chartData.length).toFixed(0)}
//                                     </p>
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="glass-panel p-4 rounded-2xl border border-white/60">
//                             <div className="flex items-center gap-3">
//                                 <div className="p-3 bg-purple-100 rounded-xl">
//                                     <Clock className="w-5 h-5 text-purple-600" />
//                                 </div>
//                                 <div>
//                                     <p className="text-xs text-gray-500 font-semibold">Avg Completion</p>
//                                     <p className="text-2xl font-bold text-gray-800">
//                                         {(chartData.reduce((sum, d) => sum + d.CompletionRate, 0) / chartData.length).toFixed(1)}%
//                                     </p>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Doctor Performance Charts Grid */}
//                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                         {/* Patient Volume Chart */}
//                         {/* Patient Volume Chart */}
//                         <div className="glass-panel pdf-capture p-6 rounded-3xl border border-white/60">
//                             <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
//                                 <UserCheck className="w-5 h-5 text-blue-500" />
//                                 Patient Volume Comparison
//                             </h3>
//                             <div className="h-96">
//                                 <ResponsiveContainer width="100%" height="100%">
//                                     <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 20 }}>
//                                         <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="rgba(200,200,200,0.2)" />
//                                         <XAxis type="number" />
//                                         <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
//                                         <Tooltip
//                                             cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
//                                             contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
//                                         />
//                                         <Legend />
//                                         <Bar dataKey="Count" name="Patients Seen" fill="#3b82f6" radius={[0, 8, 8, 0]} />
//                                     </BarChart>
//                                 </ResponsiveContainer>
//                             </div>
//                         </div>

//                         {/* Revenue Chart */}
//                         {/* Revenue Chart */}
//                         <div className="glass-panel pdf-capture p-6 rounded-3xl border border-white/60">
//                             <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
//                                 <TrendingUp className="w-5 h-5 text-emerald-500" />
//                                 Total Revenue Generated
//                             </h3>
//                             <div className="h-96">
//                                 <ResponsiveContainer width="100%" height="100%">
//                                     <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 20 }}>
//                                         <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="rgba(200,200,200,0.2)" />
//                                         <XAxis type="number" />
//                                         <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
//                                         <Tooltip
//                                             cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
//                                             contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
//                                             formatter={(value: number) => `₹${value.toLocaleString()}`}
//                                         />
//                                         <Legend />
//                                         <Bar dataKey="Metric" name="Total Revenue (₹)" fill="#10b981" radius={[0, 8, 8, 0]} />
//                                     </BarChart>
//                                 </ResponsiveContainer>
//                             </div>
//                         </div>

//                         {/* Average Revenue per Patient */}
//                         {/* Average Revenue per Patient */}
//                         <div className="glass-panel pdf-capture p-6 rounded-3xl border border-white/60">
//                             <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
//                                 <Activity className="w-5 h-5 text-purple-500" />
//                                 Revenue Efficiency (Avg per Patient)
//                             </h3>
//                             <div className="h-96">
//                                 <ResponsiveContainer width="100%" height="100%">
//                                     <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 20 }}>
//                                         <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="rgba(200,200,200,0.2)" />
//                                         <XAxis type="number" />
//                                         <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
//                                         <Tooltip
//                                             cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
//                                             contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
//                                             formatter={(value: number) => `₹${value.toFixed(2)}`}
//                                         />
//                                         <Legend />
//                                         <Bar dataKey="AvgRevenue" name="Avg Revenue per Patient (₹)" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
//                                     </BarChart>
//                                 </ResponsiveContainer>
//                             </div>
//                         </div>

//                         {/* Completion Rate */}
//                         {/* Completion Rate */}
//                         <div className="glass-panel pdf-capture p-6 rounded-3xl border border-white/60">
//                             <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
//                                 <Clock className="w-5 h-5 text-amber-500" />
//                                 Appointment Completion Rate
//                             </h3>
//                             <div className="h-96">
//                                 <ResponsiveContainer width="100%" height="100%">
//                                     <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 20 }}>
//                                         <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="rgba(200,200,200,0.2)" />
//                                         <XAxis type="number" domain={[0, 100]} />
//                                         <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
//                                         <Tooltip
//                                             cursor={{ fill: 'rgba(245, 158, 11, 0.1)' }}
//                                             contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
//                                             formatter={(value: number) => `${value.toFixed(1)}%`}
//                                         />
//                                         <Legend />
//                                         <Bar dataKey="CompletionRate" name="Completion Rate (%)" fill="#f59e0b" radius={[0, 8, 8, 0]} />
//                                     </BarChart>
//                                 </ResponsiveContainer>
//                             </div>
//                         </div>
//                     </div>
//                 </>
//             ) : (
//                 /* Original chart for Nurses and Receptionists */
//                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                     <div className="glass-panel pdf-capture p-6 rounded-3xl border border-white/60">
//                         <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
//                             <Activity className="w-5 h-5 text-blue-500" />
//                             Top Performers
//                         </h3>
//                         <div className="h-96">
//                             <ResponsiveContainer width="100%" height="100%">
//                                 <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 20 }}>
//                                     <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="rgba(200,200,200,0.2)" />
//                                     <XAxis type="number" />
//                                     <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
//                                     <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
//                                     <Legend />
//                                     <Bar dataKey="Count" name={countLabel} fill={type === 'NURSE' ? '#8b5cf6' : '#3b82f6'} radius={[0, 8, 8, 0]} barSize={24} />
//                                     <Bar
//                                         dataKey="Metric"
//                                         name={metricLabel}
//                                         fill={type === 'RECEPTIONIST' ? '#ef4444' : '#10b981'}
//                                         radius={[0, 8, 8, 0]}
//                                         barSize={24}
//                                     />
//                                 </BarChart>
//                             </ResponsiveContainer>
//                         </div>
//                     </div>

//                     {/* Nurse Specific Vitals Chart */}
//                     {type === 'NURSE' && (
//                         <div className="glass-panel pdf-capture p-6 rounded-3xl border border-white/60">
//                             <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
//                                 <UserCheck className="w-5 h-5 text-purple-500" />
//                                 Patients Handled (Vitals)
//                             </h3>
//                             <div className="h-96">
//                                 <ResponsiveContainer width="100%" height="100%">
//                                     <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 20 }}>
//                                         <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="rgba(200,200,200,0.2)" />
//                                         <XAxis type="number" />
//                                         <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
//                                         <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
//                                         <Legend />
//                                         <Bar dataKey="VitalsCount" name="Unique Patients (Vitals)" fill="#8b5cf6" radius={[0, 8, 8, 0]} barSize={24} />
//                                     </BarChart>
//                                 </ResponsiveContainer>
//                             </div>
//                         </div>
//                     )}
//                 </div>
//             )}


//             {/* Detailed List */}
//             <div className="glass-panel rounded-3xl border border-white/60 overflow-hidden">
//                 <div className="p-6 border-b border-gray-100">
//                     <h3 className="text-lg font-bold text-slate-800">Individual Performance Details</h3>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
//                     {filteredData.map((staff) => (
//                         <div key={staff.id} className="bg-white p-5 rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
//                             <div className="flex items-center gap-4 mb-4">
//                                 <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl ${type === 'DOCTOR' ? 'bg-blue-100 text-blue-600' :
//                                     type === 'NURSE' ? 'bg-purple-100 text-purple-600' :
//                                         'bg-emerald-100 text-emerald-600'
//                                     }`}>
//                                     {(staff.first_name && staff.first_name.length > 0) ? staff.first_name[0] : '?'}
//                                 </div>
//                                 <div className="flex-1">
//                                     <h4 className="font-bold text-gray-800 text-base">
//                                         {staff.first_name || 'Unknown'} {staff.last_name || ''}
//                                     </h4>
//                                     <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">{staff.role_detail}</p>
//                                 </div>
//                             </div>

//                             {/* Main Stats */}
//                             <div className="flex items-center justify-between py-3 mb-3 border-y border-gray-100">
//                                 <div className="flex flex-col">
//                                     <span className="text-gray-400 text-xs font-medium">{countLabel}</span>
//                                     <span className="font-bold text-gray-700 text-lg">
//                                         {type === 'NURSE' ? (staff.labs_assigned || 0) : staff.task_count}
//                                     </span>
//                                 </div>
//                                 <div className="flex flex-col text-right">
//                                     <span className="text-gray-400 text-xs font-medium">{metricLabel}</span>
//                                     <span className={`font-bold text-lg ${type === 'DOCTOR' ? 'text-emerald-600' : type === 'NURSE' ? 'text-purple-600' : 'text-blue-600'}`}>
//                                         {type === 'DOCTOR' && '₹'}
//                                         {type === 'NURSE'
//                                             ? (staff.labs_completed || 0)
//                                             : parseFloat(staff.performance_metric || '0').toLocaleString()}
//                                     </span>
//                                 </div>
//                             </div>

//                             {/* Detailed Stats Badge Area */}
//                             <div className="flex flex-wrap gap-2 text-xs">
//                                 {/* Doctor Specifics */}
//                                 {type === 'DOCTOR' && (
//                                     <>
//                                         <span className="px-2.5 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 font-medium">
//                                             Walk-in: <b>{staff.walk_in_count || 0}</b>
//                                         </span>
//                                         <span className="px-2.5 py-1.5 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 font-medium">
//                                             Referral: <b>{staff.referral_count || 0}</b>
//                                         </span>
//                                         {/* Average Revenue per Patient */}
//                                         {parseInt(staff.task_count || '0') > 0 && (
//                                             <span className="px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 font-medium">
//                                                 Avg/Patient: <b>₹{Math.round(parseFloat(staff.performance_metric || '0') / parseInt(staff.task_count || '1'))}</b>
//                                             </span>
//                                         )}
//                                         {/* Completion Rate */}
//                                         {parseInt(staff.total_appointments || '0') > 0 && (
//                                             <span className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 font-medium">
//                                                 Completion: <b>{Math.round((parseInt(staff.completed_appointments || '0') / parseInt(staff.total_appointments || '1')) * 100)}%</b>
//                                             </span>
//                                         )}
//                                     </>
//                                 )}

//                                 {/* Nurse Specifics */}
//                                 {type === 'NURSE' && (
//                                     <>
//                                         {/* Attendance Metrics (Now secondary) */}
//                                         <span className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 font-medium">
//                                             Present: <b>{staff.performance_metric || 0}</b>
//                                         </span>
//                                         <span className="px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 font-medium">
//                                             Shifts: <b>{staff.task_count || 0}</b>
//                                         </span>
//                                         <span className="px-2.5 py-1.5 bg-red-50 text-red-700 rounded-lg border border-red-200 font-medium">
//                                             Late: <b>{staff.late_days || 0}</b>
//                                         </span>
//                                         <span className="px-2.5 py-1.5 bg-gray-100 text-gray-700 rounded-lg border border-gray-300 font-medium">
//                                             Absent: <b>{staff.absent_days || 0}</b>
//                                         </span>

//                                         {parseInt(staff.labs_pending || '0') > 0 && (
//                                             <span className="px-2.5 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200 font-medium" title="Pending Labs">
//                                                 Pending Labs: <b>{staff.labs_pending}</b>
//                                             </span>
//                                         )}
//                                     </>
//                                 )}

//                                 {/* Receptionist Specifics */}
//                                 {type === 'RECEPTIONIST' && (
//                                     <>
//                                         <span className="px-2.5 py-1.5 bg-teal-50 text-teal-700 rounded-lg border border-teal-200 font-medium" title="OPD Check-ins">
//                                             OPD: <b>{staff.opd_checkins || 0}</b>
//                                         </span>
//                                         <span className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200 font-medium" title="Total Appts">
//                                             Booked: <b>{staff.total_confirmed || 0}</b>
//                                         </span>
//                                         <span className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 font-medium" title="Completed Appts">
//                                             Conv: <b>{staff.appointments_converted || 0}</b>
//                                         </span>
//                                         <span className="px-2.5 py-1.5 bg-orange-50 text-orange-700 rounded-lg border border-orange-200 font-medium" title="Cancelled">
//                                             Cancelled: <b>{staff.cancellations_handled || 0}</b>
//                                         </span>

//                                         {/* Finance */}
//                                         <div className="w-full mt-2 pt-2 border-t border-gray-100 flex gap-2">
//                                             <span className="px-2.5 py-1.5 bg-green-50 text-green-700 rounded-lg border border-green-200 font-medium flex-1 text-center" title="Payments Collected">
//                                                 ₹{parseFloat(staff.payments_collected || '0').toLocaleString()}
//                                             </span>
//                                             {parseFloat(staff.pending_amount || '0') > 0 && (
//                                                 <span className="px-2.5 py-1.5 bg-red-50 text-red-700 rounded-lg border border-red-200 font-medium" title="Pending Payments">
//                                                     Pending: ₹{parseFloat(staff.pending_amount || '0').toLocaleString()}
//                                                 </span>
//                                             )}
//                                         </div>
//                                     </>
//                                 )}
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             </div>
//         </div >
//     );
// }


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
                pending: parseFloat(d.pending_amount || '0')
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
            const totalBookings = chartData.reduce((sum: number, d: any) => sum + d.totalBooked, 0);
            const totalPayments = chartData.reduce((sum: number, d: any) => sum + d.paymentsCollected, 0);
            const avgConversion = chartData.reduce((sum: number, d: any) => {
                return sum + (d.totalBooked > 0 ? (d.converted / d.totalBooked) * 100 : 0);
            }, 0) / chartData.length;
            return { totalBookings, totalPayments, avgConversion };
        }
    };

    const stats = getSummaryStats();

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
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                <Users className="w-7 h-7" />
                            </div>
                        </div>
                        <p className="text-blue-100 text-sm font-medium mb-1">Total Patients Treated</p>
                        <p className="text-4xl font-bold">{stats.totalPatients.toLocaleString()}</p>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl p-6 text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                <DollarSign className="w-7 h-7" />
                            </div>
                        </div>
                        <p className="text-emerald-100 text-sm font-medium mb-1">Total Revenue Generated</p>
                        <p className="text-4xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                <TrendingUp className="w-7 h-7" />
                            </div>
                        </div>
                        <p className="text-purple-100 text-sm font-medium mb-1">Avg Completion Rate</p>
                        <p className="text-4xl font-bold">{stats.avgCompletionRate.toFixed(1)}%</p>
                    </div>
                </div>
            )}

            {type === 'NURSE' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                <Activity className="w-7 h-7" />
                            </div>
                        </div>
                        <p className="text-purple-100 text-sm font-medium mb-1">Total Labs Completed</p>
                        <p className="text-4xl font-bold">{stats.totalLabs.toLocaleString()}</p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-xl p-6 text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                <UserCheck className="w-7 h-7" />
                            </div>
                        </div>
                        <p className="text-blue-100 text-sm font-medium mb-1">Patients Vitals Handled</p>
                        <p className="text-4xl font-bold">{stats.totalVitals.toLocaleString()}</p>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl p-6 text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                <Clock className="w-7 h-7" />
                            </div>
                        </div>
                        <p className="text-emerald-100 text-sm font-medium mb-1">Avg Attendance Days</p>
                        <p className="text-4xl font-bold">{stats.avgAttendance.toFixed(0)}</p>
                    </div>
                </div>
            )}

            {type === 'RECEPTIONIST' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl p-6 text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                <Users className="w-7 h-7" />
                            </div>
                        </div>
                        <p className="text-emerald-100 text-sm font-medium mb-1">Total Bookings</p>
                        <p className="text-4xl font-bold">{stats.totalBookings.toLocaleString()}</p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                <DollarSign className="w-7 h-7" />
                            </div>
                        </div>
                        <p className="text-blue-100 text-sm font-medium mb-1">Payments Collected</p>
                        <p className="text-4xl font-bold">₹{stats.totalPayments.toLocaleString()}</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                <TrendingUp className="w-7 h-7" />
                            </div>
                        </div>
                        <p className="text-purple-100 text-sm font-medium mb-1">Avg Conversion Rate</p>
                        <p className="text-4xl font-bold">{stats.avgConversion.toFixed(1)}%</p>
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
                        const colorClass = type === 'DOCTOR' ? 'blue' : type === 'NURSE' ? 'purple' : 'emerald';

                        return (
                            <div
                                key={staff.id}
                                className={`relative overflow-hidden bg-gradient-to-br from-${colorClass}-50 to-white rounded-2xl border-2 border-${colorClass}-200 p-6 hover:shadow-xl transition-all transform hover:-translate-y-1`}
                            >
                                {/* Rank Badge for Top 3 */}
                                {index < 3 && (
                                    <div className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                            index === 1 ? 'bg-gray-300 text-gray-700' :
                                                'bg-orange-400 text-orange-900'
                                        }`}>
                                        {index + 1}
                                    </div>
                                )}

                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl bg-${colorClass}-100 text-${colorClass}-600`}>
                                        {(staff.first_name && staff.first_name.length > 0) ? staff.first_name[0].toUpperCase() : '?'}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-900 text-lg">
                                            {staff.first_name || 'Unknown'} {staff.last_name || ''}
                                        </h4>
                                        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">{staff.role_detail}</p>
                                    </div>
                                </div>

                                {/* Key Metrics - Type Specific */}
                                {type === 'DOCTOR' && (
                                    <div className="space-y-3 mb-4">
                                        <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-blue-100">
                                            <span className="text-sm text-gray-600">Patients</span>
                                            <span className="text-lg font-bold text-blue-600">{staff.task_count}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-emerald-100">
                                            <span className="text-sm text-gray-600">Revenue</span>
                                            <span className="text-lg font-bold text-emerald-600">₹{parseFloat(staff.performance_metric || '0').toLocaleString()}</span>
                                        </div>
                                    </div>
                                )}

                                {type === 'NURSE' && (
                                    <div className="space-y-3 mb-4">
                                        <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-purple-100">
                                            <span className="text-sm text-gray-600">Labs Done</span>
                                            <span className="text-lg font-bold text-purple-600">{staff.labs_completed || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-blue-100">
                                            <span className="text-sm text-gray-600">Vitals</span>
                                            <span className="text-lg font-bold text-blue-600">{staff.patients_vitals_handled || 0}</span>
                                        </div>
                                    </div>
                                )}

                                {type === 'RECEPTIONIST' && (
                                    <div className="space-y-3 mb-4">
                                        <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-emerald-100">
                                            <span className="text-sm text-gray-600">Bookings</span>
                                            <span className="text-lg font-bold text-emerald-600">{staff.total_confirmed || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-blue-100">
                                            <span className="text-sm text-gray-600">Payments</span>
                                            <span className="text-lg font-bold text-blue-600">₹{parseFloat(staff.payments_collected || '0').toLocaleString()}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Additional Badges */}
                                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                                    {type === 'DOCTOR' && (
                                        <>
                                            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold">
                                                Walk-in: {staff.walk_in_count || 0}
                                            </span>
                                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold">
                                                Referral: {staff.referral_count || 0}
                                            </span>
                                        </>
                                    )}
                                    {type === 'NURSE' && (
                                        <>
                                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold">
                                                Present: {staff.performance_metric || 0}
                                            </span>
                                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-semibold">
                                                Late: {staff.late_days || 0}
                                            </span>
                                        </>
                                    )}
                                    {type === 'RECEPTIONIST' && (
                                        <>
                                            <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-lg text-xs font-semibold">
                                                OPD: {staff.opd_checkins || 0}
                                            </span>
                                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold">
                                                Cancelled: {staff.cancellations_handled || 0}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}