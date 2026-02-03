'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SearchableSelect from '../../../components/ui/SearchableSelect';
import { Plus, Search, FileText, X, Save, User, Printer, Clock, AlertCircle, Calendar, Phone, ArrowRight, Bell, Sparkles, Activity, Users, ChevronLeft, Check } from 'lucide-react';

export default function ReceptionistDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [dashboardStats, setDashboardStats] = useState({
        queueCount: 0,
        todayVisits: 0,
        completedVisits: 0,
        pendingAmount: 0,
        pendingCount: 0,
        collectedAmount: 0,
        collectedCount: 0
    });

    // Follow-up Queue state
    const [followUpData, setFollowUpData] = useState<any>({
        overdue: [],
        due_today: [],
        upcoming: [],
        summary: { overdue_count: 0, due_today_count: 0, upcoming_count: 0, total: 0 }
    });
    const [showFollowUpPanel, setShowFollowUpPanel] = useState(true); // Default open on dashboard? Or user toggle. opd was false. user asked for scrollable.

    // --- OPD Modal State & Logic (Copied from OPD Page) ---
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    // - [ ] **Inline Integration (Current Approach)**
    //     - [/] Copy Logic from `opd/page.tsx` to `dashboard/page.tsx`
    //     - [/] Inject Modal JSX into Dashboard
    //     - [x] Verify Functionality
    const [showBillModal, setShowBillModal] = useState(false);
    const [billData, setBillData] = useState<any>(null);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [branchDetails, setBranchDetails] = useState<any>(null);

    // Search & Patient Selection
    const [modalSearchQuery, setModalSearchQuery] = useState('');
    const [modalSearchResults, setModalSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [hasAppointment, setHasAppointment] = useState(false);
    const [appointmentDoctorName, setAppointmentDoctorName] = useState('');
    const [editingOpdId, setEditingOpdId] = useState<number | null>(null);

    // Progressive Form state
    type FormStep = 'search' | 'newPatient' | 'visitDetails' | 'payment';
    const [currentStep, setCurrentStep] = useState<FormStep>('search');
    const [completedSteps, setCompletedSteps] = useState<FormStep[]>([]);

    // Chief Complaint Auto-Suggest
    const [showComplaintSuggestions, setShowComplaintSuggestions] = useState(false);
    const commonComplaints = [
        'Fever', 'Cold & Cough', 'Body Pain', 'Headache', 'Stomach Pain',
        'Vomiting', 'Loose Motions', 'Chest Pain', 'Breathing Difficulty',
        'Back Pain', 'Joint Pain', 'Skin Rash', 'Weakness', 'Dizziness',
        'Throat Pain', 'Ear Pain', 'Eye Problem', 'Urinary Problem',
        'Blood Pressure Check', 'Diabetes Follow-up', 'General Checkup'
    ];

    const [opdForm, setOpdForm] = useState({
        first_name: '', last_name: '', age: '', gender: '', blood_group: '',
        contact_number: '', doctor_id: '', visit_type: 'Walk-in',
        visit_date: new Date().toISOString().split('T')[0],
        visit_time: new Date().toTimeString().slice(0, 5),
        chief_complaint: '', symptoms: '',
        vital_signs: {
            bp_systolic: '', bp_diastolic: '', pulse: '', temperature: '',
            weight: '', height: '', spo2: '', grbs: ''
        },
        consultation_fee: '', payment_status: 'Pending', payment_method: 'Cash',
        is_mlc: false, mlc_remarks: '', attender_name: '', attender_contact_number: '',
        adhaar_number: '', referral_hospital: '', referral_doctor_name: ''
    });

    const resetForm = () => {
        setOpdForm({
            first_name: '', last_name: '', age: '', gender: '', blood_group: '',
            contact_number: '', doctor_id: '', visit_type: 'Walk-in',
            visit_date: new Date().toISOString().split('T')[0],
            visit_time: new Date().toTimeString().slice(0, 5),
            chief_complaint: '', symptoms: '',
            vital_signs: {
                bp_systolic: '', bp_diastolic: '', pulse: '', temperature: '',
                weight: '', height: '', spo2: '', grbs: ''
            },
            consultation_fee: '', payment_status: 'Pending', payment_method: 'Cash',
            is_mlc: false, mlc_remarks: '', attender_name: '', attender_contact_number: '',
            adhaar_number: '', referral_hospital: '', referral_doctor_name: ''
        });
        setSelectedPatient(null);
        setModalSearchQuery('');
        setModalSearchResults([]);
        setHasAppointment(false);
        setAppointmentDoctorName('');
        setEditingOpdId(null);
        setCurrentStep('search');
        setCompletedSteps([]);
    };

    // --- Appointment Modal State & Logic ---
    const [showApptModal, setShowApptModal] = useState(false);
    // const [departments, setDepartments] = useState<any[]>([]); // Already added? No, failed.
    const [departments, setDepartments] = useState<any[]>([]);
    const [doctorSchedules, setDoctorSchedules] = useState<any[]>([]);
    const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
    const [timeSlotCategory, setTimeSlotCategory] = useState<'Morning' | 'Afternoon' | 'Evening'>('Morning');

    const [appointmentStep, setAppointmentStep] = useState(1);
    const [bookingDepartment, setBookingDepartment] = useState('');
    const [suggestedDoctorId, setSuggestedDoctorId] = useState<string | null>(null);
    const [doctorSearchQuery, setDoctorSearchQuery] = useState('');

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

    // --- Effects for Modal ---
    useEffect(() => {
        if (user?.branch_id) {
            fetchBranchDetails();
            fetchDoctors();
        }
    }, [user?.branch_id]);

    useEffect(() => {
        if (!modalSearchQuery || modalSearchQuery.length < 3) {
            setModalSearchResults([]);
            return;
        }
        const debounceTimer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:5000/api/patients/search', {
                    params: { q: modalSearchQuery },
                    headers: { Authorization: `Bearer ${token}` }
                });
                setModalSearchResults(response.data.data.patients || []);
            } catch (error) {
                console.error('Modal search error:', error);
            } finally {
                setIsSearching(false);
            }
        }, 300);
        return () => clearTimeout(debounceTimer);
    }, [modalSearchQuery]);

    // --- Helper Functions ---
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

    const fetchDoctors = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/doctors/my-branch', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDoctors(response.data.data.doctors || []);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const selectPatient = async (patient: any) => {
        setSelectedPatient(patient);
        let doctorId = '';
        let consultationFee = '';
        let doctorName = '';
        let fromAppointment = false;
        let suggestedVisitType = 'Walk-in';

        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/appointments', {
                params: { patient_id: patient.patient_id },
                headers: { Authorization: `Bearer ${token}` }
            });
            const appointments = response.data.data.appointments || [];
            const today = new Date().toISOString().split('T')[0];
            const todayAppointment = appointments.find((apt: any) => {
                const aptDate = new Date(apt.appointment_date).toISOString().split('T')[0];
                return aptDate === today && ['Scheduled', 'Confirmed'].includes(apt.appointment_status);
            });
            const upcomingAppointment = appointments.find((apt: any) => {
                const aptDate = new Date(apt.appointment_date).toISOString().split('T')[0];
                return aptDate >= today && ['Scheduled', 'Confirmed'].includes(apt.appointment_status);
            });
            const selectedAppointment = todayAppointment || upcomingAppointment;

            if (selectedAppointment) {
                fromAppointment = true;
                doctorId = selectedAppointment.doctor_id?.toString() || '';
                suggestedVisitType = 'Appointment';
                doctorName = `Dr. ${selectedAppointment.doctor_first_name} ${selectedAppointment.doctor_last_name}`;
                const selectedDoc = doctors.find((d: any) => d.doctor_id === selectedAppointment.doctor_id);
                if (selectedDoc) {
                    consultationFee = selectedDoc.consultation_fee?.toString() || '';
                }
            }
        } catch (error) {
            console.error('Error fetching appointments:', error);
        }

        if (!fromAppointment && patient.is_follow_up_candidate) {
            suggestedVisitType = 'Follow-up';
            if (patient.last_doctor_id) {
                doctorId = patient.last_doctor_id.toString();
                const doc = doctors.find((d: any) => d.doctor_id === patient.last_doctor_id);
                if (doc) {
                    consultationFee = doc.follow_up_fee?.toString() || doc.consultation_fee?.toString() || '';
                    doctorName = `Dr. ${doc.first_name} ${doc.last_name}`;
                }
            }
        } else if (!fromAppointment && patient.days_since_last_visit !== null && patient.days_since_last_visit <= 30) {
            suggestedVisitType = 'Follow-up';
            if (patient.last_doctor_id) {
                doctorId = patient.last_doctor_id.toString();
                const doc = doctors.find((d: any) => d.doctor_id === patient.last_doctor_id);
                if (doc) {
                    consultationFee = doc.follow_up_fee?.toString() || doc.consultation_fee?.toString() || '';
                    doctorName = `Dr. ${doc.first_name} ${doc.last_name}`;
                }
            }
        }

        setHasAppointment(fromAppointment);
        setAppointmentDoctorName(doctorName);
        setOpdForm({
            ...opdForm,
            first_name: patient.first_name,
            last_name: patient.last_name,
            age: patient.age?.toString() || '',
            gender: patient.gender || '',
            blood_group: patient.blood_group || '',
            contact_number: patient.contact_number || '',
            doctor_id: doctorId,
            visit_type: suggestedVisitType,
            consultation_fee: consultationFee,
        });
        setModalSearchQuery('');
        setModalSearchResults([]);
        setCurrentStep('visitDetails');
        setCompletedSteps(['search']);
        setShowModal(true);
    };

    const handleQuickFollowUp = async (patient: any) => {
        setSelectedPatient(patient);
        const lastDoctorId = patient.last_doctor_id?.toString() || '';
        let consultationFee = '';
        if (lastDoctorId) {
            const doc = doctors.find((d: any) => d.doctor_id === patient.last_doctor_id);
            if (doc) {
                consultationFee = doc.follow_up_fee?.toString() || doc.consultation_fee?.toString() || '';
            }
        }
        setOpdForm({
            ...opdForm,
            first_name: patient.first_name,
            last_name: patient.last_name || '',
            age: patient.age?.toString() || '',
            gender: patient.gender || '',
            blood_group: patient.blood_group || '',
            contact_number: patient.contact_number || '',
            doctor_id: lastDoctorId,
            visit_type: 'Follow-up',
            consultation_fee: consultationFee,
        });
        setModalSearchQuery('');
        setModalSearchResults([]);
        setHasAppointment(!!lastDoctorId);
        if (patient.last_doctor_first_name) {
            setAppointmentDoctorName(`Dr. ${patient.last_doctor_first_name} ${patient.last_doctor_last_name || ''}`);
        }
        setShowModal(true);
    };

    const saveEntry = async (formData: any = opdForm) => {
        try {
            const token = localStorage.getItem('token');
            let totalFee = parseFloat(formData.consultation_fee || '0');
            if (formData.is_mlc && branchDetails?.mlc_fee) {
                totalFee += parseFloat(branchDetails.mlc_fee);
            }
            const payload = {
                ...formData,
                patient_id: selectedPatient?.patient_id,
                vital_signs: JSON.stringify(formData.vital_signs),
                consultation_fee: totalFee.toString()
            };
            let response;
            if (editingOpdId) {
                response = await axios.patch(`http://localhost:5000/api/opd/${editingOpdId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                return editingOpdId;
            } else {
                response = await axios.post(`http://localhost:5000/api/opd`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data?.data?.opdEntry?.opd_id) {
                    return response.data.data.opdEntry.opd_id;
                }
                return null;
            }
        } catch (error: any) {
            console.error('Error saving OPD entry:', error);
            alert(error.response?.data?.message || 'Failed to save OPD entry');
            throw error;
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/opd/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const stats = response.data.data.stats;
            setDashboardStats({
                queueCount: stats.pendingOpd || 0,
                todayVisits: stats.todayOpd || 0,
                completedVisits: 0,
                pendingAmount: stats.pendingAmount || 0,
                pendingCount: stats.pendingCount || 0,
                collectedAmount: stats.collectedAmount || 0,
                collectedCount: stats.collectedCount || 0
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
    };

    const fetchFollowUps = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/follow-ups/due', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFollowUpData(response.data.data || {
                overdue: [],
                due_today: [],
                upcoming: [],
                summary: { overdue_count: 0, due_today_count: 0, upcoming_count: 0, total: 0 }
            });
        } catch (error) {
            console.error('Error fetching follow-ups:', error);
        }
    };

    // --- Appointment Helper Functions ---
    const fetchDepartments = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/departments/hospital', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDepartments(response.data.data.departments || []);
        } catch (error) {
            console.error('Error fetching departments:', error);
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

            while (current < end) {
                const timeStr = current.toTimeString().slice(0, 5);
                slots.push(timeStr);
                current = new Date(current.getTime() + consultationTime * 60000);
            }
        });

        const uniqueSlots = Array.from(new Set(slots)).sort();
        return uniqueSlots;
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

    const handleCreateAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/appointments', appointmentForm, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Appointment created successfully!');
            setShowApptModal(false);
            resetAppointmentForm();
            // Refresh dashboard?
            fetchStats();
        } catch (error: any) {
            console.error('Error creating appointment:', error);
            alert(error.response?.data?.message || 'Failed to create appointment');
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await saveEntry();
            setShowModal(false);
            resetForm();
            // Refresh dashboard stats
            await fetchStats();
            await fetchFollowUps();
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const handlePrintBill = async (opdId: number) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/opd/${opdId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBillData(response.data.data.opdEntry);
            setShowBillModal(true);
        } catch (error) {
            console.error('Error fetching bill details:', error);
            alert('Failed to generate bill');
        }
    };

    const handleSaveAndPrint = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!opdForm.first_name || !opdForm.last_name || !opdForm.age || !opdForm.gender) {
            alert('Please fill in all mandatory patient fields.');
            return;
        }
        if (!opdForm.doctor_id) {
            alert('Please select a doctor.');
            return;
        }
        setLoading(true);
        try {
            const savedId = await saveEntry();
            if (savedId) {
                await handlePrintBill(savedId);
                setShowModal(false);
                resetForm();
                await fetchStats();
                await fetchFollowUps();
            }
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        fetchFollowUps();
        fetchDepartments();
        fetchDoctorSchedules();
    }, []);

    // Effect to update time slots when appointment doctor/date changes
    useEffect(() => {
        if (appointmentForm.doctor_id && appointmentForm.appointment_date) {
            const slots = generateTimeSlotsFromSchedule(appointmentForm.doctor_id, appointmentForm.appointment_date);
            setAvailableTimeSlots(slots || []); // Ensure we update the state here!

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

    const doctorOptions = doctors.map((doc: any) => ({
        value: doc.doctor_id,
        label: `Dr. ${doc.first_name} ${doc.last_name} (${doc.specialization})`
    }));

    return (
        <div className="flex flex-col h-[calc(100vh-156px)] w-full space-y-4 overflow-hidden pb-0">
            {/* Header Content */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 font-heading">Welcome back, {user?.first_name || user?.username}</h2>
                    <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-600 bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100 max-w-fit animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
                        <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                        <span>Live Update: <span className="text-indigo-700 font-bold">{dashboardStats.todayVisits} Registrations</span> processed today.</span>
                    </div>
                </div>
                <div className="text-sm font-medium text-slate-400 bg-white/50 px-4 py-2 rounded-full border border-slate-200/50 backdrop-blur-sm">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Reference Layout: Top Stats Row + Bottom Split Content */}
            <div className="flex flex-col flex-1 min-h-0 space-y-4 w-full">

                {/* Top Row: Stats Cards (4 Columns) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                    {/* Today's Queue - Patients waiting right now */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-3xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
                        onClick={() => { }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/30">
                                <Clock className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 px-2 py-1 rounded-full">RIGHT NOW</span>
                        </div>
                        <p className="text-4xl font-bold text-amber-700">{dashboardStats.queueCount}</p>
                        <p className="text-sm font-medium text-amber-600 mt-1">Patients in Queue</p>
                        {dashboardStats.queueCount > 0 && (
                            <p className="text-xs text-amber-500 mt-2 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                {dashboardStats.queueCount} waiting for doctor
                            </p>
                        )}
                    </div>

                    {/* Today's Appointments - Scheduled for today */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/30">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100 px-2 py-1 rounded-full">TODAY</span>
                        </div>
                        <p className="text-4xl font-bold text-blue-700">{dashboardStats.todayVisits}</p>
                        <p className="text-sm font-medium text-blue-600 mt-1">Today's Visits</p>
                        <p className="text-xs text-blue-500 mt-2">
                            {/* We can rely on 'collectedCount' as proxy for 'completed' if paid=completed? Or just hide completed count if not available */}
                            {/* Actually, user didn't ask for completed count specifically to be fixed, just live values. */}
                            Live Updates
                        </p>
                    </div>

                    {/* Pending Payments - Action needed */}
                    <div className="bg-gradient-to-br from-red-50 to-rose-50 p-6 rounded-3xl border border-red-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg shadow-red-500/30">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-100 px-2 py-1 rounded-full">ACTION</span>
                        </div>
                        <p className="text-4xl font-bold text-red-700">{dashboardStats.pendingCount}</p>
                        <p className="text-sm font-medium text-red-600 mt-1">Pending Payments</p>
                        <p className="text-xs text-red-500 mt-2">
                            ₹{dashboardStats.pendingAmount.toLocaleString()} to collect
                        </p>
                    </div>

                    {/* Today's Revenue - Collected today */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-3xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/30">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">REVENUE</span>
                        </div>
                        <p className="text-4xl font-bold text-emerald-700">
                            ₹{dashboardStats.collectedAmount.toLocaleString()}
                        </p>
                        <p className="text-sm font-medium text-emerald-600 mt-1">Collected Today</p>
                        <p className="text-xs text-emerald-500 mt-2">
                            {dashboardStats.collectedCount} payments received
                        </p>
                    </div>
                </div>

                {/* Bottom Section: Main Content (Left) + Sidebar (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0 w-full">

                    {/* Left Column: Patient Queue (Placeholder for layout structure) */}
                    <div className="lg:col-span-2 h-full min-h-0">
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 h-full flex flex-col overflow-y-auto">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                                    <Users className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">Patient Queue</h3>
                                <div className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">{dashboardStats.queueCount} waiting</div>
                            </div>

                            {/* Empty State */}
                            <div className="h-64 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <Users className="w-8 h-8 text-slate-300" />
                                </div>
                                <h4 className="text-slate-900 font-medium">No Patients Waiting</h4>
                                <p className="text-slate-500 text-sm max-w-xs mt-1">Your queue is clear! New patients will appear here when registered.</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Quick Actions + Follow-ups */}
                    <div className="lg:col-span-1 space-y-4 h-full min-h-0 flex flex-col overflow-y-auto pr-1">

                        {/* Quick Actions Widget */}
                        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">QUICK ACTIONS</h3>
                            <div className="space-y-4">
                                {/* New OPD Entry (Triggers Modal) */}
                                <div
                                    onClick={() => { resetForm(); setShowModal(true); }}
                                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 group transition-colors border border-transparent hover:border-slate-100 cursor-pointer"
                                >
                                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-100 group-hover:scale-105 transition-all">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-base font-bold text-slate-800 group-hover:text-blue-700">New OPD Entry</h4>
                                        <p className="text-sm text-slate-500">Register patient</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500" />
                                </div>

                                {/* Appointments */}
                                <div onClick={() => { resetAppointmentForm(); setShowApptModal(true); }} className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 group transition-colors border border-transparent hover:border-slate-100 cursor-pointer">
                                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 group-hover:bg-purple-100 group-hover:scale-105 transition-all">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-base font-bold text-slate-800 group-hover:text-purple-700">Book Appointments</h4>
                                        <p className="text-sm text-slate-500">Schedule doctors</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-purple-500" />
                                </div>
                            </div>
                        </div>

                        {/* Follow-up Queue Widget (Added below Quick Actions) */}
                        <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-3xl border border-purple-100 overflow-hidden shadow-sm flex-1 flex flex-col min-h-0">
                            {/* Header */}
                            <button
                                onClick={() => setShowFollowUpPanel(!showFollowUpPanel)}
                                className="w-full p-4 flex items-center justify-between hover:bg-purple-100/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                                        <Bell className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-purple-800">Follow-ups</h3>
                                        <p className="text-xs text-purple-600">
                                            {followUpData.summary.overdue_count > 0 && (
                                                <span className="text-red-600 font-semibold">{followUpData.summary.overdue_count} overdue</span>
                                            )}
                                            {followUpData.summary.overdue_count > 0 && followUpData.summary.due_today_count > 0 && ' • '}
                                            {followUpData.summary.due_today_count > 0 && (
                                                <span className="text-green-600 font-semibold">{followUpData.summary.due_today_count} due today</span>
                                            )}
                                            {followUpData.summary.overdue_count === 0 && followUpData.summary.due_today_count === 0 && 'No pending'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {followUpData.summary.overdue_count > 0 && (
                                        <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                                            {followUpData.summary.overdue_count}
                                        </span>
                                    )}
                                    <ArrowRight className={`w-5 h-5 text-purple-500 transition-transform ${showFollowUpPanel ? 'rotate-90' : ''}`} />
                                </div>
                            </button>

                            {/* Expandable Panel */}
                            {showFollowUpPanel && (
                                <div className="border-t border-purple-100 bg-white/80 divide-y divide-purple-50 flex-1 overflow-y-auto">
                                    {/* Overdue Section */}
                                    {followUpData.overdue.length > 0 && (
                                        <div className="p-3">
                                            <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                                Overdue ({followUpData.overdue.length})
                                            </p>
                                            <div className="space-y-2">
                                                {followUpData.overdue.map((fu: any) => (
                                                    <div key={fu.outcome_id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-red-200 text-red-700 flex items-center justify-center font-bold text-xs ring-2 ring-white">
                                                                {fu.patient_first_name?.[0]}{fu.patient_last_name?.[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-800 text-xs">{fu.patient_first_name} {fu.patient_last_name}</p>
                                                                <p className="text-[10px] text-red-600 font-medium">
                                                                    {fu.days_overdue} days ago
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleQuickFollowUp(fu)}
                                                            className="px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded-lg hover:bg-red-600 transition-colors"
                                                        >
                                                            Book
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Due Today Section */}
                                    {followUpData.due_today.length > 0 && (
                                        <div className="p-3">
                                            <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                Due Today ({followUpData.due_today.length})
                                            </p>
                                            <div className="space-y-2">
                                                {followUpData.due_today.map((fu: any) => (
                                                    <div key={fu.outcome_id} className="flex items-center justify-between p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-green-200 text-green-700 flex items-center justify-center font-bold text-xs ring-2 ring-white">
                                                                {fu.patient_first_name?.[0]}{fu.patient_last_name?.[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-800 text-xs">{fu.patient_first_name} {fu.patient_last_name}</p>
                                                                <p className="text-[10px] text-green-600 font-medium">
                                                                    Dr. {fu.doctor_first_name}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleQuickFollowUp(fu)}
                                                            className="px-2 py-1 bg-green-500 text-white text-[10px] font-bold rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                            Book
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Empty State */}
                                    {followUpData.overdue.length === 0 && followUpData.due_today.length === 0 && (
                                        <div className="p-6 text-center text-purple-300">
                                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-xs font-medium">No follow-ups due.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
            {/* Glass Modal for Entry */}
            {
                showModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
                        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
                            {/* Modal Header */}
                            <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur z-10 rounded-t-3xl">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                        {editingOpdId ? <FileText className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
                                        {editingOpdId ? 'Edit OPD Entry' : 'New OPD Entry'}
                                    </h2>
                                    {selectedPatient && (
                                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mt-1">
                                            Patient: {selectedPatient.first_name} {selectedPatient.last_name} • MRN: {selectedPatient.mrn_number}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    {opdForm.payment_status === 'Paid' && (
                                        <button
                                            type="button"
                                            onClick={editingOpdId ? () => handlePrintBill(editingOpdId) : handleSaveAndPrint}
                                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition text-sm font-bold"
                                        >
                                            <Printer className="w-4 h-4" />
                                            {editingOpdId ? 'Print Bill' : 'Save & Print'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => { setShowModal(false); resetForm(); }}
                                        className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Progress Indicator */}
                            {!editingOpdId && (
                                <div className="px-8 py-4 bg-slate-50/80 border-b border-slate-100">
                                    {(() => {
                                        const step1Complete = selectedPatient
                                            ? true
                                            : (opdForm.first_name && opdForm.age && opdForm.gender &&
                                                (opdForm.is_mlc || opdForm.contact_number?.length === 10));

                                        const step2FieldsComplete = opdForm.visit_type && opdForm.doctor_id;
                                        const step2Complete = step1Complete && step2FieldsComplete;

                                        const step3FieldsComplete = opdForm.consultation_fee;
                                        const step3Complete = step2Complete && step3FieldsComplete;

                                        return (
                                            <div className="flex items-center justify-between max-w-2xl mx-auto">
                                                <div className="flex items-center">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step1Complete ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{step1Complete ? '✓' : '1'}</div>
                                                    <span className={`ml-2 text-sm font-medium ${step1Complete ? 'text-emerald-600' : 'text-slate-600'}`}>Patient</span>
                                                </div>
                                                <div className={`flex-1 h-1 mx-4 rounded ${step1Complete ? 'bg-emerald-300' : 'bg-slate-200'}`}></div>
                                                <div className="flex items-center">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step2Complete ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{step2Complete ? '✓' : '2'}</div>
                                                    <span className={`ml-2 text-sm font-medium ${step2Complete ? 'text-emerald-600' : 'text-slate-600'}`}>Visit Details</span>
                                                </div>
                                                <div className={`flex-1 h-1 mx-4 rounded ${step2Complete ? 'bg-emerald-300' : 'bg-slate-200'}`}></div>
                                                <div className="flex items-center">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step3Complete ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{step3Complete ? '✓' : '3'}</div>
                                                    <span className={`ml-2 text-sm font-medium ${step3Complete ? 'text-emerald-600' : 'text-slate-600'}`}>Payment</span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                {/* Patient Info Section */}
                                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <User className="w-4 h-4" /> Patient Details
                                    </h3>
                                    {!selectedPatient && !editingOpdId && (
                                        <div className="mb-6 relative">
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Search Existing Patient</label>
                                            <div className="relative">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                                <input
                                                    type="text"
                                                    value={modalSearchQuery}
                                                    onChange={(e) => setModalSearchQuery(e.target.value)}
                                                    placeholder="Enter phone number or patient name..."
                                                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-lg"
                                                    autoFocus
                                                />
                                                {isSearching && (
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Results Logic */}
                                            {modalSearchResults.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 max-h-72 overflow-y-auto">
                                                    {modalSearchResults.map((patient: any) => (
                                                        <div key={patient.patient_id} className="p-4 hover:bg-blue-50 border-b border-slate-100 last:border-0">
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                                                        {patient.first_name?.[0]}{patient.last_name?.[0] || ''}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-slate-800">{patient.first_name} {patient.last_name}</p>
                                                                        <p className="text-sm text-slate-500">{patient.gender}, {patient.age} yrs • {patient.contact_number}</p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => selectPatient(patient)}
                                                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                                                                >
                                                                    Select
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Selected Patient or New Patient Form */}
                                    {selectedPatient && !editingOpdId ? (
                                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                                                    {selectedPatient.first_name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-lg">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                                                    <p className="text-sm text-slate-500">{selectedPatient.gender}, {selectedPatient.age} yrs • 📱 {selectedPatient.contact_number}</p>
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => { setSelectedPatient(null); resetForm(); }} className="px-4 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-white/50 font-medium rounded-lg flex items-center gap-1 transition">
                                                <X className="w-4 h-4" /> Change
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                            <div className="md:col-span-4">
                                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Name <span className="text-red-500">*</span></label>
                                                <input type="text" required value={opdForm.first_name + (opdForm.last_name ? ' ' + opdForm.last_name : '')} onChange={(e) => {
                                                    const parts = e.target.value.split(' ');
                                                    setOpdForm({ ...opdForm, first_name: parts[0], last_name: parts.slice(1).join(' ') });
                                                }} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl" placeholder="e.g. John Doe" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Age <span className="text-red-500">*</span></label>
                                                <input type="number" required value={opdForm.age} onChange={(e) => setOpdForm({ ...opdForm, age: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Gender <span className="text-red-500">*</span></label>
                                                <select required value={opdForm.gender} onChange={(e) => setOpdForm({ ...opdForm, gender: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl">
                                                    <option value="">Select</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
                                                <input type="tel" value={opdForm.contact_number} onChange={(e) => setOpdForm({ ...opdForm, contact_number: e.target.value.replace(/\D/g, "").slice(0, 10) })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Visit Details Section */}
                                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Visit Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="md:col-span-4 bg-red-50/50 p-4 rounded-xl border border-red-100 flex items-center gap-3 mb-2">
                                            <input id="mlc-toggle" type="checkbox" checked={opdForm.is_mlc} onChange={(e) => setOpdForm({ ...opdForm, is_mlc: e.target.checked, visit_type: e.target.checked ? 'Emergency' : opdForm.visit_type })} className="w-5 h-5 text-red-600 rounded" />
                                            <label htmlFor="mlc-toggle" className="font-bold text-red-800 cursor-pointer">Mark as Medical Legal Case (MLC)</label>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Visit Type <span className="text-red-500">*</span></label>
                                            <select required value={opdForm.visit_type} onChange={(e) => setOpdForm({ ...opdForm, visit_type: e.target.value })} disabled={opdForm.is_mlc} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl">
                                                <option value="Walk-in">Walk-in</option>
                                                <option value="Follow-up">Follow-up</option>
                                                <option value="Emergency">Emergency</option>
                                                <option value="Referral">Referral</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Date</label>
                                            <input type="date" value={opdForm.visit_date} onChange={(e) => setOpdForm({ ...opdForm, visit_date: e.target.value })} disabled={opdForm.is_mlc} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Time</label>
                                            <input type="time" value={opdForm.visit_time} onChange={(e) => setOpdForm({ ...opdForm, visit_time: e.target.value })} disabled={opdForm.is_mlc} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assign Doctor <span className="text-red-500">*</span></label>
                                            <select value={opdForm.doctor_id} onChange={(e) => {
                                                const val = e.target.value;
                                                const selectedDoc = doctors.find((d: any) => d.doctor_id === parseInt(val));
                                                setOpdForm({ ...opdForm, doctor_id: val, consultation_fee: selectedDoc?.consultation_fee || '' });
                                            }} required className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl">
                                                <option value="">Select Doctor</option>
                                                {doctors.map((doc: any) => (
                                                    <option key={doc.doctor_id} value={doc.doctor_id}>Dr. {doc.first_name} {doc.last_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Clinical Notes */}
                                {!opdForm.is_mlc && (
                                    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Clinical Notes</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="relative">
                                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Chief Complaint</label>
                                                <textarea value={opdForm.chief_complaint} onChange={(e) => setOpdForm({ ...opdForm, chief_complaint: e.target.value })} onFocus={() => setShowComplaintSuggestions(true)} onBlur={() => setTimeout(() => setShowComplaintSuggestions(false), 200)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl resize-none" rows={2} placeholder="Type or click suggestions below..." />
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {commonComplaints.filter(c => !opdForm.chief_complaint || c.toLowerCase().includes(opdForm.chief_complaint.toLowerCase()) || showComplaintSuggestions).slice(0, showComplaintSuggestions ? 21 : 6).map((complaint) => (
                                                        <button key={complaint} type="button" onClick={() => {
                                                            const current = opdForm.chief_complaint || '';
                                                            const isSelected = current.split(', ').some(c => c.trim() === complaint);
                                                            let newValue = isSelected ? current.split(', ').filter(c => c.trim() !== complaint).join(', ') : (current ? current + ', ' + complaint : complaint);
                                                            setOpdForm({ ...opdForm, chief_complaint: newValue });
                                                        }} className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${opdForm.chief_complaint?.includes(complaint) ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-slate-600 border-slate-200'}`}>{complaint}</button>
                                                    ))}
                                                    {!showComplaintSuggestions && commonComplaints.length > 6 && (
                                                        <button type="button" onClick={() => setShowComplaintSuggestions(true)} className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:underline">+{commonComplaints.length - 6} more...</button>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Symptoms</label>
                                                <textarea value={opdForm.symptoms} onChange={(e) => setOpdForm({ ...opdForm, symptoms: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl resize-none" rows={3} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Vital Signs */}
                                <div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100">
                                    <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-4">Vital Signs</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                                        {Object.keys(opdForm.vital_signs).map((key) => {
                                            const labels: any = { bp_systolic: 'BP Sys', bp_diastolic: 'BP Dia', pulse: 'Pulse', temperature: 'Temp', weight: 'Weight', height: 'Height', spo2: 'SpO2', grbs: 'GRBS' };
                                            return (
                                                <div key={key}>
                                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">{labels[key]}</label>
                                                    <input type="text" value={(opdForm.vital_signs as any)[key]} onChange={(e) => setOpdForm({ ...opdForm, vital_signs: { ...opdForm.vital_signs, [key]: e.target.value } })} className="w-full px-3 py-2 bg-white border border-purple-100 rounded-lg text-sm" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Payment */}
                                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 flex justify-between items-end">
                                    <div className="flex gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">Consultation Fee</label>
                                            <input type="number" value={opdForm.consultation_fee} onChange={(e) => setOpdForm({ ...opdForm, consultation_fee: e.target.value })} className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">Payment Status</label>
                                            <select value={opdForm.payment_status} onChange={(e) => setOpdForm({ ...opdForm, payment_status: e.target.value })} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"><option value="Pending">Pending</option><option value="Paid">Paid</option></select>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Fee</p>
                                        <p className="text-3xl font-bold text-slate-800">₹{(() => { let fee = parseFloat(opdForm.consultation_fee || '0'); if (opdForm.is_mlc && branchDetails?.mlc_fee) fee += parseFloat(branchDetails.mlc_fee); return fee; })()}</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-4 border-t border-slate-100 flex justify-end gap-4 sticky bottom-[-20px] bg-white/95 backdrop-blur pb-2 z-[9999]">
                                    <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold">Cancel</button>
                                    <button type="submit" disabled={loading} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg font-bold">{loading ? 'Saving...' : 'Register Visit'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Bill Modal */}
            {
                showBillModal && billData && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 print:p-0 print:bg-white print:fixed print:inset-0 print:z-[100] print-modal">
                        <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full overflow-hidden print:shadow-none print:w-full print:max-w-none">
                            <div className="bg-gray-100 px-6 py-3 flex justify-between items-center border-b border-gray-200 print:hidden">
                                <h3 className="font-semibold text-gray-800">Bill Preview</h3>
                                <div className="flex gap-3">
                                    <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"><Printer className="w-4 h-4" /> Print</button>
                                    <button onClick={() => setShowBillModal(false)} className="p-2 hover:bg-gray-200 rounded-lg text-gray-600"><X className="w-5 h-5" /></button>
                                </div>
                            </div>
                            <div className="p-8 print:p-0" id="printable-bill">
                                <div className="flex justify-between items-start mb-6 border-b-2 border-gray-800 pb-4">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <h1 className="text-2xl font-bold text-blue-900 uppercase tracking-wide">{billData.branch_name || 'New Life Hospital'}</h1>
                                            <div className="text-sm font-bold bg-blue-800 text-white px-2 py-0.5 inline-block rounded-sm mt-1">ISO 9001:2015 Certified</div>
                                        </div>
                                    </div>
                                    <div className="text-right text-sm">
                                        <p className="font-medium text-gray-900 w-64">{billData.address_line1}, {billData.city}<br />{billData.state} - {billData.pincode}</p>
                                        <p className="mt-1">Helpline: {billData.contact_number}</p>
                                    </div>
                                </div>
                                <div className="text-center mb-6"><h2 className="text-lg font-bold underline uppercase tracking-wider">OPD Payment Receipt</h2></div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm mb-6 font-medium">
                                    <div className="flex"><span className="w-32 text-gray-600">Q.No / Receipt No.:</span><span className="text-gray-900">{billData.token_number} / {billData.opd_id}</span></div>
                                    <div className="flex"><span className="w-32 text-gray-600">Date:</span><span className="text-gray-900">{new Date(billData.visit_date).toLocaleDateString()} {billData.visit_time}</span></div>
                                    <div className="flex"><span className="w-32 text-gray-600">UHID / OPD ID:</span><span className="text-gray-900">{billData.mrn_number} / {billData.opd_number}</span></div>
                                    <div className="flex"><span className="w-32 text-gray-600">Name:</span><span className="text-gray-900 font-bold uppercase">{billData.patient_first_name} {billData.patient_last_name}</span></div>
                                </div>
                                <table className="w-full mb-6 border-collapse">
                                    <thead><tr className="border-y-2 border-gray-800"><th className="py-2 text-center text-sm font-bold w-16">S.No.</th><th className="py-2 text-left text-sm font-bold pl-4">Particular</th><th className="py-2 text-right text-sm font-bold w-32 pr-4">Amount(Rs)</th></tr></thead>
                                    <tbody className="text-sm">
                                        <tr className="border-b border-gray-200"><td className="py-3 text-center">1</td><td className="py-3 pl-4">Consultation Fee</td><td className="py-3 text-right pr-4">{parseFloat(billData.consultation_fee || '0').toFixed(2)}</td></tr>
                                    </tbody>
                                    <tfoot><tr className="border-y-2 border-gray-800 font-bold bg-gray-50 print:bg-transparent"><td colSpan={2} className="py-2 text-right pr-4">Paid Amount</td><td className="py-2 text-right pr-4">{parseFloat(billData.consultation_fee || '0').toFixed(2)}</td></tr></tfoot>
                                </table>
                                <div className="mt-8 pt-8 flex justify-between items-end">
                                    <div className="text-sm"><p className="italic">Received with thanks <b>Rs. {parseFloat(billData.consultation_fee || '0').toFixed()} /-</b></p></div>
                                    <div className="text-center"><p className="text-sm font-medium border-t border-gray-400 px-8 pt-1">Authorized Signature</p></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Appointment Modal */}
            {showApptModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
                        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl">
                            <h2 className="text-xl font-bold">New Appointment</h2>
                            <button onClick={() => { setShowApptModal(false); resetAppointmentForm(); }} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
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

                                    {/* Available Doctors List */}
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">Available Doctors</h3>
                                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                            {doctors
                                                .filter((doc: any) =>
                                                    (!bookingDepartment || doc.department_name === bookingDepartment || doc.specialization?.includes(bookingDepartment)) &&
                                                    (!doctorSearchQuery ||
                                                        doc.first_name.toLowerCase().includes(doctorSearchQuery.toLowerCase()) ||
                                                        doc.last_name.toLowerCase().includes(doctorSearchQuery.toLowerCase()) ||
                                                        doc.specialization.toLowerCase().includes(doctorSearchQuery.toLowerCase())
                                                    )
                                                )
                                                .map((doc: any) => {
                                                    // Calculate slots availability
                                                    const slots = generateTimeSlotsFromSchedule(doc.doctor_id.toString(), appointmentForm.appointment_date);
                                                    const availableCount = slots ? slots.length : 0;
                                                    const isAvailable = availableCount > 0;

                                                    return (
                                                        <div key={doc.doctor_id} className={`p-4 rounded-xl border transition-all flex items-center justify-between group ${isAvailable
                                                            ? 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-md'
                                                            : 'bg-slate-50 border-slate-100 opacity-60'
                                                            }`}>
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${isAvailable ? 'bg-purple-100 text-purple-600' : 'bg-slate-200 text-slate-500'
                                                                    }`}>
                                                                    {doc.first_name[0]}
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-slate-800">Dr. {doc.first_name} {doc.last_name}</h4>
                                                                    <p className="text-sm text-slate-500">{doc.specialization}</p>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                                                        <span className={`text-xs font-bold ${isAvailable ? 'text-emerald-600' : 'text-red-500'}`}>
                                                                            {isAvailable
                                                                                ? `Available: ${getDoctorShiftTimes?.(doc.doctor_id, appointmentForm.appointment_date) || 'Today'}` // Simplified check
                                                                                : `Next Available: Checking...`
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {isAvailable ? (
                                                                <button
                                                                    onClick={() => {
                                                                        setAppointmentForm({ ...appointmentForm, doctor_id: doc.doctor_id });
                                                                        setAppointmentStep(2);
                                                                    }}
                                                                    className="px-6 py-2 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition shadow-lg shadow-purple-600/20"
                                                                >
                                                                    Select
                                                                </button>
                                                            ) : (
                                                                <button disabled className="px-6 py-2 bg-slate-200 text-slate-400 font-bold rounded-xl cursor-not-allowed">
                                                                    Full
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Step 2: Patient & Time Details */}
                                    <button
                                        onClick={() => setAppointmentStep(1)}
                                        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-purple-600 transition mb-4"
                                    >
                                        <ChevronLeft className="w-4 h-4" /> Back to Availability
                                    </button>

                                    <form onSubmit={handleCreateAppointment} className="space-y-6">
                                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
                                                <User className="w-4 h-4 text-purple-600" />
                                                Patient Details
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Full Name</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={appointmentForm.patient_name}
                                                        onChange={(e) => setAppointmentForm({ ...appointmentForm, patient_name: e.target.value })}
                                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                                                        placeholder="Patient Name"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Phone Number</label>
                                                    <input
                                                        type="tel"
                                                        required
                                                        value={appointmentForm.phone_number}
                                                        onChange={(e) => setAppointmentForm({ ...appointmentForm, phone_number: e.target.value })}
                                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                                                        placeholder="10-digit mobile"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Age</label>
                                                    <input
                                                        type="number"
                                                        required
                                                        value={appointmentForm.age}
                                                        onChange={(e) => setAppointmentForm({ ...appointmentForm, age: e.target.value })}
                                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                                                        placeholder="Years"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Gender</label>
                                                    <select
                                                        required
                                                        value={appointmentForm.gender}
                                                        onChange={(e) => setAppointmentForm({ ...appointmentForm, gender: e.target.value })}
                                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                                                    >
                                                        <option value="">Select Gender</option>
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
                                                <Clock className="w-4 h-4 text-purple-600" />
                                                Select Time Slot
                                            </h3>

                                            {/* Time Slot Tabs */}
                                            <div className="flex bg-slate-200 p-1 rounded-xl mb-4 w-fit">
                                                {['Morning', 'Afternoon', 'Evening'].map((cat: any) => (
                                                    <button
                                                        key={cat}
                                                        type="button"
                                                        onClick={() => setTimeSlotCategory(cat)}
                                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeSlotCategory === cat
                                                            ? 'bg-white text-purple-700 shadow-sm'
                                                            : 'text-slate-500 hover:text-slate-700'
                                                            }`}
                                                    >
                                                        {cat}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                                {availableTimeSlots
                                                    .filter((slot) => {
                                                        const h = parseInt(slot.split(':')[0]);
                                                        if (timeSlotCategory === 'Morning') return h < 12;
                                                        if (timeSlotCategory === 'Afternoon') return h >= 12 && h < 17;
                                                        return h >= 17;
                                                    })
                                                    .map((slot) => (
                                                        <button
                                                            key={slot}
                                                            type="button"
                                                            onClick={() => setAppointmentForm({ ...appointmentForm, appointment_time: slot })}
                                                            className={`px-2 py-2 rounded-lg text-sm font-bold border transition-all ${appointmentForm.appointment_time === slot
                                                                ? 'bg-purple-600 text-white border-purple-600 ring-2 ring-purple-200'
                                                                : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:bg-purple-50'
                                                                }`}
                                                        >
                                                            {slot}
                                                        </button>
                                                    ))}
                                            </div>
                                            {availableTimeSlots.filter((slot) => {
                                                const h = parseInt(slot.split(':')[0]);
                                                if (timeSlotCategory === 'Morning') return h < 12;
                                                if (timeSlotCategory === 'Afternoon') return h >= 12 && h < 17;
                                                return h >= 17;
                                            }).length === 0 && (
                                                    <p className="text-sm text-slate-500 italic py-2">No slots available for this time.</p>
                                                )}
                                        </div>

                                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                            <button
                                                type="button"
                                                onClick={() => { setShowApptModal(false); resetAppointmentForm(); }}
                                                className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading || !appointmentForm.appointment_time}
                                                className="px-8 py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loading ? 'Confirming...' : 'Confirm Appointment'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @media print {
                    @page { margin: 0; }
                    body { visibility: hidden; }
                    .print-modal { 
                        visibility: visible;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        background: white;
                        padding: 20mm; 
                    }
                    .print\\:hidden { display: none !important; }
                    .print\\:shadow-none { box-shadow: none !important; }
                }
            `}</style>
        </div>
    );
}
