// import React from 'react';
// import {
//     LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
//     PieChart, Pie, Cell, Legend
// } from 'recharts';
// import { Users, IndianRupee, Activity, TrendingUp, Calendar } from 'lucide-react';

// const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

// interface OverviewProps {
//     data: {
//         summary: {
//             total_opd_visits: string;
//             total_mlc: string;
//             total_revenue: string;
//             unique_patients: string;
//         };
//         doctorStats: Array<{
//             first_name: string;
//             last_name: string;
//             specialization: string;
//             patient_count: string;
//             revenue_generated: string;
//         }>;
//         deptStats: Array<{
//             department_name: string;
//             patient_count: string;
//         }>;
//         trends: Array<{
//             period_label: string;
//             count: string;
//         }>;
//     };
// }

// export default function OverviewPerformance({ data }: OverviewProps) {
//     if (!data) return null;

//     const { summary, doctorStats, deptStats, trends } = data;

//     // Format trends for chart
//     const trendData = trends?.map(t => ({
//         name: t.period_label,
//         Visits: parseInt(t.count)
//     })) || [];

//     // Format department data for pie chart
//     const pieData = deptStats?.map(d => ({
//         name: d.department_name,
//         value: parseInt(d.patient_count)
//     })) || [];

//     return (
//         <div className="space-y-8 animate-in fade-in duration-500">
//             {/* KPI Cards */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//                 <KPICard
//                     title="Total Revenue"
//                     value={`₹${parseFloat(summary?.total_revenue || '0').toLocaleString()}`}
//                     icon={IndianRupee}
//                     color="text-emerald-600"
//                     bgColor="bg-emerald-50"
//                     borderColor="border-emerald-100"
//                 />
//                 <KPICard
//                     title="OPD Visits"
//                     value={summary?.total_opd_visits || '0'}
//                     icon={Users}
//                     color="text-blue-600"
//                     bgColor="bg-blue-50"
//                     borderColor="border-blue-100"
//                 />
//                 <KPICard
//                     title="Unique Patients"
//                     value={summary?.unique_patients || '0'}
//                     icon={Activity}
//                     color="text-purple-600"
//                     bgColor="bg-purple-50"
//                     borderColor="border-purple-100"
//                 />
//                 <KPICard
//                     title="MLC Cases"
//                     value={summary?.total_mlc || '0'}
//                     icon={TrendingUp} // Using generic icon for now
//                     color="text-amber-600"
//                     bgColor="bg-amber-50"
//                     borderColor="border-amber-100"
//                 />
//             </div>

//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//                 {/* Trend Chart */}
//                 <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-white/60 shadow-sm">
//                     <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
//                         <Calendar className="w-5 h-5 text-blue-500" />
//                         Patient Volume Trend
//                     </h3>
//                     <div className="h-80">
//                         <ResponsiveContainer width="100%" height="100%">
//                             <LineChart data={trendData}>
//                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200,200,200,0.2)" />
//                                 <XAxis
//                                     dataKey="name"
//                                     tick={{ fontSize: 12 }}
//                                     tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
//                                     axisLine={false}
//                                     tickLine={false}
//                                 />
//                                 <YAxis axisLine={false} tickLine={false} />
//                                 <RechartsTooltip
//                                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
//                                 />
//                                 <Line
//                                     type="monotone"
//                                     dataKey="Visits"
//                                     stroke="#3b82f6"
//                                     strokeWidth={3}
//                                     dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4, stroke: '#fff' }}
//                                     activeDot={{ r: 6 }}
//                                 />
//                             </LineChart>
//                         </ResponsiveContainer>
//                     </div>
//                 </div>

