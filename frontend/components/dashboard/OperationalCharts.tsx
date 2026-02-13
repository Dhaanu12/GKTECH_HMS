import React from 'react';
import {
    BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Clock, TrendingUp } from 'lucide-react';

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

export const PeakHoursChart = ({ data }: { data: any[] }) => {
    return (
        <div className="h-full">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Peak Hour Analysis</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="patients" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export const EfficiencyMetrics = ({ metrics }: { metrics?: any }) => {
    return (
        <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
                <p className="text-xs text-gray-600">Avg Consultation</p>
                <p className="font-semibold text-gray-900">{metrics?.avg_consultation_time || 'N/A'}</p>
            </div>
            <div>
                <p className="text-xs text-gray-600">Patients/Doctor/Day</p>
                <p className="font-semibold text-gray-900">{metrics?.patients_per_doctor ? Math.round(metrics.patients_per_doctor) : '0'}</p>
            </div>
            <div>
                <p className="text-xs text-gray-600">Idle Hours</p>
                <p className="font-semibold text-gray-900">{metrics?.idle_hours || 'N/A'}</p>
            </div>
        </div>
    );
};
