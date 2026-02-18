'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getReferralPatients } from '@/lib/api/marketing';
import { useAuth } from '@/lib/AuthContext';
import { PlusCircle, Users, Phone, MapPin, Search, Stethoscope, Filter, CreditCard, Briefcase } from 'lucide-react';

export default function ReferralPatientsListPage() {
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [createdByFilter, setCreatedByFilter] = useState('');
    const { user } = useAuth();

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

    const getSourceLabel = (p: any) => {
        if (p.referral_means === 'Doctor') return `Dr. ${p.referral_doctor_name || 'Unknown'}`;
        if (p.referral_means === 'Agent') return `Agent: ${p.referral_agent_name || 'Unknown'}`;
        if (p.referral_means === 'Self') return 'Self / Direct';
        if (p.referral_doctor_name) return `Dr. ${p.referral_doctor_name}`;
        return p.referral_means || '—';
    };

    const getSourceIcon = (p: any) => {
        if (p.referral_means === 'Doctor') return <Stethoscope size={12} className="text-blue-400" />;
        if (p.referral_means === 'Agent') return <Briefcase size={12} className="text-amber-400" />;
        return <Users size={12} className="text-gray-400" />;
    };

    const creators = Array.from(new Set(patients.map(p => p.created_by_name).filter(Boolean))).sort();

    const filteredPatients = patients.filter(p => {
        const matchesSearch = p.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.mobile_number.includes(searchTerm);
        const matchesCreator = createdByFilter ? p.created_by_name === createdByFilter : true;
        return matchesSearch && matchesCreator;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="relative w-14 h-14 mx-auto">
                        <div className="animate-spin rounded-full h-14 w-14 border-4 border-purple-100 border-t-purple-600"></div>
                    </div>
                    <p className="mt-5 text-gray-500 font-medium">Loading patients...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl text-white shadow-lg shadow-purple-500/20">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Referral Patients</h1>
                        <p className="text-xs text-gray-500">
                            {patients.length} patient{patients.length !== 1 ? 's' : ''} tracked
                        </p>
                    </div>
                </div>
                <Link
                    href="/marketing/patients/add"
                    className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all flex items-center gap-2 font-medium shadow-lg shadow-purple-500/20 text-sm w-full md:w-auto justify-center"
                >
                    <PlusCircle size={16} /> Add New Patient
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by patient name or mobile..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none text-sm transition-all"
                    />
                </div>
                <div className="relative w-full md:w-56">
                    <Filter className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <select
                        value={createdByFilter}
                        onChange={(e) => setCreatedByFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none text-sm appearance-none transition-all"
                    >
                        <option value="">All Creators</option>
                        {creators.map(creator => (
                            <option key={String(creator)} value={String(creator)}>{String(creator)}</option>
                        ))}
                    </select>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></span>
                    {error}
                </div>
            )}

            {patients.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <Users className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No patients found</h3>
                    <p className="text-gray-400 mb-6 text-sm">Get started by adding your first referral patient.</p>
                    <Link href="/marketing/patients/add" className="px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition inline-flex items-center gap-2 font-medium text-sm">
                        <PlusCircle size={16} /> Add First Patient
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100">
                                    <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Patient</th>
                                    <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Mobile</th>
                                    <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Source</th>
                                    <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Created By</th>
                                    <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Payment</th>
                                    <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Location</th>
                                    <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Service</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPatients.length > 0 ? (
                                    filteredPatients.map(p => {
                                        const isMyRecord = user && (p.created_by === user.username || p.created_by === String(user.user_id));
                                        return (
                                            <tr key={p.id} className="group hover:bg-purple-50/30 transition-colors border-b border-gray-50 last:border-b-0">
                                                <td className="px-5 py-3.5">
                                                    <div className="font-semibold text-gray-800 text-sm">{p.patient_name}</div>
                                                    <div className="text-[11px] text-gray-400 mt-0.5">
                                                        {p.age ? `${p.age} Y` : ''} {p.gender ? `• ${p.gender}` : ''}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Phone size={13} className="text-gray-300" />
                                                        {p.mobile_number}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                        {getSourceIcon(p)}
                                                        {getSourceLabel(p)}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold border ${isMyRecord
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-slate-50 text-slate-600 border-slate-200'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${isMyRecord ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                                        {isMyRecord ? 'Me' : (p.created_by_name || 'Unknown')}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                        <CreditCard size={12} className="text-gray-300" />
                                                        {p.payment_type || 'Cash'}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                        <MapPin size={13} className="text-gray-300 flex-shrink-0" />
                                                        {p.place || '—'}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-sm text-gray-600">
                                                    {p.service_required || '—'}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">
                                            No patients found matching your filters
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Footer */}
                    <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-400">{filteredPatients.length} of {patients.length} records</span>
                    </div>
                </div>
            )}
        </div>
    );
}
