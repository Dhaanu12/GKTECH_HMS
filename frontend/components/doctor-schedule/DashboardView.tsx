import React from 'react';
import { motion } from 'framer-motion';
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

interface ViewProps {
    doctors: Doctor[];
    date: Date;
}

export default function DashboardView({ doctors, date }: ViewProps) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-900 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Doctor</th>
                            <th className="px-6 py-4 font-semibold">Specialization</th>
                            <th className="px-6 py-4 font-semibold">Shift Timing</th>
                            <th className="px-6 py-4 font-semibold text-center">Avg. Time</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 font-semibold text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {doctors.map((doctor, index) => (
                            <motion.tr
                                key={doctor.doctor_id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.02 }}
                                className="hover:bg-gray-50/50"
                            >
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    Dr. {doctor.first_name} {doctor.last_name}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                                        {doctor.specialization}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-mono">
                                    {doctor.start_time.slice(0, 5)} - {doctor.end_time.slice(0, 5)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {doctor.avg_consultation_time}m
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${doctor.attendance_status === 'Present' ? 'bg-green-50 text-green-700 border-green-200' :
                                        doctor.attendance_status === 'Late' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                            'bg-gray-50 text-gray-600 border-gray-200'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${doctor.attendance_status === 'Present' ? 'bg-green-500' :
                                            doctor.attendance_status === 'Late' ? 'bg-yellow-500' : 'bg-gray-400'
                                            }`}></span>
                                        {doctor.attendance_status || 'N/A'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline">
                                        Manage
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                        {doctors.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    No records found for this date.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
