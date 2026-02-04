'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Calendar, FileText, X, Save, User, ArrowRight, Sun, CloudSun, Moon, Clock, CalendarClock, Check, Stethoscope, MapPin, Activity, Search, ChevronLeft, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import SearchableSelect from '../../../components/ui/SearchableSelect';

const API_URL = 'http://localhost:5000/api';

export default function AppointmentsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [appointments, setAppointments] = useState([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
    const [doctors, setDoctors] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showOpdModal, setShowOpdModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [timeSlotCategory, setTimeSlotCategory] = useState<'Morning' | 'Afternoon' | 'Evening'>('Morning');
    const [activeTab, setActiveTab] = useState('All');
    const [doctorSchedules, setDoctorSchedules] = useState<any[]>([]);
    const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

    const [appointmentStep, setAppointmentStep] = useState(1);
    const [bookingDepartment, setBookingDepartment] = useState('');
    const [suggestedDoctorId, setSuggestedDoctorId] = useState<string | null>(null);

    // Reschedule & Cancel States
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [appointmentToCancel, setAppointmentToCancel] = useState<any>(null);
    const [cancelReason, setCancelReason] = useState('Patient Request');

    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [appointmentToReschedule, setAppointmentToReschedule] = useState<any>(null);
    const [rescheduleForm, setRescheduleForm] = useState({
        appointment_date: '',
        appointment_time: '',
        doctor_id: '',
        reason: ''
    });

    const [appointmentForm, setAppointmentForm] = useState({
        patient_name: '',
        phone_number: '',
        email: '',
        age: '',
        gender: '',
        doctor_id: '',
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '',
        reason_for_visit: '',
        notes: ''
    });

    const [doctorSearchQuery, setDoctorSearchQuery] = useState('');

    const [opdForm, setOpdForm] = useState({
        first_name: '',
        last_name: '',
        age: '',
        gender: '',
        contact_number: '',
        doctor_id: '',
        visit_type: 'Walk-in',
        visit_date: new Date().toISOString().split('T')[0],
        visit_time: new Date().toTimeString().slice(0, 5),
        chief_complaint: '',
        symptoms: '',
        vital_signs: {
            bp_systolic: '',
            bp_diastolic: '',
            pulse: '',
            temperature: '',
            weight: '',
            height: '',
            spo2: ''
        },
        consultation_fee: '',
        payment_status: 'Pending',
        adhaar_number: '',
        blood_group: ''
    });



    useEffect(() => {
        fetchDoctors();
        fetchAppointments();
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/departments/hospital`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDepartments(response.data.data.departments || []);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const generateTimeSlots = (category: 'Morning' | 'Afternoon' | 'Evening') => {
        const slots = [];
        let startHour, endHour;

        if (category === 'Morning') {
            startHour = 9; // 9:00 AM
            endHour = 11;  // 11:30 AM (Last slot)
        } else if (category === 'Afternoon') {
            startHour = 12; // 12:00 PM
            endHour = 15;   // 3:30 PM
        } else {
            startHour = 16; // 4:00 PM
            endHour = 19;   // 7:30 PM
        }

        for (let h = startHour; h <= endHour; h++) {
            slots.push(`${h.toString().padStart(2, '0')}:00`);
            slots.push(`${h.toString().padStart(2, '0')}:30`);
        }
        return slots;
    };

    const fetchDoctors = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/doctors/my-branch`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDoctors(response.data.data.doctors || []);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const fetchAppointments = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/appointments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAppointments(response.data.data.appointments || []);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        }
    };

    const fetchDoctorSchedules = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/doctor-schedules`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDoctorSchedules(response.data.data.schedules || []);
        } catch (error) {
            console.error('Error fetching doctor schedules:', error);
        }
    };

    const generateTimeSlotsFromSchedule = (doctorId: string, selectedDate: string) => {
        if (!doctorId || !selectedDate) {
            setAvailableTimeSlots([]);
            return;
        }

        // Get day of week from selected date
        const date = new Date(selectedDate);
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });

        // Find schedules for this doctor on this day
        const doctorDaySchedules = doctorSchedules.filter(
            (schedule: any) =>
                schedule.doctor_id === parseInt(doctorId) &&
                schedule.day_of_week === dayOfWeek
        );

        if (doctorDaySchedules.length === 0) {
            setAvailableTimeSlots([]);
            return;
        }

        // Generate time slots from all schedules
        const slots: string[] = [];
        doctorDaySchedules.forEach((schedule: any) => {
            const startTime = schedule.start_time;
            const endTime = schedule.end_time;
            const consultationTime = schedule.avg_consultation_time || 30;

            // Parse time strings (format: "HH:MM" or "HH:MM:SS")
            const parseTime = (timeStr: string) => {
                const [hours, minutes] = timeStr.split(':').map(Number);
                const d = new Date();
                d.setHours(hours, minutes, 0, 0);
                return d;
            };

            let current = parseTime(startTime);
            const end = parseTime(endTime);

            while (current < end) {
                const timeStr = current.toTimeString().slice(0, 5); // "HH:MM"
                slots.push(timeStr);
                current = new Date(current.getTime() + consultationTime * 60000);
            }
        });

        // Remove duplicates and sort
        const uniqueSlots = Array.from(new Set(slots)).sort();

        // Filter out booked slots
        const bookedAppointments = appointments.filter((appt: any) =>
            appt.doctor_id === parseInt(doctorId) &&
            appt.appointment_date.split('T')[0] === selectedDate &&
            ['Scheduled', 'Confirmed', 'Completed'].includes(appt.appointment_status)
        );

        const bookedTimes = bookedAppointments.map((appt: any) => appt.appointment_time.slice(0, 5));

        const finalAvailableSlots = uniqueSlots.filter(slot => !bookedTimes.includes(slot));

        setAvailableTimeSlots(finalAvailableSlots);
        return finalAvailableSlots;
    };

    const getDoctorAvailabilityCount = (doctorId: number, dateStr: string) => {
        // Get day of week
        const date = new Date(dateStr);
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });

        // Find schedules
        const doctorDaySchedules = doctorSchedules.filter(
            (schedule: any) =>
                schedule.doctor_id === doctorId &&
                schedule.day_of_week === dayOfWeek
        );

        if (doctorDaySchedules.length === 0) return 0;

        // Generate base slots
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

            while (current < end) {
                const timeStr = current.toTimeString().slice(0, 5);
                slots.push(timeStr);
                current = new Date(current.getTime() + consultationTime * 60000);
            }
        });

        const uniqueSlots = Array.from(new Set(slots));

        // Filter booked
        const bookedAppointments = appointments.filter((appt: any) =>
            appt.doctor_id === doctorId &&
            appt.appointment_date.split('T')[0] === dateStr &&
            ['Scheduled', 'Confirmed', 'Completed'].includes(appt.appointment_status)
        );

        const bookedTimes = bookedAppointments.map((appt: any) => appt.appointment_time.slice(0, 5));
        return uniqueSlots.filter(slot => !bookedTimes.includes(slot)).length;
    };

    const formatTime12Hour = (time24: string) => {
        if (!time24) return '';
        const [hours, minutes] = time24.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const h = hours % 12 || 12;
        return `${h}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const getDoctorShiftTimes = (doctorId: number, dateStr: string) => {
        const date = new Date(dateStr);
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });

        const schedules = doctorSchedules.filter((s: any) =>
            s.doctor_id === doctorId && s.day_of_week === dayOfWeek
        );

        if (schedules.length === 0) return 'Not Available';

        return schedules.map((s: any) =>
            `${formatTime12Hour(s.start_time)} - ${formatTime12Hour(s.end_time)}`
        ).join(', ');
    };

    const getNextAvailability = (doctorId: number, fromDateStr: string) => {
        const start = new Date(fromDateStr);
        // Check next 7 days
        for (let i = 1; i <= 30; i++) {
            const nextDate = new Date(start);
            nextDate.setDate(start.getDate() + i);
            const dayName = nextDate.toLocaleDateString('en-US', { weekday: 'long' });

            const hasSchedule = doctorSchedules.some((s: any) =>
                s.doctor_id === doctorId && s.day_of_week === dayName
            );

            if (hasSchedule) {
                return nextDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            }
        }
        return 'No upcoming availability';
    };

    // Effect to fetch schedules on mount
    useEffect(() => {
        fetchDoctorSchedules();
    }, []);

    // Effect to update time slots when doctor or date changes
    useEffect(() => {
        if (appointmentForm.doctor_id && appointmentForm.appointment_date) {
            const slots = generateTimeSlotsFromSchedule(appointmentForm.doctor_id, appointmentForm.appointment_date);

            // Auto-select category based on availability
            if (slots && slots.length > 0) {
                const hasMorning = slots.some((t: string) => { const h = parseInt(t.split(':')[0]); return h >= 6 && h < 12 });
                const hasAfternoon = slots.some((t: string) => { const h = parseInt(t.split(':')[0]); return h >= 12 && h < 17 });
                const hasEvening = slots.some((t: string) => { const h = parseInt(t.split(':')[0]); return h >= 17 && h < 22 });

                if (hasMorning) setTimeSlotCategory('Morning');
                else if (hasAfternoon) setTimeSlotCategory('Afternoon');
                else if (hasEvening) setTimeSlotCategory('Evening');
            }
        }
    }, [appointmentForm.doctor_id, appointmentForm.appointment_date, doctorSchedules]);

    const handleCreateAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/appointments`, appointmentForm, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Appointment created successfully!');
            setShowModal(false);
            resetAppointmentForm();
            fetchAppointments();
        } catch (error: any) {
            console.error('Error creating appointment:', error);
            alert(error.response?.data?.message || 'Failed to create appointment');
        } finally {
            setLoading(false);
        }
    };

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
            await axios.patch(`${API_URL}/appointments/${appointmentToCancel.appointment_id}/status`, {
                status: 'Cancelled',
                cancellation_reason: cancelReason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Appointment cancelled successfully!');
            fetchAppointments();
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
        setRescheduleForm({
            appointment_date: appointment.appointment_date.split('T')[0],
            appointment_time: appointment.appointment_time,
            doctor_id: appointment.doctor_id,
            reason: ''
        });

        // Auto-select category based on time
        const hour = parseInt(appointment.appointment_time.split(':')[0]);
        if (hour < 12) setTimeSlotCategory('Morning');
        else if (hour < 16) setTimeSlotCategory('Afternoon');
        else setTimeSlotCategory('Evening');

        setShowRescheduleModal(true);
    };

    const handleReschedule = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            // Assuming we added a backend route for rescheduling or just updating
            await axios.patch(`${API_URL}/appointments/${appointmentToReschedule.appointment_id}/reschedule`, {
                appointment_date: rescheduleForm.appointment_date,
                appointment_time: rescheduleForm.appointment_time,
                doctor_id: rescheduleForm.doctor_id,
                reason: rescheduleForm.reason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Appointment rescheduled successfully!');
            fetchAppointments();
            setShowRescheduleModal(false);
            setAppointmentToReschedule(null);
        } catch (error: any) {
            console.error('Error rescheduling appointment:', error);
            alert(error.response?.data?.message || 'Failed to reschedule appointment');
        } finally {
            setLoading(false);
        }
    };

    const convertToOPD = (appointment: any) => {
        // Split patient name into first and last
        const nameParts = appointment.patient_name?.split(' ') || ['', ''];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Find the doctor to get consultation fee
        const selectedDoc = doctors.find((d: any) => d.doctor_id === appointment.doctor_id);
        const consultationFee = selectedDoc?.consultation_fee?.toString() || '';

        setOpdForm({
            first_name: firstName,
            last_name: lastName,
            age: appointment.age?.toString() || '',
            gender: appointment.gender || '',
            contact_number: appointment.phone_number || '',
            doctor_id: appointment.doctor_id || '',
            visit_type: 'Appointment',
            visit_date: new Date().toISOString().split('T')[0],
            visit_time: new Date().toTimeString().slice(0, 5),
            chief_complaint: appointment.reason_for_visit || '',
            symptoms: appointment.notes || '',
            vital_signs: {
                bp_systolic: '',
                bp_diastolic: '',
                pulse: '',
                temperature: '',
                weight: '',
                height: '',
                spo2: ''
            },
            consultation_fee: consultationFee,
            payment_status: 'Pending',
            adhaar_number: '',
            blood_group: ''
        });

        setSelectedAppointment(appointment);
        setShowOpdModal(true);
    };

    const handleCreateOPD = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                ...opdForm,
                patient_id: selectedAppointment?.patient_id,
                appointment_id: selectedAppointment?.appointment_id,
                vital_signs: JSON.stringify(opdForm.vital_signs)
            };

            await axios.post(`${API_URL}/opd`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });



            alert('OPD Entry created successfully!');
            setShowOpdModal(false);
            setSelectedAppointment(null);
            fetchAppointments();
        } catch (error: any) {
            console.error('Error creating OPD entry:', error);
            alert(error.response?.data?.message || 'Failed to create OPD entry');
        } finally {
            setLoading(false);
        }
    };

    const resetAppointmentForm = () => {
        setAppointmentForm({
            patient_name: '',
            phone_number: '',
            email: '',
            age: '',
            gender: '',
            doctor_id: '',
            appointment_date: new Date().toISOString().split('T')[0],
            appointment_time: '',
            reason_for_visit: '',
            notes: ''
        });
        setAppointmentStep(1);
        setBookingDepartment('');
        setSuggestedDoctorId(null);
    };
    const doctorOptions = doctors.map((doc: any) => ({
        value: doc.doctor_id,
        label: `Dr. ${doc.first_name} ${doc.last_name} (${doc.specialization})`
    }));

    return (
        <div className="relative min-h-screen pb-20 bg-slate-50/50">
            {/* Header Section */}
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Hospital Appointments
                        </h1>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mt-6 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search patients, doctors..."
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-700 font-medium"
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <select
                            value={selectedDepartment}
                            onChange={(e) => setSelectedDepartment(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-600 font-bold focus:ring-2 focus:ring-purple-500 cursor-pointer"
                        >
                            <option>All Departments</option>
                            {departments.map((dept: any) => (
                                <option key={dept.department_id} value={dept.department_name}>
                                    {dept.department_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => setShowModal(true)}
                        className="w-full md:w-auto px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-black transition-all shadow-lg shadow-slate-900/20 font-bold flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5" />
                        New Appt
                    </button>
                </div>
            </div>

            {/* Stats Cards */}


            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-2 mb-8 bg-white p-2 rounded-2xl border border-slate-100 w-fit">
                {['All', 'Scheduled', 'Completed', 'Cancelled'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                            }`}
                    >
                        {tab} <span className="opacity-60 ml-1 text-xs">
                            ({tab === 'All' ? appointments.length : appointments.filter((a: any) =>
                                tab === 'Scheduled' ? ['Scheduled', 'Confirmed'].includes(a.appointment_status) :
                                    a.appointment_status === tab
                            ).length})
                        </span>
                    </button>
                ))}
            </div>

            {/* Wide Card List View */}
            <div className="flex flex-col gap-6 max-w-7xl mx-auto">
                {appointments
                    .filter((a: any) => {
                        // Status Filter
                        const statusMatch = activeTab === 'All' ? true :
                            activeTab === 'Scheduled' ? ['Scheduled', 'Confirmed'].includes(a.appointment_status) :
                                a.appointment_status === activeTab;

                        // Department Filter - using department_name from appointment join or specialization as fallback
                        const deptMatch = selectedDepartment === 'All Departments' ? true :
                            (a.department_name === selectedDepartment || a.specialization?.includes(selectedDepartment));

                        return statusMatch && deptMatch;
                    })
                    .map((apt: any) => (
                        <div key={apt.appointment_id} className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all overflow-hidden group relative">


                            <div className="p-5">
                                {/* Card Header */}
                                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${apt.appointment_status === 'Confirmed' ? 'bg-blue-100 text-blue-600' :
                                            apt.appointment_status === 'Completed' ? 'bg-emerald-100 text-emerald-600' :
                                                apt.appointment_status === 'Cancelled' ? 'bg-red-100 text-red-600' :
                                                    'bg-blue-100 text-blue-600'
                                            }`}>
                                            {apt.patient_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 leading-tight mb-0.5">{apt.patient_name}</h3>
                                            <p className="text-slate-500 text-xs font-medium">{apt.reason_for_visit || 'General Checkup'}</p>
                                        </div>
                                    </div>

                                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${apt.appointment_status === 'Completed' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' :
                                        apt.appointment_status === 'Confirmed' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' :
                                            apt.appointment_status === 'Cancelled' ? 'bg-red-100 text-red-600' :
                                                'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                        }`}>
                                        {apt.appointment_status === 'Completed' ? <Check className="w-3 h-3" /> :
                                            apt.appointment_status === 'Cancelled' ? <X className="w-3 h-3" /> :
                                                <Activity className="w-3 h-3" />}
                                        {apt.appointment_status === 'Confirmed' ? 'Scheduled' : apt.appointment_status}
                                    </span>
                                </div>

                                {/* Info Grid */}
                                <div className="flex flex-wrap gap-3 mb-4">
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-3 min-w-[140px]">
                                        <div className="p-1.5 bg-white rounded-lg text-purple-600 shadow-sm">
                                            <Stethoscope className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Doctor</span>
                                            <p className="font-bold text-slate-800 text-xs mt-0.5">Dr. {apt.doctor_first_name}</p>
                                            <p className="text-[10px] text-slate-500 font-semibold">{apt.specialization}</p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-3 min-w-[140px]">
                                        <div className="p-1.5 bg-white rounded-lg text-blue-600 shadow-sm">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date</span>
                                            <p className="font-bold text-slate-800 text-xs mt-0.5">
                                                {new Date(apt.appointment_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-3 min-w-[140px]">
                                        <div className="p-1.5 bg-white rounded-lg text-emerald-600 shadow-sm">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Time</span>
                                            <p className="font-bold text-slate-800 text-xs mt-0.5">{apt.appointment_time}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex flex-col md:flex-row md:items-center gap-6 pt-3 border-t border-slate-100">
                                    <div className="flex items-center gap-1.5 text-slate-400 font-mono text-xs">
                                        <User className="w-3 h-3" />
                                        ID: <span className="font-bold text-slate-600">#{apt.appointment_number}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {['Scheduled', 'Confirmed'].includes(apt.appointment_status) && (
                                            <>
                                                <button
                                                    onClick={() => openRescheduleModal(apt)}
                                                    className="px-3 py-1.5 text-xs font-bold text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                >
                                                    Reschedule
                                                </button>
                                                <button
                                                    onClick={() => openCancelModal(apt)}
                                                    className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => convertToOPD(apt)}
                                                    className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-all shadow-lg shadow-slate-900/10 flex items-center gap-1.5"
                                                >
                                                    Convert to OPD
                                                    <ArrowRight className="w-3 h-3" />
                                                </button>
                                            </>
                                        )}
                                        {apt.appointment_status === 'Cancelled' && (
                                            <span className="text-red-500 font-bold text-xs bg-red-50 px-2 py-1 rounded-lg border border-red-100">
                                                Cancelled: {apt.cancellation_reason}
                                            </span>
                                        )}
                                        {apt.appointment_status === 'Completed' && (
                                            <button className="text-emerald-600 font-bold text-xs hover:underline">View Report</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                {appointments.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Calendar className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-700">No appointments found</h3>
                        <p className="text-slate-500 mt-1">Try adjusting your filters or create a new appointment.</p>
                    </div>
                )}
            </div>

            {/* Appointment Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
                        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl">
                            <h2 className="text-xl font-bold">New Appointment</h2>
                            <button onClick={() => { setShowModal(false); resetAppointmentForm(); }} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            {appointmentStep === 1 ? (
                                <div className="space-y-6">
                                    {/* Step 1: Availability Check */}
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
                                            <Search className="w-4 h-4 text-purple-600" />
                                            Find Availability
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Select Department</label>
                                                <select
                                                    value={bookingDepartment}
                                                    onChange={(e) => setBookingDepartment(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium"
                                                >
                                                    <option value="">-- All Departments --</option>
                                                    {departments.map((dept: any) => (
                                                        <option key={dept.department_id} value={dept.department_name}>{dept.department_name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Search Doctor</label>
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        value={doctorSearchQuery}
                                                        onChange={(e) => setDoctorSearchQuery(e.target.value)}
                                                        placeholder="Search by name..."
                                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Date</label>
                                                <input
                                                    type="date"
                                                    value={appointmentForm.appointment_date}
                                                    onChange={(e) => setAppointmentForm({ ...appointmentForm, appointment_date: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Doctors List */}
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Available Doctors</h4>
                                        <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                            {doctors
                                                .filter((doc: any) => {
                                                    const matchesDept = !bookingDepartment || doc.specialization === bookingDepartment || doc.department_name === bookingDepartment;
                                                    const matchesSearch = !doctorSearchQuery || `${doc.first_name} ${doc.last_name}`.toLowerCase().includes(doctorSearchQuery.toLowerCase());
                                                    return matchesDept && matchesSearch;
                                                })
                                                .sort((a: any, b: any) => {
                                                    // Sort by availability (more slots first)
                                                    const slotsA = getDoctorAvailabilityCount(a.doctor_id, appointmentForm.appointment_date);
                                                    const slotsB = getDoctorAvailabilityCount(b.doctor_id, appointmentForm.appointment_date);
                                                    return slotsB - slotsA;
                                                })
                                                .map((doc: any) => {
                                                    const availableCount = getDoctorAvailabilityCount(doc.doctor_id, appointmentForm.appointment_date);
                                                    const isAvailable = availableCount > 0;

                                                    // Logic to suggest this doctor if they have slots and are in same department
                                                    const isSuggested = isAvailable && bookingDepartment && availableCount > 3;

                                                    return (
                                                        <div
                                                            key={doc.doctor_id}
                                                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isAvailable
                                                                ? 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-md'
                                                                : 'bg-slate-50 border-slate-100 opacity-60'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2 ${isAvailable ? 'bg-purple-50 border-purple-100 text-purple-600' : 'bg-slate-100 border-slate-200 text-slate-400'
                                                                    }`}>
                                                                    {doc.first_name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <h4 className={`font-bold ${isAvailable ? 'text-slate-800' : 'text-slate-500'}`}>
                                                                            Dr. {doc.first_name} {doc.last_name}
                                                                        </h4>
                                                                        {isSuggested && (
                                                                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                                <Sparkles className="w-3 h-3" /> Suggested
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-slate-500 font-medium">{doc.specialization}</p>
                                                                    <div className="mt-1 flex items-center gap-2">
                                                                        {isAvailable ? (
                                                                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                                                                Available: {getDoctorShiftTimes(doc.doctor_id, appointmentForm.appointment_date)}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-xs font-bold text-red-500 flex items-center gap-1">
                                                                                <AlertCircle className="w-3 h-3" />
                                                                                Next Available: {getNextAvailability(doc.doctor_id, appointmentForm.appointment_date)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <button
                                                                onClick={() => {
                                                                    if (isAvailable) {
                                                                        setAppointmentForm({ ...appointmentForm, doctor_id: doc.doctor_id });
                                                                        setAppointmentStep(2);
                                                                    }
                                                                }}
                                                                disabled={!isAvailable}
                                                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isAvailable
                                                                    ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-500/20'
                                                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                                    }`}
                                                            >
                                                                {isAvailable ? 'Select' : 'Full'}
                                                            </button>
                                                        </div>
                                                    );
                                                })}

                                            {doctors.filter((doc: any) => !bookingDepartment || doc.specialization === bookingDepartment || doc.department_name === bookingDepartment).length === 0 && (
                                                <div className="text-center py-10 text-slate-400">
                                                    <p>No doctors found for this department.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleCreateAppointment} className="space-y-6">
                                    {/* Back Button */}
                                    <button type="button" onClick={() => setAppointmentStep(1)} className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors mb-2">
                                        <ChevronLeft className="w-4 h-4" /> Change Doctor / Date
                                    </button>

                                    {/* Patient Info */}
                                    <div className="bg-gradient-to-br from-gray-50 to-purple-50/30 rounded-2xl p-5 border border-purple-100">
                                        <h3 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-wider">Patient Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Patient Name *</label>
                                                <input type="text" required value={appointmentForm.patient_name} onChange={(e) => setAppointmentForm({ ...appointmentForm, patient_name: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-bold text-slate-700" placeholder="Enter Full Name" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Phone Number *</label>
                                                <input
                                                    type="tel"
                                                    required
                                                    value={appointmentForm.phone_number}
                                                    onChange={(e) => {
                                                        const value = e.target.value.replace(/\D/g, "");
                                                        if (value.length <= 10) {
                                                            setAppointmentForm({ ...appointmentForm, phone_number: value });
                                                        }
                                                    }}
                                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-bold text-slate-700"
                                                    placeholder="10-digit number"
                                                    maxLength={10}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Email</label>
                                                <input type="email" value={appointmentForm.email} onChange={(e) => setAppointmentForm({ ...appointmentForm, email: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-bold text-slate-700 font-mono text-sm" placeholder="email@example.com" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Age</label>
                                                <input
                                                    type="number"
                                                    value={appointmentForm.age}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        if (value === '' || (parseInt(value) >= 0 && value.length <= 3)) {
                                                            setAppointmentForm({ ...appointmentForm, age: value });
                                                        }
                                                    }}
                                                    onInput={(e) => {
                                                        const input = e.target as HTMLInputElement;
                                                        if (input.value.length > 3) {
                                                            input.value = input.value.slice(0, 3);
                                                        }
                                                    }}
                                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-bold text-slate-700"
                                                    placeholder="Age"
                                                    min="0"
                                                    max="999"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Gender</label>
                                                <select value={appointmentForm.gender} onChange={(e) => setAppointmentForm({ ...appointmentForm, gender: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-bold text-slate-700">
                                                    <option value="">Select</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Pediatric">Pediatric</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Appointment Details */}
                                    <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-2xl p-5 border border-blue-100">
                                        <h3 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-wider">Appointment Details</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Doctor & Date Readonly Display */}
                                            <div className="md:col-span-2 flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 mb-2">
                                                <div className="flex-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Doctor</span>
                                                    <p className="font-bold text-slate-800">
                                                        {doctors.find((d: any) => d.doctor_id == appointmentForm.doctor_id) ?
                                                            `Dr. ${doctors.find((d: any) => d.doctor_id == appointmentForm.doctor_id).first_name} ${doctors.find((d: any) => d.doctor_id == appointmentForm.doctor_id).last_name}`
                                                            : 'Selected Doctor'}
                                                    </p>
                                                </div>
                                                <div className="h-8 w-px bg-slate-200" />
                                                <div className="flex-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</span>
                                                    <p className="font-bold text-slate-800">
                                                        {new Date(appointmentForm.appointment_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">Select Time Slot *</label>

                                                {/* Category Tabs */}
                                                <div className="flex gap-2 mb-3 bg-slate-100/50 p-1 rounded-xl">
                                                    {[
                                                        { id: 'Morning', icon: Sun, label: 'Morning' },
                                                        { id: 'Afternoon', icon: CloudSun, label: 'Afternoon' },
                                                        { id: 'Evening', icon: Moon, label: 'Evening' }
                                                    ].map((cat) => (
                                                        <button
                                                            key={cat.id}
                                                            type="button"
                                                            onClick={() => setTimeSlotCategory(cat.id as any)}
                                                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${timeSlotCategory === cat.id
                                                                ? 'bg-white text-purple-700 shadow-sm'
                                                                : 'text-slate-400 hover:text-slate-600'
                                                                }`}
                                                        >
                                                            <cat.icon className="w-3.5 h-3.5" />
                                                            {cat.label}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Time Grid - Dynamic based on doctor schedule */}
                                                <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mb-2">
                                                    {availableTimeSlots.length > 0 ? (
                                                        availableTimeSlots
                                                            .filter((time) => {
                                                                const hour = parseInt(time.split(':')[0]);
                                                                if (timeSlotCategory === 'Morning') return hour >= 6 && hour < 12;
                                                                if (timeSlotCategory === 'Afternoon') return hour >= 12 && hour < 17;
                                                                if (timeSlotCategory === 'Evening') return hour >= 17 && hour < 22;
                                                                return false;
                                                            })
                                                            .map((time) => (
                                                                <button
                                                                    key={time}
                                                                    type="button"
                                                                    onClick={() => setAppointmentForm({ ...appointmentForm, appointment_time: time })}
                                                                    className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all ${appointmentForm.appointment_time === time
                                                                        ? 'bg-purple-600 border-purple-600 text-white ring-2 ring-purple-200'
                                                                        : 'border-slate-200 text-slate-600 hover:border-purple-300 hover:bg-purple-50'
                                                                        }`}
                                                                >
                                                                    {time}
                                                                </button>
                                                            ))
                                                    ) : (
                                                        <div className="col-span-full text-center py-4 text-xs font-bold text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                                            No {timeSlotCategory.toLowerCase()} slots available.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Reason for Visit</label>
                                                <input type="text" value={appointmentForm.reason_for_visit} onChange={(e) => setAppointmentForm({ ...appointmentForm, reason_for_visit: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium text-slate-700" placeholder="e.g., Routine checkup" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Notes</label>
                                                <textarea rows={2} value={appointmentForm.notes} onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium text-slate-700" placeholder="Any additional notes..." />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submit */}
                                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                        <button type="button" onClick={() => { setShowModal(false); resetAppointmentForm(); }} className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition font-bold text-sm">
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={loading} className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition font-bold text-sm shadow-lg shadow-purple-500/30">
                                            <Save className="w-4 h-4" />
                                            {loading ? 'Creating...' : 'Create Appointment'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )
            }

            {/* OPD Conversion Modal (Same as OPD Entry but pre-filled) */}
            {
                showOpdModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
                            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl">
                                <div>
                                    <h2 className="text-xl font-bold">Convert Appointment to OPD Entry</h2>
                                    <p className="text-sm text-blue-100 mt-1">Appointment: {selectedAppointment?.appointment_number}</p>
                                </div>
                                <button onClick={() => { setShowOpdModal(false); setSelectedAppointment(null); }} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateOPD} className="p-6 space-y-6">
                                {/* Patient Info (Pre-filled) */}
                                <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-lg p-5 border border-blue-100">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <User className="w-4 h-4 text-blue-600" />
                                        Patient Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label><input type="text" required value={opdForm.first_name} onChange={(e) => setOpdForm({ ...opdForm, first_name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label><input type="text" required value={opdForm.last_name} onChange={(e) => setOpdForm({ ...opdForm, last_name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Age *</label><input
                                            type="number"
                                            required
                                            value={opdForm.age}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value === '' || (parseInt(value) >= 0 && value.length <= 3)) {
                                                    setOpdForm({ ...opdForm, age: value });
                                                }
                                            }}
                                            onInput={(e) => {
                                                const input = e.target as HTMLInputElement;
                                                if (input.value.length > 3) {
                                                    input.value = input.value.slice(0, 3);
                                                }
                                            }}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Max 3 digits"
                                            min="0"
                                            max="999"
                                        /></div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label><select required value={opdForm.gender} onChange={(e) => setOpdForm({ ...opdForm, gender: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option><option value="Pediatric">Pediatric</option></select></div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                                            <input
                                                type="tel"
                                                required
                                                value={opdForm.contact_number}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\D/g, "");
                                                    if (value.length <= 10) {
                                                        setOpdForm({ ...opdForm, contact_number: value });
                                                    }
                                                }}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                placeholder="10-digit number"
                                                maxLength={10}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                                            <select value={opdForm.blood_group} onChange={(e) => setOpdForm({ ...opdForm, blood_group: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                                <option value="">Select</option>
                                                <option value="A+">A+</option>
                                                <option value="A-">A-</option>
                                                <option value="B+">B+</option>
                                                <option value="B-">B-</option>
                                                <option value="O+">O+</option>
                                                <option value="O-">O-</option>
                                                <option value="AB+">AB+</option>
                                                <option value="AB-">AB-</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Adhaar Number *</label>
                                            <input
                                                type="text"
                                                required
                                                value={opdForm.adhaar_number}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\D/g, "");
                                                    if (value.length <= 12) {
                                                        setOpdForm({ ...opdForm, adhaar_number: value });
                                                    }
                                                }}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                placeholder="12-digit UID"
                                                maxLength={12}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Visit Details */}
                                <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-lg p-5 border border-blue-100">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Visit Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Visit Type</label><select value={opdForm.visit_type} onChange={(e) => setOpdForm({ ...opdForm, visit_type: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"><option value="Walk-in">Walk-in</option><option value="Appointment">Appointment</option><option value="Follow-up">Follow-up</option><option value="Emergency">Emergency</option><option value="Referral">Referral</option></select></div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Date</label><input type="date" value={opdForm.visit_date} onChange={(e) => setOpdForm({ ...opdForm, visit_date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Time</label><input type="time" value={opdForm.visit_time} onChange={(e) => setOpdForm({ ...opdForm, visit_time: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                                        <div><SearchableSelect label="Doctor *" options={doctorOptions} value={opdForm.doctor_id} onChange={(val) => setOpdForm({ ...opdForm, doctor_id: val })} placeholder="Select Doctor" /></div>
                                    </div>
                                </div>

                                {/* Clinical Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint *</label><textarea required rows={3} value={opdForm.chief_complaint} onChange={(e) => setOpdForm({ ...opdForm, chief_complaint: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Main reason for visit..." /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Symptoms</label><textarea rows={3} value={opdForm.symptoms} onChange={(e) => setOpdForm({ ...opdForm, symptoms: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Observed symptoms..." /></div>
                                </div>

                                {/* Vitals */}
                                <div className="bg-gradient-to-br from-purple-50 to-pink-50/30 rounded-lg p-5 border border-purple-100">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Vital Signs</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                                        <div><label className="block text-xs font-medium text-gray-500 mb-1">BP Sys</label><input type="text" value={opdForm.vital_signs.bp_systolic} onChange={(e) => setOpdForm({ ...opdForm, vital_signs: { ...opdForm.vital_signs, bp_systolic: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="mmHg" /></div>
                                        <div><label className="block text-xs font-medium text-gray-500 mb-1">BP Dia</label><input type="text" value={opdForm.vital_signs.bp_diastolic} onChange={(e) => setOpdForm({ ...opdForm, vital_signs: { ...opdForm.vital_signs, bp_diastolic: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="mmHg" /></div>
                                        <div><label className="block text-xs font-medium text-gray-500 mb-1">Pulse</label><input type="text" value={opdForm.vital_signs.pulse} onChange={(e) => setOpdForm({ ...opdForm, vital_signs: { ...opdForm.vital_signs, pulse: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="bpm" /></div>
                                        <div><label className="block text-xs font-medium text-gray-500 mb-1">Temp</label><input type="text" value={opdForm.vital_signs.temperature} onChange={(e) => setOpdForm({ ...opdForm, vital_signs: { ...opdForm.vital_signs, temperature: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="°F" /></div>
                                        <div><label className="block text-xs font-medium text-gray-500 mb-1">Weight</label><input type="text" value={opdForm.vital_signs.weight} onChange={(e) => setOpdForm({ ...opdForm, vital_signs: { ...opdForm.vital_signs, weight: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="kg" /></div>
                                        <div><label className="block text-xs font-medium text-gray-500 mb-1">Height</label><input type="text" value={opdForm.vital_signs.height} onChange={(e) => setOpdForm({ ...opdForm, vital_signs: { ...opdForm.vital_signs, height: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="cm" /></div>
                                        <div><label className="block text-xs font-medium text-gray-500 mb-1">SpO2</label><input type="text" value={opdForm.vital_signs.spo2} onChange={(e) => setOpdForm({ ...opdForm, vital_signs: { ...opdForm.vital_signs, spo2: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="%" /></div>
                                    </div>
                                </div>

                                {/* Payment */}
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50/30 rounded-lg p-5 border border-green-100">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee</label><div className="relative"><span className="absolute left-3 top-2.5 text-gray-500">₹</span><input type="number" value={opdForm.consultation_fee} onChange={(e) => setOpdForm({ ...opdForm, consultation_fee: e.target.value })} className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0.00" /></div></div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label><select value={opdForm.payment_status} onChange={(e) => setOpdForm({ ...opdForm, payment_status: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"><option value="Pending">Pending</option><option value="Paid">Paid</option><option value="Partial">Partial</option><option value="Waived">Waived</option></select></div>
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                    <button type="button" onClick={() => { setShowOpdModal(false); setSelectedAppointment(null); }} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">Cancel</button>
                                    <button type="submit" disabled={loading} className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-medium shadow-lg shadow-blue-500/30">
                                        <Save className="w-5 h-5" />
                                        {loading ? 'Creating...' : 'Create OPD Entry'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

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
                                        onChange={(val) => setRescheduleForm({ ...rescheduleForm, doctor_id: val })}
                                        placeholder="Select Doctor"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Date *</label>
                                    <input type="date" required value={rescheduleForm.appointment_date} onChange={(e) => setRescheduleForm({ ...rescheduleForm, appointment_date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500" />
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
                                    <div className="grid grid-cols-4 gap-2 mb-2">
                                        {generateTimeSlots(timeSlotCategory).map((time) => (
                                            <button
                                                key={time}
                                                type="button"
                                                onClick={() => setRescheduleForm({ ...rescheduleForm, appointment_time: time })}
                                                className={`py-2 px-1 text-sm rounded-lg border transition-all ${rescheduleForm.appointment_time === time
                                                    ? 'bg-amber-500 border-amber-500 text-white font-bold ring-2 ring-amber-200'
                                                    : 'border-gray-200 text-gray-600 hover:border-amber-300 hover:bg-amber-50'
                                                    }`}
                                            >
                                                {time}
                                            </button>
                                        ))}
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

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                    <button type="button" onClick={() => setShowRescheduleModal(false)} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700 transition font-medium shadow-lg shadow-amber-500/30">
                                        <CalendarClock className="w-5 h-5" />
                                        {loading ? 'Updating...' : 'Confirm New Time'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
