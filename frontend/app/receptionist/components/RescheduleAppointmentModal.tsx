'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, CalendarClock, User, Sun, CloudSun, Moon, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import SearchableSelect from '../../../components/ui/SearchableSelect';

interface RescheduleAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    appointment: any;
    doctors: any[];
    doctorSchedules: any[];
    appointments: any[];
}

export default function RescheduleAppointmentModal({
    isOpen,
    onClose,
    onSuccess,
    appointment,
    doctors,
    doctorSchedules,
    appointments
}: RescheduleAppointmentModalProps) {
    const [loading, setLoading] = useState(false);
    const [timeSlotCategory, setTimeSlotCategory] = useState<'Morning' | 'Afternoon' | 'Evening'>('Morning');
    const [rescheduleError, setRescheduleError] = useState<string | null>(null);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);

    const [rescheduleForm, setRescheduleForm] = useState({
        appointment_date: '',
        appointment_time: '',
        doctor_id: '',
        reason: ''
    });

    // Reset form when modal opens or appointment changes
    useEffect(() => {
        if (isOpen && appointment) {
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

            setRescheduleError(null);
        }
    }, [isOpen, appointment]);

    // Fetch booked slots
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
        if (isOpen && rescheduleForm.doctor_id && rescheduleForm.appointment_date) {
            fetchBookedSlots(rescheduleForm.doctor_id, rescheduleForm.appointment_date);
        }
    }, [isOpen, rescheduleForm.doctor_id, rescheduleForm.appointment_date]);

    // Generate Slots Logic
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

    const handleReschedule = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`http://localhost:5000/api/appointments/${appointment.appointment_id}/reschedule`, {
                appointment_date: rescheduleForm.appointment_date,
                appointment_time: rescheduleForm.appointment_time,
                doctor_id: rescheduleForm.doctor_id,
                reason: rescheduleForm.reason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Appointment rescheduled successfully!');
            onSuccess();
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

    const doctorOptions = doctors.map((doc: any) => ({
        value: doc.doctor_id,
        label: `Dr. ${doc.first_name} ${doc.last_name} (${doc.specialization})`
    }));

    // Real-time duplicate check for Reschedule
    useEffect(() => {
        if (!isOpen || !appointment || !rescheduleForm.appointment_date || !rescheduleForm.doctor_id) return;

        const checkDuplicate = async () => {
            try {
                const token = localStorage.getItem('token');
                const params: any = {
                    doctor_id: rescheduleForm.doctor_id,
                    appointment_date: rescheduleForm.appointment_date,
                    exclude_appointment_id: appointment.appointment_id
                };

                // Use same logic as backend: patient_id if exists, else phone_number
                if (appointment.patient_id) {
                    params.patient_id = appointment.patient_id;
                } else {
                    params.phone_number = appointment.phone_number;
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
    }, [rescheduleForm.appointment_date, rescheduleForm.doctor_id, isOpen, appointment]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/20">
                <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <CalendarClock className="w-6 h-6" />
                        Reschedule Appointment
                    </h2>
                    <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleReschedule} className="p-6 space-y-6">
                    <div className="bg-amber-50 rounded-lg p-4 mb-4 border border-amber-100">
                        <p className="text-sm text-amber-800 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Rescheduling for: <span className="font-bold">{appointment?.patient_name}</span>
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
                        <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">
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
    );
}
