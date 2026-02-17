'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getReferralAgents, deleteReferralAgent } from '@/lib/api/marketing';
import { ReferralAgent } from '@/types/marketing';
import { useAuth } from '@/lib/AuthContext';
import { PlusCircle, Trash2, Phone, Mail, Loader2, Building, Search, Briefcase, Filter } from 'lucide-react';

export default function AgentsListPage() {
    const [agents, setAgents] = useState<ReferralAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [createdByFilter, setCreatedByFilter] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            const res = await getReferralAgents();
            if (res.success) {
                setAgents(res.data);
            }
        } catch (err) {
            console.error('Error fetching agents:', err);
            setError('Failed to load agents.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this agent?')) return;
        setDeletingId(id);
        try {
            await deleteReferralAgent(id);
            setAgents(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            console.error('Error deleting agent:', err);
            setError('Failed to delete agent.');
        } finally {
            setDeletingId(null);
        }
    };

    const creators = Array.from(new Set(agents.map(a => a.created_by_name).filter(Boolean))).sort();

    const filteredAgents = agents.filter(agent => {
        const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agent.mobile.includes(searchTerm) ||
            agent.company?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCreator = createdByFilter ? agent.created_by_name === createdByFilter : true;
        return matchesSearch && matchesCreator;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="relative w-14 h-14 mx-auto">
                        <div className="animate-spin rounded-full h-14 w-14 border-4 border-amber-100 border-t-amber-500"></div>
                    </div>
                    <p className="mt-5 text-gray-500 font-medium">Loading agents...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl text-white shadow-lg shadow-amber-500/20">
                        <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Manage Agents</h1>
                        <p className="text-xs text-gray-500">
                            {agents.length} agent{agents.length !== 1 ? 's' : ''} in your network
                        </p>
                    </div>
                </div>
                <Link
                    href="/marketing/agents/add"
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all flex items-center gap-2 font-medium shadow-lg shadow-amber-500/20 text-sm w-full md:w-auto justify-center"
                >
                    <PlusCircle size={16} /> Add Agent
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, mobile, or company..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 outline-none text-sm transition-all"
                    />
                </div>
                <div className="relative w-full md:w-56">
                    <Filter className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <select
                        value={createdByFilter}
                        onChange={(e) => setCreatedByFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 outline-none text-sm appearance-none transition-all"
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

            {agents.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <Briefcase className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No agents found</h3>
                    <p className="text-gray-400 mb-6 text-sm">Get started by adding your first referral agent.</p>
                    <Link href="/marketing/agents/add" className="px-5 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition inline-flex items-center gap-2 font-medium text-sm">
                        <PlusCircle size={16} /> Add First Agent
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100">
                                    <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Agent</th>
                                    <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Mobile</th>
                                    <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Company</th>
                                    <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Created By</th>
                                    <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-right px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAgents.length > 0 ? (
                                    filteredAgents.map(agent => {
                                        const isMyRecord = user && (agent.created_by === user.username || agent.created_by === String(user.user_id));
                                        return (
                                            <tr key={agent.id} className="group hover:bg-amber-50/30 transition-colors border-b border-gray-50 last:border-b-0">
                                                <td className="px-5 py-3.5">
                                                    <div className="font-semibold text-gray-800 text-sm">{agent.name}</div>
                                                    {agent.email && (
                                                        <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                                                            <Mail size={11} /> {agent.email}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Phone size={13} className="text-gray-300" />
                                                        {agent.mobile}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Building size={13} className="text-gray-300 flex-shrink-0" />
                                                        <span className="truncate max-w-[150px]">{agent.company || '—'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold border ${isMyRecord
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-slate-50 text-slate-600 border-slate-200'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${isMyRecord ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                                        {isMyRecord ? 'Me' : (agent.created_by_name || 'Unknown')}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-sm text-gray-600">
                                                    {agent.role || '—'}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${agent.status === 'Active'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-gray-50 text-gray-600 border-gray-200'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                                                        {agent.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <button
                                                        onClick={() => handleDelete(agent.id)}
                                                        disabled={deletingId === agent.id}
                                                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-50 group-hover:opacity-100"
                                                        title="Delete"
                                                    >
                                                        {deletingId === agent.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">
                                            No agents found matching your filters
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Footer */}
                    <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-400">{filteredAgents.length} of {agents.length} records</span>
                    </div>
                </div>
            )}
        </div>
    );
}
