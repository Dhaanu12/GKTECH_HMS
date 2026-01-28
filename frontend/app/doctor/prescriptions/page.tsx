'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, FileText, Download, Loader2, X, Trash2, Printer, Pill } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function DoctorPrescriptions() {
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal & Form State
    const [showModal, setShowModal] = useState(false);
    const [patientSearchQuery, setPatientSearchQuery] = useState('');
    const [patientResults, setPatientResults] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [details, setDetails] = useState({
        diagnosis: '',
        notes: ''
    });
    const [medications, setMedications] = useState<any[]>([
        { name: '', dosage: '', frequency: '', duration: '', instruction: '' }
    ]);
    const [submitting, setSubmitting] = useState(false);

    // Print Modal State
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [printingPrescription, setPrintingPrescription] = useState<any>(null);

    useEffect(() => {
        fetchPrescriptions();
    }, [searchTerm]);

    const fetchPrescriptions = async () => {
        try {
            const token = localStorage.getItem('token');
            let url = `${API_URL}/prescriptions/my-prescriptions`;
            if (searchTerm) {
                url += `?search=${searchTerm}`;
            }
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPrescriptions(response.data.data.prescriptions || []);
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePatientSearch = async () => {
        if (!patientSearchQuery.trim()) return;
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/patients/search`, {
                params: { q: patientSearchQuery },
                headers: { Authorization: `Bearer ${token}` }
            });
            setPatientResults(response.data.data.patients || []);
        } catch (error) {
            console.error('Error searching patients:', error);
        }
    };

    const handlePrint = (prescription: any) => {
        setPrintingPrescription(prescription);
        setShowPrintModal(true);
    };

    const selectPatient = (patient: any) => {
        setSelectedPatient(patient);
        setPatientResults([]);
        setPatientSearchQuery('');
    };

    const addMedication = () => {
        setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '', instruction: '' }]);
    };

    const removeMedication = (index: number) => {
        const newMeds = [...medications];
        newMeds.splice(index, 1);
        setMedications(newMeds);
    };

    const updateMedication = (index: number, field: string, value: string) => {
        const newMeds = [...medications];
        newMeds[index][field] = value;
        setMedications(newMeds);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatient) {
            alert('Please select a patient first');
            return;
        }

        // Basic validation: Check if at least one medication has a name
        if (medications.length === 0 || !medications[0].name) {
            alert('Please add at least one medication');
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                patient_id: selectedPatient.patient_id,
                diagnosis: details.diagnosis,
                notes: details.notes,
                medications: JSON.stringify(medications)
            };

            await axios.post(`${API_URL}/prescriptions`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowModal(false);
            resetForm();
            fetchPrescriptions();
            alert('Prescription created successfully!');
        } catch (error: any) {
            console.error('Error creating prescription:', error);
            alert(error.response?.data?.message || 'Failed to create prescription');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setSelectedPatient(null);
        setPatientSearchQuery('');
        setPatientResults([]);
        setDetails({ diagnosis: '', notes: '' });
        setMedications([{ name: '', dosage: '', frequency: '', duration: '', instruction: '' }]);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-slate-800">Prescriptions</h1>
                    <p className="text-slate-500 mt-1">Manage and issue patient prescriptions with AI assistance.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition font-medium shadow-lg shadow-blue-500/30 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    New Prescription
                </button>
            </div>

            {/* Search Bar & Filters */}
            <div className="glass-panel p-2 rounded-2xl flex items-center gap-2 max-w-2xl">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search prescriptions by patient name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-transparent border-none focus:ring-0 text-slate-800 placeholder:text-slate-400"
                    />
                </div>
                <div className="h-8 w-[1px] bg-slate-200"></div>
                <button className="p-3 text-slate-500 hover:text-blue-600 transition">
                    <span className="sr-only">Filters</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {prescriptions.length > 0 ? (
                        prescriptions.map((script) => (
                            <div key={script.prescription_id} className="glass-card p-6 rounded-2xl group relative hover:z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold text-lg shadow-inner">
                                            {script.patient_first_name?.[0]}
                                            {script.patient_last_name?.[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">{script.patient_first_name} {script.patient_last_name}</h3>
                                            <p className="text-xs text-slate-500">{new Date(script.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${script.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                                        }`}>
                                        {script.status}
                                    </span>
                                </div>

                                <div className="bg-white/50 rounded-xl p-3 mb-4 backdrop-blur-sm border border-slate-100 min-h-[80px]">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Medications</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(() => {
                                            try {
                                                const meds = typeof script.medications === 'string' ? JSON.parse(script.medications) : script.medications;
                                                const list = Array.isArray(meds) ? meds : [];
                                                return list.slice(0, 3).map((m: any, i: number) => (
                                                    <span key={i} className="inline-flex items-center px-2 py-1 rounded-md bg-white border border-slate-200 text-xs text-slate-700 shadow-sm">
                                                        <Pill className="w-3 h-3 mr-1 text-slate-400" />
                                                        {m.name}
                                                    </span>
                                                ));
                                            } catch (e) {
                                                return <span className="text-xs text-slate-400 italic">No medications listed</span>;
                                            }
                                        })()}
                                        {/* Overflow indicator if needed, skipped for simplicity */}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-slate-100/50 pt-4 mt-auto">
                                    <div className="text-xs text-slate-500 font-medium">Rx ID: #{script.prescription_id}</div>
                                    <button
                                        onClick={() => handlePrint(script)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition text-sm font-medium"
                                    >
                                        <Printer className="w-4 h-4" /> Print
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900">No prescriptions found</h3>
                            <p className="text-slate-500 mt-1">Get started by creating a new prescription.</p>
                        </div>
                    )}
                </div>
            )}

            {/* New Prescription Modal - Glassmorphism */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
                        {/* Modal Header */}
                        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-xl z-10 rounded-t-3xl">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    New Prescription
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">Fill in patient details and medications</p>
                            </div>
                            <button
                                onClick={() => { setShowModal(false); resetForm(); }}
                                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-8">
                            {/* Section 1: Patient Selection */}
                            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Patient Details</label>
                                {selectedPatient ? (
                                    <div className="flex items-center justify-between p-4 bg-white border border-blue-100 rounded-xl shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                                {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-lg">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                                                <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                                                    <span>{selectedPatient.gender}, {selectedPatient.age} yrs</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                    <span>MRN: {selectedPatient.mrn_number}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedPatient(null)}
                                            className="px-4 py-2 text-sm text-slate-600 hover:text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition"
                                        >
                                            Change Patient
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 w-5 h-5 transition-colors" />
                                        <input
                                            type="text"
                                            value={patientSearchQuery}
                                            onChange={(e) => setPatientSearchQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handlePatientSearch())}
                                            placeholder="Search patient by name, phone, or MRN..."
                                            className="w-full pl-12 pr-24 py-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={handlePatientSearch}
                                            className="absolute right-2 top-2 bottom-2 px-5 bg-slate-900 text-white rounded-lg hover:bg-blue-600 transition font-medium text-sm"
                                        >
                                            Search
                                        </button>

                                        {patientResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-20 max-h-64 overflow-y-auto overflow-hidden">
                                                {patientResults.map(patient => (
                                                    <div
                                                        key={patient.patient_id}
                                                        onClick={() => selectPatient(patient)}
                                                        className="p-4 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center group"
                                                    >
                                                        <div>
                                                            <p className="font-semibold text-slate-800 group-hover:text-blue-700">{patient.first_name} {patient.last_name}</p>
                                                            <p className="text-sm text-slate-500">{patient.contact_number} • {patient.gender}</p>
                                                        </div>
                                                        <span className="text-xs font-semibold bg-slate-100 px-2 py-1 rounded text-slate-500 group-hover:bg-blue-200 group-hover:text-blue-700">Select</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Section 2: Clinical Notes with AI Scribe */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Diagnosis</label>
                                    <textarea
                                        value={details.diagnosis}
                                        onChange={(e) => setDetails({ ...details, diagnosis: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none h-32"
                                        placeholder="Enter clinical diagnosis..."
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-semibold text-slate-700">Clinical Notes</label>
                                        {/* AI Scribe Button */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                // Simulate AI Scribe
                                                const btn = document.getElementById('ai-scribe-btn');
                                                if (btn) {
                                                    const originalText = btn.innerHTML;
                                                    btn.innerHTML = '<span class="animate-pulse">🔴 Listening...</span>';
                                                    setTimeout(() => {
                                                        btn.innerHTML = '<span class="animate-spin">⚡ Processing...</span>';
                                                        setTimeout(() => {
                                                            setDetails(prev => ({
                                                                ...prev,
                                                                notes: prev.notes + (prev.notes ? '\n' : '') + "Patient reports persistent headache for 3 days. BP is slightly elevated. Recommended rest and hydration."
                                                            }));
                                                            btn.innerHTML = originalText;
                                                        }, 1500);
                                                    }, 2000);
                                                }
                                            }}
                                            id="ai-scribe-btn"
                                            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold rounded-full shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 hover:scale-105 transition-all cursor-pointer"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                                            AI Scribe
                                        </button>
                                    </div>
                                    <textarea
                                        value={details.notes}
                                        onChange={(e) => setDetails({ ...details, notes: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none h-32 font-mono text-sm"
                                        placeholder="Type or use AI Scribe to dictate notes..."
                                    />
                                </div>
                            </div>

                            {/* Section 3: Medications */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Prescribed Medications</label>
                                    <button
                                        type="button"
                                        onClick={addMedication}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
                                    >
                                        <Plus className="w-4 h-4" /> Add Drug
                                    </button>
                                </div>

                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {medications.map((med, index) => (
                                        <div key={index} className="flex flex-col md:flex-row gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm relative group hover:border-blue-300 transition-colors">
                                            <div className="flex-1 min-w-[200px]">
                                                <input
                                                    type="text"
                                                    value={med.name}
                                                    onChange={(e) => updateMedication(index, 'name', e.target.value)}
                                                    placeholder="Drug Name"
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white transition-colors font-medium"
                                                    required
                                                />
                                            </div>
                                            <div className="w-full md:w-28">
                                                <input
                                                    type="text"
                                                    value={med.dosage}
                                                    onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                                                    placeholder="Dose (500mg)"
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white transition-colors"
                                                />
                                            </div>
                                            <div className="w-full md:w-28">
                                                <input
                                                    type="text"
                                                    value={med.frequency}
                                                    onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                                    placeholder="Freq (1-0-1)"
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white transition-colors"
                                                />
                                            </div>
                                            <div className="w-full md:w-28">
                                                <input
                                                    type="text"
                                                    value={med.duration}
                                                    onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                                                    placeholder="Dur (5 days)"
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white transition-colors"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={med.instruction}
                                                    onChange={(e) => updateMedication(index, 'instruction', e.target.value)}
                                                    placeholder="Remarks"
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white transition-colors"
                                                />
                                            </div>

                                            {medications.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeMedication(index)}
                                                    className="absolute -top-2 -right-2 bg-white rounded-full p-1.5 text-red-500 shadow-md border border-red-100 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-[-20px] bg-white/95 backdrop-blur pb-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                    className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all font-bold flex items-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" /> Saving Information...
                                        </>
                                    ) : (
                                        'Issue Prescription'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Print Modal */}
            {showPrintModal && printingPrescription && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 print:p-0 print:bg-white print:fixed print:inset-0 print:z-[100]">
                    <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col print:shadow-none print:w-full print:max-w-none print:max-h-none print:block print:overflow-visible">
                        {/* Print Controls - Sticky Top */}
                        <div className="flex-none bg-gray-100 px-6 py-3 flex justify-between items-center border-b border-gray-200 print:hidden rounded-t-lg">
                            <h3 className="font-semibold text-gray-800">Prescription Preview</h3>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => window.print()}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                >
                                    <Printer className="w-4 h-4" /> Print
                                </button>
                                <button
                                    onClick={() => setShowPrintModal(false)}
                                    className="p-2 hover:bg-gray-200 rounded-lg text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Prescription Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-8 print:p-8 print:overflow-visible" id="printable-prescription">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-8 border-b-2 border-blue-900 pb-4">
                                <div className="flex items-center gap-4">
                                    {/* Logo Placeholder */}
                                    {/* <img src="/logo.png" alt="Hospital Logo" className="h-16 w-auto" /> */}
                                    <div>
                                        <h1 className="text-3xl font-bold text-blue-900 tracking-tight">
                                            {printingPrescription.hospital_name || 'Care 24 Medical Centre & Hospital'}
                                        </h1>
                                        <p className="text-sm font-medium text-gray-600 mt-1">Excellence in Healthcare</p>
                                    </div>
                                </div>
                                <div className="text-right text-sm">
                                    <h2 className="text-lg font-bold text-gray-900 uppercase">
                                        Dr. {printingPrescription.doctor_first_name} {printingPrescription.doctor_last_name}
                                    </h2>
                                    <p className="text-gray-600">{printingPrescription.doctor_specialization || 'General Physician'}</p>
                                    <p className="text-gray-500 mt-1">Reg No: {printingPrescription.doctor_registration_number || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Patient Info */}
                            <div className="flex justify-between items-end mb-8 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <div className="space-y-1">
                                    <div className="flex gap-2">
                                        <span className="text-sm text-gray-500 w-20">Patient:</span>
                                        <span className="font-bold text-gray-900 uppercase">
                                            {printingPrescription.patient_first_name} {printingPrescription.patient_last_name}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-sm text-gray-500 w-20">Age/Sex:</span>
                                        <span className="font-medium text-gray-900">
                                            {printingPrescription.patient_age}Y / {printingPrescription.patient_gender}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-sm text-gray-500 w-20">Mobile:</span>
                                        <span className="font-medium text-gray-900">{printingPrescription.patient_contact_number}</span>
                                    </div>
                                </div>
                                <div className="text-right space-y-1">
                                    <div className="flex gap-2 justify-end">
                                        <span className="text-sm text-gray-500">Date:</span>
                                        <span className="font-bold text-gray-900">
                                            {new Date(printingPrescription.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <span className="text-sm text-gray-500">Rx ID:</span>
                                        <span className="font-medium text-gray-900">#{printingPrescription.prescription_id}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Diagnosis */}
                            {printingPrescription.diagnosis && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-1">Diagnosis</h3>
                                    <p className="text-gray-900 font-medium text-lg">{printingPrescription.diagnosis}</p>
                                </div>
                            )}

                            {/* Medications */}
                            <div className="mb-8">
                                <h3 className="flex items-center gap-2 text-xl font-bold text-blue-900 mb-4 border-b border-gray-200 pb-2">
                                    <span className="text-2xl font-serif italic">Rx</span> Medications
                                </h3>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 text-left border-y border-gray-200">
                                            <th className="py-2 pl-4 font-semibold text-gray-700 w-12">#</th>
                                            <th className="py-2 font-semibold text-gray-700">Medicine Name</th>
                                            <th className="py-2 font-semibold text-gray-700">Dosage</th>
                                            <th className="py-2 font-semibold text-gray-700">Frequency</th>
                                            <th className="py-2 font-semibold text-gray-700">Duration</th>
                                            <th className="py-2 text-right pr-4 font-semibold text-gray-700">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {(() => {
                                            try {
                                                const meds = typeof printingPrescription.medications === 'string' ? JSON.parse(printingPrescription.medications) : printingPrescription.medications;
                                                const medList = Array.isArray(meds) ? meds : [];

                                                if (medList.length === 0 && typeof printingPrescription.medications === 'string' && !printingPrescription.medications.startsWith('[')) {
                                                    return (
                                                        <tr>
                                                            <td colSpan={6} className="py-3 pl-4 text-gray-900 whitespace-pre-wrap">
                                                                {printingPrescription.medications}
                                                            </td>
                                                        </tr>
                                                    );
                                                }

                                                return medList.map((med: any, i: number) => (
                                                    <tr key={i}>
                                                        <td className="py-3 pl-4 text-gray-500">{i + 1}</td>
                                                        <td className="py-3 font-bold text-gray-900">{med.name}</td>
                                                        <td className="py-3 text-gray-700">{med.dosage}</td>
                                                        <td className="py-3 text-gray-700">{med.frequency}</td>
                                                        <td className="py-3 text-gray-700">{med.duration}</td>
                                                        <td className="py-3 text-right pr-4 text-gray-600 italic">{med.instruction}</td>
                                                    </tr>
                                                ));
                                            } catch (e) {
                                                return (
                                                    <tr>
                                                        <td colSpan={6} className="py-3 pl-4 text-red-500">Error parsing medication data</td>
                                                    </tr>
                                                );
                                            }
                                        })()}
                                    </tbody>
                                </table>
                            </div>

                            {/* Additional Notes */}
                            {printingPrescription.notes && (
                                <div className="mb-12">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Clinical Notes / Advice</h3>
                                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-gray-800 whitespace-pre-wrap text-sm">
                                        {printingPrescription.notes}
                                    </div>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="mt-20 pt-8 border-t border-gray-200 flex justify-between items-end">
                                <div className="text-xs text-gray-500">
                                    <p>Generated on: {new Date().toLocaleString()}</p>
                                    <p className="mt-1">This is a computer generated prescription.</p>
                                </div>
                                <div className="text-center">
                                    <div className="h-12 w-48 mb-2"></div>
                                    <p className="font-bold text-gray-900 uppercase">
                                        Dr. {printingPrescription.doctor_first_name} {printingPrescription.doctor_last_name}
                                    </p>
                                    <p className="text-xs text-gray-500 border-t border-gray-300 pt-1 mt-1 inline-block px-8">Signature</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @media print {
                    @page { margin: 0; }
                    body { visibility: hidden; }
                    .print\\:fixed { position: fixed !important; }
                    .print\\:inset-0 { top: 0; left: 0; right: 0; bottom: 0; }
                    .print\\:z-\\[100\\] { z-index: 100 !important; }
                    .print\\:bg-white { background: white !important; }
                    .print\\:shadow-none { box-shadow: none !important; }
                    .print\\:w-full { width: 100% !important; }
                    .print\\:max-w-none { max-width: none !important; }
                    
                    /* Make the modal content visible */
                    .fixed.inset-0.bg-black\\/60 {
                        visibility: visible !important;
                        background: white !important;
                    }
                    /* Hide everything else */
                    body > *:not(.fixed.inset-0.bg-black\\/60) {
                        display: none !important;
                    }
                    
                    .print\\:hidden { display: none !important; }
                }
            `}</style>
        </div>
    );
}
