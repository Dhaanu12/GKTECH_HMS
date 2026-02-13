'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getReferralDoctors } from '@/lib/api/marketing';
import { ReferralDoctor } from '@/types/marketing';
import { PlusCircle, Stethoscope, Phone, Building, MapPin, Loader2, Search } from 'lucide-react';

export default function ReferralDoctorsListPage() {
    const [doctors, setDoctors] = useState<ReferralDoctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [createdByFilter, setCreatedByFilter] = useState('');

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        try {
            const res = await getReferralDoctors();
            if (res.success && res.data) {
                // Filter out 'Initialization' status if not already handled by backend
                setDoctors(res.data.filter((d: any) => d.status !== 'Initialization'));
            }
        } catch (err) {
            console.error('Error fetching doctors:', err);
            setError('Failed to load doctors.');
        } finally {
            setLoading(false);
        }
    };

    // Helper to get source label
    const getSourceLabel = (doc: any) => {
        if (doc.referral_means === 'Agent') return `Agent: ${doc.referral_agent_name || 'Unknown'}`;
        if (doc.referral_means === 'Doctor') return `Dr. ${doc.referrer_doctor_name || 'Unknown'}`;
        if (doc.referral_means === 'Self') return 'Self / Direct';
        return doc.referral_means || '—';
    };

    // Get unique creators for filter
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
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Loading doctors...</span>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Stethoscope className="w-7 h-7 text-blue-600" />
                        Referral Doctors
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Manage specialist doctors and clinics</p>
                </div>
                <Link
                    href="/marketing/doctors/add"
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-medium shadow-md shadow-blue-500/20 w-full md:w-auto justify-center"
                >
                    <PlusCircle size={18} /> Add New Doctor
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, mobile, or clinic..."
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

            {doctors.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No doctors found</h3>
                    <p className="text-gray-400 mb-6">Get started by adding your first referral doctor.</p>
                    <Link href="/marketing/doctors/add" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2 font-medium">
                        <PlusCircle size={18} /> Add First Doctor
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Doctor</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Clinic / Hospital</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created By</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredDoctors.length > 0 ? (
                                    filteredDoctors.map(doc => (
                                        <tr key={doc.id} className="hover:bg-blue-50/30 transition">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-800">{doc.doctor_name}</div>
                                                <div className="text-xs text-blue-600 mt-0.5">{doc.speciality_type}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Building size={14} className="text-gray-400" />
                                                    {doc.clinic_name || '—'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Phone size={14} className="text-gray-400" />
                                                    {doc.mobile_number}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded inline-block">
                                                    {getSourceLabel(doc)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600">
                                                    {doc.created_by_name || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-gray-600 max-w-[200px] truncate" title={doc.address}>
                                                    <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                                                    {doc.address || '—'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${doc.status === 'Active' ? 'bg-green-100 text-green-700' :
                                                    doc.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {doc.status || 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {/* Actions like Edit/View can be added later if needed */}
                                                <Link href={`/marketing/doctors/edit/${doc.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                                    Details
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                            No doctors found matching filters
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
