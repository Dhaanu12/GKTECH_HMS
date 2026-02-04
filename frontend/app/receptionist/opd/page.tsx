'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, FileText, X, Save, User, Printer, Clock, Trash2 } from 'lucide-react';
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

    const [opdForm, setOpdForm] = useState({
        full_name: '',
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
        referral_doctor_name: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        pincode: ''
    });


    useEffect(() => {
        fetchDoctors();
        fetchOpdEntries();
    }, []);

    useEffect(() => {
        if (user?.branch_id) {
            fetchBranchDetails();
        }
    }, [user?.branch_id]);



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

        let doctorId = '';
        let consultationFee = '';
        let doctorName = '';
        let fromAppointment = false;
        // Default empty variables for "New Entry"
        let lastComplaint = '';
        let lastSymptoms = '';
        let vitals = { bp_systolic: '', bp_diastolic: '', pulse: '', temperature: '', weight: '', height: '', spo2: '', grbs: '' };

        try {
            const token = localStorage.getItem('token');

            // Only fetch Appointments (for today's visit linkage), NOT history
            const apptRes = await axios.get(`${API_URL}/appointments`, {
                params: { patient_id: patient.patient_id },
                headers: { Authorization: `Bearer ${token}` }
            });

            const appointments = apptRes.data.data.appointments || [];

            // 3. Determine Doctor & Fee from TODAY'S Appointment
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
                // Scenario A: Found Appointment (This is relevant to the NEW entry)
                fromAppointment = true;
                doctorId = selectedAppointment.doctor_id?.toString() || '';
                doctorName = `Dr. ${selectedAppointment.doctor_first_name} ${selectedAppointment.doctor_last_name}`;

                const selectedDoc = doctors.find((d: any) => d.doctor_id === selectedAppointment.doctor_id);
                if (selectedDoc) {
                    consultationFee = selectedDoc.consultation_fee?.toString() || '';
                }
                console.log('✅ Auto-selected Doctor from Appointment:', doctorName);
            } else {
                console.log('❌ No appointment found. User must select doctor.');
            }

        } catch (error) {
            console.error('Error in selectPatient:', error);
        }

        setHasAppointment(fromAppointment);
        setAppointmentDoctorName(doctorName);
        setOpdForm({
            ...opdForm,
            full_name: `${patient.first_name} ${patient.last_name}`.trim(),
            first_name: patient.first_name,
            last_name: patient.last_name,
            age: patient.age?.toString() || '',
            gender: patient.gender || '',
            blood_group: patient.blood_group || '',
            contact_number: patient.contact_number || '',
            doctor_id: doctorId,
            consultation_fee: consultationFee,
            vital_signs: vitals,
            chief_complaint: '',
            symptoms: '',
            address_line_1: patient.address || '',
            address_line_2: patient.address_line2 || '',
            city: patient.city || '',
            state: patient.state || '',
            pincode: patient.pincode || ''
        });
        setSearchResults([]);
        setSearchQuery('');
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
            full_name: '',
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
            referral_doctor_name: '',
            address_line_1: '',
            address_line_2: '',
            city: '',
            state: '',
            pincode: ''
        });
        setSelectedPatient(null);
        setSearchQuery('');
        setSearchResults([]);
        setHasAppointment(false);
        setHasAppointment(false);
        setAppointmentDoctorName('');
        setEditingOpdId(null);
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
            full_name: `${entry.patient_first_name || ''} ${entry.patient_last_name || ''}`.trim(),
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



    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this OPD entry?')) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/opd/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchOpdEntries();
        } catch (error) {
            console.error('Error deleting entry:', error);
            alert('Failed to delete entry');
        } finally {
            setLoading(false);
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
                {/* Minimalist Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                <User className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Visits</span>
                        </div>
                        <p className="text-4xl font-bold text-slate-800">{opdEntries.length}</p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                                <Clock className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Waiting</span>
                        </div>
                        <p className="text-4xl font-bold text-slate-800">{opdEntries.filter((e: any) => e.visit_status !== 'Completed').length}</p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Completed</span>
                        </div>
                        <p className="text-4xl font-bold text-slate-800">{opdEntries.filter((e: any) => e.visit_status === 'Completed').length}</p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                                <FileText className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Doctors</span>
                        </div>
                        <p className="text-4xl font-bold text-slate-800">{doctors.length}</p>
                    </div>
                </div>
            </div>

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
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition font-bold shadow-lg shadow-slate-900/10 active:scale-95"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>

                {/* Neat & Intuitive Entry List */}
                <div className="space-y-4 px-1 pb-20">
                    <div className="hidden md:flex px-6 text-xs font-bold text-slate-400 uppercase tracking-widest pb-2">
                        <div className="w-[10%]">Token</div>
                        <div className="w-[25%]">Patient Details</div>
                        <div className="w-[20%]">Assigned Doctor</div>
                        <div className="w-[15%]">Timings</div>
                        <div className="w-[15%]">Status</div>
                        <div className="w-[15%] text-right">Payment</div>
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
                        opdEntries.map((entry: any) => (
                            <div
                                key={entry.opd_id}
                                className="group bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-300 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden"
                            >
                                {/* Left Accent Bar */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${entry.visit_status === 'Completed' ? 'bg-emerald-500' :
                                    entry.visit_status === 'In-consultation' ? 'bg-amber-500' :
                                        'bg-blue-500'
                                    }`}></div>

                                {/* Token & ID */}
                                <div className="w-full md:w-[10%] pl-4 flex flex-row md:flex-col items-center gap-4 md:gap-2">
                                    <div className="bg-blue-50 hover:bg-blue-100 transition-colors rounded-2xl border border-blue-100 h-16 w-16 flex flex-col items-center justify-center shadow-sm group-hover:scale-105 duration-300">
                                        <div className="text-[8px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">Token</div>
                                        <div className={`font-black text-blue-600 leading-none text-center px-1 break-words ${entry.token_number.toString().length > 5 ? 'text-xs' :
                                            entry.token_number.toString().length > 3 ? 'text-lg' : 'text-2xl'
                                            }`}>
                                            {entry.token_number}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleEditOpd(entry)}
                                        className="text-[10px] font-mono font-bold text-slate-400 hover:text-blue-600 hover:underline md:text-center block md:w-16"
                                    >
                                        #{entry.opd_number}
                                    </button>
                                </div>

                                {/* Patient Info */}
                                <div className="w-full md:w-[25%] flex items-center gap-4">
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
                                <div className="w-full md:w-[20%]">
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
                                <div className="w-full md:w-[15%]">
                                    <div className="flex flex-row md:flex-col gap-2 md:gap-0">
                                        <p className="text-sm font-bold text-slate-700">{entry.visit_time.slice(0, 5)}</p>
                                        <p className="text-xs text-slate-400 font-medium">{new Date(entry.visit_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                                    </div>
                                </div>

                                {/* Status Pills */}
                                <div className="w-full md:w-[15%] flex flex-wrap gap-2">
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

                                {/* Payment & Actions */}
                                <div className="w-full md:w-[15%] text-left md:text-right flex flex-row md:flex-col justify-between md:justify-center gap-4 md:gap-2">
                                    <div>
                                        <p className="font-mono text-sm font-bold text-slate-800">₹{entry.consultation_fee || '0'} <span className="text-[10px] text-slate-400 font-sans font-normal">INR</span></p>
                                        <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${entry.payment_status === 'Paid' ? 'text-emerald-500' : 'text-red-500'
                                            }`}>
                                            {entry.payment_status}
                                        </p>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(entry.opd_id); }}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                            title="Delete Entry"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
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

                            <form onSubmit={handleSubmit} className="p-8 space-y-8">
                                {/* Form Sections content... (Keep existing logic but styled) */}
                                {/* Patient Information Section */}
                                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <User className="w-4 h-4" /> Patient Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                        <div className="md:col-span-2 relative">
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number {opdForm.is_mlc ? '(Optional for MLC)' : '*'}</label>
                                            <input
                                                type="tel"
                                                required={!opdForm.is_mlc}
                                                value={opdForm.contact_number}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\D/g, "");
                                                    if (value.length <= 10) {
                                                        setOpdForm({ ...opdForm, contact_number: value });
                                                        checkPhoneMatches(value);
                                                    }
                                                }}
                                                disabled={!!selectedPatient}
                                                maxLength={10}
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium disabled:bg-slate-100 disabled:text-slate-500"
                                                placeholder="10-digit number"
                                                onBlur={() => {
                                                    // Small delay to allow clicking options
                                                    setTimeout(() => setShowPhoneDropdown(false), 200);
                                                }}
                                                onFocus={() => {
                                                    if (opdForm.contact_number.length === 10) checkPhoneMatches(opdForm.contact_number);
                                                }}
                                            />
                                            {/* Phone Lookup Dropdown */}
                                            {showPhoneDropdown && (
                                                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                    <div className="p-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Existing Patients Found</span>
                                                        <button type="button" onClick={() => setShowPhoneDropdown(false)} className="text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>
                                                    </div>
                                                    <div className="max-h-48 overflow-y-auto">
                                                        {phoneMatches.map((p) => (
                                                            <button
                                                                key={p.patient_id}
                                                                type="button"
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    selectPatient(p);
                                                                    setShowPhoneDropdown(false);
                                                                }}
                                                                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center justify-between group border-b border-slate-50 last:border-0"
                                                            >
                                                                <div>
                                                                    <p className="font-bold text-slate-800 text-sm group-hover:text-blue-700">{p.first_name} {p.last_name}</p>
                                                                    <p className="text-xs text-slate-500">{p.gender}, {p.age} yrs • ID: {p.patient_code}</p>
                                                                </div>
                                                                <div className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded group-hover:bg-blue-100 group-hover:text-blue-600">
                                                                    Select
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            console.log('Add New Clicked - Clearing Form');
                                                            setSelectedPatient(null);
                                                            setOpdForm(prev => ({
                                                                ...prev,
                                                                contact_number: prev.contact_number,
                                                                full_name: '', first_name: '', last_name: '',
                                                                age: '', gender: '', blood_group: '',
                                                                doctor_id: '', consultation_fee: '',
                                                                chief_complaint: '', symptoms: '',
                                                                vital_signs: { bp_systolic: '', bp_diastolic: '', pulse: '', temperature: '', weight: '', height: '', spo2: '', grbs: '' },
                                                                address_line_1: '', address_line_2: '', city: '', state: '', pincode: ''
                                                            }));
                                                            setShowPhoneDropdown(false);
                                                        }}
                                                        className="w-full text-left px-4 py-3 bg-blue-50/50 hover:bg-blue-100 text-blue-600 font-bold text-sm flex items-center gap-2 transition-colors border-t border-blue-100"
                                                    >
                                                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
                                                            <Plus className="w-3 h-3" />
                                                        </div>
                                                        Add New Patient
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="md:col-span-4">
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Name *</label>
                                            <input
                                                type="text"
                                                required
                                                value={opdForm.full_name || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const parts = val.split(' ');
                                                    const first = parts[0];
                                                    const last = parts.slice(1).join(' ');
                                                    setOpdForm({ ...opdForm, full_name: val, first_name: first, last_name: last });
                                                }}
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium disabled:bg-slate-100 disabled:text-slate-500"
                                                placeholder="e.g. John Doe"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Age *</label>
                                            <input type="number" required value={opdForm.age} onChange={(e) => setOpdForm({ ...opdForm, age: e.target.value })} disabled={!!selectedPatient} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium disabled:bg-slate-100 disabled:text-slate-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Gender *</label>
                                            <select required value={opdForm.gender} onChange={(e) => setOpdForm({ ...opdForm, gender: e.target.value })} disabled={!!selectedPatient} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium disabled:bg-slate-100 disabled:text-slate-500">
                                                <option value="">Select</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Pediatric">Pediatric</option>
                                                <option value="Other">Other</option>
                                            </select>
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

                                        {/* Address Fields */}
                                        <div className="md:col-span-6 grid grid-cols-1 md:grid-cols-6 gap-4 border-t border-slate-100 pt-4 mt-2">
                                            <div className="md:col-span-6">
                                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Address Details</label>
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Address Line 1</label>
                                                <input type="text" value={opdForm.address_line_1} onChange={(e) => setOpdForm({ ...opdForm, address_line_1: e.target.value })} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm" placeholder="House No, Street" />
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Address Line 2</label>
                                                <input type="text" value={opdForm.address_line_2} onChange={(e) => setOpdForm({ ...opdForm, address_line_2: e.target.value })} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm" placeholder="Area, Landmark" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">City</label>
                                                <input type="text" value={opdForm.city} onChange={(e) => setOpdForm({ ...opdForm, city: e.target.value })} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">State</label>
                                                <input type="text" value={opdForm.state} onChange={(e) => setOpdForm({ ...opdForm, state: e.target.value })} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pincode</label>
                                                <input type="text" value={opdForm.pincode} onChange={(e) => setOpdForm({ ...opdForm, pincode: e.target.value })} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm" />
                                            </div>
                                        </div>
                                    </div>
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
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Visit Type</label>
                                            <select value={opdForm.visit_type} onChange={(e) => setOpdForm({ ...opdForm, visit_type: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium">
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
                                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assign Doctor *</label>
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
                                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Referral Hospital *</label>
                                                    <input type="text" required value={opdForm.referral_hospital} onChange={(e) => setOpdForm({ ...opdForm, referral_hospital: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl" placeholder="Hospital Name" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Referral Doctor *</label>
                                                    <input type="text" required value={opdForm.referral_doctor_name} onChange={(e) => setOpdForm({ ...opdForm, referral_doctor_name: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl" placeholder="Doctor Name" />
                                                </div>
                                            </div>
                                        )}

                                        {/* MLC Fields */}
                                        {opdForm.is_mlc && (
                                            <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-red-50/50 p-4 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                                                <div>
                                                    <label className="block text-xs font-semibold text-red-800 mb-1.5">Attender Name *</label>
                                                    <input type="text" required value={opdForm.attender_name} onChange={(e) => setOpdForm({ ...opdForm, attender_name: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-red-800 mb-1.5">Attender Contact *</label>
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

                                {/* Complaint & Symptoms */}
                                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Clinical Notes</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                                                Chief Complaint <span className="text-blue-600 bg-blue-100 text-[10px] px-1 rounded">*</span>
                                            </label>
                                            <textarea
                                                required
                                                value={opdForm.chief_complaint}
                                                onChange={(e) => setOpdForm({ ...opdForm, chief_complaint: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium resize-none"
                                                rows={3}
                                                placeholder="Main reason for visit..."
                                            />
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
                                                <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
                                                <select value={opdForm.payment_status} onChange={(e) => setOpdForm({ ...opdForm, payment_status: e.target.value })} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium">
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
