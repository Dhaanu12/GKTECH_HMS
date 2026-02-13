// import React, { useEffect } from 'react';
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
//     // Debug: Log the data whenever it changes
//     useEffect(() => {
//         console.log('OverviewPerformance received new data:', data);
//         console.log('Summary:', data?.summary);
//         console.log('Trends:', data?.trends);
//         console.log('DeptStats:', data?.deptStats);
//         console.log('DoctorStats:', data?.doctorStats);
//     }, [data]);

//     if (!data) {
//         console.log('OverviewPerformance: No data available');
//         return null;
//     }

//     const { summary, doctorStats, deptStats, trends } = data;

//     // Format trends for chart - handle the data more carefully
//     const trendData = trends?.map((t, idx) => {
//         // console.log(`Trend ${idx}:`, t);
//         return {
//             name: t.period_label,
//             Visits: parseInt(t.count) || 0
//         };
//     }) || [];

//     // console.log('Formatted trend data:', trendData);

//     // Format department data for pie chart
//     const pieData = deptStats?.map((d, idx) => {
//         // console.log(`Dept ${idx}:`, d);
//         return {
//             name: d.department_name,
//             value: parseInt(d.patient_count) || 0
//         };
//     }) || [];

//     // console.log('Formatted pie data:', pieData);

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
//                     icon={TrendingUp}
//                     color="text-amber-600"
//                     bgColor="bg-amber-50"
//                     borderColor="border-amber-100"
//                 />
//             </div>

//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//                 {/* Trend Chart */}
//                 <div className="lg:col-span-2 glass-panel pdf-capture p-6 rounded-3xl border border-white/60 shadow-sm">
//                     <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
//                         <Calendar className="w-5 h-5 text-blue-500" />
//                         Patient Volume Trend ({trendData.length} data points)
//                     </h3>
//                     {trendData.length > 0 ? (
//                         <div className="h-80">
//                             <ResponsiveContainer width="100%" height="100%">
//                                 <LineChart data={trendData}>
//                                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200,200,200,0.2)" />
//                                     <XAxis
//                                         dataKey="name"
//                                         tick={{ fontSize: 12 }}
//                                         axisLine={false}
//                                         tickLine={false}
//                                     />
//                                     <YAxis axisLine={false} tickLine={false} />
//                                     <RechartsTooltip
//                                         contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
//                                     />
//                                     <Line
//                                         type="monotone"
//                                         dataKey="Visits"
//                                         stroke="#3b82f6"
//                                         strokeWidth={3}
//                                         dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4, stroke: '#fff' }}
//                                         activeDot={{ r: 6 }}
//                                     />
//                                 </LineChart>
//                             </ResponsiveContainer>
//                         </div>
//                     ) : (
//                         <div className="h-80 flex items-center justify-center text-gray-400">
//                             No trend data available for this period
//                         </div>
//                     )}
//                 </div>

//                 {/* Department Distribution */}
//                 <div className="glass-panel pdf-capture p-6 rounded-3xl border border-white/60 shadow-sm">
//                     <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
//                         <Activity className="w-5 h-5 text-purple-500" />
//                         Department Split ({pieData.length} departments)
//                     </h3>
//                     {pieData.length > 0 ? (
//                         <div className="h-80">
//                             <ResponsiveContainer width="100%" height="100%">
//                                 <PieChart>
//                                     <Pie
//                                         data={pieData}
//                                         cx="50%"
//                                         cy="50%"
//                                         innerRadius={60}
//                                         outerRadius={100}
//                                         paddingAngle={5}
//                                         dataKey="value"
//                                     >
//                                         {pieData.map((entry, index) => (
//                                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                                         ))}
//                                     </Pie>
//                                     <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
//                                     <Legend verticalAlign="bottom" height={36} />
//                                 </PieChart>
//                             </ResponsiveContainer>
//                         </div>
//                     ) : (
//                         <div className="h-80 flex items-center justify-center text-gray-400">
//                             No department data available for this period
//                         </div>
//                     )}
//                 </div>
//             </div>

