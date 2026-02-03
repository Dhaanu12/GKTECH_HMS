'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function HospitalBranchChart() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [metric, setMetric] = useState<'claims' | 'bill' | 'approval' | 'received'>('claims');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/accountant/analytics/hospital-branch`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const chartData: any[] = [];
            response.data.data.forEach((hospital: any) => {
                hospital.branches.forEach((branch: any) => {
                    chartData.push({
                        name: branch.branch_name,
                        hospital: hospital.hospital_name,
                        branch: branch.branch_name,
                        claims: branch.total_claims,
                        billAmount: branch.total_bill_amount,
                        approvalAmount: branch.total_approval_amount,
                        receivedAmount: branch.total_amount_received
                    });
                });
            });

            setData(chartData);
        } catch (error) {
            console.error('Error fetching hospital-branch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const getMetricData = () => {
        switch (metric) {
            case 'claims':
                return { key: 'claims', label: 'Total Claims', color: '#2563eb' };
            case 'bill':
                return { key: 'billAmount', label: 'Bill Amount (₹)', color: '#3b82f6' };
            case 'approval':
                return { key: 'approvalAmount', label: 'Approval Amount (₹)', color: '#8b5cf6' };
            case 'received':
                return { key: 'receivedAmount', label: 'Received Amount (₹)', color: '#10b981' };
        }
    };

    const metricData = getMetricData();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div>
            {/* Metric Selector */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setMetric('claims')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${metric === 'claims'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Total Claims
                </button>
                <button
                    onClick={() => setMetric('bill')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${metric === 'bill'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Bill Amount
                </button>
                <button
                    onClick={() => setMetric('approval')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${metric === 'approval'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Approval Amount
                </button>
                <button
                    onClick={() => setMetric('received')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${metric === 'received'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Received Amount
                </button>
            </div>

            {data.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="name"
                            height={60}
                            fontSize={12}
                        />
                        <YAxis />
                        <Tooltip
                            formatter={(value: any) =>
                                metric === 'claims' ? value : `₹${value.toLocaleString()}`
                            }
                        />
                        <Legend />
                        <Bar dataKey={metricData.key} fill={metricData.color} name={metricData.label} />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    No data available
                </div>
            )}
        </div>
    );
}
