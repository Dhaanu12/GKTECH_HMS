import React from 'react';
import {
    BarChart, Bar, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Stethoscope, Activity } from 'lucide-react';

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

export const TopDiagnosesChart = ({ data }: { data: any[] }) => {
    return (
        <div className="h-full">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Top Diagnoses</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={data}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export const DiseaseTrendChart = ({ data }: { data: any[] }) => {
    // Mock data if empty
    const plotData = data && data.length > 0 ? data : [
        { name: 'W1', cases: 0 }, { name: 'W2', cases: 0 }, { name: 'W3', cases: 0 }, { name: 'W4', cases: 0 }
    ];

    return (
        <div className="h-full">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Disease Trend (Seasonal)</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={plotData}>
                        <defs>
                            <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="cases" stroke="#f59e0b" strokeWidth={3} fill="url(#colorCases)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
