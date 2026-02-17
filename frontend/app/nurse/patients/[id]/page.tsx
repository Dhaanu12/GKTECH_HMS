'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    User,
    Phone,
    MapPin,
    Calendar,
    Clock,
    Loader2,
    Activity,
    HeartPulse,
    FileText,
    TestTube,
    AlertTriangle,
    Thermometer,
    Wind,
    Droplets,
    Stethoscope,
    History,
    Download,
    Eye,
    Upload,
    Image,
    File,
    Trash2,
    X,
    ChevronDown,
    Beaker,
    Plus,
    Pin,
    PinOff,
    Edit3,
    Search,
    TrendingUp,
    TrendingDown,
    Minus,
    MessageSquare,
    ClipboardList,
    Pill,
    AlertCircle,
    ChevronRight,
    Filter,
    Save,
    Ruler
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AIInsightCard, AILoadingIndicator, useAI } from '@/components/ai';
import { analyzeVitals, summarizePatient, suggestNotes, VitalsData, PatientInfo as AIPatientInfo } from '@/lib/api/ai';
import { Sparkles } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

// Note type colors and icons
const noteTypeConfig: Record<string, { color: string; bg: string; icon: any }> = {
    'General': { color: 'text-slate-600', bg: 'bg-slate-100', icon: FileText },
    'SOAP': { color: 'text-blue-600', bg: 'bg-blue-100', icon: ClipboardList },
    'Progress': { color: 'text-emerald-600', bg: 'bg-emerald-100', icon: TrendingUp },
    'Assessment': { color: 'text-violet-600', bg: 'bg-violet-100', icon: Stethoscope },
    'Plan': { color: 'text-amber-600', bg: 'bg-amber-100', icon: ClipboardList },
    'Procedure': { color: 'text-red-600', bg: 'bg-red-100', icon: Activity },
    'Consultation': { color: 'text-indigo-600', bg: 'bg-indigo-100', icon: MessageSquare },
    'Discharge': { color: 'text-teal-600', bg: 'bg-teal-100', icon: FileText },
    'Follow-up': { color: 'text-orange-600', bg: 'bg-orange-100', icon: Calendar },
    'Nursing': { color: 'text-pink-600', bg: 'bg-pink-100', icon: HeartPulse },
    'Lab': { color: 'text-cyan-600', bg: 'bg-cyan-100', icon: TestTube },
    'Medication': { color: 'text-purple-600', bg: 'bg-purple-100', icon: Pill },
    'Allergy': { color: 'text-red-600', bg: 'bg-red-100', icon: AlertCircle },
    'History': { color: 'text-gray-600', bg: 'bg-gray-100', icon: History },
};

