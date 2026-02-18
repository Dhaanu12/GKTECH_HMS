import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Plus, Search, FileText, X, Save, User, Printer, Clock, AlertCircle, AlertTriangle, Calendar, Phone, ArrowRight, Bell, Sparkles, Activity, Users, ChevronLeft, ChevronDown, Check, Sun, CloudSun, Moon, Info, Filter } from 'lucide-react';
import { format } from 'date-fns';
import SearchableSelect from '../../../../components/ui/SearchableSelect';
import BillingModal from '../../../../components/billing/BillingModal';


// Interfaces
interface OpdFormState {
    first_name: string;
    last_name: string;
    age: string;
    gender: string;
    blood_group: string;
    contact_number: string;
    doctor_id: string;
    visit_date: string;
    visit_time: string;
    visit_type: string;
    // is_mlc: boolean;
    chief_complaint: string;
    symptoms: string;
    vital_signs: {
        bp_systolic: string;
        bp_diastolic: string;
        pulse: string;
        temperature: string;
        weight: string;
        height: string;
        spo2: string;
        grbs: string;
    };
    consultation_fee: string;
    payment_status: string;
    payment_method: string;
    is_mlc: boolean;
    mlc_remarks: string;
    attender_name: string;
    attender_contact_number: string;
    adhaar_number: string;
    referral_hospital: string;
    referral_doctor_name: string;
    address_line1: string;
    address_line2: string;
    city: string;
    state: string;
    pincode: string;
    appointment_id: string;
    patient_id?: number | null;
}

interface ConvertToOpdModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: any; // The appointment object to convert
    doctors: any[];
    branchDetails: any;
    todayOpdEntries: any[]; // For queue stats
    allAppointments: any[]; // For stats
    onSuccess?: () => void;
}

