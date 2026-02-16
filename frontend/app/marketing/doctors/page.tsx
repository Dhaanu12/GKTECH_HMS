'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getReferralDoctors } from '@/lib/api/marketing';
import { ReferralDoctor } from '@/types/marketing';
import { useAuth } from '@/lib/AuthContext';
import { PlusCircle, Stethoscope, Phone, Building, MapPin, Search, ChevronRight, Filter } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
    'Active': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
    'Initialization': 'bg-sky-50 text-sky-700 border-sky-200',
};

const STATUS_DOT: Record<string, string> = {
    'Active': 'bg-emerald-500',
    'Pending': 'bg-amber-500',
    'Initialization': 'bg-sky-500',
};

export default function ReferralDoctorsListPage() {
    const [doctors, setDoctors] = useState<ReferralDoctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [createdByFilter, setCreatedByFilter] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        try {
            const res = await getReferralDoctors();
            if (res.success && res.data) {
                setDoctors(res.data);
            }
        } catch (err) {
            console.error('Error fetching doctors:', err);
            setError('Failed to load doctors.');
        } finally {
            setLoading(false);
        }
    };

    const getSourceLabel = (doc: any) => {
        if (doc.referral_means === 'Agent') return `Agent: ${doc.referral_agent_name || 'Unknown'}`;
        if (doc.referral_means === 'Doctor') return `Dr. ${doc.referrer_doctor_name || 'Unknown'}`;
        if (doc.referral_means === 'Self') return 'Self / Direct';
        return doc.referral_means || '—';
    };

    const creators = Array.from(new Set(doctors.map(d => d.created_by_name).filter(Boolean))).sort();

    const filteredDoctors = doctors.filter(doc => {
        const matchesSearch = doc.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.mobile_number.includes(searchTerm) ||
            doc.clinic_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCreator = createdByFilter ? doc.created_by_name === createdByFilter : true;
        return matchesSearch && matchesCreator;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="relative w-14 h-14 mx-auto">
                        <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-100 border-t-blue-600"></div>
                    </div>
                    <p className="mt-5 text-gray-500 font-medium">Loading doctors...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
                        <Stethoscope className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Referral Doctors</h1>
                        <p className="text-xs text-gray-500">
                            {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} in your network
                        </p>
                    </div>
                </div>
                <Link
                    href="/marketing/doctors/add"
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2 font-medium shadow-lg shadow-blue-500/20 text-sm w-full md:w-auto justify-center"
                >
                    <PlusCircle size={16} /> Add New Doctor
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, mobile, or clinic..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none text-sm transition-all"
                    />
                </div>
                <div className="relative w-full md:w-56">
                    <Filter className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <select
                        value={createdByFilter}
                        onChange={(e) => setCreatedByFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none text-sm appearance-none transition-all"
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

            {doctors.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <Stethoscope className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No doctors found</h3>
                    <p className="text-gray-400 mb-6 text-sm">Get started by adding your first referral doctor.</p>
                    <Link href="/marketing/doctors/add" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition inline-flex items-center gap-2 font-medium text-sm">
                        <PlusCircle size={16} /> Add First Doctor
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100">
                                    <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Doctor</th>
                                    <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Clinic / Hospital</th>
                                    <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Mobile</th>
                                    <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Source</th>
                                    <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Created By</th>
                                    <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Location</th>
                                    <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-right px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDoctors.length > 0 ? (
                                    filteredDoctors.map(doc => {
                                        const isMyRecord = user && (doc.created_by === user.username || doc.created_by === String(user.user_id));
                                        const statusClass = STATUS_STYLES[doc.status || ''] || 'bg-gray-50 text-gray-600 border-gray-200';
                                        const dotClass = STATUS_DOT[doc.status || ''] || 'bg-gray-400';
                                        return (
                                            <tr key={doc.id} className="group hover:bg-blue-50/40 transition-colors border-b border-gray-50 last:border-b-0">
                                                <td className="px-5 py-3.5">
                                                    <div className="font-semibold text-gray-800 text-sm">{doc.doctor_name}</div>
                                                    <div className="text-[11px] text-blue-500 font-medium mt-0.5">{doc.speciality_type}</div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Building size={13} className="text-gray-300 flex-shrink-0" />
                                                        <span className="truncate max-w-[150px]">{doc.clinic_name || '—'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Phone size={13} className="text-gray-300" />
                                                        {doc.mobile_number}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-sm text-gray-600">
                                                    {getSourceLabel(doc)}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold border ${isMyRecord
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-slate-50 text-slate-600 border-slate-200'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${isMyRecord ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                                        {isMyRecord ? 'Me' : (doc.created_by_name || 'Unknown')}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2 text-sm text-gray-500 max-w-[160px] truncate" title={doc.address}>
                                                        <MapPin size={13} className="text-gray-300 flex-shrink-0" />
                                                        {doc.address || '—'}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${statusClass}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></span>
                                                        {doc.status || 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <Link href={`/marketing/doctors/edit/${doc.id}`}
                                                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors opacity-70 group-hover:opacity-100">
                                                        Details <ChevronRight size={12} />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-12 text-center text-gray-400 text-sm">
                                            No doctors found matching your filters
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Footer */}
                    <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-400">{filteredDoctors.length} of {doctors.length} records</span>
                    </div>
                </div>
            )}
        </div>
    );
}
