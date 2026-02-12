import React, { useState, useEffect } from 'react';
import { X, Search, User, Calendar, ChevronDown, Users } from 'lucide-react';
import { format } from 'date-fns';

interface QueueDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    entries: any[];
    doctors: any[];
    departments: any[];
    yesterdayTotal?: number;
    todayTotal?: number; // Add todayTotal for accurate count (API limits entries to 50)
}

const QueueDetailsModal: React.FC<QueueDetailsModalProps> = ({
    isOpen,
    onClose,
    entries,
    doctors,
    departments,
    yesterdayTotal = 0,
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
    const filteredEntries = entries.filter(entry => {
        const matchesSearch = searchQuery === '' ||
            entry.patient_first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.patient_last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.mrn_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.opd_number?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesDept = selectedDept === 'All' || entry.department_name === selectedDept;
        const matchesDoc = selectedDocId === 'All' || entry.doctor_id.toString() === selectedDocId;

        return matchesSearch && matchesDept && matchesDoc;
    }).sort((a, b) => {
        // Sort: MLC first, then by check-in time (newest first or oldest first? usually FIFO for queue, so oldest first)
        // But user asked "OPD cases that are regitered as MLC... should placed on Top"
        if (a.is_mlc && !b.is_mlc) return -1;
        if (!a.is_mlc && b.is_mlc) return 1;
        // Secondary sort: Waiting status first? Or just time?
        // Let's keep original order (which was likely by time from backend) for rest
        return 0;
    });

    const calculateWaitTime = (checkedInTime: string, status: string) => {
        if (status === 'Completed') return 'NA';
        if (!checkedInTime) return 'N/A';
        const start = new Date(checkedInTime);
        const diffMs = currentTime.getTime() - start.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 0) return 'Just now';
        if (diffMins < 60) return `${diffMins}m`;
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `${hours}h ${mins}m`;
    };

    const stats = {
        total: todayTotal || entries.length, // Prefer passed total for accuracy
        waiting: entries.filter(e => e.visit_status === 'Registered').length,
        inConsultation: entries.filter(e => e.visit_status === 'In-consultation').length,
        completed: entries.filter(e => e.visit_status === 'Completed').length,
    };

    // Growth Calculation
    let growthPercent = 0;
    if (yesterdayTotal > 0) {
        growthPercent = Math.round(((stats.total - yesterdayTotal) / yesterdayTotal) * 100);
    } else if (stats.total > 0) {
        growthPercent = 100; // 0 -> N is considered 100% growth for display
    } else {
        growthPercent = 0; // 0 -> 0 is 0%
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#F8FAFC] w-full max-w-7xl h-[90vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white/50">

                {/* Header & Stats Section */}
                <div className="px-8 pt-8 pb-6 flex flex-col gap-8 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-20">

                    {/* Top Bar */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                Queue Management
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">Real-time visibility of OPD registrations</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Stats Cards Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Total Asset Value Style Card */}
                        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex flex-col justify-center">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Visits Today</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-slate-800 tracking-tight">{stats.total}</span>
                                <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${growthPercent >= 0 ? 'text-emerald-500 bg-emerald-50' : 'text-red-500 bg-red-50'}`}>
                                    {growthPercent > 0 && '+'}{growthPercent}%
                                </span>
                            </div>
                        </div>

                        {/* Line Distribution Graph (Inventory Status Style) */}
                        <div className="md:col-span-2 bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex flex-col justify-center">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Queue Status Breakdown</span>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Waiting</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">In-Consult</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Completed</span>
                                    </div>
                                </div>
                            </div>

                            {/* The "Lines" Graph */}
                            <div className="flex items-center gap-2 h-3 w-full">
                                <div
                                    className="h-full rounded-full bg-amber-400 shadow-sm transition-all duration-500 cursor-help"
                                    style={{ width: `${Math.max((stats.waiting / (stats.total || 1)) * 100, 2)}%` }}
                                    title={`Waiting: ${stats.waiting}`}
                                />
                                <div
                                    className="h-full rounded-full bg-blue-500 shadow-sm transition-all duration-500 cursor-help"
                                    style={{ width: `${Math.max((stats.inConsultation / (stats.total || 1)) * 100, 2)}%` }}
                                    title={`In-Consultation: ${stats.inConsultation}`}
                                />
                                <div
                                    className="h-full rounded-full bg-emerald-500 shadow-sm transition-all duration-500 cursor-help"
                                    style={{ width: `${Math.max((stats.completed / (stats.total || 1)) * 100, 2)}%` }}
                                    title={`Completed: ${stats.completed}`}
                                />
                            </div>

                            <div className="flex items-center justify-between mt-3 px-1">
                                <span className="text-sm font-bold text-amber-600">{stats.waiting} <span className="text-xs text-slate-400 font-normal">Patients</span></span>
                                <span className="text-sm font-bold text-blue-600">{stats.inConsultation} <span className="text-xs text-slate-400 font-normal">Doctors Busy</span></span>
                                <span className="text-sm font-bold text-emerald-600">{stats.completed} <span className="text-xs text-slate-400 font-normal">Visits Done</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Control Bar (Filters) */}
                <div className="px-8 py-4 bg-white border-b border-slate-200/60 flex flex-col md:flex-row items-center gap-4 sticky top-[230px] z-10">
                    {/* Search Field */}
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-medium text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
                        />
                    </div>

                    {/* Date Selector (Static/Read-only) */}
                    <div className="bg-slate-50 px-4 py-2.5 rounded-xl flex items-center gap-2 border-none cursor-default">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-bold text-slate-600">{format(new Date(), 'dd/MM/yyyy')}</span>
                    </div>

                    {/* Dropdowns */}
                    <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
                        <div className="bg-slate-50 px-4 py-2.5 rounded-xl flex items-center gap-2 min-w-fit cursor-pointer hover:bg-slate-100 transition-colors group relative">
                            <span className="text-sm font-bold text-slate-600 group-hover:text-slate-800">
                                {selectedDept === 'All' ? 'Department' : selectedDept}
                            </span>
                            <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
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

                        <div className="bg-slate-50 px-4 py-2.5 rounded-xl flex items-center gap-2 min-w-fit cursor-pointer hover:bg-slate-100 transition-colors group relative">
                            <span className="text-sm font-bold text-slate-600 group-hover:text-slate-800">
                                {selectedDocId === 'All' ? 'Doctor' : 'Selected Doctor'}
                            </span>
                            <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
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
                <div className="flex-1 overflow-auto bg-[#F8FAFC] px-8 py-6">
                    <div className="bg-white rounded-[24px] shadow-sm border border-slate-200/60 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="text-left py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Patient Name</th>
                                    <th className="text-left py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Visit Type</th>
                                    <th className="text-left py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Department</th>
                                    <th className="text-left py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Doc</th>
                                    <th className="text-left py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="text-right py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Registered Time</th>
                                    <th className="text-right py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Waiting Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredEntries.map((entry) => {
                                    const isWaiting = entry.visit_status === 'Registered';
                                    const isInConsult = entry.visit_status === 'In-consultation';

                                    return (
                                        <tr key={entry.opd_id} className="group hover:bg-slate-50/80 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-4">
                                                    {/* Avatar/Icon Placeholder */}
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                                                        {entry.patient_first_name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                                            {entry.patient_first_name} {entry.patient_last_name}
                                                            {entry.is_mlc && (
                                                                <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-200">
                                                                    MLC
                                                                </span>
                                                            )}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs font-bold text-slate-500 tracking-wider font-mono bg-slate-100 px-1 rounded">
                                                                {entry.mrn_number}
                                                            </span>
                                                            <span className="text-[10px] text-slate-300">•</span>
                                                            <span className="text-xs font-bold text-blue-600/90 tracking-wider font-mono bg-blue-50 px-1 rounded">
                                                                {entry.opd_number}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-sm font-semibold text-slate-600">{entry.visit_type}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-sm font-semibold text-slate-600">{entry.department_name || 'General'}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-sm font-semibold text-slate-600 truncate max-w-[150px]">
                                                    Dr. {entry.doctor_first_name} {entry.doctor_last_name}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${isWaiting
                                                    ? 'bg-amber-50 text-amber-600 border-amber-100'
                                                    : isInConsult
                                                        ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                        : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    }`}>
                                                    {isWaiting && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                                                    {entry.visit_status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <span className="text-sm font-semibold text-slate-600">
                                                    {entry.checked_in_time ? format(new Date(entry.checked_in_time), 'hh:mm a') : '--:--'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <span className="text-sm font-bold text-slate-700 tabular-nums">
                                                    {calculateWaitTime(entry.checked_in_time, entry.visit_status)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredEntries.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-40">
                                                <Users className="w-16 h-16 text-slate-300" />
                                                <p className="text-lg font-medium text-slate-500">No patients found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        {/* No Pagination Footer Here as requested */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QueueDetailsModal;
