'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import WeeklyCalendarStrip from '../../../components/doctor-schedule/WeeklyCalendarStrip';
import ModernTimelineView from '../../../components/doctor-schedule/ModernTimelineView';
import { AvailableDoctorsWidget, OPDQueueWidget } from '../../../components/doctor-schedule/SidebarWidgets';
import AddScheduleModal from '../../../components/doctor-schedule/AddScheduleModal';
import { useAuth } from '../../../lib/AuthContext';
import { Search, Bell, Plus } from 'lucide-react';

// Types
import { OpdEntry } from '../../../components/doctor-schedule/SidebarWidgets';

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

export default function DoctorSchedulePage() {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [opdQueue, setOpdQueue] = useState<OpdEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [branches, setBranches] = useState<any[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

    // Permission Check
    const canAddSchedule = user?.role_code === 'CLIENT_ADMIN' || user?.role_code === 'ADMIN' || user?.role_code === 'SUPER_ADMIN';

    // Fetch Branches for multi-branch users (CLIENT_ADMIN)
    useEffect(() => {
        const fetchBranches = async () => {
            if (user?.hospital_id && !user?.branch_id) {
                try {
                    const res = await fetch(`http://localhost:5000/api/branches?hospital_id=${user.hospital_id}`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    });
                    const data = await res.json();
                    if (data.status === 'success' && data.data?.branches?.length > 0) {
                        setBranches(data.data.branches);
                        if (!selectedBranchId) {
                            setSelectedBranchId(data.data.branches[0].branch_id);
                        }
                    }
                } catch (err) {
                    console.error('Failed to fetch branches', err);
                }
            }
        };
        if (user) fetchBranches();
    }, [user]); // Run once when user loads

    // Fetch doctors when date changes
    const fetchDoctors = async () => {
        setLoading(true);
        try {
            const formattedDate = format(selectedDate, 'yyyy-MM-dd');
            const branchId = selectedBranchId || user?.branch_id || 1;

            const response = await fetch(`http://localhost:5000/api/doctor-schedules/available?date=${formattedDate}&branch_id=${branchId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                }
            });

            if (!response.ok) {
                setDoctors([]); // Clear or handle empty
                return;
            }

            const data = await response.json();
            if (data.status === 'success') {
                setDoctors(data.data.doctors);
            } else {
                setDoctors([]);
            }
        } catch (err) {
            console.error(err);
            setDoctors([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchOpdQueue = async () => {
        try {
            const formattedDate = format(selectedDate, 'yyyy-MM-dd');
            const branchId = selectedBranchId || user?.branch_id || 1;

            const response = await fetch(`http://localhost:5000/api/opd?startDate=${formattedDate}&endDate=${formattedDate}&branch_id=${branchId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success') {
                    // Filter for active/waiting patients if needed, or pass all for the widget to filter
                    // Dashboard widget usually shows active/waiting
                    const activeQueue = data.data.opdEntries.filter((entry: OpdEntry) =>
                        ['Registered', 'In-consultation', 'Waiting'].includes(entry.visit_status)
                    );
                    setOpdQueue(activeQueue);
                }
            }
        } catch (err) {
            console.error("Failed to fetch OPD queue", err);
        }
    };

    useEffect(() => {
        if (user && (selectedBranchId || user.branch_id)) {
            fetchDoctors();
            fetchOpdQueue();
        } else if (user && !user.hospital_id) {
            // fallback for users without hospital_id/branches setup
            fetchDoctors();
            fetchOpdQueue();
        }
    }, [selectedDate, user, selectedBranchId]);

    return (
        <div className="w-full min-h-screen bg-[#F8F9FE] text-slate-800 font-sans p-6 lg:p-10 ml-0 overflow-y-auto">
            {/* Top Header Section */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-end gap-6 mb-10">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-between">
                    {/* Empty div or spacer if needed, or just let Search take left/center */}
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search patient, doctor..."
                            className="w-full sm:w-80 pl-11 pr-4 py-3 rounded-full border-none bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] text-slate-600 placeholder:text-slate-400 font-medium"
                        />
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                        {branches.length > 0 && (
                            <select
                                className="px-4 py-2.5 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-sm"
                                value={selectedBranchId || ''}
                                onChange={(e) => setSelectedBranchId(Number(e.target.value))}
                            >
                                {branches.map((b: any) => (
                                    <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>
                                ))}
                            </select>
                        )}
                        <button className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm relative transition-transform hover:scale-105">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>

                        {canAddSchedule && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-[#0F172A] text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 flex items-center gap-2 whitespace-nowrap"
                            >
                                <Plus className="w-4 h-4" /> New Schedule
                            </button>
                        )}
                    </div>
                </div>
            </div>



            {/* Weekly Calendar Strip */}
            <div className="mb-10">
                <WeeklyCalendarStrip selectedDate={selectedDate} onDateChange={setSelectedDate} />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

                {/* Left Column: Schedule & Timeline */}
                <div className="lg:col-span-3">
                    {/* Section Header with Filters */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-[#1e293b]">
                                {format(selectedDate, 'EEEE')}
                            </h2>
                            <p className="text-2xl font-bold text-[#1e293b]">Schedule</p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button className="flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-transparent hover:border-blue-100 text-xs font-bold text-slate-600 shadow-sm hover:shadow-md transition">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]"></span> General
                            </button>
                            <button className="flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-transparent hover:border-purple-100 text-xs font-bold text-slate-600 shadow-sm hover:shadow-md transition">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7]"></span> Surgery
                            </button>
                            <button className="flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-transparent hover:border-orange-100 text-xs font-bold text-slate-600 shadow-sm hover:shadow-md transition">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]"></span> Consultation
                            </button>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {loading ? (
                            <div className="h-64 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                            </div>
                        ) : (
                            <ModernTimelineView
                                doctors={doctors}
                                date={selectedDate}
                                onAddClick={canAddSchedule ? () => setIsModalOpen(true) : undefined}
                            />
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Column: Widgets */}
                <div className="lg:col-span-1 space-y-8">
                    <AvailableDoctorsWidget doctors={doctors} />
                    <OPDQueueWidget queue={opdQueue} />
                </div>
            </div>

            <AddScheduleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedDate={selectedDate}
                onSuccess={() => {
                    fetchDoctors();
                }}
            />
        </div>
    );
}
