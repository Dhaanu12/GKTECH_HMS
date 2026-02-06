'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, User, Stethoscope, Activity, Plus, Trash2, Phone, MapPin, Calendar, Clock, Loader2, Mic, Sparkles, Play, Pause, Layout, History as HistoryIcon, FileBadge, CheckCircle, XCircle, Info, X } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function PatientDetails() {
    const params = useParams();
    const router = useRouter();
    const [patient, setPatient] = useState<any>(null);
    const [opdHistory, setOpdHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [showConsultationForm, setShowConsultationForm] = useState(false);
    const [consultationData, setConsultationData] = useState({
        diagnosis: '',
        notes: '',
        labs: [] as { test_name: string; lab_name: string }[],
        medications: [] as any[],
        next_visit_date: '',
        next_visit_status: 'Follow-up Required',
        referral_doctor_id: '',
        referral_notes: ''
    });
    const [selectedReferralHospital, setSelectedReferralHospital] = useState('');
    const [newMedication, setNewMedication] = useState({
        name: '', dosage: '', frequency: '', duration: '',
        morning: false, noon: false, night: false,
        food_timing: 'After Food'
    });
    const [newLab, setNewLab] = useState({ test_name: '', lab_name: '' });

    const [consultationHistory, setConsultationHistory] = useState<any[]>([]);
    const [referralDoctors, setReferralDoctors] = useState<any[]>([]);
    const [referralHospitals, setReferralHospitals] = useState<any[]>([]);

    // MLC State
    const [showMlcModal, setShowMlcModal] = useState(false);
    const [mlcData, setMlcData] = useState({
        police_station: '',
        police_station_district: '',
        brought_by: '',
        history_alleged: '',
        injury_description: '',
        nature_of_injury: 'Simple'
    });
    const [existingMlc, setExistingMlc] = useState<any>(null);

    // Wound Certificate State
    const [showWoundCertModal, setShowWoundCertModal] = useState(false);
    const [woundCertData, setWoundCertData] = useState({
        incident_date_time: '',
        alleged_cause: '',
        history_alleged: '',
        examination_findings: '',
        nature_of_injury: 'Simple',
        danger_to_life: 'No',
        age_of_injuries: '',
        treatment_given: '',
        remarks: ''
    });

    // Death Certificate State
    const [showDeathCertModal, setShowDeathCertModal] = useState(false);
    const [deathCertData, setDeathCertData] = useState({
        date_of_death: '',
        time_of_death: '',
        declared_dead_by: '',
        cause_of_death: '',
        death_circumstances: '',
        is_death_mlc: false,
        death_police_station: '',
        death_police_district: '',
        post_mortem_required: false,
        relatives_name: '',
        relatives_number: '',
        relatives_notified_at: ''
    });
    const [isPatientDeceased, setIsPatientDeceased] = useState(false);
    const [isReferralExpanded, setIsReferralExpanded] = useState(false);
    const [isAiListening, setIsAiListening] = useState(false);
    const [isReviewMode, setIsReviewMode] = useState(false);

    // Template Selector State

    // Lab Search State
    const [labSearchResults, setLabSearchResults] = useState<any[]>([]);
    const [showLabDropdown, setShowLabDropdown] = useState(false);
    const [isSearchingLabs, setIsSearchingLabs] = useState(false);

    // Custom Alert Modal State
    const [showAlert, setShowAlert] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        type: 'success' | 'error' | 'info';
        title: string;
        message: string;
    }>({
        type: 'success',
        title: '',
        message: ''
    });

    // Custom Alert Function
    const showCustomAlert = (type: 'success' | 'error' | 'info', title: string, message: string) => {
        setAlertConfig({ type, title, message });
        setShowAlert(true);
    };


    const handleToggleDeceased = (checked: boolean) => {
        setIsPatientDeceased(checked);
        if (checked) {
            setDeathCertData({
                date_of_death: patient.date_of_death ? new Date(patient.date_of_death).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                time_of_death: patient.time_of_death || new Date().toTimeString().slice(0, 5),
                declared_dead_by: patient.declared_dead_by || (() => {
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    const name = user.username ? `Dr. ${user.username}` : 'Dr.';
                    const regNo = user.registration_number ? ` (Reg. No: ${user.registration_number})` : '';
                    return `${name}${regNo}`;
                })(),
                cause_of_death: patient.cause_of_death || '',
                death_circumstances: patient.death_circumstances || '',
                is_death_mlc: patient.is_death_mlc || false,
                death_police_station: patient.death_police_station || (existingMlc?.police_station || ''),
                death_police_district: patient.death_police_district || (existingMlc?.police_station_district || ''),
                post_mortem_required: patient.post_mortem_required || false,
                relatives_name: patient.relatives_name || '',
                relatives_number: patient.relatives_number || '',
                relatives_notified_at: patient.relatives_notified_at ? new Date(patient.relatives_notified_at).toISOString().slice(0, 16) : ''
            });
        }
    };


    useEffect(() => {
        if (params.id) {
            fetchPatientDetails();
            fetchReferralData();
        }
    }, [params.id]);

    const fetchPatientDetails = async () => {
        setIsReviewMode(false);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            // Verify params.id exists before making requests
            if (!params.id) return;

            const [patientRes, opdRes, consultRes] = await Promise.all([
                axios.get(`${API_URL}/patients/${params.id}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/opd/patient/${params.id}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/consultations/patient/${params.id}`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            setPatient(patientRes.data.data.patient);
            setOpdHistory(opdRes.data.data.opdHistory || []);
            setConsultationHistory(consultRes.data.data.consultations || []);

            // Check for completed visit to hide placeholder
            const history = opdRes.data.data.opdHistory || [];
            const activeVisit = history.find((opd: any) => ['Registered', 'In-consultation'].includes(opd.visit_status));

            if (!activeVisit) {
                const today = new Date().toDateString();
                const todaysCompleted = history.find((opd: any) =>
                    opd.visit_status === 'Completed' && new Date(opd.visit_date).toDateString() === today
                );
                if (todaysCompleted) {
                    setIsReviewMode(true);
                }
            }



            const p = patientRes.data.data.patient;
            if (p && p.is_deceased) {
                setIsPatientDeceased(true);
                setDeathCertData({
                    date_of_death: p.date_of_death ? new Date(p.date_of_death).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    time_of_death: p.time_of_death || new Date().toTimeString().slice(0, 5),
                    declared_dead_by: p.declared_dead_by || `Dr. ${JSON.parse(localStorage.getItem('user') || '{}').first_name || ''} ${JSON.parse(localStorage.getItem('user') || '{}').last_name || ''}`,
                    cause_of_death: p.cause_of_death || '',
                    death_circumstances: p.death_circumstances || '',
                    is_death_mlc: p.is_death_mlc || false,
                    death_police_station: p.death_police_station || '',
                    death_police_district: p.death_police_district || '',
                    post_mortem_required: p.post_mortem_required || false,
                    relatives_name: p.relatives_name || '',
                    relatives_number: p.relatives_number || '',
                    relatives_notified_at: p.relatives_notified_at ? new Date(p.relatives_notified_at).toISOString().slice(0, 16) : ''
                });
            }
        } catch (error: any) {
            console.error('Error fetching patient details:', error);
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                router.push('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchReferralData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const [hospitalsRes, doctorsRes] = await Promise.all([
                axios.get(`${API_URL}/referrals/hospitals?mapped_only=true`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/referrals/doctors`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setReferralHospitals(hospitalsRes.data.data.referralHospitals || []);
            setReferralDoctors(doctorsRes.data.data.referralDoctors || []);
        } catch (error: any) {
            console.error('Error fetching referral data:', error);
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                router.push('/login');
            }
        }
    };

    const loadDraft = async (opdId: number) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await axios.get(`${API_URL}/consultations/draft/${opdId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.data.draft) {
                const draft = response.data.data.draft;
                setConsultationData({
                    diagnosis: draft.diagnosis || '',
                    notes: draft.notes || '',
                    labs: draft.labs || [],
                    medications: draft.medications || [],
                    next_visit_date: draft.next_visit_date ? draft.next_visit_date.split('T')[0] : '',
                    next_visit_status: draft.next_visit_status || 'Follow-up Required',
                    referral_doctor_id: draft.referral_doctor_id ? String(draft.referral_doctor_id) : '',
                    referral_notes: draft.referral_notes || ''
                });
            }
        } catch (error: any) {
            console.error('Error loading draft:', error);
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                router.push('/login');
            }
        }
    };

    const fetchMlcDetails = async (opdId: number) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/mlc/opd/${opdId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.data.exists) {
                const mlc = response.data.data.mlc;
                setExistingMlc(mlc);
                setMlcData({
                    police_station: mlc.police_station || '',
                    police_station_district: mlc.police_station_district || '',
                    brought_by: mlc.brought_by || '',
                    history_alleged: mlc.history_alleged || '',
                    injury_description: mlc.injury_description || '',
                    nature_of_injury: mlc.nature_of_injury || 'Simple'
                });
            } else {
                setExistingMlc(null);
                if (response.data.data.suggestedData) {
                    setMlcData(prev => ({
                        ...prev,
                        brought_by: response.data.data.suggestedData.brought_by || ''
                    }));
                }
            }
            setShowMlcModal(true);
        } catch (error) {
            console.error('Error fetching MLC details:', error);
            alert('Failed to fetch MLC details');
        }
    };

    const handleSaveMlc = async () => {
        try {
            const token = localStorage.getItem('token');
            // Try to find any active or completed MLC OPD
            const activeOpd = opdHistory.find(opd => ['Registered', 'In-consultation', 'Completed'].includes(opd.visit_status) && opd.is_mlc);

            if (!activeOpd) {
                alert('No active MLC OPD visit found.');
                return;
            }

            const payload = {
                opd_id: activeOpd.opd_id,
                patient_id: patient.patient_id,
                ...mlcData
            };

            const response = await axios.post(`${API_URL}/mlc`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setExistingMlc(response.data.data.mlc);
            showCustomAlert('success', 'Success!', 'MLC Certificate saved successfully!');
        } catch (error) {
            console.error('Error saving MLC:', error);
            showCustomAlert('error', 'Error', 'Failed to save MLC details. Please try again.');
        }
    };

    const handlePrintMlc = () => {
        if (!existingMlc || !patient) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>MLC Certificate - ${existingMlc.mlc_number}</title>
                <style>
                    body { font-family: 'Times New Roman', serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.5; color: #000; }
                    .header { text-align: center; margin-bottom: 40px; }
                    .header h2 { margin: 0; font-size: 18px; font-weight: bold; text-decoration: underline; text-transform: uppercase; }
                    .meta-info { margin-bottom: 30px; }
                    .meta-line { margin-bottom: 5px; }
                    .subject { font-weight: bold; text-decoration: underline; margin: 20px 0; }
                    .content-section { margin-bottom: 20px; }
                    .section-label { font-weight: bold; text-decoration: underline; display: block; margin-bottom: 5px; }
                    .field-row { display: flex; margin-bottom: 8px; }
                    .field-label { width: 150px; flex-shrink: 0; }
                    .field-value { flex: 1; border-bottom: 1px dotted #000; padding-left: 5px; }
                    .footer { margin-top: 60px; }
                    .signature-block { float: right; width: 250px; text-align: center; }
                    @media print { body { padding: 20px; } button { display: none; } }
                </style>
            </head>
            <body>
                 <div class="header">
                    <h2>MEDICO-LEGAL CASE (MLC) – HOSPITAL TO POLICE INTIMATION</h2>
                </div>
                <div class="meta-info">
                    <div class="meta-line"><strong>From:</strong></div>
                    <div class="meta-line">The Medical Officer</div>
                    <div class="meta-line"><strong>Dr. ${existingMlc.doctor_first_name} ${existingMlc.doctor_last_name}</strong></div>
                    <div class="meta-line">Reg. No: ${existingMlc.registration_number || 'N/A'}</div>
                    <div class="meta-line">${existingMlc.branch_name || 'PHC Hospital Management System'}</div>
                    <div class="meta-line">${existingMlc.branch_address ? `${existingMlc.branch_address}, ${existingMlc.branch_city || ''}` : ''}</div>
                    <br>
                    <div class="meta-line"><strong>To:</strong></div>
                    <div class="meta-line">The Station House Officer (SHO)</div>
                    <div class="meta-line">${existingMlc.police_station ? existingMlc.police_station + ' Police Station' : '______________________ Police Station'}</div>
                    <div class="meta-line">${existingMlc.police_station_district ? existingMlc.police_station_district + ' District' : '______________________ District'}</div>
                </div>
                <div class="subject">Subject: Intimation regarding Medico-Legal Case (MLC)</div>
                <p>Sir / Madam,</p>
                <p>This is to inform you that the following Medico-Legal Case has been registered and examined at this hospital.</p>
                <div class="content-section">
                    <span class="section-label">MLC Details:</span>
                    <div class="field-row">
                        <span class="field-label">MLC No.:</span>
                        <span class="field-value"><strong>${existingMlc.mlc_number}</strong></span>
                    </div>
                    <div class="field-row">
                        <span class="field-label">Date & Time:</span>
                        <span class="field-value">${new Date(existingMlc.created_at).toLocaleString()}</span>
                    </div>
                </div>
                <div class="content-section">
                    <span class="section-label">Patient Details:</span>
                    <div class="field-row">
                        <span class="field-label">Name:</span>
                        <span class="field-value">${patient.first_name} ${patient.last_name}</span>
                    </div>
                    <div class="field-row">
                        <span class="field-label">Age / Gender:</span>
                        <span class="field-value">${patient.age} Yrs / ${patient.gender}</span>
                    </div>
                    <div class="field-row">
                        <span class="field-label">Address:</span>
                        <span class="field-value">${patient.address || ''} ${patient.city || ''}</span>
                    </div>
                    <div class="field-row">
                        <span class="field-label">Brought by:</span>
                        <span class="field-value">${existingMlc.brought_by || '______________________'}</span>
                    </div>
                </div>
                <div class="content-section">
                    <span class="section-label">History (As alleged by patient / attendant):</span>
                    <p style="border-bottom: 1px dotted #000; min-height: 40px;">${existingMlc.history_alleged || ''}</p>
                </div>
                <div class="content-section">
                    <span class="section-label">Brief Injury Description:</span>
                    <p style="border-bottom: 1px dotted #000; min-height: 40px;">${existingMlc.injury_description || ''}</p>
                </div>
                <div class="content-section">
                    <span class="section-label">Opinion:</span>
                    <div class="field-row">
                        <span class="field-label">Nature of Injuries:</span>
                        <span class="field-value">${existingMlc.nature_of_injury || 'Simple / Grievous / Dangerous to Life'}</span>
                    </div>
                </div>
                <p>The patient is undergoing / has been given necessary medical treatment. You are requested to take necessary action as deemed fit.</p>
                <p>Thanking you,</p>
                <p>Yours faithfully,</p>
                <div class="footer">
                    <div class="signature-block">
                        <div style="border-bottom: 1px solid #000; margin-bottom: 5px; height: 40px;"></div>
                        <div><strong>Dr. ${existingMlc.doctor_first_name} ${existingMlc.doctor_last_name}</strong></div>
                        <div>${existingMlc.qualification || 'MBBS'}</div>
                        <div>Reg. No: ${existingMlc.registration_number || ''}</div>
                        <div>Phone: ${existingMlc.doctor_phone || JSON.parse(localStorage.getItem('user') || '{}').contact_number || 'N/A'}</div>
                        <div style="margin-top: 5px;">Signature: ____________________</div>
                        <div>${new Date().toLocaleDateString()}</div>
                    </div>
                </div>
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const handleOpenWoundCert = () => {
        const activeMlcOpd = opdHistory.find(opd => ['Registered', 'In-consultation', 'Completed'].includes(opd.visit_status) && opd.is_mlc);

        if (!activeMlcOpd) {
            alert('No active MLC OPD visit found. Please mark the visit as MLC first.');
            return;
        }

        const consult = consultationHistory.find(c => c.opd_id === activeMlcOpd.opd_id);

        setWoundCertData({
            incident_date_time: existingMlc?.incident_date_time ? new Date(existingMlc.incident_date_time).toISOString().slice(0, 16) : '',
            alleged_cause: existingMlc?.alleged_cause || '',
            history_alleged: existingMlc?.history_alleged || consult?.notes || '',
            examination_findings: existingMlc?.examination_findings || consult?.diagnosis || '',
            nature_of_injury: existingMlc?.nature_of_injury || 'Simple',
            danger_to_life: existingMlc?.danger_to_life || 'No',
            age_of_injuries: existingMlc?.age_of_injuries || '',
            treatment_given: existingMlc?.treatment_given || '',
            remarks: existingMlc?.remarks || ''
        });

        setShowWoundCertModal(true);
    };

    const handleSaveWoundCert = async () => {
        try {
            const token = localStorage.getItem('token');
            const activeOpd = opdHistory.find(opd => ['Registered', 'In-consultation', 'Completed'].includes(opd.visit_status) && opd.is_mlc);

            if (!activeOpd) {
                alert('No active MLC OPD visit found.');
                return;
            }

            const payload = {
                opd_id: activeOpd.opd_id,
                patient_id: patient.patient_id,
                ...existingMlc,
                ...woundCertData
            };

            const response = await axios.post(`${API_URL}/mlc`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setExistingMlc(response.data.data.mlc);
            alert('Wound Certificate details saved successfully!');
        } catch (error) {
            console.error('Error saving Wound Cert:', error);
            alert('Failed to save details.');
        }
    };

    const handlePrintWoundCert = () => {
        if (!existingMlc || !patient) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Wound Certificate - ${existingMlc.mlc_number}</title>
                <style>
                    body { font-family: 'Times New Roman', serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.4; color: #000; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .header h2 { margin: 0; text-decoration: underline; }
                    .field-line { display: flex; align-items: baseline; margin-bottom: 10px; }
                    .field-label { font-weight: bold; margin-right: 5px; flex-shrink: 0; }
                    .field-value { border-bottom: 1px dotted #000; flex: 1; padding-left: 5px; }
                    .section-title { font-weight: bold; margin-top: 20px; margin-bottom: 10px; }
                    .row { display: flex; gap: 20px; }
                    .col { flex: 1; }
                    .footer { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; }
                    .police-section { margin-top: 50px; border-top: 2px solid #000; padding-top: 30px; }
                    @media print { body { padding: 20px; } button { display: none; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>LEGAL / MEDICO-LEGAL CASE (MLC) WOUND CERTIFICATE FORMAT</h2>
                </div>

                <div class="field-line">
                    <span class="field-label">Hospital Name & Address:</span>
                    <span class="field-value">${existingMlc.branch_name || 'PHC Hospital Management System'}${existingMlc.branch_address ? ', ' + existingMlc.branch_address : ''}</span>
                </div>
                <div class="row">
                    <div class="col field-line">
                        <span class="field-label">MLC No.:</span>
                        <span class="field-value">${existingMlc.mlc_number}</span>
                    </div>
                    <div class="col field-line">
                        <span class="field-label">Police Station:</span>
                        <span class="field-value">${existingMlc.police_station || ''}</span>
                    </div>
                </div>
                <div class="field-line">
                    <span class="field-label">Date & Time of Examination:</span>
                    <span class="field-value">${new Date(existingMlc.created_at).toLocaleString()}</span>
                </div>

                <div class="section-title">Patient Details</div>
                <div class="row">
                    <div class="col field-line">
                        <span class="field-label">Name:</span>
                        <span class="field-value">${patient.first_name} ${patient.last_name}</span>
                    </div>
                    <div class="col field-line">
                        <span class="field-label">Age:</span>
                        <span class="field-value">${patient.age}</span>
                    </div>
                    <div class="col field-line">
                        <span class="field-label">Gender:</span>
                        <span class="field-value">${patient.gender}</span>
                    </div>
                </div>
                <div class="field-line">
                    <span class="field-label">Address:</span>
                    <span class="field-value">${patient.address || ''} ${patient.city || ''}</span>
                </div>
                <div class="field-line">
                    <span class="field-label">Brought by:</span>
                    <span class="field-value">${existingMlc.brought_by || ''}</span>
                </div>

                <div class="section-title">History (As alleged)</div>
                <div class="field-line">
                    <span class="field-label">Date & Time of Incident:</span>
                    <span class="field-value">${woundCertData.incident_date_time ? new Date(woundCertData.incident_date_time).toLocaleString() : ''}</span>
                </div>
                <div class="field-line">
                    <span class="field-label">Alleged Cause/Weapon:</span>
                    <span class="field-value">${woundCertData.alleged_cause || ''}</span>
                </div>
                <p style="border-bottom: 1px dotted #000; min-height: 40px; margin-top: 10px;">${woundCertData.history_alleged || ''}</p>

                <div class="section-title">Examination Findings</div>
                <p style="border-bottom: 1px dotted #000; min-height: 60px; white-space: pre-wrap;">${woundCertData.examination_findings || ''}</p>

                <div class="section-title">Opinion</div>
                <div class="field-line">
                    <span class="field-label">Nature of Injuries:</span>
                    <span class="field-value">${woundCertData.nature_of_injury}</span>
                </div>
                <div class="field-line">
                    <span class="field-label">Danger to Life:</span>
                    <span class="field-value">${woundCertData.danger_to_life}</span>
                </div>
                <div class="field-line">
                    <span class="field-label">Age of Injuries:</span>
                    <span class="field-value">${woundCertData.age_of_injuries || ''}</span>
                </div>

                <div class="section-title">Treatment Given:</div>
                <p style="border-bottom: 1px dotted #000; min-height: 40px;">${woundCertData.treatment_given || ''}</p>

                <div class="section-title">Remarks:</div>
                <p style="border-bottom: 1px dotted #000; min-height: 40px;">${woundCertData.remarks || ''}</p>

                <div class="footer">
                    <div></div>
                    <div style="text-align: center;">
                        <div style="font-weight: bold;">Dr. ${existingMlc.doctor_first_name} ${existingMlc.doctor_last_name}</div>
                        <div>Reg No.: ${existingMlc.registration_number || ''}</div>
                        <div style="margin-top: 30px;">Signature & Hospital Seal</div>
                    </div>
                </div>

                <div class="police-section">
                    <div class="header">
                        <h2>POLICE-USE WOUND CERTIFICATE FORMAT</h2>
                    </div>
                     <div class="row">
                        <div class="col field-line">
                            <span class="field-label">Police Station:</span>
                            <span class="field-value">${existingMlc.police_station || ''}</span>
                        </div>
                    </div>
                     <div class="field-line">
                        <span class="field-label">Patient Name:</span>
                        <span class="field-value">${patient.first_name} ${patient.last_name}</span>
                    </div>
                    <div class="section-title">Injuries Certified</div>
                    <p style="border-bottom: 1px dotted #000; min-height: 40px;">${woundCertData.examination_findings || ''}</p>
                    
                    <div class="section-title">Opinion for Investigation</div>
                     <div class="field-line">
                        <span class="field-label">Nature of Injuries:</span>
                        <span class="field-value">${woundCertData.nature_of_injury}</span>
                    </div>
                     <div class="field-line">
                        <span class="field-label">Weapon Used:</span>
                        <span class="field-value">${woundCertData.alleged_cause || ''}</span>
                    </div>
                     <div class="field-line">
                        <span class="field-label">Whether injuries possible as alleged:</span>
                        <span class="field-value">Yes / No</span>
                    </div>
                    
                    <div class="footer">
                         <div style="text-align: right;">
                            <div style="font-weight: bold;">Dr. ${existingMlc.doctor_first_name} ${existingMlc.doctor_last_name}</div>
                            <div style="margin-top: 20px;">Signature & Seal</div>
                        </div>
                    </div>
                </div>

                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const handleOpenDeathCert = () => {
        setDeathCertData({
            date_of_death: patient.date_of_death ? new Date(patient.date_of_death).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            time_of_death: patient.time_of_death || new Date().toTimeString().slice(0, 5),
            declared_dead_by: patient.declared_dead_by || `Dr. ${JSON.parse(localStorage.getItem('user') || '{}').first_name || ''} ${JSON.parse(localStorage.getItem('user') || '{}').last_name || ''}`,
            cause_of_death: patient.cause_of_death || '',
            death_circumstances: patient.death_circumstances || '',
            is_death_mlc: patient.is_death_mlc || false,
            death_police_station: patient.death_police_station || (existingMlc?.police_station || ''),
            death_police_district: patient.death_police_district || (existingMlc?.police_station_district || ''),
            post_mortem_required: patient.post_mortem_required || false,
            relatives_name: patient.relatives_name || '',
            relatives_number: patient.relatives_number || '',
            relatives_notified_at: patient.relatives_notified_at ? new Date(patient.relatives_notified_at).toISOString().slice(0, 16) : ''
        });
        setShowDeathCertModal(true);
    };

    const handleSaveDeathDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const payload = {
                ...deathCertData,
                is_deceased: true
            };

            const response = await axios.patch(`${API_URL}/patients/${patient.patient_id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setPatient(response.data.data.patient);
            alert('Death details saved successfully!');
        } catch (error) {
            console.error('Error saving death details:', error);
            alert('Failed to save details.');
        }
    };

    const handlePrintDeathCert = () => {
        // Fallback to active OPD if available
        const activeOpd = opdHistory.find(opd => ['Registered', 'In-consultation'].includes(opd.visit_status)) || opdHistory[0];

        const branchName = existingMlc?.branch_name || activeOpd?.branch_name || 'PHC Hospital';
        const branchAddress = existingMlc?.branch_address || activeOpd?.branch_address || '';
        const doctorName = deathCertData.declared_dead_by || `Dr. ${JSON.parse(localStorage.getItem('user') || '{}').first_name || ''} ${JSON.parse(localStorage.getItem('user') || '{}').last_name || ''}`;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Death Intimation - ${patient.first_name}</title>
                <style>
                    body { font-family: 'Times New Roman', serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.5; color: #000; }
                    .header { text-align: center; margin-bottom: 30px; font-weight: bold; font-size: 18px; text-transform: uppercase; }
                    .field-line { display: flex; align-items: baseline; margin-bottom: 15px; }
                    .field-label { font-weight: bold; margin-right: 5px; flex-shrink: 0; }
                    .field-value { border-bottom: 1px solid #000; flex: 1; padding-left: 5px; min-height: 20px; }
                    .section-title { font-weight: bold; margin-top: 25px; margin-bottom: 15px; text-decoration: underline; }
                    .row { display: flex; gap: 20px; }
                    .col { flex: 1; }
                    .footer { margin-top: 60px; }
                    @media print { body { padding: 20px; } button { display: none; } }
                </style>
            </head>
            <body>
                <div class="header">DEATH INTIMATION – HOSPITAL TO POLICE</div>
                
                <div style="margin-bottom: 20px;">
                    <div><strong>From:</strong></div>
                    <div>The Medical Officer</div>
                    <div class="field-line" style="margin-bottom: 5px;">
                        <span class="field-label">Hospital Name:</span>
                        <span class="field-value">${branchName}</span>
                    </div>
                    <div class="field-line" style="margin-bottom: 5px;">
                        <span class="field-label">Address:</span>
                        <span class="field-value">${branchAddress}</span>
                    </div>
                </div>

                <div style="margin-bottom: 20px;">
                    <div><strong>To:</strong></div>
                    <div>The Station House Officer (SHO)</div>
                    <div class="field-line">
                         <span class="field-label">Police Station:</span>
                         <span class="field-value">${deathCertData.death_police_station}</span>
                    </div>
                     <div class="field-line">
                         <span class="field-label">District:</span>
                         <span class="field-value">${deathCertData.death_police_district}</span>
                    </div>
                </div>

                <div style="border-top: 1px solid #000; margin: 20px 0;"></div>

                <div style="font-weight: bold; margin-bottom: 15px;">Subject: Intimation regarding death of a patient</div>
                
                <p>Sir / Madam,</p>
                <p>This is to inform you that the following patient was brought to / admitted in this hospital and was examined and declared dead. The details are furnished below for your kind information and necessary action as per law.</p>

                <div class="section-title">Patient Details</div>
                <div class="field-line">
                    <span class="field-label">• Name of the Deceased:</span>
                    <span class="field-value">${patient.first_name} ${patient.last_name}</span>
                </div>
                <div class="field-line">
                    <span class="field-label">• Age / Gender:</span>
                    <span class="field-value">${patient.age} / ${patient.gender}</span>
                </div>
                 <div class="field-line">
                    <span class="field-label">• Address:</span>
                    <span class="field-value">${patient.address || ''}</span>
                </div>

                <div class="section-title">Hospital & Case Details</div>
                <div class="field-line">
                    <span class="field-label">• UHID / IP / OP No.:</span>
                    <span class="field-value">${opdHistory[0]?.opd_id || ''} / ${patient.mrn_number}</span>
                </div>
                 <div class="field-line">
                    <span class="field-label">• Date & Time of Admission / Brought:</span>
                    <span class="field-value">${opdHistory[0]?.visit_date ? new Date(opdHistory[0].visit_date).toLocaleDateString() : ''} ${opdHistory[0]?.visit_time || ''}</span>
                </div>

                <div class="section-title">Death Details</div>
                <div class="field-line">
                    <span class="field-label">• Date of Death:</span>
                    <span class="field-value">${deathCertData.date_of_death}</span>
                </div>
                 <div class="field-line">
                    <span class="field-label">• Time of Death:</span>
                    <span class="field-value">${deathCertData.time_of_death}</span>
                </div>
                 <div class="field-line">
                    <span class="field-label">• Declared Dead By (Doctor):</span>
                    <span class="field-value">${deathCertData.declared_dead_by}</span>
                </div>

                <div class="section-title">History / Circumstances of Death</div>
                <p><i>(As alleged by patient attendants / brought by persons)</i></p>
                <p style="border-bottom: 1px solid #000; min-height: 40px; margin-top: 10px;">${deathCertData.death_circumstances}</p>

                <div class="section-title">Provisional Cause of Death</div>
                <p style="border-bottom: 1px solid #000; min-height: 40px; margin-top: 10px;">${deathCertData.cause_of_death}</p>

                <div class="section-title">Medico-Legal Information</div>
                 <div class="field-line">
                    <span class="field-label">• MLC Case:</span>
                    <span class="field-value">${deathCertData.is_death_mlc ? 'Yes' : 'No'}</span>
                </div>
                 <div class="field-line">
                    <span class="field-label">• Post-mortem Required:</span>
                    <span class="field-value">${deathCertData.post_mortem_required ? 'Yes' : 'No'}</span>
                </div>

                <div class="section-title">Relatives Informed</div>
                 <div class="field-line">
                    <span class="field-label">• Name & Relationship:</span>
                    <span class="field-value">${deathCertData.relatives_name}</span>
                </div>
                 <div class="field-line">
                    <span class="field-label">• Date & Time Informed:</span>
                    <span class="field-value">${deathCertData.relatives_notified_at ? new Date(deathCertData.relatives_notified_at).toLocaleString() : ''}</span>
                </div>

                <div style="margin-top: 30px;">You are requested to take further action as deemed fit.</div>
                
                <div class="footer">
                    <div class="field-line">
                        <span class="field-label">Name of Medical Officer:</span>
                        <span class="field-value">${deathCertData.declared_dead_by}</span>
                    </div>
                     <div class="field-line" style="margin-top: 40px;">
                        <span class="field-label">Signature:</span>
                        <span class="field-value" style="border-bottom: 0;">_________________________________</span>
                    </div>
                    <div>Hospital Seal & Date</div>
                </div>

                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const handleStartConsultation = async () => {
        try {
            const token = localStorage.getItem('token');
            const activeOpd = opdHistory.find(opd => ['Registered', 'In-consultation'].includes(opd.visit_status));

            if (activeOpd) {
                if (activeOpd.visit_status === 'Registered') {
                    await axios.post(`${API_URL}/consultations/start`, {
                        opd_id: activeOpd.opd_id
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    // Refresh to update status in UI
                    fetchPatientDetails();
                }
                // Load any existing draft
                await loadDraft(activeOpd.opd_id);
            }
            setShowConsultationForm(true);
        } catch (error) {
            console.error('Error starting consultation:', error);
            // Still show form even if status update fails, to not block doctor
            setShowConsultationForm(true);
        }
    };

    const handleAddMedication = () => {
        if (newMedication.name && newMedication.dosage) {
            setConsultationData({
                ...consultationData,
                medications: [...consultationData.medications, newMedication]
            });
            setNewMedication({
                name: '', dosage: '', frequency: '', duration: '',
                morning: false, noon: false, night: false,
                food_timing: 'After Food'
            });
        }
    };




    const handleLabSearch = async (query: string) => {
        setNewLab({ ...newLab, test_name: query });
        if (query.length < 2) {
            setLabSearchResults([]);
            setShowLabDropdown(false);
            return;
        }

        setIsSearchingLabs(true);
        setShowLabDropdown(true);

        try {
            const token = localStorage.getItem('token');
            // Assuming current user's hospital context is handled by backend key or we might need to pass it? 
            // The API we implemented can take hospital_id, but let's try just query first or look up hospital_id from opdHistory if available.
            // But let's stick to simple query first.
            const response = await axios.get(`${API_URL}/services/search?query=${query}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLabSearchResults(response.data.data.services || []);
        } catch (error) {
            console.error("Error searching labs:", error);
        } finally {
            setIsSearchingLabs(false);
        }
    };

    const selectLabService = (service: any) => {
        setConsultationData(prev => ({
            ...prev,
            labs: [...prev.labs, { ...newLab, test_name: service.service_name }]
        }));
        setNewLab({ test_name: '', lab_name: '' });
        setShowLabDropdown(false);
        setLabSearchResults([]);
    };

    const handleAddLab = () => {
        if (!newLab.test_name.trim()) return;

        if (labSearchResults.length > 0) {
            const service = labSearchResults[0];
            setConsultationData(prev => ({
                ...prev,
                labs: [...prev.labs, { ...newLab, test_name: service.service_name }]
            }));
            setNewLab({ test_name: '', lab_name: '' });
            setShowLabDropdown(false);
            setLabSearchResults([]);
        } else {
            showCustomAlert('info', 'No Result Found', 'Please select a valid test from the list.');
        }
    };

    const removeLab = (index: number) => {
        const newLabs = [...consultationData.labs];
        newLabs.splice(index, 1);
        setConsultationData({ ...consultationData, labs: newLabs });
    };

    const handlePrintPrescription = (consult: any) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        let medications: any[] = [];
        if (typeof consult.prescription_medications === 'string') {
            try { medications = JSON.parse(consult.prescription_medications); } catch (e) { }
        } else if (Array.isArray(consult.prescription_medications)) {
            medications = consult.prescription_medications;
        }

        let printedLabs: any[] = [];
        if (consult.labs && Array.isArray(consult.labs)) {
            printedLabs = consult.labs;
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Prescription - ${patient?.first_name} ${patient?.last_name}</title>
                <style>
                    body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                    .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
                    .header h1 { margin: 0; color: #2563eb; }
                    .header p { margin: 5px 0 0; color: #666; font-size: 0.9em; }
                    
                    .doc-info { margin-bottom: 30px; display: flex; justify-content: space-between; }
                    .doc-info div { flex: 1; }
                    .doc-name { font-weight: bold; font-size: 1.1em; }
                    
                    .patient-info { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px; display: flex; flex-wrap: wrap; gap: 20px; }
                    .info-group { flex: 1; min-width: 200px; }
                    .label { font-size: 0.8em; color: #666; text-transform: uppercase; font-weight: bold; }
                    .value { font-weight: 500; }
                    
                    .section { margin-bottom: 30px; }
                    .section-title { font-weight: bold; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 15px; font-size: 1.1em; }
                    
                    table { w-full; border-collapse: collapse; width: 100%; margin-top: 10px; }
                    th { text-align: left; padding: 10px; background: #f3f4f6; font-size: 0.9em; color: #374151; }
                    td { padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 0.95em; }
                    
                    .footer { margin-top: 50px; text-align: right; padding-top: 20px; border-top: 1px dashed #ccc; }
                    .signature { display: inline-block; text-align: center; }
                    .sig-line { width: 200px; border-top: 1px solid #000; margin-bottom: 5px; }
                    
                    @media print {
                        body { padding: 0; }
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${consult.hospital_name || 'PHC Hospital Management System'}</h1>
                    <p>${consult.headquarters_address || '123 Health Avenue, Medical District'}</p>
                    <p>Phone: ${consult.hospital_contact || '+1 (555) 123-4567'} | Email: ${consult.hospital_email || 'contact@phchms.com'}</p>
                </div>
                
                <div class="doc-info">
                    <div>
                        <div class="doc-name">Dr. ${consult.doctor_first_name} ${consult.doctor_last_name}</div>
                        <div>${consult.specialization}</div>
                        <div>Reg. No: ${consult.doctor_registration_number || 'N/A'}</div>
                    </div>
                     <div style="text-align: right;">
                        <div class="label">Date</div>
                        <div class="value">${new Date(consult.created_at).toLocaleDateString()}</div>
                        <div class="label" style="margin-top: 5px;">Time</div>
                        <div class="value">${new Date(consult.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                </div>
                
                <div class="patient-info">
                    <div class="info-group">
                        <div class="label">Patient Name</div>
                        <div class="value">${patient?.first_name} ${patient?.last_name}</div>
                    </div>
                    <div class="info-group">
                        <div class="label">Age / Gender</div>
                        <div class="value">${patient?.age} Yrs / ${patient?.gender}</div>
                    </div>
                    <div class="info-group">
                        <div class="label">MRN</div>
                        <div class="value">${patient?.mrn_number}</div>
                    </div>
                    <div class="info-group">
                        <div class="label">Contact</div>
                        <div class="value">${patient?.contact_number}</div>
                    </div>
                </div>
                
                ${consult.vital_signs ? `
                <div class="section">
                    <div class="section-title">Vitals</div>
                    <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                        ${Object.entries(consult.vital_signs).map(([key, value]) => `
                            <div>
                                <span class="label" style="display:block;">${key.replace(/_/g, ' ')}</span>
                                <span class="value">${value}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>` : ''}

                ${consult.notes ? `
                <div class="section">
                    <div class="section-title">Clinical Notes</div>
                    <p>${consult.notes}</p>
                </div>` : ''}
                
                ${consult.diagnosis ? `
                <div class="section">
                    <div class="section-title">Diagnosis</div>
                    <p>${consult.diagnosis}</p>
                </div>` : ''}

                 ${printedLabs.length > 0 ? `
                <div class="section">
                    <div class="section-title">Lab Orders</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Test Name</th>
                                <th>Lab</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${printedLabs.map((lab: any) => `
                                <tr>
                                    <td>${typeof lab === 'string' ? lab : lab.test_name}</td>
                                    <td>${typeof lab === 'string' ? '-' : lab.lab_name}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>` : ''}

                ${medications.length > 0 ? `
                <div class="section">
                    <div class="section-title">Prescription</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Medicine</th>
                                <th>Dosage</th>
                                <th>Frequency</th>
                                <th>Instruction</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${medications.map((med: any) => `
                                <tr>
                                    <td><strong>${med.name}</strong></td>
                                    <td>${med.dosage}</td>
                                    <td>${[med.morning && 'Mor', med.noon && 'Noon', med.night && 'Night'].filter(Boolean).join('-')}</td>
                                    <td>${med.food_timing}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>` : ''}
                
                <div class="section" style="margin-top: 30px;">
                    <div class="section-title">Follow-up</div>
                    <p>
                        <strong>Status:</strong> ${consult.next_visit_status}
                        ${consult.next_visit_date ? ` | <strong>Date:</strong> ${new Date(consult.next_visit_date).toLocaleDateString()}` : ''}
                    </p>
                </div>
                
                <div class="footer">
                    <div class="signature">
                        <div class="sig-line"></div>
                        <div>Doctor's Signature</div>
                    </div>
                </div>
                
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const handlePrintDraft = () => {
        const activeOpd = opdHistory.find(opd => ['Registered', 'In-consultation'].includes(opd.visit_status));
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        // Construct mock consult object from current state
        const consult = {
            hospital_name: activeOpd?.branch_name || 'PHC Hospital Management System',
            headquarters_address: activeOpd?.branch_address || '', // Fallback if available
            hospital_contact: '',
            hospital_email: '',

            doctor_first_name: user.first_name || '',
            doctor_last_name: user.last_name || '',
            specialization: user.specialization || '',
            doctor_registration_number: user.registration_number || '', // Assuming this is stored in user object

            created_at: new Date().toISOString(),

            vital_signs: activeOpd?.vital_signs || null,
            notes: consultationData.notes,
            diagnosis: consultationData.diagnosis,
            labs: consultationData.labs, // Array of objects or strings
            prescription_medications: consultationData.medications,

            next_visit_status: consultationData.next_visit_status,
            next_visit_date: consultationData.next_visit_date
        };

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        let medications: any[] = consult.prescription_medications; // Already array in state

        let printedLabs: any[] = [];
        if (consult.labs && Array.isArray(consult.labs)) {
            printedLabs = consult.labs;
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Draft Prescription - ${patient?.first_name} ${patient?.last_name}</title>
                <style>
                    body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                    .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
                    .header h1 { margin: 0; color: #2563eb; }
                    .header p { margin: 5px 0 0; color: #666; font-size: 0.9em; }
                    
                    .doc-info { margin-bottom: 30px; display: flex; justify-content: space-between; }
                    .doc-info div { flex: 1; }
                    .doc-name { font-weight: bold; font-size: 1.1em; }
                    
                    .patient-info { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px; display: flex; flex-wrap: wrap; gap: 20px; }
                    .info-group { flex: 1; min-width: 200px; }
                    .label { font-size: 0.8em; color: #666; text-transform: uppercase; font-weight: bold; }
                    .value { font-weight: 500; }
                    
                    .section { margin-bottom: 30px; }
                    .section-title { font-weight: bold; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 15px; font-size: 1.1em; }
                    
                    table { w-full; border-collapse: collapse; width: 100%; margin-top: 10px; }
                    th { text-align: left; padding: 10px; background: #f3f4f6; font-size: 0.9em; color: #374151; }
                    td { padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 0.95em; }
                    
                    .footer { margin-top: 50px; text-align: right; padding-top: 20px; border-top: 1px dashed #ccc; }
                    .signature { display: inline-block; text-align: center; }
                    .sig-line { width: 200px; border-top: 1px solid #000; margin-bottom: 5px; }

                    @media print {
                        body { padding: 0; }
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${consult.hospital_name}</h1>
                    <p>${consult.headquarters_address}</p>
                    <p>Phone: ${consult.hospital_contact || 'N/A'} | Email: ${consult.hospital_email || 'N/A'}</p>
                </div>
                
                <div class="doc-info">
                    <div>
                        <div class="doc-name">Dr. ${consult.doctor_first_name} ${consult.doctor_last_name}</div>
                        <div>${consult.specialization}</div>
                        <div>Reg. No: ${consult.doctor_registration_number || 'N/A'}</div>
                    </div>
                     <div style="text-align: right;">
                        <div class="label">Date</div>
                        <div class="value">${new Date(consult.created_at).toLocaleDateString()}</div>
                        <div class="label" style="margin-top: 5px;">Time</div>
                        <div class="value">${new Date(consult.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                </div>
                
                <div class="patient-info">
                    <div class="info-group">
                        <div class="label">Patient Name</div>
                        <div class="value">${patient?.first_name} ${patient?.last_name}</div>
                    </div>
                    <div class="info-group">
                        <div class="label">Age / Gender</div>
                        <div class="value">${patient?.age} Yrs / ${patient?.gender}</div>
                    </div>
                    <div class="info-group">
                        <div class="label">MRN</div>
                        <div class="value">${patient?.mrn_number}</div>
                    </div>
                    <div class="info-group">
                        <div class="label">Contact</div>
                        <div class="value">${patient?.contact_number}</div>
                    </div>
                </div>
                
                ${consult.vital_signs ? `
                <div class="section">
                    <div class="section-title">Vitals</div>
                    <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                        ${Object.entries(consult.vital_signs).map(([key, value]) => `
                            <div>
                                <span class="label" style="display:block;">${key.replace(/_/g, ' ')}</span>
                                <span class="value">${value}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>` : ''}

                ${consult.notes ? `
                <div class="section">
                    <div class="section-title">Clinical Notes</div>
                    <p>${consult.notes}</p>
                </div>` : ''}
                
                ${consult.diagnosis ? `
                <div class="section">
                    <div class="section-title">Diagnosis</div>
                    <p>${consult.diagnosis}</p>
                </div>` : ''}

                 ${printedLabs.length > 0 ? `
                <div class="section">
                    <div class="section-title">Lab Orders</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Test Name</th>
                                <th>Lab</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${printedLabs.map((lab: any) => `
                                <tr>
                                    <td>${typeof lab === 'string' ? lab : lab.test_name}</td>
                                    <td>${typeof lab === 'string' ? '-' : lab.lab_name}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>` : ''}

                ${medications.length > 0 ? `
                <div class="section">
                    <div class="section-title">Prescription</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Medicine</th>
                                <th>Dosage</th>
                                <th>Frequency</th>
                                <th>Instruction</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${medications.map((med: any) => `
                                <tr>
                                    <td><strong>${med.name}</strong></td>
                                    <td>${med.dosage}</td>
                                    <td>${[med.morning && 'Mor', med.noon && 'Noon', med.night && 'Night'].filter(Boolean).join('-')}</td>
                                    <td>${med.food_timing}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>` : ''}
                
                <div class="section" style="margin-top: 30px;">
                    <div class="section-title">Follow-up</div>
                    <p>
                        <strong>Status:</strong> ${consult.next_visit_status}
                        ${consult.next_visit_date ? ` | <strong>Date:</strong> ${new Date(consult.next_visit_date).toLocaleDateString()}` : ''}
                    </p>
                </div>
                
                <div class="footer">
                    <div class="signature">
                        <div class="sig-line"></div>
                        <div>Doctor's Signature</div>
                    </div>
                </div>
                
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const handleSaveDraft = async () => {
        try {
            const token = localStorage.getItem('token');
            const activeOpd = opdHistory.find(opd =>
                ['Registered', 'In-consultation'].includes(opd.visit_status)
            );

            if (!activeOpd) {
                alert('No active OPD visit found.');
                return;
            }

            const payload = {
                opd_id: activeOpd.opd_id,
                patient_id: patient.patient_id,
                ...consultationData,
                next_visit_date: consultationData.next_visit_date || null
            };

            await axios.post(`${API_URL}/consultations/draft`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            await axios.post(`${API_URL}/consultations/draft`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (isPatientDeceased) {
                const deathPayload = {
                    ...deathCertData,
                    is_deceased: true
                };
                await axios.patch(`${API_URL}/patients/${patient.patient_id}`, deathPayload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            showCustomAlert('success', 'Draft Saved!', 'You can continue editing later.');
        } catch (error) {
            console.error('Error saving draft:', error);
            showCustomAlert('error', 'Error', 'Failed to save draft. Please try again.');
        }
    };

    const handleCompleteConsultation = async () => {
        try {
            const token = localStorage.getItem('token');
            // Find the latest active OPD visit
            const activeOpd = opdHistory.find(opd => opd.visit_status === 'Registered' || opd.visit_status === 'In-consultation');

            if (!activeOpd) {
                alert('No active OPD visit found for this patient.');
                return;
            }

            const payload = {
                opd_id: activeOpd.opd_id,
                patient_id: patient.patient_id,
                ...consultationData,
                next_visit_date: consultationData.next_visit_date || null
            };

            await axios.post(`${API_URL}/consultations/complete`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (isPatientDeceased) {
                // Only send non-empty death-related fields
                const deathPayload: any = {
                    is_deceased: true
                };

                // Add fields only if they have values
                if (deathCertData.date_of_death) deathPayload.date_of_death = deathCertData.date_of_death;
                if (deathCertData.time_of_death) deathPayload.time_of_death = deathCertData.time_of_death;
                if (deathCertData.declared_dead_by) deathPayload.declared_dead_by = deathCertData.declared_dead_by;
                if (deathCertData.cause_of_death) deathPayload.cause_of_death = deathCertData.cause_of_death;
                if (deathCertData.death_circumstances) deathPayload.death_circumstances = deathCertData.death_circumstances;
                if (deathCertData.is_death_mlc !== undefined) deathPayload.is_death_mlc = deathCertData.is_death_mlc;
                if (deathCertData.death_police_station) deathPayload.death_police_station = deathCertData.death_police_station;
                if (deathCertData.death_police_district) deathPayload.death_police_district = deathCertData.death_police_district;
                if (deathCertData.post_mortem_required !== undefined) deathPayload.post_mortem_required = deathCertData.post_mortem_required;
                if (deathCertData.relatives_name) deathPayload.relatives_name = deathCertData.relatives_name;
                if (deathCertData.relatives_number) deathPayload.relatives_number = deathCertData.relatives_number;
                if (deathCertData.relatives_notified_at) {
                    // Convert datetime-local format to proper timestamp
                    deathPayload.relatives_notified_at = new Date(deathCertData.relatives_notified_at).toISOString();
                }

                await axios.patch(`${API_URL}/patients/${patient.patient_id}`, deathPayload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            showCustomAlert('success', 'Success!', 'Consultation completed successfully!');
            setShowConsultationForm(false);
            fetchPatientDetails(); // Refresh data
        } catch (error) {
            console.error('Error completing consultation:', error);
            showCustomAlert('error', 'Error', 'Failed to complete consultation. Please try again.');
        }
    };

    if (!patient) {
        return <div>Patient not found</div>;
    }

    console.log('Rendering PatientDetails, patient:', patient);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Navigation & Header */}
            <div className="flex items-center justify-between mb-2">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-slate-500 hover:text-blue-600 transition group"
                >
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center mr-2 shadow-sm group-hover:scale-110 transition-transform">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Back to Patient List</span>
                </button>
            </div>

            {/* Glass Patient Identity Card */}
            <div className="glass-panel p-6 rounded-3xl border border-white/60 relative overflow-hidden shadow-lg shadow-blue-500/5">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-100/30 to-purple-100/30 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div className="flex items-center gap-5">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-500/30 ring-4 ring-white/50">
                            {patient?.first_name?.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-heading font-bold text-slate-800">{patient?.first_name} {patient?.last_name}</h1>
                                {opdHistory.some((opd: any) => opd.is_mlc) && (
                                    <span className="px-3 py-1 bg-red-500/10 text-red-600 border border-red-200 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                                        <Activity className="w-3 h-3" /> MLC Case
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-slate-500 text-sm mt-2 font-medium">
                                <span className="flex items-center gap-1.5 bg-white/60 px-3 py-1 rounded-lg border border-white/60"><User className="w-4 h-4 text-blue-500" /> {patient?.age} Yrs • {patient?.gender}</span>
                                <span className="flex items-center gap-1.5 bg-white/60 px-3 py-1 rounded-lg border border-white/60"><FileText className="w-4 h-4 text-purple-500" /> {patient?.mrn_number}</span>
                                <span className="flex items-center gap-1.5 bg-white/60 px-3 py-1 rounded-lg border border-white/60"><Phone className="w-4 h-4 text-emerald-500" /> {patient?.contact_number}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {(() => {
                            const activeMlcOpd = opdHistory.find(opd => opd.is_mlc && ['Registered', 'In-consultation', 'Completed'].includes(opd.visit_status));
                            if (activeMlcOpd) {
                                return (
                                    <button
                                        onClick={() => fetchMlcDetails(activeMlcOpd.opd_id)}
                                        className="px-5 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-xl transition font-semibold flex items-center gap-2"
                                    >
                                        <FileText className="w-4 h-4" />
                                        MLC Form
                                    </button>
                                );
                            }
                            return null;
                        })()}

                        {(() => {
                            const activeVisit = opdHistory.find(opd => ['Registered', 'In-consultation'].includes(opd.visit_status));

                            if (activeVisit && !showConsultationForm) {
                                const isRegistered = activeVisit.visit_status === 'Registered';
                                return (
                                    <button
                                        onClick={handleStartConsultation}
                                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30 hover:scale-105"
                                    >
                                        <Stethoscope className="w-5 h-5" />
                                        {isRegistered ? 'Start Consultation' : 'Resume Session'}
                                    </button>
                                );
                            }
                            if (!activeVisit && !showConsultationForm) {
                                return (
                                    <div className="px-5 py-2 bg-slate-100 text-slate-500 rounded-xl font-medium border border-slate-200">
                                        No Active Visit
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>
                </div>
            </div>

            {/* Patient Context Card - Quick Clinical Summary */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-200/50 bg-gradient-to-r from-amber-50/30 via-white to-rose-50/30">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* ALLERGIES CARD - COMMENTED OUT 2026-02-04
                    <div className="flex items-start gap-3 p-3 bg-white/60 rounded-xl border border-rose-100">
                        <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                            <Activity className="w-5 h-5 text-rose-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Allergies</p>
                            <p className="text-sm font-semibold text-slate-800 truncate">
                                {patient?.allergies || 'None Recorded'}
                            </p>
                        </div>
                    </div>
                    */}

                    {/* Record Vitals - NEW */}
                    {(() => {
                        const activeVisit = opdHistory.find(opd => ['Registered', 'In-consultation'].includes(opd.visit_status));
                        const hasVitals = activeVisit && (
                            activeVisit.grbs || activeVisit.spo2 || activeVisit.pulse ||
                            activeVisit.height || activeVisit.weight || activeVisit.bp_systolic ||
                            activeVisit.bp_diastolic || activeVisit.temperature
                        );

                        return (
                            <button
                                onClick={() => {
                                    if (activeVisit) {
                                        // Navigate to vitals page for editing or adding
                                        router.push(`/doctor/patients/${params.id}/vitals?opd_id=${activeVisit.opd_id}`);
                                    } else {
                                        showCustomAlert('info', 'No Active Visit', 'Please start a consultation first to record vitals.');
                                    }
                                }}
                                className="flex items-start gap-3 p-3 bg-white/60 hover:bg-emerald-50/60 rounded-xl border border-emerald-100 hover:border-emerald-300 transition-all group cursor-pointer w-full text-left"
                            >
                                <div className="w-10 h-10 rounded-lg bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center flex-shrink-0 transition-colors">
                                    <Activity className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                                        {hasVitals ? 'Vital Signs' : 'Record Vitals'}
                                    </p>
                                    <p className="text-sm font-semibold text-slate-700 group-hover:text-emerald-700 transition-colors">
                                        {hasVitals ? 'Edit Vitals' : 'Add Vitals'}
                                    </p>
                                </div>
                                <Plus className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        );
                    })()}

                    {/* Blood Group */}
                    <div className="flex items-start gap-3 p-3 bg-white/60 rounded-xl border border-red-100">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-red-600 font-bold text-sm">🩸</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Blood Group</p>
                            <p className="text-sm font-bold text-slate-800">
                                {patient?.blood_group || 'Unknown'}
                            </p>
                        </div>
                    </div>

                    {/* Current Medications (from last consultation) */}
                    <div className="flex items-start gap-3 p-3 bg-white/60 rounded-xl border border-blue-100">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Current Meds</p>
                            {(() => {
                                const lastConsult = consultationHistory[0];
                                let meds = lastConsult?.prescription_medications;
                                if (typeof meds === 'string') {
                                    try { meds = JSON.parse(meds); } catch (e) { meds = []; }
                                }
                                if (Array.isArray(meds) && meds.length > 0) {
                                    return (
                                        <div className="flex flex-wrap gap-1 mt-0.5">
                                            {meds.slice(0, 2).map((m: any, i: number) => (
                                                <span key={i} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                                                    {m.name}
                                                </span>
                                            ))}
                                            {meds.length > 2 && (
                                                <span className="text-xs text-blue-500">+{meds.length - 2}</span>
                                            )}
                                        </div>
                                    );
                                }
                                return <p className="text-sm text-slate-500">None Active</p>;
                            })()}
                        </div>
                    </div>

                    {/* Last Visit */}
                    <div className="flex items-start gap-3 p-3 bg-white/60 rounded-xl border border-purple-100">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">Last Visit</p>
                            {(() => {
                                console.log('DEBUG: Full OpdHistory:', opdHistory);
                                // Find active visit (currently being attended)
                                const activeVisit = opdHistory.find(opd => ['Registered', 'In-consultation'].includes(opd.visit_status));
                                console.log('DEBUG: Active Visit:', activeVisit);

                                // Filter out the active visit to find true historical visits
                                const pastVisits = opdHistory.filter(opd => opd.opd_id !== activeVisit?.opd_id);
                                console.log('DEBUG: Past Visits (History):', pastVisits);

                                if (pastVisits.length > 0) {
                                    // Since opdHistory is sorted DESC, the first one remaining is the last visit
                                    const lastVisit = pastVisits[0];
                                    const consult = consultationHistory.find((c: any) => c.opd_id === lastVisit.opd_id);
                                    const diagnosis = consult?.diagnosis || lastVisit.diagnosis || lastVisit.chief_complaint || 'No diagnosis';

                                    return (
                                        <>
                                            <p className="text-sm font-semibold text-slate-800">
                                                {new Date(lastVisit.visit_date).toLocaleDateString()}
                                            </p>
                                            <p className="text-xs text-slate-500 truncate" title={diagnosis}>
                                                {diagnosis}
                                            </p>
                                        </>
                                    );
                                }
                                return <p className="text-sm text-slate-500 italic">No Past Visits</p>;
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Clinical Cockpit Workspace */}
            <div className="flex flex-col lg:flex-row gap-6 items-start animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* LEFT CONTEXT PANEL (30%) */}
                <div className="w-full lg:w-1/3 space-y-6 lg:sticky lg:top-6">

                    {/* Active Visit Vitals Card */}
                    {(() => {
                        const activeVisit = opdHistory.find(opd => ['Registered', 'In-consultation'].includes(opd.visit_status));
                        if (activeVisit) {
                            return (
                                <div className="glass-panel p-5 rounded-2xl border border-blue-200/50 bg-blue-50/30">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-blue-500" /> Live Vitals
                                        </h3>
                                        <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Current Visit</span>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="p-3 bg-white/60 rounded-xl border border-white/50 shadow-sm">
                                            <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Chief Complaint</p>
                                            <p className="font-medium text-slate-800">{activeVisit.chief_complaint}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            {activeVisit.vital_signs ? Object.entries(activeVisit.vital_signs).map(([key, value]) => (
                                                <div key={key} className="p-2 bg-white/60 rounded-lg border border-white/50 text-center">
                                                    <p className="text-[10px] text-slate-400 uppercase font-bold">{key.replace(/_/g, ' ')}</p>
                                                    <p className="font-bold text-slate-800">{String(value)}</p>
                                                </div>
                                            )) : <p className="text-sm text-slate-400 italic col-span-2">No vitals recorded</p>}
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })()}

                    {/* Quick Contact & History Info */}
                    <div className="glass-panel p-5 rounded-2xl border border-white/60">
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <HistoryIcon className="w-4 h-4 text-purple-500" /> Recent History
                        </h3>
                        <div className="space-y-4 relative">
                            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-200"></div>
                            {opdHistory.slice(0, 3).map((visit, idx) => {
                                const consult = consultationHistory.find((c: any) => c.opd_id === visit.opd_id);
                                const diagnosis = consult?.diagnosis || visit.diagnosis || 'No Diagnosis';
                                return (
                                    <div key={idx} className="relative pl-6">
                                        <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white bg-slate-300"></div>
                                        <p className="text-xs text-slate-400 font-medium">{new Date(visit.visit_date).toLocaleDateString()}</p>
                                        <p className="text-sm font-semibold text-slate-700 truncate" title={diagnosis}>{diagnosis}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* RIGHT WORKSPACE (70%) */}
                <div className="w-full lg:w-2/3">
                    {showConsultationForm ? (
                        <div className="glass-panel p-1 rounded-3xl border border-white/60 shadow-xl shadow-slate-200/50 bg-white/40 backdrop-blur-md">

                            {/* AI Scribe Header */}
                            <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-t-3xl text-white flex justify-between items-center shadow-lg relative overflow-hidden">
                                {isReviewMode ? (
                                    <div className="relative z-10 flex items-center gap-3">
                                        <div>
                                            <h3 className="font-bold leading-tight">Consultation Details</h3>
                                            <p className="text-xs text-slate-400">View Only</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>
                                        <div className="relative z-10 flex items-center gap-3">
                                            <div>
                                                <h3 className="font-bold leading-tight">Clinical Scribe</h3>
                                                <p className="text-xs text-slate-400">Ready to listen</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className={`p-6 space-y-8 min-h-[500px] ${isReviewMode ? 'pointer-events-none opacity-90' : ''}`}>
                                {/* 1. Clinical Notes (Paper-on-Glass) */}
                                <div className="relative group">
                                    <div className="absolute -left-3 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full opacity-50 group-hover:opacity-100 transition"></div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-2">Clinical Notes & Observations</label>
                                    <textarea
                                        className="w-full bg-white/50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-slate-700 text-sm font-medium leading-relaxed resize-none shadow-inner"
                                        rows={4}
                                        value={consultationData.notes}
                                        onChange={(e) => setConsultationData({ ...consultationData, notes: e.target.value })}
                                        placeholder="Start typing or speak to describe symptoms..."
                                    />
                                </div>

                                {/* 2. Diagnosis & Labs Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Diagnosis</label>
                                        <div className="relative">
                                            <textarea
                                                className="w-full bg-white/50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all text-slate-700 text-sm font-medium h-32 resize-none shadow-inner"
                                                value={consultationData.diagnosis}
                                                onChange={(e) => setConsultationData({ ...consultationData, diagnosis: e.target.value })}
                                                placeholder="Enter Diagnosis..."
                                            />
                                            <div className="absolute bottom-2 right-2 p-1.5 bg-white rounded-lg shadow-sm border border-slate-100 cursor-pointer hover:bg-purple-50">
                                                <Sparkles className="w-4 h-4 text-purple-500" />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Lab Orders</label>
                                        <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-3 min-h-[128px] flex flex-col">
                                            <div className="relative z-10">
                                                <div className="flex gap-2 mb-2">
                                                    <input
                                                        type="text"
                                                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300 transition-all outline-none"
                                                        placeholder="Search Test Name..."
                                                        value={newLab.test_name}
                                                        onChange={(e) => handleLabSearch(e.target.value)}
                                                        onFocus={() => { if (newLab.test_name.length >= 2) setShowLabDropdown(true); }}
                                                        onBlur={() => setTimeout(() => setShowLabDropdown(false), 200)} // Delay to allow click
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleAddLab();
                                                            }
                                                        }}
                                                    />
                                                    <button onClick={handleAddLab} className="p-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-600 transition">
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* Search Dropdown */}
                                                {showLabDropdown && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-[100] max-h-48 overflow-y-auto">
                                                        {isSearchingLabs ? (
                                                            <div className="p-3 text-xs text-slate-500 text-center">Searching...</div>
                                                        ) : labSearchResults.length > 0 ? (
                                                            <ul>
                                                                {labSearchResults.map((service) => (
                                                                    <li
                                                                        key={service.service_id}
                                                                        className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm border-b border-slate-50 last:border-none flex justify-between items-center"
                                                                        onMouseDown={() => selectLabService(service)}
                                                                    >
                                                                        <span className="font-medium text-slate-700">{service.service_name}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <div className="p-3 text-xs text-slate-500 text-center">No results found</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                                                {consultationData.labs.map((lab, index) => (
                                                    <div key={index} className="flex justify-between items-center bg-white px-3 py-1.5 rounded-lg border border-slate-100 text-xs shadow-sm">
                                                        <span className="font-semibold text-slate-700">{lab.test_name}</span>
                                                        <button onClick={() => removeLab(index)} className="text-slate-400 hover:text-red-500">×</button>
                                                    </div>
                                                ))}
                                                {consultationData.labs.length === 0 && <p className="text-xs text-slate-400 text-center mt-4">No labs added</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Prescription Pad */}
                                <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-2xl border border-blue-100 p-5">

                                    <div className="grid grid-cols-12 gap-3 mb-4 bg-white/60 p-3 rounded-xl border border-blue-100/50 shadow-sm">
                                        <div className="col-span-4">
                                            <input
                                                type="text" placeholder="Medicine Name"
                                                className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-semibold placeholder:font-normal"
                                                value={newMedication.name}
                                                onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <input
                                                type="text" placeholder="Dose (500mg)"
                                                className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm border-l border-slate-200 pl-2"
                                                value={newMedication.dosage}
                                                onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-span-4 flex items-center gap-2 text-xs">
                                            {['Mor', 'Noon', 'Night'].map((time) => (
                                                <label key={time} className="cursor-pointer flex items-center gap-1 hover:bg-blue-50 px-1 py-0.5 rounded transition">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!(newMedication as any)[time.toLowerCase()]}
                                                        onChange={(e) => setNewMedication({ ...newMedication, [time.toLowerCase()]: e.target.checked })}
                                                        className="rounded text-blue-600 w-3 h-3"
                                                    /> {time}
                                                </label>
                                            ))}
                                            <div className="ml-2 flex bg-slate-100 rounded p-0.5">
                                                <button
                                                    className={`px-1.5 py-0.5 text-[10px] rounded ${newMedication.food_timing === 'After Food' ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                                                    onClick={() => setNewMedication({ ...newMedication, food_timing: 'After Food' })}
                                                >A/F</button>
                                                <button
                                                    className={`px-1.5 py-0.5 text-[10px] rounded ${newMedication.food_timing === 'Before Food' ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                                                    onClick={() => setNewMedication({ ...newMedication, food_timing: 'Before Food' })}
                                                >B/F</button>
                                            </div>
                                        </div>
                                        <div className="col-span-1 flex justify-end">
                                            <button onClick={handleAddMedication} className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-md transition hover:scale-110">
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {consultationData.medications.map((med, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 text-sm shadow-sm hover:shadow-md transition">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs ring-2 ring-white">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800">{med.name} <span className="text-slate-400 font-normal text-xs">({med.dosage})</span></p>
                                                        <p className="text-xs text-slate-500">
                                                            {[med.morning && 'Mor', med.noon && 'Noon', med.night && 'Night'].filter(Boolean).join(' - ')} • {med.food_timing}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button className="text-slate-300 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Next Visit & Actions */}
                                <div className="flex flex-col md:flex-row gap-4 items-end pt-4 border-t border-slate-100">
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Next Visit</label>
                                        <div className="flex flex-col sm:flex-row gap-4 mt-2">
                                            <input
                                                type="date"
                                                min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
                                                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all hover:bg-white flex-1 sm:flex-none sm:w-48 cursor-pointer"
                                                value={consultationData.next_visit_date}
                                                onChange={(e) => setConsultationData({ ...consultationData, next_visit_date: e.target.value })}
                                            />
                                            <div className="relative flex-1">
                                                <select
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm flex-1 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all hover:bg-white appearance-none cursor-pointer"
                                                    value={consultationData.next_visit_status}
                                                    onChange={(e) => setConsultationData({ ...consultationData, next_visit_status: e.target.value })}
                                                >
                                                    <option value="Follow-up Required">Follow-up Required</option>
                                                    <option value="Not Necessary">Not Necessary</option>
                                                </select>
                                                <div className="absolute right-4 top-3.5 pointer-events-none text-slate-400">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Referral Section */}
                            <div className="mt-8 border-t border-slate-200 pt-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <input
                                        type="checkbox"
                                        id="isReferralExpanded"
                                        checked={isReferralExpanded}
                                        onChange={(e) => setIsReferralExpanded(e.target.checked)}
                                        className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                    />
                                    <label htmlFor="isReferralExpanded" className="text-sm font-bold text-slate-700 uppercase cursor-pointer flex items-center gap-2">
                                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                        </svg>
                                        Patient Referral (Optional)
                                    </label>
                                </div>

                                {isReferralExpanded && (
                                    <div className="relative group">
                                        <div className="absolute -inset-0.5 bg-slate-200 rounded-2xl opacity-40 blur transition duration-500"></div>
                                        <div className="relative bg-white rounded-2xl p-6 border border-slate-100 shadow-xl">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Referral Hospital</label>
                                                    <div className="relative group/input">
                                                        <select
                                                            value={selectedReferralHospital}
                                                            onChange={(e) => {
                                                                setSelectedReferralHospital(e.target.value);
                                                                setConsultationData({ ...consultationData, referral_doctor_id: '' });
                                                            }}
                                                            className="w-full bg-slate-50/50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all appearance-none cursor-pointer hover:bg-white"
                                                        >
                                                            <option value="">Select Target Hospital...</option>
                                                            {referralHospitals.map((hospital: any) => (
                                                                <option key={hospital.referral_hospital_id} value={hospital.referral_hospital_id}>
                                                                    {hospital.hospital_name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute right-4 top-3.5 pointer-events-none text-slate-400 group-hover/input:text-purple-500 transition-colors">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Referral Doctor</label>
                                                    <div className="relative group/input">
                                                        <select
                                                            value={consultationData.referral_doctor_id}
                                                            onChange={(e) => setConsultationData({ ...consultationData, referral_doctor_id: e.target.value })}
                                                            className="w-full bg-slate-50/50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all appearance-none cursor-pointer hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                                            disabled={!selectedReferralHospital}
                                                        >
                                                            <option value="">Select Specialist...</option>
                                                            {referralDoctors
                                                                .filter((doc: any) => !selectedReferralHospital || doc.referral_hospital_id.toString() === selectedReferralHospital)
                                                                .map((doc: any) => (
                                                                    <option key={doc.referral_doctor_id} value={doc.referral_doctor_id}>
                                                                        {doc.doctor_name} - {doc.specialization}
                                                                    </option>
                                                                ))}
                                                        </select>
                                                        <div className="absolute right-4 top-3.5 pointer-events-none text-slate-400 group-hover/input:text-purple-500 transition-colors">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="md:col-span-2 space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Referral Notes / Reason</label>
                                                    <textarea
                                                        rows={2}
                                                        value={consultationData.referral_notes}
                                                        onChange={(e) => setConsultationData({ ...consultationData, referral_notes: e.target.value })}
                                                        className="w-full bg-slate-50/50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-slate-400 resize-none hover:bg-white"
                                                        placeholder="Describe the reason for referral and clinical context..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* Death Intimation Section */}
                            <div className="mt-6 border-t border-gray-200 pt-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <input
                                        type="checkbox"
                                        id="isPatientDeceased"
                                        checked={isPatientDeceased}
                                        onChange={(e) => handleToggleDeceased(e.target.checked)}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="isPatientDeceased" className="text-sm font-bold text-slate-700 uppercase cursor-pointer">
                                        Patient Deceased?
                                    </label>
                                </div>

                                {isPatientDeceased && (
                                    <div className="bg-red-50 border border-red-100 rounded-lg p-5">
                                        <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                                            <Activity size={18} /> Death Details
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Death</label>
                                                <input
                                                    type="date"
                                                    className="w-full border border-gray-300 rounded-lg p-2"
                                                    value={deathCertData.date_of_death}
                                                    onChange={(e) => setDeathCertData({ ...deathCertData, date_of_death: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Time of Death</label>
                                                <input
                                                    type="time"
                                                    className="w-full border border-gray-300 rounded-lg p-2"
                                                    value={deathCertData.time_of_death}
                                                    onChange={(e) => setDeathCertData({ ...deathCertData, time_of_death: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cause of Death</label>
                                            <textarea
                                                className="w-full bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all text-sm h-20 resize-none"
                                                value={deathCertData.cause_of_death}
                                                onChange={(e) => setDeathCertData({ ...deathCertData, cause_of_death: e.target.value })}
                                                placeholder="Immediate cause, antecedent cause, etc."
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">History / Circumstances of Death</label>
                                            <textarea
                                                className="w-full bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all text-sm h-20 resize-none"
                                                value={deathCertData.death_circumstances}
                                                onChange={(e) => setDeathCertData({ ...deathCertData, death_circumstances: e.target.value })}
                                                placeholder="As alleged by relatives..."
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="is_death_mlc_inline"
                                                    checked={deathCertData.is_death_mlc}
                                                    onChange={(e) => setDeathCertData({ ...deathCertData, is_death_mlc: e.target.checked })}
                                                    className="w-4 h-4 text-red-600 rounded"
                                                />
                                                <label htmlFor="is_death_mlc_inline" className="font-medium text-gray-700">Is MLC Case?</label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="post_mortem_inline"
                                                    checked={deathCertData.post_mortem_required}
                                                    onChange={(e) => setDeathCertData({ ...deathCertData, post_mortem_required: e.target.checked })}
                                                    className="w-4 h-4 text-red-600 rounded"
                                                />
                                                <label htmlFor="post_mortem_inline" className="font-medium text-gray-700">Post-mortem Required?</label>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Declared Dead By</label>
                                                <input
                                                    type="text"
                                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                                    value={deathCertData.declared_dead_by}
                                                    onChange={(e) => setDeathCertData({ ...deathCertData, declared_dead_by: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Police Station</label>
                                                <input
                                                    type="text"
                                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                                    value={deathCertData.death_police_station}
                                                    onChange={(e) => setDeathCertData({ ...deathCertData, death_police_station: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                                                <input
                                                    type="text"
                                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                                    value={deathCertData.death_police_district}
                                                    onChange={(e) => setDeathCertData({ ...deathCertData, death_police_district: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="border-t pt-4 mt-4">
                                            <h3 className="font-medium mb-2">Relatives Informed</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name & Relationship</label>
                                                    <input
                                                        type="text"
                                                        className="w-full border rounded-lg px-3 py-2"
                                                        value={deathCertData.relatives_name}
                                                        onChange={(e) => setDeathCertData({ ...deathCertData, relatives_name: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    {/* <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                                <input
                                                    type="text"
                                                    className="w-full border rounded-lg px-3 py-2"
                                                    value={deathCertData.relatives_number}
                                                    onChange={(e) => setDeathCertData({ ...deathCertData, relatives_number: e.target.value })}
                                                /> */}
                                                    {/* <div> */}
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Contact Number
                                                    </label>

                                                    <input
                                                        type="text"
                                                        className="w-full border rounded-lg px-3 py-2"
                                                        value={deathCertData.relatives_number}
                                                        onChange={(e) => {
                                                            const value = e.target.value.replace(/\D/g, ""); // allow digits only
                                                            setDeathCertData({ ...deathCertData, relatives_number: value });
                                                        }}
                                                        maxLength={10}
                                                        placeholder="Enter 10 digit number"
                                                    />
                                                    {/* </div> */}

                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time Notified</label>
                                                    <input
                                                        type="datetime-local"
                                                        className="w-full border rounded-lg px-3 py-2"
                                                        value={deathCertData.relatives_notified_at}
                                                        onChange={(e) => setDeathCertData({ ...deathCertData, relatives_notified_at: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex justify-end">
                                            <button
                                                onClick={handlePrintDeathCert}
                                                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-black font-medium text-sm flex items-center gap-2"
                                                type="button"
                                            >
                                                <FileText size={14} /> Print Death Intimation
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowConsultationForm(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    {isReviewMode ? 'Close' : 'Cancel'}
                                </button>
                                <button
                                    onClick={handlePrintDraft}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2"
                                >
                                    <FileText className="w-4 h-4" />
                                    Print {isReviewMode ? 'Record' : 'Draft'}
                                </button>
                                {!isReviewMode && (
                                    <>
                                        <button
                                            onClick={handleSaveDraft}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                            </svg>
                                            Save Draft
                                        </button>
                                        <button
                                            onClick={handleCompleteConsultation}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Complete Consultation
                                        </button>
                                    </>
                                )}
                            </div>


                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10 pt-8 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl -mx-6 -mb-6 px-8 pb-8">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                                        <Phone className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Contact</p>
                                        <p className="text-slate-800 font-bold text-sm">{patient?.contact_number}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                                        <MapPin className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Address</p>
                                        <p className="text-slate-800 font-bold text-sm truncate max-w-[200px]" title={`${patient?.city}, ${patient?.state}`}>
                                            {patient?.city}, {patient?.state}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                                        <Activity className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Blood Group</p>
                                        <p className="text-slate-800 font-bold text-sm">{patient?.blood_group || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : isReviewMode ? null : (
                        <div className="glass-panel p-12 rounded-3xl border border-white/60 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
                            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                <Stethoscope className="w-10 h-10 text-blue-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Ready for Consultation</h2>
                            <p className="text-slate-500 max-w-md">
                                Please select "Start Consultation" from the header to begin the session. The AI Scribe will be ready to assist you.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* History Section - Tabs or Stacked */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 mb-12">

                {/* OPD Visit History */}
                <div className="glass-panel p-6 rounded-3xl border border-white/60 bg-white/40 shadow-sm transition hover:shadow-md">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-600" />
                            OPD Visits
                        </h2>
                        <span className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                            {opdHistory.filter(visit => !['Registered', 'In-consultation'].includes(visit.visit_status)).length} Records
                        </span>
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                        {opdHistory.filter(visit => !['Registered', 'In-consultation'].includes(visit.visit_status)).length > 0 ? (
                            opdHistory.filter(visit => !['Registered', 'In-consultation'].includes(visit.visit_status)).map((visit) => (
                                <div key={visit.opd_id} className="relative group bg-white/50 hover:bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-md transition-all duration-300">
                                    <div className="absolute left-0 top-6 w-1 h-8 bg-blue-400 rounded-r-full group-hover:h-12 transition-all"></div>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(visit.visit_date).toLocaleDateString()}
                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                            {visit.visit_time}
                                        </div>
                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${visit.visit_type === 'New' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {visit.visit_type}
                                        </span>
                                    </div>

                                    <div className="mb-3">
                                        <p className="font-bold text-slate-800 text-lg leading-tight mb-1">{visit.reason_for_visit}</p>
                                        <p className="text-sm text-slate-600 leading-snug">{visit.symptoms}</p>
                                    </div>

                                    {(() => {
                                        const consult = consultationHistory.find((c: any) => c.opd_id === visit.opd_id);
                                        const diag = consult?.diagnosis || visit.diagnosis;
                                        return diag ? (
                                            <div className="bg-slate-50 rounded-xl p-3 mb-3">
                                                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Diagnosis</p>
                                                <p className="text-sm font-semibold text-slate-700">{diag}</p>
                                            </div>
                                        ) : null;
                                    })()}


                                    {/* Vitals Display */}
                                    {(visit.grbs || visit.spo2 || visit.pulse || visit.height || visit.weight || visit.bp_systolic || visit.bp_diastolic || visit.temperature) && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {visit.grbs && (
                                                <span className="px-2 py-1 bg-white border border-slate-100 rounded text-[10px] font-medium text-slate-500">
                                                    GRBS: <span className="text-slate-900">{visit.grbs} mg/dL</span>
                                                </span>
                                            )}
                                            {visit.spo2 && (
                                                <span className="px-2 py-1 bg-white border border-slate-100 rounded text-[10px] font-medium text-slate-500">
                                                    SpO2: <span className="text-slate-900">{visit.spo2}%</span>
                                                </span>
                                            )}
                                            {visit.pulse && (
                                                <span className="px-2 py-1 bg-white border border-slate-100 rounded text-[10px] font-medium text-slate-500">
                                                    Pulse: <span className="text-slate-900">{visit.pulse} bpm</span>
                                                </span>
                                            )}
                                            {(visit.bp_systolic || visit.bp_diastolic) && (
                                                <span className="px-2 py-1 bg-white border border-slate-100 rounded text-[10px] font-medium text-slate-500">
                                                    BP: <span className="text-slate-900">{visit.bp_systolic || '--'}/{visit.bp_diastolic || '--'} mmHg</span>
                                                </span>
                                            )}
                                            {visit.temperature && (
                                                <span className="px-2 py-1 bg-white border border-slate-100 rounded text-[10px] font-medium text-slate-500">
                                                    Temp: <span className="text-slate-900">{visit.temperature}°F</span>
                                                </span>
                                            )}
                                            {visit.height && (
                                                <span className="px-2 py-1 bg-white border border-slate-100 rounded text-[10px] font-medium text-slate-500">
                                                    Height: <span className="text-slate-900">{visit.height} cm</span>
                                                </span>
                                            )}
                                            {visit.weight && (
                                                <span className="px-2 py-1 bg-white border border-slate-100 rounded text-[10px] font-medium text-slate-500">
                                                    Weight: <span className="text-slate-900">{visit.weight} kg</span>
                                                </span>
                                            )}
                                        </div>
                                    )}


                                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100/50">
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-[10px] text-white font-bold">
                                            Dr
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium">{visit.doctor_first_name} {visit.doctor_last_name} <span className="text-slate-300">|</span> {visit.specialization}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <Activity className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                <p className="text-slate-400 font-medium">No past OPD visits found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Consultation History */}
                <div className="glass-panel p-6 rounded-3xl border border-white/60 bg-white/40 shadow-sm transition hover:shadow-md">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <FileBadge className="w-5 h-5 text-purple-600" />
                            Consultations
                        </h2>
                        <span className="text-xs font-bold bg-purple-100 text-purple-700 px-3 py-1 rounded-full border border-purple-200">
                            {consultationHistory.length} Records
                        </span>
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                        {consultationHistory.length > 0 ? (
                            consultationHistory.map((consult) => (
                                <div key={consult.outcome_id} className="relative group bg-white/50 hover:bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-md transition-all duration-300">
                                    <div className="absolute left-0 top-6 w-1 h-8 bg-purple-400 rounded-r-full group-hover:h-12 transition-all"></div>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(consult.created_at).toLocaleDateString()}
                                            <span className={`px-2 py-0.5 rounded text-[10px] ${consult.consultation_status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {consult.consultation_status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-sm text-slate-600 italic mb-2">"{consult.notes}"</p>
                                        <p className="font-bold text-slate-800">{consult.diagnosis}</p>
                                    </div>

                                    {/* Meds Preview */}
                                    {(() => {
                                        let meds = consult.prescription_medications;
                                        if (typeof meds === 'string') {
                                            try { meds = JSON.parse(meds); } catch (e) { meds = []; }
                                        }
                                        if (Array.isArray(meds) && meds.length > 0) {
                                            return (
                                                <div className="bg-purple-50/50 rounded-xl p-3 mb-3 border border-purple-100/50">
                                                    <p className="text-[10px] text-purple-400 font-bold uppercase mb-2">Prescribed</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {meds.slice(0, 3).map((m: any, i: number) => (
                                                            <span key={i} className="px-2 py-1 bg-white rounded text-xs text-purple-800 border border-purple-100">
                                                                {m.name}
                                                            </span>
                                                        ))}
                                                        {meds.length > 3 && <span className="px-2 py-1 text-xs text-purple-500">+{meds.length - 3} more</span>}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}

                                    <div className="flex justify-between items-center pt-3 border-t border-slate-100/50">
                                        <p className="text-xs text-slate-500 font-medium">Dr. {consult.doctor_first_name} {consult.doctor_last_name}</p>
                                        <button
                                            onClick={() => handlePrintPrescription(consult)}
                                            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition"
                                        >
                                            <FileText className="w-3 h-3" /> Prescription
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <FileBadge className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                <p className="text-slate-400 font-medium">No consultation records</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MLC Modal */}
            {
                showMlcModal && (
                    <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {existingMlc ? `MLC Certificate: ${existingMlc.mlc_number}` : 'Generate MLC Certificate'}
                                </h2>
                                <button onClick={() => setShowMlcModal(false)} className="text-gray-500 hover:text-gray-700">
                                    <span className="text-2xl">×</span>
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Police Station Name</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded-lg p-2"
                                            placeholder="Enter Station Name"
                                            value={mlcData.police_station}
                                            onChange={(e) => setMlcData({ ...mlcData, police_station: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded-lg p-2"
                                            placeholder="Enter District"
                                            value={mlcData.police_station_district}
                                            onChange={(e) => setMlcData({ ...mlcData, police_station_district: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Brought By</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg p-2"
                                        placeholder="Name of person who brought the patient"
                                        value={mlcData.brought_by}
                                        onChange={(e) => setMlcData({ ...mlcData, brought_by: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">History (Alleged by patient/attendant)</label>
                                    <textarea
                                        className="w-full border border-gray-300 rounded-lg p-2"
                                        rows={3}
                                        placeholder="Describe the history of the incident..."
                                        value={mlcData.history_alleged}
                                        onChange={(e) => setMlcData({ ...mlcData, history_alleged: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Brief Injury Description *</label>
                                    <textarea
                                        className="w-full border border-gray-300 rounded-lg p-2"
                                        rows={3}
                                        placeholder="Describe visible injuries..."
                                        value={mlcData.injury_description}
                                        onChange={(e) => setMlcData({ ...mlcData, injury_description: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Opinion / Nature of Injury *</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg p-2"
                                        value={mlcData.nature_of_injury}
                                        onChange={(e) => setMlcData({ ...mlcData, nature_of_injury: e.target.value })}
                                    >
                                        <option value="Simple">Simple</option>
                                        <option value="Grievous">Grievous</option>
                                        <option value="Dangerous to Life">Dangerous to Life</option>
                                    </select>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
                                <button
                                    onClick={() => setShowMlcModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium"
                                >
                                    Close
                                </button>
                                {existingMlc && (
                                    <button
                                        onClick={handlePrintMlc}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                                    >
                                        <FileText className="w-4 h-4" />
                                        MLC Certificate
                                    </button>
                                )}

                                <button
                                    onClick={handleSaveMlc}
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                                >
                                    {existingMlc ? 'Update Details' : 'Generate Certificate'}
                                </button>
                                <button
                                    onClick={() => handleOpenWoundCert()}
                                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                                    title="Generate Wound Certificate"
                                >
                                    <FileText size={18} />
                                    Wound Cert
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showWoundCertModal && (
                    <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold">Wound Certificate Details</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time of Incident</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full border rounded-lg px-3 py-2"
                                            value={woundCertData.incident_date_time}
                                            onChange={(e) => setWoundCertData({ ...woundCertData, incident_date_time: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Alleged Cause / Weapon</label>
                                        <input
                                            type="text"
                                            className="w-full border rounded-lg px-3 py-2"
                                            value={woundCertData.alleged_cause}
                                            onChange={(e) => setWoundCertData({ ...woundCertData, alleged_cause: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">History (As alleged) / Clinical History</label>
                                    <textarea
                                        className="w-full border rounded-lg px-3 py-2 h-24"
                                        value={woundCertData.history_alleged}
                                        onChange={(e) => setWoundCertData({ ...woundCertData, history_alleged: e.target.value })}
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Examination Findings</label>
                                    <textarea
                                        className="w-full border rounded-lg px-3 py-2 h-24"
                                        value={woundCertData.examination_findings}
                                        onChange={(e) => setWoundCertData({ ...woundCertData, examination_findings: e.target.value })}
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nature of Injury</label>
                                        <select
                                            className="w-full border rounded-lg px-3 py-2"
                                            value={woundCertData.nature_of_injury}
                                            onChange={(e) => setWoundCertData({ ...woundCertData, nature_of_injury: e.target.value })}
                                        >
                                            <option value="Simple">Simple</option>
                                            <option value="Grievous">Grievous</option>
                                            <option value="Dangerous to Life">Dangerous to Life</option>
                                            {/* Matches printed text options? Or just generic */}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Danger to Life</label>
                                        <select
                                            className="w-full border rounded-lg px-3 py-2"
                                            value={woundCertData.danger_to_life}
                                            onChange={(e) => setWoundCertData({ ...woundCertData, danger_to_life: e.target.value })}
                                        >
                                            <option value="No">No</option>
                                            <option value="Yes">Yes</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Age of Injuries</label>
                                        <input
                                            type="text"
                                            className="w-full border rounded-lg px-3 py-2"
                                            placeholder="e.g. < 6 hours"
                                            value={woundCertData.age_of_injuries}
                                            onChange={(e) => setWoundCertData({ ...woundCertData, age_of_injuries: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                                        <input
                                            type="text"
                                            className="w-full border rounded-lg px-3 py-2"
                                            value={woundCertData.remarks}
                                            onChange={(e) => setWoundCertData({ ...woundCertData, remarks: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Given</label>
                                    <textarea
                                        className="w-full border rounded-lg px-3 py-2 h-16"
                                        value={woundCertData.treatment_given}
                                        onChange={(e) => setWoundCertData({ ...woundCertData, treatment_given: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
                                <button
                                    onClick={() => setShowWoundCertModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={handlePrintWoundCert}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium flex items-center gap-2"
                                >
                                    <FileText className="w-4 h-4" />
                                    Print Certificate
                                </button>
                                <button
                                    onClick={handleSaveWoundCert}
                                    className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
                                >
                                    Save Details
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showDeathCertModal && (
                    <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200 bg-white text-gray-900 rounded-t-xl">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Activity className="text-blue-600" />
                                    Death Intimation Details
                                </h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Death</label>
                                        <input
                                            type="date"
                                            className="w-full border rounded-lg px-3 py-2"
                                            value={deathCertData.date_of_death}
                                            onChange={(e) => setDeathCertData({ ...deathCertData, date_of_death: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Time of Death</label>
                                        <input
                                            type="time"
                                            className="w-full border rounded-lg px-3 py-2"
                                            value={deathCertData.time_of_death}
                                            onChange={(e) => setDeathCertData({ ...deathCertData, time_of_death: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Declared Dead By (Doctor Name)</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg px-3 py-2"
                                        value={deathCertData.declared_dead_by}
                                        onChange={(e) => setDeathCertData({ ...deathCertData, declared_dead_by: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Provisional Cause of Death</label>
                                    <textarea
                                        className="w-full border rounded-lg px-3 py-2 h-20"
                                        value={deathCertData.cause_of_death}
                                        onChange={(e) => setDeathCertData({ ...deathCertData, cause_of_death: e.target.value })}
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">History / Circumstances</label>
                                    <textarea
                                        className="w-full border rounded-lg px-3 py-2 h-20"
                                        value={deathCertData.death_circumstances}
                                        onChange={(e) => setDeathCertData({ ...deathCertData, death_circumstances: e.target.value })}
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="is_death_mlc"
                                            checked={deathCertData.is_death_mlc}
                                            onChange={(e) => setDeathCertData({ ...deathCertData, is_death_mlc: e.target.checked })}
                                            className="w-4 h-4 text-red-600 rounded"
                                        />
                                        <label htmlFor="is_death_mlc" className="font-medium text-gray-700">Is MLC Case?</label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="post_mortem_required"
                                            checked={deathCertData.post_mortem_required}
                                            onChange={(e) => setDeathCertData({ ...deathCertData, post_mortem_required: e.target.checked })}
                                            className="w-4 h-4 text-red-600 rounded"
                                        />
                                        <label htmlFor="post_mortem_required" className="font-medium text-gray-700">Post-mortem Required?</label>
                                    </div>
                                </div>

                                <div className={`grid grid-cols-1 gap-4 ${deathCertData.is_death_mlc ? 'block' : 'hidden'}`}>
                                    <div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Police Station</label>
                                                <input
                                                    type="text"
                                                    className="w-full border rounded-lg px-3 py-2"
                                                    value={deathCertData.death_police_station}
                                                    onChange={(e) => setDeathCertData({ ...deathCertData, death_police_station: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                                                <input
                                                    type="text"
                                                    className="w-full border rounded-lg px-3 py-2"
                                                    value={deathCertData.death_police_district}
                                                    onChange={(e) => setDeathCertData({ ...deathCertData, death_police_district: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-4 mt-4">
                                    <h3 className="font-medium mb-2">Relatives Informed</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Name & Relationship</label>
                                            <input
                                                type="text"
                                                className="w-full border rounded-lg px-3 py-2"
                                                value={deathCertData.relatives_name}
                                                onChange={(e) => setDeathCertData({ ...deathCertData, relatives_name: e.target.value })}
                                            />
                                        </div>
                                        {/* <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                            <input
                                                type="text"
                                                className="w-full border rounded-lg px-3 py-2"
                                                value={deathCertData.relatives_number}
                                                onChange={(e) => setDeathCertData({ ...deathCertData, relatives_number: e.target.value })}
                                            />
                                        </div> */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Contact Number
                                            </label>

                                            <input
                                                type="text"
                                                className="w-full border rounded-lg px-3 py-2"
                                                value={deathCertData.relatives_number}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\D/g, ""); // allow digits only
                                                    setDeathCertData({ ...deathCertData, relatives_number: value });
                                                }}
                                                maxLength={10}
                                                placeholder="Enter 10 digit number"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time Notified</label>
                                            <input
                                                type="datetime-local"
                                                className="w-full border rounded-lg px-3 py-2"
                                                value={deathCertData.relatives_notified_at}
                                                onChange={(e) => setDeathCertData({ ...deathCertData, relatives_notified_at: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
                                <button
                                    onClick={() => setShowDeathCertModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={handlePrintDeathCert}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium flex items-center gap-2"
                                >
                                    <FileText className="w-4 h-4" />
                                    Print Certificate
                                </button>
                                <button
                                    onClick={handleSaveDeathDetails}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                >
                                    Save Details
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }


            {/* Template Selector Modal */}

            {/* Custom Alert Modal */}
            {showAlert && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fadeIn">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowAlert(false)}
                    ></div>

                    {/* Modal */}
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slideUp">
                        {/* Colored Header Bar */}
                        <div className={`h-2 ${alertConfig.type === 'success' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                            alertConfig.type === 'error' ? 'bg-gradient-to-r from-red-400 to-rose-500' :
                                'bg-gradient-to-r from-blue-400 to-indigo-500'
                            }`}></div>

                        <div className="p-6">
                            {/* Icon */}
                            <div className="flex items-center justify-center mb-4">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${alertConfig.type === 'success' ? 'bg-green-100' :
                                    alertConfig.type === 'error' ? 'bg-red-100' :
                                        'bg-blue-100'
                                    }`}>
                                    {alertConfig.type === 'success' && <CheckCircle className="w-8 h-8 text-green-600" />}
                                    {alertConfig.type === 'error' && <XCircle className="w-8 h-8 text-red-600" />}
                                    {alertConfig.type === 'info' && <Info className="w-8 h-8 text-blue-600" />}
                                </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                                {alertConfig.title}
                            </h3>

                            {/* Message */}
                            <p className="text-gray-600 text-center mb-6">
                                {alertConfig.message}
                            </p>

                            {/* OK Button */}
                            <button
                                onClick={() => setShowAlert(false)}
                                className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${alertConfig.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/30' :
                                    alertConfig.type === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg shadow-red-500/30' :
                                        'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/30'
                                    }`}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div >
    );
}
