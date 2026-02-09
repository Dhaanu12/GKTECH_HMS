import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, Users, IndianRupee } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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
    if (!data || !Array.isArray(data)) return <div className="p-4 text-center text-gray-500">No data available</div>;

    const chartData = data.map(d => ({
        name: d.branch_name,
        Revenue: parseFloat(d.total_revenue),
        Appointments: parseInt(d.total_appointments),
        Patients: parseInt(d.unique_patients)
    }));

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Comparison */}
                <div className="glass-panel p-6 rounded-3xl border border-white/60">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <IndianRupee className="w-5 h-5 text-emerald-500" />
                        Revenue by Branch
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200,200,200,0.2)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="Revenue" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Patient Volume Comparison */}
                <div className="glass-panel p-6 rounded-3xl border border-white/60">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-500" />
                        Patient Volume
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    dataKey="Appointments"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="glass-panel rounded-3xl border border-white/60 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-slate-800">Branch Leaderboard</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50/50 text-xs uppercase font-semibold text-gray-500">
                            <tr>
                                <th className="px-6 py-4">Branch Name</th>
                                <th className="px-6 py-4 text-right">Total Revenue</th>
                                <th className="px-6 py-4 text-right">Appointments</th>
                                <th className="px-6 py-4 text-right">Unique Patients</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {chartData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/50 transition">
                                    <td className="px-6 py-4 font-medium text-gray-900">{row.name}</td>
                                    <td className="px-6 py-4 text-right font-bold text-emerald-600">
                                        ₹{row.Revenue.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">{row.Appointments}</td>
                                    <td className="px-6 py-4 text-right">{row.Patients}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold">
                                            Active
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
