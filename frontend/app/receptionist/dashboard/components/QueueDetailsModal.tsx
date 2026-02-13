import React, { useState, useEffect } from 'react';
import { X, Search, Calendar, ChevronDown, Users, Clock, AlertCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface QueueDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    entries: any[];
    doctors: any[];
    departments: any[];
    todayTotal?: number;
    yesterdayTotal?: number;
    doctorSchedules?: any[];
    appointments?: any[];
}

const QueueDetailsModal: React.FC<QueueDetailsModalProps> = ({
    isOpen,
    onClose,
    entries,
    doctors,
    departments,
    todayTotal = 0,
    yesterdayTotal = 0,
    doctorSchedules = [],
    appointments = []
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDept, setSelectedDept] = useState('All');
    const [selectedDocId, setSelectedDocId] = useState('All');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeTab, setActiveTab] = useState<'priority' | 'up-next' | 'in-consultation'>('up-next');
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            setCurrentTime(new Date());
            const timer = setInterval(() => setCurrentTime(new Date()), 30000);
            return () => clearInterval(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // --- Availability Logic (Copied & Adapted from Dashboard) ---

    const formatTime12Hour = (time24: string) => {
        if (!time24) return '';
        const [hours, minutes] = time24.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const h = hours % 12 || 12;
        return `${h}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const generateTimeSlotsFromSchedule = (doctorId: string, selectedDate: string) => {
        if (!doctorId || !selectedDate) return [];

        const date = new Date(selectedDate);
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });

        const doctorDaySchedules = doctorSchedules.filter(
            (schedule: any) =>
                schedule.doctor_id === parseInt(doctorId) &&
                schedule.day_of_week === dayOfWeek
        );

        if (doctorDaySchedules.length === 0) return [];

        const slots: string[] = [];
        doctorDaySchedules.forEach((schedule: any) => {
            const startTime = schedule.start_time;
            const endTime = schedule.end_time;
            const consultationTime = schedule.avg_consultation_time || 30;

            const parseTime = (timeStr: string) => {
                const [hours, minutes] = timeStr.split(':').map(Number);
                const d = new Date();
                d.setHours(hours, minutes, 0, 0);
                return d;
            };

            let current = parseTime(startTime);
            const end = parseTime(endTime);

            const now = new Date();
            const isToday = new Date(selectedDate).toDateString() === now.toDateString();
            const cutoffTime = new Date(now.getTime() + 15 * 60000); // 15 min buffer

            while (current < end) {
                if (isToday) {
                    const slotTime = new Date(now);
                    slotTime.setHours(current.getHours(), current.getMinutes(), 0, 0);
                    if (slotTime > cutoffTime) {
                        const timeStr = current.toTimeString().slice(0, 5);
                        slots.push(timeStr);
                    }
                } else {
                    const timeStr = current.toTimeString().slice(0, 5);
                    slots.push(timeStr);
                }
                current = new Date(current.getTime() + consultationTime * 60000);
            }
        });

        const uniqueSlots = Array.from(new Set(slots)).sort();
        return uniqueSlots.map(time => {
            const isBooked = appointments.some((appt: any) => {
                let aptDate = '';
                if (appt.appointment_date) {
                    const d = new Date(appt.appointment_date);
                    aptDate = format(d, 'yyyy-MM-dd');
                }
                const aptTime = appt.appointment_time ? appt.appointment_time.slice(0, 5) : '';
                return (
                    appt.doctor_id === parseInt(doctorId) &&
                    aptDate === selectedDate &&
                    aptTime === time &&
                    ['Scheduled', 'Confirmed'].includes(appt.appointment_status)
                );
            });
            return { time, status: isBooked ? 'booked' : 'available' };
        }).filter(s => s.status === 'available');
    };

    const getDoctorAvailabilityInfo = (doctorId: number) => {
        const dateStr = format(currentTime, 'yyyy-MM-dd');
        const dayOfWeek = currentTime.toLocaleDateString('en-US', { weekday: 'long' });

        const schedules = doctorSchedules.filter((s: any) =>
            s.doctor_id === doctorId && s.day_of_week === dayOfWeek
        );

        if (schedules.length === 0) return { status: 'unavailable', text: 'Unavailable today' };

        const shiftText = schedules.map((s: any) =>
            `${formatTime12Hour(s.start_time)} - ${formatTime12Hour(s.end_time)}`
        ).join(', ');

        const remainingSlots = generateTimeSlotsFromSchedule(doctorId.toString(), dateStr);

        if (remainingSlots && remainingSlots.length > 0) {
            return { status: 'available', text: shiftText };
        }

        // No slots logic
        const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        const futureShifts = schedules.filter((s: any) => {
            const [h, m] = s.start_time.split(':').map(Number);
            return (h * 60 + m) > nowMinutes;
        });

        if (futureShifts.length > 0) {
            const nextShift = futureShifts.sort((a: any, b: any) => {
                const [ah, am] = a.start_time.split(':').map(Number);
                const [bh, bm] = b.start_time.split(':').map(Number);
                return (ah * 60 + am) - (bh * 60 + bm);
            })[0];
            // Still considered "available" to be in the list, but maybe with next shift info?
            // User just said "if unavailable say unavailable". 
            // Logic in dashboard: returns 'next'. 
            return { status: 'next', text: `Next: ${formatTime12Hour(nextShift.start_time)}` };
        }

        return { status: 'unavailable', text: 'Unavailable' };
    };


    // Filter Logic
    const filteredEntries = entries
        .filter(entry => {
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
            const timeA = new Date(a.checked_in_time).getTime();
            const timeB = new Date(b.checked_in_time).getTime();
            return timeA - timeB;
        });

    const priorityQueue = filteredEntries.filter(e => e.is_mlc);
    const regularQueue = filteredEntries.filter(e => !e.is_mlc);

    // Group regular queue items by doctor to get unique/one-per-doc lists
    const inConsultationList = regularQueue
        .filter(e => e.visit_status === 'In-consultation')
        .reduce((acc: any[], current) => {
            if (!acc.find(item => item.doctor_id === current.doctor_id)) {
                acc.push(current);
            }
            return acc;
        }, []);

    const upNextList = regularQueue
        .filter(e => e.visit_status === 'Registered')
        .reduce((acc: any[], current) => {
            if (!acc.find(item => item.doctor_id === current.doctor_id)) {
                acc.push(current);
            }
            return acc;
        }, []);

    const activeList = activeTab === 'priority' ? priorityQueue : (activeTab === 'up-next' ? upNextList : inConsultationList);

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

    const sortedDoctors = [...doctors].sort((a, b) =>
        (a.first_name || '').localeCompare(b.first_name || '')
    );

    const getSelectedDoctorName = () => {
        if (selectedDocId === 'All') return 'All Doctors';
        const doc = doctors.find(d => d.doctor_id.toString() === selectedDocId);
        return doc ? `Dr. ${doc.first_name} ${doc.last_name}` : 'Unknown Doctor';
    };

    const QueueTable = ({ data }: { data: any[] }) => (
        <div className={`overflow-hidden rounded-[20px] border border-slate-200/60 shadow-sm bg-white mb-6`}>
            {/* Table Header with 3 Tabs */}
            <div className="p-2 border-b bg-slate-50/50 border-slate-100">
                <div className="flex bg-slate-100/80 p-1.5 rounded-2xl w-full relative gap-1.5">
                    {/* Tab: Priority Queue (MLC) */}
                    <button
                        onClick={() => setActiveTab('priority')}
                        className={`flex-1 flex items-center justify-center gap-4 py-3.5 px-6 rounded-xl transition-all duration-300 ${activeTab === 'priority'
                            ? 'bg-white shadow-sm ring-1 ring-red-100 text-red-900 border border-red-100'
                            : 'text-slate-500 hover:bg-red-50/50 hover:text-red-700'
                            }`}
                    >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0 ${activeTab === 'priority' ? 'bg-red-100 text-red-600' : 'bg-slate-200/50 text-slate-400'
                            }`}>
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-3 overflow-hidden">
                            <span className={`text-base font-bold whitespace-nowrap ${activeTab === 'priority' ? 'text-red-900' : 'text-current'}`}>
                                Priority Que
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                            <span className="text-sm font-bold opacity-60 whitespace-nowrap">
                                {priorityQueue.length} MLC
                            </span>
                        </div>
                    </button>

                    {/* Tab: Up Next */}
                    <button
                        onClick={() => setActiveTab('up-next')}
                        className={`flex-1 flex items-center justify-center gap-4 py-3.5 px-6 rounded-xl transition-all duration-300 ${activeTab === 'up-next'
                            ? 'bg-white shadow-sm ring-1 ring-indigo-100 text-slate-800 border border-indigo-100'
                            : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'
                            }`}
                    >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0 ${activeTab === 'up-next' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200/50 text-slate-400'
                            }`}>
                            <Users className="w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-3 overflow-hidden">
                            <span className={`text-base font-bold whitespace-nowrap ${activeTab === 'up-next' ? 'text-slate-900' : 'text-current'}`}>
                                Up Next
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                            <span className="text-sm font-bold opacity-60 whitespace-nowrap">
                                {upNextList.length} Waiting
                            </span>
                        </div>
                    </button>

                    {/* Tab: In-Consultation */}
                    <button
                        onClick={() => setActiveTab('in-consultation')}
                        className={`flex-1 flex items-center justify-center gap-4 py-3.5 px-6 rounded-xl transition-all duration-300 ${activeTab === 'in-consultation'
                            ? 'bg-white shadow-sm ring-1 ring-blue-100 text-slate-800 border border-indigo-100'
                            : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'
                            }`}
                    >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0 ${activeTab === 'in-consultation' ? 'bg-blue-50 text-blue-600' : 'bg-slate-200/50 text-slate-400'
                            }`}>
                            <Users className="w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-3 overflow-hidden">
                            <span className={`text-base font-bold whitespace-nowrap ${activeTab === 'in-consultation' ? 'text-slate-900' : 'text-current'}`}>
                                In-Consultation
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                            <span className="text-sm font-bold opacity-60 whitespace-nowrap">
                                {inConsultationList.length} Active
                            </span>
                        </div>
                    </button>
                </div>
            </div>

            <table className="w-full">
                <thead className="bg-slate-50/30 border-b border-slate-100">
                    <tr>
                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest pl-8">Token</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Patient Details</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Doctor & Dept</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                        <th className="text-right py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest pr-8">
                            {activeTab === 'in-consultation' ? 'Consultation Time' : (activeTab === 'priority' ? 'Active Time' : 'Wait Time')}
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest text-center pr-8 w-[100px]">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {data.map((entry) => {
                        const colors = getTokenStyle(entry);

                        // Calculate time display
                        let timeDisplay = '';
                        const showConsultationTime = activeTab === 'in-consultation';
                        if (showConsultationTime) {
                            const startTime = entry.consultation_start_time || entry.updated_at;
                            if (startTime) {
                                const start = new Date(startTime).getTime();
                                const now = new Date().getTime();
                                const diff = Math.max(0, Math.floor((now - start) / 60000));
                                if (diff >= 60) {
                                    const h = Math.floor(diff / 60);
                                    const m = diff % 60;
                                    timeDisplay = `${h}h ${m}m`;
                                } else {
                                    timeDisplay = `${diff}m`;
                                }
                            } else {
                                timeDisplay = '-';
                            }
                        } else {
                            timeDisplay = calculateWaitTime(entry.checked_in_time);
                        }

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
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${entry.is_mlc ? 'bg-red-100 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
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
                                            {timeDisplay}
                                        </span>
                                        <div className="flex items-center gap-1.5 mt-1 opacity-70">
                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-xs font-semibold text-slate-500">
                                                {showConsultationTime ? 'Duration' : `Since ${entry.checked_in_time ? format(new Date(entry.checked_in_time), 'hh:mm a') : '--:--'}`}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-5 px-6 text-center pr-8">
                                    <button
                                        onClick={() => {
                                            onClose();
                                            router.push(`/receptionist/opd?highlight=${entry.opd_id}`);
                                        }}
                                        className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 border border-slate-100 hover:border-blue-100 group/btn shadow-sm active:scale-90"
                                        title="View in OPD Table"
                                    >
                                        <Eye className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                    </button>
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

    let growthPercent = 0;
    if (yesterdayTotal === 0) {
        growthPercent = stats.total > 0 ? 100 : 0;
    } else {
        growthPercent = Math.round(((stats.total - yesterdayTotal) / yesterdayTotal) * 100);
    }
    const isPositive = growthPercent >= 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#F8FAFC] w-full max-w-6xl h-[90vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white/50 ring-1 ring-white/20">

                <div className="px-8 pt-8 pb-6 flex flex-col gap-8 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-20 shadow-sm/50">
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex flex-col justify-center relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Users className="w-16 h-16 text-slate-400" />
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Visits Today</span>
                            <div className="flex items-baseline gap-3 relative z-10">
                                <span className="text-4xl font-extrabold text-slate-800 tracking-tight">{stats.total}</span>
                                <span className={`text-sm font-bold px-2.5 py-1 rounded-lg border ${isPositive ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-rose-600 bg-rose-50 border-rose-100'}`}>
                                    {isPositive ? '+' : ''}{growthPercent}%
                                </span>
                            </div>
                        </div>

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

                            <div className="h-5 w-full rounded-full bg-slate-100/80 shadow-inner p-1 flex gap-1 items-center overflow-hidden">
                                {(() => {
                                    const breakdownTotal = stats.waiting + stats.inConsultation + stats.completed || 1;
                                    return (
                                        <>
                                            <div
                                                className="h-full rounded-full bg-amber-400 shadow-sm transition-all duration-700"
                                                style={{ width: `${(stats.waiting / breakdownTotal) * 100}%` }}
                                                title={`Waiting: ${stats.waiting}`}
                                            />
                                            <div
                                                className="h-full rounded-full bg-blue-500 shadow-sm transition-all duration-700"
                                                style={{ width: `${(stats.inConsultation / breakdownTotal) * 100}%` }}
                                                title={`In-Consultation: ${stats.inConsultation}`}
                                            />
                                            <div
                                                className="h-full rounded-full bg-emerald-500 shadow-sm transition-all duration-700"
                                                style={{ width: `${(stats.completed / breakdownTotal) * 100}%` }}
                                                title={`Completed: ${stats.completed}`}
                                            />
                                        </>
                                    );
                                })()}
                            </div>

                            <div className="flex items-center justify-between mt-4 px-1">
                                <span className="text-base font-bold text-amber-600">{stats.waiting} <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide ml-1">Patients</span></span>
                                <span className="text-base font-bold text-blue-600">{stats.inConsultation} <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide ml-1">Active Docs</span></span>
                                <span className="text-base font-bold text-emerald-600">{stats.completed} <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide ml-1">Finished</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-8 py-4 bg-white border-b border-slate-200/60 flex flex-col md:flex-row items-center gap-4 sticky top-[230px] z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
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

                    <div className="bg-slate-50 px-5 py-3 rounded-xl flex items-center gap-3 border border-transparent cursor-default">
                        <Calendar className="w-5 h-5 text-slate-400" />
                        <span className="text-sm font-bold text-slate-600">{format(new Date(), 'dd MMM, yyyy')}</span>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
                        <div className="bg-slate-50 px-5 py-3 rounded-xl flex items-center gap-2 min-w-fit cursor-pointer hover:bg-slate-100 transition-colors group relative border border-transparent hover:border-slate-200">
                            <span className="text-sm font-bold text-slate-600 group-hover:text-slate-800">
                                {getSelectedDoctorName()}
                            </span>
                            <ChevronDown className="w-4 h-4 text-slate-400 ml-2" />
                            <select
                                value={selectedDocId}
                                onChange={(e) => setSelectedDocId(e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            >
                                <option value="All">All Doctors</option>
                                {sortedDoctors.map(doc => {
                                    const availability = getDoctorAvailabilityInfo(doc.doctor_id);
                                    const isUnavailable = availability.status === 'unavailable';

                                    return (
                                        <option
                                            key={doc.doctor_id}
                                            value={doc.doctor_id.toString()}
                                            disabled={isUnavailable}
                                            className={isUnavailable ? 'text-red-500 bg-red-50 italic font-medium' : 'text-slate-900'}
                                        >
                                            Dr. {doc.first_name} {doc.last_name} {isUnavailable ? '(Unavailable)' : ''}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-[#F8FAFC] px-8 py-8">
                    {filteredEntries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full opacity-60 min-h-[400px]">
                            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                <Users className="w-10 h-10 text-slate-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-700">No patients in queue</h3>
                            <p className="text-lg font-medium text-slate-500 mt-2">There are no pending or in-consultation visits.</p>
                        </div>
                    ) : (
                        <>
                            <QueueTable data={activeList} />

                            {activeList.length === 0 && (
                                <div className="text-center py-20">
                                    <p className="text-xl font-medium text-slate-500">No entries found in this tab.</p>
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
