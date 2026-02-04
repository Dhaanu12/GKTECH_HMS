'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Loader2 } from 'lucide-react';

const COLORS = [
    '#2563eb', // blue
    '#10b981', // green
    '#8b5cf6', // purple
    '#f59e0b', // amber
    '#ef4444', // red
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#6366f1'  // indigo
];

export default function InsurersDistributionChart() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/accountant/analytics/insurers', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const rawData = response.data.data.insurers;
            // Get top 5 + Others
            const sortedData = [...rawData].sort((a, b) => b.total_bill_amount - a.total_bill_amount);

            if (sortedData.length > 6) {
                const top5 = sortedData.slice(0, 5);
                const others = sortedData.slice(5).reduce((acc, curr) => ({
                    insurance_name: 'Others',
                    total_bill_amount: acc.total_bill_amount + curr.total_bill_amount,
                }), { insurance_name: 'Others', total_bill_amount: 0 });

                setData([...top5, others]);
            } else {
                setData(sortedData);
            }
        } catch (error) {
            console.error('Error fetching insurer distribution:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[300px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const chartData = data.map(item => ({
        name: item.insurance_name,
        value: item.total_bill_amount
    }));

    return (
        <div className="h-full flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="40%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={false}
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                                stroke="none"
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: any) => `₹${value.toLocaleString()}`}
                        contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            fontSize: '12px'
                        }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={60}
                        iconType="circle"
                        wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
