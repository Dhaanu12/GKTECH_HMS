// import React from 'react';
// import {
//     BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
//     PieChart, Pie, Cell
// } from 'recharts';
// import { TrendingUp, Users, IndianRupee } from 'lucide-react';

// const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// interface BranchData {
//     branch_name: string;
//     total_revenue: string;
//     total_appointments: string;
//     unique_patients: string;
// }

// interface Props {
//     data: BranchData[];
// }

// export default function BranchPerformance({ data }: Props) {
//     if (!data || !Array.isArray(data)) return <div className="p-4 text-center text-gray-500">No data available</div>;

//     const chartData = data.map(d => ({
//         name: d.branch_name,
//         Revenue: parseFloat(d.total_revenue),
//         Appointments: parseInt(d.total_appointments),
//         Patients: parseInt(d.unique_patients)
//     }));

//     return (
//         <div className="space-y-8">
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//                 {/* Revenue Comparison */}
//                 {/* Revenue Comparison */}
//                 <div className="glass-panel pdf-capture p-6 rounded-3xl border border-white/60">
//                     <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
//                         <IndianRupee className="w-5 h-5 text-emerald-500" />
//                         Revenue by Branch
//                     </h3>
//                     <div className="h-80">
//                         <ResponsiveContainer width="100%" height="100%">
//                             <BarChart data={chartData}>
//                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200,200,200,0.2)" />
//                                 <XAxis dataKey="name" axisLine={false} tickLine={false} />
//                                 <YAxis axisLine={false} tickLine={false} />
//                                 <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
//                                 <Bar dataKey="Revenue" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
//                             </BarChart>
//                         </ResponsiveContainer>
//                     </div>
//                 </div>

//                 {/* Patient Volume Comparison */}
//                 {/* Patient Volume Comparison */}
//                 <div className="glass-panel pdf-capture p-6 rounded-3xl border border-white/60">
//                     <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
//                         <Users className="w-5 h-5 text-blue-500" />
//                         Patient Volume
//                     </h3>
//                     <div className="h-80">
//                         <ResponsiveContainer width="100%" height="100%">
//                             <PieChart>
//                                 <Pie
//                                     data={chartData}
//                                     dataKey="Appointments"
//                                     nameKey="name"
//                                     cx="50%"
//                                     cy="50%"
//                                     innerRadius={60}
//                                     outerRadius={100}
//                                     paddingAngle={5}
//                                 >
//                                     {chartData.map((entry, index) => (
//                                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                                     ))}
//                                 </Pie>
//                                 <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
//                                 <Legend verticalAlign="bottom" height={36} />
//                             </PieChart>
//                         </ResponsiveContainer>
//                     </div>
//                 </div>
//             </div>

//             {/* Detailed Table */}
//             <div className="glass-panel rounded-3xl border border-white/60 overflow-hidden">
//                 <div className="p-6 border-b border-gray-100">
//                     <h3 className="text-lg font-bold text-slate-800">Branch Leaderboard</h3>
//                 </div>
//                 <div className="overflow-x-auto">
//                     <table className="w-full text-left text-sm text-gray-600">
//                         <thead className="bg-gray-50/50 text-xs uppercase font-semibold text-gray-500">
//                             <tr>
//                                 <th className="px-6 py-4">Branch Name</th>
//                                 <th className="px-6 py-4 text-right">Total Revenue</th>
//                                 <th className="px-6 py-4 text-right">Appointments</th>
//                                 <th className="px-6 py-4 text-right">Unique Patients</th>
//                                 <th className="px-6 py-4 text-center">Status</th>
//                             </tr>
//                         </thead>
//                         <tbody className="divide-y divide-gray-100">
//                             {chartData.map((row, idx) => (
//                                 <tr key={idx} className="hover:bg-gray-50/50 transition">
//                                     <td className="px-6 py-4 font-medium text-gray-900">{row.name}</td>
//                                     <td className="px-6 py-4 text-right font-bold text-emerald-600">
//                                         ₹{row.Revenue.toLocaleString()}
//                                     </td>
//                                     <td className="px-6 py-4 text-right">{row.Appointments}</td>
//                                     <td className="px-6 py-4 text-right">{row.Patients}</td>
//                                     <td className="px-6 py-4 text-center">
//                                         <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold">
//                                             Active
//                                         </span>
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//         </div>
//     );
// }