//             {/* Top Doctors Table */}
//             <div className="glass-panel rounded-3xl border border-white/60 overflow-hidden shadow-sm">
//                 <div className="p-6 border-b border-gray-100">
//                     <h3 className="text-lg font-bold text-slate-800">Top Performing Doctors ({doctorStats?.length || 0})</h3>
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
//                             {doctorStats?.slice(0, 10).map((doc, idx) => (
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
import { Users, IndianRupee, Activity, TrendingUp, Calendar, Award, Stethoscope } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

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

    // Format trends for chart
    const trendData = trends?.map((t, idx) => {
        return {
            name: t.period_label,
            Visits: parseInt(t.count) || 0
        };
    }) || [];

    // Format department data for pie chart
    const pieData = deptStats?.map((d, idx) => {
        return {
            name: d.department_name,
            value: parseInt(d.patient_count) || 0
        };
    }) || [];

    // Calculate totals and rankings for doctors
    const totalDoctorRevenue = doctorStats?.reduce((sum, doc) => sum + parseFloat(doc.revenue_generated || '0'), 0) || 0;
    const totalDoctorPatients = doctorStats?.reduce((sum, doc) => sum + parseInt(doc.patient_count || '0'), 0) || 0;
    const rankedDoctors = [...(doctorStats || [])].sort((a, b) =>
        parseFloat(b.revenue_generated) - parseFloat(a.revenue_generated)
    );

    return (
        <div className="space-y-6">
            {/* Enhanced KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <IndianRupee className="w-8 h-8" />
                        </div>
                        <TrendingUp className="w-6 h-6 opacity-50" />
                    </div>
                    <p className="text-emerald-100 text-sm font-medium mb-1">Total Revenue</p>
                    <p className="text-4xl font-bold">₹{parseFloat(summary?.total_revenue || '0').toLocaleString()}</p>
                    <p className="text-emerald-100 text-xs mt-2">All departments combined</p>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <Users className="w-8 h-8" />
                        </div>
                        <Activity className="w-6 h-6 opacity-50" />
                    </div>
                    <p className="text-blue-100 text-sm font-medium mb-1">OPD Visits</p>
                    <p className="text-4xl font-bold">{summary?.total_opd_visits || '0'}</p>
                    <p className="text-blue-100 text-xs mt-2">{summary?.unique_patients || '0'} unique patients</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <Activity className="w-8 h-8" />
                        </div>
                        <TrendingUp className="w-6 h-6 opacity-50" />
                    </div>
                    <p className="text-purple-100 text-sm font-medium mb-1">Unique Patients</p>
                    <p className="text-4xl font-bold">{summary?.unique_patients || '0'}</p>
                    <p className="text-purple-100 text-xs mt-2">Total registered patients</p>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <Activity className="w-6 h-6 opacity-50" />
                    </div>
                    <p className="text-amber-100 text-sm font-medium mb-1">MLC Cases</p>
                    <p className="text-4xl font-bold">{summary?.total_mlc || '0'}</p>
                    <p className="text-amber-100 text-xs mt-2">Medico-legal cases</p>
                </div>
            </div>

            {/* Main Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trend Chart - Takes 2 columns */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Patient Volume Trend</h3>
                            <p className="text-sm text-gray-500">{trendData.length} data points</p>
                        </div>
                    </div>
                    {trendData.length > 0 ? (
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
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
                        <div className="h-80 flex items-center justify-center">
                            <div className="text-center">
                                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-400 font-medium">No trend data available for this period</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Department Distribution */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl text-white shadow-lg">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Department Split</h3>
                            <p className="text-sm text-gray-500">{pieData.length} departments</p>
                        </div>
                    </div>
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
                        <div className="h-80 flex items-center justify-center">
                            <div className="text-center">
                                <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-400 font-medium">No department data available</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Top Doctors Rankings */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top by Revenue */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Award className="w-5 h-5 text-emerald-600" />
                        <h3 className="text-lg font-bold text-emerald-900">Top Revenue Generators</h3>
                    </div>
                    <div className="space-y-3">
                        {rankedDoctors.slice(0, 3).map((doc, index) => (
                            <div key={index} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                    index === 1 ? 'bg-gray-300 text-gray-700' :
                                        'bg-orange-400 text-orange-900'
                                    }`}>
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900 text-sm">Dr. {doc.first_name} {doc.last_name}</p>
                                    <p className="text-emerald-600 font-bold text-xs">₹{parseFloat(doc.revenue_generated || '0').toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top by Patients */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-bold text-blue-900">Most Patients Seen</h3>
                    </div>
                    <div className="space-y-3">
                        {[...(doctorStats || [])].sort((a, b) => parseInt(b.patient_count) - parseInt(a.patient_count)).slice(0, 3).map((doc, index) => (
                            <div key={index} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                    index === 1 ? 'bg-gray-300 text-gray-700' :
                                        'bg-orange-400 text-orange-900'
                                    }`}>
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900 text-sm">Dr. {doc.first_name} {doc.last_name}</p>
                                    <p className="text-blue-600 font-bold text-xs">{doc.patient_count} patients</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Specialization Diversity */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Stethoscope className="w-5 h-5 text-purple-600" />
                        <h3 className="text-lg font-bold text-purple-900">Active Specializations</h3>
                    </div>
                    <div className="space-y-3">
                        {[...new Set(doctorStats?.map(d => d.specialization) || [])].slice(0, 3).map((spec, index) => {
                            const specDocs = doctorStats?.filter(d => d.specialization === spec) || [];
                            const specPatients = specDocs.reduce((sum, d) => sum + parseInt(d.patient_count || '0'), 0);
                            return (
                                <div key={index} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                        index === 1 ? 'bg-gray-300 text-gray-700' :
                                            'bg-orange-400 text-orange-900'
                                        }`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 text-sm">{spec}</p>
                                        <p className="text-purple-600 font-bold text-xs">{specPatients} patients</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Detailed Doctors Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
                    <h3 className="text-xl font-bold text-gray-900">Complete Doctor Performance</h3>
                    <p className="text-sm text-gray-600 mt-1">Detailed metrics for all medical professionals</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Doctor Name</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Specialization</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Patients Seen</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Revenue Generated</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Performance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {doctorStats?.slice(0, 10).map((doc, idx) => {
                                const revenueRank = rankedDoctors.findIndex(d => d.first_name === doc.first_name && d.last_name === doc.last_name) + 1;
                                return (
                                    <tr key={idx} className="hover:bg-blue-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Stethoscope className="w-5 h-5 text-blue-500" />
                                                <span className="font-semibold text-gray-900">Dr. {doc.first_name} {doc.last_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                                                {doc.specialization}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-semibold text-gray-700 text-lg">
                                            {doc.patient_count}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-bold text-emerald-600 text-lg">
                                                ₹{parseFloat(doc.revenue_generated || '0').toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {revenueRank <= 3 && (
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${revenueRank === 1 ? 'bg-yellow-100 text-yellow-800' :
                                                        revenueRank === 2 ? 'bg-gray-200 text-gray-700' :
                                                            'bg-orange-100 text-orange-800'
                                                        }`}>
                                                        #{revenueRank} Revenue
                                                    </span>
                                                )}
                                                <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                                    Active
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {(!doctorStats || doctorStats.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center">
                                        <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-400 font-medium">No doctor data available for this period</p>
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