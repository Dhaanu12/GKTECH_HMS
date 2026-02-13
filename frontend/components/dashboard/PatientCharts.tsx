import React from 'react';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';
import { Users, UserPlus } from 'lucide-react';

const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-100 p-5 ${className}`}>
        {children}
    </div>
);

const SectionHeader = ({ title, icon: Icon }: any) => (
    <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-blue-100 rounded-md text-blue-700">
            <Icon className="w-4 h-4" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
    </div>
);

export const PatientRetentionChart = ({ data }: { data: any[] }) => {
    return (
        <div className="h-full">
            <div className="h-48 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={60}
                            outerRadius={80}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color || ['#3b82f6', '#10b981', '#f59e0b'][index % 3]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                    <span className="text-3xl font-bold text-blue-600">{
                        data.length > 0 ? Math.round((data.find(d => d.name === 'Returning')?.value || 0) / (data.reduce((a, b) => a + b.value, 0) || 1) * 100) : 0
                    }%</span>
                    <span className="text-xs text-slate-400">Retention</span>
                </div>
            </div>
        </div>
    );
};

export const HighValuePatientsTable = ({ data }: { data?: any[] }) => {
    return (
        <div className="h-full">
            <h2 className="font-semibold text-gray-900 mb-4">High-Value Patients (Top 10)</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500">
                        <tr>
                            <th className="px-4 py-2 rounded-l-md">Patient Name</th>
                            <th className="px-4 py-2">Last Visit</th>
                            <th className="px-4 py-2 text-right">Total Spend</th>
                            <th className="px-4 py-2 rounded-r-md text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data && data.length > 0 ? (
                            data.map((patient, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-3 font-medium text-slate-700 capitalize">{patient.name}</td>
                                    <td className="px-4 py-3 text-slate-500">{new Date(patient.last_visit).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 font-semibold text-slate-700 text-right">₹{parseFloat(patient.total_spend).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-center"><span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-xs font-medium">Active</span></td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">No high value patient data available.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