//                 {/* Department Distribution */}
//                 <div className="glass-panel p-6 rounded-3xl border border-white/60 shadow-sm">
//                     <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
//                         <Activity className="w-5 h-5 text-purple-500" />
//                         Department Split
//                     </h3>
//                     <div className="h-80">
//                         <ResponsiveContainer width="100%" height="100%">
//                             <PieChart>
//                                 <Pie
//                                     data={pieData}
//                                     cx="50%"
//                                     cy="50%"
//                                     innerRadius={60}
//                                     outerRadius={100}
//                                     paddingAngle={5}
//                                     dataKey="value"
//                                 >
//                                     {pieData.map((entry, index) => (
//                                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                                     ))}
//                                 </Pie>
//                                 <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
//                                 <Legend verticalAlign="bottom" height={36} />
//                             </PieChart>
//                         </ResponsiveContainer>
//                     </div>
//                 </div>
//             </div>

//             {/* Top Doctors Table */}
//             <div className="glass-panel rounded-3xl border border-white/60 overflow-hidden shadow-sm">
//                 <div className="p-6 border-b border-gray-100">
//                     <h3 className="text-lg font-bold text-slate-800">Top Performing Doctors</h3>
//                 </div>
//                 <div className="overflow-x-auto">
//                     <table className="w-full text-left text-sm text-gray-600">
//                         <thead className="bg-gray-50/50 text-xs uppercase font-semibold text-gray-500">
//                             <tr>
//                                 <th className="px-6 py-4">Doctor Name</th>
//                                 <th className="px-6 py-4">Specialization</th>
//                                 <th className="px-6 py-4 text-right">Patients Seen</th>
//                                 <th className="px-6 py-4 text-right">Revenue Generated</th>
//                             </tr>
//                         </thead>
//                         <tbody className="divide-y divide-gray-100">
//                             {doctorStats?.slice(0, 5).map((doc, idx) => (
//                                 <tr key={idx} className="hover:bg-gray-50/50 transition">
//                                     <td className="px-6 py-4 font-medium text-gray-900">
//                                         Dr. {doc.first_name} {doc.last_name}
//                                     </td>
//                                     <td className="px-6 py-4">
//                                         <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100">
//                                             {doc.specialization}
//                                         </span>
//                                     </td>
//                                     <td className="px-6 py-4 text-right font-semibold">{doc.patient_count}</td>
//                                     <td className="px-6 py-4 text-right font-bold text-emerald-600">
//                                         ₹{parseFloat(doc.revenue_generated || '0').toLocaleString()}
//                                     </td>
//                                 </tr>
//                             ))}
//                             {(!doctorStats || doctorStats.length === 0) && (
//                                 <tr>
//                                     <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
//                                         No doctor data available for this period.
//                                     </td>
//                                 </tr>
//                             )}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//         </div>
//     );
// }

// function KPICard({ title, value, icon: Icon, color, bgColor, borderColor }: any) {
//     return (
//         <div className={`p-6 rounded-2xl border ${borderColor} ${bgColor} flex items-center justify-between hover:shadow-md transition-all duration-300`}>
//             <div>
//                 <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">{title}</p>
//                 <h3 className={`text-3xl font-bold ${color}`}>{value}</h3>
//             </div>
//             <div className={`p-3 rounded-xl bg-white/60 ${color}`}>
//                 <Icon className="w-6 h-6" />
//             </div>
//         </div>
//     );
// }


import React, { useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, IndianRupee, Activity, TrendingUp, Calendar } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

interface OverviewProps {
    data: {
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
    };
}

