import React, { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { UserCheck, Clock, Activity, Search } from 'lucide-react';

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
    opd_checkins?: string;
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

    const chartData = filteredData.map(d => ({
        name: `${d.first_name || 'Unknown'} ${d.last_name || ''}`,
        Count: parseInt(d.task_count || '0'),
        Metric: parseFloat(d.performance_metric || '0')
    })).sort((a, b) => b.Metric - a.Metric).slice(0, 10);

    const metricLabel = type === 'DOCTOR' ? 'Revenue (₹)' : type === 'NURSE' ? 'Present Days' : 'Cancellations';
    const countLabel = type === 'DOCTOR' ? 'Patients Seen' : type === 'NURSE' ? 'Shifts Assigned' : 'Actions Performed';

    return (
        <div className="space-y-8">
            {/* Controls */}
            <div className="flex justify-end">
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

            {/* Performance Chart */}
            <div className="glass-panel p-6 rounded-3xl border border-white/60">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    Top Performers
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
                    <div key={staff.id} className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">
                                {(staff.first_name && staff.first_name.length > 0) ? staff.first_name[0] : '?'}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800">{staff.first_name || 'Unknown'} {staff.last_name || ''}</h4>
                                <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">{staff.role_detail}</p>
                            </div>
                        </div>

                        {/* Main Stats */}
                        <div className="flex items-center justify-between text-sm py-2 border-t border-gray-50">
                            <div className="flex flex-col">
                                <span className="text-gray-400 text-xs">{countLabel}</span>
                                <span className="font-semibold text-gray-700">{staff.task_count}</span>
                            </div>
                            <div className="flex flex-col text-right">
                                <span className="text-gray-400 text-xs">{metricLabel}</span>
                                <span className={`font-bold ${type === 'DOCTOR' ? 'text-emerald-600' : 'text-blue-600'}`}>
                                    {type === 'DOCTOR' && '₹'}{parseFloat(staff.performance_metric || '0').toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Detailed Stats Badge Area */}
                        <div className="flex flex-wrap gap-2 text-xs">
                            {/* Doctor Specifics */}
                            {type === 'DOCTOR' && (
                                <>
                                    <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-md border border-amber-100">
                                        Walk-in: <b>{staff.walk_in_count || 0}</b>
                                    </span>
                                    <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md border border-purple-100">
                                        Ref: <b>{staff.referral_count || 0}</b>
                                    </span>
                                    {/* Conversion Rate */}
                                    {parseInt(staff.total_appointments || '0') > 0 && (
                                        <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">
                                            Conv: <b>{Math.round((parseInt(staff.completed_appointments || '0') / parseInt(staff.total_appointments || '1')) * 100)}%</b>
                                        </span>
                                    )}
                                </>
                            )}

                            {/* Nurse Specifics */}
                            {type === 'NURSE' && (
                                <>
                                    <span className="px-2 py-1 bg-red-50 text-red-700 rounded-md border border-red-100">
                                        Late: <b>{staff.late_days || 0}</b>
                                    </span>
                                    <span className="px-2 py-1 bg-gray-50 text-gray-700 rounded-md border border-gray-200">
                                        Absent: <b>{staff.absent_days || 0}</b>
                                    </span>
                                </>
                            )}

                            {/* Receptionist Specifics */}
                            {type === 'RECEPTIONIST' && (
                                <>
                                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                                        Confirmed: <b>{staff.confirmed_appts || 0}</b>
                                    </span>
                                    <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded-md border border-teal-100">
                                        OPD: <b>{staff.opd_checkins || 0}</b>
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
