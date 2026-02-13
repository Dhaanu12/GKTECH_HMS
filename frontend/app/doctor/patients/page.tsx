'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Search,
    User,
    Loader2,
    Phone,
    Calendar,
    Edit,
    AlertCircle,
    ArrowUpRight,
    MoreHorizontal
} from 'lucide-react';
import Link from 'next/link';

const API_URL = 'http://localhost:5000/api';

export default function DoctorPatients() {
    const [patients, setPatients] = useState<any[]>([]);
    const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPatients();
    }, []);

    useEffect(() => {
        filterPatients();
    }, [searchTerm, patients]);

    const fetchPatients = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/patients/my-patients`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPatients(response.data.data.patients || []);
            setFilteredPatients(response.data.data.patients || []);
        } catch (error: any) {
            // Silent handling for 401 errors
            if (error.response?.status !== 401) {
                console.error('Error fetching patients:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    const filterPatients = () => {
        if (!searchTerm) {
            setFilteredPatients(patients);
            return;
        }
        const lowerTerm = searchTerm.toLowerCase();
        const result = patients.filter(p =>
            p.first_name?.toLowerCase().includes(lowerTerm) ||
            p.last_name?.toLowerCase().includes(lowerTerm) ||
            p.mrn_number?.toLowerCase().includes(lowerTerm) ||
            p.contact_number?.includes(lowerTerm)
        );
        setFilteredPatients(result);
    };

    // Helper to generate color based on index
    const getAvatarColor = (index: number) => {
        const colors = [
            'bg-emerald-400',
            'bg-blue-500',
            'bg-violet-500',
            'bg-amber-500',
            'bg-rose-500',
            'bg-cyan-500'
        ];
        return colors[index % colors.length];
    };

    return (
        <div className="space-y-6 pb-24 animate-in fade-in duration-700 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            {/* --- Header Section --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                        Patient Records
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium text-sm">
                        Access and manage detailed patient histories.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="bg-white px-4 py-1.5 rounded-full text-xs font-bold text-slate-500 shadow-sm border border-slate-200">
                        Total {filteredPatients.length} Patients
                    </span>
                </div>
            </div>

            {/* --- Search Bar --- */}
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by name, MRN, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border-none rounded-xl focus:ring-0 text-slate-600 placeholder:text-slate-400 font-medium"
                    />
                </div>
            </div>

            {/* --- Patient List (Horizontal Rows) --- */}
            <div className="min-h-[400px] space-y-4">
                {loading ? (
                    <div className="flex flex-col justify-center items-center h-64 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                        <p className="text-slate-400 font-medium animate-pulse">Loading records...</p>
                    </div>
                ) : filteredPatients.length > 0 ? (
                    <div className="flex flex-col gap-4">
                        {filteredPatients.map((patient, idx) => {
                            const avatarColor = getAvatarColor(idx);
                            // Mock status logic - in real app, derive from patient.status or visit
                            const isAdmitted = idx % 3 === 0;
                            const status = isAdmitted ? 'Admitted' : 'Discharged';
                            const statusColor = isAdmitted ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600';
                            const statusDot = isAdmitted ? 'bg-blue-500' : 'bg-emerald-500';

                            return (
                                <Link
                                    href={`/doctor/patients/${patient.patient_id}`}
                                    key={patient.patient_id}
                                    className="block group"
                                >
                                    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row items-start md:items-center gap-6">
                                        {/* Avatar */}
                                        <div className={`w-14 h-14 rounded-2xl ${avatarColor} flex items-center justify-center text-white text-xl font-bold shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                            {patient.first_name?.charAt(0)}
                                        </div>

                                        {/* Main Info */}
                                        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-6 w-full items-center">
                                            {/* Name & Details */}
                                            <div className="md:col-span-5">
                                                <div className="flex items-center gap-3 mb-1.5 list-none">
                                                    <h3 className="text-lg font-bold text-slate-800 truncate">
                                                        {patient.first_name} {patient.last_name}
                                                    </h3>
                                                    <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                                        MRN-{patient.mrn_number}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                                                    <div className="flex items-center gap-1.5">
                                                        <User className="w-3.5 h-3.5" />
                                                        {patient.age} Y / {patient.gender}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Phone className="w-3.5 h-3.5" />
                                                        {patient.contact_number}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status */}
                                            <div className="md:col-span-3 flex md:justify-center">
                                                <div className="flex flex-col items-start md:items-center gap-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">STATUS</span>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${statusColor}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`}></span>
                                                        {status}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Last Visit */}
                                            <div className="md:col-span-3 flex md:justify-center">
                                                <div className="flex flex-col items-start md:items-center gap-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LAST VISIT</span>
                                                    <div className="flex items-center gap-1.5 text-slate-700 font-bold text-sm">
                                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                        {patient.last_visit ? new Date(patient.last_visit).toLocaleDateString() : 'N/A'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <div className="md:col-span-1 flex justify-end">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">
                                                    <Edit className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm border-dashed">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-1">No patients found</h3>
                        <p className="text-slate-500 max-w-xs mx-auto">
                            We couldn't find any records matching "{searchTerm}".
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
