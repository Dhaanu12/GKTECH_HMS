'use client';

import {
    FileText, Upload, Clock, IndianRupee, AlertCircle,
    Building2, Users, CreditCard, ArrowRight, TrendingUp,
    Briefcase, BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/lib/AuthContext';

interface DashboardStats {
    total_branches: number;
    total_insurers: number;
    total_claims: number;
    total_pending_amount: number;
    total_bill_amount: number;
    hospital_name: string;
    referral_doctors: number;
    referral_payouts: number;
    top_insurers: Array<{
        name: string;
        claims: number;
        pending: number;
        bill: number;
    }>;
    recent_referral_payouts: Array<{
        doctor_name: string;
        amount: number;
    }>;
}

export default function AccountantDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/accountant/dashboard-stats', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 'success') {
                setStats(response.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch dashboard stats', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        if (amount >= 10000000) {
            return `₹${(amount / 10000000).toFixed(2)}Cr`;
        } else if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(2)}L`;
        } else if (amount >= 1000) {
            return `₹${(amount / 1000).toFixed(1)}K`;
        }
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatFullCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="mt-1 text-sm text-gray-500">Overview of claims & referrals</p>
                </div>
                <Link
                    href="/accountant/insurance-claims?upload=true"
                    className="flex items-center gap-2 py-2.5 px-5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 font-medium"
                >
                    <Upload className="w-4 h-4" />
                    Upload Claims
                </Link>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 border border-red-100">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {/* Stats Grid - 5 Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Total Claims */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                            <FileText className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Claims</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats?.total_claims || 0}</h3>
                </div>

                {/* Pending Amount */}
                <div className="bg-gradient-to-br from-red-500 to-rose-600 p-5 rounded-2xl shadow-lg shadow-red-500/20 text-white">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-white/20 rounded-xl">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-xs font-medium text-red-100 uppercase tracking-wide">Pending Amount</p>
                    <h3 className="text-2xl font-bold mt-1">{formatCurrency(stats?.total_pending_amount || 0)}</h3>
                </div>

                {/* Referral Doctors */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Referral Doctors</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats?.referral_doctors || 0}</h3>
                </div>

                {/* Referral Payouts */}
                <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-5 rounded-2xl shadow-lg shadow-emerald-500/20 text-white">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-white/20 rounded-xl">
                            <IndianRupee className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-xs font-medium text-emerald-100 uppercase tracking-wide">This Month Payouts</p>
                    <h3 className="text-2xl font-bold mt-1">{formatCurrency(stats?.referral_payouts || 0)}</h3>
                </div>

                {/* Active Branches */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                            <Building2 className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Branches</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats?.total_branches || 0}</h3>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                    href="/accountant/insurance-claims?upload=true"
                    className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all flex items-center gap-4"
                >
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Upload className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Upload Claims</h3>
                        <p className="text-sm text-gray-500">Import insurance claim files</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 transition-colors" />
                </Link>

                <Link
                    href="/accountant/insurance-claims"
                    className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-green-200 transition-all flex items-center gap-4"
                >
                    <div className="p-3 bg-green-100 text-green-600 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-colors">
                        <CreditCard className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Update Payments</h3>
                        <p className="text-sm text-gray-500">Record received payments</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-green-600 transition-colors" />
                </Link>

                <Link
                    href="/accounts/dashboard"
                    className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-purple-200 transition-all flex items-center gap-4"
                >
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <Users className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Manage Referrals</h3>
                        <p className="text-sm text-gray-500">Configure doctor percentages</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-purple-600 transition-colors" />
                </Link>
            </div>

            {/* Two Column Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Insurance Companies */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <Briefcase className="w-4 h-4" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Top Insurance Companies</h3>
                        </div>
                        <Link href="/accountant/insurance-claims" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {stats?.top_insurers && stats.top_insurers.length > 0 ? (
                            stats.top_insurers.map((insurer, index) => (
                                <div key={insurer.name} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">{insurer.name}</p>
                                            <p className="text-xs text-gray-500">{insurer.claims} claims</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-red-600 text-sm">{formatFullCurrency(insurer.pending)}</p>
                                        <p className="text-xs text-gray-400">pending</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-6 py-12 text-center text-gray-400">
                                <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p>No claims data available</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Referral Payouts */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Top Referral Payouts</h3>
                        </div>
                        <Link href="/accountant/referral-payment/reports" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {stats?.recent_referral_payouts && stats.recent_referral_payouts.length > 0 ? (
                            stats.recent_referral_payouts.map((payout, index) => (
                                <div key={payout.doctor_name} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                                            {payout.doctor_name.charAt(0).toUpperCase()}
                                        </div>
                                        <p className="font-medium text-gray-900 text-sm">{payout.doctor_name}</p>
                                    </div>
                                    <p className="font-semibold text-emerald-600 text-sm">{formatFullCurrency(payout.amount)}</p>
                                </div>
                            ))
                        ) : (
                            <div className="px-6 py-12 text-center text-gray-400">
                                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p>No referral payouts yet</p>
                                <Link href="/accountant/referral-payment/upload" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
                                    Upload bill data →
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Additional Quick Links */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold">Need detailed analytics?</h3>
                        <p className="text-slate-300 text-sm mt-1">View comprehensive reports and insights on claims and referrals</p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href="/accountant/insurance-claims?active=analytics"
                            className="px-5 py-2.5 bg-white text-slate-900 rounded-xl font-medium text-sm hover:bg-slate-100 transition-colors flex items-center gap-2"
                        >
                            <BarChart3 className="w-4 h-4" />
                            Claims Analytics
                        </Link>
                        <Link
                            href="/accountant/insurance-claims"
                            className="px-5 py-2.5 bg-slate-700 text-white rounded-xl font-medium text-sm hover:bg-slate-600 transition-colors flex items-center gap-2"
                        >
                            <FileText className="w-4 h-4" />
                            View Claims
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
