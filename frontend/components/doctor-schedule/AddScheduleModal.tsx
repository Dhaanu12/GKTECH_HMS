import React, { useState, useEffect } from 'react';
import { X, Save, Clock, Building2, Hourglass, Zap, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addMinutes, parse, isValid } from 'date-fns';
import { useAuth } from '../../lib/AuthContext';

interface AddScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    selectedDate?: Date;
}

type ScheduleMode = 'full' | 'hourly' | 'half_hour';

export default function AddScheduleModal({ isOpen, onClose, onSuccess, selectedDate }: AddScheduleModalProps) {
    const { user } = useAuth();

    // Core Form State
    const [formData, setFormData] = useState({
        doctor_id: '',
        branch_id: 1,
        day_of_week: 'Monday',
        start_time: '09:00',
        end_time: '17:00',
        avg_consultation_time: 15,
        remarks: ''
    });

    // UI State
    const [mode, setMode] = useState<ScheduleMode>('full');
    const [loading, setLoading] = useState(false);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [clinicSchedule, setClinicSchedule] = useState<any>(null);

    // Derived State for Start Time / Duration Logic
    const [durationHours, setDurationHours] = useState(1);

    useEffect(() => {
        if (isOpen && user) {
            fetchDoctors();
            if (user.branch_id) {
                setFormData(prev => ({ ...prev, branch_id: user.branch_id || 1 }));
                fetchClinicSchedule();
            }
            if (selectedDate) {
                const day = format(selectedDate, 'EEEE');
                setFormData(prev => ({ ...prev, day_of_week: day }));
            }
        }
    }, [isOpen, user, selectedDate]);

    // Update time when mode changes
    useEffect(() => {
        if (!clinicSchedule) return;

        const dayKey = formData.day_of_week.toLowerCase();
        const schedule = clinicSchedule[dayKey];

        if (mode === 'full') {
            if (schedule && schedule.isOpen) {
                setFormData(prev => ({
                    ...prev,
                    start_time: schedule.start1 || '09:00',
                    end_time: schedule.end1 || '17:00' // Default to first shift if split
                }));
            }
        }
    }, [mode, clinicSchedule, formData.day_of_week]);

    const fetchClinicSchedule = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/branches/${user?.branch_id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (data.status === 'success' && data.data.branch.clinic_schedule) {
                setClinicSchedule(data.data.branch.clinic_schedule);
            }
        } catch (err) {
            console.error('Failed to fetch clinic schedule', err);
        }
    };

    const fetchDoctors = async () => {
        try {
            let queryParams = '';
            if (user?.hospital_id) queryParams = `?hospital_id=${user.hospital_id}`;
            else if (user?.branch_id) queryParams = `?branch_id=${user.branch_id}`;

            const response = await fetch(`http://localhost:5000/api/doctors${queryParams}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
            });
            if (response.ok) {
                const data = await response.json();
                let docs = data.data?.doctors || [];
                docs = Array.from(new Map(docs.map((doc: any) => [doc.doctor_id, doc])).values());
                setDoctors(docs);
                if (docs.length > 0 && !formData.doctor_id) {
                    setFormData(prev => ({ ...prev, doctor_id: docs[0].doctor_id }));
                }
            }
        } catch (error) {
            console.error('Failed to fetch doctors', error);
        }
    };

    const generateTimeSlots = (stepMinutes: number) => {
        if (!clinicSchedule) return [];
        const dayKey = formData.day_of_week.toLowerCase();
        const schedule = clinicSchedule[dayKey];

        if (!schedule || !schedule.isOpen) return [];

        const slots: string[] = [];
        const processShift = (startStr: string, endStr: string) => {
            if (!startStr || !endStr) return;
            // Parse formats like "10:00 AM" or "10:00"
            const parseTime = (t: string) => {
                const d = new Date();
                const [time, period] = t.split(' ');
                let [hours, minutes] = time.split(':').map(Number);
                if (period === 'PM' && hours !== 12) hours += 12;
                if (period === 'AM' && hours === 12) hours = 0;
                d.setHours(hours, minutes, 0, 0);
                return d;
            };

            let current = parseTime(startStr);
            const end = parseTime(endStr);

            while (current < end) {
                slots.push(format(current, 'hh:mm a')); // Store as 10:00 AM
                current = addMinutes(current, stepMinutes);
            }
        };

        processShift(schedule.start1, schedule.end1);
        processShift(schedule.start2, schedule.end2);

        // Deduplicate slots and filter empty
        return Array.from(new Set(slots)).filter(Boolean);
    };

    const handleStartTimeChange = (time: string) => {
        let newEndTime = formData.end_time;

        // Helper to parse "10:00 AM" back to Date object
        const parseTime = (t: string) => {
            const d = new Date();
            const [timePart, period] = t.split(' ');
            let [hours, minutes] = timePart.split(':').map(Number);
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            d.setHours(hours, minutes, 0, 0);
            return d;
        };

        if (mode === 'half_hour') {
            const start = parseTime(time);
            newEndTime = format(addMinutes(start, 30), 'hh:mm a');
        } else if (mode === 'hourly') {
            const start = parseTime(time);
            newEndTime = format(addMinutes(start, durationHours * 60), 'hh:mm a');
        }

        setFormData(prev => ({
            ...prev,
            start_time: time,
            end_time: newEndTime
        }));
    };

    const handleDurationChange = (hours: number) => {
        setDurationHours(hours);
        if (mode === 'hourly' && formData.start_time) {
            const start = parse(formData.start_time, 'HH:mm', new Date());
            const newEndTime = format(addMinutes(start, hours * 60), 'HH:mm');
            setFormData(prev => ({ ...prev, end_time: newEndTime }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/doctor-schedules', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                onSuccess();
                onClose();
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Failed to save schedule');
            }
        } catch (err: any) {
            alert(err.message || 'Error saving schedule');
        } finally {
            setLoading(false);
        }
    };

    const timeSlots = mode === 'full' ? [] : generateTimeSlots(mode === 'hourly' ? 60 : 30);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />
                    <motion.div
                        key="modal-content"
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        className="fixed inset-0 m-auto max-w-xl h-fit bg-white rounded-3xl shadow-2xl z-50 overflow-hidden border border-slate-100"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Schedule Availability</h2>
                                <p className="text-xs font-bold text-slate-400 mt-0.5">Configure when this doctor is available</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition text-slate-400 hover:text-slate-600 shadow-sm border border-transparent hover:border-slate-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">

                            {/* Doctor & Day Row */}
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2">Doctor</label>
                                    <select
                                        required
                                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-sm outline-none"
                                        value={formData.doctor_id}
                                        onChange={e => setFormData({ ...formData, doctor_id: e.target.value })}
                                    >
                                        <option key="default-doc" value="">Select Doctor</option>
                                        {doctors.map((doc, index) => (
                                            <option key={doc.doctor_id || `doc-${index}`} value={doc.doctor_id}>{doc.first_name} {doc.last_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2">Day</label>
                                    <select
                                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-sm outline-none"
                                        value={formData.day_of_week}
                                        onChange={e => setFormData({ ...formData, day_of_week: e.target.value })}
                                    >
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                            <option key={day} value={day}>{day}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Mode Selection */}
                            <div>
                                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">Schedule Type</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setMode('full')}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${mode === 'full' ? 'border-blue-500 bg-blue-50/50 text-blue-700' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'}`}
                                    >
                                        <Building2 className={`w-6 h-6 mb-1 ${mode === 'full' ? 'text-blue-500' : 'text-slate-300'}`} />
                                        <span className="text-xs font-bold">Clinic Hours</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setMode('hourly')}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${mode === 'hourly' ? 'border-purple-500 bg-purple-50/50 text-purple-700' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'}`}
                                    >
                                        <Hourglass className={`w-6 h-6 mb-1 ${mode === 'hourly' ? 'text-purple-500' : 'text-slate-300'}`} />
                                        <span className="text-xs font-bold">Hourly</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setMode('half_hour')}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${mode === 'half_hour' ? 'border-orange-500 bg-orange-50/50 text-orange-700' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'}`}
                                    >
                                        <Zap className={`w-6 h-6 mb-1 ${mode === 'half_hour' ? 'text-orange-500' : 'text-slate-300'}`} />
                                        <span className="text-xs font-bold">30 Mins</span>
                                    </button>
                                </div>
                            </div>

                            {/* Dynamic Time Selection */}
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                {mode === 'full' ? (
                                    <div className="space-y-4">
                                        <label className="block text-xs font-bold text-slate-500 uppercase">Select Shift</label>
                                        <div className="grid grid-cols-1 gap-3">
                                            {/* Shift 1 */}
                                            {clinicSchedule?.[formData.day_of_week.toLowerCase()]?.start1 && (
                                                <button
                                                    key="shift-1"
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({
                                                        ...prev,
                                                        start_time: clinicSchedule[formData.day_of_week.toLowerCase()].start1,
                                                        end_time: clinicSchedule[formData.day_of_week.toLowerCase()].end1
                                                    }))}
                                                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${formData.start_time === clinicSchedule[formData.day_of_week.toLowerCase()].start1
                                                        ? 'border-blue-500 bg-blue-50/50 shadow-md'
                                                        : 'border-slate-100 bg-white hover:border-blue-200'
                                                        }`}
                                                >
                                                    <div className="flex flex-col items-start">
                                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Morning / Shift 1</span>
                                                        <span className="text-lg font-bold text-slate-700">
                                                            {clinicSchedule[formData.day_of_week.toLowerCase()].start1} - {clinicSchedule[formData.day_of_week.toLowerCase()].end1}
                                                        </span>
                                                    </div>
                                                    {formData.start_time === clinicSchedule[formData.day_of_week.toLowerCase()].start1 && (
                                                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                                                    )}
                                                </button>
                                            )}

                                            {/* Shift 2 */}
                                            {clinicSchedule?.[formData.day_of_week.toLowerCase()]?.start2 && (
                                                <button
                                                    key="shift-2"
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({
                                                        ...prev,
                                                        start_time: clinicSchedule[formData.day_of_week.toLowerCase()].start2,
                                                        end_time: clinicSchedule[formData.day_of_week.toLowerCase()].end2
                                                    }))}
                                                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${formData.start_time === clinicSchedule[formData.day_of_week.toLowerCase()].start2
                                                        ? 'border-blue-500 bg-blue-50/50 shadow-md'
                                                        : 'border-slate-100 bg-white hover:border-blue-200'
                                                        }`}
                                                >
                                                    <div className="flex flex-col items-start">
                                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Evening / Shift 2</span>
                                                        <span className="text-lg font-bold text-slate-700">
                                                            {clinicSchedule[formData.day_of_week.toLowerCase()].start2} - {clinicSchedule[formData.day_of_week.toLowerCase()].end2}
                                                        </span>
                                                    </div>
                                                    {formData.start_time === clinicSchedule[formData.day_of_week.toLowerCase()].start2 && (
                                                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Select Start Time</label>
                                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar p-1">
                                                {timeSlots.length > 0 ? timeSlots.map((time, idx) => (
                                                    <button
                                                        key={`${time}-${idx}`}
                                                        type="button"
                                                        onClick={() => handleStartTimeChange(time)}
                                                        className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-all ${formData.start_time === time
                                                            ? (mode === 'hourly' ? 'bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-200' : 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-200')
                                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                                                    >
                                                        {time}
                                                    </button>
                                                )) : (
                                                    <span className="text-xs font-bold text-slate-400 italic py-2">No slots available for this day. Check Clinic Hours.</span>
                                                )}
                                            </div>
                                        </div>

                                        {mode === 'hourly' && (
                                            <div className="flex items-center gap-4 pt-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Duration:</label>
                                                <div className="flex gap-2">
                                                    {[1, 2, 3, 4].map(h => (
                                                        <button
                                                            key={h}
                                                            type="button"
                                                            onClick={() => handleDurationChange(h)}
                                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${durationHours === h ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}
                                                        >
                                                            {h}h
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="flex-1 text-right text-xs font-bold text-slate-400">
                                                    Ends at <span className="text-slate-800">{formData.end_time}</span>
                                                </div>
                                            </div>
                                        )}

                                        {mode === 'half_hour' && (
                                            <div className="flex justify-end pt-2">
                                                <div className="text-xs font-bold text-slate-400">
                                                    Session ends at <span className="text-slate-800">{formData.end_time}</span> (30 mins)
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Remarks Field */}
                            <div>
                                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2">Remarks (Optional)</label>
                                <textarea
                                    className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-sm outline-none resize-none"
                                    rows={3}
                                    placeholder="Add any special notes or instructions for this schedule..."
                                    value={formData.remarks}
                                    onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <button type="button" onClick={onClose} className="px-5 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-bold transition">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xl shadow-slate-900/20 transition flex items-center gap-2 font-bold transform hover:scale-[1.02] active:scale-95"
                                >
                                    {loading ? '...' : <><CheckCircle2 className="w-5 h-5" /> Confirm Schedule</>}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                    border-radius: 4px;
                }
            `}</style>
        </AnimatePresence>
    );
}
