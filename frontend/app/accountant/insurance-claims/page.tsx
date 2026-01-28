'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, PieChart, TrendingUp, FileText } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import HospitalBranchChart from '../../../components/charts/HospitalBranchChart';
import InsurerComparisonChart from '../../../components/charts/InsurerComparisonChart';
import BranchInsurerChart from '../../../components/charts/BranchInsurerChart';

const API_URL = 'http://localhost:5000/api';

export default function InsuranceClaimsPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'data' | 'analytics'>('data');
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'data') {
            fetchClaims();
        }
    }, [activeTab]);

    const fetchClaims = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/accountant/claims`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClaims(response.data.data || []);
        } catch (error) {
            console.error('Error fetching claims:', error);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'data', label: 'Claims Data', icon: FileText },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 }
    ];

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Insurance Claims</h1>
                <p className="text-gray-600 text-sm mt-1">View claims data and analytics</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative
                                ${activeTab === tab.id
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            {activeTab === 'data' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold mb-4">Claims Data</h2>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">S.No</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">IP No</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Patient</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Insurance</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Bill Amount</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Approval</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Received</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {claims.map((claim: any) => (
                                        <tr key={claim.claim_id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4">{claim.s_no}</td>
                                            <td className="py-3 px-4">{claim.ip_no}</td>
                                            <td className="py-3 px-4">{claim.patient_name}</td>
                                            <td className="py-3 px-4">{claim.insurance_name}</td>
                                            <td className="py-3 px-4">₹{claim.bill_amount?.toLocaleString()}</td>
                                            <td className="py-3 px-4">₹{claim.approval_amount?.toLocaleString()}</td>
                                            <td className="py-3 px-4">₹{claim.amount_received?.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {claims.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center text-gray-500">
                                                No claims found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'analytics' && (
                <div className="space-y-6">
                    {/* Hospital vs Branch Analytics */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="w-6 h-6 text-blue-600" />
                            <h2 className="text-xl font-semibold">Hospital vs Branch Comparison</h2>
                        </div>
                        <HospitalBranchChart />
                    </div>

                    {/* Hospital-wide Insurer Comparison */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <PieChart className="w-6 h-6 text-blue-600" />
                            <h2 className="text-xl font-semibold">Hospital-Wide Insurer Comparison</h2>
                        </div>
                        <InsurerComparisonChart />
                    </div>

                    {/* Branch-Specific Insurer Comparison */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                            <h2 className="text-xl font-semibold">Branch-Specific Insurer Comparison</h2>
                        </div>
                        <BranchInsurerChart />
                    </div>
                </div>
            )}
        </div>
    );
}