import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { TrendingUp, Users, IndianRupee, MapPin, Award, Activity } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

interface BranchData {
    branch_name: string;
    total_revenue: string;
    total_appointments: string;
    unique_patients: string;
}

interface Props {
    data: BranchData[];
}

export default function BranchPerformance({ data }: Props) {
    if (!data || !Array.isArray(data)) {
        return (
            <div className="flex items-center justify-center h-96 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300">
                <div className="text-center">
                    <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-semibold">No branch data available</p>
                </div>
            </div>
        );
    }

    const chartData = data.map(d => ({
        name: d.branch_name,
        revenue: parseFloat(d.total_revenue),
        appointments: parseInt(d.total_appointments),
        patients: parseInt(d.unique_patients),
        revenuePerPatient: parseFloat(d.total_revenue) / parseInt(d.unique_patients) || 0
    }));

    // Calculate totals and rankings
    const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
    const totalAppointments = chartData.reduce((sum, d) => sum + d.appointments, 0);
    const totalPatients = chartData.reduce((sum, d) => sum + d.patients, 0);

    // Rank branches
    const rankedByRevenue = [...chartData].sort((a, b) => b.revenue - a.revenue);
    const rankedByPatients = [...chartData].sort((a, b) => b.patients - a.patients);
    const rankedByEfficiency = [...chartData].sort((a, b) => b.revenuePerPatient - a.revenuePerPatient);

    // Radar chart data for multi-dimensional comparison
    const radarData = chartData.map(branch => ({
        branch: branch.name,
        Revenue: (branch.revenue / Math.max(...chartData.map(d => d.revenue))) * 100,
        Patients: (branch.patients / Math.max(...chartData.map(d => d.patients))) * 100,
        Appointments: (branch.appointments / Math.max(...chartData.map(d => d.appointments))) * 100,
        Efficiency: (branch.revenuePerPatient / Math.max(...chartData.map(d => d.revenuePerPatient))) * 100
    }));

    return (
        <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <IndianRupee className="w-8 h-8" />
                        </div>
                        <TrendingUp className="w-6 h-6 opacity-50" />
                    </div>
                    <p className="text-emerald-100 text-sm font-medium mb-1">Total Revenue</p>
                    <p className="text-4xl font-bold">₹{totalRevenue.toLocaleString()}</p>
                    <p className="text-emerald-100 text-xs mt-2">Across all branches</p>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <Users className="w-8 h-8" />
                        </div>
                        <Activity className="w-6 h-6 opacity-50" />
                    </div>
                    <p className="text-blue-100 text-sm font-medium mb-1">Total Patients</p>
                    <p className="text-4xl font-bold">{totalPatients.toLocaleString()}</p>
                    <p className="text-blue-100 text-xs mt-2">{totalAppointments} appointments</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <Award className="w-8 h-8" />
                        </div>
                        <MapPin className="w-6 h-6 opacity-50" />
                    </div>
                    <p className="text-purple-100 text-sm font-medium mb-1">Active Branches</p>
                    <p className="text-4xl font-bold">{data.length}</p>
                    <p className="text-purple-100 text-xs mt-2">Nationwide network</p>
                </div>
            </div>

            {/* Main Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Comparison - Horizontal Bar */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white shadow-lg">
                            <IndianRupee className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Revenue by Branch</h3>
                            <p className="text-sm text-gray-500">Total earnings comparison</p>
                        </div>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={rankedByRevenue} layout="vertical" margin={{ left: 80 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                <XAxis type="number" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip
                                    formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="revenue" fill="url(#revenueGradient)" radius={[0, 8, 8, 0]} />
                                <defs>
                                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#10b981" />
                                        <stop offset="100%" stopColor="#14b8a6" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Patient Distribution - Donut Chart */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Patient Distribution</h3>
                            <p className="text-sm text-gray-500">Share across branches</p>
                        </div>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    dataKey="patients"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={110}
                                    paddingAngle={3}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: any) => [value, 'Patients']}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Revenue per Patient - Efficiency Chart */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl text-white shadow-lg">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Revenue Efficiency</h3>
                            <p className="text-sm text-gray-500">Average revenue per patient</p>
                        </div>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={rankedByEfficiency}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                                <YAxis tickFormatter={(value) => `₹${value}`} />
                                <Tooltip
                                    formatter={(value: any) => [`₹${value.toFixed(2)}`, 'Avg/Patient']}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="revenuePerPatient" fill="url(#efficiencyGradient)" radius={[8, 8, 0, 0]} />
                                <defs>
                                    <linearGradient id="efficiencyGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#a855f7" />
                                        <stop offset="100%" stopColor="#ec4899" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Multi-dimensional Radar Chart */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl text-white shadow-lg">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Performance Radar</h3>
                            <p className="text-sm text-gray-500">Multi-factor comparison</p>
                        </div>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis dataKey="branch" tick={{ fontSize: 11 }} />
                                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                <Legend />
                                {chartData.map((branch, index) => (
                                    <Radar
                                        key={index}
                                        name={branch.name}
                                        dataKey="Revenue"
                                        stroke={COLORS[index % COLORS.length]}
                                        fill={COLORS[index % COLORS.length]}
                                        fillOpacity={0.2}
                                    />
                                ))}
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Rankings Table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top by Revenue */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Award className="w-5 h-5 text-emerald-600" />
                        <h3 className="text-lg font-bold text-emerald-900">Top Revenue</h3>
                    </div>
                    <div className="space-y-3">
                        {rankedByRevenue.slice(0, 3).map((branch, index) => (
                            <div key={index} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                        index === 1 ? 'bg-gray-300 text-gray-700' :
                                            'bg-orange-400 text-orange-900'
                                    }`}>
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900 text-sm">{branch.name}</p>
                                    <p className="text-emerald-600 font-bold text-xs">₹{branch.revenue.toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top by Patients */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-bold text-blue-900">Most Patients</h3>
                    </div>
                    <div className="space-y-3">
                        {rankedByPatients.slice(0, 3).map((branch, index) => (
                            <div key={index} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                        index === 1 ? 'bg-gray-300 text-gray-700' :
                                            'bg-orange-400 text-orange-900'
                                    }`}>
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900 text-sm">{branch.name}</p>
                                    <p className="text-blue-600 font-bold text-xs">{branch.patients} patients</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Most Efficient */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                        <h3 className="text-lg font-bold text-purple-900">Most Efficient</h3>
                    </div>
                    <div className="space-y-3">
                        {rankedByEfficiency.slice(0, 3).map((branch, index) => (
                            <div key={index} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                        index === 1 ? 'bg-gray-300 text-gray-700' :
                                            'bg-orange-400 text-orange-900'
                                    }`}>
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900 text-sm">{branch.name}</p>
                                    <p className="text-purple-600 font-bold text-xs">₹{branch.revenuePerPatient.toFixed(0)}/patient</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detailed Comparison Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
                    <h3 className="text-xl font-bold text-gray-900">Complete Branch Comparison</h3>
                    <p className="text-sm text-gray-600 mt-1">Detailed performance metrics for all locations</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Branch</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Revenue</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Patients</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Appointments</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Avg/Patient</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Performance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {chartData.map((branch, idx) => {
                                const revenueRank = rankedByRevenue.findIndex(b => b.name === branch.name) + 1;
                                return (
                                    <tr key={idx} className="hover:bg-blue-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <MapPin className="w-5 h-5 text-blue-500" />
                                                <span className="font-semibold text-gray-900">{branch.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-bold text-emerald-600 text-lg">
                                                ₹{branch.revenue.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-semibold text-gray-700">
                                            {branch.patients.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right font-semibold text-gray-700">
                                            {branch.appointments.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-purple-600">
                                            ₹{branch.revenuePerPatient.toFixed(0)}
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
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}