'use client';

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Search, Calendar, Clock, User, Stethoscope, ArrowRight, X, CalendarClock, Phone, Sun, CloudSun, Moon, AlertCircle, RefreshCw } from 'lucide-react';
import SearchableSelect from '../../../../components/ui/SearchableSelect';
import { format } from 'date-fns';

interface UpcomingAppointmentsProps {
    doctors: any[];
    onConvertToOPD: (patient: any) => void;
    refreshTrigger?: number;
}

interface UpcomingAppointmentsProps {
    doctors: any[];
    onConvertToOPD: (patient: any) => void;
    refreshTrigger?: number;
    onAppointmentUpdate?: () => void;
}

export default function UpcomingAppointments({ doctors, onConvertToOPD, refreshTrigger = 0, onAppointmentUpdate }: UpcomingAppointmentsProps) {
    const [activeTab, setActiveTab] = useState<'Upcoming' | 'Missed'>('Upcoming');
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDoctorId, setSelectedDoctorId] = useState('');

    // Reschedule & Cancel States
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [appointmentToCancel, setAppointmentToCancel] = useState<any>(null);
    const [cancelReason, setCancelReason] = useState('Patient Request');

    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [appointmentToReschedule, setAppointmentToReschedule] = useState<any>(null);
    const [timeSlotCategory, setTimeSlotCategory] = useState<'Morning' | 'Afternoon' | 'Evening'>('Morning');
    const [rescheduleError, setRescheduleError] = useState<string | null>(null);
    const [rescheduleForm, setRescheduleForm] = useState({
        appointment_date: '',
        appointment_time: '',
        doctor_id: '',
        reason: ''
    });
    const [doctorSchedules, setDoctorSchedules] = useState<any[]>([]);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);

    // Fetch booked slots for reschedule modal
    const fetchBookedSlots = async (doctorId: string, date: string) => {
        if (!doctorId || !date) return;
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/appointments', {
                params: { doctor_id: doctorId, date: date },
                headers: { Authorization: `Bearer ${token}` }
            });
            const apps = response.data.data.appointments || [];
            const times = apps
                .filter((app: any) => ['Scheduled', 'Confirmed'].includes(app.appointment_status))
                .map((app: any) => app.appointment_time.slice(0, 5));
            setBookedSlots(times);
        } catch (error) {
            console.error("Error fetching booked slots:", error);
        }
    };

    useEffect(() => {
        if (showRescheduleModal && rescheduleForm.doctor_id && rescheduleForm.appointment_date) {
            fetchBookedSlots(rescheduleForm.doctor_id, rescheduleForm.appointment_date);
        }
    }, [showRescheduleModal, rescheduleForm.doctor_id, rescheduleForm.appointment_date]);

    useEffect(() => {
        fetchAppointments();
        fetchDoctorSchedules();
        // Removed localStorage logic
    }, [selectedDate, refreshTrigger]);

    // Automation: Mark missed 'Scheduled' appointments as 'No Show'
    useEffect(() => {
        if (loading || appointments.length === 0) return;

        const now = new Date();
        const currentDateStr = format(now, 'yyyy-MM-dd');
        const currentTimeStr = format(now, 'HH:mm');

        const appointmentsToUpdate = appointments.filter(apt => {
            if (apt.appointment_status !== 'Scheduled') return false;

            // Only strictly check missed if selected date is relevant? 
            // Or should we check ALL appointments loaded? 
            // The API returns appointments based on filters. 
            // If we are looking at past dates, they are loaded.

            let aptDate = '';
            if (apt.appointment_date) {
                const d = new Date(apt.appointment_date);
                aptDate = format(d, 'yyyy-MM-dd');
            }

            const aptTime = apt.appointment_time ? apt.appointment_time.slice(0, 5) : '00:00';

            if (aptDate < currentDateStr) return true; // Past date
            if (aptDate === currentDateStr && aptTime < currentTimeStr) return true; // Past time today

            return false;
        });

        // Batch update or individual? Individual for now as simplistic approach
        if (appointmentsToUpdate.length > 0) {
            console.log(`Auto-marking ${appointmentsToUpdate.length} appointments as No Show`);
            appointmentsToUpdate.forEach(apt => {
                handleFollowUpStatusChange(apt.appointment_id, 'No-show');
            });
        }
    }, [appointments, loading]);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/appointments', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAppointments(response.data.data.appointments || []);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctorSchedules = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/doctor-schedules', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDoctorSchedules(response.data.data.schedules || []);
        } catch (error) {
            console.error('Error fetching doctor schedules:', error);
        }
    };

    const handleRefresh = () => {
        setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
        setSearchQuery('');
        setSelectedDoctorId('');
        fetchAppointments();
    };

    const handleFollowUpStatusChange = async (apptId: string, newStatus: string) => {
        if (!newStatus) return;

        // Optimistic Update
        const previousAppointments = [...appointments];
        setAppointments(prev => prev.map(apt => {
            if (apt.appointment_id !== apptId) return apt;
            if (newStatus === 'No Answer') {
                return { ...apt, appointment_status: 'Cancelled', cancellation_reason: 'No Answer' };
            }
            return { ...apt, appointment_status: newStatus };
        }));

        try {
            const token = localStorage.getItem('token');
            // Check if status is 'No Response' mapping to backend 'No Answer' if needed, 
            // but controller accepts string. Let's assume backend accepts 'No Answer'.
            // The dropdown value is 'No Answer' for "No Response" text, so we pass 'No Answer'.

            let payload: any = { status: newStatus };
            if (newStatus === 'No Answer') {
                payload = { status: 'Cancelled', cancellation_reason: 'No Answer' };
            }

            await axios.patch(`http://localhost:5000/api/appointments/${apptId}/status`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (error) {
            console.error('Error updating status:', error);
            // Revert on error
            setAppointments(previousAppointments);
            alert("Failed to update status. Please try again.");
        }
    };

    const { upcomingList, missedList } = useMemo(() => {
        const now = new Date();
        const currentDateStr = format(now, 'yyyy-MM-dd');
        const currentTimeStr = format(now, 'HH:mm');

        const upcoming: any[] = [];
        const missed: any[] = [];

        appointments.forEach((apt: any) => {
            // 1. Date Filter
            let aptDate = '';
            if (apt.appointment_date) {
                const d = new Date(apt.appointment_date);
                aptDate = format(d, 'yyyy-MM-dd');
            }

            if (aptDate !== selectedDate) return;

            // 2. Doctor Filter
            if (selectedDoctorId && apt.doctor_id?.toString() !== selectedDoctorId) return;

            // 3. Search Filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const name = apt.patient_name?.toLowerCase() || '';
                const phone = apt.phone_number?.toString() || '';
                if (!name.includes(query) && !phone.includes(query)) return;
            }

            // 4. Status Filter - Show all relevant statuses
            // Include 'Cancelled' only if it's 'No Answer'
            if (!['Scheduled', 'Confirmed', 'No-show'].includes(apt.appointment_status)) {
                if (apt.appointment_status === 'Cancelled' && apt.cancellation_reason === 'No Answer') {
                    // Keep it
                } else {
                    return;
                }
            }

            const aptTime = apt.appointment_time ? apt.appointment_time.slice(0, 5) : '00:00';

            // Check if missed
            const isMissed = selectedDate < currentDateStr || (selectedDate === currentDateStr && aptTime < currentTimeStr);

            if (selectedDate > currentDateStr) {
                upcoming.push(apt);
            } else if (selectedDate < currentDateStr) {
                missed.push(apt);
            } else {
                if (aptTime >= currentTimeStr) {
                    upcoming.push(apt);
                } else {
                    missed.push(apt);
                }
            }
        });

        // Sort by time
        const sortByTime = (a: any, b: any) => {
            return (a.appointment_time || '').localeCompare(b.appointment_time || '');
        };

        upcoming.sort(sortByTime);
        missed.sort(sortByTime);

        return { upcomingList: upcoming, missedList: missed };
    }, [appointments, searchQuery, selectedDate, selectedDoctorId]);

    const activeList = activeTab === 'Upcoming' ? upcomingList : missedList;

    const handleConvertClick = (apt: any) => {
        const nameParts = apt.patient_name.split(' ');
        const patientObj = {
            patient_id: apt.patient_id,
            first_name: nameParts[0],
            last_name: nameParts.slice(1).join(' '),
            contact_number: apt.phone_number,
            age: apt.age,
            gender: apt.gender,
            blood_group: apt.blood_group,
            is_follow_up_candidate: false,
            // Pass doctor info for auto-fill in OPD form
            doctor_id: apt.doctor_id,
            doctor_name: `Dr. ${apt.doctor_first_name} ${apt.doctor_last_name}`,
            appointment_id: apt.appointment_id,
            reason_for_visit: apt.reason_for_visit
        };
        onConvertToOPD(patientObj);
    };

    // --- Reschedule & Cancel Logic ---

    const generateTimeSlotsFromSchedule = (doctorId: string, selectedDate: string) => {
        if (!doctorId || !selectedDate) {
            return [];
        }

        const date = new Date(selectedDate);
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });

        const doctorDaySchedules = doctorSchedules.filter(
            (schedule: any) =>
                schedule.doctor_id === parseInt(doctorId) &&
                schedule.day_of_week === dayOfWeek
        );

        if (doctorDaySchedules.length === 0) {
            return [];
        }

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

            // Create cutoff time for today
            const now = new Date();
            const isToday = new Date(selectedDate).toDateString() === now.toDateString();
            // 15 minute buffer
            const cutoffTime = new Date(now.getTime() + 15 * 60000);

            while (current < end) {
                // If it is today, ensure the slot is after the cutoff time
                if (isToday) {
                    const slotTime = new Date(now);
                    slotTime.setHours(current.getHours(), current.getMinutes(), 0, 0);
                    // Filter out past slots + 15 min buffer
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

        // Map slots to status
        return uniqueSlots.map(time => {
            const isBooked = appointments.some((appt: any) => {
                let aptDate = '';
                if (appt.appointment_date) {
                    const d = new Date(appt.appointment_date);
                    aptDate = format(d, 'yyyy-MM-dd');
                }
                const aptTime = appt.appointment_time ? appt.appointment_time.slice(0, 5) : '';

                return (
                    appt.doctor_id?.toString() === doctorId?.toString() &&
                    aptDate === selectedDate &&
                    aptTime === time &&
                    ['Scheduled', 'Confirmed'].includes(appt.appointment_status)
                );
            });

            return {
                time,
                status: isBooked ? 'booked' : 'available'
            } as { time: string, status: 'available' | 'booked' };
        });
    };

    const doctorOptions = doctors.map((doc: any) => ({
        value: doc.doctor_id,
        label: `Dr. ${doc.first_name} ${doc.last_name} (${doc.specialization})`
    }));

    const openCancelModal = (appointment: any) => {
        setAppointmentToCancel(appointment);
        setCancelReason('Patient Request');
        setShowCancelModal(true);
    };

    const confirmCancel = async () => {
        if (!appointmentToCancel) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`http://localhost:5000/api/appointments/${appointmentToCancel.appointment_id}/status`, {
                status: 'Cancelled',
                cancellation_reason: cancelReason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Appointment cancelled successfully!');
            fetchAppointments();
            if (onAppointmentUpdate) onAppointmentUpdate(); // Notify parent
            setShowCancelModal(false);
            setAppointmentToCancel(null);
        } catch (error: any) {
            console.error('Error cancelling appointment:', error);
            alert(error.response?.data?.message || 'Failed to cancel appointment');
        } finally {
            setLoading(false);
        }
    };

    const openRescheduleModal = (appointment: any) => {
        setAppointmentToReschedule(appointment);
        const today = new Date().toISOString().split('T')[0];
        const currentApptDate = appointment.appointment_date.split('T')[0];

        // Default to today if current appointment date is in the past, otherwise keep current date
        const defaultDate = currentApptDate < today ? today : currentApptDate;

        setRescheduleForm({
            appointment_date: defaultDate,
            appointment_time: appointment.appointment_time,
            doctor_id: appointment.doctor_id,
            reason: ''
        });

        // Auto-select category based on time
        const hour = parseInt(appointment.appointment_time.split(':')[0]);
        if (hour < 12) setTimeSlotCategory('Morning');
        else if (hour < 16) setTimeSlotCategory('Afternoon');
        else setTimeSlotCategory('Evening');

        setRescheduleError(null); // Clear previous errors
        setShowRescheduleModal(true);
    };

    const handleReschedule = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`http://localhost:5000/api/appointments/${appointmentToReschedule.appointment_id}/reschedule`, {
                appointment_date: rescheduleForm.appointment_date,
                appointment_time: rescheduleForm.appointment_time,
                doctor_id: rescheduleForm.doctor_id,
                reason: rescheduleForm.reason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Appointment rescheduled successfully!');
            fetchAppointments();
            if (onAppointmentUpdate) onAppointmentUpdate(); // Notify parent
            setShowRescheduleModal(false);
            setAppointmentToReschedule(null);
        } catch (error: any) {
            console.error('Error rescheduling appointment:', error);
            if (error.response?.status === 409) {
                setRescheduleError(error.response.data.message);
            } else {
                alert(error.response?.data?.message || 'Failed to reschedule appointment');
            }
        } finally {
            setLoading(false);
        }
    };

    // Real-time duplicate check for Reschedule
    useEffect(() => {
        if (!showRescheduleModal || !appointmentToReschedule || !rescheduleForm.appointment_date || !rescheduleForm.doctor_id) return;

        const checkDuplicate = async () => {
            try {
                const token = localStorage.getItem('token');
                const params: any = {
                    doctor_id: rescheduleForm.doctor_id,
                    appointment_date: rescheduleForm.appointment_date,
                    exclude_appointment_id: appointmentToReschedule.appointment_id
                };

                // Use same logic as backend: patient_id if exists, else phone_number
                if (appointmentToReschedule.patient_id) {
                    params.patient_id = appointmentToReschedule.patient_id;
                } else {
                    params.phone_number = appointmentToReschedule.phone_number;
                }

                const response = await axios.get('http://localhost:5000/api/appointments/check-duplicate', {
                    params,
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data.exists) {
                    setRescheduleError(response.data.message);
                } else {
                    setRescheduleError(null);
                }
            } catch (err) {
                console.error('Check duplicate error', err);
            }
        };

        const timer = setTimeout(() => {
            checkDuplicate();
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [rescheduleForm.appointment_date, rescheduleForm.doctor_id, showRescheduleModal, appointmentToReschedule]);

    // Helper to get status badge props
    const getStatusBadge = (apt: any) => {
        const { appointment_status, cancellation_reason } = apt;

        // Override for Missed Tab
        if (activeTab === 'Missed' && appointment_status === 'Scheduled') {
            return { label: 'No Show', style: 'bg-slate-500 text-white' };
        }

        switch (appointment_status) {
            case 'Confirmed':
            case 'Scheduled':
                return { label: 'Scheduled', style: 'bg-blue-500 text-white' };
            case 'Cancelled':
                if (cancellation_reason === 'No Answer') {
                    // Still show as "Scheduled" (Blue) as requested
                    return { label: 'Scheduled', style: 'bg-blue-500 text-white' };
                }
                return { label: 'Cancelled', style: 'bg-slate-400 text-white' };
            case 'No-show':
                return { label: 'No Show', style: 'bg-slate-500 text-white' };
            default:
                // Default fallback
                return { label: 'Scheduled', style: 'bg-blue-500 text-white' };
        }
    };

    // Helper to get dropdown style
    const getDropdownStyle = (apt: any) => {
        const { appointment_status, cancellation_reason } = apt;

        if (appointment_status === 'Confirmed') {
            return 'bg-emerald-50 border-emerald-200 text-emerald-600';
        }
        if (appointment_status === 'Cancelled' && cancellation_reason === 'No Answer') {
            return 'bg-amber-50 border-amber-200 text-amber-600';
        }
        if (appointment_status === 'No-show') {
            return 'bg-slate-50 border-slate-200 text-slate-500';
        }
        return 'bg-slate-50 border-slate-200 text-slate-600';
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 h-full flex flex-col overflow-hidden">
            {/* Header / Tabs */}
            <div className="p-4 border-b border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                        Appointments
                    </h3>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRefresh}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Reset to Today"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>

                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button
                                onClick={() => setActiveTab('Upcoming')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'Upcoming'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Upcoming
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'Upcoming' ? 'bg-indigo-100' : 'bg-slate-200'}`}>
                                    {upcomingList.length}
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('Missed')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'Missed'
                                    ? 'bg-white text-red-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Missed
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'Missed' ? 'bg-red-100' : 'bg-slate-200'}`}>
                                    {missedList.length}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search Name or Phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        />
                    </div>
                    <div>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                    <div className="flex-1 md:max-w-[200px]">
                        <select
                            value={selectedDoctorId}
                            onChange={(e) => setSelectedDoctorId(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            <option value="">All Doctors</option>
                            {doctors.map(doc => (
                                <option key={doc.doctor_id} value={doc.doctor_id}>Dr. {doc.first_name} {doc.last_name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {loading ? (
                    <div className="text-center py-10 text-slate-400">Loading appointments...</div>
                ) : activeList.length === 0 ? (
                    <div className="text-center py-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-slate-300">
                            <Calendar className="w-8 h-8" />
                        </div>
                        <p className="text-slate-500 font-medium">No {activeTab.toLowerCase()} appointments found.</p>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting the filters.</p>
                        {appointments.length > 0 && activeList.length === 0 && (
                            <p className="text-[10px] text-slate-300 mt-4 max-w-xs text-center mx-auto">
                                Check: {appointments.length} appointments loaded.
                                <br />All filtered out by date/status.
                            </p>
                        )}
                    </div>
                ) : (
                    activeList.map((apt) => {
                        const badgeProps = getStatusBadge(apt);
                        const dropdownStyle = getDropdownStyle(apt);

                        // Determine dropdown value
                        let dropdownValue = '';
                        if (apt.appointment_status === 'Confirmed') dropdownValue = 'Confirmed';
                        else if (apt.appointment_status === 'Cancelled' && apt.cancellation_reason === 'No Answer') dropdownValue = 'No Answer';
                        // If No-show or Cancelled(No Answer), we might want to show that in dropdown or disable it??
                        // For now letting them switch valid options.
                        // Wait, if status is 'No-show' (from automation), dropdown value '' matches "Follow-up Status"? No.
                        // We need to decide what to show in dropdown for 'No-show'.

                        return (
                            <div key={apt.appointment_id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all overflow-hidden group">
                                <div className="p-3">
                                    {/* Header: Patient Info & Status */}
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${['Scheduled', 'Confirmed'].includes(apt.appointment_status) || (apt.appointment_status === 'Cancelled' && apt.cancellation_reason === 'No Answer')
                                                ? 'bg-blue-100 text-blue-600'
                                                : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {apt.patient_name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="flex items-center">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-base font-bold text-slate-900 leading-tight">
                                                            {apt.patient_name}
                                                        </h3>
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${badgeProps.style}`}>
                                                            {badgeProps.label}
                                                        </span>
                                                    </div>

                                                    {apt.phone_number && (
                                                        <a
                                                            href={`tel:${apt.phone_number}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="flex items-center gap-2 px-3 py-1 ml-2 bg-white border border-slate-200 rounded-full shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group/phone shrink-0"
                                                        >
                                                            <Phone className="w-3.5 h-3.5 text-slate-400 group-hover/phone:text-indigo-500 transition-colors" />
                                                            <span className="text-xs font-bold text-slate-600 group-hover/phone:text-slate-900 tracking-wide">
                                                                {apt.phone_number}
                                                            </span>
                                                        </a>
                                                    )}
                                                </div>
                                                <p className="text-slate-500 text-[10px] font-medium mt-1.5 ml-0.5">{apt.reason_for_visit || 'General Checkup'}</p>
                                            </div>
                                        </div>

                                        {/* Call/Follow-up Status */}
                                        <div className="md:ml-auto w-full md:w-40">
                                            <select
                                                value={dropdownValue || (activeTab === 'Missed' ? '' : '')}
                                                onChange={(e) => handleFollowUpStatusChange(apt.appointment_id, e.target.value)}
                                                disabled={activeTab === 'Missed'}
                                                className={`w-full appearance-none px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-colors outline-none focus:ring-2 focus:ring-indigo-500/20 ${dropdownStyle} ${activeTab === 'Missed' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                            >
                                                <option value="" disabled>Follow-up Status</option>
                                                <option value="Confirmed">Confirmed</option>
                                                <option value="No Answer">No Response</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Info Grid */}
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-start gap-2 min-w-[120px] flex-1">
                                            <div className="p-1.5 bg-white rounded-lg text-purple-600 shadow-sm shrink-0">
                                                <Stethoscope className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Doctor</span>
                                                <p className="font-bold text-slate-900 text-sm leading-tight">Dr. {apt.doctor_first_name} {apt.doctor_last_name}</p>
                                                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{apt.specialization}</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-start gap-2 min-w-[120px] flex-1">
                                            <div className="p-1.5 bg-white rounded-lg text-blue-600 shadow-sm shrink-0">
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Date</span>
                                                <p className="font-bold text-slate-900 text-sm leading-tight">
                                                    {format(new Date(apt.appointment_date), 'MMM dd, yyyy')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-start gap-2 min-w-[120px] flex-1">
                                            <div className="p-1.5 bg-white rounded-lg text-emerald-600 shadow-sm shrink-0">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Time</span>
                                                <p className="font-bold text-slate-900 text-sm leading-tight">{apt.appointment_time.slice(0, 5)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer: Actions */}
                                    <div className="flex flex-col md:flex-row md:items-center gap-6 pt-4 border-t border-slate-100">
                                        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-xs">
                                            <User className="w-4 h-4" />
                                            ID: <span className="font-bold text-slate-700 text-sm">#{apt.appointment_number}</span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 md:ml-auto">
                                            <button
                                                onClick={() => openRescheduleModal(apt)}
                                                className="px-4 py-2 text-sm font-bold text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                                            >
                                                Reschedule
                                            </button>
                                            <button
                                                onClick={() => openCancelModal(apt)}
                                                className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            {activeTab !== 'Missed' && (
                                                <button
                                                    onClick={() => handleConvertClick(apt)}
                                                    className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2"
                                                >
                                                    Convert to OPD
                                                    <ArrowRight className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            {/* Cancel Confirmation Modal */}
            {
                showCancelModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full border border-slate-100 p-6 animate-in zoom-in-95 duration-200">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                                    <X className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-1">Cancel Appointment?</h3>
                                <p className="text-sm text-slate-500 mb-6">
                                    Are you sure you want to cancel the appointment for <br />
                                    <span className="font-bold text-slate-800">{appointmentToCancel?.patient_name}</span>?
                                </p>

                                <div className="w-full mb-6 text-left">
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Reason</label>
                                    <select
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                                    >
                                        <option value="Patient Request">Patient Request</option>
                                        <option value="Doctor Unavailable">Doctor Unavailable</option>
                                        <option value="Scheduling Conflict">Scheduling Conflict</option>
                                        <option value="No Show">No Show (Pre-emptive)</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setShowCancelModal(false)}
                                        className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition"
                                    >
                                        Keep It
                                    </button>
                                    <button
                                        onClick={confirmCancel}
                                        disabled={loading}
                                        className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 shadow-lg shadow-red-500/30 transition"
                                    >
                                        {loading ? '...' : 'Yes, Cancel'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Reschedule Modal */}
            {
                showRescheduleModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/20">
                            <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <CalendarClock className="w-6 h-6" />
                                    Reschedule Appointment
                                </h2>
                                <button onClick={() => setShowRescheduleModal(false)} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleReschedule} className="p-6 space-y-6">
                                <div className="bg-amber-50 rounded-lg p-4 mb-4 border border-amber-100">
                                    <p className="text-sm text-amber-800 flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        Rescheduling for: <span className="font-bold">{appointmentToReschedule?.patient_name}</span>
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                                    <SearchableSelect
                                        label=""
                                        options={doctorOptions}
                                        value={rescheduleForm.doctor_id}
                                        onChange={(val) => { setRescheduleForm({ ...rescheduleForm, doctor_id: val }); setRescheduleError(null); }}
                                        placeholder="Select Doctor"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={rescheduleForm.appointment_date}
                                        onChange={(e) => { setRescheduleForm({ ...rescheduleForm, appointment_date: e.target.value }); setRescheduleError(null); }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">New Time Slot *</label>
                                    {/* Category Tabs */}
                                    <div className="flex gap-2 mb-3 bg-gray-100 p-1 rounded-xl">
                                        {[
                                            { id: 'Morning', icon: Sun, label: 'Morning' },
                                            { id: 'Afternoon', icon: CloudSun, label: 'Afternoon' },
                                            { id: 'Evening', icon: Moon, label: 'Evening' }
                                        ].map((cat) => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setTimeSlotCategory(cat.id as any)}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${timeSlotCategory === cat.id
                                                    ? 'bg-white text-amber-600 shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                            >
                                                <cat.icon className="w-4 h-4" />
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Time Grid */}
                                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mb-2 max-h-60 overflow-y-auto">
                                        {(() => {
                                            const slots = generateTimeSlotsFromSchedule(rescheduleForm.doctor_id, rescheduleForm.appointment_date);
                                            const filteredSlots = slots.filter(slot => {
                                                const hour = parseInt(slot.time.split(':')[0]);
                                                if (timeSlotCategory === 'Morning') return hour >= 6 && hour < 12;
                                                if (timeSlotCategory === 'Afternoon') return hour >= 12 && hour < 17;
                                                if (timeSlotCategory === 'Evening') return hour >= 17 && hour < 22;
                                                return false;
                                            });

                                            if (filteredSlots.length === 0) {
                                                return (
                                                    <div className="col-span-full text-center py-4 text-xs font-bold text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                                        No {timeSlotCategory.toLowerCase()} slots available.
                                                    </div>
                                                );
                                            }

                                            return filteredSlots.map((slot) => {
                                                const isBooked = slot.status === 'booked' || bookedSlots.includes(slot.time);
                                                const isSelected = rescheduleForm.appointment_time === slot.time;
                                                return (
                                                    <button
                                                        key={slot.time}
                                                        type="button"
                                                        disabled={isBooked}
                                                        onClick={() => { !isBooked && setRescheduleForm({ ...rescheduleForm, appointment_time: slot.time }); setRescheduleError(null); }}
                                                        className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all relative ${isBooked
                                                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                                                            : isSelected
                                                                ? 'bg-amber-500 border-amber-500 text-white font-bold ring-2 ring-amber-200 shadow-md transform scale-105'
                                                                : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50'
                                                            }`}
                                                    >
                                                        {slot.time}
                                                        {isBooked && (
                                                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center bg-red-100 rounded-full border border-red-200">
                                                                <span className="block h-1.5 w-1.5 rounded-full bg-red-500"></span>
                                                            </span>
                                                        )}
                                                    </button>
                                                )
                                            });
                                        })()}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Rescheduling</label>
                                    <textarea
                                        rows={2}
                                        value={rescheduleForm.reason}
                                        onChange={(e) => setRescheduleForm({ ...rescheduleForm, reason: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                        placeholder="e.g., Patient requested change"
                                    />
                                </div>

                                {rescheduleError && (
                                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        <p className="text-sm font-medium">{rescheduleError}</p>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                    <button type="button" onClick={() => setShowRescheduleModal(false)} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={loading || !!rescheduleError} className={`flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700 transition font-medium shadow-lg shadow-amber-500/30 ${loading || !!rescheduleError ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        <CalendarClock className="w-5 h-5" />
                                        {loading ? 'Updating...' : 'Confirm New Time'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
