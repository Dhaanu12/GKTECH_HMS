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
    ArrowUpRight
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
        } catch (error) {
            console.error('Error fetching patients:', error);
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

    // Helper to generate random gradient for avatar
    const getAvatarGradient = (name: string) => {
        const colors = [
            'from-blue-400 to-indigo-500',
            'from-emerald-400 to-teal-500',
            'from-orange-400 to-pink-500',
            'from-purple-400 to-indigo-600'
        ];
        // Simple hash to pick a stable color of the set
        const index = (name?.length || 0) % colors.length;
        return colors[index];
    };

    return (
        <div className="space-y-8 pb-24 animate-in fade-in duration-700">
            {/* --- Header Section (Same as Nurse) --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 font-heading tracking-tight">
                        My Patients
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Access and manage detailed patient records.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-slate-500 shadow-sm border border-slate-200">
                        Total {filteredPatients.length} Patients
                    </span>
                </div>
            </div>

            {/* --- Search & Control Bar (Same as Nurse) --- */}
            <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/80 p-4 rounded-2xl shadow-lg shadow-indigo-500/5 border border-white/50">
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by name, MRN, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* --- Patient List (Cards) --- */}
            <div className="min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col justify-center items-center h-64 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                        <p className="text-slate-400 font-medium animate-pulse">Loading records...</p>
                    </div>
                ) : filteredPatients.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredPatients.map((patient, idx) => (
                            <Link
                                href={`/doctor/patients/${patient.patient_id}`}
                                key={patient.patient_id}
                                className="group block"
                            >
                                <div
                                    className="relative bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    {/* Hover glowing border effect */}
                                    <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-indigo-500/10 transition-colors pointer-events-none"></div>

                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

                                        {/* Left: Avatar & Info */}
                                        <div className="flex items-center gap-5 flex-1 min-w-0">
                                            {/* Avatar */}
                                            <div className={`
                                                w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold
                                                bg-gradient-to-br shadow-lg shadow-indigo-500/20
                                                ${getAvatarGradient(patient.first_name || '')}
                                                group-hover:scale-110 transition-transform duration-300
                                            `}>
                                                {patient.first_name?.charAt(0)}
                                            </div>

                                            {/* Text Info */}
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors font-heading">
                                                        {patient.first_name} {patient.last_name}
                                                    </h3>
                                                    <span className="bg-slate-100 text-slate-500 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md tracking-wider">
                                                        {patient.mrn_number}
                                                    </span>
                                                    {patient.is_mlc && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 ring-1 ring-inset ring-red-600/20">
                                                            MLC
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                                                    <span className="flex items-center gap-1.5">
                                                        <User className="w-4 h-4 text-slate-400" />
                                                        {patient.age} Y / {patient.gender}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Phone className="w-4 h-4 text-slate-400" />
                                                        {patient.contact_number}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status & Last Visit */}
                                        <div className="flex items-center gap-6 min-w-fit">

                                            {/* Status logic (Mocked/Simplified for consistency with Nurse UI) */}
                                            {/* Ideally this would come from backend: 'Admitted' | 'Discharged' | 'Active' */}
                                            <div className="hidden md:block text-right">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</div>
                                                <span className={`
                                                    inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold
                                                    bg-blue-50 text-blue-600
                                                `}>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                    Active
                                                </span>
                                            </div>

                                            <div className="hidden md:block text-right border-l border-slate-100 pl-6">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Last Visit</div>
                                                <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-sm">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {patient.last_visit ? new Date(patient.last_visit).toLocaleDateString() : 'N/A'}
                                                </div>
                                            </div>

                                            {/* Action Arrow */}
                                            <div className="h-10 w-10 rounded-full bg-slate-50 group-hover:bg-indigo-600 flex items-center justify-center transition-colors shadow-sm group-hover:shadow-lg group-hover:shadow-indigo-500/30">
                                                <Edit className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
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
