import React from 'react';
import { Plus } from 'lucide-react';
import { Doctor } from '../../app/client/doctor-schedule/page'; // Ensure this path is correct based on your file structure
import { motion } from 'framer-motion';

interface ModernTimelineViewProps {
    doctors: Doctor[];
    date: Date;
    onAddClick?: () => void;
}

export default function ModernTimelineView({ doctors, date, onAddClick }: ModernTimelineViewProps) {
    // Group doctors and merge shifts
    const processedDoctors = React.useMemo(() => {
        const map = new Map<number, Doctor & { shifts: { start: string; end: string }[] }>();

        doctors.forEach(doc => {
            if (!map.has(doc.doctor_id)) {
                map.set(doc.doctor_id, { ...doc, shifts: [] });
            }
            const entry = map.get(doc.doctor_id)!;

            // Add shift if unique
            if (!entry.shifts.some(s => s.start === doc.start_time && s.end === doc.end_time)) {
                entry.shifts.push({ start: doc.start_time, end: doc.end_time });
            }

            // Ensure main record reflects earliest start time
            if (doc.start_time < entry.start_time) {
                entry.start_time = doc.start_time;
                // Merge other props if needed, but usually doctor details are constant
            }
        });

        return Array.from(map.values())
            .map(doc => {
                doc.shifts.sort((a, b) => a.start.localeCompare(b.start));
                return doc;
            })
            .sort((a, b) => a.start_time.localeCompare(b.start_time));
    }, [doctors]);

    const formatTime = (time: string) => {
        if (!time) return '';
        const [h, m] = time.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const h12 = hour % 12 || 12;
        return `${h12}:${m} ${ampm}`;
    };

    const getDuration = (start: string, end: string) => {
        const s = new Date(`1970-01-01T${start}`);
        const e = new Date(`1970-01-01T${end}`);
        const diff = (e.getTime() - s.getTime()) / 60000; // minutes
        return diff;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-2">
                {processedDoctors.map((doctor, index) => (
                    <motion.div
                        key={`timeline-${doctor.doctor_id}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex gap-6 group"
                    >
                        {/* Time Column */}
                        <div className="w-14 pt-6 text-right flex-shrink-0">
                            <span className="text-xs font-bold text-slate-400 font-mono">
                                {formatTime(doctor.start_time).split(' ')[0]}
                            </span>
                            <span className="text-[10px] font-bold text-slate-300 font-mono block">
                                {formatTime(doctor.start_time).split(' ')[1]}
                            </span>
                        </div>

                        {/* Timeline Marker */}
                        <div className="relative flex flex-col items-center">
                            <div className={`w-3.5 h-3.5 rounded-full mt-6 border-[3px] z-10 box-content bg-white ${doctor.attendance_status === 'Present' ? 'border-emerald-400' :
                                doctor.attendance_status === 'In-progress' ? 'border-amber-400' :
                                    'border-blue-400'
                                }`} />
                            <div className="w-0.5 h-full bg-slate-100 absolute top-8 group-last:hidden" />
                        </div>

                        {/* Card */}
                        <div className="flex-1 bg-white rounded-2xl p-5 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 mb-6">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 overflow-hidden shadow-inner flex-shrink-0">
                                        {doctor.profile_photo ? (
                                            <img src={doctor.profile_photo} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 font-bold text-lg">
                                                {doctor.first_name[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#1e293b] text-lg">
                                            Dr. {doctor.first_name} {doctor.last_name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-sm text-slate-500 font-medium">{doctor.specialization}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                            <span className="text-sm text-blue-500 font-medium">OPD Room {100 + doctor.doctor_id}</span>
                                        </div>

                                        <div className="flex items-center gap-3 mt-3">
                                            {/* <div className="flex -space-x-2">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] shadow-sm">
                                                        👤
                                                    </div>
                                                ))}
                                                <div className="w-7 h-7 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm">
                                                    +3
                                                </div>
                                            </div> */}
                                            <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full">
                                                <span className="text-lg">👥</span>
                                                <span className="text-xs font-bold">
                                                    {doctor.patients_waiting || 0} Patients waiting
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${doctor.attendance_status === 'Present' ? 'bg-emerald-50 text-emerald-600' :
                                        doctor.attendance_status === 'In-progress' ? 'bg-amber-50 text-amber-600' :
                                            'bg-blue-50 text-blue-600'
                                        }`}>
                                        {(!doctor.attendance_status || doctor.attendance_status === 'Scheduled')
                                            ? 'Confirmed'
                                            : doctor.attendance_status}
                                    </span>
                                    <div className="flex flex-col items-end mt-1">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Shifts</span>
                                        {doctor.shifts.map((shift, idx) => (
                                            <div key={idx} className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-slate-700 text-sm">
                                                    {formatTime(shift.start)} - {formatTime(shift.end)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Add Slot Placeholder */}
                {onAddClick && (
                    <motion.div
                        onClick={onAddClick}
                        whileHover={{ scale: 1.01 }}
                        className="flex gap-6 cursor-pointer group opacity-60 hover:opacity-100 transition-opacity"
                    >
                        <div className="w-14 flex-shrink-0" />
                        <div className="relative flex flex-col items-center">
                            <div className="w-3.5 h-3.5 rounded-full mt-6 border-2 border-dashed border-slate-300 bg-slate-50 z-10" />
                        </div>
                        <div className="flex-1 h-20 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/10 transition-all mt-4">
                            <span className="flex items-center gap-2 font-semibold">
                                <Plus className="w-4 h-4" /> Add Schedule Slot
                            </span>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