export default function ConvertToOpdModal({
    isOpen,
    onClose,
    appointment,
    doctors,
    branchDetails,
    todayOpdEntries,
    allAppointments,
    onSuccess
}: ConvertToOpdModalProps) {
    const [loading, setLoading] = useState(false);

    // Initial Form State
    const initialOpdFormState: OpdFormState = {
        first_name: '',
        last_name: '',
        age: '',
        gender: '',
        blood_group: '',
        contact_number: '',
        doctor_id: '',
        visit_type: 'Appointment',
        visit_date: format(new Date(), 'yyyy-MM-dd'),
        visit_time: format(new Date(), 'HH:mm'),
        chief_complaint: '',
        symptoms: '',
        vital_signs: {
            bp_systolic: '', bp_diastolic: '', pulse: '', temperature: '',
            weight: '', height: '', spo2: '', grbs: ''
        },
        consultation_fee: '0',
        payment_status: 'Pending',
        payment_method: 'Cash',
        is_mlc: false,
        mlc_remarks: '',
        attender_name: '',
        attender_contact_number: '',
        adhaar_number: '',
        referral_hospital: '',
        referral_doctor_name: '',
        address_line1: '', address_line2: '', city: '', state: '', pincode: '',
        appointment_id: '',
        patient_id: null
    };

    const [opdForm, setOpdForm] = useState<OpdFormState>(initialOpdFormState);
    const [selectedPatient, setSelectedPatient] = useState<any>(null); // For display/linking
    const [paymentChoice, setPaymentChoice] = useState<'PayNow' | 'PayLater'>('PayNow');

    // Billing Modal State
    const [showBillModal, setShowBillModal] = useState(false);
    const [billData, setBillData] = useState<any>(null);
    const [newOpdData, setNewOpdData] = useState<any>(null);

    // Search State (Unused for Convert to OPD but needed for logic consistency if we copied verbatim)
    const [modalSearchQuery, setModalSearchQuery] = useState('');
    const [modalSearchResults, setModalSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Metadata/Helpers
    const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
    const [showComplaintSuggestions, setShowComplaintSuggestions] = useState(false);
    const phoneInputRef = useRef<HTMLInputElement>(null);
    const [appointmentDoctorName, setAppointmentDoctorName] = useState('');
    const [hasAppointment, setHasAppointment] = useState(false);

    // Steps for Progress Indicator
    const [currentStep, setCurrentStep] = useState<'search' | 'newPatient' | 'visitDetails' | 'payment'>('visitDetails');
    const [completedSteps, setCompletedSteps] = useState<('search' | 'newPatient' | 'visitDetails' | 'payment')[]>(['search']);

    const commonComplaints = [
        'Fever', 'Cold & Cough', 'Body Pain', 'Headache', 'Stomach Pain',
        'Vomiting', 'Loose Motions', 'Chest Pain', 'Breathing Difficulty',
        'Back Pain', 'Joint Pain', 'Skin Rash', 'Weakness', 'Dizziness',
        'Throat Pain', 'Ear Pain', 'Eye Problem', 'Urinary Problem',
        'Blood Pressure Check', 'Diabetes Follow-up', 'General Checkup'
    ];

    // -- Populate Form on Mount/Change --
    useEffect(() => {
        if (isOpen && appointment) {
            initializeFromAppointment(appointment);
        }
    }, [isOpen, appointment]);

    const initializeFromAppointment = async (appt: any) => {
        setLoading(true);
        try {
            // Logic mirrored from selectPatient in dashboard
            const isLinked = !!appt.patient_id;
            let fullPatient = null;

            if (isLinked) {
                try {
                    const token = localStorage.getItem('token');
                    const response = await axios.get(`http://localhost:5000/api/patients/${appt.patient_id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    fullPatient = response.data.data.patient;
                    setSelectedPatient(fullPatient);
                } catch (error) {
                    console.error("Error fetching patient details:", error);
                    // Fallback to appointment data
                }
            }

            // Get doctor info
            let consultationFee = '0';
            let docId = '';
            if (appt.doctor_id) {
                const doc = doctors.find((d: any) => d.doctor_id === parseInt(appt.doctor_id));
                if (doc) {
                    consultationFee = doc.consultation_fee?.toString() || '0';
                    docId = doc.doctor_id.toString();
                    setAppointmentDoctorName(`Dr. ${doc.first_name} ${doc.last_name}`);
                }
            }
            if (appt.doctor_name) { // Fallback if doctor_id lookup fails or doctor_name provided directly
                setAppointmentDoctorName(appt.doctor_name);
            }
            setHasAppointment(true);

            // Prepare Form Data
            const patientData = fullPatient || appt;

            setOpdForm(prev => ({
                ...prev,
                first_name: patientData.first_name || '',
                last_name: patientData.last_name || '',
                age: patientData.age?.toString() || '',
                gender: patientData.gender || '',
                blood_group: patientData.blood_group || '',
                contact_number: patientData.contact_number || '',
                adhaar_number: patientData.aadhar_number || patientData.adhaar_number || '', // Handle varied spelling
                address_line1: patientData.address || '',
                address_line2: patientData.address_line2 || '',
                city: patientData.city || '',
                state: patientData.state || '',
                pincode: patientData.pincode || '',

                doctor_id: docId,
                visit_type: 'Appointment',
                consultation_fee: consultationFee,
                appointment_id: appt.appointment_id || '',
                patient_id: patientData.patient_id || null, // Ensure ID is passed if linked
                chief_complaint: appt.reason_for_visit || '',
                visit_date: format(new Date(), 'yyyy-MM-dd'),
                visit_time: format(new Date(), 'HH:mm'),
                is_mlc: false, // Convert to OPD implies standard visit usually?
            }));

            setPaymentChoice('PayNow'); // Default matches Dashboard
            setModalSearchQuery('');
            setModalSearchResults([]);
            setCurrentStep('visitDetails');
            setCompletedSteps(['search']);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // -- Dubplicate Check Logic --
    useEffect(() => {
        const checkDuplicate = async () => {
            // Need patient_id (from selectedPatient or form) and doctor_id + date
            const pId = opdForm.patient_id || selectedPatient?.patient_id;
            if (pId && opdForm.doctor_id) {
                try {
                    const token = localStorage.getItem('token');
                    const response = await axios.get('http://localhost:5000/api/opd/check-duplicate', {
                        params: {
                            patient_id: pId,
                            doctor_id: opdForm.doctor_id,
                            visit_date: opdForm.visit_date
                        },
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (response.data.exists) {
                        setDuplicateWarning(response.data.message);
                    } else {
                        setDuplicateWarning(null);
                    }
                } catch (error) {
                    console.error("Error checking duplicate:", error);
                }
            } else {
                setDuplicateWarning(null);
            }
        };

        const timeoutId = setTimeout(checkDuplicate, 500); // Debounce
        return () => clearTimeout(timeoutId);
    }, [opdForm.patient_id, selectedPatient, opdForm.doctor_id, opdForm.visit_date]);

    // Patient search (Behavioral fallback)
    useEffect(() => {
        if (!opdForm.contact_number || opdForm.contact_number.length < 10 || selectedPatient) {
            setModalSearchResults([]);
            return;
        }

        const debounceTimer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:5000/api/patients/search', {
                    params: { q: opdForm.contact_number },
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
    }, [opdForm.contact_number, selectedPatient]);

    // -- Helper Functions --

    const resetForm = () => {
        setOpdForm(initialOpdFormState);
        setSelectedPatient(null);
        setDuplicateWarning(null);
        setHasAppointment(false);
        setAppointmentDoctorName('');
        setPaymentChoice('PayLater');
    };

    const getDoctorAvailabilityInfo = (doctorId: number, dateStr: string) => {
        // Mock or simplified version if schedules prop is not fully available or reuse logic
        // For now, return 'available' since we are converting an *existing* appointment
        return { status: 'available', text: 'Scheduled' };
    };

    // Logic from dashboard/page.tsx
    const saveEntry = async () => {
        try {
            const token = localStorage.getItem('token');
            const payload = {
                ...opdForm,
                last_name: opdForm.last_name?.trim() || '.',
                // Prioritize opdForm.patient_id (which is populated from appointment)
                // Fallback to selectedPatient?.patient_id
                patient_id: opdForm.patient_id || selectedPatient?.patient_id,
                vital_signs: JSON.stringify(opdForm.vital_signs),
                consultation_fee: opdForm.consultation_fee || '0',
                mlc_fee: opdForm.is_mlc ? (branchDetails?.mlc_fee || '0') : '0',
                // Map frontend field names to backend expected names
                address_line_1: opdForm.address_line1,
                address_line_2: opdForm.address_line2,
                // Ensure appointment_id is explicitly passed if present
                appointment_id: opdForm.appointment_id
            };

            const response = await axios.post(`http://localhost:5000/api/opd`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data?.data?.opdEntry?.opd_id;
        } catch (error: any) {
            console.error('Error saving OPD entry:', error);
            alert(error.response?.data?.message || 'Failed to save OPD entry');
            throw error;
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const savedId = await saveEntry();
            if (savedId) {
                if (paymentChoice === 'PayNow') {
                    setNewOpdData(savedId);
                    await handlePrintBill(savedId);
                    // Don't close ConvertToOpdModal yet? 
                    // Dashboard logic says: 
                    // setShowModal(false);
                    // But here we want to show Billing Modal. 
                    // If BillingModal is rendered *outside* or *on top*, we can close this one.
                    // But if we close this one, we lose context if BillingModal is child.
                    // BillingModal is usually a portal or fixed overlay. 
                    // We can close this modal, and let BillingModal handle the rest.
                    // But wait, where is BillingModal rendered?
                    // In Dashboard, it's rendered at the end of the page. 
                    // Here, we render it inside this component's return? 
                    // If we close this component (isOpen=false), BillingModal (child) will unmount!
                    // So we must KEEP this modal open, or move BillingModal to parent.
                    // Creating a reusable component means better to keep it here.
                    // So we hide *content* of this modal, or just keep it open under the billing modal?
                    // Let's keep it open, but maybe `onClose` triggers `onSuccess`.

                    // Actually, if we close `isOpen`, the whole component unmounts.
                    // So we cannot close it if BillingModal is inside.
                    // We should probably rely on the parent to handle visibility using `onClose`.
                    // But `handleSubmit` calls `setShowModal(false)` in Dashboard.
                    // In Dashboard, BillingModal is a sibling of the NewOpdModal.

                    // Here, I will render BillingModal *inside* ConvertToOpdModal?
                    // If I do that, closing ConvertToOpdModal closes BillingModal.
                    // So I should NOT close ConvertToOpdModal until BillingModal is closed.

                    // Strategy: 
                    // 1. Submit -> Success.
                    // 2. Open BillingModal (set state).
                    // 3. User finishes Billing -> Close BillingModal.
                    // 4. Then Close ConvertToOpdModal and call onSuccess.

                } else {
                    // Pay Later
                    onClose();
                    if (onSuccess) onSuccess();
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAndPrint = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!opdForm.is_mlc && (!opdForm.first_name || !opdForm.contact_number || !opdForm.gender)) {
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
                setNewOpdData(savedId);
                await handlePrintBill(savedId);
                // Same logic as above: Wait for BillingModal
            }
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const isPatientDetailsLocked = !!opdForm.patient_id && (!opdForm.is_mlc || (!!opdForm.contact_number && opdForm.contact_number.length >= 10));

    const isRegisterDisabled = loading || !!duplicateWarning || !opdForm.doctor_id || (
        opdForm.is_mlc
            ? (!!opdForm.contact_number && opdForm.contact_number.length > 0 && opdForm.contact_number.length < 10)
            : (!selectedPatient && (!opdForm.first_name || !opdForm.age || !opdForm.gender || !opdForm.contact_number || opdForm.contact_number.length < 10))
    );


    // UI Helpers copied or simplified
    const handleClearPatient = () => {
        setOpdForm(prev => ({
            ...prev,
            patient_id: null,
            first_name: '', last_name: '', age: '', gender: '', contact_number: '',
            blood_group: '', adhaar_number: '', address_line1: '', address_line2: '',
            city: '', state: '', pincode: ''
        }));
        setSelectedPatient(null);
    };

    const handleDropdownSelect = (patient: any) => {
        // Should not be needed for Convert to OPD as we pre-select, but keeping for completeness if user clears and searches
        setSelectedPatient(patient);
        setOpdForm(prev => ({
            ...prev,
            patient_id: patient.patient_id,
            first_name: patient.first_name,
            last_name: patient.last_name,
            age: patient.age?.toString(),
            gender: patient.gender,
            contact_number: patient.contact_number,
            blood_group: patient.blood_group || '',
            adhaar_number: patient.aadhar_number || '',
            address_line1: patient.address || '',
            city: patient.city || '',
            pincode: patient.pincode || ''
        }));
        setModalSearchQuery('');
        setModalSearchResults([]);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
                    {/* Modal Header */}
                    <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur z-10 rounded-t-3xl">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-blue-600" />
                                New OPD Entry
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
                                    onClick={handleSaveAndPrint}
                                    disabled={isRegisterDisabled}
                                    className={`flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg transition text-sm font-bold ${isRegisterDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-200'}`}
                                >
                                    <Printer className="w-4 h-4" />
                                    Save & Print
                                </button>
                            )}
                            <button
                                onClick={() => { onClose(); resetForm(); }}
                                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Progress Indicator - 1:1 Dashboard Parity */}
                    <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-100">
                        {(() => {
                            // Define completion checks (Dashboard parity)
                            const step1Complete = selectedPatient
                                ? true
                                : (opdForm.first_name && opdForm.age && opdForm.gender &&
                                    (opdForm.is_mlc || opdForm.contact_number?.length === 10));

                            const step2FieldsComplete = opdForm.doctor_id; // Dashboard logic is visit_type && doctor_id, we default visit_type to 'Appointment'
                            const step2Complete = step1Complete && step2FieldsComplete;

                            const step3FieldsComplete = opdForm.consultation_fee && opdForm.consultation_fee !== '0';
                            const step3Complete = step2Complete && step3FieldsComplete;

                            return (
                                <div className="flex items-center justify-between max-w-2xl mx-auto">
                                    {/* Step 1: Patient */}
                                    <div className="flex items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step1Complete ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-white border-2 border-slate-200 text-slate-400'}`}>
                                            {step1Complete ? <Check className="w-4 h-4" /> : '1'}
                                        </div>
                                        <div className={`ml-3 text-xs font-bold uppercase tracking-wider ${step1Complete ? 'text-emerald-600' : 'text-slate-400'}`}>Patient</div>
                                    </div>

                                    {/* Connector */}
                                    <div className={`flex-1 mx-4 h-0.5 rounded-full transition-all duration-500 ${step2Complete ? 'bg-emerald-500' : 'bg-slate-200'}`} />

                                    {/* Step 2: Visit */}
                                    <div className="flex items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step2Complete ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : (step1Complete ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-2 border-slate-200 text-slate-400')}`}>
                                            {step2Complete ? <Check className="w-4 h-4" /> : '2'}
                                        </div>
                                        <div className={`ml-3 text-xs font-bold uppercase tracking-wider ${step2Complete ? 'text-emerald-600' : (step1Complete ? 'text-blue-600' : 'text-slate-400')}`}>Visit</div>
                                    </div>

                                    {/* Connector */}
                                    <div className={`flex-1 mx-4 h-0.5 rounded-full transition-all duration-500 ${step3Complete ? 'bg-emerald-500' : 'bg-slate-200'}`} />

                                    {/* Step 3: Billing */}
                                    <div className="flex items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step3Complete ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : (step2Complete ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-2 border-slate-200 text-slate-400')}`}>
                                            {step3Complete ? <Check className="w-4 h-4" /> : '3'}
                                        </div>
                                        <div className={`ml-3 text-xs font-bold uppercase tracking-wider ${step3Complete ? 'text-emerald-600' : (step2Complete ? 'text-blue-600' : 'text-slate-400')}`}>Billing</div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Content - Copied exactly from dashboard */}
                    <form onSubmit={handleSubmit} className="p-5 space-y-7">
                        {/* Patient Information Section */}
                        <div className="bg-gradient-to-br from-blue-50/30 to-slate-50/50 p-6 rounded-2xl border border-blue-100/60 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-[15px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <User className="w-4 h-4 text-blue-500" /> Patient Details
                                </h3>
                                {/* Clear Patient - Only if manually editable/search enabled (hidden for Convert?) 
                                 Dashboard hides search if selectedPatient is set, but shows form fields.
                             */}
                            </div>

                            {/* Patient Form Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                {/* Row 1: Phone Number | Name */}
                                <div className="md:col-span-2 relative">
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                                    <input
                                        ref={phoneInputRef}
                                        type="tel"
                                        required={!opdForm.is_mlc}
                                        value={opdForm.contact_number}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, "");
                                            if (value.length <= 10) {
                                                setOpdForm({ ...opdForm, contact_number: value });
                                            }
                                        }}
                                        maxLength={10}
                                        className={`w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium ${isPatientDetailsLocked ? 'bg-slate-50 cursor-not-allowed text-slate-600' : ''}`}
                                        placeholder="10-digit number"
                                        disabled={isPatientDetailsLocked}
                                    />
                                    {/* Search Results Dropdown - 1:1 Dashboard Parity */}
                                    {modalSearchResults.length > 0 && !selectedPatient && (
                                        <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider tabular-nums">{modalSearchResults.length} Patients Found</span>
                                                <Sparkles className="w-3 h-3 text-blue-400" />
                                            </div>
                                            <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
                                                {modalSearchResults.map((patient) => (
                                                    <button
                                                        key={patient.patient_id}
                                                        type="button"
                                                        onClick={() => handleDropdownSelect(patient)}
                                                        className="w-full px-4 py-3 text-left hover:bg-blue-50/50 transition-colors flex items-center justify-between group border-b border-slate-50 last:border-0"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                                {patient.first_name[0]}{patient.last_name?.[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-700 text-sm group-hover:text-blue-700 transition-colors">{patient.first_name} {patient.last_name}</p>
                                                                <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 capitalize">
                                                                    <span className="text-blue-500/70">{patient.mrn_number}</span>
                                                                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                                    {patient.gender} • {patient.age}y
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className={`md:col-span-4 ${((opdForm.contact_number.length < 10) && !selectedPatient && !opdForm.is_mlc) || (!!selectedPatient && !!selectedPatient.contact_number) ? 'cursor-not-allowed' : ''}`}>
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required={!opdForm.is_mlc}
                                        value={opdForm.first_name + (opdForm.last_name ? ' ' + opdForm.last_name : '')}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const parts = val.split(' ');
                                            const first = parts[0];
                                            const last = parts.slice(1).join(' ');
                                            setOpdForm({ ...opdForm, first_name: first, last_name: last });
                                        }}
                                        disabled={isPatientDetailsLocked}
                                        className={`w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium ${isPatientDetailsLocked ? 'bg-slate-50/80 text-slate-900 font-bold cursor-not-allowed border-slate-300' : ''}`}
                                        placeholder="e.g. John Doe"
                                    />
                                </div>

                                {/* Row 2: Age | Gender | Blood Group | Aadhaar */}
                                <div className={isPatientDetailsLocked ? 'cursor-not-allowed' : ''}>
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Age <span className="text-red-500">*</span></label>
                                    <input
                                        type="number"
                                        required={!opdForm.is_mlc}
                                        min="1"
                                        max="110"
                                        value={opdForm.age}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 110)) {
                                                setOpdForm({ ...opdForm, age: val });
                                            } else if (parseInt(val) > 110) {
                                                setOpdForm({ ...opdForm, age: '110' });
                                            }
                                        }}
                                        disabled={isPatientDetailsLocked}
                                        className={`w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium ${isPatientDetailsLocked ? 'bg-slate-50/80 text-slate-900 font-bold cursor-not-allowed border-slate-300' : ''}`}
                                        placeholder="1-110"
                                    />
                                </div>
                                <div className={!!selectedPatient ? 'cursor-not-allowed' : ''}>
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Gender <span className="text-red-500">*</span></label>
                                    <select
                                        required={!opdForm.is_mlc}
                                        value={opdForm.gender}
                                        onChange={(e) => setOpdForm({ ...opdForm, gender: e.target.value })}
                                        disabled={isPatientDetailsLocked}
                                        className={`w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium ${isPatientDetailsLocked ? 'bg-slate-50/80 text-slate-900 font-bold cursor-not-allowed border-slate-300' : ''}`}
                                    >
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Pediatric">Pediatric</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                {/* Blood Group & Aadhaar */}
                                <div className={`md:col-span-2 ${!!selectedPatient ? 'cursor-not-allowed' : ''}`}>
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Blood Group</label>
                                    <select
                                        value={opdForm.blood_group}
                                        onChange={(e) => setOpdForm({ ...opdForm, blood_group: e.target.value })}
                                        disabled={isPatientDetailsLocked}
                                        className={`w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium ${isPatientDetailsLocked ? 'bg-slate-50/80 text-slate-900 font-bold cursor-not-allowed border-slate-300' : ''}`}
                                    >
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
                                <div className={`md:col-span-2 ${!!selectedPatient ? 'cursor-not-allowed' : ''}`}>
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Aadhaar Number</label>
                                    <input
                                        type="text"
                                        value={opdForm.adhaar_number}
                                        onChange={(e) => setOpdForm({ ...opdForm, adhaar_number: e.target.value.replace(/\D/g, "") })}
                                        maxLength={12}
                                        disabled={isPatientDetailsLocked}
                                        className={`w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium ${isPatientDetailsLocked ? 'bg-slate-50/80 text-slate-900 font-bold cursor-not-allowed border-slate-300' : ''}`}
                                    />
                                </div>

                                {/* Address Details */}
                                <div className={`md:col-span-6 mt-4 ${!!selectedPatient ? 'cursor-not-allowed' : ''}`}>
                                    <h4 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-3">ADDRESS DETAILS</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Address Line 1</label>
                                            <input
                                                type="text"
                                                value={opdForm.address_line1}
                                                onChange={(e) => setOpdForm({ ...opdForm, address_line1: e.target.value })}
                                                className={`w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium ${!!selectedPatient ? 'bg-slate-50/80 text-slate-900 font-bold cursor-not-allowed border-slate-300' : ''}`}
                                                disabled={!!selectedPatient}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Address Line 2</label>
                                            <input
                                                type="text"
                                                value={opdForm.address_line2}
                                                onChange={(e) => setOpdForm({ ...opdForm, address_line2: e.target.value })}
                                                className={`w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium ${!!selectedPatient ? 'bg-slate-50/80 text-slate-900 font-bold cursor-not-allowed border-slate-300' : ''}`}
                                                disabled={!!selectedPatient}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                                        <div>
                                            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">City</label>
                                            <input
                                                type="text"
                                                value={opdForm.city}
                                                onChange={(e) => setOpdForm({ ...opdForm, city: e.target.value })}
                                                className={`w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium ${!!selectedPatient ? 'bg-slate-50/80 text-slate-900 font-bold cursor-not-allowed border-slate-300' : ''}`}
                                                disabled={!!selectedPatient}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">State</label>
                                            <input
                                                type="text"
                                                value={opdForm.state}
                                                onChange={(e) => setOpdForm({ ...opdForm, state: e.target.value })}
                                                className={`w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium ${!!selectedPatient ? 'bg-slate-50/80 text-slate-900 font-bold cursor-not-allowed border-slate-300' : ''}`}
                                                disabled={!!selectedPatient}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Pincode</label>
                                            <input
                                                type="text"
                                                value={opdForm.pincode}
                                                onChange={(e) => setOpdForm({ ...opdForm, pincode: e.target.value.replace(/\D/g, "") })}
                                                className={`w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium ${!!selectedPatient ? 'bg-slate-50/80 text-slate-900 font-bold cursor-not-allowed border-slate-300' : ''}`}
                                                disabled={!!selectedPatient}
                                                maxLength={6}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Visit Details Section */}
                        <div className="bg-gradient-to-br from-indigo-50/30 to-slate-50/50 p-6 rounded-2xl border border-indigo-100/60 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-[15px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-indigo-500" /> Visit Information
                                </h3>
                                <div className="flex gap-3">
                                    <input
                                        type="date"
                                        value={opdForm.visit_date}
                                        onChange={(e) => setOpdForm({ ...opdForm, visit_date: e.target.value })}
                                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all"
                                    />
                                    <input
                                        type="time"
                                        value={opdForm.visit_time}
                                        onChange={(e) => setOpdForm({ ...opdForm, visit_time: e.target.value })}
                                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                                {/* MLC Toggle - Hidden for Convert to OPD (Behavioral Parity) */}
                                {opdForm.is_mlc && (
                                    <div className="md:col-span-12 flex items-center gap-3 bg-red-50/80 p-4 rounded-xl border border-red-200/60 animate-in fade-in slide-in-from-top-2 mb-2 shadow-sm">
                                        <div className="w-5 h-5 bg-red-600 rounded flex items-center justify-center text-white">
                                            <Check className="w-4 h-4" />
                                        </div>
                                        <label className="text-[15px] font-bold text-red-800 cursor-default select-none">
                                            Medical Legal Case (MLC) Enabled
                                        </label>
                                    </div>
                                )}
                                <div className="md:col-span-4 lg:col-span-4">
                                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Visit Type <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select
                                            required
                                            value={opdForm.visit_type}
                                            onChange={(e) => setOpdForm({ ...opdForm, visit_type: e.target.value })}
                                            className="w-full px-4 h-[52px] text-sm bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-700 appearance-none cursor-pointer"
                                        >
                                            <option value="Walk-in">Walk-in</option>
                                            <option value="Appointment">Appointment</option>
                                            <option value="Follow-up">Follow-up</option>
                                            <option value="Emergency">Emergency</option>
                                            <option value="Referral">Referral</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                                            <ChevronDown className="w-4 h-4 ml-1" />
                                        </div>
                                    </div>

                                    {/* Clinical Hours Warning */}
                                    {(() => {
                                        if (!branchDetails?.clinic_schedule || !opdForm.visit_time) return null;

                                        let schedule = branchDetails.clinic_schedule;
                                        if (typeof schedule === 'string') {
                                            try { schedule = JSON.parse(schedule); } catch (e) { return null; }
                                        }

                                        if (schedule?.startTime && schedule?.endTime) {
                                            const visitTime = opdForm.visit_time;
                                            const startTime = schedule.startTime;
                                            const endTime = schedule.endTime;

                                            if (visitTime < startTime || visitTime > endTime) {
                                                return (
                                                    <div className="mt-2 flex items-start gap-1 text-amber-600 text-xs font-medium bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                                                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                                        <span>Outside Clinical Hours ({startTime} - {endTime})</span>
                                                    </div>
                                                );
                                            }
                                        }
                                        return null;
                                    })()}
                                </div>

                                <div className="md:col-span-8 lg:col-span-8">
                                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Assigned Doctor</label>
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 h-[52px] flex items-center">
                                        <p className="font-bold text-slate-800 text-sm">
                                            {appointmentDoctorName}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Clinical Notes (Complaint & Symptoms) - Always show */}
                        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
                            <h3 className="text-[15px] font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" /> Clinical Notes</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Chief Complaint</label>
                                    <textarea
                                        value={opdForm.chief_complaint}
                                        onChange={(e) => setOpdForm({ ...opdForm, chief_complaint: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium resize-none"
                                        rows={2}
                                        onFocus={() => setShowComplaintSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowComplaintSuggestions(false), 200)}
                                    />
                                    {/* Quick Suggestions */}
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {commonComplaints
                                            .filter(c => !opdForm.chief_complaint || c.toLowerCase().includes(opdForm.chief_complaint.toLowerCase()) || showComplaintSuggestions)
                                            .slice(0, showComplaintSuggestions ? 21 : 6)
                                            .map((complaint) => (
                                                <button
                                                    key={complaint}
                                                    type="button"
                                                    onClick={() => {
                                                        const current = opdForm.chief_complaint || '';
                                                        const isSelected = current.split(', ').some(c => c.trim() === complaint);
                                                        let newValue;
                                                        if (isSelected) {
                                                            newValue = current.split(', ').filter(c => c.trim() !== complaint).join(', ');
                                                        } else {
                                                            newValue = current ? current + ', ' + complaint : complaint;
                                                        }
                                                        setOpdForm({ ...opdForm, chief_complaint: newValue });
                                                    }}
                                                    className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${opdForm.chief_complaint?.includes(complaint) ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-slate-600 border-slate-200'}`}
                                                >
                                                    {complaint}
                                                </button>
                                            ))
                                        }
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Symptoms</label>
                                    <textarea
                                        value={opdForm.symptoms}
                                        onChange={(e) => setOpdForm({ ...opdForm, symptoms: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium resize-none"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Vitals - Copied */}
                        <div className="bg-gradient-to-br from-purple-50/40 to-violet-50/30 p-6 rounded-2xl border border-purple-100/60 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
                            <h3 className="text-[15px] font-bold text-purple-500 uppercase tracking-wider mb-4 flex items-center gap-2"><Activity className="w-4 h-4" /> Vital Signs</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                                {['bp_systolic', 'bp_diastolic', 'pulse', 'temperature', 'weight', 'height', 'spo2', 'grbs'].map(key => (
                                    <div key={key}>
                                        <label className="block text-sm font-bold text-purple-600/80 mb-1">
                                            {key.replace('bp_', 'BP ').replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                        </label>
                                        <input
                                            type="text"
                                            value={(opdForm.vital_signs as any)[key]}
                                            onChange={(e) => setOpdForm({ ...opdForm, vital_signs: { ...opdForm.vital_signs, [key]: e.target.value } })}
                                            className="w-full px-3 py-2 bg-white border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Payment Section */}
                        <div className="bg-gradient-to-br from-emerald-50/30 to-slate-50/50 p-6 rounded-2xl border border-emerald-100/60 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] flex justify-between items-end">
                            <div>
                                <h3 className="text-[15px] font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">Payment Details</h3>
                                <div className="flex gap-4 items-end">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-500 mb-1">Consultation Fee</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                                            <input
                                                type="number"
                                                value={opdForm.consultation_fee}
                                                readOnly
                                                className="w-32 pl-7 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                    {opdForm.is_mlc && (
                                        <div className="animate-in fade-in slide-in-from-left-2">
                                            <label className="block text-sm font-semibold text-red-600 mb-1">MLC Fee</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                                                <input
                                                    type="text"
                                                    value={branchDetails?.mlc_fee || '0'}
                                                    disabled
                                                    className="w-24 pl-7 pr-3 py-2 bg-red-50 border border-red-100 rounded-lg text-sm font-bold text-red-700 cursor-not-allowed"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-sm font-semibold text-slate-500 mb-1">Payment Preference <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <select
                                                value={paymentChoice}
                                                onChange={(e) => {
                                                    const val = e.target.value as 'PayNow' | 'PayLater';
                                                    setPaymentChoice(val);
                                                    setOpdForm(prev => ({ ...prev, payment_status: val === 'PayNow' ? 'Paid' : 'Pending' }));
                                                }}
                                                className="w-full pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                                            >
                                                <option value="PayNow">Pay Now</option>
                                                <option value="PayLater">Pay Later</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                                                <ChevronDown className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right bg-white/60 px-5 py-3 rounded-xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Fee</p>
                                <p className="text-3xl font-extrabold text-slate-800">
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

                        {/* Footer Actions */}
                        <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between">
                            {/* Duplicate Warning Message - 1:1 Dashboard Parity */}
                            <div className="flex-1 mr-4">
                                {duplicateWarning && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-100 animate-in fade-in slide-in-from-left-2">
                                        <AlertCircle size={14} />
                                        {duplicateWarning}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => { onClose(); resetForm(); }}
                                    className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isRegisterDisabled}
                                    className={`px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all font-bold flex items-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${isRegisterDisabled ? 'from-slate-400 to-slate-500 hover:shadow-none' : ''}`}
                                >
                                    {loading ? 'Saving...' : 'Register Visit'}
                                </button>
                            </div>
                        </div>

                    </form>
                </div>
            </div>

            {/* Billing Modal - Rendered here */}
            <BillingModal
                isOpen={showBillModal}
                onClose={() => {
                    setShowBillModal(false);
                    onClose(); // Close parent modal only when billing is done
                    if (onSuccess) onSuccess();
                }}
                opdData={billData}
                onSuccess={() => {
                    // Payment successful
                }}
            />
        </>
    );
}
