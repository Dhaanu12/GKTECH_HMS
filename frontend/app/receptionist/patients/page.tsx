'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, User, FileText, Clock, Filter, ArrowUpRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';

const API_URL = 'http://localhost:5000/api';

export default function PatientsPage() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/patients`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPatients(response.data.data.patients || []);
        } catch (error) {
            console.error('Error fetching patients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        // If search query is empty, fetch all patients again
        if (!searchQuery) {
            fetchPatients();
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/patients/search`, {
                params: { q: searchQuery },
                headers: { Authorization: `Bearer ${token}` }
            });
            setPatients(response.data.data.patients || []);
        } catch (error) {
            console.error('Error searching patients:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Content */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-heading font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                        Patient Records
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">Detailed history and management of all registered patients.</p>
                </div>
            </div>

            {/* Smart Command Center (Search) */}
            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden shadow-lg shadow-blue-900/5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-100/20 to-purple-100/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <form onSubmit={handleSearch} className="relative z-10 flex gap-4 max-w-4xl">
                    <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-12 pr-4 py-4 bg-white/50 border border-gray-200/50 backdrop-blur-sm rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-lg shadow-sm"
                            placeholder="Search by Name, Contact, or MRN..."
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all font-bold text-lg disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                    {/* Filter Button (Visual only for now) */}
                    <button type="button" className="p-4 bg-white/50 border border-gray-200/50 rounded-xl hover:bg-white hover:shadow-md transition text-slate-600">
                        <Filter className="w-6 h-6" />
                    </button>
                </form>
            </div>

            {/* Results List */}
            <div className="glass-card rounded-3xl overflow-hidden border border-white/40 shadow-xl shadow-slate-200/40">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gradient-to-r from-slate-50/80 to-blue-50/80 border-b border-gray-200/50">
                                <th className="px-8 py-6 font-bold text-slate-600 text-sm uppercase tracking-wider">Patient Details</th>
                                <th className="px-8 py-6 font-bold text-slate-600 text-sm uppercase tracking-wider">Contact</th>
                                <th className="px-8 py-6 font-bold text-slate-600 text-sm uppercase tracking-wider">Identifiers</th>
                                <th className="px-8 py-6 font-bold text-slate-600 text-sm uppercase tracking-wider">Latest Status</th>
                                <th className="px-8 py-6 font-bold text-slate-600 text-sm uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/50 bg-white/40 backdrop-blur-sm">
                            {patients.map((patient: any) => (
                                <tr key={patient.patient_id} className="hover:bg-blue-50/30 transition-colors duration-150 group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center text-blue-700 font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
                                                {patient.first_name[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-lg">{patient.first_name} {patient.last_name}</p>
                                                <p className="text-sm font-medium text-slate-500">{patient.gender}, {patient.age} yrs</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="text-sm font-medium text-slate-700">{patient.contact_number}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{patient.city}</p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col gap-1 items-start">
                                            <span className="text-[10px] font-bold font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                                MRN: {patient.mrn_number}
                                            </span>
                                            <span className="text-[10px] font-mono text-slate-400">
                                                ID: {patient.patient_code}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="space-y-1.5">
                                            {patient.last_visit_status && (
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${patient.last_visit_status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' :
                                                        patient.last_visit_status === 'In-consultation' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                            'bg-slate-100 text-slate-600 border-slate-200'
                                                        }`}>
                                                        {patient.last_visit_status}
                                                    </span>
                                                </div>
                                            )}
                                            {patient.next_visit_date && (
                                                <div className="text-xs font-semibold text-purple-600 flex items-center gap-1.5 bg-purple-50 px-2 py-0.5 rounded-full w-fit">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(patient.next_visit_date).toLocaleDateString()}
                                                </div>
                                            )}
                                            {!patient.last_visit_status && <span className="text-slate-400 text-sm italic">No recent activity</span>}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button
                                            onClick={() => window.location.href = `/receptionist/patients/${patient.patient_id}`}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white transition-all font-semibold text-sm group-hover:shadow-md"
                                        >
                                            View Profile <ArrowUpRight className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {patients.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center opacity-50">
                                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                                <User className="w-10 h-10 text-slate-400" />
                                            </div>
                                            <p className="text-lg font-medium text-slate-500">No patients found</p>
                                            <p className="text-sm text-slate-400 max-w-xs mt-1">Try adjusting your search terms to find who you're looking for.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
