import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Stethoscope, User, Calendar, MoreHorizontal, Zap } from 'lucide-react';
export interface Doctor {
    doctor_id: number;
    first_name: string;
    last_name: string;
    specialization: string;
    profile_photo?: string;
    attendance_status?: string;
    start_time: string; // HH:mm:ss
    end_time: string; // HH:mm:ss
    avg_consultation_time: number;
    patients_waiting?: number;
}
import { format } from 'date-fns';

interface ViewProps {
    doctors: Doctor[];
    date: Date;
}

export default function FuturisticView({ doctors, date }: ViewProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {doctors.map((doctor, index) => (
                <motion.div
                    key={doctor.doctor_id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="relative group"
                >
                    {/* Glowing Border Generator */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-500" />

                    {/* Card Content */}
                    <div className="relative h-full bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:translate-y-[-4px] transition-transform duration-300">

                        {/* Holographic Header */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="relative">
                                <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                                    {doctor.profile_photo ? (
                                        <img src={doctor.profile_photo} alt={doctor.last_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-cyan-500">
                                            <User className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${doctor.attendance_status === 'Present' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' :
                                    doctor.attendance_status === 'Late' ? 'bg-yellow-500' : 'bg-red-500'
                                    }`} />
                            </div>

                            <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-cyan-400 transition">
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Doctor Info */}
                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                                Dr. {doctor.first_name} {doctor.last_name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-cyan-200/70 mt-1">
                                <Stethoscope className="w-4 h-4" />
                                <span>{doctor.specialization}</span>
                            </div>
                        </div>

                        {/* Timeline Visual */}
                        <div className="relative h-12 bg-slate-800/50 rounded-lg mb-4 overflow-hidden flex items-center px-3 border border-white/5">
                            <div className="w-full h-1 bg-slate-700 rounded-full relative">
                                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: '60%' }}></div>
                            </div>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-cyan-400">
                                {doctor.start_time.slice(0, 5)} - {doctor.end_time.slice(0, 5)}
                            </div>
                        </div>

                        {/* Stats / Details */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/50 flex flex-col items-center justify-center gap-1 group-hover:border-cyan-500/30 transition-colors">
                                <Clock className="w-4 h-4 text-blue-400" />
                                <span className="text-slate-400">Avg Time</span>
                                <span className="font-bold text-white">{doctor.avg_consultation_time}m</span>
                            </div>
                            <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/50 flex flex-col items-center justify-center gap-1 group-hover:border-cyan-500/30 transition-colors">
                                <Zap className="w-4 h-4 text-yellow-400" />
                                <span className="text-slate-400">Status</span>
                                <span className={`font-bold ${doctor.attendance_status === 'Present' ? 'text-green-400' : 'text-slate-200'
                                    }`}>{doctor.attendance_status || 'N/A'}</span>
                            </div>
                        </div>

                        {/* Action Button */}
                        <button className="w-full mt-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-semibold shadow-lg shadow-cyan-900/40 hover:shadow-cyan-500/20 active:scale-[0.98] transition-all relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/20 translate-y-full hover:translate-y-0 transition-transform duration-300"></div>
                            Book Appointment
                        </button>
                    </div>
                </motion.div>
            ))}

            {doctors.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500">
                    <Calendar className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg">No doctors scheduled for this day.</p>
                </div>
            )}
        </div>
    );
}
