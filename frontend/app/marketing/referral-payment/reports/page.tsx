'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/lib/AuthContext';
import { Download, Search, Calendar, Filter, Loader2, IndianRupee } from 'lucide-react';

interface ReportRow {
    header_id: number;
    upload_date: string;
    patient_name: string;
    doctor_name: string;
    medical_council_id: string;
    admission_type: string;
    payment_mode: string;
    total_referral_amount: number;
    service_name: string;
    service_cost: number;
    referral_percentage: number;
    referral_amount: number;
    file_name: string;
}

export default function ReferralPaymentReports() {
    const { user } = useAuth();
    const [reports, setReports] = useState<ReportRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        fromDate: '',
        toDate: '',
        doctorId: ''
    });
    const [doctors, setDoctors] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        fetchDoctors();
        fetchReports();
    }, []);

    const fetchDoctors = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/marketing/referral-doctors', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setDoctors(response.data.data.map((d: any) => ({ id: d.id, name: d.doctor_name })));
            }
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const fetchReports = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (filters.fromDate) params.append('fromDate', filters.fromDate);
            if (filters.toDate) params.append('toDate', filters.toDate);
            if (filters.doctorId) params.append('doctorId', filters.doctorId);

            const response = await axios.get(`/api/referral-payment/reports?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setReports(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const applyFilters = (e: React.FormEvent) => {
        e.preventDefault();
        fetchReports();
    };

    const exportToCSV = () => {
        if (!reports.length) return;

        const headers = ["Date", "Patient", "Doctor", "MCI ID", "Service", "Cost", "Percent", "Ref Amount", "Payment Mode", "File"];
        const csvRows = [headers.join(',')];

        reports.forEach(row => {
            csvRows.push([
                new Date(row.upload_date).toLocaleDateString(),
                `"${row.patient_name}"`,
                `"${row.doctor_name}"`,
                row.medical_council_id,
                `"${row.service_name}"`,
                row.service_cost,
                row.referral_percentage,
                row.referral_amount,
                row.payment_mode,
                `"${row.file_name}"`
            ].join(','));
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `referral_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    // Calculate totals
    const totalAmount = reports.reduce((sum, row) => sum + Number(row.referral_amount), 0);
    const uniqueDoctors = new Set(reports.map(r => r.doctor_name)).size;
    const uniquePatients = new Set(reports.map(r => r.patient_name)).size;

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Referral Payment Reports</h1>
                    <p className="text-gray-600">Track and analyze referral payouts</p>
                </div>
                <button
                    onClick={exportToCSV}
                    disabled={!reports.length}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
                >
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
                <form onSubmit={applyFilters} className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">From Date</label>
                        <input
                            type="date"
                            name="fromDate"
                            value={filters.fromDate}
                            onChange={handleFilterChange}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">To Date</label>
                        <input
                            type="date"
                            name="toDate"
                            value={filters.toDate}
                            onChange={handleFilterChange}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Doctor</label>
                        <select
                            name="doctorId"
                            value={filters.doctorId}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">All Doctors</option>
                            {doctors.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition flex items-center gap-2"
                    >
                        <Filter className="w-4 h-4" />
                        Apply
                    </button>
                </form>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                    <p className="text-blue-100 text-sm font-medium mb-1">Total Payout</p>
                    <h3 className="text-3xl font-bold flex items-center">
                        <IndianRupee className="w-6 h-6 mr-1" />
                        {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <p className="text-gray-500 text-sm font-medium mb-1">Doctors Paid</p>
                    <h3 className="text-3xl font-bold text-gray-800">{uniqueDoctors}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <p className="text-gray-500 text-sm font-medium mb-1">Patients Referred</p>
                    <h3 className="text-3xl font-bold text-gray-800">{uniquePatients}</h3>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Context</th>
                                <th className="px-6 py-4">Service Details</th>
                                <th className="px-6 py-4 text-right">Cost</th>
                                <th className="px-6 py-4 text-right">%</th>
                                <th className="px-6 py-4 text-right">Referral Amt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                                        <p className="text-gray-500">Loading Report...</p>
                                    </td>
                                </tr>
                            ) : reports.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No records found for the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                reports.map((row, index) => (
                                    <tr key={`${row.header_id}-${index}`} className="hover:bg-gray-50/50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {new Date(row.upload_date).toLocaleDateString()}
                                            <div className="text-xs text-gray-400 mt-1">{new Date(row.upload_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{row.doctor_name}</div>
                                            <div className="text-xs text-gray-500">Pt: {row.patient_name}</div>
                                            <div className="text-xs text-gray-400 font-mono mt-0.5">{row.medical_council_id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-800">{row.service_name}</div>
                                            <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                                                {row.payment_mode}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-600">
                                            ₹{Number(row.service_cost).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-medium text-xs">
                                                {row.referral_percentage}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                                            ₹{Number(row.referral_amount).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
