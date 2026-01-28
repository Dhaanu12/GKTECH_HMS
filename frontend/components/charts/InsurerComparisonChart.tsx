'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Loader2 } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const COLORS = ['#2563eb', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#ec4899', '#6366f1'];

export default function InsurerComparisonChart() {
    const [data, setData] = useState<any>({ insurers: [], summary: {} });
    const [loading, setLoading] = useState(true);
    const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/accountant/analytics/insurers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(response.data.data);
        } catch (error) {
            console.error('Error fetching insurer analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const pieData = data.insurers.map((insurer: any) => ({
        name: insurer.insurance_name,
        value: insurer.total_claims
    }));

    return (
        <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                    <p className="text-sm text-blue-700 font-medium">Total Insurers</p>
                    <p className="text-2xl font-bold text-blue-900">{data.summary.total_insurers || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                    <p className="text-sm text-blue-700 font-medium">Total Claims</p>
                    <p className="text-2xl font-bold text-blue-900">{data.summary.total_claims?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                    <p className="text-sm text-purple-700 font-medium">Total Bill Amount</p>
                    <p className="text-2xl font-bold text-purple-900">₹{data.summary.total_bill_amount?.toLocaleString() || 0}</p>
                </div>
            </div>

            {/* Chart Type Toggle */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setChartType('pie')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${chartType === 'pie'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Pie Chart
                </button>
                <button
                    onClick={() => setChartType('bar')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${chartType === 'bar'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Bar Chart
                </button>
            </div>

            {data.insurers.length > 0 ? (
                <div>
                    {chartType === 'pie' ? (
                        <ResponsiveContainer width="100%" height={400}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={true}
                                    label={(entry) => `${entry.name}: ${entry.value}`}
                                    outerRadius={120}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {pieData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={data.insurers} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="insurance_name"
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                    fontSize={12}
                                />
                                <YAxis />
                                <Tooltip formatter={(value: any) => value.toLocaleString()} />
                                <Legend />
                                <Bar dataKey="total_claims" fill={COLORS[0]} name="Total Claims" />
                                <Bar dataKey="total_bill_amount" fill={COLORS[1]} name="Bill Amount (₹)" />
                                <Bar dataKey="total_approval_amount" fill={COLORS[2]} name="Approval Amount (₹)" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}

                    {/* Detailed Table */}
                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Insurer</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-700">Claims</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-700">Bill Amount</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-700">Approval</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-700">Received</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-700">Pending</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.insurers.map((insurer: any, idx: number) => (
                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 font-medium">{insurer.insurance_name}</td>
                                        <td className="py-3 px-4 text-right">{insurer.total_claims}</td>
                                        <td className="py-3 px-4 text-right">₹{insurer.total_bill_amount?.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-right">₹{insurer.total_approval_amount?.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-right">₹{insurer.total_amount_received?.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-right text-orange-600">₹{insurer.total_pending_amount?.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    No data available
                </div>
            )}
        </div>
    );
}
