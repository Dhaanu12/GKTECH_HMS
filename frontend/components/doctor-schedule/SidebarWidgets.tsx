import React from 'react';
import { Doctor } from '../../app/client/doctor-schedule/page'; // Ensure correct path

interface WidgetProps {
    doctors: Doctor[];
}

export function AvailableDoctorsWidget({ doctors }: WidgetProps) {
    const presentDoctors = doctors.filter(d => d.attendance_status === 'Present' || !d.attendance_status);
    // Deduplicate doctors by ID (handle multiple shifts)
    const uniqueDoctors = Array.from(new Map(presentDoctors.map(d => [d.doctor_id, d])).values());

    return (
        <div className="bg-white rounded-3xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-50">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-lg text-[#1e293b]">Available</h3>
                    <h3 className="font-bold text-lg text-[#1e293b]">Doctors</h3>
                </div>
                <button className="text-xs text-blue-500 font-bold hover:underline uppercase tracking-wide">View All</button>
            </div>

            <div className="space-y-6">
                {uniqueDoctors.slice(0, 3).map((doctor) => (
                    <div key={doctor.doctor_id} className="flex items-center gap-4 group cursor-pointer">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-bold overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                            {doctor.profile_photo ? (
                                <img src={doctor.profile_photo} alt="" className="w-full h-full object-cover" />
                            ) : doctor.first_name[0]}
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-slate-800">Dr. {doctor.first_name}</h4>
                            <p className="text-xs text-slate-500 font-medium">{doctor.specialization}</p>
                        </div>
                        <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_10px_2px_rgba(16,185,129,0.3)]"></div>
                    </div>
                ))}
                {presentDoctors.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No doctors currently available.</p>}
            </div>
        </div>
    );
}

export interface OpdEntry {
    opd_id: number;
    patient_id: number;
    patient_first_name: string;
    patient_last_name: string;
    token_number: string;
    visit_status: string;
    doctor_first_name: string;
    doctor_last_name: string;
    is_active?: boolean; // Derived or from DB
    visit_time?: string;
}

interface OPDQueueWidgetProps {
    queue: OpdEntry[];
}

export function OPDQueueWidget({ queue = [] }: OPDQueueWidgetProps) {

    return (
        <div className="">
            {/* Background decoration */}
            {/* <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10" /> */}

            {/* <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                    <h3 className="font-bold text-lg">OPD</h3>
                    <h3 className="font-bold text-lg">Queue</h3>
                </div>
                <span className="px-2 py-1 bg-slate-800/80 backdrop-blur-sm rounded text-[10px] text-slate-300 font-mono border border-slate-700">LIVE</span>
            </div> */}

            {/* <div className="space-y-4 relative z-10 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent pr-2">
                {queue.length > 0 ? (
                    queue.map((item, idx) => {
                        const isActive = item.visit_status === 'In-consultation';
                        const initials = `${item.patient_first_name?.[0] || ''}${item.patient_last_name?.[0] || ''}`;
                        return (
                            <div key={item.opd_id} className={`p-3 rounded-2xl flex items-center gap-4 ${isActive ? 'bg-[#334155] border border-slate-600' : 'hover:bg-slate-800/50 transition border border-transparent'}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-lg ${isActive ? 'bg-[#0ea5e9] text-white' : 'bg-slate-700 text-slate-400'}`}>
                                    {initials}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold">{item.patient_first_name} {item.patient_last_name}</h4>
                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                        Token {item.token_number} • {isActive ? `Dr. ${item.doctor_first_name}` : item.visit_status}
                                    </p>
                                </div> */}
            {/* {isActive && <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />} */}
            {/* {item.visit_time && <span className="text-[10px] text-slate-500 font-mono">{format(new Date(`1970-01-01T${item.visit_time}`), 'hh:mm a')}</span>} */}
            {/* </div> */}
            {/* ); */}
            {/* }) */}
            {/* ) : ( */}
            {/* <div className="text-slate-400 text-center text-xs py-8"> */}
            {/* No patients in queue */}
            {/* </div> */}
            {/* )} */}
            {/* </div> */}

            {/* <button className="w-full mt-8 py-3.5 rounded-xl bg-[#0ea5e9] hover:bg-[#0284c7] transition font-semibold text-xs shadow-lg shadow-blue-500/20 tracking-wide uppercase"> */}
            {/* View Full Queue */}
            {/* </button> */}
        </div>
    );
}
