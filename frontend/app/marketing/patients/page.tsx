'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getReferralPatients } from '@/lib/api/marketing';
import { PlusCircle, Users, Phone, MapPin, Loader2, Search, User, Stethoscope } from 'lucide-react';

export default function ReferralPatientsListPage() {
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [createdByFilter, setCreatedByFilter] = useState('');

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const res = await getReferralPatients();
            if (res.success) {
                setPatients(res.data);
            }
        } catch (err) {
            console.error('Error fetching patients:', err);
            setError('Failed to load patients.');
        } finally {
            setLoading(false);
        }
    };

    // Helper to get source label
    const getSourceLabel = (p: any) => {
        if (p.referral_means === 'Doctor') return `Dr. ${p.referral_doctor_name || 'Unknown'}`;
        if (p.referral_means === 'Agent') return `Agent: ${p.referral_agent_name || 'Unknown'}`;
        if (p.referral_means === 'Self') return 'Self / Direct';
        // Fallback for older records or partial data
        if (p.referral_doctor_name) return `Dr. ${p.referral_doctor_name}`;
        return p.referral_means || '—';
    };

    // Get unique creators for filter
    const creators = Array.from(new Set(patients.map(p => p.created_by_name).filter(Boolean))).sort();

    const filteredPatients = patients.filter(p => {
        const matchesSearch = p.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.mobile_number.includes(searchTerm);

        const matchesCreator = createdByFilter ? p.created_by_name === createdByFilter : true;

        return matchesSearch && matchesCreator;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Loading patients...</span>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Users className="w-7 h-7 text-blue-600" />
                        Referral Patients
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Track patient referrals and admissions</p>
                </div>
                <Link
                    href="/marketing/patients/add"
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-medium shadow-md shadow-blue-500/20 w-full md:w-auto justify-center"
                >
                    <PlusCircle size={18} /> Add New Patient
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by patient name or mobile..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                    />
                </div>

                {/* Created By Filter */}
                <div className="w-full md:w-64">
                    <select
                        value={createdByFilter}
                        onChange={(e) => setCreatedByFilter(e.target.value)}
                        className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-white"
                    >
                        <option value="">All Creators</option>
                        {creators.map(creator => (
                            <option key={String(creator)} value={String(creator)}>{String(creator)}</option>
                        ))}
                    </select>
                </div>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
            )}

            {patients.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No patients found</h3>
                    <p className="text-gray-400 mb-6">Get started by adding your first referral patient.</p>
                    <Link href="/marketing/patients/add" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2 font-medium">
                        <PlusCircle size={18} /> Add First Patient
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Name</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created By</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Service</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredPatients.length > 0 ? (
                                    filteredPatients.map(p => (
                                        <tr key={p.id} className="hover:bg-blue-50/30 transition">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-800">{p.patient_name}</div>
                                                <div className="text-xs text-gray-400 mt-0.5">{p.age ? `${p.age} Y` : ''} {p.gender ? `• ${p.gender}` : ''}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Phone size={14} className="text-gray-400" />
                                                    {p.mobile_number}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Stethoscope size={14} className="text-gray-400" />
                                                    {getSourceLabel(p)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600">
                                                    {p.created_by_name || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.payment_type === 'Insurance' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                                    {p.payment_type || 'Cash'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <MapPin size={14} className="text-gray-400" />
                                                    {p.place || '—'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {p.service_required || '—'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                            No patients found matching filters
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