export default function OverviewPerformance({ data }: OverviewProps) {
    // Debug: Log the data whenever it changes
    useEffect(() => {
        console.log('OverviewPerformance received new data:', data);
        console.log('Summary:', data?.summary);
        console.log('Trends:', data?.trends);
        console.log('DeptStats:', data?.deptStats);
        console.log('DoctorStats:', data?.doctorStats);
    }, [data]);

    if (!data) {
        console.log('OverviewPerformance: No data available');
        return null;
    }

    const { summary, doctorStats, deptStats, trends } = data;

    // Format trends for chart - handle the data more carefully
    const trendData = trends?.map((t, idx) => {
        console.log(`Trend ${idx}:`, t);
        return {
            name: t.period_label,
            Visits: parseInt(t.count) || 0
        };
    }) || [];

    console.log('Formatted trend data:', trendData);

    // Format department data for pie chart
    const pieData = deptStats?.map((d, idx) => {
        console.log(`Dept ${idx}:`, d);
        return {
            name: d.department_name,
            value: parseInt(d.patient_count) || 0
        };
    }) || [];

    console.log('Formatted pie data:', pieData);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Debug Info */}
            {/* <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-xs">
                <strong>Debug Info:</strong>
                <div>Total Revenue: {summary?.total_revenue}</div>
                <div>OPD Visits: {summary?.total_opd_visits}</div>
                <div>Trends Count: {trends?.length || 0}</div>
                <div>Departments Count: {deptStats?.length || 0}</div>
                <div>Doctors Count: {doctorStats?.length || 0}</div>
            </div> */}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Total Revenue"
                    value={`₹${parseFloat(summary?.total_revenue || '0').toLocaleString()}`}
                    icon={IndianRupee}
                    color="text-emerald-600"
                    bgColor="bg-emerald-50"
                    borderColor="border-emerald-100"
                />
                <KPICard
                    title="OPD Visits"
                    value={summary?.total_opd_visits || '0'}
                    icon={Users}
                    color="text-blue-600"
                    bgColor="bg-blue-50"
                    borderColor="border-blue-100"
                />
                <KPICard
                    title="Unique Patients"
                    value={summary?.unique_patients || '0'}
                    icon={Activity}
                    color="text-purple-600"
                    bgColor="bg-purple-50"
                    borderColor="border-purple-100"
                />
                <KPICard
                    title="MLC Cases"
                    value={summary?.total_mlc || '0'}
                    icon={TrendingUp}
                    color="text-amber-600"
                    bgColor="bg-amber-50"
                    borderColor="border-amber-100"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Trend Chart */}
                <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-white/60 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        Patient Volume Trend ({trendData.length} data points)
                    </h3>
                    {trendData.length > 0 ? (
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200,200,200,0.2)" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="Visits"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-80 flex items-center justify-center text-gray-400">
                            No trend data available for this period
                        </div>
                    )}
                </div>

                {/* Department Distribution */}
                <div className="glass-panel p-6 rounded-3xl border border-white/60 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-500" />
                        Department Split ({pieData.length} departments)
                    </h3>
                    {pieData.length > 0 ? (
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-80 flex items-center justify-center text-gray-400">
                            No department data available for this period
                        </div>
                    )}
                </div>
            </div>

            {/* Top Doctors Table */}
            <div className="glass-panel rounded-3xl border border-white/60 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-slate-800">Top Performing Doctors ({doctorStats?.length || 0})</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50/50 text-xs uppercase font-semibold text-gray-500">
                            <tr>
                                <th className="px-6 py-4">Doctor Name</th>
                                <th className="px-6 py-4">Specialization</th>
                                <th className="px-6 py-4 text-right">Patients Seen</th>
                                <th className="px-6 py-4 text-right">Revenue Generated</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {doctorStats?.slice(0, 10).map((doc, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/50 transition">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        Dr. {doc.first_name} {doc.last_name}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100">
                                            {doc.specialization}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-semibold">{doc.patient_count}</td>
                                    <td className="px-6 py-4 text-right font-bold text-emerald-600">
                                        ₹{parseFloat(doc.revenue_generated || '0').toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            {(!doctorStats || doctorStats.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                        No doctor data available for this period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, icon: Icon, color, bgColor, borderColor }: any) {
    return (
        <div className={`p-6 rounded-2xl border ${borderColor} ${bgColor} flex items-center justify-between hover:shadow-md transition-all duration-300`}>
            <div>
                <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">{title}</p>
                <h3 className={`text-3xl font-bold ${color}`}>{value}</h3>
            </div>
            <div className={`p-3 rounded-xl bg-white/60 ${color}`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
    );
}