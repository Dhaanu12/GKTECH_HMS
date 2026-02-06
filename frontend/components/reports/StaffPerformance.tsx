import React, { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { UserCheck, Clock, Activity, Search } from 'lucide-react';

interface StaffData {
    id: number;
    first_name: string;
    last_name: string;
    role_detail: string; // Specialization for Doctor, "Nurse" for Nurse
    task_count: string; // Patients Seen / Shifts / Bookings
    performance_metric: string; // Revenue / Attendance / null
}

interface Props {
    data: StaffData[];
    type: 'DOCTOR' | 'NURSE' | 'RECEPTIONIST';
}

export default function StaffPerformance({ data, type }: Props) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = data.filter(d =>
        `${d.first_name} ${d.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const chartData = filteredData.map(d => ({
        name: `${d.first_name} ${d.last_name}`,
        Count: parseInt(d.task_count),
        Metric: parseFloat(d.performance_metric || '0')
    })).sort((a, b) => b.Metric - a.Metric).slice(0, 10); // Top 10

    const metricLabel = type === 'DOCTOR' ? 'Revenue (₹)' : type === 'NURSE' ? 'Present Days' : 'Performance';
    const countLabel = type === 'DOCTOR' ? 'Patients Seen' : type === 'NURSE' ? 'Shifts Assigned' : 'Appointments Booked';

    return (
        <div className="space-y-8">
            {/* Controls */}
            <div className="flex justify-end">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search staff..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>
            </div>

            {/* Performance Chart */}
            <div className="glass-panel p-6 rounded-3xl border border-white/60">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    Top Performers ({type === 'DOCTOR' ? 'Revenue' : 'Activity'})
                </h3>
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="rgba(200,200,200,0.2)" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                            <Legend />
                            <Bar dataKey="Metric" name={metricLabel} fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                            <Bar dataKey="Count" name={countLabel} fill="#cbd5e1" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Detailed List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredData.map((staff) => (
                    <div key={staff.id} className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">
                            {staff.first_name[0]}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-800">{staff.first_name} {staff.last_name}</h4>
                            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">{staff.role_detail}</p>

                            <div className="mt-3 flex items-center justify-between text-sm">
                                <div className="flex flex-col">
                                    <span className="text-gray-400 text-xs">{countLabel}</span>
                                    <span className="font-semibold text-gray-700">{staff.task_count}</span>
                                </div>
                                {(type === 'DOCTOR' || type === 'NURSE') && (
                                    <div className="flex flex-col text-right">
                                        <span className="text-gray-400 text-xs">{metricLabel}</span>
                                        <span className={`font-bold ${type === 'DOCTOR' ? 'text-emerald-600' : 'text-blue-600'}`}>
                                            {type === 'DOCTOR' && '₹'}{parseFloat(staff.performance_metric).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