export default function NursePatientDetails() {
    const params = useParams();
    const router = useRouter();

    // Core state
    const [patient, setPatient] = useState<any>(null);
    const [opdHistory, setOpdHistory] = useState<any[]>([]);
    const [documents, setDocuments] = useState<any[]>([]);
    const [labOrders, setLabOrders] = useState<any[]>([]);
    const [vitalsHistory, setVitalsHistory] = useState<any[]>([]);
    const [clinicalNotes, setClinicalNotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showVitalsModal, setShowVitalsModal] = useState(false);

    // UI state
    const [activeTab, setActiveTab] = useState<'overview' | 'vitals' | 'notes' | 'labs' | 'documents' | 'consultations'>('overview');
    const [latestOpdId, setLatestOpdId] = useState<number | null>(null);

    // Modal states
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [viewingLabOrder, setViewingLabOrder] = useState<any>(null);
    const [labOrderDocs, setLabOrderDocs] = useState<any[]>([]);
    const [loadingLabDocs, setLoadingLabDocs] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [selectedVitalForGraph, setSelectedVitalForGraph] = useState<string | null>(null);

    // Notes filter
    const [noteTypeFilter, setNoteTypeFilter] = useState<string>('');
    const [noteSearchQuery, setNoteSearchQuery] = useState('');

    // AI Features state
    const [aiVitalsInsight, setAiVitalsInsight] = useState<string | null>(null);
    const [aiVitalsLoading, setAiVitalsLoading] = useState(false);
    const [aiPatientSummary, setAiPatientSummary] = useState<string | null>(null);
    const [aiPatientSummaryLoading, setAiPatientSummaryLoading] = useState(false);
    const summaryFingerprintRef = useRef<string>('');
    const [summaryRefreshKey, setSummaryRefreshKey] = useState(0);

    // Auto-generate patient summary on load with caching
    useEffect(() => {
        if (!patient || loading) return;

        // Build a fingerprint from data that matters
        const fingerprint = [
            'v2', // bump this to invalidate all old caches
            patient.patient_id,
            patient.mrn_number || patient.mrn || '',
            vitalsHistory.length,
            vitalsHistory[0]?.recorded_at || '',
            labOrders.length,
            labOrders[0]?.created_at || labOrders[0]?.ordered_at || '',
            clinicalNotes.length,
            clinicalNotes[0]?.created_at || '',
            opdHistory.length,
        ].join('|');

        // Skip if fingerprint hasn't changed (data unchanged)
        if (fingerprint === summaryFingerprintRef.current) return;

        // Check sessionStorage cache
        const cacheKey = `patient:${patient.patient_id}:summary`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            try {
                const { fp, summary } = JSON.parse(cached);
                if (fp === fingerprint) {
                    summaryFingerprintRef.current = fingerprint;
                    setAiPatientSummary(summary);
                    return;
                }
            } catch { /* corrupted cache, regenerate */ }
        }

        // Generate fresh summary
        summaryFingerprintRef.current = fingerprint;
        setAiPatientSummaryLoading(true);
        setAiPatientSummary(null);

        const patientInfo: AIPatientInfo = {
            first_name: patient.first_name,
            last_name: patient.last_name,
            age: patient.age,
            gender: patient.gender,
            mrn: patient.mrn_number || patient.mrn,
            medical_history: patient.medical_history,
        };
        const vitalsData = vitalsHistory.slice(0, 3);
        const labData = labOrders.slice(0, 3).map((l: any) => ({
            test_name: l.test_name || l.service_name,
            status: l.status,
            result_summary: l.result_summary || l.results,
        }));
        const notesData = clinicalNotes.slice(0, 2).map((n: any) => `[${n.note_type}] ${(n.content || '').substring(0, 100)}`).join('\n');

        summarizePatient(patientInfo, vitalsData, labData, notesData, patient.medical_history)
            .then(result => {
                if (result.success && result.message) {
                    setAiPatientSummary(result.message);
                    // Cache it
                    try {
                        sessionStorage.setItem(cacheKey, JSON.stringify({ fp: fingerprint, summary: result.message }));
                    } catch { /* storage full, skip */ }
                }
            })
            .catch(() => { })
            .finally(() => setAiPatientSummaryLoading(false));
    }, [patient, loading, vitalsHistory, labOrders, clinicalNotes, opdHistory, summaryRefreshKey]);

    // AI Context - to provide patient info to the chat assistant
    let aiContext: { setPageContext?: (page: string, patient?: string) => void } = {};
    try {
        aiContext = useAI();
    } catch {
        // AIContextProvider not available, skip
    }

    // OPD Session and Date Range filters
    const [selectedOpdId, setSelectedOpdId] = useState<string>('');
    const [filterStartDate, setFilterStartDate] = useState<string>('');
    const [filterEndDate, setFilterEndDate] = useState<string>('');

    // Consultation history
    const [consultationHistory, setConsultationHistory] = useState<any[]>([]);

    // Fetch all patient data
    const fetchPatientDetails = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const [patientRes, opdRes, docsRes, labsRes, vitalsRes, notesRes, consultRes] = await Promise.all([
                axios.get(`${API_URL}/patients/${params.id}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/opd/patient/${params.id}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/patient-documents/patient/${params.id}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: { documents: [] } } })),
                axios.get(`${API_URL}/lab-orders/patient/${params.id}?includeCompleted=true`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: { orders: [] } } })),
                axios.get(`${API_URL}/vitals/patient/${params.id}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: { vitals: [] } } })),
                axios.get(`${API_URL}/clinical-notes/patient/${params.id}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: { notes: [] } } })),
                axios.get(`${API_URL}/consultations/patient/${params.id}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: { consultations: [] } } }))
            ]);

            setPatient(patientRes.data.data.patient);
            const opdHistoryData = opdRes.data.data.opdHistory || [];
            setOpdHistory(opdHistoryData);
            setDocuments(docsRes.data.data.documents || []);
            setLabOrders(labsRes.data.data.orders || []);
            setVitalsHistory(vitalsRes.data.data.vitals || []);
            setClinicalNotes(notesRes.data.data.notes || []);
            setConsultationHistory(consultRes.data.data.consultations || consultRes.data.data || []);

            if (opdHistoryData.length > 0) {
                setLatestOpdId(opdHistoryData[0].opd_id);
            }
        } catch (error) {
            console.error('Error fetching patient details:', error);
        } finally {
            setLoading(false);
        }
    }, [params.id]);

    useEffect(() => {
        if (params.id) {
            fetchPatientDetails();
        }
    }, [params.id, fetchPatientDetails]);

    // Update AI context with patient info when patient data is loaded
    useEffect(() => {
        if (patient && aiContext.setPageContext) {
            const latestVitals = vitalsHistory[0];
            const age = patient.date_of_birth
                ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                : 'Unknown';
            const patientSummary = `Patient: ${patient.first_name} ${patient.last_name}, ${patient.gender}, Age: ${age}. ` +
                `MRN: ${patient.mrn}. ` +
                `Blood Type: ${patient.blood_group || 'Unknown'}. ` +
                `Allergies: ${patient.allergies || 'None known'}. ` +
                `Medical History: ${patient.medical_history || 'None recorded'}. ` +
                (latestVitals ? `Latest Vitals (${new Date(latestVitals.recorded_at).toLocaleDateString()}): ` +
                    `HR: ${latestVitals.heart_rate || 'N/A'} bpm, ` +
                    `BP: ${latestVitals.blood_pressure_systolic || 'N/A'}/${latestVitals.blood_pressure_diastolic || 'N/A'} mmHg, ` +
                    `Temp: ${latestVitals.temperature || 'N/A'}°C, ` +
                    `SpO2: ${latestVitals.oxygen_saturation || 'N/A'}%, ` +
                    `RR: ${latestVitals.respiratory_rate || 'N/A'}/min.` : 'No recent vitals.');

            aiContext.setPageContext(`/nurse/patients/${params.id}`, patientSummary);
        }
    }, [patient, vitalsHistory, aiContext.setPageContext, params.id]);

    // Fetch filtered vitals and notes when filters change
    const fetchFilteredData = useCallback(async () => {
        const token = localStorage.getItem('token');
        const filterParams = new URLSearchParams();
        if (selectedOpdId) filterParams.append('opdId', selectedOpdId);
        if (filterStartDate) filterParams.append('startDate', filterStartDate);
        if (filterEndDate) filterParams.append('endDate', filterEndDate);

        // For lab orders and documents, only opdId filter applies
        const opdFilterParams = new URLSearchParams();
        if (selectedOpdId) opdFilterParams.append('opdId', selectedOpdId);
        opdFilterParams.append('includeCompleted', 'true');

        try {
            const [vitalsRes, notesRes, labsRes, docsRes] = await Promise.all([
                axios.get(`${API_URL}/vitals/patient/${params.id}?${filterParams.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => ({ data: { data: { vitals: [] } } })),
                axios.get(`${API_URL}/clinical-notes/patient/${params.id}?${filterParams.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => ({ data: { data: { notes: [] } } })),
                axios.get(`${API_URL}/lab-orders/patient/${params.id}?${opdFilterParams.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => ({ data: { data: { orders: [] } } })),
                axios.get(`${API_URL}/patient-documents/patient/${params.id}?${opdFilterParams.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => ({ data: { data: { documents: [] } } }))
            ]);

            setVitalsHistory(vitalsRes.data.data.vitals || []);
            setClinicalNotes(notesRes.data.data.notes || []);
            setLabOrders(labsRes.data.data.orders || []);
            setDocuments(docsRes.data.data.documents || []);
        } catch (error) {
            console.error('Error fetching filtered data:', error);
        }
    }, [params.id, selectedOpdId, filterStartDate, filterEndDate]);

    // Re-fetch when filters change
    useEffect(() => {
        if (params.id && (selectedOpdId || filterStartDate || filterEndDate)) {
            fetchFilteredData();
        }
    }, [params.id, selectedOpdId, filterStartDate, filterEndDate, fetchFilteredData]);

    // Clear filters and refetch all data
    const clearFilters = () => {
        setSelectedOpdId('');
        setFilterStartDate('');
        setFilterEndDate('');
        fetchPatientDetails();
    };

    // Document handlers
    const handleDownload = async (docId: number, fileName: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/patient-documents/${docId}/download`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading document:', error);
            alert('Failed to download document');
        }
    };

    // Download consultation as text file
    // Print consultation as formatted PDF (opens print dialog)
    const handlePrintConsultation = (consult: any) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to print the consultation');
            return;
        }

        // Parse medications
        let medications: any[] = [];
        if (consult.prescription_medications) {
            if (typeof consult.prescription_medications === 'string') {
                try { medications = JSON.parse(consult.prescription_medications); } catch (e) { }
            } else if (Array.isArray(consult.prescription_medications)) {
                medications = consult.prescription_medications;
            }
        }

        // Parse labs
        let labs: any[] = [];
        if (consult.labs && Array.isArray(consult.labs)) {
            labs = consult.labs;
        } else if (consult.labs_ordered) {
            if (typeof consult.labs_ordered === 'string') {
                labs = [{ test_name: consult.labs_ordered }];
            } else if (Array.isArray(consult.labs_ordered)) {
                labs = consult.labs_ordered;
            }
        }

        // Parse vitals
        let vitals: any = {};
        if (consult.vital_signs) {
            vitals = typeof consult.vital_signs === 'string'
                ? JSON.parse(consult.vital_signs)
                : consult.vital_signs;
        }

        const visitDate = new Date(consult.visit_date || consult.consultation_date || consult.created_at);

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Consultation - ${patient?.first_name} ${patient?.last_name}</title>
                <style>
                    body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                    .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
                    .header h1 { margin: 0; color: #2563eb; font-size: 1.5em; }
                    .header p { margin: 5px 0 0; color: #666; font-size: 0.9em; }
                    
                    .doc-info { margin-bottom: 30px; display: flex; justify-content: space-between; }
                    .doc-info div { flex: 1; }
                    .doc-name { font-weight: bold; font-size: 1.1em; }
                    
                    .patient-info { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px; display: flex; flex-wrap: wrap; gap: 20px; }
                    .info-group { flex: 1; min-width: 150px; }
                    .label { font-size: 0.8em; color: #666; text-transform: uppercase; font-weight: bold; }
                    .value { font-weight: 500; }
                    
                    .section { margin-bottom: 25px; }
                    .section-title { font-weight: bold; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 15px; font-size: 1.1em; }
                    
                    table { border-collapse: collapse; width: 100%; margin-top: 10px; }
                    th { text-align: left; padding: 10px; background: #f3f4f6; font-size: 0.9em; color: #374151; }
                    td { padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 0.95em; }
                    
                    .footer { margin-top: 50px; text-align: right; padding-top: 20px; border-top: 1px dashed #ccc; }
                    .signature { display: inline-block; text-align: center; }
                    .sig-line { width: 200px; border-top: 1px solid #000; margin-bottom: 5px; }
                    
                    .vitals-grid { display: flex; gap: 20px; flex-wrap: wrap; }
                    .vital-item { background: #f0f9ff; padding: 10px 15px; border-radius: 6px; }
                    
                    @media print {
                        body { padding: 20px; }
                        button { display: none !important; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${consult.hospital_name || 'Hospital Management System'}</h1>
                    <p>${consult.headquarters_address || ''}</p>
                    ${consult.hospital_contact || consult.hospital_email ? `<p>Phone: ${consult.hospital_contact || 'N/A'} | Email: ${consult.hospital_email || 'N/A'}</p>` : ''}
                </div>
                
                <div class="doc-info">
                    <div>
                        <div class="doc-name">Dr. ${consult.doctor_first_name || ''} ${consult.doctor_last_name || ''}</div>
                        <div>${consult.specialization || ''}</div>
                        ${consult.doctor_registration_number ? `<div>Reg. No: ${consult.doctor_registration_number}</div>` : ''}
                    </div>
                    <div style="text-align: right;">
                        <div class="label">Date</div>
                        <div class="value">${visitDate.toLocaleDateString()}</div>
                        <div class="label" style="margin-top: 5px;">Time</div>
                        <div class="value">${visitDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                </div>
                
                <div class="patient-info">
                    <div class="info-group">
                        <div class="label">Patient Name</div>
                        <div class="value">${patient?.first_name || ''} ${patient?.last_name || ''}</div>
                    </div>
                    <div class="info-group">
                        <div class="label">Age / Gender</div>
                        <div class="value">${patient?.age || 'N/A'} Yrs / ${patient?.gender || 'N/A'}</div>
                    </div>
                    <div class="info-group">
                        <div class="label">MRN</div>
                        <div class="value">${patient?.mrn_number || 'N/A'}</div>
                    </div>
                    <div class="info-group">
                        <div class="label">Contact</div>
                        <div class="value">${patient?.contact_number || 'N/A'}</div>
                    </div>
                </div>
                
                ${Object.keys(vitals).length > 0 ? `
                <div class="section">
                    <div class="section-title">Vitals</div>
                    <div class="vitals-grid">
                        ${Object.entries(vitals).map(([key, value]) => `
                            <div class="vital-item">
                                <span class="label" style="display:block;">${key.replace(/_/g, ' ')}</span>
                                <span class="value">${value}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>` : ''}

                ${consult.chief_complaint || consult.reason_for_visit ? `
                <div class="section">
                    <div class="section-title">Chief Complaint</div>
                    <p>${consult.chief_complaint || consult.reason_for_visit}</p>
                </div>` : ''}

                ${consult.notes || consult.consultation_notes ? `
                <div class="section">
                    <div class="section-title">Clinical Notes</div>
                    <p>${consult.notes || consult.consultation_notes}</p>
                </div>` : ''}
                
                ${consult.diagnosis ? `
                <div class="section">
                    <div class="section-title">Diagnosis</div>
                    <p><strong>${consult.diagnosis}</strong></p>
                </div>` : ''}

                ${labs.length > 0 ? `
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
                            ${labs.map((lab: any) => `
                                <tr>
                                    <td>${typeof lab === 'string' ? lab : lab.test_name || lab.name || ''}</td>
                                    <td>${typeof lab === 'string' ? '-' : lab.lab_name || '-'}</td>
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
                                    <td><strong>${med.name || med.medication_name || med}</strong></td>
                                    <td>${med.dosage || '-'}</td>
                                    <td>${med.frequency || [med.morning && 'Mor', med.noon && 'Noon', med.night && 'Night'].filter(Boolean).join('-') || '-'}</td>
                                    <td>${med.food_timing || med.instructions || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>` : ''}
                
                ${consult.follow_up_date || consult.next_visit_date ? `
                <div class="section">
                    <div class="section-title">Follow-up</div>
                    <p>
                        ${consult.next_visit_status ? `<strong>Status:</strong> ${consult.next_visit_status} | ` : ''}
                        <strong>Date:</strong> ${new Date(consult.follow_up_date || consult.next_visit_date).toLocaleDateString()}
                    </p>
                </div>` : ''}
                
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

    const handleUploadDocument = async (file: File, docType: string, description: string) => {
        setUploadingDoc(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('file', file);
            formData.append('patient_id', params.id as string);
            formData.append('document_type', docType);
            formData.append('description', description);

            await axios.post(`${API_URL}/patient-documents`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setShowUploadModal(false);
            fetchPatientDetails();
        } catch (error) {
            console.error('Error uploading document:', error);
            alert('Failed to upload document');
        } finally {
            setUploadingDoc(false);
        }
    };

    // Lab order document handler
    const handleViewLabResults = async (order: any) => {
        setViewingLabOrder(order);
        setLoadingLabDocs(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/patient-documents/lab-order/${order.order_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLabOrderDocs(response.data.data.documents || []);
        } catch (error) {
            console.error('Error fetching lab order documents:', error);
            setLabOrderDocs([]);
        } finally {
            setLoadingLabDocs(false);
        }
    };

    // Notes handlers
    const handleTogglePin = async (noteId: number) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_URL}/clinical-notes/${noteId}/pin`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPatientDetails();
        } catch (error) {
            console.error('Error toggling pin:', error);
        }
    };

    const handleDeleteNote = async (noteId: number) => {
        if (!confirm('Are you sure you want to delete this note?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/clinical-notes/${noteId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPatientDetails();
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    };

    // Calculate vitals trends
    const getVitalsTrend = (current: number, previous: number | undefined) => {
        if (!previous) return null;
        if (current > previous) return 'up';
        if (current < previous) return 'down';
        return 'stable';
    };

    // Get latest vitals
    const latestVitals = vitalsHistory[0];
    const previousVitals = vitalsHistory[1];

    // AI Analysis functions
    const handleAnalyzeVitals = async () => {
        if (vitalsHistory.length === 0) return;

        setAiVitalsLoading(true);
        setAiVitalsInsight(null);

        try {
            const vitalsData: VitalsData[] = vitalsHistory.slice(0, 10).map(v => ({
                recorded_at: v.recorded_at,
                heart_rate: v.pulse_rate,
                blood_pressure_systolic: v.blood_pressure_systolic,
                blood_pressure_diastolic: v.blood_pressure_diastolic,
                temperature: v.temperature,
                oxygen_saturation: v.spo2,
                respiratory_rate: v.respiratory_rate,
                weight: v.weight,
                height: v.height,
                blood_glucose: v.blood_glucose,
                pain_level: v.pain_level,
            }));

            const patientInfo: AIPatientInfo = {
                first_name: patient?.first_name,
                last_name: patient?.last_name,
                age: patient?.age,
                gender: patient?.gender,
                mrn: patient?.mrn,
            };

            const result = await analyzeVitals(vitalsData, patientInfo);

            if (result.success) {
                setAiVitalsInsight(result.message);
            } else {
                setAiVitalsInsight(result.message);
            }
        } catch (error) {
            setAiVitalsInsight('Failed to analyze vitals. Please try again.');
        } finally {
            setAiVitalsLoading(false);
        }
    };

    const handleGeneratePatientSummary = () => {
        if (!patient) return;
        // Clear cache and force the auto-summary useEffect to regenerate
        sessionStorage.removeItem(`patient:${patient.patient_id}:summary`);
        summaryFingerprintRef.current = '';
        setAiPatientSummary(null);
        setSummaryRefreshKey(k => k + 1);
    };

    // Filter notes
    const filteredNotes = clinicalNotes.filter(note => {
        if (noteTypeFilter && note.note_type !== noteTypeFilter) return false;
        if (noteSearchQuery) {
            const query = noteSearchQuery.toLowerCase();
            return note.content?.toLowerCase().includes(query) ||
                note.title?.toLowerCase().includes(query);
        }
        return true;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-800">Patient Not Found</h2>
                <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Patient Profile</h1>
                    <p className="text-slate-500 text-sm">Complete medical history and records</p>
                </div>
            </div>

            {/* Patient Info Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/30">
                            {patient.first_name?.[0]}{patient.last_name?.[0]}
                        </div>

                        {/* Basic Info */}
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h2 className="text-2xl font-bold text-slate-800">
                                    {patient.first_name} {patient.last_name}
                                </h2>
                                <span className="px-3 py-1 bg-white/80 text-blue-700 rounded-lg text-sm font-bold border border-blue-200">
                                    {patient.mrn_number}
                                </span>
                                {patient.blood_group && (
                                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-bold">
                                        {patient.blood_group}
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                <span className="flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    {patient.gender}, {patient.age} years
                                </span>
                                {patient.contact_number && (
                                    <span className="flex items-center gap-1">
                                        <Phone className="w-4 h-4" />
                                        {patient.contact_number}
                                    </span>
                                )}
                                {patient.city && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {patient.city}
                                    </span>
                                )}
                            </div>

                            {/* Allergies Warning */}
                            {patient.allergies && (
                                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg inline-flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                    <span className="text-sm font-medium text-red-700">Allergies: {patient.allergies}</span>
                                </div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="flex flex-col sm:flex-row gap-2">
                            <button
                                onClick={() => setShowVitalsModal(true)}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 whitespace-nowrap"
                            >
                                <HeartPulse className="w-4 h-4" />
                                Record Vitals
                            </button>
                            <button
                                onClick={() => setShowNotesModal(true)}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50 transition-all whitespace-nowrap"
                            >
                                <FileText className="w-4 h-4" />
                                Add Note
                            </button>
                            <button
                                onClick={handleGeneratePatientSummary}
                                disabled={aiPatientSummaryLoading}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium text-sm hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/20 whitespace-nowrap disabled:opacity-50"
                                title="Generate AI patient summary for handoff"
                            >
                                <Sparkles className="w-4 h-4" />
                                {aiPatientSummaryLoading ? 'Generating...' : aiPatientSummary ? 'Refresh Summary' : 'AI Summary'}
                            </button>
                        </div>
                    </div>
                </div >

                {/* Quick Stats */}
                < div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-y md:divide-y-0 divide-slate-100" >
                    <div className="p-4 text-center">
                        <p className="text-2xl font-bold text-slate-800">{opdHistory.length}</p>
                        <p className="text-xs text-slate-500 font-medium">Visits</p>
                    </div>
                    <div className="p-4 text-center">
                        <p className="text-2xl font-bold text-slate-800">{vitalsHistory.length}</p>
                        <p className="text-xs text-slate-500 font-medium">Vitals Records</p>
                    </div>
                    <div className="p-4 text-center">
                        <p className="text-2xl font-bold text-slate-800">{clinicalNotes.length}</p>
                        <p className="text-xs text-slate-500 font-medium">Clinical Notes</p>
                    </div>
                    <div className="p-4 text-center">
                        <p className="text-2xl font-bold text-slate-800">{labOrders.length}</p>
                        <p className="text-xs text-slate-500 font-medium">Lab Orders</p>
                    </div>
                    <div className="p-4 text-center">
                        <p className="text-2xl font-bold text-slate-800">{documents.length}</p>
                        <p className="text-xs text-slate-500 font-medium">Documents</p>
                    </div>
                </div >
            </div >

            {/* AI Patient Summary */}
            {aiPatientSummaryLoading && (
                <AILoadingIndicator text="Generating patient summary..." />
            )}
            {aiPatientSummary && !aiPatientSummaryLoading && (
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-purple-50/30 border border-blue-200/60 rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-blue-100/60">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-white shadow-sm">
                                <Sparkles className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-slate-800">AI Patient Summary</h4>
                                <p className="text-[11px] text-slate-500">{patient?.first_name} {patient?.last_name} · {patient?.mrn_number || patient?.mrn || 'N/A'}</p>
                            </div>
                        </div>
                        <button onClick={() => setAiPatientSummary(null)} className="p-1 rounded-md hover:bg-white/60 transition-colors">
                            <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                        </button>
                    </div>
                    <div className="px-5 py-3 space-y-1.5">
                        {aiPatientSummary.split('\n').filter(l => l.trim()).map((line, i) => {
                            const trimmed = line.trim();
                            // Detect line types by leading emoji/symbol
                            const isWarning = /^[⚠️🔸]/.test(trimmed) || trimmed.toLowerCase().startsWith('concern');
                            const isAction = /^[→➡]/.test(trimmed) || trimmed.toLowerCase().startsWith('pending') || trimmed.toLowerCase().startsWith('plan');
                            const isGood = /^[✓✅]/.test(trimmed);
                            const isHeader = /^[📋🏥]/.test(trimmed);

                            if (isHeader) {
                                return <p key={i} className="text-[13px] font-semibold text-slate-800">{trimmed}</p>;
                            }
                            if (isWarning) {
                                return <p key={i} className="text-[13px] text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5 border border-amber-100">{trimmed}</p>;
                            }
                            if (isAction) {
                                return <p key={i} className="text-[13px] text-blue-700 bg-blue-50/60 rounded-lg px-3 py-1.5 border border-blue-100">{trimmed}</p>;
                            }
                            if (isGood) {
                                return <p key={i} className="text-[13px] text-emerald-700">{trimmed}</p>;
                            }
                            return <p key={i} className="text-[13px] text-slate-700 leading-relaxed">{trimmed}</p>;
                        })}
                    </div>
                </div>
            )}

            {/* Latest Vitals Summary */}
            {
                latestVitals && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <HeartPulse className="w-5 h-5 text-red-500" />
                                Latest Vitals
                            </h3>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleAnalyzeVitals}
                                    disabled={aiVitalsLoading}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                                    title="Get AI analysis of vitals trends"
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    {aiVitalsLoading ? 'Analyzing...' : 'AI Analysis'}
                                </button>
                                <span className="text-sm text-slate-500">
                                    {new Date(latestVitals.recorded_at).toLocaleDateString('en-US', {
                                        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-2">
                            {(latestVitals.blood_pressure_systolic || latestVitals.blood_pressure_diastolic) && (
                                <VitalCard
                                    label={latestVitals.blood_pressure_systolic && latestVitals.blood_pressure_diastolic ? "Blood Pressure" : latestVitals.blood_pressure_systolic ? "Systolic BP" : "Diastolic BP"}
                                    value={latestVitals.blood_pressure_systolic && latestVitals.blood_pressure_diastolic
                                        ? `${latestVitals.blood_pressure_systolic}/${latestVitals.blood_pressure_diastolic}`
                                        : latestVitals.blood_pressure_systolic || latestVitals.blood_pressure_diastolic}
                                    unit="mmHg"
                                    trend={getVitalsTrend(latestVitals.blood_pressure_systolic || latestVitals.blood_pressure_diastolic, previousVitals?.blood_pressure_systolic || previousVitals?.blood_pressure_diastolic)}
                                    icon={<Activity className="w-4 h-4" />}
                                    color="blue"
                                    normalRange="90/60-120/80"
                                    onClick={() => setSelectedVitalForGraph('blood_pressure_systolic')}
                                />
                            )}
                            {latestVitals.pulse_rate && (
                                <VitalCard
                                    label="Pulse Rate"
                                    value={latestVitals.pulse_rate}
                                    unit="bpm"
                                    trend={getVitalsTrend(latestVitals.pulse_rate, previousVitals?.pulse_rate)}
                                    icon={<HeartPulse className="w-4 h-4" />}
                                    color="red"
                                    normalRange="60-100"
                                    onClick={() => setSelectedVitalForGraph('pulse_rate')}
                                />
                            )}
                            {latestVitals.temperature && (
                                <VitalCard
                                    label="Temperature"
                                    value={latestVitals.temperature}
                                    unit="°F"
                                    trend={getVitalsTrend(latestVitals.temperature, previousVitals?.temperature)}
                                    icon={<Thermometer className="w-4 h-4" />}
                                    color="amber"
                                    normalRange="97.8-99.1"
                                    onClick={() => setSelectedVitalForGraph('temperature')}
                                />
                            )}
                            {latestVitals.spo2 && (
                                <VitalCard
                                    label="SpO2"
                                    value={latestVitals.spo2}
                                    unit="%"
                                    trend={getVitalsTrend(latestVitals.spo2, previousVitals?.spo2)}
                                    icon={<Droplets className="w-4 h-4" />}
                                    color="cyan"
                                    normalRange="95-100"
                                    onClick={() => setSelectedVitalForGraph('spo2')}
                                />
                            )}
                            {latestVitals.respiratory_rate && (
                                <VitalCard
                                    label="Resp. Rate"
                                    value={latestVitals.respiratory_rate}
                                    unit="/min"
                                    trend={getVitalsTrend(latestVitals.respiratory_rate, previousVitals?.respiratory_rate)}
                                    icon={<Wind className="w-4 h-4" />}
                                    color="teal"
                                    normalRange="12-20"
                                    onClick={() => setSelectedVitalForGraph('respiratory_rate')}
                                />
                            )}
                            {latestVitals.weight && (
                                <VitalCard
                                    label="Weight"
                                    value={latestVitals.weight}
                                    unit="kg"
                                    trend={getVitalsTrend(latestVitals.weight, previousVitals?.weight)}
                                    icon={<User className="w-4 h-4" />}
                                    color="violet"
                                    onClick={() => setSelectedVitalForGraph('weight')}
                                />
                            )}
                            {latestVitals.height && (
                                <VitalCard
                                    label="Height"
                                    value={latestVitals.height}
                                    unit="cm"
                                    trend={getVitalsTrend(latestVitals.height, previousVitals?.height)}
                                    icon={<Ruler className="w-4 h-4" />}
                                    color="indigo"
                                    onClick={() => setSelectedVitalForGraph('height')}
                                />
                            )}
                            {latestVitals.blood_glucose && (
                                <VitalCard
                                    label="Glucose"
                                    value={latestVitals.blood_glucose}
                                    unit="mg/dL"
                                    trend={getVitalsTrend(latestVitals.blood_glucose, previousVitals?.blood_glucose)}
                                    icon={<Droplets className="w-4 h-4" />}
                                    color="rose"
                                    normalRange="70-140"
                                    onClick={() => setSelectedVitalForGraph('blood_glucose')}
                                />
                            )}
                            {latestVitals.pain_level !== null && latestVitals.pain_level !== undefined && (
                                <VitalCard
                                    label="Pain"
                                    value={latestVitals.pain_level}
                                    unit="/10"
                                    trend={getVitalsTrend(latestVitals.pain_level, previousVitals?.pain_level)}
                                    icon={<AlertTriangle className="w-4 h-4" />}
                                    color="orange"
                                    normalRange="0"
                                    onClick={() => setSelectedVitalForGraph('pain_level')}
                                />
                            )}
                        </div>

                        {/* AI Vitals Insight */}
                        {aiVitalsLoading && (
                            <div className="mt-4">
                                <AILoadingIndicator text="Analyzing vitals trends..." />
                            </div>
                        )}
                        {aiVitalsInsight && !aiVitalsLoading && (
                            <div className="mt-4">
                                <AIInsightCard
                                    title="Vitals Analysis"
                                    content={aiVitalsInsight}
                                    type="info"
                                    onDismiss={() => setAiVitalsInsight(null)}
                                />
                            </div>
                        )}
                    </div>
                )
            }

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-100 overflow-x-auto">
                    {[
                        { id: 'overview', label: 'Overview', icon: History },
                        { id: 'consultations', label: 'Consultations', icon: Stethoscope, count: consultationHistory.length },
                        { id: 'vitals', label: 'Vitals History', icon: HeartPulse, count: vitalsHistory.length },
                        { id: 'notes', label: 'Clinical Notes', icon: FileText, count: clinicalNotes.length },
                        { id: 'labs', label: 'Lab Orders', icon: Beaker, count: labOrders.length },
                        { id: 'documents', label: 'Documents', icon: File, count: documents.length },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                                : 'text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Pinned Notes */}
                            {clinicalNotes.filter(n => n.is_pinned).length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Pin className="w-4 h-4" /> Pinned Notes
                                    </h3>
                                    <div className="space-y-2">
                                        {clinicalNotes.filter(n => n.is_pinned).map(note => (
                                            <NoteCard key={note.note_id} note={note} compact onTogglePin={handleTogglePin} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recent Activity Timeline */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                                    Recent Activity
                                </h3>
                                <div className="space-y-4">
                                    {opdHistory.slice(0, 5).map((opd, i) => (
                                        <div key={opd.opd_id} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <Stethoscope className="w-5 h-5 text-blue-600" />
                                                </div>
                                                {i < opdHistory.slice(0, 5).length - 1 && (
                                                    <div className="w-0.5 h-full bg-slate-200 mt-2" />
                                                )}
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-slate-800">{opd.visit_type || 'OPD Visit'}</span>
                                                    <span className="text-xs text-slate-400">
                                                        {new Date(opd.visit_date).toLocaleDateString('en-US', {
                                                            month: 'short', day: 'numeric', year: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600">{opd.reason_for_visit || opd.chief_complaint || 'General consultation'}</p>
                                                {opd.doctor_name && (
                                                    <p className="text-xs text-slate-500 mt-1">Dr. {opd.doctor_name}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Vitals History Tab */}
                    {activeTab === 'vitals' && (
                        <div className="space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h3 className="text-lg font-bold text-slate-800">Vitals History</h3>
                                <button
                                    onClick={() => setShowVitalsModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all"
                                >
                                    <Plus className="w-4 h-4" />
                                    Record New
                                </button>
                            </div>

                            {/* Filter Bar */}
                            <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <Filter className="w-4 h-4 text-slate-400" />
                                <select
                                    value={selectedOpdId}
                                    onChange={(e) => setSelectedOpdId(e.target.value)}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                                >
                                    <option value="">All OPD Sessions</option>
                                    {opdHistory.map((opd: any) => (
                                        <option key={opd.opd_id} value={opd.opd_id}>
                                            {opd.opd_number} - {new Date(opd.visit_date).toLocaleDateString()}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="date"
                                    value={filterStartDate}
                                    onChange={(e) => setFilterStartDate(e.target.value)}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                                    placeholder="From"
                                />
                                <input
                                    type="date"
                                    value={filterEndDate}
                                    onChange={(e) => setFilterEndDate(e.target.value)}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                                    placeholder="To"
                                />
                                {(selectedOpdId || filterStartDate || filterEndDate) && (
                                    <button
                                        onClick={clearFilters}
                                        className="px-3 py-1.5 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>

                            {vitalsHistory.length > 0 ? (
                                <div className="space-y-3">
                                    {vitalsHistory.map((vital: any) => (
                                        <div key={vital.vital_id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <HeartPulse className="w-5 h-5 text-red-500" />
                                                    <span className="text-sm font-medium text-slate-600">
                                                        {new Date(vital.recorded_at).toLocaleDateString('en-US', {
                                                            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                                                        })}
                                                        {' at '}
                                                        {new Date(vital.recorded_at).toLocaleTimeString('en-US', {
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </span>
                                                    {vital.opd_number && (
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                                            {vital.opd_number}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-slate-400">by {vital.recorded_by_full_name || vital.recorded_by_name || 'Staff'}</span>
                                            </div>

                                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-2">
                                                {(vital.blood_pressure_systolic || vital.blood_pressure_diastolic) && (
                                                    <div className="bg-white rounded-md p-2 border border-slate-100">
                                                        <p className="text-xs font-medium text-slate-600 mb-0.5">
                                                            {vital.blood_pressure_systolic && vital.blood_pressure_diastolic ? 'BP' : vital.blood_pressure_systolic ? 'Sys. BP' : 'Dia. BP'}
                                                        </p>
                                                        <p className="text-sm font-bold text-slate-800">
                                                            {vital.blood_pressure_systolic && vital.blood_pressure_diastolic
                                                                ? `${vital.blood_pressure_systolic}/${vital.blood_pressure_diastolic}`
                                                                : vital.blood_pressure_systolic || vital.blood_pressure_diastolic}
                                                            <span className="text-xs font-normal text-slate-500 ml-0.5">mmHg</span>
                                                        </p>
                                                    </div>
                                                )}
                                                {vital.pulse_rate && (
                                                    <div className="bg-white rounded-md p-2 border border-slate-100">
                                                        <p className="text-xs font-medium text-slate-600 mb-0.5">Pulse</p>
                                                        <p className="text-sm font-bold text-slate-800">
                                                            {vital.pulse_rate}
                                                            <span className="text-xs font-normal text-slate-500 ml-0.5">bpm</span>
                                                        </p>
                                                    </div>
                                                )}
                                                {vital.temperature && (
                                                    <div className="bg-white rounded-md p-2 border border-slate-100">
                                                        <p className="text-xs font-medium text-slate-600 mb-0.5">Temp</p>
                                                        <p className="text-sm font-bold text-slate-800">
                                                            {vital.temperature}
                                                            <span className="text-xs font-normal text-slate-500 ml-0.5">°F</span>
                                                        </p>
                                                    </div>
                                                )}
                                                {vital.spo2 && (
                                                    <div className="bg-white rounded-md p-2 border border-slate-100">
                                                        <p className="text-xs font-medium text-slate-600 mb-0.5">SpO2</p>
                                                        <p className="text-sm font-bold text-slate-800">
                                                            {vital.spo2}
                                                            <span className="text-xs font-normal text-slate-500 ml-0.5">%</span>
                                                        </p>
                                                    </div>
                                                )}
                                                {vital.respiratory_rate && (
                                                    <div className="bg-white rounded-md p-2 border border-slate-100">
                                                        <p className="text-xs font-medium text-slate-600 mb-0.5">Resp.</p>
                                                        <p className="text-sm font-bold text-slate-800">
                                                            {vital.respiratory_rate}
                                                            <span className="text-xs font-normal text-slate-500 ml-0.5">/min</span>
                                                        </p>
                                                    </div>
                                                )}
                                                {vital.weight && (
                                                    <div className="bg-white rounded-md p-2 border border-slate-100">
                                                        <p className="text-xs font-medium text-slate-600 mb-0.5">Weight</p>
                                                        <p className="text-sm font-bold text-slate-800">
                                                            {vital.weight}
                                                            <span className="text-xs font-normal text-slate-500 ml-0.5">kg</span>
                                                        </p>
                                                    </div>
                                                )}
                                                {vital.height && (
                                                    <div className="bg-white rounded-md p-2 border border-slate-100">
                                                        <p className="text-xs font-medium text-slate-600 mb-0.5">Height</p>
                                                        <p className="text-sm font-bold text-slate-800">
                                                            {vital.height}
                                                            <span className="text-xs font-normal text-slate-500 ml-0.5">cm</span>
                                                        </p>
                                                    </div>
                                                )}
                                                {vital.blood_glucose && (
                                                    <div className="bg-white rounded-md p-2 border border-slate-100">
                                                        <p className="text-xs font-medium text-slate-600 mb-0.5">Glucose</p>
                                                        <p className="text-sm font-bold text-slate-800">
                                                            {vital.blood_glucose}
                                                            <span className="text-xs font-normal text-slate-500 ml-0.5">mg/dL</span>
                                                        </p>
                                                    </div>
                                                )}
                                                {vital.pain_level !== null && vital.pain_level !== undefined && (
                                                    <div className="bg-white rounded-md p-2 border border-slate-100">
                                                        <p className="text-xs font-medium text-slate-600 mb-0.5">Pain</p>
                                                        <p className="text-sm font-bold text-slate-800">
                                                            {vital.pain_level}
                                                            <span className="text-xs font-normal text-slate-500 ml-0.5">/10</span>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {vital.notes && (
                                                <div className="mt-3 p-2 bg-amber-50 rounded-lg border border-amber-100">
                                                    <p className="text-xs text-amber-700">
                                                        <span className="font-semibold">Notes:</span> {vital.notes}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <HeartPulse className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-400 font-medium">
                                        {(selectedOpdId || filterStartDate || filterEndDate) ? 'No vitals match the filters' : 'No vitals recorded yet'}
                                    </p>
                                    {!(selectedOpdId || filterStartDate || filterEndDate) && (
                                        <button
                                            onClick={() => setShowVitalsModal(true)}
                                            className="mt-4 text-blue-600 text-sm font-medium hover:underline"
                                        >
                                            Record the first vitals
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Clinical Notes Tab */}
                    {activeTab === 'notes' && (
                        <div className="space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h3 className="text-lg font-bold text-slate-800">Clinical Notes</h3>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search notes..."
                                            value={noteSearchQuery}
                                            onChange={(e) => setNoteSearchQuery(e.target.value)}
                                            className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-48"
                                        />
                                    </div>
                                    <select
                                        value={noteTypeFilter}
                                        onChange={(e) => setNoteTypeFilter(e.target.value)}
                                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    >
                                        <option value="">All Types</option>
                                        {Object.keys(noteTypeConfig).map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => setShowNotesModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Note
                                    </button>
                                </div>
                            </div>

                            {/* Filter Bar */}
                            <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <Filter className="w-4 h-4 text-slate-400" />
                                <select
                                    value={selectedOpdId}
                                    onChange={(e) => setSelectedOpdId(e.target.value)}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                                >
                                    <option value="">All OPD Sessions</option>
                                    {opdHistory.map((opd: any) => (
                                        <option key={opd.opd_id} value={opd.opd_id}>
                                            {opd.opd_number} - {new Date(opd.visit_date).toLocaleDateString()}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="date"
                                    value={filterStartDate}
                                    onChange={(e) => setFilterStartDate(e.target.value)}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                                    placeholder="From"
                                />
                                <input
                                    type="date"
                                    value={filterEndDate}
                                    onChange={(e) => setFilterEndDate(e.target.value)}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                                    placeholder="To"
                                />
                                {(selectedOpdId || filterStartDate || filterEndDate) && (
                                    <button
                                        onClick={clearFilters}
                                        className="px-3 py-1.5 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>

                            {filteredNotes.length > 0 ? (
                                <div className="space-y-3">
                                    {filteredNotes.map(note => (
                                        <NoteCard
                                            key={note.note_id}
                                            note={note}
                                            onTogglePin={handleTogglePin}
                                            onDelete={handleDeleteNote}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-400 font-medium">
                                        {clinicalNotes.length === 0 ? 'No clinical notes yet' : 'No matching notes found'}
                                    </p>
                                    {!(selectedOpdId || filterStartDate || filterEndDate) && (
                                        <button
                                            onClick={() => setShowNotesModal(true)}
                                            className="mt-4 text-blue-600 text-sm font-medium hover:underline"
                                        >
                                            Add the first note
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Lab Orders Tab */}
                    {activeTab === 'labs' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-800">Lab Orders</h3>

                            {/* Filter Bar */}
                            <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <Filter className="w-4 h-4 text-slate-400" />
                                <select
                                    value={selectedOpdId}
                                    onChange={(e) => setSelectedOpdId(e.target.value)}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                                >
                                    <option value="">All OPD Sessions</option>
                                    {opdHistory.map((opd: any) => (
                                        <option key={opd.opd_id} value={opd.opd_id}>
                                            {opd.opd_number} - {new Date(opd.visit_date).toLocaleDateString()}
                                        </option>
                                    ))}
                                </select>
                                {selectedOpdId && (
                                    <button
                                        onClick={clearFilters}
                                        className="px-3 py-1.5 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        Clear Filter
                                    </button>
                                )}
                            </div>

                            {labOrders.length > 0 ? (
                                <div className="space-y-3">
                                    {labOrders.map(order => (
                                        <div key={order.order_id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <span className="font-bold text-slate-800">{order.test_name}</span>
                                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                                            order.status === 'In-Progress' ? 'bg-amber-100 text-amber-700' :
                                                                'bg-blue-100 text-blue-700'
                                                            }`}>
                                                            {order.status}
                                                        </span>
                                                        {order.priority === 'STAT' && (
                                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold">
                                                                STAT
                                                            </span>
                                                        )}
                                                        {order.opd_number && (
                                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                                                {order.opd_number}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-500">
                                                        {order.order_number} • Ordered {new Date(order.ordered_at).toLocaleDateString()}
                                                    </p>
                                                    {order.doctor_name && (
                                                        <p className="text-xs text-slate-400 mt-1">By Dr. {order.doctor_name}</p>
                                                    )}
                                                </div>
                                                {order.status === 'Completed' && (
                                                    <button
                                                        onClick={() => handleViewLabResults(order)}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-all"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        View Results
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Beaker className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-400 font-medium">
                                        {selectedOpdId ? 'No lab orders for this OPD session' : 'No lab orders for this patient'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Documents Tab */}
                    {activeTab === 'documents' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-800">Documents</h3>
                                <button
                                    onClick={() => setShowUploadModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all"
                                >
                                    <Upload className="w-4 h-4" />
                                    Upload
                                </button>
                            </div>

                            {/* Filter Bar */}
                            <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <Filter className="w-4 h-4 text-slate-400" />
                                <select
                                    value={selectedOpdId}
                                    onChange={(e) => setSelectedOpdId(e.target.value)}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                                >
                                    <option value="">All OPD Sessions</option>
                                    {opdHistory.map((opd: any) => (
                                        <option key={opd.opd_id} value={opd.opd_id}>
                                            {opd.opd_number} - {new Date(opd.visit_date).toLocaleDateString()}
                                        </option>
                                    ))}
                                </select>
                                {selectedOpdId && (
                                    <button
                                        onClick={clearFilters}
                                        className="px-3 py-1.5 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        Clear Filter
                                    </button>
                                )}
                            </div>

                            {documents.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {documents.map(doc => (
                                        <div key={doc.document_id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                                                    {doc.file_mime_type?.includes('image') ? (
                                                        <Image className="w-5 h-5 text-blue-500" />
                                                    ) : (
                                                        <File className="w-5 h-5 text-slate-500" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-slate-800 truncate">{doc.file_name}</p>
                                                    <p className="text-xs text-slate-500">{doc.document_type}</p>
                                                    {doc.opd_number && (
                                                        <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                                            {doc.opd_number}
                                                        </span>
                                                    )}
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        {new Date(doc.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleDownload(doc.document_id, doc.file_name)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <File className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-400 font-medium">
                                        {selectedOpdId ? 'No documents for this OPD session' : 'No documents uploaded'}
                                    </p>
                                    {!selectedOpdId && (
                                        <button
                                            onClick={() => setShowUploadModal(true)}
                                            className="mt-4 text-blue-600 text-sm font-medium hover:underline"
                                        >
                                            Upload the first document
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Consultation History Tab */}
                    {activeTab === 'consultations' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-800">Consultation History</h3>

                            {consultationHistory.length > 0 ? (
                                <div className="space-y-4">
                                    {consultationHistory.map((consult: any, index: number) => (
                                        <div key={consult.consultation_id || consult.opd_id || index} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                            <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-slate-100">
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Stethoscope className="w-5 h-5 text-indigo-600" />
                                                            <span className="font-bold text-slate-800">
                                                                {consult.doctor_name || consult.doctor_first_name
                                                                    ? `Dr. ${consult.doctor_name || `${consult.doctor_first_name} ${consult.doctor_last_name || ''}`}`
                                                                    : 'Consultation'}
                                                            </span>
                                                            {consult.specialization && (
                                                                <span className="text-sm text-slate-500">({consult.specialization})</span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-slate-600">
                                                            {new Date(consult.visit_date || consult.consultation_date || consult.created_at).toLocaleDateString('en-US', {
                                                                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {consult.opd_number && (
                                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">
                                                                {consult.opd_number}
                                                            </span>
                                                        )}
                                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${consult.status === 'Completed' || consult.outcome_status === 'Completed'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : consult.status === 'In-Progress' || consult.outcome_status === 'In-Progress'
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : 'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            {consult.status || consult.outcome_status || 'Recorded'}
                                                        </span>
                                                        <button
                                                            onClick={() => handlePrintConsultation(consult)}
                                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Print Consultation"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-4 space-y-4">
                                                {/* Chief Complaint / Reason */}
                                                {(consult.chief_complaint || consult.reason_for_visit) && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Chief Complaint</h4>
                                                        <p className="text-sm text-slate-700">{consult.chief_complaint || consult.reason_for_visit}</p>
                                                    </div>
                                                )}

                                                {/* Diagnosis */}
                                                {consult.diagnosis && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Diagnosis</h4>
                                                        <p className="text-sm text-slate-700 font-medium">{consult.diagnosis}</p>
                                                    </div>
                                                )}

                                                {/* Notes */}
                                                {(consult.notes || consult.consultation_notes) && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Notes</h4>
                                                        <p className="text-sm text-slate-600">{consult.notes || consult.consultation_notes}</p>
                                                    </div>
                                                )}

                                                {/* Prescription Medications (from prescription table) */}
                                                {consult.prescription_medications && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                            <Pill className="w-3 h-3" /> Prescription
                                                        </h4>
                                                        <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                                                            {(() => {
                                                                const meds = typeof consult.prescription_medications === 'string'
                                                                    ? JSON.parse(consult.prescription_medications)
                                                                    : consult.prescription_medications;
                                                                if (Array.isArray(meds)) {
                                                                    return (
                                                                        <div className="space-y-2">
                                                                            {meds.map((med: any, idx: number) => (
                                                                                <div key={idx} className="text-sm text-purple-800">
                                                                                    <span className="font-medium">{med.name || med.medication_name || med}</span>
                                                                                    {med.dosage && <span className="ml-2">- {med.dosage}</span>}
                                                                                    {med.frequency && <span className="ml-2">({med.frequency})</span>}
                                                                                    {med.duration && <span className="ml-2">for {med.duration}</span>}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    );
                                                                }
                                                                return <p className="text-sm text-purple-800">{JSON.stringify(meds)}</p>;
                                                            })()}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Medications (fallback field) */}
                                                {consult.medications && !consult.prescription_medications && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                            <Pill className="w-3 h-3" /> Medications
                                                        </h4>
                                                        <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                                                            <p className="text-sm text-purple-800">{typeof consult.medications === 'string' ? consult.medications : JSON.stringify(consult.medications)}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Labs Ordered */}
                                                {(consult.labs_ordered || consult.labs) && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                            <Beaker className="w-3 h-3" /> Labs Ordered
                                                        </h4>
                                                        <div className="bg-cyan-50 rounded-lg p-3 border border-cyan-100">
                                                            <p className="text-sm text-cyan-800">{typeof (consult.labs_ordered || consult.labs) === 'string' ? (consult.labs_ordered || consult.labs) : JSON.stringify(consult.labs_ordered || consult.labs)}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Follow-up */}
                                                {consult.follow_up_date && (
                                                    <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                                                        <Calendar className="w-4 h-4 text-amber-600" />
                                                        <span className="text-sm font-medium text-amber-800">
                                                            Follow-up: {new Date(consult.follow_up_date).toLocaleDateString('en-US', {
                                                                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-400 font-medium">No consultation history available</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div >

            {/* Record Vitals Modal */}
            {
                showVitalsModal && patient && (
                    <RecordVitalsModal
                        patientId={patient.patient_id}
                        opdHistory={opdHistory}
                        defaultOpdId={latestOpdId}
                        patientName={`${patient?.first_name} ${patient?.last_name}`}
                        onClose={() => setShowVitalsModal(false)}
                        onSuccess={() => {
                            setShowVitalsModal(false);
                            fetchPatientDetails();
                        }}
                    />
                )
            }

            {/* Add Clinical Note Modal */}
            {
                showNotesModal && patient && (
                    <AddNoteModal
                        patientId={patient.patient_id}
                        opdHistory={opdHistory}
                        defaultOpdId={latestOpdId}
                        patientName={`${patient?.first_name} ${patient?.last_name}`}
                        patientContext={{
                            age: patient.age,
                            gender: patient.gender,
                            bloodGroup: patient.blood_group,
                            latestVitals: vitalsHistory?.[0] ? {
                                bp: vitalsHistory[0].blood_pressure_systolic && vitalsHistory[0].blood_pressure_diastolic ? `${vitalsHistory[0].blood_pressure_systolic}/${vitalsHistory[0].blood_pressure_diastolic} mmHg` : null,
                                pulse: vitalsHistory[0].pulse_rate ? `${vitalsHistory[0].pulse_rate} bpm` : null,
                                temp: vitalsHistory[0].temperature ? `${vitalsHistory[0].temperature}°F` : null,
                                spo2: vitalsHistory[0].spo2 ? `${vitalsHistory[0].spo2}%` : null,
                                weight: vitalsHistory[0].weight ? `${vitalsHistory[0].weight} kg` : null,
                                recordedAt: vitalsHistory[0].recorded_at,
                            } : null,
                            recentLabOrders: labOrders.slice(0, 3).map((l: any) => ({
                                test: l.test_name || l.service_name,
                                status: l.status,
                                result: l.results || l.result_data,
                            })),
                            recentNotes: clinicalNotes.slice(0, 3).map((n: any) => ({
                                type: n.note_type,
                                content: (n.content || '').substring(0, 150),
                                date: n.created_at,
                            })),
                            chiefComplaint: opdHistory?.[0]?.chief_complaint,
                        }}
                        onClose={() => setShowNotesModal(false)}
                        onSuccess={() => {
                            setShowNotesModal(false);
                            fetchPatientDetails();
                        }}
                    />
                )
            }

            {/* Upload Document Modal */}
            {
                showUploadModal && (
                    <DocumentUploadModal
                        onClose={() => setShowUploadModal(false)}
                        onUpload={handleUploadDocument}
                        uploading={uploadingDoc}
                    />
                )
            }

            {/* View Lab Results Modal */}
            {
                viewingLabOrder && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-slate-100">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">Lab Results</h2>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {viewingLabOrder.test_name} • {viewingLabOrder.order_number}
                                        </p>
                                    </div>
                                    <button onClick={() => setViewingLabOrder(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                                        <X className="w-5 h-5 text-slate-500" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 overflow-y-auto flex-1">
                                {loadingLabDocs ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                    </div>
                                ) : labOrderDocs.length > 0 ? (
                                    <div className="space-y-3">
                                        {labOrderDocs.map(doc => (
                                            <div key={doc.document_id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <File className="w-8 h-8 text-blue-500" />
                                                    <div>
                                                        <p className="font-medium text-slate-800">{doc.file_name}</p>
                                                        <p className="text-xs text-slate-500">{doc.description}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDownload(doc.document_id, doc.file_name)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Download
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-slate-500">
                                        No result documents uploaded yet
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Vital Trend Graph Modal */}
            {selectedVitalForGraph && (
                <VitalsGraphModal
                    vitalKey={selectedVitalForGraph}
                    vitalsHistory={vitalsHistory}
                    onClose={() => setSelectedVitalForGraph(null)}
                />
            )}
        </div >
    );
}

// Vital Card Component
function VitalCard({ label, value, unit, trend, normalRange, icon, color, onClick }: {
    label: string;
    value: string | number;
    unit: string;
    trend: 'up' | 'down' | 'stable' | null;
    normalRange?: string;
    icon: React.ReactNode;
    color: string;
    onClick?: () => void;
}) {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600',
        red: 'bg-red-50 text-red-600',
        amber: 'bg-amber-50 text-amber-600',
        cyan: 'bg-cyan-50 text-cyan-600',
        teal: 'bg-teal-50 text-teal-600',
        violet: 'bg-violet-50 text-violet-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        rose: 'bg-rose-50 text-rose-600',
        orange: 'bg-orange-50 text-orange-600',
    };

    // Trend-based border and background styling
    const trendStyles = {
        up: 'border-l-4 border-l-red-400 bg-red-50/30',
        down: 'border-l-4 border-l-green-400 bg-green-50/30',
        stable: 'border-l-4 border-l-slate-300 bg-slate-50',
    };

    const cardStyle = trend ? trendStyles[trend] : 'bg-slate-50 border border-slate-100';

    return (
        <div
            className={`rounded-lg p-2.5 cursor-pointer hover:shadow-md transition-all ${cardStyle} ${onClick ? 'hover:scale-[1.02]' : ''}`}
            onClick={onClick}
            title="Click to view trend graph"
        >
            <div className="flex items-center justify-between mb-1">
                <div className={`p-1.5 rounded-md ${colorClasses[color]}`}>
                    {icon}
                </div>
                {trend && (
                    <span className={`p-1 rounded-full ${trend === 'up' ? 'bg-red-100 text-red-600' :
                        trend === 'down' ? 'bg-green-100 text-green-600' :
                            'bg-slate-100 text-slate-500'
                        }`}>
                        {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> :
                            trend === 'down' ? <TrendingDown className="w-3.5 h-3.5" /> :
                                <Minus className="w-3.5 h-3.5" />}
                    </span>
                )}
            </div>
            <p className="text-xs font-medium text-slate-600 mb-0.5">{label}</p>
            <p className="text-lg font-bold text-slate-800 leading-tight">
                {value}
                <span className="text-xs font-normal text-slate-500 ml-0.5">{unit}</span>
            </p>
            {normalRange && (
                <div className="mt-1 pt-1 border-t border-black/5">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Normal</p>
                    <p className="text-xs font-semibold text-slate-600">{normalRange}</p>
                </div>
            )}
        </div>
    );
}

// Note Card Component
function NoteCard({ note, compact = false, onTogglePin, onDelete }: {
    note: any;
    compact?: boolean;
    onTogglePin?: (id: number) => void;
    onDelete?: (id: number) => void;
}) {
    const config = noteTypeConfig[note.note_type] || noteTypeConfig['General'];
    const Icon = config.icon;

    return (
        <div className={`bg-white rounded-xl border border-slate-100 p-4 ${note.is_pinned ? 'ring-2 ring-amber-200' : ''}`}>
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${config.bg} ${config.color}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${config.bg} ${config.color}`}>
                            {note.note_type}
                        </span>
                        {note.is_pinned && (
                            <Pin className="w-3 h-3 text-amber-500" />
                        )}
                        {note.is_confidential && (
                            <AlertCircle className="w-3 h-3 text-red-500" />
                        )}
                        {note.opd_number && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                {note.opd_number}
                            </span>
                        )}
                        <span className="text-xs text-slate-400 ml-auto">
                            {new Date(note.created_at).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric'
                            })}
                        </span>
                    </div>
                    {note.title && (
                        <h4 className="font-bold text-slate-800 mb-1">{note.title}</h4>
                    )}
                    <p className={`text-sm text-slate-600 ${compact ? 'line-clamp-2' : ''}`}>
                        {note.content}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                        by {note.author_name || 'Staff'}
                    </p>
                </div>
                {!compact && (onTogglePin || onDelete) && (
                    <div className="flex items-center gap-1">
                        {onTogglePin && (
                            <button
                                onClick={() => onTogglePin(note.note_id)}
                                className={`p-2 rounded-lg transition-colors ${note.is_pinned
                                    ? 'text-amber-500 hover:bg-amber-50'
                                    : 'text-slate-400 hover:bg-slate-100'
                                    }`}
                                title={note.is_pinned ? 'Unpin' : 'Pin'}
                            >
                                {note.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={() => onDelete(note.note_id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Record Vitals Modal Component
function RecordVitalsModal({
    patientId,
    opdHistory,
    defaultOpdId,
    patientName,
    onClose,
    onSuccess
}: {
    patientId: number;
    opdHistory: any[];
    defaultOpdId: number | null;
    patientName: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [selectedOpdId, setSelectedOpdId] = useState<string>(defaultOpdId ? String(defaultOpdId) : '');
    const [vitals, setVitals] = useState({
        blood_pressure_systolic: '',
        blood_pressure_diastolic: '',
        pulse_rate: '',
        temperature: '',
        spo2: '',
        respiratory_rate: '',
        weight: '',
        height: '',
        blood_glucose: '',
        pain_level: ''
    });
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        try {
            setSaving(true);
            setError(null);
            const token = localStorage.getItem('token');

            const vitalsData: Record<string, any> = {
                patient_id: patientId,
                opd_id: selectedOpdId ? parseInt(selectedOpdId) : undefined,
                notes: notes || undefined
            };

            if (vitals.blood_pressure_systolic) vitalsData.blood_pressure_systolic = parseInt(vitals.blood_pressure_systolic);
            if (vitals.blood_pressure_diastolic) vitalsData.blood_pressure_diastolic = parseInt(vitals.blood_pressure_diastolic);
            if (vitals.pulse_rate) vitalsData.pulse_rate = parseInt(vitals.pulse_rate);
            if (vitals.temperature) vitalsData.temperature = parseFloat(vitals.temperature);
            if (vitals.spo2) vitalsData.spo2 = parseInt(vitals.spo2);
            if (vitals.respiratory_rate) vitalsData.respiratory_rate = parseInt(vitals.respiratory_rate);
            if (vitals.weight) vitalsData.weight = parseFloat(vitals.weight);
            if (vitals.height) vitalsData.height = parseFloat(vitals.height);
            if (vitals.blood_glucose) vitalsData.blood_glucose = parseInt(vitals.blood_glucose);
            if (vitals.pain_level) vitalsData.pain_level = parseInt(vitals.pain_level);

            await axios.post(`${API_URL}/vitals`, vitalsData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            onSuccess();
        } catch (err: any) {
            console.error('Error saving vitals:', err);
            setError(err.response?.data?.message || 'Failed to save vitals');
        } finally {
            setSaving(false);
        }
    };

    const hasVitals = Object.values(vitals).some(v => v !== '');

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">Record Vitals</h2>
                    <p className="text-sm text-slate-500 mt-1">{patientName}</p>
                </div>

                <div className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* OPD Session Selector */}
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <label className="block text-sm font-medium text-blue-700 mb-2">
                            Link to OPD Session (Optional)
                        </label>
                        <select
                            value={selectedOpdId}
                            onChange={(e) => setSelectedOpdId(e.target.value)}
                            className="w-full px-4 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                        >
                            <option value="">No OPD Session (General)</option>
                            {opdHistory.map((opd: any) => (
                                <option key={opd.opd_id} value={opd.opd_id}>
                                    {opd.opd_number} - {new Date(opd.visit_date).toLocaleDateString()} ({opd.visit_type || 'Visit'})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">BP Systolic (mmHg)</label>
                            <input
                                type="number"
                                value={vitals.blood_pressure_systolic}
                                onChange={(e) => setVitals({ ...vitals, blood_pressure_systolic: e.target.value })}
                                placeholder="120"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">BP Diastolic (mmHg)</label>
                            <input
                                type="number"
                                value={vitals.blood_pressure_diastolic}
                                onChange={(e) => setVitals({ ...vitals, blood_pressure_diastolic: e.target.value })}
                                placeholder="80"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Pulse Rate (bpm)</label>
                            <input
                                type="number"
                                value={vitals.pulse_rate}
                                onChange={(e) => setVitals({ ...vitals, pulse_rate: e.target.value })}
                                placeholder="72"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Temperature (°F)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={vitals.temperature}
                                onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                                placeholder="98.6"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">SpO2 (%)</label>
                            <input
                                type="number"
                                value={vitals.spo2}
                                onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                                placeholder="98"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Resp. Rate (/min)</label>
                            <input
                                type="number"
                                value={vitals.respiratory_rate}
                                onChange={(e) => setVitals({ ...vitals, respiratory_rate: e.target.value })}
                                placeholder="16"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Weight (kg)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={vitals.weight}
                                onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                                placeholder="70"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Height (cm)</label>
                            <input
                                type="number"
                                value={vitals.height}
                                onChange={(e) => setVitals({ ...vitals, height: e.target.value })}
                                placeholder="170"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Blood Glucose (mg/dL)</label>
                            <input
                                type="number"
                                value={vitals.blood_glucose}
                                onChange={(e) => setVitals({ ...vitals, blood_glucose: e.target.value })}
                                placeholder="100"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Pain Level (0-10)</label>
                            <input
                                type="number"
                                min="0"
                                max="10"
                                value={vitals.pain_level}
                                onChange={(e) => setVitals({ ...vitals, pain_level: e.target.value })}
                                placeholder="0"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Notes (Optional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any observations or notes..."
                            rows={2}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving || !hasVitals}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <HeartPulse className="w-4 h-4" />}
                        {saving ? 'Saving...' : 'Save Vitals'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Add Clinical Note Modal Component
function AddNoteModal({
    patientId,
    opdHistory,
    defaultOpdId,
    patientName,
    patientContext,
    onClose,
    onSuccess
}: {
    patientId: number;
    opdHistory: any[];
    defaultOpdId: number | null;
    patientName: string;
    patientContext?: {
        age?: number;
        gender?: string;
        bloodGroup?: string;
        latestVitals?: any;
        recentLabOrders?: any[];
        recentNotes?: any[];
        chiefComplaint?: string;
    };
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [selectedOpdId, setSelectedOpdId] = useState<string>(defaultOpdId ? String(defaultOpdId) : '');
    const [noteType, setNoteType] = useState('Nursing');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isPinned, setIsPinned] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [aiSuggesting, setAiSuggesting] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

    const handleAiSuggest = async () => {
        setAiSuggesting(true);
        setAiSuggestion(null);
        try {
            // Build context string from patient data
            let contextParts: string[] = [];
            contextParts.push(`Patient: ${patientName}`);
            if (patientContext?.age) contextParts.push(`Age: ${patientContext.age}`);
            if (patientContext?.gender) contextParts.push(`Gender: ${patientContext.gender}`);
            if (patientContext?.chiefComplaint) contextParts.push(`Chief complaint: ${patientContext.chiefComplaint}`);
            if (patientContext?.latestVitals) {
                const v = patientContext.latestVitals;
                const vitals = [v.bp, v.pulse, v.temp, v.spo2, v.weight].filter(Boolean).join(', ');
                if (vitals) contextParts.push(`Latest vitals: ${vitals}`);
            }
            if (patientContext?.recentLabOrders?.length) {
                const labs = patientContext.recentLabOrders.map(l => `${l.test} (${l.status})`).join(', ');
                contextParts.push(`Recent labs: ${labs}`);
            }
            if (patientContext?.recentNotes?.length) {
                const notes = patientContext.recentNotes.map(n => `[${n.type}] ${n.content}`).join(' | ');
                contextParts.push(`Recent notes: ${notes}`);
            }

            const patientSummary = contextParts.join('. ');
            let inputContent: string;

            if (content) {
                inputContent = `Patient context: ${patientSummary}\n\nNote type: ${noteType}\nNurse's draft:\n"${content}"`;
            } else {
                inputContent = `Patient context: ${patientSummary}\n\nGenerate a ${noteType} note for this patient.`;
            }

            const result = await suggestNotes(inputContent, content ? 'improve' : 'generate');
            if (result.success && result.message) {
                setAiSuggestion(result.message);
            } else {
                setError('AI suggestion unavailable');
            }
        } catch {
            setError('AI suggestion failed');
        } finally {
            setAiSuggesting(false);
        }
    };

    const handleSubmit = async () => {
        if (!content.trim()) {
            setError('Note content is required');
            return;
        }

        try {
            setSaving(true);
            setError(null);
            const token = localStorage.getItem('token');

            await axios.post(`${API_URL}/clinical-notes`, {
                patient_id: patientId,
                opd_id: selectedOpdId ? parseInt(selectedOpdId) : undefined,
                note_type: noteType,
                title: title || undefined,
                content,
                is_pinned: isPinned
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            onSuccess();
        } catch (err: any) {
            console.error('Error saving note:', err);
            setError(err.response?.data?.message || 'Failed to save note');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">Add Clinical Note</h2>
                    <p className="text-sm text-slate-500 mt-1">{patientName}</p>
                </div>

                <div className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* OPD Session Selector */}
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <label className="block text-sm font-medium text-blue-700 mb-2">
                            Link to OPD Session (Optional)
                        </label>
                        <select
                            value={selectedOpdId}
                            onChange={(e) => setSelectedOpdId(e.target.value)}
                            className="w-full px-4 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                        >
                            <option value="">No OPD Session (General)</option>
                            {opdHistory.map((opd: any) => (
                                <option key={opd.opd_id} value={opd.opd_id}>
                                    {opd.opd_number} - {new Date(opd.visit_date).toLocaleDateString()} ({opd.visit_type || 'Visit'})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Note Type</label>
                        <select
                            value={noteType}
                            onChange={(e) => setNoteType(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                            {Object.keys(noteTypeConfig).map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Title (Optional)</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Brief title for this note..."
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-slate-700">Content *</label>
                            <button
                                type="button"
                                onClick={handleAiSuggest}
                                disabled={aiSuggesting}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg text-xs font-medium text-blue-700 hover:from-blue-100 hover:to-indigo-100 transition-all disabled:opacity-50"
                            >
                                {aiSuggesting ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <Sparkles className="w-3 h-3" />
                                )}
                                {aiSuggesting ? 'Suggesting...' : 'AI Suggest'}
                            </button>
                        </div>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Enter clinical note content..."
                            rows={6}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                        />
                        {aiSuggestion && (
                            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-blue-700 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> AI Suggestion
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setContent(prev => prev ? prev + '\n\n' + aiSuggestion : aiSuggestion);
                                            setAiSuggestion(null);
                                        }}
                                        className="text-xs font-medium text-blue-600 hover:text-blue-800 underline"
                                    >
                                        Apply
                                    </button>
                                </div>
                                <p className="text-xs text-slate-700 whitespace-pre-wrap">{aiSuggestion}</p>
                            </div>
                        )}
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isPinned}
                            onChange={(e) => setIsPinned(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">Pin this note (show at top of patient profile)</span>
                    </label>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving || !content.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                        {saving ? 'Saving...' : 'Save Note'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Document Upload Modal
function DocumentUploadModal({
    onClose,
    onUpload,
    uploading
}: {
    onClose: () => void;
    onUpload: (file: File, docType: string, description: string) => void;
    uploading: boolean;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [docType, setDocType] = useState('Other');
    const [description, setDescription] = useState('');

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">Upload Document</h2>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">File</label>
                        <input
                            type="file"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Document Type</label>
                        <select
                            value={docType}
                            onChange={(e) => setDocType(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                            <option value="Lab Result">Lab Result</option>
                            <option value="Imaging">Imaging</option>
                            <option value="Report">Report</option>
                            <option value="Prescription">Prescription</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description..."
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={uploading}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => file && onUpload(file, docType, description)}
                        disabled={uploading || !file}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                </div>
            </div>

        </div>
    );
}

// Vitals Graph Modal Component
function VitalsGraphModal({
    vitalKey,
    vitalsHistory,
    onClose
}: {
    vitalKey: string;
    vitalsHistory: any[];
    onClose: () => void;
}) {
    // Vital configuration
    const vitalConfig: Record<string, { label: string; unit: string; color: string; normalRange?: { min: number; max: number } }> = {
        blood_pressure_systolic: { label: 'Blood Pressure (Systolic)', unit: 'mmHg', color: '#3b82f6', normalRange: { min: 90, max: 120 } },
        blood_pressure_diastolic: { label: 'Blood Pressure (Diastolic)', unit: 'mmHg', color: '#6366f1', normalRange: { min: 60, max: 80 } },
        pulse_rate: { label: 'Pulse Rate', unit: 'bpm', color: '#ef4444', normalRange: { min: 60, max: 100 } },
        temperature: { label: 'Temperature', unit: '°F', color: '#f59e0b', normalRange: { min: 97, max: 99 } },
        spo2: { label: 'SpO2', unit: '%', color: '#06b6d4', normalRange: { min: 95, max: 100 } },
        respiratory_rate: { label: 'Respiratory Rate', unit: '/min', color: '#14b8a6', normalRange: { min: 12, max: 20 } },
        weight: { label: 'Weight', unit: 'kg', color: '#8b5cf6' },
        height: { label: 'Height', unit: 'cm', color: '#6366f1' },
        blood_glucose: { label: 'Blood Glucose', unit: 'mg/dL', color: '#ec4899', normalRange: { min: 70, max: 100 } },
        pain_level: { label: 'Pain Level', unit: '/10', color: '#f97316', normalRange: { min: 0, max: 3 } },
    };

    const config = vitalConfig[vitalKey] || { label: vitalKey, unit: '', color: '#3b82f6' };

    // Prepare chart data - reverse to show oldest first
    const chartData = vitalsHistory
        .filter(v => v[vitalKey] !== null && v[vitalKey] !== undefined)
        .reverse()
        .map(v => ({
            date: new Date(v.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            time: new Date(v.recorded_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            value: parseFloat(v[vitalKey]),
            fullDate: new Date(v.recorded_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        }));

    // Calculate stats
    const values = chartData.map(d => d.value);
    const minValue = values.length > 0 ? Math.min(...values) : 0;
    const maxValue = values.length > 0 ? Math.max(...values) : 0;
    const avgValue = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : 0;
    const latestValue = values.length > 0 ? values[values.length - 1] : 0;
    const previousValue = values.length > 1 ? values[values.length - 2] : null;
    const change = previousValue !== null ? ((latestValue - previousValue) / previousValue * 100).toFixed(1) : null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl" style={{ backgroundColor: `${config.color}20` }}>
                                <TrendingUp className="w-6 h-6" style={{ color: config.color }} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">{config.label} Trend</h2>
                                <p className="text-sm text-slate-500">
                                    {chartData.length} readings • Last {vitalsHistory.length > 0 ? Math.ceil((Date.now() - new Date(vitalsHistory[vitalsHistory.length - 1]?.recorded_at).getTime()) / (1000 * 60 * 60 * 24)) : 0} days
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/80 rounded-lg transition-all"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <div className="grid grid-cols-4 gap-3">
                        <div className="bg-white rounded-lg p-3 border border-slate-100">
                            <p className="text-xs text-slate-500 font-medium">Current</p>
                            <p className="text-lg font-bold text-slate-800">{latestValue} <span className="text-xs font-normal text-slate-400">{config.unit}</span></p>
                            {change !== null && (
                                <p className={`text-xs font-medium ${parseFloat(change) > 0 ? 'text-red-500' : parseFloat(change) < 0 ? 'text-green-500' : 'text-slate-400'}`}>
                                    {parseFloat(change) > 0 ? '↑' : parseFloat(change) < 0 ? '↓' : '—'} {Math.abs(parseFloat(change))}%
                                </p>
                            )}
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-slate-100">
                            <p className="text-xs text-slate-500 font-medium">Average</p>
                            <p className="text-lg font-bold text-slate-800">{avgValue} <span className="text-xs font-normal text-slate-400">{config.unit}</span></p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-slate-100">
                            <p className="text-xs text-slate-500 font-medium">Min</p>
                            <p className="text-lg font-bold text-slate-800">{minValue} <span className="text-xs font-normal text-slate-400">{config.unit}</span></p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-slate-100">
                            <p className="text-xs text-slate-500 font-medium">Max</p>
                            <p className="text-lg font-bold text-slate-800">{maxValue} <span className="text-xs font-normal text-slate-400">{config.unit}</span></p>
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div className="p-6">
                    {chartData.length > 1 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        tickLine={{ stroke: '#cbd5e1' }}
                                    />
                                    <YAxis
                                        domain={['auto', 'auto']}
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        tickLine={{ stroke: '#cbd5e1' }}
                                        width={40}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                        formatter={(value: number) => [`${value} ${config.unit}`, config.label]}
                                        labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke={config.color}
                                        strokeWidth={2.5}
                                        dot={{ fill: config.color, strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, fill: config.color, stroke: '#fff', strokeWidth: 2 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : chartData.length === 1 ? (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                                <Activity className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Only one reading</h3>
                            <p className="text-sm text-slate-500">Record more vitals to see the trend over time.</p>
                            <div className="mt-4 text-2xl font-bold" style={{ color: config.color }}>
                                {chartData[0].value} {config.unit}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-800 mb-2">No data available</h3>
                            <p className="text-sm text-slate-500">No readings recorded for this vital sign yet.</p>
                        </div>
                    )}
                </div>

                {/* Normal Range Info */}
                {config.normalRange && (
                    <div className="px-6 pb-4">
                        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                            <p className="text-xs font-medium text-emerald-700">
                                Normal Range: {config.normalRange.min} - {config.normalRange.max} {config.unit}
                            </p>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
