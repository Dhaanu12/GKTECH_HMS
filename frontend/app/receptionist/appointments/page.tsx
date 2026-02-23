'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Calendar, FileText, X, Save, User, ArrowRight, Clock, Check, Stethoscope, MapPin, Activity, Search, ChevronLeft, AlertCircle, Phone, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import SearchableSelect from '../../../components/ui/SearchableSelect';
import BookAppointmentModal from '../components/BookAppointmentModal';
import RescheduleAppointmentModal from '../components/RescheduleAppointmentModal';
import ConvertToOpdModal from './components/ConvertToOpdModal';
import { useAI } from '@/components/ai';
import { format } from 'date-fns';

const API_URL = 'http://localhost:5000/api';

export default function AppointmentsPage() {
    // Phone search implementation added
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    // const [selectedDepartment, setSelectedDepartment] = useState('All Departments'); // REMOVED
    const [doctors, setDoctors] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showOpdModal, setShowOpdModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('All');
    const [doctorSchedules, setDoctorSchedules] = useState<any[]>([]);
    const [branchDetails, setBranchDetails] = useState<any>(null); // For clinical hours warning
    const [todayOpdEntries, setTodayOpdEntries] = useState<any[]>([]);

    // New Filters from Dashboard
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDoctorId, setSelectedDoctorId] = useState('');


    // Reschedule & Cancel States
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [appointmentToCancel, setAppointmentToCancel] = useState<any>(null);
    const [cancelReason, setCancelReason] = useState('Patient Request');

    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [appointmentToReschedule, setAppointmentToReschedule] = useState<any>(null);




    // --- Ported Logic from Dashboard ---
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
        if (appointment_status === 'Confirmed') return { label: 'Scheduled', style: 'bg-blue-600 text-white' };
        if (appointment_status === 'Scheduled') return { label: 'Scheduled', style: 'bg-blue-600 text-white' };
        if (appointment_status === 'In OPD') return { label: 'In OPD', style: 'bg-indigo-600 text-white' };
        if (appointment_status === 'Cancelled') {
            if (cancellation_reason === 'No Answer') return { label: 'Scheduled', style: 'bg-blue-600 text-white' };
            return { label: 'Cancelled', style: 'bg-red-500 text-white' };
        }
        if (appointment_status === 'No-show') return { label: 'No Show', style: 'bg-slate-700 text-white' };
        return { label: 'Scheduled', style: 'bg-blue-600 text-white' };
    };

    const getDropdownStyle = (apt: any) => {
        return 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300';
    };




    useEffect(() => {
        fetchDoctors();
        fetchAppointments();
        fetchDepartments();
        fetchTodayOpdEntries();
    }, []);

    // AI page context
    const aiContext: { setPageContext?: (page: string, context?: string) => void } = useAI() || {};

    useEffect(() => {
        if (aiContext.setPageContext) {
            const scheduled = appointments.filter((a: any) => a.status === 'Scheduled' || a.status === 'Confirmed').length;
            const completed = appointments.filter((a: any) => a.status === 'Completed').length;
            const cancelled = appointments.filter((a: any) => a.status === 'Cancelled').length;
            const ctx = `Viewing Appointments page. Tab: ${activeTab}. Date: ${selectedDate}. ` +
                `Total: ${appointments.length} appointments. Scheduled: ${scheduled}, Completed: ${completed}, Cancelled: ${cancelled}. ` +
                `${doctors.length} doctors available. ${departments.length} departments. ` +
                `Use getAppointments, getDoctorAvailability, or checkDuplicateAppointment tools for details.`;
            aiContext.setPageContext('/receptionist/appointments', ctx);
        }
    }, [aiContext.setPageContext, appointments, activeTab, selectedDate, doctors.length, departments.length]);



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

    const fetchBranchDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            if (user?.branch_id) {
                const response = await axios.get(`http://localhost:5000/api/branches/${user.branch_id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setBranchDetails(response.data.data.branch);
            }
        } catch (error) {
            console.error('Error fetching branch details:', error);
        }
    };

    const fetchTodayOpdEntries = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/opd/today`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTodayOpdEntries(response.data.data.entries || []);
        } catch (error) {
            console.error('Error fetching today\'s OPD entries:', error);
        }
    };



    // Effect to fetch schedules on mount
    useEffect(() => {
        fetchDoctorSchedules();
        if (user?.branch_id) {
            fetchBranchDetails();
        }
    }, [user?.branch_id]);



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
        setSelectedAppointment(appointment);
        setShowOpdModal(true);
    };





    const doctorOptions = doctors.map((doc: any) => ({
        value: doc.doctor_id,
        label: `Dr. ${doc.first_name} ${doc.last_name} (${doc.specialization})`
    }));

    // Filter appointments based on Date, Doctor, and Search Query
    const filteredByContext = appointments.filter((apt: any) => {
        // 1. Date Filter
        if (selectedDate) {
            let aptDate = '';
            if (apt.appointment_date) {
                const d = new Date(apt.appointment_date);
                aptDate = format(d, 'yyyy-MM-dd');
            }
            if (aptDate !== selectedDate) return false;
        }

        // 2. Doctor Filter
        if (selectedDoctorId && apt.doctor_id?.toString() !== selectedDoctorId) return false;

        // 3. Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const name = apt.patient_name?.toLowerCase() || '';
            const phone = apt.phone_number?.toString() || '';
            const mrn = (apt.mrn_number || apt.patient_id)?.toString().toLowerCase() || '';
            const apptNo = apt.appointment_number?.toLowerCase() || '';

            if (!name.includes(query) &&
                !phone.includes(query) &&
                !mrn.includes(query) &&
                !apptNo.includes(query)) return false;
        }

        return true;
    });

    return (
        <div className="relative min-h-screen pb-20 bg-slate-50/50">
            {/* Header Section */}
            <div className="mb-8 px-6 max-w-[1600px] mx-auto">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Hospital Appointments
                        </h1>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-slate-200/60 text-slate-600 rounded-full hover:bg-white hover:text-purple-600 hover:border-purple-100 shadow-sm hover:shadow-md transition-all duration-300 font-semibold text-sm group"
                        title="Reset Filters"
                    >
                        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                        <span>Refresh</span>
                    </button>
                </div>

                {/* Search & Filters */}
                {/* Search & Filters */}
                <div className="bg-slate-100 p-1 rounded-[2rem] border border-slate-200/60 shadow-xl shadow-slate-200/20 mt-6 flex flex-col md:flex-row gap-2 items-center w-full backdrop-blur-xl transition-all hover:shadow-2xl hover:shadow-slate-200/30">
                    <div className="relative flex-1 w-full group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors pointer-events-none">
                            <Search className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search Name or Phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-white hover:bg-slate-50 focus:bg-slate-50 border border-slate-200 hover:border-purple-100 focus:border-purple-100 rounded-[1.5rem] text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-purple-500/10 placeholder:text-slate-400 transition-all shadow-sm hover:shadow-md duration-300"
                        />
                    </div>
                    <div className="w-full md:w-auto">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full px-5 py-3.5 bg-white hover:bg-slate-50 focus:bg-slate-50 border border-slate-200 hover:border-purple-100 focus:border-purple-100 rounded-[1.5rem] text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-purple-500/10 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300"
                        />
                    </div>
                    <div className="w-full md:w-64 relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors pointer-events-none z-10">
                            <Stethoscope className="w-5 h-5" />
                        </div>
                        <select
                            value={selectedDoctorId}
                            onChange={(e) => setSelectedDoctorId(e.target.value)}
                            className="w-full pl-12 pr-10 py-3.5 bg-white hover:bg-slate-50 focus:bg-slate-50 border border-slate-200 hover:border-purple-100 focus:border-purple-100 rounded-[1.5rem] text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-purple-500/10 cursor-pointer appearance-none shadow-sm hover:shadow-md transition-all duration-300"
                        >
                            <option value="">All Doctors</option>
                            {doctors.map(doc => (
                                <option key={doc.doctor_id} value={doc.doctor_id}>Dr. {doc.first_name} {doc.last_name}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronLeft className="w-4 h-4 -rotate-90" />
                        </div>
                    </div>

                    <button
                        onClick={() => setShowModal(true)}
                        className="w-full md:w-auto pl-4 pr-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-bold shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 whitespace-nowrap group"
                    >
                        <div className="bg-white/20 p-1 rounded-full group-hover:bg-white/30 transition-colors">
                            <Plus className="w-4 h-4" />
                        </div>
                        <span>New Appointment</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}


            {/* Tabs */}
            <div className="max-w-[1600px] mx-auto px-6">
                <div className="flex flex-wrap items-center gap-2 mb-8 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-fit">
                    {['All', 'Scheduled', 'Completed', 'Cancelled'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                }`}
                        >
                            {tab} <span className="opacity-60 ml-1 text-xs">
                                ({tab === 'All' ? filteredByContext.length : filteredByContext.filter((a: any) =>
                                    tab === 'Scheduled' ? ['Scheduled', 'Confirmed', 'In OPD'].includes(a.appointment_status) :
                                        a.appointment_status === tab
                                ).length})
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Wide Card List View - 2 Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1600px] mx-auto px-6">
                {filteredByContext
                    .filter((a: any) => {
                        // Status Filter (Tab)
                        if (activeTab === 'All') return true;
                        if (activeTab === 'Scheduled') return ['Scheduled', 'Confirmed', 'In OPD'].includes(a.appointment_status);
                        return a.appointment_status === activeTab;
                    })
                    .map((apt: any) => {
                        const badgeProps = getStatusBadge(apt);
                        const dropdownStyle = getDropdownStyle(apt);

                        // Dropdown is for actions, not state display
                        const dropdownValue = '';

                        return (
                            <div key={apt.appointment_id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all overflow-hidden group">
                                <div className="p-3">
                                    {/* Header: Patient Info & Status */}
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${['Scheduled', 'Confirmed', 'In OPD'].includes(apt.appointment_status) || (apt.appointment_status === 'Cancelled' && apt.cancellation_reason === 'No Answer')
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
                                                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide shrink-0 shadow-sm ${badgeProps.style}`}>
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
                                                <div className="flex items-center gap-2 mt-1.5 ml-0.5">
                                                    {apt.patient_id && (
                                                        <div className="text-xs text-slate-500 font-mono flex items-center gap-1 shrink-0">
                                                            <span className="font-medium opacity-80">PID:</span>
                                                            <span className="font-bold text-slate-700">#{apt.mrn_number || apt.patient_id}</span>
                                                        </div>
                                                    )}
                                                    {apt.patient_id && <span className="text-slate-300">|</span>}
                                                    <p className="text-slate-500 text-[10px] font-medium whitespace-nowrap overflow-hidden text-overflow-ellipsis">
                                                        {apt.reason_for_visit || 'General Checkup'}
                                                    </p>
                                                </div>
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
                                            {apt.appointment_status !== 'In OPD' && apt.appointment_status !== 'Completed' && (
                                                <button
                                                    onClick={() => openRescheduleModal(apt)}
                                                    className="px-3 py-1.5 text-xs font-bold text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                >
                                                    Reschedule
                                                </button>
                                            )}
                                            {['Scheduled', 'Confirmed', 'No-show'].includes(apt.appointment_status) && (
                                                <button
                                                    onClick={() => openCancelModal(apt)}
                                                    className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                            {['Scheduled', 'Confirmed'].includes(apt.appointment_status) && (
                                                <button
                                                    onClick={() => convertToOPD(apt)}
                                                    className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2"
                                                >
                                                    Convert to OPD
                                                    <ArrowRight className="w-3 h-3" />
                                                </button>
                                            )}
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


            {/* OPD Conversion Modal */}
            <ConvertToOpdModal
                isOpen={showOpdModal}
                onClose={() => { setShowOpdModal(false); setSelectedAppointment(null); }}
                appointment={selectedAppointment}
                doctors={doctors}
                branchDetails={branchDetails}
                todayOpdEntries={todayOpdEntries}
                allAppointments={appointments}
                onSuccess={() => {
                    fetchAppointments();
                    setShowOpdModal(false);
                    setSelectedAppointment(null);
                    // Optionally refresh stats or show success message if not handled in modal
                }}
            />

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
