'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Calendar, FileText, X, Save, User, ArrowRight, Clock, Check, Stethoscope, MapPin, Activity, Search, ChevronLeft, AlertCircle, Phone } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import SearchableSelect from '../../../components/ui/SearchableSelect';
import BookAppointmentModal from '../components/BookAppointmentModal';
import RescheduleAppointmentModal from '../components/RescheduleAppointmentModal';
import { useAI } from '@/components/ai';
import { format } from 'date-fns';

const API_URL = 'http://localhost:5000/api';

export default function AppointmentsPage() {
    // Phone search implementation added
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [appointments, setAppointments] = useState([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
    const [doctors, setDoctors] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showOpdModal, setShowOpdModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('All');
    const [doctorSchedules, setDoctorSchedules] = useState<any[]>([]);


    // Reschedule & Cancel States
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [appointmentToCancel, setAppointmentToCancel] = useState<any>(null);
    const [cancelReason, setCancelReason] = useState('Patient Request');

    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [appointmentToReschedule, setAppointmentToReschedule] = useState<any>(null);




    // --- Ported Logic from Dashboard ---
    const handleFollowUpStatusChange = async (apptId: string, newStatus: string) => {
        if (!newStatus) return;

        // Optimistic Update
        const previousAppointments = [...appointments];
        setAppointments(prev => prev.map((apt: any) => {
            if (apt.appointment_id !== apptId) return apt;
            if (newStatus === 'No Answer') {
                return { ...apt, appointment_status: 'Cancelled', cancellation_reason: 'No Answer' };
            }
            return { ...apt, appointment_status: newStatus };
        }));

        try {
            const token = localStorage.getItem('token');
            let payload: any = { status: newStatus };
            if (newStatus === 'No Answer') {
                payload = { status: 'Cancelled', cancellation_reason: 'No Answer' };
            }

            await axios.patch(`${API_URL}/appointments/${apptId}/status`,
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

    const getStatusBadge = (apt: any) => {
        const { appointment_status, cancellation_reason } = apt;
        if (appointment_status === 'Confirmed') return { label: 'Scheduled', style: 'bg-blue-500 text-white' };
        if (appointment_status === 'Scheduled') return { label: 'Scheduled', style: 'bg-blue-500 text-white' };
        if (appointment_status === 'Cancelled') {
            if (cancellation_reason === 'No Answer') return { label: 'Scheduled', style: 'bg-blue-500 text-white' };
            return { label: 'Cancelled', style: 'bg-slate-400 text-white' };
        }
        if (appointment_status === 'No-show') return { label: 'No Show', style: 'bg-slate-500 text-white' };
        return { label: 'Scheduled', style: 'bg-blue-500 text-white' };
    };

    const getDropdownStyle = (apt: any) => {
        const { appointment_status, cancellation_reason } = apt;
        if (appointment_status === 'Confirmed') return 'bg-emerald-50 border-emerald-200 text-emerald-600';
        if (appointment_status === 'Cancelled' && cancellation_reason === 'No Answer') return 'bg-amber-50 border-amber-200 text-amber-600';
        if (appointment_status === 'No-show') return 'bg-slate-50 border-slate-200 text-slate-500';
        return 'bg-slate-50 border-slate-200 text-slate-600';
    };



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

    // AI page context
    let aiContext: { setPageContext?: (page: string, context?: string) => void } = {};
    try { aiContext = useAI(); } catch { /* AIContextProvider not available */ }

    useEffect(() => {
        if (aiContext.setPageContext) {
            const scheduled = appointments.filter((a: any) => a.status === 'Scheduled' || a.status === 'Confirmed').length;
            const completed = appointments.filter((a: any) => a.status === 'Completed').length;
            const cancelled = appointments.filter((a: any) => a.status === 'Cancelled').length;
            const ctx = `Viewing Appointments page. Tab: ${activeTab}. Department: ${selectedDepartment}. ` +
                `Total: ${appointments.length} appointments. Scheduled: ${scheduled}, Completed: ${completed}, Cancelled: ${cancelled}. ` +
                `${doctors.length} doctors available. ${departments.length} departments. ` +
                `Use getAppointments, getDoctorAvailability, or checkDuplicateAppointment tools for details.`;
            aiContext.setPageContext('/receptionist/appointments', ctx);
        }
    }, [aiContext.setPageContext, appointments, activeTab, selectedDepartment, doctors.length, departments.length]);



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



    // Effect to fetch schedules on mount
    useEffect(() => {
        fetchDoctorSchedules();
    }, []);



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
        setShowRescheduleModal(true);
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

            {/* Wide Card List View - 2 Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-7xl mx-auto px-4 md:px-0">
                {appointments
                    .filter((a: any) => {
                        // Status Filter
                        const statusMatch = activeTab === 'All' ? true :
                            activeTab === 'Scheduled' ? ['Scheduled', 'Confirmed'].includes(a.appointment_status) :
                                a.appointment_status === activeTab;

                        // Department Filter
                        const deptMatch = selectedDepartment === 'All Departments' ? true :
                            (a.department_name === selectedDepartment || a.specialization?.includes(selectedDepartment));

                        return statusMatch && deptMatch;
                    })
                    .map((apt: any) => {
                        const badgeProps = getStatusBadge(apt);
                        const dropdownStyle = getDropdownStyle(apt);

                        // Determine dropdown value
                        let dropdownValue = '';
                        if (apt.appointment_status === 'Confirmed') dropdownValue = 'Confirmed';
                        else if (apt.appointment_status === 'Cancelled' && apt.cancellation_reason === 'No Answer') dropdownValue = 'No Answer';

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
                                                {apt.patient_name?.charAt(0)}
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
                                        <div className="md:ml-auto w-full md:w-36">
                                            <select
                                                value={dropdownValue}
                                                onChange={(e) => handleFollowUpStatusChange(apt.appointment_id, e.target.value)}
                                                className={`w-full appearance-none px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-colors outline-none focus:ring-2 focus:ring-indigo-500/20 ${dropdownStyle} cursor-pointer`}
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
                                                <p className="font-bold text-slate-900 text-sm leading-tight">Dr. {apt.doctor_first_name}</p>
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
                                                <p className="font-bold text-slate-900 text-sm leading-tight">{apt.appointment_time?.slice(0, 5)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer: Actions */}
                                    <div className="flex flex-col md:flex-row md:items-center gap-6 pt-4 border-t border-slate-100">
                                        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-xs">
                                            <User className="w-4 h-4" />
                                            ID: <span className="font-bold text-slate-700 text-sm">#{apt.appointment_number}</span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 md:ml-auto justify-end">
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
                                                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2"
                                            >
                                                Convert to OPD
                                                <ArrowRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                {/* Empty State */}
                {appointments.length === 0 && (
                    <div className="col-span-full text-center py-20">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Calendar className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-700">No appointments found</h3>
                        <p className="text-slate-500 mt-1">Try adjusting your filters or create a new appointment.</p>
                    </div>
                )}
            </div>

            {/* Book Appointment Modal */}
            <BookAppointmentModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={() => {
                    fetchAppointments();
                    setShowModal(false);
                }}
                doctors={doctors}
                departments={departments}
                doctorSchedules={doctorSchedules}
                appointments={appointments}
            />

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
            <RescheduleAppointmentModal
                isOpen={showRescheduleModal}
                onClose={() => setShowRescheduleModal(false)}
                onSuccess={() => {
                    fetchAppointments();
                    setShowRescheduleModal(false);
                }}
                appointment={appointmentToReschedule}
                doctors={doctors}
                doctorSchedules={doctorSchedules}
                appointments={appointments}
            />
        </div >
    );
}
