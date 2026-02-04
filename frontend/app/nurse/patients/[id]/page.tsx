'use client';

import { useState, useEffect, useCallback } from 'react';
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
    Filter
} from 'lucide-react';

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

    // UI state
    const [activeTab, setActiveTab] = useState<'overview' | 'vitals' | 'notes' | 'labs' | 'documents'>('overview');
    const [latestOpdId, setLatestOpdId] = useState<number | null>(null);

    // Modal states
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [viewingLabOrder, setViewingLabOrder] = useState<any>(null);
    const [labOrderDocs, setLabOrderDocs] = useState<any[]>([]);
    const [loadingLabDocs, setLoadingLabDocs] = useState(false);
    const [showVitalsModal, setShowVitalsModal] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);

    // Notes filter
    const [noteTypeFilter, setNoteTypeFilter] = useState<string>('');
    const [noteSearchQuery, setNoteSearchQuery] = useState('');

    // Fetch all patient data
    const fetchPatientDetails = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const [patientRes, opdRes, docsRes, labsRes, vitalsRes, notesRes] = await Promise.all([
                axios.get(`${API_URL}/patients/${params.id}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/opd/patient/${params.id}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/patient-documents/patient/${params.id}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: { documents: [] } } })),
                axios.get(`${API_URL}/lab-orders/patient/${params.id}?includeCompleted=true`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: { orders: [] } } })),
                axios.get(`${API_URL}/vitals/patient/${params.id}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: { vitals: [] } } })),
                axios.get(`${API_URL}/clinical-notes/patient/${params.id}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: { notes: [] } } }))
            ]);

            setPatient(patientRes.data.data.patient);
            const opdHistoryData = opdRes.data.data.opdHistory || [];
            setOpdHistory(opdHistoryData);
            setDocuments(docsRes.data.data.documents || []);
            setLabOrders(labsRes.data.data.orders || []);
            setVitalsHistory(vitalsRes.data.data.vitals || []);
            setClinicalNotes(notesRes.data.data.notes || []);

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
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-y md:divide-y-0 divide-slate-100">
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
                </div>
            </div>

            {/* Latest Vitals Summary */}
            {latestVitals && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <HeartPulse className="w-5 h-5 text-red-500" />
                            Latest Vitals
                        </h3>
                        <span className="text-sm text-slate-500">
                            {new Date(latestVitals.recorded_at).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {latestVitals.blood_pressure_systolic && (
                            <VitalCard
                                label="Blood Pressure"
                                value={`${latestVitals.blood_pressure_systolic}/${latestVitals.blood_pressure_diastolic}`}
                                unit="mmHg"
                                trend={getVitalsTrend(latestVitals.blood_pressure_systolic, previousVitals?.blood_pressure_systolic)}
                                icon={<Activity className="w-5 h-5" />}
                                color="blue"
                            />
                        )}
                        {latestVitals.pulse_rate && (
                            <VitalCard
                                label="Pulse Rate"
                                value={latestVitals.pulse_rate}
                                unit="bpm"
                                trend={getVitalsTrend(latestVitals.pulse_rate, previousVitals?.pulse_rate)}
                                icon={<HeartPulse className="w-5 h-5" />}
                                color="red"
                            />
                        )}
                        {latestVitals.temperature && (
                            <VitalCard
                                label="Temperature"
                                value={latestVitals.temperature}
                                unit="°F"
                                trend={getVitalsTrend(latestVitals.temperature, previousVitals?.temperature)}
                                icon={<Thermometer className="w-5 h-5" />}
                                color="amber"
                            />
                        )}
                        {latestVitals.spo2 && (
                            <VitalCard
                                label="SpO2"
                                value={latestVitals.spo2}
                                unit="%"
                                trend={getVitalsTrend(latestVitals.spo2, previousVitals?.spo2)}
                                icon={<Droplets className="w-5 h-5" />}
                                color="cyan"
                            />
                        )}
                        {latestVitals.respiratory_rate && (
                            <VitalCard
                                label="Resp. Rate"
                                value={latestVitals.respiratory_rate}
                                unit="/min"
                                trend={getVitalsTrend(latestVitals.respiratory_rate, previousVitals?.respiratory_rate)}
                                icon={<Wind className="w-5 h-5" />}
                                color="teal"
                            />
                        )}
                        {latestVitals.weight && (
                            <VitalCard
                                label="Weight"
                                value={latestVitals.weight}
                                unit="kg"
                                trend={getVitalsTrend(latestVitals.weight, previousVitals?.weight)}
                                icon={<User className="w-5 h-5" />}
                                color="violet"
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-100 overflow-x-auto">
                    {[
                        { id: 'overview', label: 'Overview', icon: History },
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
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-800">Vitals History</h3>
                                <button
                                    onClick={() => setShowVitalsModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all"
                                >
                                    <Plus className="w-4 h-4" />
                                    Record New
                                </button>
                            </div>

                            {vitalsHistory.length > 0 ? (
                                <div className="space-y-3">
                                    {vitalsHistory.map((vital: any) => (
                                        <div key={vital.vital_id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2">
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
                                                </div>
                                                <span className="text-xs text-slate-400">by {vital.recorded_by_name || 'Staff'}</span>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {vital.blood_pressure_systolic && vital.blood_pressure_diastolic && (
                                                    <div className="bg-white rounded-lg p-3 border border-slate-100">
                                                        <p className="text-xs text-slate-500 mb-1">Blood Pressure</p>
                                                        <p className="text-lg font-bold text-slate-800">
                                                            {vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic}
                                                            <span className="text-xs font-normal text-slate-400 ml-1">mmHg</span>
                                                        </p>
                                                    </div>
                                                )}
                                                {vital.pulse_rate && (
                                                    <div className="bg-white rounded-lg p-3 border border-slate-100">
                                                        <p className="text-xs text-slate-500 mb-1">Pulse Rate</p>
                                                        <p className="text-lg font-bold text-slate-800">
                                                            {vital.pulse_rate}
                                                            <span className="text-xs font-normal text-slate-400 ml-1">bpm</span>
                                                        </p>
                                                    </div>
                                                )}
                                                {vital.temperature && (
                                                    <div className="bg-white rounded-lg p-3 border border-slate-100">
                                                        <p className="text-xs text-slate-500 mb-1">Temperature</p>
                                                        <p className="text-lg font-bold text-slate-800">
                                                            {vital.temperature}
                                                            <span className="text-xs font-normal text-slate-400 ml-1">°F</span>
                                                        </p>
                                                    </div>
                                                )}
                                                {vital.spo2 && (
                                                    <div className="bg-white rounded-lg p-3 border border-slate-100">
                                                        <p className="text-xs text-slate-500 mb-1">SpO2</p>
                                                        <p className="text-lg font-bold text-slate-800">
                                                            {vital.spo2}
                                                            <span className="text-xs font-normal text-slate-400 ml-1">%</span>
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
                                    <p className="text-slate-400 font-medium">No vitals recorded yet</p>
                                    <button
                                        onClick={() => setShowVitalsModal(true)}
                                        className="mt-4 text-blue-600 text-sm font-medium hover:underline"
                                    >
                                        Record the first vitals
                                    </button>
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
                                    <button
                                        onClick={() => setShowNotesModal(true)}
                                        className="mt-4 text-blue-600 text-sm font-medium hover:underline"
                                    >
                                        Add the first note
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Lab Orders Tab */}
                    {activeTab === 'labs' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-800">Lab Orders</h3>
                            {labOrders.length > 0 ? (
                                <div className="space-y-3">
                                    {labOrders.map(order => (
                                        <div key={order.order_id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
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
                                    <p className="text-slate-400 font-medium">No lab orders for this patient</p>
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
                                    <p className="text-slate-400 font-medium">No documents uploaded</p>
                                    <button
                                        onClick={() => setShowUploadModal(true)}
                                        className="mt-4 text-blue-600 text-sm font-medium hover:underline"
                                    >
                                        Upload the first document
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Record Vitals Modal */}
            {showVitalsModal && patient && (
                <RecordVitalsModal
                    patientId={patient.patient_id}
                    opdId={latestOpdId}
                    patientName={`${patient?.first_name} ${patient?.last_name}`}
                    onClose={() => setShowVitalsModal(false)}
                    onSuccess={() => {
                        setShowVitalsModal(false);
                        fetchPatientDetails();
                    }}
                />
            )}

            {/* Add Clinical Note Modal */}
            {showNotesModal && patient && (
                <AddNoteModal
                    patientId={patient.patient_id}
                    opdId={latestOpdId}
                    patientName={`${patient?.first_name} ${patient?.last_name}`}
                    onClose={() => setShowNotesModal(false)}
                    onSuccess={() => {
                        setShowNotesModal(false);
                        fetchPatientDetails();
                    }}
                />
            )}

            {/* Upload Document Modal */}
            {showUploadModal && (
                <DocumentUploadModal
                    onClose={() => setShowUploadModal(false)}
                    onUpload={handleUploadDocument}
                    uploading={uploadingDoc}
                />
            )}

            {/* View Lab Results Modal */}
            {viewingLabOrder && (
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
            )}
        </div>
    );
}

// Vital Card Component
function VitalCard({ label, value, unit, trend, icon, color }: {
    label: string;
    value: string | number;
    unit: string;
    trend: 'up' | 'down' | 'stable' | null;
    icon: React.ReactNode;
    color: string;
}) {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600',
        red: 'bg-red-50 text-red-600',
        amber: 'bg-amber-50 text-amber-600',
        cyan: 'bg-cyan-50 text-cyan-600',
        teal: 'bg-teal-50 text-teal-600',
        violet: 'bg-violet-50 text-violet-600',
    };

    return (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                    {icon}
                </div>
                {trend && (
                    <span className={`${trend === 'up' ? 'text-red-500' :
                            trend === 'down' ? 'text-green-500' :
                                'text-slate-400'
                        }`}>
                        {trend === 'up' ? <TrendingUp className="w-4 h-4" /> :
                            trend === 'down' ? <TrendingDown className="w-4 h-4" /> :
                                <Minus className="w-4 h-4" />}
                    </span>
                )}
            </div>
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className="text-xl font-bold text-slate-800">
                {value}
                <span className="text-xs font-normal text-slate-400 ml-1">{unit}</span>
            </p>
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
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${config.bg} ${config.color}`}>
                            {note.note_type}
                        </span>
                        {note.is_pinned && (
                            <Pin className="w-3 h-3 text-amber-500" />
                        )}
                        {note.is_confidential && (
                            <AlertCircle className="w-3 h-3 text-red-500" />
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
    opdId,
    patientName,
    onClose,
    onSuccess
}: {
    patientId: number;
    opdId: number | null;
    patientName: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
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
                opd_id: opdId || undefined,
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
    opdId,
    patientName,
    onClose,
    onSuccess
}: {
    patientId: number;
    opdId: number | null;
    patientName: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [noteType, setNoteType] = useState('Nursing');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isPinned, setIsPinned] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                opd_id: opdId || undefined,
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
                        <label className="block text-sm font-medium text-slate-700 mb-2">Content *</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Enter clinical note content..."
                            rows={6}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                        />
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
