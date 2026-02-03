'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Save, Clock, Bed, Stethoscope, Users, Check, AlertCircle, Sun, Moon, Copy, Building2, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ClinicSchedule {
    [key: string]: { isOpen: boolean; start1: string; end1: string; start2: string; end2: string };
}

const DEFAULT_SCHEDULE: ClinicSchedule = {
    monday: { isOpen: true, start1: '10:00', end1: '13:00', start2: '17:00', end2: '19:00' },
    tuesday: { isOpen: true, start1: '10:00', end1: '13:00', start2: '17:00', end2: '19:00' },
    wednesday: { isOpen: true, start1: '10:00', end1: '13:00', start2: '17:00', end2: '19:00' },
    thursday: { isOpen: true, start1: '10:00', end1: '13:00', start2: '17:00', end2: '19:00' },
    friday: { isOpen: true, start1: '10:00', end1: '13:00', start2: '17:00', end2: '19:00' },
    saturday: { isOpen: true, start1: '10:00', end1: '13:00', start2: '', end2: '' },
    sunday: { isOpen: false, start1: '00:00', end1: '00:00', start2: '', end2: '' },
};

export default function ClinicSetupPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(true); // Default to edit mode
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Form Data
    const [consultationRooms, setConsultationRooms] = useState<number | string>(0);
    const [daycareAvailable, setDaycareAvailable] = useState(false);
    const [daycareBeds, setDaycareBeds] = useState<number | string>(0);
    const [schedule, setSchedule] = useState<ClinicSchedule>(DEFAULT_SCHEDULE);
    const [doctors, setDoctors] = useState<any[]>([]);

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    useEffect(() => {
        if (user?.branch_id) {
            fetchClinicData();
            fetchDoctorsList();
        }
    }, [user]);

    // Normalize time format from "HH:MM AM/PM" or "HH:MM:SS" to "HH:MM" 24-hour format
    const normalizeTime = (timeStr: string): string => {
        if (!timeStr || timeStr === '') return '';

        // Clean up the string
        const cleaned = timeStr.trim();

        // If already in HH:MM format (no AM/PM), just return first 5 chars
        if (!cleaned.includes('AM') && !cleaned.includes('PM') && !cleaned.includes('am') && !cleaned.includes('pm')) {
            const result = cleaned.slice(0, 5); // Remove seconds if present
            return result;
        }

        // Handle malformed data like "01:00 05:00 PM" - extract the last time with AM/PM
        const timeWithPeriodMatch = cleaned.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i);
        if (timeWithPeriodMatch) {
            let hours = parseInt(timeWithPeriodMatch[1]);
            const minutes = timeWithPeriodMatch[2];
            const period = timeWithPeriodMatch[3].toUpperCase();

            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;

            const result = `${hours.toString().padStart(2, '0')}:${minutes}`;
            return result;
        }

        // Fallback: try to extract any valid time pattern
        const anyTimeMatch = cleaned.match(/(\d{1,2}):(\d{2})/);
        if (anyTimeMatch) {
            const result = `${anyTimeMatch[1].padStart(2, '0')}:${anyTimeMatch[2]}`;
            return result;
        }

        console.warn('[normalizeTime] Could not normalize time:', timeStr);
        return '';
    };

    // Format time for display (convert 24-hour to 12-hour with AM/PM)
    const formatTimeForDisplay = (time24: string): string => {
        if (!time24 || time24 === '') return '';

        try {
            const [hours, minutes] = time24.split(':').map(Number);
            const period = hours >= 12 ? 'PM' : 'AM';
            const hours12 = hours % 12 || 12;
            return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
        } catch (e) {
            return time24;
        }
    };

    const fetchClinicData = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/branches/${user?.branch_id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (data.status === 'success') {
                const b = data.data.branch;
                setConsultationRooms(b.consultation_rooms || 0);
                setDaycareAvailable(b.daycare_available || false);
                setDaycareBeds(b.daycare_beds || 0);
                if (b.clinic_schedule) {
                    // Normalize all time values
                    const normalizedSchedule: ClinicSchedule = {};
                    Object.keys(b.clinic_schedule).forEach(day => {
                        const rawDay = b.clinic_schedule[day];
                        normalizedSchedule[day] = {
                            isOpen: rawDay.isOpen,
                            start1: normalizeTime(rawDay.start1),
                            end1: normalizeTime(rawDay.end1),
                            start2: normalizeTime(rawDay.start2),
                            end2: normalizeTime(rawDay.end2)
                        };
                    });
                    setSchedule(normalizedSchedule);
                    setIsEditing(false);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchDoctorsList = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/doctors?branch_id=${user?.branch_id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (data.status === 'success') {
                setDoctors(data.data.doctors || []);
            }
        } catch (err) {
            console.error('Failed to fetch doctors', err);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch(`http://localhost:5000/api/branches/${user?.branch_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    consultation_rooms: Number(consultationRooms) || 0,
                    daycare_available: daycareAvailable,
                    daycare_beds: Number(daycareBeds) || 0,
                    clinic_schedule: schedule
                })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Clinic setup saved successfully!' });
                setIsEditing(false); // Switch to View Mode
                setTimeout(() => setMessage(null), 3000);
            } else {
                throw new Error('Failed to save');
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error saving settings. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    const copyMondayToAll = () => {
        if (!isEditing) return;
        const mondaySchedule = schedule['monday'];
        const newSchedule = { ...schedule };

        days.forEach(day => {
            if (day !== 'monday' && day !== 'sunday') {
                newSchedule[day] = { ...mondaySchedule };
            }
        });

        setSchedule(newSchedule);
        setMessage({ type: 'success', text: 'Monday schedule copied to all weekdays!' });
        setTimeout(() => setMessage(null), 2000);
    };

    return (
        <div className="w-full min-h-screen bg-[#F8F9FE] text-slate-800 font-sans p-6 lg:p-12">
            {/* Header */}
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-extrabold text-[#1e293b] tracking-tight">Clinic Setup</h1>
                    <p className="text-slate-500 font-medium mt-2">Configure facilities and manage operating hours</p>
                </div>

                <div className="flex items-center gap-4">
                    {isEditing ? (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed transform active:scale-95"
                        >
                            {saving ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <><Save className="w-5 h-5" /> Save Changes</>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="bg-white text-slate-700 border border-slate-200 px-8 py-3.5 rounded-2xl text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center gap-2 transform active:scale-95"
                        >
                            <Pencil className="w-4 h-4" /> Edit Configuration
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Col: Facilities & Hours */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Status Message */}
                    <AnimatePresence>
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`p-4 rounded-2xl flex items-center gap-3 backdrop-blur-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-700 border border-green-500/20' : 'bg-red-500/10 text-red-700 border border-red-500/20'}`}
                            >
                                {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                <span className="font-bold">{message.text}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Facility Details */}
                    <div className="bg-white rounded-[2rem] p-8 lg:p-10 shadow-sm border border-slate-100">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Building2 className="w-6 h-6" />
                            </div>
                            Facility Configuration
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className={`group bg-slate-50 rounded-2xl p-6 border transition-all duration-300 ${isEditing ? 'border-slate-100 hover:border-blue-200' : 'border-transparent bg-slate-50/50'}`}>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Consultation Rooms</label>
                                <div className="flex items-center gap-5">
                                    <div className={`w-12 h-12 rounded-xl text-blue-500 flex items-center justify-center ring-1 ${isEditing ? 'bg-white ring-slate-100 shadow-sm' : 'bg-slate-100 ring-transparent'}`}>
                                        <Stethoscope className="w-6 h-6" />
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        disabled={!isEditing}
                                        value={consultationRooms}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setConsultationRooms(val === '' ? '' : parseInt(val));
                                        }}
                                        onBlur={() => {
                                            if (consultationRooms === '') setConsultationRooms(0);
                                        }}
                                        className={`flex-1 bg-transparent text-3xl font-bold border-none focus:ring-0 p-0 placeholder-slate-200 ${!isEditing ? 'text-slate-600 cursor-default' : 'text-slate-800'}`}
                                    />
                                </div>
                            </div>

                            <div className={`group bg-slate-50 rounded-2xl p-6 border transition-all duration-300 ${daycareAvailable ? 'border-orange-200 bg-orange-50/30' : 'border-slate-100'} ${!isEditing && !daycareAvailable ? 'opacity-60' : ''}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Daycare Unit</label>
                                    <button
                                        disabled={!isEditing}
                                        onClick={() => setDaycareAvailable(!daycareAvailable)}
                                        className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${daycareAvailable ? 'bg-orange-500' : 'bg-slate-300'} ${!isEditing ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${daycareAvailable ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                <div className={`flex items-center gap-5 transition-all duration-300 ${daycareAvailable ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                                    <div className={`w-12 h-12 rounded-xl text-orange-500 flex items-center justify-center ring-1 ${isEditing ? 'bg-white ring-slate-100 shadow-sm' : 'bg-white/50 ring-transparent'}`}>
                                        <Bed className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 flex items-baseline gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            disabled={!isEditing || !daycareAvailable}
                                            value={daycareBeds}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setDaycareBeds(val === '' ? '' : parseInt(val));
                                            }}
                                            onBlur={() => {
                                                if (daycareBeds === '') setDaycareBeds(0);
                                            }}
                                            className={`w-16 bg-transparent text-3xl font-bold border-none focus:ring-0 p-0 ${!isEditing ? 'text-slate-600 cursor-default' : 'text-slate-800'}`}
                                        />
                                        <span className="text-sm font-bold text-slate-400">Beds</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Clinic Hours - Redesigned */}
                    <div className="bg-white rounded-[2rem] p-8 lg:p-10 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                    <Clock className="w-6 h-6" />
                                </div>
                                Clinic Schedule
                            </h2>
                        </div>

                        {/* Schedule Header Rows - Futuristic Grid */}
                        <div className="hidden md:grid grid-cols-12 gap-4 px-4 pb-4 border-b border-slate-100 mb-4">
                            <div className="col-span-3 text-xs font-bold text-slate-400 uppercase tracking-widest pl-10">Day</div>
                            <div className="col-span-4 flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-widest">
                                <Sun className="w-3.5 h-3.5" /> Morning Shift
                            </div>
                            <div className="col-span-4 flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-widest">
                                <Moon className="w-3.5 h-3.5" /> Evening Shift
                            </div>
                        </div>

                        <div className="space-y-3">
                            {days.map(day => (
                                <div key={day} className={`group grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-3 rounded-2xl transition-all duration-200 ${schedule[day]?.isOpen ? 'hover:bg-slate-50' : 'opacity-60'} ${!isEditing ? 'pointer-events-none' : ''}`}>

                                    {/* Day Checkbox */}
                                    <div className="col-span-3 flex items-center gap-4">
                                        <label className={`relative flex items-center justify-center ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}>
                                            <input
                                                type="checkbox"
                                                disabled={!isEditing}
                                                checked={schedule[day]?.isOpen}
                                                onChange={(e) => setSchedule({
                                                    ...schedule,
                                                    [day]: { ...schedule[day], isOpen: e.target.checked }
                                                })}
                                                className={`peer w-6 h-6 rounded-lg border-2 text-blue-600 focus:ring-0 transition-all checked:bg-slate-900 checked:border-slate-900 ${isEditing ? 'border-slate-300 cursor-pointer' : 'border-slate-200 cursor-default opacity-70'}`}
                                            />
                                            <Check className="w-3.5 h-3.5 text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                                        </label>
                                        <span className={`capitalize font-bold text-sm ${schedule[day]?.isOpen ? 'text-slate-700' : 'text-slate-400'}`}>{day}</span>
                                    </div>

                                    {schedule[day]?.isOpen ? (
                                        <>
                                            {/* Morning Inputs */}
                                            <div className="col-span-9 md:col-span-4 bg-slate-50/50 md:bg-transparent rounded-xl p-3 md:p-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="md:hidden text-xs font-bold text-orange-400 w-16">Morning</span>
                                                    {isEditing ? (
                                                        <div className="flex-1 grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                                                            <input
                                                                type="time"
                                                                value={schedule[day].start1}
                                                                onChange={(e) => setSchedule({ ...schedule, [day]: { ...schedule[day], start1: e.target.value } })}
                                                                className="w-full px-3 py-2 rounded-lg bg-white border border-orange-200 text-xs font-bold focus:ring-2 focus:ring-orange-100 focus:border-orange-300 text-center text-slate-700"
                                                                style={{ minWidth: '100px' }}
                                                            />
                                                            <span className="text-slate-400 font-light text-xs">-</span>
                                                            <input
                                                                type="time"
                                                                value={schedule[day].end1}
                                                                onChange={(e) => setSchedule({ ...schedule, [day]: { ...schedule[day], end1: e.target.value } })}
                                                                className="w-full px-3 py-2 rounded-lg bg-white border border-orange-200 text-xs font-bold focus:ring-2 focus:ring-orange-100 focus:border-orange-300 text-center text-slate-700"
                                                                style={{ minWidth: '100px' }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-slate-600">
                                                            <span>{formatTimeForDisplay(schedule[day].start1)}</span>
                                                            <span className="text-slate-300">-</span>
                                                            <span>{formatTimeForDisplay(schedule[day].end1)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Evening Inputs */}
                                            <div className="col-span-9 md:col-span-4 bg-slate-50/50 md:bg-transparent rounded-xl p-3 md:p-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="md:hidden text-xs font-bold text-indigo-400 w-16">Evening</span>
                                                    {isEditing ? (
                                                        <div className="flex-1 grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                                                            <input
                                                                type="time"
                                                                value={schedule[day].start2}
                                                                onChange={(e) => setSchedule({ ...schedule, [day]: { ...schedule[day], start2: e.target.value } })}
                                                                className="w-full px-3 py-2 rounded-lg bg-white border border-indigo-200 text-xs font-bold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 text-center text-slate-700"
                                                                style={{ minWidth: '100px' }}
                                                            />
                                                            <span className="text-slate-400 font-light text-xs">-</span>
                                                            <input
                                                                type="time"
                                                                value={schedule[day].end2}
                                                                onChange={(e) => setSchedule({ ...schedule, [day]: { ...schedule[day], end2: e.target.value } })}
                                                                className="w-full px-3 py-2 rounded-lg bg-white border border-indigo-200 text-xs font-bold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 text-center text-slate-700"
                                                                style={{ minWidth: '100px' }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-slate-600">
                                                            {schedule[day].start2 && schedule[day].end2 ? (
                                                                <>
                                                                    <span>{formatTimeForDisplay(schedule[day].start2)}</span>
                                                                    <span className="text-slate-300">-</span>
                                                                    <span>{formatTimeForDisplay(schedule[day].end2)}</span>
                                                                </>
                                                            ) : (
                                                                <span className="text-xs text-slate-400">No evening shift</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="col-span-9 md:col-span-8 flex items-center">
                                            <span className="text-xs font-bold text-slate-300 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">Clinic Closed</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Col: Doctors List Summary */}
                <div className="lg:col-span-4">
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 h-full max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-8 flex-shrink-0">
                            <h2 className="text-xl font-bold text-[#1e293b] flex items-center gap-3">
                                <Users className="w-6 h-6 text-emerald-500" />
                                Doctors
                            </h2>
                            <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-extrabold border border-emerald-100">{doctors.length} Active</span>
                        </div>

                        <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                            {doctors.length > 0 ? doctors.map((doc, idx) => (
                                <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/50 hover:bg-white hover:shadow-lg hover:shadow-slate-100/50 transition-all border border-slate-100/50 hover:border-slate-100 group cursor-pointer">
                                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                                        {doc.profile_photo ? (
                                            <img src={doc.profile_photo} className="w-full h-full object-cover" alt="Doctor" />
                                        ) : (
                                            <span className="text-lg font-bold text-slate-400 group-hover:text-slate-600 transition-colors">{doc.first_name[0]}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">Dr. {doc.first_name} {doc.last_name}</h4>
                                        <p className="text-xs font-semibold text-slate-400 truncate mt-0.5">{doc.specialization}</p>
                                        <div className="flex items-center gap-1.5 mt-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                                            <span className="text-[10px] uppercase font-bold text-emerald-600/80 tracking-wide">Available</span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-12 flex flex-col items-center">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300 ring-4 ring-slate-50/50">
                                        <Users className="w-10 h-10" />
                                    </div>
                                    <p className="text-slate-400 font-bold mb-1">No doctors registered</p>
                                    <p className="text-xs text-slate-400 max-w-[150px]">Add doctors to manage their schedules here.</p>
                                    <button className="mt-6 text-xs text-white bg-slate-800 px-6 py-2.5 rounded-xl font-bold hover:bg-slate-700 transition">Add New Doctor</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #e2e8f0;
                    border-radius: 20px;
                }
            `}</style>
        </div>
    );
}
