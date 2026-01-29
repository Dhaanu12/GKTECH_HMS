'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, FileText, X, Save, User, Printer, Clock, AlertCircle, Calendar, Phone, ArrowRight, Bell } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../../lib/AuthContext';
import SearchableSelect from '../../../components/ui/SearchableSelect';

const API_URL = 'http://localhost:5000/api';

export default function OpdEntryPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [opdEntries, setOpdEntries] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [phoneMatches, setPhoneMatches] = useState<any[]>([]);
    const [showPhoneDropdown, setShowPhoneDropdown] = useState(false);

    const checkPhoneMatches = async (phone: string) => {
        if (phone.length === 10) {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/patients/search`, {
                    params: { q: phone },
                    headers: { Authorization: `Bearer ${token}` }
                });
                const matches = response.data.data.patients || [];
                // Filter matches that exactly start with or contain the phone number? 
                // The search API might be fuzzy. Let's trust it returns relevant ones.
                // We only show dropdown if matches exist.
                setPhoneMatches(matches);
                if (matches.length > 0) {
                    setShowPhoneDropdown(true);
                } else {
                    setShowPhoneDropdown(false);
                }
            } catch (error) {
                console.error("Error checking phone matches:", error);
            }
        } else {
            setShowPhoneDropdown(false);
        }
    };
    const [hasAppointment, setHasAppointment] = useState(false);
    const [appointmentDoctorName, setAppointmentDoctorName] = useState('');
    const [editingOpdId, setEditingOpdId] = useState<number | null>(null);
    const [showBillModal, setShowBillModal] = useState(false);
    const [billData, setBillData] = useState<any>(null);
    const [branchDetails, setBranchDetails] = useState<any>(null);

    // Smart Patient Search state (UX Solution 1)
    const [modalSearchQuery, setModalSearchQuery] = useState('');
    const [modalSearchResults, setModalSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Doctor Filter state
    const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('');

    // Progressive Form state (Solution 3b)
    type FormStep = 'search' | 'newPatient' | 'visitDetails' | 'payment';
    const [currentStep, setCurrentStep] = useState<FormStep>('search');
    const [completedSteps, setCompletedSteps] = useState<FormStep[]>([]);

    // Chief Complaint Auto-Suggest (Solution D2)
    const [showComplaintSuggestions, setShowComplaintSuggestions] = useState(false);
    const commonComplaints = [
        'Fever', 'Cold & Cough', 'Body Pain', 'Headache', 'Stomach Pain',
        'Vomiting', 'Loose Motions', 'Chest Pain', 'Breathing Difficulty',
        'Back Pain', 'Joint Pain', 'Skin Rash', 'Weakness', 'Dizziness',
        'Throat Pain', 'Ear Pain', 'Eye Problem', 'Urinary Problem',
        'Blood Pressure Check', 'Diabetes Follow-up', 'General Checkup'
    ];

    // Follow-up Queue state (Smart Follow-up Scheduling)
    const [followUpData, setFollowUpData] = useState<any>({
        overdue: [],
        due_today: [],
        upcoming: [],
        summary: { overdue_count: 0, due_today_count: 0, upcoming_count: 0, total: 0 }
    });
    const [showFollowUpPanel, setShowFollowUpPanel] = useState(false);


    const [opdForm, setOpdForm] = useState({
        first_name: '',
        last_name: '',
        age: '',
        gender: '',
        blood_group: '',
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
            spo2: '',
            grbs: ''
        },
        consultation_fee: '',
        payment_status: 'Pending',
        payment_method: 'Cash',
        is_mlc: false,
        mlc_remarks: '',
        attender_name: '',
        attender_contact_number: '',
        adhaar_number: '',
        referral_hospital: '',
        referral_doctor_name: ''
    });


    useEffect(() => {
        fetchDoctors();
        fetchOpdEntries();
        fetchFollowUps();
    }, []);

    useEffect(() => {
        if (user?.branch_id) {
            fetchBranchDetails();
        }
    }, [user?.branch_id]);

    // Debounced search for modal patient lookup (UX Solution 1)
    useEffect(() => {
        if (!modalSearchQuery || modalSearchQuery.length < 3) {
            setModalSearchResults([]);
            return;
        }

        const debounceTimer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/patients/search`, {
                    params: { q: modalSearchQuery },
                    headers: { Authorization: `Bearer ${token}` }
                });
                setModalSearchResults(response.data.data.patients || []);
            } catch (error) {
                console.error('Modal search error:', error);
            } finally {
                setIsSearching(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(debounceTimer);
    }, [modalSearchQuery]);

    const fetchBranchDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            // Assuming the receptionists endpoint or a general branch endpoint exists. 
            // If not, we might need to rely on the user object if it has branch info, 
            // but usually we need to fetch it.
            // Let's try to get it via the doctors/my-branch or a new endpoint if needed.
            // Actually, we can use the 'users' endpoint or similar? 
            // Let's assume we can get it from the user context if available, or fetch it.
            // Since we don't have a direct 'my-branch-details' endpoint, let's try to get it via a known path or just hardcode for now if blocked?
            // Wait, we used `GET /api/doctors/my-branch` which returns doctors. 
            // Let's assume there is `GET /api/branches/my-branch` or I can add it?
            // Better: I will add a simple logic to the frontend to fetch it if I can.
            // But wait, the task is to SHOW it. I'll add the fetch logic assuming I can implement the backend for it if it fails?
            // Actually, let's use the `doctors/my-branch` response if it returns branch info?
            // The `doctors/my-branch` endpoint returns `{ doctors: [...] }`.

            // Re-reading backend/controllers/branchController.js or opdController.js.
            // Let's just create a quick endpoint in the backend for this OR update `GET /api/opd/stats` to return branch info?
            // `GET /api/opd/stats` returns stats.

            // Simplest: Add `GET /api/branches/current` in backend?
            // Or just fetch `GET /api/branches/:id` if we know the ID from user object?
            // The user object in frontend `useAuth` has `branch_id`.
            if (user?.branch_id) {
                const response = await axios.get(`${API_URL}/branches/${user.branch_id}`, {
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
            const response = await axios.get(`${API_URL}/doctors/my-branch`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDoctors(response.data.data.doctors || []);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const fetchOpdEntries = async (query = '') => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/opd`, {
                params: { search: query },
                headers: { Authorization: `Bearer ${token}` }
            });
            setOpdEntries(response.data.data.opdEntries || []);
        } catch (error) {
            console.error('Error fetching OPD entries:', error);
        }
    };

    // Fetch follow-up queue data (Smart Follow-up Scheduling)
    const fetchFollowUps = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/follow-ups/due`, {
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

    // Handle booking a follow-up visit (pre-fill OPD form)
    const handleBookFollowUp = (followUp: any) => {
        // Pre-fill the form with patient data from the follow-up
        setOpdForm(prev => ({
            ...prev,
            first_name: followUp.patient_first_name || '',
            last_name: followUp.patient_last_name || '',
            contact_number: followUp.phone || '',
            doctor_id: followUp.doctor_id?.toString() || '',
            visit_type: 'Follow-up',
            chief_complaint: `Follow-up: ${followUp.diagnosis || 'Previous consultation'}`
        }));
        setSelectedPatient({
            patient_id: followUp.patient_id,
            first_name: followUp.patient_first_name,
            last_name: followUp.patient_last_name,
            phone: followUp.phone,
            patient_code: followUp.patient_code
        });
        setCurrentStep('visitDetails');
        setCompletedSteps(['search']);
        setShowModal(true);
        setShowFollowUpPanel(false);
    };

    const handleSearch = async () => {
        if (!searchQuery) {
            fetchOpdEntries(); // Reset if empty
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            // Parallel search: Patients (for new entry) + OPD Entries (for list)
            const [patientRes, opdRes] = await Promise.all([
                axios.get(`${API_URL}/patients/search`, {
                    params: { q: searchQuery },
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetchOpdEntries(searchQuery)
            ]);

            setSearchResults(patientRes.data.data.patients || []);
            // fetchOpdEntries already sets opdEntries state
        } catch (error) {
            console.error('Error searching:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectPatient = async (patient: any) => {
        setSelectedPatient(patient);

        // Fetch appointments for this patient to auto-fill doctor
        let doctorId = '';
        let consultationFee = '';
        let doctorName = '';
        let fromAppointment = false;
        let suggestedVisitType = 'Walk-in';

        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/appointments`, {
                params: { patient_id: patient.patient_id },
                headers: { Authorization: `Bearer ${token}` }
            });

            const appointments = response.data.data.appointments || [];
            const today = new Date().toISOString().split('T')[0];

            // Find today's appointment or the next upcoming one
            const todayAppointment = appointments.find((apt: any) => {
                const aptDate = new Date(apt.appointment_date).toISOString().split('T')[0];
                return aptDate === today &&
                    ['Scheduled', 'Confirmed'].includes(apt.appointment_status);
            });

            const upcomingAppointment = appointments.find((apt: any) => {
                const aptDate = new Date(apt.appointment_date).toISOString().split('T')[0];
                return aptDate >= today &&
                    ['Scheduled', 'Confirmed'].includes(apt.appointment_status);
            });

            const selectedAppointment = todayAppointment || upcomingAppointment;

            console.log('📋 Appointments found:', appointments.length);
            console.log('📅 Selected appointment:', selectedAppointment);

            if (selectedAppointment) {
                fromAppointment = true;
                doctorId = selectedAppointment.doctor_id?.toString() || '';
                suggestedVisitType = 'Appointment';
                // Get doctor name from appointment response
                doctorName = `Dr. ${selectedAppointment.doctor_first_name} ${selectedAppointment.doctor_last_name}`;

                console.log('✅ From appointment - Doctor ID:', doctorId);
                console.log('👨‍⚕️ Doctor Name:', doctorName);

                // Find the doctor in the doctors list to get consultation fee
                const selectedDoc = doctors.find((d: any) => d.doctor_id === selectedAppointment.doctor_id);
                if (selectedDoc) {
                    consultationFee = selectedDoc.consultation_fee?.toString() || '';
                    console.log('💰 Consultation Fee:', consultationFee);
                }
            } else {
                console.log('❌ No appointment found for this patient');
            }
        } catch (error) {
            console.error('Error fetching appointments:', error);
        }

        // INTELLIGENT DEFAULTS (Solution 3)
        // Check if patient is a follow-up candidate (visited within 30 days)
        if (!fromAppointment && patient.is_follow_up_candidate) {
            suggestedVisitType = 'Follow-up';
            // Pre-select their last doctor
            if (patient.last_doctor_id) {
                doctorId = patient.last_doctor_id.toString();
                const doc = doctors.find((d: any) => d.doctor_id === patient.last_doctor_id);
                if (doc) {
                    // Use follow-up fee if available, otherwise use regular fee
                    consultationFee = doc.follow_up_fee?.toString() || doc.consultation_fee?.toString() || '';
                    doctorName = `Dr. ${doc.first_name} ${doc.last_name}`;
                }
            }
            console.log('🔄 Follow-up detected - Doctor:', doctorName, 'Fee:', consultationFee);
        } else if (!fromAppointment && patient.days_since_last_visit !== null && patient.days_since_last_visit <= 30) {
            // Alternative check using days_since_last_visit
            suggestedVisitType = 'Follow-up';
            if (patient.last_doctor_id) {
                doctorId = patient.last_doctor_id.toString();
                const doc = doctors.find((d: any) => d.doctor_id === patient.last_doctor_id);
                if (doc) {
                    consultationFee = doc.follow_up_fee?.toString() || doc.consultation_fee?.toString() || '';
                    doctorName = `Dr. ${doc.first_name} ${doc.last_name}`;
                }
            }
            console.log('🔄 Follow-up (by days) - Days since last visit:', patient.days_since_last_visit);
        }

        console.log('🔄 Setting state - hasAppointment:', fromAppointment, 'doctorName:', doctorName);

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
        setSearchResults([]);
        setSearchQuery('');
        setModalSearchQuery('');
        setModalSearchResults([]);
        // Advance to Visit Details step (Solution 3b - Progressive Form)
        setCurrentStep('visitDetails');
        setCompletedSteps(['search']);
        setShowModal(true);
    };

    // Quick Follow-Up handler for returning patients (UX Solution 1)
    const handleQuickFollowUp = async (patient: any) => {
        // Select patient first
        setSelectedPatient(patient);

        // Pre-fill form with follow-up details
        const lastDoctorId = patient.last_doctor_id?.toString() || '';
        let consultationFee = '';

        // Find doctor to get follow-up fee
        if (lastDoctorId) {
            const doc = doctors.find((d: any) => d.doctor_id === patient.last_doctor_id);
            if (doc) {
                // Use follow_up_fee if available, otherwise consultation_fee
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
            visit_type: 'Follow-up', // Auto-set to Follow-up
            consultation_fee: consultationFee,
        });

        // Clear modal search and show form
        setModalSearchQuery('');
        setModalSearchResults([]);
        setHasAppointment(!!lastDoctorId);
        if (patient.last_doctor_first_name) {
            setAppointmentDoctorName(`Dr. ${patient.last_doctor_first_name} ${patient.last_doctor_last_name || ''}`);
        }
        setShowModal(true);
    };

    // Quick Follow-Up from OPD List Entry (UX Solution 2)
    const handleQuickFollowUpFromEntry = (entry: any) => {
        // Create patient object from entry data
        const patient = {
            patient_id: entry.patient_id,
            first_name: entry.patient_first_name,
            last_name: entry.patient_last_name,
            age: entry.age,
            gender: entry.gender,
            blood_group: entry.blood_group,
            contact_number: entry.contact_number,
            mrn_number: entry.mrn_number,
        };

        // Set selected patient
        setSelectedPatient(patient);

        // Get doctor's follow-up or consultation fee
        const doc = doctors.find((d: any) => d.doctor_id === entry.doctor_id);
        const consultationFee = doc?.follow_up_fee?.toString() || doc?.consultation_fee?.toString() || '';

        // Pre-fill form with follow-up details
        setOpdForm({
            ...opdForm,
            first_name: patient.first_name,
            last_name: patient.last_name || '',
            age: patient.age?.toString() || '',
            gender: patient.gender || '',
            blood_group: patient.blood_group || '',
            contact_number: patient.contact_number || '',
            doctor_id: entry.doctor_id?.toString() || '',
            visit_type: 'Follow-up',
            visit_date: new Date().toISOString().split('T')[0],
            visit_time: new Date().toTimeString().slice(0, 5),
            consultation_fee: consultationFee,
        });

        // Set doctor name display
        if (doc) {
            setHasAppointment(true);
            setAppointmentDoctorName(`Dr. ${doc.first_name} ${doc.last_name}`);
        }

        // Show modal
        setShowModal(true);
    };

    const saveEntry = async (formData: any = opdForm) => {
        try {
            const token = localStorage.getItem('token');
            // Calculate Total Fee (Doctor + MLC)
            let totalFee = parseFloat(formData.consultation_fee || '0');
            if (formData.is_mlc && branchDetails?.mlc_fee) {
                totalFee += parseFloat(branchDetails.mlc_fee);
            }

            const payload = {
                ...formData,
                patient_id: selectedPatient?.patient_id,
                vital_signs: JSON.stringify(formData.vital_signs),
                consultation_fee: totalFee.toString() // Send Total Fee to backend
            };

            let response;
            if (editingOpdId) {
                response = await axios.patch(`${API_URL}/opd/${editingOpdId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('OPD Entry updated successfully!');
                return editingOpdId;
            } else {
                response = await axios.post(`${API_URL}/opd`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('OPD Entry created successfully!');
                // Check if response has data.opdEntry (from createOpdEntry controller)
                if (response.data?.data?.opdEntry?.opd_id) {
                    return response.data.data.opdEntry.opd_id;
                }
                // Fallback if needed, though controller seems to return it
                return null;
            }
        } catch (error: any) {
            console.error('Error saving OPD entry:', error);
            alert(error.response?.data?.message || 'Failed to save OPD entry');
            throw error;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await saveEntry();
            setShowModal(false);
            resetForm();
            fetchOpdEntries();
        } catch (error) {
            // Error already handled in saveEntry
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAndPrint = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent default button behavior

        // Basic validation before saving
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
                // If it was a new entry, we might want to refresh the list in background
                fetchOpdEntries();

                // Now trigger print
                await handlePrintBill(savedId);

                // Keep modal open or close? User usually wants to see the bill, then close.
                // The handlePrintBill opens detailed bill modal.
                // So we can close the entry modal or switch to edit mode.
                // Let's close the entry modal to avoid clutter, as the bill modal is an overlay?
                // Or maybe better: Switch to edit mode so they can see what they just saved under the bill modal?
                // Decision: Close the entry form modal so only the Bill modal is visible on top of list.
                setShowModal(false);
                resetForm();
            }
        } catch (error) {
            // Error handled in saveEntry
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setOpdForm({
            first_name: '',
            last_name: '',
            age: '',
            gender: '',
            blood_group: '',
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
                spo2: '',
                grbs: ''
            },
            consultation_fee: '',
            payment_status: 'Pending',
            payment_method: 'Cash',
            is_mlc: false,
            mlc_remarks: '',
            attender_name: '',
            attender_contact_number: '',
            adhaar_number: '',
            referral_hospital: '',
            referral_doctor_name: ''
        });
        setSelectedPatient(null);
        setSearchQuery('');
        setSearchResults([]);
        setHasAppointment(false);
        setAppointmentDoctorName('');
        setEditingOpdId(null);
        // Reset progressive form state
        setCurrentStep('search');
        setCompletedSteps([]);
        setModalSearchQuery('');
        setModalSearchResults([]);
    };

    const handleEditOpd = (entry: any) => {
        setEditingOpdId(entry.opd_id);

        let vitals = { bp_systolic: '', bp_diastolic: '', pulse: '', temperature: '', weight: '', height: '', spo2: '', grbs: '' };
        try {
            if (entry.vital_signs) {
                const parsed = typeof entry.vital_signs === 'string' ? JSON.parse(entry.vital_signs) : entry.vital_signs;
                vitals = { ...vitals, ...parsed };
            }
        } catch (e) { }

        setOpdForm({
            first_name: entry.patient_first_name || '',
            last_name: entry.patient_last_name || '',
            age: entry.age || '',
            gender: entry.gender || '',
            blood_group: entry.blood_group || '',
            contact_number: entry.contact_number || '',
            doctor_id: entry.doctor_id,
            visit_type: entry.visit_type,
            visit_date: new Date(entry.visit_date).toISOString().split('T')[0],
            visit_time: entry.visit_time,
            chief_complaint: entry.chief_complaint || '',
            symptoms: entry.symptoms || '',
            vital_signs: vitals,
            consultation_fee: entry.consultation_fee || '',
            payment_status: entry.payment_status || 'Pending',
            payment_method: entry.payment_method || 'Cash',
            is_mlc: entry.is_mlc || false,
            mlc_remarks: entry.mlc_remarks || '',
            attender_name: entry.attender_name || '',
            attender_contact_number: entry.attender_contact_number || '',
            adhaar_number: '',
            referral_hospital: entry.referral_hospital || '',
            referral_doctor_name: entry.referral_doctor_name || ''
        });

        setSelectedPatient({
            patient_id: entry.patient_id,
            first_name: entry.patient_first_name,
            last_name: entry.patient_last_name,
            mrn_number: entry.mrn_number,
            gender: entry.gender,
            age: entry.age,
            contact_number: entry.contact_number,
            blood_group: entry.blood_group
        });

        setShowModal(true);
    };

    const handlePrintBill = async (opdId: number) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/opd/${opdId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBillData(response.data.data.opdEntry);
            setShowBillModal(true);
        } catch (error) {
            console.error('Error fetching bill details:', error);
            alert('Failed to generate bill');
        }
    };



    const doctorOptions = doctors.map((doc: any) => ({
        value: doc.doctor_id,
        label: `Dr. ${doc.first_name} ${doc.last_name} (${doc.specialization})`
    }));

    return (
        <div className="space-y-8 min-h-screen pb-20">
            {/* Minimalist Header */}
            {/* Minimalist Header */}
            <div className="flex justify-between items-center px-6 pt-6">
                <div className="flex items-center gap-3">
                    <span className="w-1.5 h-10 bg-blue-600 rounded-full"></span>
                    <div>
                        {/* <h1 className="text-2xl font-bold text-slate-800 tracking-tight leading-none">OPD Entry</h1> */}
                        <p className="text-sm text-slate-500 font-medium mt-1">Welcome back, {user?.first_name || 'Reception'}! 👋</p>
                    </div>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition font-bold text-sm shadow-lg shadow-blue-500/30 active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    New Entry
                </button>
            </div>

            <div className="px-6 space-y-8">
                {/* Actionable Day Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Today's Queue - Patients waiting right now */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-3xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
                        onClick={() => setSearchQuery('')}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/30">
                                <Clock className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 px-2 py-1 rounded-full">RIGHT NOW</span>
                        </div>
                        <p className="text-4xl font-bold text-amber-700">{opdEntries.filter((e: any) => e.visit_status === 'In-consultation' || e.visit_status === 'Registered').length}</p>
                        <p className="text-sm font-medium text-amber-600 mt-1">Patients in Queue</p>
                        {opdEntries.filter((e: any) => e.visit_status === 'Registered').length > 0 && (
                            <p className="text-xs text-amber-500 mt-2 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                {opdEntries.filter((e: any) => e.visit_status === 'Registered').length} waiting for doctor
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
                        <p className="text-4xl font-bold text-blue-700">{opdEntries.filter((e: any) => e.visit_date === new Date().toISOString().split('T')[0]).length}</p>
                        <p className="text-sm font-medium text-blue-600 mt-1">Today's Visits</p>
                        <p className="text-xs text-blue-500 mt-2">
                            {opdEntries.filter((e: any) => e.visit_date === new Date().toISOString().split('T')[0] && e.visit_status === 'Completed').length} completed
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
                        <p className="text-4xl font-bold text-red-700">{opdEntries.filter((e: any) => e.payment_status === 'Pending').length}</p>
                        <p className="text-sm font-medium text-red-600 mt-1">Pending Payments</p>
                        <p className="text-xs text-red-500 mt-2">
                            ₹{opdEntries.filter((e: any) => e.payment_status === 'Pending').reduce((sum: number, e: any) => sum + (parseFloat(e.consultation_fee) || 0), 0).toLocaleString()} to collect
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
                            ₹{opdEntries.filter((e: any) => e.payment_status === 'Paid' && e.visit_date === new Date().toISOString().split('T')[0]).reduce((sum: number, e: any) => sum + (parseFloat(e.consultation_fee) || 0), 0).toLocaleString()}
                        </p>
                        <p className="text-sm font-medium text-emerald-600 mt-1">Collected Today</p>
                        <p className="text-xs text-emerald-500 mt-2">
                            {opdEntries.filter((e: any) => e.payment_status === 'Paid' && e.visit_date === new Date().toISOString().split('T')[0]).length} payments received
                        </p>
                    </div>
                </div>
            </div>

            {/* Follow-up Queue Widget (Smart Follow-up Scheduling) */}
            {(followUpData.summary.overdue_count > 0 || followUpData.summary.due_today_count > 0) && (
                <div className="px-6">
                    <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-3xl border border-purple-100 overflow-hidden shadow-sm">
                        {/* Header - Always Visible */}
                        <button
                            onClick={() => setShowFollowUpPanel(!showFollowUpPanel)}
                            className="w-full p-4 flex items-center justify-between hover:bg-purple-100/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                                    <Bell className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-purple-800">Follow-ups Due</h3>
                                    <p className="text-xs text-purple-600">
                                        {followUpData.summary.overdue_count > 0 && (
                                            <span className="text-red-600 font-semibold">{followUpData.summary.overdue_count} overdue</span>
                                        )}
                                        {followUpData.summary.overdue_count > 0 && followUpData.summary.due_today_count > 0 && ' • '}
                                        {followUpData.summary.due_today_count > 0 && (
                                            <span className="text-green-600 font-semibold">{followUpData.summary.due_today_count} due today</span>
                                        )}
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
                            <div className="border-t border-purple-100 bg-white/80 divide-y divide-purple-50 max-h-64 overflow-y-auto">
                                {/* Overdue Section */}
                                {followUpData.overdue.length > 0 && (
                                    <div className="p-3">
                                        <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                            Overdue ({followUpData.overdue.length})
                                        </p>
                                        <div className="space-y-2">
                                            {followUpData.overdue.slice(0, 5).map((fu: any) => (
                                                <div key={fu.outcome_id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-red-200 text-red-700 flex items-center justify-center font-bold text-sm">
                                                            {fu.patient_first_name?.[0]}{fu.patient_last_name?.[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-800 text-sm">{fu.patient_first_name} {fu.patient_last_name}</p>
                                                            <p className="text-xs text-red-600 font-medium">
                                                                {fu.days_overdue} day{fu.days_overdue > 1 ? 's' : ''} overdue • Dr. {fu.doctor_first_name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <a href={`tel:${fu.phone}`} className="p-2 bg-white rounded-lg hover:bg-slate-50 text-slate-600 transition-colors" title="Call patient">
                                                            <Phone className="w-4 h-4" />
                                                        </a>
                                                        <button
                                                            onClick={() => handleBookFollowUp(fu)}
                                                            className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors"
                                                        >
                                                            Book Now
                                                        </button>
                                                    </div>
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
                                            {followUpData.due_today.slice(0, 5).map((fu: any) => (
                                                <div key={fu.outcome_id} className="flex items-center justify-between p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-green-200 text-green-700 flex items-center justify-center font-bold text-sm">
                                                            {fu.patient_first_name?.[0]}{fu.patient_last_name?.[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-800 text-sm">{fu.patient_first_name} {fu.patient_last_name}</p>
                                                            <p className="text-xs text-green-600 font-medium">
                                                                Follow-up today • Dr. {fu.doctor_first_name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleBookFollowUp(fu)}
                                                        className="px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        Book
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="glass-panel rounded-3xl overflow-hidden p-1">
                {/* Search Bar */}
                <div className="p-4 bg-white/50 backdrop-blur-sm border-b border-slate-100 flex gap-4 items-center">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search by Patient, Doctor, Token, MRN, or OPD Number..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                        />
                        {/* Search Results Dropdown */}
                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-20 max-h-80 overflow-y-auto">
                                <div className="p-2 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Patient Search Results</div>
                                {searchResults.map((patient: any) => (
                                    <div
                                        key={patient.patient_id}
                                        onClick={() => selectPatient(patient)}
                                        className="p-4 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0 flex items-center gap-4 transition-colors group"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                            {patient.first_name[0]}{patient.last_name[0]}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-800 group-hover:text-blue-700">{patient.first_name} {patient.last_name}</p>
                                            <p className="text-sm text-slate-500">{patient.gender}, {patient.age} yrs • <span className="font-mono text-xs bg-slate-100 px-1 rounded">{patient.mrn_number}</span></p>
                                        </div>
                                        <div className="text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">
                                            Select
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Doctor Filter Dropdown */}
                    <div className="relative">
                        <select
                            value={selectedDoctorFilter}
                            onChange={(e) => setSelectedDoctorFilter(e.target.value)}
                            className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700 appearance-none pr-10 min-w-[200px]"
                        >
                            <option value="">All Doctors</option>
                            {doctors.map((doc: any) => (
                                <option key={doc.doctor_id} value={doc.doctor_id}>
                                    Dr. {doc.first_name} {doc.last_name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition font-bold shadow-lg shadow-slate-900/10 active:scale-95"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>

                {/* Neat & Intuitive Entry List */}
                <div className="mt-6 space-y-4 px-1 pb-20 bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                    <div className="hidden md:flex items-center px-4 text-xs font-bold text-slate-400 uppercase tracking-widest pb-2">
                        <div className="w-[15%] pl-4">Token</div>
                        <div className="w-[17%]">Patient Details</div>
                        <div className="w-[17%]">Assigned Doctor</div>
                        <div className="w-[9%]">Timings</div>
                        <div className="w-[12%]">Status</div>
                        <div className="w-[12%] text-right">Payment</div>
                        <div className="w-[18%] text-right pr-4">Actions</div>
                    </div>

                    {opdEntries.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700">No OPD entries found</h3>
                            <p className="text-slate-500 mt-1">Start by adding a new patient visit.</p>
                        </div>
                    ) : (
                        opdEntries
                            .filter((entry: any) => {
                                // Doctor filter
                                const doctorMatch = !selectedDoctorFilter || entry.doctor_id === parseInt(selectedDoctorFilter);

                                // Search filter (patient name or OPD number)
                                const searchLower = searchQuery.toLowerCase().trim();
                                const searchMatch = !searchLower ||
                                    entry.patient_first_name?.toLowerCase().includes(searchLower) ||
                                    entry.patient_last_name?.toLowerCase().includes(searchLower) ||
                                    `${entry.patient_first_name} ${entry.patient_last_name}`.toLowerCase().includes(searchLower) ||
                                    entry.opd_number?.toLowerCase().includes(searchLower);

                                return doctorMatch && searchMatch;
                            })
                            .map((entry: any) => (
                                <div
                                    key={entry.opd_id}
                                    className="group bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-300 flex flex-col md:flex-row items-center relative overflow-hidden"
                                >
                                    {/* Left Accent Bar */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${entry.visit_status === 'Completed' ? 'bg-emerald-500' :
                                        entry.visit_status === 'In-consultation' ? 'bg-amber-500' :
                                            'bg-blue-500'
                                        }`}></div>

                                    {/* Token & ID */}
                                    <div className="w-full md:w-[15%] pl-4 flex flex-row items-center gap-3 flex-shrink-0">
                                        <div className="bg-blue-50 hover:bg-blue-100 transition-colors rounded-2xl border border-blue-100 h-14 w-14 flex flex-col items-center justify-center shadow-sm group-hover:scale-105 duration-300 flex-shrink-0">
                                            <div className="text-[7px] font-bold text-blue-400 uppercase tracking-widest">Token</div>
                                            <div className={`font-black text-blue-600 leading-none text-center ${entry.token_number.toString().length > 3 ? 'text-lg' : 'text-xl'}`}>
                                                {entry.token_number}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleEditOpd(entry)}
                                            className="text-xs font-mono font-bold text-slate-500 hover:text-blue-600 hover:underline whitespace-nowrap"
                                        >
                                            #{entry.opd_number}
                                        </button>
                                    </div>

                                    {/* Patient Info */}
                                    <div className="w-full md:w-[17%] flex items-center gap-3 flex-shrink-0">
                                        <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-lg font-bold shadow-sm ${entry.gender === 'Female' ? 'bg-pink-50 text-pink-600' : 'bg-blue-50 text-blue-600'
                                            }`}>
                                            {entry.patient_first_name[0]}
                                        </div>
                                        <div>
                                            <Link href={`/receptionist/patients/${entry.patient_id}`} className="block font-bold text-slate-800 text-lg hover:text-blue-600 transition">
                                                {entry.patient_first_name} {entry.patient_last_name}
                                            </Link>
                                            <p className="text-xs text-slate-500 font-medium mt-0.5">{entry.age} • {entry.gender}</p>
                                        </div>
                                    </div>

                                    {/* Doctor Info */}
                                    <div className="w-full md:w-[17%] flex-shrink-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                                {entry.doctor_first_name ? entry.doctor_first_name[0].toUpperCase() : 'D'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-700 leading-tight capitalize">
                                                    Dr. {entry.doctor_first_name} {entry.doctor_last_name}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                                    {entry.specialization || 'General'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timings */}
                                    <div className="w-full md:w-[9%] flex-shrink-0">
                                        <div className="flex flex-row md:flex-col gap-2 md:gap-0">
                                            <p className="text-sm font-bold text-slate-700">{entry.visit_time.slice(0, 5)}</p>
                                            <p className="text-xs text-slate-400 font-medium">{new Date(entry.visit_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                                        </div>
                                    </div>

                                    {/* Status Pills */}
                                    <div className="w-full md:w-[12%] flex flex-wrap gap-1.5 flex-shrink-0">
                                        <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold rounded-lg border ${entry.visit_type === 'Emergency' ? 'bg-red-50 text-red-600 border-red-100' :
                                            entry.visit_type === 'Follow-up' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                'bg-slate-50 text-slate-600 border-slate-100'
                                            }`}>
                                            {entry.visit_type}
                                        </span>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-lg border ${entry.visit_status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            entry.visit_status === 'In-consultation' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                'bg-white text-slate-500 border-slate-200'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${entry.visit_status === 'Completed' ? 'bg-emerald-500' :
                                                entry.visit_status === 'In-consultation' ? 'bg-amber-500' :
                                                    'bg-slate-300'
                                                }`}></span>
                                            {entry.visit_status}
                                        </span>
                                    </div>

                                    {/* Payment */}
                                    <div className="w-full md:w-[12%] text-left md:text-right flex-shrink-0">
                                        <p className="font-mono text-sm font-bold text-slate-800">₹{entry.consultation_fee || '0'} <span className="text-[10px] text-slate-400 font-sans font-normal">INR</span></p>
                                        <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${entry.payment_status === 'Paid' ? 'text-emerald-500' : 'text-red-500'
                                            }`}>
                                            {entry.payment_status}
                                        </p>
                                    </div>

                                    {/* Quick Actions (UX Solution 2) */}
                                    <div className="w-full md:w-[18%] flex items-center justify-end pr-2 flex-shrink-0">
                                        {/* Quick Follow-Up Button - Only show if visit is completed and within 30 days */}
                                        {entry.visit_status === 'Completed' && (() => {
                                            const visitDate = new Date(entry.visit_date);
                                            const daysSince = Math.floor((new Date().getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24));
                                            return daysSince <= 30;
                                        })() && (
                                                <button
                                                    onClick={() => handleQuickFollowUpFromEntry(entry)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all shadow-sm font-bold text-sm"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                    Follow-Up
                                                </button>
                                            )}
                                    </div>
                                </div>
                            )))}
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

                            {/* Progress Indicator - Only for new entries - Sequential validation */}
                            {!editingOpdId && (
                                <div className="px-8 py-4 bg-slate-50/80 border-b border-slate-100">
                                    {(() => {
                                        // Define completion checks
                                        const step1Complete = selectedPatient
                                            ? true
                                            : (opdForm.first_name && opdForm.age && opdForm.gender &&
                                                (opdForm.is_mlc || (opdForm.contact_number?.length === 10 && opdForm.adhaar_number?.length === 12)));

                                        const step2FieldsComplete = opdForm.visit_type && opdForm.doctor_id && (opdForm.is_mlc || opdForm.chief_complaint);
                                        const step2Complete = step1Complete && step2FieldsComplete;

                                        const step3FieldsComplete = opdForm.consultation_fee;
                                        const step3Complete = step2Complete && step3FieldsComplete;

                                        return (
                                            <div className="flex items-center justify-between max-w-2xl mx-auto">
                                                {/* Step 1: Patient */}
                                                <div className="flex items-center">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step1Complete
                                                        ? 'bg-emerald-500 text-white'
                                                        : currentStep === 'search' || currentStep === 'newPatient'
                                                            ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                                                            : 'bg-slate-200 text-slate-500'
                                                        }`}>
                                                        {step1Complete ? '✓' : '1'}
                                                    </div>
                                                    <span className={`ml-2 text-sm font-medium ${step1Complete ? 'text-emerald-600' : 'text-slate-600'}`}>
                                                        Patient
                                                    </span>
                                                </div>

                                                {/* Connector 1-2 */}
                                                <div className={`flex-1 h-1 mx-4 rounded ${step1Complete ? 'bg-emerald-300' : 'bg-slate-200'}`}></div>

                                                {/* Step 2: Visit Details - Only green if Step 1 is also complete */}
                                                <div className="flex items-center">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step2Complete
                                                        ? 'bg-emerald-500 text-white'
                                                        : currentStep === 'visitDetails'
                                                            ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                                                            : 'bg-slate-200 text-slate-500'
                                                        }`}>
                                                        {step2Complete ? '✓' : '2'}
                                                    </div>
                                                    <span className={`ml-2 text-sm font-medium ${step2Complete ? 'text-emerald-600' : 'text-slate-600'}`}>
                                                        Visit Details
                                                    </span>
                                                </div>

                                                {/* Connector 2-3 */}
                                                <div className={`flex-1 h-1 mx-4 rounded ${step2Complete ? 'bg-emerald-300' : 'bg-slate-200'}`}></div>

                                                {/* Step 3: Payment - Only green if Step 1 & 2 are complete */}
                                                <div className="flex items-center">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step3Complete
                                                        ? 'bg-emerald-500 text-white'
                                                        : currentStep === 'payment'
                                                            ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                                                            : 'bg-slate-200 text-slate-500'
                                                        }`}>
                                                        {step3Complete ? '✓' : '3'}
                                                    </div>
                                                    <span className={`ml-2 text-sm font-medium ${step3Complete ? 'text-emerald-600' : 'text-slate-600'}`}>
                                                        Payment
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                {/* Form Sections content... (Keep existing logic but styled) */}
                                {/* Patient Information Section */}
                                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <User className="w-4 h-4" /> Patient Details
                                    </h3>

                                    {/* Smart Patient Search - Only show if no patient selected (UX Solution 1) */}
                                    {!selectedPatient && !editingOpdId && (
                                        <div className="mb-6 relative">
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                Search Existing Patient
                                            </label>
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

                                            {/* Search Results Dropdown */}
                                            {modalSearchResults.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 max-h-72 overflow-y-auto">
                                                    {modalSearchResults.map((patient: any) => (
                                                        <div
                                                            key={patient.patient_id}
                                                            className="p-4 hover:bg-blue-50 border-b border-slate-100 last:border-0"
                                                        >
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                                                        {patient.first_name?.[0]}{patient.last_name?.[0] || ''}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-slate-800">
                                                                            {patient.first_name} {patient.last_name}
                                                                        </p>
                                                                        <p className="text-sm text-slate-500">
                                                                            {patient.gender}, {patient.age} yrs • {patient.contact_number}
                                                                        </p>
                                                                        {patient.last_visit_date && (
                                                                            <p className="text-xs text-slate-400 mt-1">
                                                                                Last visit: {new Date(patient.last_visit_date).toLocaleDateString()}
                                                                                {patient.last_doctor_first_name && (
                                                                                    <> with Dr. {patient.last_doctor_first_name}</>
                                                                                )}
                                                                                {patient.is_follow_up_candidate && (
                                                                                    <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold">
                                                                                        Follow-up eligible
                                                                                    </span>
                                                                                )}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2 flex-shrink-0">
                                                                    {patient.is_follow_up_candidate && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleQuickFollowUp(patient)}
                                                                            className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition"
                                                                        >
                                                                            Quick Follow-Up
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            selectPatient(patient);
                                                                            setModalSearchQuery('');
                                                                            setModalSearchResults([]);
                                                                        }}
                                                                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                                                                    >
                                                                        Select
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* No Results State */}
                                            {modalSearchQuery.length >= 3 && !isSearching && modalSearchResults.length === 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 p-4 z-50">
                                                    <p className="text-slate-500 text-center mb-3">No patient found with "{modalSearchQuery}"</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            // Pre-fill phone if search was a phone number
                                                            if (/^\d{10}$/.test(modalSearchQuery)) {
                                                                setOpdForm(prev => ({ ...prev, contact_number: modalSearchQuery }));
                                                            }
                                                            setModalSearchQuery('');
                                                            setModalSearchResults([]);
                                                        }}
                                                        className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition"
                                                    >
                                                        + Register as New Patient
                                                    </button>
                                                </div>
                                            )}

                                            <p className="text-xs text-slate-400 mt-2">
                                                Type at least 3 characters to search. Leave empty to register new patient.
                                            </p>
                                        </div>
                                    )}

                                    {/* Selected Patient Display - Enhanced Card */}
                                    {selectedPatient && !editingOpdId && (
                                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                                                    {selectedPatient.first_name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-lg">
                                                        {selectedPatient.first_name} {selectedPatient.last_name}
                                                    </p>
                                                    <div className="flex items-center gap-3 text-sm text-slate-500">
                                                        <span>{selectedPatient.gender}, {selectedPatient.age} yrs</span>
                                                        <span>•</span>
                                                        <span>📱 {selectedPatient.contact_number}</span>
                                                        {selectedPatient.blood_group && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="text-red-600 font-bold">{selectedPatient.blood_group}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-blue-600 font-mono mt-1">MRN: {selectedPatient.mrn_number}</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedPatient(null);
                                                    resetForm();
                                                }}
                                                className="px-4 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-white/50 font-medium rounded-lg flex items-center gap-1 transition"
                                            >
                                                <X className="w-4 h-4" />
                                                Change
                                            </button>
                                        </div>
                                    )}

                                    {/* New Patient Form Fields - Only show when no patient is selected */}
                                    {!selectedPatient && !editingOpdId && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                            <div className="md:col-span-4">
                                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Name <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={opdForm.first_name + (opdForm.last_name ? ' ' + opdForm.last_name : '')}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const parts = val.split(' ');
                                                        const first = parts[0];
                                                        const last = parts.slice(1).join(' ');
                                                        setOpdForm({ ...opdForm, first_name: first, last_name: last });
                                                    }}
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                                    placeholder="e.g. John Doe"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Age <span className="text-red-500">*</span></label>
                                                <input type="number" required value={opdForm.age} onChange={(e) => setOpdForm({ ...opdForm, age: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Gender <span className="text-red-500">*</span></label>
                                                <select required value={opdForm.gender} onChange={(e) => setOpdForm({ ...opdForm, gender: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium">
                                                    <option value="">Select</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Pediatric">Pediatric</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number {opdForm.is_mlc ? '(Optional for MLC)' : <span className="text-red-500">*</span>}</label>
                                                <input
                                                    type="tel"
                                                    required={!opdForm.is_mlc}
                                                    value={opdForm.contact_number}
                                                    onChange={(e) => {
                                                        const value = e.target.value.replace(/\D/g, "");
                                                        if (value.length <= 10) setOpdForm({ ...opdForm, contact_number: value });
                                                    }}
                                                    maxLength={10}
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                                    placeholder="10-digit number"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Blood Group</label>
                                                <select value={opdForm.blood_group} onChange={(e) => setOpdForm({ ...opdForm, blood_group: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium">
                                                    <option value="">Unknown</option>
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
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Aadhaar Number {opdForm.is_mlc ? '(Optional for MLC)' : <span className="text-red-500">*</span>}</label>
                                                <input
                                                    type="text"
                                                    required={!opdForm.is_mlc}
                                                    value={opdForm.adhaar_number}
                                                    onChange={(e) => {
                                                        const value = e.target.value.replace(/\D/g, "");
                                                        if (value.length <= 12) setOpdForm({ ...opdForm, adhaar_number: value });
                                                    }}
                                                    maxLength={12}
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                                    placeholder="12-digit Aadhaar"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Edit Mode - Show all fields */}
                                    {editingOpdId && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                            <div className="md:col-span-4">
                                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Name <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={opdForm.first_name + (opdForm.last_name ? ' ' + opdForm.last_name : '')}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const parts = val.split(' ');
                                                        const first = parts[0];
                                                        const last = parts.slice(1).join(' ');
                                                        setOpdForm({ ...opdForm, first_name: first, last_name: last });
                                                    }}
                                                    disabled
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium disabled:bg-slate-100 disabled:text-slate-500"
                                                    placeholder="e.g. John Doe"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Age <span className="text-red-500">*</span></label>
                                                <input type="number" required value={opdForm.age} onChange={(e) => setOpdForm({ ...opdForm, age: e.target.value })} disabled className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium disabled:bg-slate-100 disabled:text-slate-500" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Gender <span className="text-red-500">*</span></label>
                                                <select required value={opdForm.gender} onChange={(e) => setOpdForm({ ...opdForm, gender: e.target.value })} disabled className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium disabled:bg-slate-100 disabled:text-slate-500">
                                                    <option value="">Select</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Pediatric">Pediatric</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Visit Details Section */}
                                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Visit Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        {/* MLC Toggle - Highlighted */}
                                        <div className="md:col-span-4 bg-red-50/50 p-4 rounded-xl border border-red-100 flex items-center gap-3 mb-2">
                                            <input
                                                id="mlc-toggle"
                                                type="checkbox"
                                                checked={opdForm.is_mlc}
                                                onChange={(e) => setOpdForm({ ...opdForm, is_mlc: e.target.checked })}
                                                className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500 transition-all cursor-pointer"
                                            />
                                            <label htmlFor="mlc-toggle" className="font-bold text-red-800 cursor-pointer select-none">
                                                Mark as Medical Legal Case (MLC)
                                            </label>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Visit Type <span className="text-red-500">*</span></label>
                                            <select required value={opdForm.visit_type} onChange={(e) => setOpdForm({ ...opdForm, visit_type: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium">
                                                <option value="Walk-in">Walk-in</option>
                                                <option value="Follow-up">Follow-up</option>
                                                <option value="Emergency">Emergency</option>
                                                <option value="Referral">Referral</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Date</label>
                                            <input type="date" value={opdForm.visit_date} onChange={(e) => setOpdForm({ ...opdForm, visit_date: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Time</label>
                                            <input type="time" value={opdForm.visit_time} onChange={(e) => setOpdForm({ ...opdForm, visit_time: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" />
                                        </div>
                                        <div>
                                            {hasAppointment ? (
                                                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
                                                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-0.5">Assigned Doctor</p>
                                                    <p className="font-bold text-slate-700">{appointmentDoctorName}</p>
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assign Doctor <span className="text-red-500">*</span></label>
                                                    {/* Custom select styling or keep simple for now */}
                                                    <select
                                                        value={opdForm.doctor_id}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            const selectedDoc = doctors.find((d: any) => d.doctor_id === parseInt(val));
                                                            setOpdForm({
                                                                ...opdForm,
                                                                doctor_id: val,
                                                                consultation_fee: selectedDoc?.consultation_fee || ''
                                                            });
                                                        }}
                                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                                    >
                                                        <option value="">Select Doctor</option>
                                                        {doctors.map((doc: any) => (
                                                            <option key={doc.doctor_id} value={doc.doctor_id}>Dr. {doc.first_name} {doc.last_name} ({doc.specialization})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        {/* Referral Fields */}
                                        {opdForm.visit_type === 'Referral' && (
                                            <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Referral Hospital <span className="text-red-500">*</span></label>
                                                    <input type="text" required value={opdForm.referral_hospital} onChange={(e) => setOpdForm({ ...opdForm, referral_hospital: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl" placeholder="Hospital Name" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Referral Doctor <span className="text-red-500">*</span></label>
                                                    <input type="text" required value={opdForm.referral_doctor_name} onChange={(e) => setOpdForm({ ...opdForm, referral_doctor_name: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl" placeholder="Doctor Name" />
                                                </div>
                                            </div>
                                        )}

                                        {/* MLC Fields */}
                                        {opdForm.is_mlc && (
                                            <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-red-50/50 p-4 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                                                <div>
                                                    <label className="block text-xs font-semibold text-red-800 mb-1.5">Attender Name <span className="text-red-500">*</span></label>
                                                    <input type="text" required value={opdForm.attender_name} onChange={(e) => setOpdForm({ ...opdForm, attender_name: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-red-800 mb-1.5">Attender Contact <span className="text-red-500">*</span></label>
                                                    <input type="tel" required value={opdForm.attender_contact_number} onChange={(e) => setOpdForm({ ...opdForm, attender_contact_number: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-semibold text-red-800 mb-1.5">MLC Remarks</label>
                                                    <textarea value={opdForm.mlc_remarks} onChange={(e) => setOpdForm({ ...opdForm, mlc_remarks: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500" rows={2} placeholder="Explain nature of incident..." />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Complaint & Symptoms - Hide for MLC cases */}
                                {!opdForm.is_mlc && (
                                    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Clinical Notes</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="relative">
                                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Chief Complaint <span className="text-red-500">*</span></label>
                                                <textarea
                                                    required={!opdForm.is_mlc}
                                                    value={opdForm.chief_complaint}
                                                    onChange={(e) => setOpdForm({ ...opdForm, chief_complaint: e.target.value })}
                                                    onFocus={() => setShowComplaintSuggestions(true)}
                                                    onBlur={() => setTimeout(() => setShowComplaintSuggestions(false), 200)}
                                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium resize-none"
                                                    rows={2}
                                                    placeholder="Type or click suggestions below..."
                                                />
                                                {/* Quick Suggestion Chips */}
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {commonComplaints
                                                        .filter(c =>
                                                            !opdForm.chief_complaint ||
                                                            c.toLowerCase().includes(opdForm.chief_complaint.toLowerCase()) ||
                                                            showComplaintSuggestions
                                                        )
                                                        .slice(0, showComplaintSuggestions ? 21 : 6)
                                                        .map((complaint) => (
                                                            <button
                                                                key={complaint}
                                                                type="button"
                                                                onClick={() => {
                                                                    const current = opdForm.chief_complaint || '';
                                                                    // Check if complaint is already in the text
                                                                    const isSelected = current.split(', ').some(c => c.trim() === complaint);

                                                                    let newValue;
                                                                    if (isSelected) {
                                                                        // Remove the complaint
                                                                        newValue = current
                                                                            .split(', ')
                                                                            .filter(c => c.trim() !== complaint)
                                                                            .join(', ');
                                                                    } else {
                                                                        // Add the complaint
                                                                        newValue = current
                                                                            ? current + ', ' + complaint
                                                                            : complaint;
                                                                    }
                                                                    setOpdForm({ ...opdForm, chief_complaint: newValue });
                                                                }}
                                                                className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all hover:scale-105 ${opdForm.chief_complaint?.includes(complaint)
                                                                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                                                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600'
                                                                    }`}
                                                            >
                                                                {complaint}
                                                            </button>
                                                        ))
                                                    }
                                                    {!showComplaintSuggestions && commonComplaints.length > 6 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowComplaintSuggestions(true)}
                                                            className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:underline"
                                                        >
                                                            +{commonComplaints.length - 6} more...
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Symptoms</label>
                                                <textarea
                                                    value={opdForm.symptoms}
                                                    onChange={(e) => setOpdForm({ ...opdForm, symptoms: e.target.value })}
                                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium resize-none"
                                                    rows={3}
                                                    placeholder="Observed symptoms..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Vital Signs */}
                                <div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100">
                                    <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-4">Vital Signs</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">BP Sys</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={opdForm.vital_signs.bp_systolic}
                                                    onChange={(e) => setOpdForm({ ...opdForm, vital_signs: { ...opdForm.vital_signs, bp_systolic: e.target.value } })}
                                                    className="w-full px-3 py-2 bg-white border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm"
                                                    placeholder="mmHg"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">BP Dia</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={opdForm.vital_signs.bp_diastolic}
                                                    onChange={(e) => setOpdForm({ ...opdForm, vital_signs: { ...opdForm.vital_signs, bp_diastolic: e.target.value } })}
                                                    className="w-full px-3 py-2 bg-white border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm"
                                                    placeholder="mmHg"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Pulse</label>
                                            <input
                                                type="text"
                                                value={opdForm.vital_signs.pulse}
                                                onChange={(e) => setOpdForm({ ...opdForm, vital_signs: { ...opdForm.vital_signs, pulse: e.target.value } })}
                                                className="w-full px-3 py-2 bg-white border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm"
                                                placeholder="bpm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Temp</label>
                                            <input
                                                type="text"
                                                value={opdForm.vital_signs.temperature}
                                                onChange={(e) => setOpdForm({ ...opdForm, vital_signs: { ...opdForm.vital_signs, temperature: e.target.value } })}
                                                className="w-full px-3 py-2 bg-white border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm"
                                                placeholder="°F"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Weight</label>
                                            <input
                                                type="text"
                                                value={opdForm.vital_signs.weight}
                                                onChange={(e) => setOpdForm({ ...opdForm, vital_signs: { ...opdForm.vital_signs, weight: e.target.value } })}
                                                className="w-full px-3 py-2 bg-white border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm"
                                                placeholder="kg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Height</label>
                                            <input
                                                type="text"
                                                value={opdForm.vital_signs.height}
                                                onChange={(e) => setOpdForm({ ...opdForm, vital_signs: { ...opdForm.vital_signs, height: e.target.value } })}
                                                className="w-full px-3 py-2 bg-white border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm"
                                                placeholder="cm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">SpO2</label>
                                            <input
                                                type="text"
                                                value={opdForm.vital_signs.spo2}
                                                onChange={(e) => setOpdForm({ ...opdForm, vital_signs: { ...opdForm.vital_signs, spo2: e.target.value } })}
                                                className="w-full px-3 py-2 bg-white border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm"
                                                placeholder="%"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">GRBS</label>
                                            <input
                                                type="text"
                                                value={opdForm.vital_signs.grbs}
                                                onChange={(e) => setOpdForm({ ...opdForm, vital_signs: { ...opdForm.vital_signs, grbs: e.target.value } })}
                                                className="w-full px-3 py-2 bg-white border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm"
                                                placeholder="mg/dL"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Section - Simple */}
                                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 flex justify-between items-end">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Payment Details</h3>
                                        <div className="flex gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1">Consultation Fee</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                                                    <input
                                                        type="number"
                                                        value={opdForm.consultation_fee}
                                                        onChange={(e) => setOpdForm({ ...opdForm, consultation_fee: e.target.value })}
                                                        className="w-32 pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1">Payment Status <span className="text-red-500">*</span></label>
                                                <select required value={opdForm.payment_status} onChange={(e) => setOpdForm({ ...opdForm, payment_status: e.target.value })} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium">
                                                    <option value="Pending">Pending</option>
                                                    <option value="Paid">Paid</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1">Method</label>
                                                <select value={opdForm.payment_method} onChange={(e) => setOpdForm({ ...opdForm, payment_method: e.target.value })} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium">
                                                    <option value="Cash">Cash</option>
                                                    <option value="UPI">UPI</option>
                                                    <option value="Card">Card</option>
                                                    <option value="Insurance">Insurance</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Fee</p>
                                        <p className="text-3xl font-bold text-slate-800">
                                            ₹{(() => {
                                                let fee = parseFloat(opdForm.consultation_fee || '0');
                                                if (opdForm.is_mlc && branchDetails?.mlc_fee) {
                                                    fee += parseFloat(branchDetails.mlc_fee);
                                                }
                                                return fee;
                                            })()}
                                        </p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-4 border-t border-slate-100 flex justify-end gap-4 sticky bottom-[-20px] bg-white/95 backdrop-blur pb-2 z-[9999]">
                                    <button
                                        type="button"
                                        onClick={() => { setShowModal(false); resetForm(); }}
                                        className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition font-bold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all font-bold flex items-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Saving...' : 'Register Visit'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div >
                )
            }
            {/* Bill Modal */}
            {
                showBillModal && billData && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 print:p-0 print:bg-white print:fixed print:inset-0 print:z-[100] print-modal">
                        <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full overflow-hidden print:shadow-none print:w-full print:max-w-none">
                            {/* Print Controls - Hidden in Print */}
                            <div className="bg-gray-100 px-6 py-3 flex justify-between items-center border-b border-gray-200 print:hidden">
                                <h3 className="font-semibold text-gray-800">Bill Preview</h3>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => window.print()}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                    >
                                        <Printer className="w-4 h-4" /> Print
                                    </button>
                                    <button
                                        onClick={() => setShowBillModal(false)}
                                        className="p-2 hover:bg-gray-200 rounded-lg text-gray-600"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Bill Content */}
                            <div className="p-8 print:p-0" id="printable-bill">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-6 border-b-2 border-gray-800 pb-4">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <h1 className="text-2xl font-bold text-blue-900 uppercase tracking-wide">
                                                {billData.branch_name || 'New Life Hospital'}
                                            </h1>
                                            <div className="text-sm font-bold bg-blue-800 text-white px-2 py-0.5 inline-block rounded-sm mt-1">
                                                ISO 9001:2015 Certified
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right text-sm">
                                        <p className="font-medium text-gray-900 w-64">
                                            {billData.address_line1}, {billData.city}<br />
                                            {billData.state} - {billData.pincode}
                                        </p>
                                        <p className="mt-1">Helpline: {billData.contact_number}</p>
                                    </div>
                                </div>

                                <div className="text-center mb-6">
                                    <h2 className="text-lg font-bold underline uppercase tracking-wider">OPD Payment Receipt</h2>
                                </div>

                                {/* Patient Info Grid */}
                                <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm mb-6 font-medium">
                                    <div className="flex">
                                        <span className="w-32 text-gray-600">Q.No / Receipt No.:</span>
                                        <span className="text-gray-900">{billData.token_number} / {billData.opd_id}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-32 text-gray-600">Date:</span>
                                        <span className="text-gray-900">{new Date(billData.visit_date).toLocaleDateString()} {billData.visit_time}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-32 text-gray-600">UHID / OPD ID:</span>
                                        <span className="text-gray-900">{billData.mrn_number} / {billData.opd_number}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-32 text-gray-600">Category / Mode:</span>
                                        <span className="text-gray-900">{billData.visit_type} / {billData.payment_method}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-32 text-gray-600">Name:</span>
                                        <span className="text-gray-900 font-bold uppercase">{billData.patient_first_name} {billData.patient_last_name}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-32 text-gray-600">Department:</span>
                                        <span className="text-gray-900 uppercase">{billData.department_name || 'General'}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-32 text-gray-600">Age / Gender:</span>
                                        <span className="text-gray-900">{billData.age}Y / {billData.gender}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-32 text-gray-600">Doctor:</span>
                                        <span className="text-gray-900 uppercase">Dr. {billData.doctor_first_name} {billData.doctor_last_name}</span>
                                    </div>
                                    <div className="flex col-span-2">
                                        <span className="w-32 text-gray-600">Address:</span>
                                        <span className="text-gray-900 uppercase">{billData.city || 'N/A'}</span>
                                    </div>
                                </div>

                                {/* Bill Items Table */}
                                <table className="w-full mb-6 border-collapse">
                                    <thead>
                                        <tr className="border-y-2 border-gray-800">
                                            <th className="py-2 text-center text-sm font-bold w-16">S.No.</th>
                                            <th className="py-2 text-left text-sm font-bold pl-4">Particular</th>
                                            <th className="py-2 text-center text-sm font-bold w-24">Mode</th>
                                            <th className="py-2 text-right text-sm font-bold w-32 pr-4">Amount(Rs)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {/* Consultation Fee */}
                                        <tr className="border-b border-gray-200">
                                            <td className="py-3 text-center">1</td>
                                            <td className="py-3 pl-4">Consultation Fee</td>
                                            <td className="py-3 text-center">{billData.payment_method}</td>
                                            <td className="py-3 text-right pr-4">
                                                {(
                                                    parseFloat(billData.consultation_fee || '0') -
                                                    (billData.is_mlc ? parseFloat(billData.mlc_fee || '0') : 0)
                                                ).toFixed(2)}
                                            </td>
                                        </tr>
                                        {/* MLC Fee (if applicable) */}
                                        {billData.is_mlc && billData.mlc_fee > 0 && (
                                            <tr className="border-b border-gray-200">
                                                <td className="py-3 text-center">2</td>
                                                <td className="py-3 pl-4">MLC Charges</td>
                                                <td className="py-3 text-center">{billData.payment_method}</td>
                                                <td className="py-3 text-right pr-4">{parseFloat(billData.mlc_fee).toFixed(2)}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-y-2 border-gray-800 font-bold bg-gray-50 print:bg-transparent">
                                            <td colSpan={3} className="py-2 text-right pr-4">Paid Amount</td>
                                            <td className="py-2 text-right pr-4">
                                                {parseFloat(billData.consultation_fee || '0').toFixed(2)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>

                                {/* Footer */}
                                <div className="mt-8 pt-8 flex justify-between items-end">
                                    <div className="text-sm">
                                        <p className="italic">Received with thanks <b>Rs. {parseFloat(billData.consultation_fee || '0').toFixed()} /-</b> from {billData.patient_first_name} {billData.patient_last_name}.</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="h-12"></div> {/* Space for signature */}
                                        <p className="text-sm font-medium border-t border-gray-400 px-8 pt-1">Authorized Signature</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

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
        </div >
    );
}
