'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, User, ChevronRight, Loader2, ArrowUpRight, Filter, Sparkles, Activity, Clock, AlertCircle, Users } from 'lucide-react';
import Link from 'next/link';

const API_URL = 'http://localhost:5000/api';

export default function DoctorPatients() {
    const [patients, setPatients] = useState<any[]>([]);
    const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        fetchPatients();
    }, []);

    useEffect(() => {
        filterPatients();
    }, [searchTerm, patients, activeTab]);

    const fetchPatients = async () => {
        try {
            const token = localStorage.getItem('token');
            // Fetch all patients initially to allow client-side filtering/tabbing
            const response = await axios.get(`${API_URL}/patients/my-patients`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPatients(response.data.data.patients || []);
        } catch (error) {
            console.error('Error fetching patients:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterPatients = () => {
        let result = [...patients];

        // 1. Filter by Tab
        if (activeTab === 'recent') {
            // Mock: Show patients visited in last 7 days (assuming last_visit exists)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            result = result.filter(p => p.last_visit && new Date(p.last_visit) >= sevenDaysAgo);
        } else if (activeTab === 'critical') {
            // Mock: Randomly or based on some flag if available. For now, filter by age > 60 as a proxy or empty
            result = result.filter(p => p.age > 60);
        }

        // 2. Filter by Search
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.first_name?.toLowerCase().includes(lowerTerm) ||
                p.last_name?.toLowerCase().includes(lowerTerm) ||
                p.mrn_number?.toLowerCase().includes(lowerTerm) ||
                p.contact_number?.includes(lowerTerm)
            );
        }

        setFilteredPatients(result);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Content */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-heading font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                        My Patients
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">Access medical records and history.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-semibold text-sm hover:bg-blue-100 transition flex items-center gap-2">
                        <Filter className="w-4 h-4" /> Filter View
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-panel p-5 rounded-2xl border border-blue-100 flex items-center gap-4 hover:scale-[1.02] transition-transform">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase">Total Patients</p>
                        <h3 className="text-2xl font-bold text-slate-800">{patients.length}</h3>
                    </div>
                </div>
                <div className="glass-panel p-5 rounded-2xl border border-emerald-100 flex items-center gap-4 hover:scale-[1.02] transition-transform">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase">Active Visits</p>
                        <h3 className="text-2xl font-bold text-slate-800">
                            {/* Mock Count */}
                            {Math.floor(patients.length * 0.2)}
                        </h3>
                    </div>
                </div>
                <div className="glass-panel p-5 rounded-2xl border border-purple-100 flex items-center gap-4 hover:scale-[1.02] transition-transform">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase">Recent (7d)</p>
                        <h3 className="text-2xl font-bold text-slate-800">
                            {patients.filter(p => p.last_visit && new Date(p.last_visit) >= new Date(Date.now() - 7 * 86400000)).length}
                        </h3>
                    </div>
                </div>
                <div className="glass-panel p-5 rounded-2xl border border-amber-100 flex items-center gap-4 hover:scale-[1.02] transition-transform">
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase">Critical Attention</p>
                        <h3 className="text-2xl font-bold text-slate-800">
                            {patients.filter(p => p.age > 60).length}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex items-center gap-6 border-b border-slate-200/60 pb-1">
                {['all', 'recent', 'critical'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 text-sm font-bold capitalize transition-all relative ${activeTab === tab
                            ? 'text-blue-600'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        {tab === 'all' ? 'All Patients' : tab === 'recent' ? 'Recently Viewed' : 'Critical Attention'}
                        {activeTab === tab && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full transition-all"></span>
                        )}
                    </button>
                ))}
            </div>

            {/* Smart Command Center (Search) */}
            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden shadow-lg shadow-blue-900/5 border border-white/60">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-100/20 to-purple-100/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <div className="relative z-10 flex gap-4 max-w-4xl">
                    <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search patients by name, MRN, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-12 pr-4 py-4 bg-white/50 border border-gray-200/50 backdrop-blur-sm rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-lg shadow-inner"
                        />
                        {/* AI Badge inside input */}
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <span className="hidden group-focus-within:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 animate-in fade-in zoom-in duration-300">
                                <Sparkles className="w-3 h-3" /> AI Search
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card rounded-3xl overflow-hidden border border-white/60 shadow-xl shadow-slate-200/40">
                {loading ? (
                    <div className="flex justify-center items-center p-24">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gradient-to-r from-slate-50/80 to-blue-50/80 border-b border-gray-200/50">
                                <th className="px-8 py-6 font-bold text-slate-600 text-sm uppercase tracking-wider">Patient Name</th>
                                <th className="px-8 py-6 font-bold text-slate-600 text-sm uppercase tracking-wider">Age/Gender</th>
                                <th className="px-8 py-6 font-bold text-slate-600 text-sm uppercase tracking-wider">Last Visit</th>
                                <th className="px-8 py-6 font-bold text-slate-600 text-sm uppercase tracking-wider">Contact</th>
                                <th className="px-8 py-6 font-bold text-slate-600 text-sm uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/50 bg-white/40 backdrop-blur-sm">
                            {filteredPatients.length > 0 ? (
                                filteredPatients.map((patient) => (
                                    <tr key={patient.patient_id} className="hover:bg-blue-50/40 transition-colors duration-200 group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                {patient.gender === 'Female' ? (
                                                    <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center text-pink-600 shadow-sm group-hover:scale-110 transition-transform duration-300 ring-1 ring-white">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                                                            <path d="M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" />
                                                            <path d="M12 15v7" />
                                                            <path d="M9 19h6" />
                                                        </svg>
                                                    </div>
                                                ) : patient.gender === 'Male' ? (
                                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform duration-300 ring-1 ring-white">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                                                            <circle cx="10" cy="10" r="6" />
                                                            <path d="M14.29 5.71 19 1" />
                                                            <path d="m20 1-5.71 5.71" />
                                                            <path d="M 20 1 v 5" />
                                                            <path d="M 20 1 h -5" />
                                                        </svg>
                                                    </div>
                                                ) : (
                                                    <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-gray-200 rounded-2xl flex items-center justify-center text-slate-600 font-bold text-lg shadow-sm group-hover:scale-110 transition-transform duration-300 ring-1 ring-white">
                                                        {patient.first_name?.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <span className="font-bold text-slate-800 text-lg block group-hover:text-blue-700 transition-colors">{patient.first_name} {patient.last_name}</span>
                                                    <span className="text-xs font-mono text-slate-400 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 mt-1 inline-block">{patient.mrn_number}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-slate-600 font-medium">
                                            {patient.age} yrs <span className="text-slate-300 px-1">|</span> {patient.gender}
                                        </td>
                                        <td className="px-8 py-5 text-slate-600">
                                            {patient.last_visit ? (
                                                <span className="bg-slate-50 text-slate-600 px-3 py-1 rounded-full text-xs font-bold border border-slate-200 shadow-sm">
                                                    {new Date(patient.last_visit).toLocaleDateString()}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-sm italic">Never</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 text-slate-600 font-medium font-mono text-sm">
                                            {patient.contact_number}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <Link href={`/doctor/patients/${patient.patient_id}`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30 transition-all font-semibold text-sm hover:-translate-y-0.5">
                                                View Record <ArrowUpRight className="w-4 h-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-32 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100 shadow-inner">
                                                <User className="w-10 h-10 text-slate-300" />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-400">No patients found</h3>
                                            <p className="text-slate-400 mt-1">Try adjusting your search terms</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
