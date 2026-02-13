import React from 'react';
import {
    LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, PieChart as PieIcon } from 'lucide-react';

// Shared card component
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

export const RevenueTrendChart = ({ data }: { data: any[] }) => {
    return (
        <div className="h-full">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Revenue Trend</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} name="This Year" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export const RevenueBreakdownPie = ({ revenue, breakdown }: { revenue: number, breakdown?: any[] }) => {
    // Colors from design: Consultation: #3b82f6, Lab: #10b981, Procedures: #f59e0b, Insurance: #8b5cf6
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

    const data = breakdown && breakdown.length > 0 ? breakdown : [
        { name: 'No Data', value: 100, color: '#e2e8f0' }
    ];

    // Assign colors if not present in data
    const coloredData = data.map((item, index) => ({
        ...item,
        color: item.color || COLORS[index % COLORS.length]
    }));

    // Calculate total for percentages
    const totalValue = coloredData.reduce((sum, item) => sum + Number(item.value), 0);

    return (
        <div className="h-full">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Revenue Breakdown</h3>
            <div className="h-48 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={coloredData}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {coloredData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                    <span className="text-xl font-bold text-slate-800">₹{(revenue / 1000).toFixed(1)}k</span>
                    <span className="text-xs text-slate-400">Total</span>
                </div>
            </div>
            <div className="mt-4 space-y-2">
                {coloredData.map(item => (
                    <div key={item.name} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-slate-600">{item.name}</span>
                        </div>
                        <span className="font-semibold text-slate-800">
                            {totalValue > 0 ? Math.round((Number(item.value) / totalValue) * 100) : 0}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
