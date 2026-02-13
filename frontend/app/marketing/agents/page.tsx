'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getReferralAgents, deleteReferralAgent } from '@/lib/api/marketing';
import { ReferralAgent } from '@/types/marketing';
import { PlusCircle, Pencil, Trash2, Users, Phone, Mail, Loader2, Building, Search } from 'lucide-react';

export default function AgentsListPage() {
    const [agents, setAgents] = useState<ReferralAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [createdByFilter, setCreatedByFilter] = useState('');

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

    // Get unique creators for filter
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
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Loading agents...</span>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Users className="w-7 h-7 text-blue-600" />
                        Referral Agents
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your referral agents and partners</p>
                </div>
                <Link
                    href="/marketing/agents/add"
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-medium shadow-md shadow-blue-500/20"
                >
                    <PlusCircle size={18} /> Add Agent
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, mobile, or company..."
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

            {agents.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No agents found</h3>
                    <p className="text-gray-400 mb-6">Get started by adding your first referral agent.</p>
                    <Link href="/marketing/agents/add" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2 font-medium">
                        <PlusCircle size={18} /> Add First Agent
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created By</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredAgents.length > 0 ? (
                                filteredAgents.map(agent => (
                                    <tr key={agent.id} className="hover:bg-blue-50/30 transition">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-800">{agent.name}</div>
                                            {agent.email && <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Mail size={12} /> {agent.email}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-600 flex items-center gap-1"><Phone size={14} className="text-gray-400" /> {agent.mobile}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-600 flex items-center gap-1"><Building size={14} className="text-gray-400" /> {agent.company || '—'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-600">
                                                {agent.created_by_name || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{agent.role || '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${agent.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {agent.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleDelete(agent.id)}
                                                    disabled={deletingId === agent.id}
                                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title="Delete"
                                                >
                                                    {deletingId === agent.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        No agents found matching filters
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
