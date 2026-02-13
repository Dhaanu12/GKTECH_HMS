import React, { useState, useEffect } from 'react';
import { X, Search, Calendar, ChevronDown, Users, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface QueueDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    entries: any[];
    doctors: any[];
    departments: any[];
    todayTotal?: number;
}

const QueueDetailsModal: React.FC<QueueDetailsModalProps> = ({
    isOpen,
    onClose,
    entries,
    doctors,
    departments,
    todayTotal = 0
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDept, setSelectedDept] = useState('All');
    const [selectedDocId, setSelectedDocId] = useState('All');
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        if (isOpen) {
            const timer = setInterval(() => setCurrentTime(new Date()), 30000);
            return () => clearInterval(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Filter Logic
    const filteredEntries = entries
        .filter(entry => {
            // Filter out completed and cancelled visits
            if (['Completed', 'Cancelled'].includes(entry.visit_status)) return false;

            const matchesSearch = searchQuery === '' ||
                entry.patient_first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                entry.patient_last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                entry.mrn_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                entry.opd_number?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesDept = selectedDept === 'All' || entry.department_name === selectedDept;
            const matchesDoc = selectedDocId === 'All' || entry.doctor_id.toString() === selectedDocId;

            return matchesSearch && matchesDept && matchesDoc;
        })
        .sort((a, b) => {
            // Sort by check-in time (oldest first - FIFO)
            const timeA = new Date(a.checked_in_time).getTime();
            const timeB = new Date(b.checked_in_time).getTime();
            return timeA - timeB;
        });

    // Split Queues
    const priorityQueue = filteredEntries.filter(e => e.is_mlc);
    const regularQueue = filteredEntries.filter(e => !e.is_mlc);

    const calculateWaitTime = (checkedInTime: string) => {
        if (!checkedInTime) return '0m';
        const start = new Date(checkedInTime);
        const diffMs = currentTime.getTime() - start.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 0) return 'Just now';
        if (diffMins < 60) return `${diffMins}m`;
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `${hours}h ${mins}m`;
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Registered': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'In-consultation': return 'bg-blue-50 text-blue-600 border-blue-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    const getTokenStyle = (entry: any) => {
        const isFemale = entry.gender === 'Female';
        const isMLC = entry.is_mlc;

        if (isMLC) {
            return {
                bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-600',
                lightGroupHover: 'group-hover:bg-red-100'
            };
        } else if (isFemale) {
            return {
                bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-600',
                lightGroupHover: 'group-hover:bg-purple-100'
            };
        } else {
            return {
                bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600',
                lightGroupHover: 'group-hover:bg-blue-100'
            };
        }
    };

    const QueueTable = ({ data, type }: { data: any[], type: 'priority' | 'regular' }) => (
        <div className={`overflow-hidden rounded-[20px] border ${type === 'priority' ? 'border-red-100 shadow-red-500/5' : 'border-slate-200/60 shadow-sm'} bg-white mb-6`}>
            {/* Table Header */}
            <div className={`px-6 py-4 border-b ${type === 'priority' ? 'bg-red-50/50 border-red-100' : 'bg-slate-50/50 border-slate-100'} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                    {type === 'priority' ? (
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shadow-sm border border-red-200">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm border border-blue-200">
                            <Users className="w-5 h-5" />
                        </div>
                    )}
                    <div>
                        <h3 className={`text-base font-bold ${type === 'priority' ? 'text-red-900' : 'text-slate-800'}`}>
                            {type === 'priority' ? 'Priority Queue (MLC)' : 'Standard Queue'}
                        </h3>
                        <p className={`text-xs font-medium ${type === 'priority' ? 'text-red-600' : 'text-slate-500'}`}>
                            {data.length} Patients Waiting
                        </p>
                    </div>
                </div>
            </div>

            <table className="w-full">
                <thead className="bg-slate-50/30 border-b border-slate-100">
                    <tr>
                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest pl-8">Token</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Patient Details</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Doctor & Dept</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                        <th className="text-right py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest pr-8">Wait Time</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {data.map((entry) => {
                        const colors = getTokenStyle(entry);
                        return (
                            <tr key={entry.opd_id} className="group hover:bg-slate-50/80 transition-colors">
                                <td className="py-5 px-6 pl-8">
                                    <div className={`${colors.bg} ${colors.lightGroupHover} transition-colors rounded-xl border ${colors.border} h-12 w-12 flex items-center justify-center shadow-sm group-hover:scale-105 duration-300`}>
                                        <span className={`font-black ${colors.text} text-lg`}>
                                            {entry.token_number}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-5 px-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${type === 'priority' ? 'bg-red-100 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                            {entry.patient_first_name[0]}
                                        </div>
                                        <div>
                                            <p className="text-base font-bold text-slate-800">
                                                {entry.patient_first_name} {entry.patient_last_name}
                                            </p>
                                            <p className="text-sm text-slate-500 font-medium">
                                                {entry.age}Y / {entry.gender} • <span className="font-mono text-slate-400 bg-slate-100 px-1 rounded text-xs">{entry.mrn_number}</span>
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-5 px-6">
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">Dr. {entry.doctor_first_name} {entry.doctor_last_name}</p>
                                        <p className="text-xs font-medium text-slate-500 bg-slate-100 inline-block px-2 py-0.5 rounded mt-1">{entry.department_name || 'General'}</p>
                                    </div>
                                </td>
                                <td className="py-5 px-6">
                                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusStyle(entry.visit_status)}`}>
                                        {entry.visit_status === 'Registered' && <div className="w-2 h-2 rounded-full bg-current animate-pulse" />}
                                        {entry.visit_status}
                                    </span>
                                </td>
                                <td className="py-5 px-6 text-right pr-8">
                                    <div className="flex flex-col items-end">
                                        <span className="text-lg font-bold text-slate-700 tabular-nums tracking-tight">
                                            {calculateWaitTime(entry.checked_in_time)}
                                        </span>
                                        <div className="flex items-center gap-1.5 mt-1 opacity-70">
                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-xs font-semibold text-slate-500">
                                                Since {entry.checked_in_time ? format(new Date(entry.checked_in_time), 'hh:mm a') : '--:--'}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );

    const stats = {
        total: todayTotal || entries.length,
        waiting: entries.filter(e => e.visit_status === 'Registered').length,
        inConsultation: entries.filter(e => e.visit_status === 'In-consultation').length,
        completed: entries.filter(e => e.visit_status === 'Completed').length,
    };

    // Calculate growth (mock logic for demo, or real if yesterday data exists)
    const growthPercent = 12; // Placeholder or calculate if yesterday total available

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#F8FAFC] w-full max-w-6xl h-[90vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white/50 ring-1 ring-white/20">

                {/* Header & Stats Section */}
                <div className="px-8 pt-8 pb-6 flex flex-col gap-8 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-20 shadow-sm/50">

                    {/* Top Bar */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3 tracking-tight">
                                Queue Management
                            </h2>
                            <p className="text-slate-500 text-base font-medium mt-1">Real-time visibility of OPD registrations</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-12 h-12 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-500 text-slate-400 flex items-center justify-center transition-all duration-300 shadow-sm border border-transparent hover:border-rose-100"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Stats Cards Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Total Asset Value Style Card */}
                        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex flex-col justify-center relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Users className="w-16 h-16 text-slate-400" />
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Visits Today</span>
                            <div className="flex items-baseline gap-3 relative z-10">
                                <span className="text-4xl font-extrabold text-slate-800 tracking-tight">{stats.total}</span>
                                <span className="text-sm font-bold px-2.5 py-1 rounded-lg text-emerald-600 bg-emerald-50 border border-emerald-100">
                                    +{growthPercent}%
                                </span>
                            </div>
                        </div>

                        {/* Line Distribution Graph */}
                        <div className="md:col-span-2 bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex flex-col justify-center">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Queue Status Breakdown</span>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm"></div>
                                        <span className="text-xs font-bold text-slate-500 uppercase">Waiting</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm"></div>
                                        <span className="text-xs font-bold text-slate-500 uppercase">In-Consult</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></div>
                                        <span className="text-xs font-bold text-slate-500 uppercase">Completed</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 h-4 w-full">
                                <div
                                    className="h-full rounded-lg bg-amber-400 shadow-sm transition-all duration-500"
                                    style={{ width: `${Math.max((stats.waiting / (stats.total || 1)) * 100, 2)}%` }}
                                    title={`Waiting: ${stats.waiting}`}
                                />
                                <div
                                    className="h-full rounded-lg bg-blue-500 shadow-sm transition-all duration-500"
                                    style={{ width: `${Math.max((stats.inConsultation / (stats.total || 1)) * 100, 2)}%` }}
                                    title={`In-Consultation: ${stats.inConsultation}`}
                                />
                                <div
                                    className="h-full rounded-lg bg-emerald-500 shadow-sm transition-all duration-500"
                                    style={{ width: `${Math.max((stats.completed / (stats.total || 1)) * 100, 2)}%` }}
                                    title={`Completed: ${stats.completed}`}
                                />
                            </div>

                            <div className="flex items-center justify-between mt-4 px-1">
                                <span className="text-base font-bold text-amber-600">{stats.waiting} <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide ml-1">Patients</span></span>
                                <span className="text-base font-bold text-blue-600">{stats.inConsultation} <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide ml-1">Active Docs</span></span>
                                <span className="text-base font-bold text-emerald-600">{stats.completed} <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide ml-1">Finished</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Control Bar (Filters) */}
                <div className="px-8 py-4 bg-white border-b border-slate-200/60 flex flex-col md:flex-row items-center gap-4 sticky top-[230px] z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
                    {/* Search Field */}
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by Patient, Token or MRN..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-200 rounded-xl text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                        />
                    </div>

                    {/* Date Selector (Static/Read-only) */}
                    <div className="bg-slate-50 px-5 py-3 rounded-xl flex items-center gap-3 border border-transparent cursor-default">
                        <Calendar className="w-5 h-5 text-slate-400" />
                        <span className="text-sm font-bold text-slate-600">{format(new Date(), 'dd MMM, yyyy')}</span>
                    </div>

                    {/* Dropdowns */}
                    <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
                        <div className="bg-slate-50 px-5 py-3 rounded-xl flex items-center gap-2 min-w-fit cursor-pointer hover:bg-slate-100 transition-colors group relative border border-transparent hover:border-slate-200">
                            <span className="text-sm font-bold text-slate-600 group-hover:text-slate-800">
                                {selectedDept === 'All' ? 'Department' : selectedDept}
                            </span>
                            <ChevronDown className="w-4 h-4 text-slate-400 ml-2" />
                            <select
                                value={selectedDept}
                                onChange={(e) => setSelectedDept(e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            >
                                <option value="All">All Departments</option>
                                {departments.map(dept => (
                                    <option key={dept.department_id} value={dept.department_name}>{dept.department_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="bg-slate-50 px-5 py-3 rounded-xl flex items-center gap-2 min-w-fit cursor-pointer hover:bg-slate-100 transition-colors group relative border border-transparent hover:border-slate-200">
                            <span className="text-sm font-bold text-slate-600 group-hover:text-slate-800">
                                {selectedDocId === 'All' ? 'Doctor' : 'Selected Doctor'}
                            </span>
                            <ChevronDown className="w-4 h-4 text-slate-400 ml-2" />
                            <select
                                value={selectedDocId}
                                onChange={(e) => setSelectedDocId(e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            >
                                <option value="All">All Doctors</option>
                                {doctors.map(doc => (
                                    <option key={doc.doctor_id} value={doc.doctor_id.toString()}>
                                        Dr. {doc.first_name} {doc.last_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table Content */}
                <div className="flex-1 overflow-auto bg-[#F8FAFC] px-8 py-8">
                    {filteredEntries.length === 0 ? (
                        // If no entries at all (but total > 0 maybe?), or just empty queue
                        <div className="flex flex-col items-center justify-center h-full opacity-60 min-h-[400px]">
                            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                <Users className="w-10 h-10 text-slate-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-700">No patients in queue</h3>
                            <p className="text-lg font-medium text-slate-500 mt-2">There are no pending or in-consultation visits.</p>
                        </div>
                    ) : (
                        <>
                            {priorityQueue.length > 0 && (
                                <QueueTable data={priorityQueue} type="priority" />
                            )}

                            {regularQueue.length > 0 && (
                                <QueueTable data={regularQueue} type="regular" />
                            )}

                            {/* If filters hide everything but search has potential matches */}
                            {priorityQueue.length === 0 && regularQueue.length === 0 && (
                                <div className="text-center py-20">
                                    <p className="text-xl font-medium text-slate-500">No matching entries found.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QueueDetailsModal;
