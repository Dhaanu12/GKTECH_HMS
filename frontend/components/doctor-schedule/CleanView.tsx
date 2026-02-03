import React from 'react';
import { motion } from 'framer-motion';
import { Clock, User } from 'lucide-react';
import { Doctor } from '../../app/doctor-schedule/page';

interface ViewProps {
    doctors: Doctor[];
    date: Date;
}

export default function CleanView({ doctors, date }: ViewProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor, index) => (
                <motion.div
                    key={doctor.doctor_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden"
                >
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                {doctor.profile_photo ? (
                                    <img src={doctor.profile_photo} alt={doctor.last_name} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-8 h-8 text-gray-400" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Dr. {doctor.first_name} {doctor.last_name}</h3>
                                <p className="text-sm text-blue-600 font-medium">{doctor.specialization}</p>
                                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${doctor.attendance_status === 'Present' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {doctor.attendance_status || 'Checking...'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-600 mb-6 bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>{doctor.start_time.slice(0, 5)} - {doctor.end_time.slice(0, 5)}</span>
                            </div>
                            <div>
                                {doctor.avg_consultation_time} min / patient
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition">
                                View Profile
                            </button>
                            <button className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition shadow-sm hover:shadow-blue-200">
                                Book Now
                            </button>
                        </div>
                    </div>
                </motion.div>
            ))}

            {doctors.length === 0 && (
                <div className="col-span-full text-center py-10 text-gray-500">
                    No doctors available on this day.
                </div>
            )}
        </div>
    );
}
