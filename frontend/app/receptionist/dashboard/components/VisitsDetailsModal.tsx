import React, { useState } from 'react';
import { X, Search, Calendar, ChevronDown, UserPlus, Users, Eye, CheckCircle, Clock, Activity, AlertCircle, MessageSquare, Info, Star } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface VisitsDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    entries: any[];
    doctors: any[];
    departments: any[];
    feedbacks: any[];
}

const VisitsDetailsModal: React.FC<VisitsDetailsModalProps> = ({
    isOpen,
    onClose,
    entries,
    doctors,
    departments,
    feedbacks = [],
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDept, setSelectedDept] = useState('All');
    const [selectedDocId, setSelectedDocId] = useState('All');
    const [activeTab, setActiveTab] = useState<'all' | 'new' | 'feedback' | 'completed'>('all');
    const router = useRouter();

    if (!isOpen) return null;

    // --- Stats Logic ---
    // Filter out Cancelled/Rescheduled for statistics
    const validEntries = entries.filter(e => !['Cancelled', 'Rescheduled'].includes(e.visit_status));

    const totalVisits = validEntries.length;
    const completedVisits = validEntries.filter(e => e.visit_status === 'Completed').length;
    const activeVisits = totalVisits - completedVisits;
    const completionRate = totalVisits > 0 ? Math.round((completedVisits / totalVisits) * 100) : 0;

    // Fix: "New" means newly registered patients (created_at date matches visit_date)
    const newPatientsCount = validEntries.filter(e => {
        if (!e.patient_created_at || !e.visit_date) return false;
        // Compare dates (ignoring time) using format to avoid timezone issues
        const createdDate = format(new Date(e.patient_created_at), 'yyyy-MM-dd');
        const visitDate = format(new Date(e.visit_date), 'yyyy-MM-dd');
        return createdDate === visitDate;
    }).length;
    const feedbackCount = feedbacks.length;
    const avgRating = feedbacks.length > 0 ? (feedbacks.reduce((acc, curr) => acc + curr.rating, 0) / feedbacks.length).toFixed(1) : '0.0';

    // Department Breakdown
    const deptCounts: Record<string, number> = {};
    validEntries.forEach(e => {
        const dept = e.department_name || 'General';
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });
    const topDepts = Object.entries(deptCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    // --- Filter Logic ---
    const filteredEntries = entries
        .filter(entry => {
            const matchesSearch = searchQuery === '' ||
                entry.patient_first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                entry.patient_last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                entry.mrn_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                entry.opd_number?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesDept = selectedDept === 'All' || entry.department_name === selectedDept;
            const matchesDoc = selectedDocId === 'All' || entry.doctor_id.toString() === selectedDocId;

            const matchesTab =
                activeTab === 'all' ? true :
                    activeTab === 'new' ? (
                        entry.patient_created_at && entry.visit_date &&
                        format(new Date(entry.patient_created_at), 'yyyy-MM-dd') === format(new Date(entry.visit_date), 'yyyy-MM-dd')
                    ) :
                        activeTab === 'completed' ? entry.visit_status === 'Completed' : true;

            return matchesSearch && matchesDept && matchesDoc && matchesTab;
        })
        .sort((a, b) => {
            const timeA = new Date(a.checked_in_time).getTime();
            const timeB = new Date(b.checked_in_time).getTime();
            return timeB - timeA; // Newest first
        });


    const tabItems = [
        { id: 'all', label: 'All', count: entries.length, icon: Users, color: 'blue' },
        { id: 'new', label: 'New', count: newPatientsCount, icon: UserPlus, color: 'indigo' },
        { id: 'completed', label: 'Completed', count: completedVisits, icon: CheckCircle, color: 'emerald' },
        { id: 'feedback', label: 'Feedback', count: feedbackCount, icon: MessageSquare, color: 'purple' },
    ];


    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Registered': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'In-consultation': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'Completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'Rescheduled': return 'bg-orange-50 text-orange-600 border-orange-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    const getTokenStyle = (entry: any) => {
        const isFemale = entry.gender === 'Female';
        const isMLC = entry.visit_type === 'Emergency' || entry.is_mlc; // Assuming Emergency or explicit flag

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

    const VisitsTable = ({ data }: { data: any[] }) => (
        <>
            <table className="w-full">
                <thead className="bg-slate-50/30 border-b border-slate-100">
                    <tr>
                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-700 uppercase tracking-widest pl-8">Token</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-700 uppercase tracking-widest">Patient Details</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-700 uppercase tracking-widest">Visit Info</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-700 uppercase tracking-widest">Status</th>
                        <th className="py-4 px-6 text-xs font-bold text-slate-700 uppercase tracking-widest text-center pr-8 w-[100px]">Actions</th>
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
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${entry.visit_type === 'Emergency' || entry.is_mlc ? 'bg-red-100 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                            {entry.patient_first_name[0]}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-base font-bold text-slate-900">{entry.patient_first_name} {entry.patient_last_name}</p>
                                                {(entry.visit_type === 'Emergency' || entry.is_mlc) && (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 border border-red-200 uppercase tracking-wide flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" />
                                                        MLC
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-600 font-medium mt-0.5">
                                                {entry.age}Y / {entry.gender} • <span className="font-mono text-slate-500 bg-slate-100 px-1 rounded text-xs border border-slate-200">{entry.mrn_number}</span>
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-5 px-6">
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">Dr. {entry.doctor_first_name} {entry.doctor_last_name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide border ${entry.visit_type !== 'Follow-up' ? 'text-indigo-600 bg-indigo-50 border-indigo-100' : 'text-teal-600 bg-teal-50 border-teal-100'}`}>
                                                {entry.visit_type}
                                            </span>
                                            <span className="text-xs text-slate-400">•</span>
                                            <span className="text-xs font-medium text-slate-600 bg-slate-100 inline-block px-2 py-0.5 rounded border border-slate-200">{entry.department_name || 'General'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-5 px-6">
                                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusStyle(entry.visit_status)}`}>
                                        {entry.visit_status === 'Registered' && <div className="w-2 h-2 rounded-full bg-current animate-pulse" />}
                                        {entry.visit_status}
                                    </span>
                                </td>
                                <td className="py-5 px-6 text-center pr-8">
                                    <button
                                        onClick={() => {
                                            if (entry.visit_status === 'Cancelled' || entry.visit_status === 'Rescheduled') return;
                                            onClose();
                                            router.push(`/receptionist/opd?highlight=${entry.opd_id}`);
                                        }}
                                        className={`p-2.5 rounded-xl border border-slate-100 shadow-sm transition-all duration-300 ${['Cancelled', 'Rescheduled'].includes(entry.visit_status)
                                            ? 'bg-slate-50 text-slate-300 cursor-not-allowed opacity-50'
                                            : 'bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 group/btn active:scale-90'
                                            }`}
                                        title={['Cancelled', 'Rescheduled'].includes(entry.visit_status) ? `${entry.visit_status}` : "View Details"}
                                        disabled={['Cancelled', 'Rescheduled'].includes(entry.visit_status)}
                                    >
                                        <Eye className={`w-5 h-5 ${!['Cancelled', 'Rescheduled'].includes(entry.visit_status) ? 'group-hover/btn:scale-110 transition-transform' : ''}`} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </>
    );

    const FeedbackTable = ({ data }: { data: any[] }) => (
        <>
            <table className="w-full table-fixed">
                <thead className="bg-slate-50/30 border-b border-slate-100">
                    <tr>
                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest pl-8 w-[20%]">Patient</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest w-[20%]">Doctor</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest w-[40%]">Feedback</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest w-[20%]">Satisfaction</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {data.map((fb) => (
                        <tr key={fb.id} className="group hover:bg-slate-50/80 transition-colors">
                            <td className="py-4 px-6 pl-8 align-top">
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{fb.patient_name}</p>
                                    <p className="text-xs text-slate-500 font-medium font-mono mt-0.5">{fb.mrn}</p>
                                </div>
                            </td>
                            <td className="py-4 px-6 align-top">
                                <div>
                                    {/* Try to resolve doctor from OPD entry if possible, else generic */}
                                    <p className="text-sm font-bold text-slate-700">Dr. {fb.nurse_name || 'Assigned'}</p>
                                    <p className="text-xs text-slate-500 font-medium">{fb.service_context}</p>
                                </div>
                            </td>
                            <td className="py-4 px-6 align-top">
                                <div className="group/text cursor-pointer relative">
                                    <p className="text-sm text-slate-600 italic leading-relaxed line-clamp-2 group-hover/text:line-clamp-none transition-all duration-300">
                                        "{fb.comment}"
                                    </p>
                                    {fb.comment && fb.comment.length > 60 && (
                                        <span className="text-[10px] text-blue-500 font-bold opacity-0 group-hover/text:opacity-100 transition-opacity absolute -bottom-4 left-0">
                                            Read more
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="py-4 px-6 align-top">
                                <div className="flex items-center gap-3">
                                    <div className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${fb.sentiment === 'Positive' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : fb.sentiment === 'Negative' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-50 text-slate-700 border-slate-100'}`}>
                                        {fb.rating} ★
                                        <span className="w-px h-3 bg-current/20"></span>
                                        {fb.sentiment}
                                    </div>
                                    <div className="group/info relative">
                                        <Info className="w-4 h-4 text-slate-300 hover:text-blue-400 cursor-help transition-colors" />
                                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-800 text-white text-xs rounded-xl p-3 shadow-xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-50">
                                            <p className="font-bold mb-1">Visit Metrics</p>
                                            <div className="space-y-1 text-slate-300">
                                                <div className="flex justify-between">
                                                    <span>Wait Time:</span>
                                                    <span className="text-white font-mono">12m</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Duration:</span>
                                                    <span className="text-white font-mono">15m</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {data.length === 0 && (
                        <tr>
                            <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                                No feedback collected today.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </>
    );


    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#F8FAFC] w-full max-w-5xl h-[85vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white/50 ring-1 ring-white/20">

                <div className="px-8 pt-8 pb-6 flex flex-col gap-6 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-20 shadow-sm/50">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3 tracking-tight">
                                Today's Visits
                            </h2>
                            <p className="text-slate-500 text-base font-medium mt-1">Detailed operational overview of today's OPD entries</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-500 text-slate-400 flex items-center justify-center transition-all duration-300 shadow-sm border border-transparent hover:border-rose-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Metric 1: Progress */}
                        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden group h-full">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Completion Rate</span>
                                <Activity className="w-5 h-5 text-blue-400" />
                            </div>
                            <div className="flex items-end gap-2 mb-3">
                                <span className="text-4xl font-black text-slate-800 tracking-tight">{completionRate}%</span>
                                <span className="text-sm font-bold text-slate-400 mb-1.5">Done</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: `${completionRate}%` }}></div>
                            </div>
                            <div className="flex justify-between mt-3 text-xs font-bold text-slate-500">
                                <span>{completedVisits} Completed</span>
                                <span>{activeVisits} Active</span>
                            </div>
                        </div>

                        {/* Metric 2: Visit Types / Satisfaction */}
                        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 flex flex-col justify-between h-full">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Patient Satisfaction</span>
                                <Users className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-50 flex items-center justify-between">
                                <div>
                                    <div className="text-2xl font-black text-emerald-900">{avgRating}</div>
                                    <div className="text-xs font-bold text-emerald-600 uppercase tracking-wide mt-1">Avg Rating</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-black text-emerald-900">{feedbackCount}</div>
                                    <div className="text-xs font-bold text-emerald-600 uppercase tracking-wide mt-1">Feedbacks</div>
                                </div>
                            </div>
                        </div>

                        {/* Metric 3: Top Departments */}
                        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 flex flex-col h-full">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Busiest Departments</span>
                            <div className="space-y-3">
                                {topDepts.map(([name, count], idx) => (
                                    <div key={name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {idx + 1}
                                            </span>
                                            <span className="text-sm font-bold text-slate-700 truncate max-w-[120px]" title={name}>{name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{count}</span>
                                    </div>
                                ))}
                                {topDepts.length === 0 && <span className="text-sm text-slate-400 italic">No metrics available</span>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-8 py-3 bg-white border-b border-slate-200/60 flex items-center gap-4 sticky top-[280px] z-10">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search patients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-bold text-slate-600">{format(new Date(), 'dd MMM, yyyy')}</span>
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-[#F8FAFC] px-8 py-6">
                    {/* Main Content Card with Integrated Tabs */}
                    <div className="bg-white rounded-[24px] border border-slate-200/60 shadow-sm overflow-hidden mb-6">
                        {/* Tabs Header */}
                        <div className="p-2 border-b bg-slate-50/50 border-slate-100">
                            <div className="flex bg-slate-100/80 p-1.5 rounded-2xl w-full relative gap-1.5 overflow-x-auto">
                                {tabItems.map((tab) => {
                                    const isActive = activeTab === tab.id;
                                    const Icon = tab.icon;

                                    // Dynamic color classes based on active state and tab color
                                    const activeClasses = isActive
                                        ? `bg-white shadow-sm ring-1 ring-${tab.color}-100 text-slate-800 border border-${tab.color}-100`
                                        : `text-slate-500 hover:bg-${tab.color}-50/50 hover:text-${tab.color}-700`;

                                    const iconClasses = isActive
                                        ? `bg-${tab.color}-50 text-${tab.color}-600`
                                        : `bg-slate-200/50 text-slate-400`;

                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={`flex-1 flex items-center justify-center gap-4 py-3.5 px-6 rounded-xl transition-all duration-300 min-w-fit ${activeClasses}`}
                                        >
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0 ${iconClasses}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <span className={`text-base font-bold whitespace-nowrap ${isActive ? 'text-slate-900' : 'text-current'}`}>
                                                    {tab.label}
                                                </span>
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                                                <span className="text-sm font-bold opacity-60 whitespace-nowrap">
                                                    {tab.count}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Table Content */}
                        {filteredEntries.length === 0 && activeTab !== 'feedback' ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-60">
                                <Users className="w-12 h-12 text-slate-300 mb-4" />
                                <p className="text-lg font-medium text-slate-500">No visits found matching filters</p>
                            </div>
                        ) : activeTab === 'feedback' ? (
                            <FeedbackTable data={feedbacks} />
                        ) : (
                            <VisitsTable data={filteredEntries} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisitsDetailsModal;
