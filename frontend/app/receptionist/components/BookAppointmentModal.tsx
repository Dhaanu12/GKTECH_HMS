import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Search, User, Sun, CloudSun, Moon, AlertCircle, Save, Calendar, ChevronLeft, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

const API_URL = 'http://localhost:5000/api';

interface BookAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    doctors: any[];
    departments: any[];
    doctorSchedules: any[];
    appointments: any[];
}

export default function BookAppointmentModal({
    isOpen,
    onClose,
    onSuccess,
    doctors,
    departments,
    doctorSchedules,
    appointments // Used for duplicate checks & availability
}: BookAppointmentModalProps) {
    // --- State from Dashboard ---
    const [loading, setLoading] = useState(false);

    // Appointment Form State
    const [appointmentStep, setAppointmentStep] = useState(1);
    const [bookingDepartment, setBookingDepartment] = useState('');
    const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
    const [appointmentForm, setAppointmentForm] = useState({
        patient_id: null as number | null,
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

    const [duplicateApptWarning, setDuplicateApptWarning] = useState<string | null>(null);
    const [apptPhoneSearchResults, setApptPhoneSearchResults] = useState<any[]>([]);
    const [isApptSearching, setIsApptSearching] = useState(false);
    const [selectedApptPatient, setSelectedApptPatient] = useState<any>(null);
    const [isAddingNewFamilyMember, setIsAddingNewFamilyMember] = useState(false);

    const [timeSlotCategory, setTimeSlotCategory] = useState<'Morning' | 'Afternoon' | 'Evening'>('Morning');
    const [availableTimeSlots, setAvailableTimeSlots] = useState<{ time: string, status: 'available' | 'booked' }[]>([]);

    // --- Helper Functions from Dashboard ---

    const formatTime12Hour = (time24: string) => {
        if (!time24) return '';
        const [hours, minutes] = time24.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const h = hours % 12 || 12;
        return `${h}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

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
                    // Create a specific date object for this slot on "today" to compare time accurately
                    const slotTime = new Date(now);
                    slotTime.setHours(current.getHours(), current.getMinutes(), 0, 0);

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
        const slotsWithStatus = uniqueSlots.map(time => {
            const isBooked = appointments.some((appt: any) => {
                // Parse apt Date safely
                let aptDate = '';
                if (appt.appointment_date) {
                    const d = new Date(appt.appointment_date);
                    aptDate = format(d, 'yyyy-MM-dd');
                }
                const aptTime = appt.appointment_time ? appt.appointment_time.slice(0, 5) : '';

                return (
                    appt.doctor_id === parseInt(doctorId) &&
                    aptDate === selectedDate &&
                    aptTime === time &&
                    ['Scheduled', 'Confirmed'].includes(appt.appointment_status)
                );
            });

            return {
                time,
                status: isBooked ? 'booked' : 'available'
            };
        });

        return slotsWithStatus as { time: string, status: 'available' | 'booked' }[];
    };

    const getDoctorAvailabilityCount = (doctorId: number, dateStr: string) => {
        // Wrapper around generateTimeSlotsFromSchedule for dashboard
        const slots = generateTimeSlotsFromSchedule(doctorId.toString(), dateStr);
        return slots ? slots.length : 0;
    };

    const getNextAvailability = (doctorId: number, fromDateStr: string) => {
        const start = new Date(fromDateStr);
        // Check next 30 days
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

    const resetAppointmentForm = () => {
        setAppointmentForm({
            patient_id: null,
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
        setApptPhoneSearchResults([]);
        setSelectedApptPatient(null);
    };

    // --- Effects ---

    // Reset when modal closes (or rather, when it opens, if needed, but managing via props)
    // Actually, dashboard resets on close. We'll stick to that.

    // Check for Duplicate Appointment
    useEffect(() => {
        const checkDuplicateAppt = async () => {
            if (!appointmentForm.doctor_id || !appointmentForm.appointment_date) {
                setDuplicateApptWarning(null);
                return;
            }

            if (isAddingNewFamilyMember) {
                setDuplicateApptWarning(null);
                return;
            }

            const params: any = {
                doctor_id: appointmentForm.doctor_id,
                appointment_date: appointmentForm.appointment_date
            };

            if (appointmentForm.patient_id) {
                params.patient_id = appointmentForm.patient_id;
            } else if (appointmentForm.phone_number) {
                params.phone_number = appointmentForm.phone_number;
            } else {
                setDuplicateApptWarning(null);
                return;
            }

            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/appointments/check-duplicate`, {
                    params,
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data.exists) {
                    setDuplicateApptWarning(response.data.message);
                } else {
                    setDuplicateApptWarning(null);
                }
            } catch (error) {
                console.error("Error checking duplicate appointment:", error);
                setDuplicateApptWarning(null);
            }
        };

        const timeoutId = setTimeout(checkDuplicateAppt, 500);
        return () => clearTimeout(timeoutId);
    }, [appointmentForm.patient_id, appointmentForm.doctor_id, appointmentForm.appointment_date, appointmentForm.phone_number, isAddingNewFamilyMember]);

    // Phone search effect
    useEffect(() => {
        if (!appointmentForm.phone_number || appointmentForm.phone_number.length < 8) {
            setApptPhoneSearchResults([]);
            return;
        }
        const debounceTimer = setTimeout(async () => {
            setIsApptSearching(true);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/patients/search`, {
                    params: { q: appointmentForm.phone_number },
                    headers: { Authorization: `Bearer ${token}` }
                });
                const results = response.data.data.patients || [];
                setApptPhoneSearchResults(results);
            } catch (error) {
                console.error('Phone search error:', error);
                setApptPhoneSearchResults([]);
            } finally {
                setIsApptSearching(false);
            }
        }, 300);
        return () => clearTimeout(debounceTimer);
    }, [appointmentForm.phone_number]);

    // Update time slots when doctor/date/schedules change
    useEffect(() => {
        if (appointmentForm.doctor_id && appointmentForm.appointment_date) {
            const slots = generateTimeSlotsFromSchedule(appointmentForm.doctor_id, appointmentForm.appointment_date);
            setAvailableTimeSlots(slots || []);

            if (slots && slots.length > 0) {
                const hasMorning = slots.some((slot) => { const h = parseInt(slot.time.split(':')[0]); return h >= 6 && h < 12 });
                const hasAfternoon = slots.some((slot) => { const h = parseInt(slot.time.split(':')[0]); return h >= 12 && h < 17 });
                const hasEvening = slots.some((slot) => { const h = parseInt(slot.time.split(':')[0]); return h >= 17 && h < 22 });

                if (hasMorning) setTimeSlotCategory('Morning');
                else if (hasAfternoon) setTimeSlotCategory('Afternoon');
                else if (hasEvening) setTimeSlotCategory('Evening');
            }
        }
    }, [appointmentForm.doctor_id, appointmentForm.appointment_date, doctorSchedules, appointments]);


    // Handlers
    const handleApptPatientSelect = (patient: any) => {
        setSelectedApptPatient(patient);
        setAppointmentForm({
            ...appointmentForm,
            patient_id: patient.patient_id,
            patient_name: `${patient.first_name} ${patient.last_name || ''}`.trim(),
            phone_number: patient.contact_number || appointmentForm.phone_number,
            email: patient.email || '',
            age: patient.age?.toString() || '',
            gender: patient.gender || ''
        });
        setApptPhoneSearchResults([]);
        setIsAddingNewFamilyMember(false);
    };

    const handleCreateAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/appointments', {
                ...appointmentForm,
                is_family_member: isAddingNewFamilyMember
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Appointment created successfully!');
            onSuccess(); // Parent should handle refresh and maybe close
            onClose(); // Close modal
            resetAppointmentForm();
        } catch (error: any) {
            console.error('Error creating appointment:', error);
            alert(error.response?.data?.message || 'Failed to create appointment');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
                <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl">
                    <h2 className="text-xl font-bold">New Appointment</h2>
                    <button onClick={() => { onClose(); resetAppointmentForm(); }} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
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
                                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-bold text-slate-700"
                                            min={new Date().toISOString().split('T')[0]}
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
                                    {/* Phone Number - First Field with Search */}
                                    <div className="relative">
                                        <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Phone Number <span className="text-red-500">*</span></label>
                                        <input
                                            type="tel"
                                            required
                                            value={appointmentForm.phone_number}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, "");
                                                if (value.length <= 10) {
                                                    setAppointmentForm({ ...appointmentForm, phone_number: value, patient_id: null });
                                                    setSelectedApptPatient(null);
                                                    setIsAddingNewFamilyMember(false); // Reset family member flag on phone change
                                                }
                                            }}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-bold text-slate-700"
                                            placeholder="10-digit number"
                                            maxLength={10}
                                        />

                                        {/* Existing Patients Dropdown */}
                                        {apptPhoneSearchResults.length > 0 && appointmentForm.phone_number.length >= 8 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                                                <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
                                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Existing Patients Found</span>
                                                </div>
                                                <div className="max-h-48 overflow-y-auto">
                                                    {apptPhoneSearchResults.map((patient: any) => (
                                                        <div
                                                            key={patient.patient_id}
                                                            className="px-4 py-3 hover:bg-purple-50 border-b border-slate-100 last:border-0 flex items-center justify-between"
                                                        >
                                                            <div>
                                                                <p className="font-bold text-slate-800">{patient.first_name} {patient.last_name}</p>
                                                                <p className="text-sm text-slate-500">
                                                                    {patient.gender}, {patient.age} yrs • ID: {patient.mrn_number}
                                                                </p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleApptPatientSelect(patient)}
                                                                className="px-3 py-1.5 text-purple-600 border border-purple-200 rounded-lg text-xs font-bold hover:bg-purple-50 transition"
                                                            >
                                                                Select
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div
                                                    className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2 cursor-pointer hover:bg-purple-50 transition"
                                                    onClick={() => {
                                                        setApptPhoneSearchResults([]);
                                                        setAppointmentForm({ ...appointmentForm, patient_id: null, patient_name: '' });
                                                        setSelectedApptPatient(null);
                                                        setDuplicateApptWarning(null);
                                                        setIsAddingNewFamilyMember(true); // Skip duplicate check for family members
                                                    }}
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center">
                                                        <Plus className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-semibold text-purple-600 whitespace-nowrap text-sm">Add New Patient (Friends / Family)</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Loading indicator */}
                                        {isApptSearching && appointmentForm.phone_number.length >= 8 && (
                                            <div className="absolute right-3 top-1/2 translate-y-2">
                                                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Patient Name */}
                                    <div className="md:col-span-2">
                                        <div className="flex justify-between items-center mb-1 ml-1">
                                            <label className="block text-xs font-bold text-slate-500">Patient Name <span className="text-red-500">*</span></label>
                                            {selectedApptPatient && (
                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <User className="w-3 h-3" /> Selected
                                                </span>
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={appointmentForm.patient_name}
                                            onChange={(e) => setAppointmentForm({ ...appointmentForm, patient_name: e.target.value })}
                                            disabled={appointmentForm.phone_number.length < 10 || (apptPhoneSearchResults.length > 0 && !selectedApptPatient)}
                                            className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-purple-500 font-bold text-slate-700 ${selectedApptPatient ? 'bg-purple-50 border-purple-200' : 'border-slate-200'
                                                } disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed`}
                                            placeholder="Enter Full Name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Email</label>
                                        <input
                                            type="email"
                                            value={appointmentForm.email}
                                            onChange={(e) => setAppointmentForm({ ...appointmentForm, email: e.target.value })}
                                            disabled={appointmentForm.phone_number.length < 10 || (apptPhoneSearchResults.length > 0 && !selectedApptPatient)}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-bold text-slate-700 font-mono text-sm disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                            placeholder="email@example.com"
                                        />
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
                                            disabled={appointmentForm.phone_number.length < 10 || (apptPhoneSearchResults.length > 0 && !selectedApptPatient)}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-bold text-slate-700 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                            placeholder="Age"
                                            min="0"
                                            max="999"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Gender</label>
                                        <select
                                            value={appointmentForm.gender}
                                            onChange={(e) => setAppointmentForm({ ...appointmentForm, gender: e.target.value })}
                                            disabled={appointmentForm.phone_number.length < 10 || (apptPhoneSearchResults.length > 0 && !selectedApptPatient)}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-bold text-slate-700 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                        >
                                            <option value="">Select</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Others">Others</option>
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
                                        <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">Select Time Slot <span className="text-red-500">*</span></label>
                                        {/* Category Tabs */}
                                        <div className="flex gap-2 mb-3 bg-slate-100/50 p-1 rounded-xl">
                                            {[
                                                { id: 'Morning', icon: Sun, label: 'Morning' },
                                                { id: 'Afternoon', icon: CloudSun, label: 'Afternoon' },
                                                { id: 'Evening', icon: Moon, label: 'Evening' }
                                            ]
                                                .filter(cat => {
                                                    // Only show category if it has slots
                                                    return availableTimeSlots.some((slot: any) => {
                                                        const timeVal = typeof slot === 'string' ? slot : slot.time;
                                                        if (!timeVal) return false;
                                                        const hour = parseInt(timeVal.split(':')[0]);
                                                        if (cat.id === 'Morning') return hour >= 6 && hour < 12;
                                                        if (cat.id === 'Afternoon') return hour >= 12 && hour < 17;
                                                        if (cat.id === 'Evening') return hour >= 17 && hour < 22;
                                                        return false;
                                                    });
                                                })
                                                .map((cat) => (
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
                                                    .filter((slot: any) => {
                                                        const timeVal = typeof slot === 'string' ? slot : slot.time;
                                                        if (!timeVal) return false;
                                                        const hour = parseInt(timeVal.split(':')[0]);
                                                        if (timeSlotCategory === 'Morning') return hour >= 6 && hour < 12;
                                                        if (timeSlotCategory === 'Afternoon') return hour >= 12 && hour < 17;
                                                        if (timeSlotCategory === 'Evening') return hour >= 17 && hour < 22;
                                                        return false;
                                                    })
                                                    .map((slot: any) => {
                                                        const timeVal = typeof slot === 'string' ? slot : slot.time;
                                                        const isBooked = typeof slot === 'string' ? false : slot.status === 'booked';

                                                        return (
                                                            <button
                                                                key={timeVal}
                                                                type="button"
                                                                disabled={isBooked}
                                                                onClick={() => setAppointmentForm({ ...appointmentForm, appointment_time: timeVal })}
                                                                className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all relative ${isBooked
                                                                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-70'
                                                                    : appointmentForm.appointment_time === timeVal
                                                                        ? 'bg-purple-600 border-purple-600 text-white ring-2 ring-purple-200'
                                                                        : 'border-slate-200 text-slate-600 hover:border-purple-300 hover:bg-purple-50'
                                                                    }`}
                                                            >
                                                                {timeVal}
                                                                {isBooked && (
                                                                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                                    </span>
                                                                )}
                                                            </button>
                                                        );
                                                    })
                                            ) : (
                                                <div className="col-span-full text-center py-4 text-xs font-bold text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                                    No {timeSlotCategory.toLowerCase()} slots available.
                                                </div>
                                            )}
                                        </div>
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


                            {/* Submit */}
                            <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">

                                {/* Duplicate Warning */}
                                {duplicateApptWarning && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-100 animate-in fade-in slide-in-from-left-2">
                                        <AlertCircle size={14} />
                                        {duplicateApptWarning}
                                    </div>
                                )}

                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => { onClose(); resetAppointmentForm(); }} className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition font-bold text-sm">
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !!duplicateApptWarning || !appointmentForm.phone_number || !appointmentForm.patient_name || !appointmentForm.appointment_time}
                                        className={`flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition font-bold text-sm shadow-lg shadow-purple-500/30 ${loading || !!duplicateApptWarning || !appointmentForm.phone_number || !appointmentForm.patient_name || !appointmentForm.appointment_time ? 'opacity-50 cursor-not-allowed from-slate-400 to-slate-500 hover:shadow-none' : ''}`}
                                    >
                                        <Save className="w-4 h-4" />
                                        {loading ? 'Creating...' : 'Create Appointment'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

// Plus definition
const Plus = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M5 12h14" />
        <path d="M12 5v14" />
    </svg>
);
