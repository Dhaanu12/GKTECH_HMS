'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Activity, Heart, Thermometer, Weight, Ruler, Wind, Droplets, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const Loader2 = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

export default function RecordVitalsPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const opdId = searchParams.get('opd_id');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [patient, setPatient] = useState<any>(null);
    const [opdVisit, setOpdVisit] = useState<any>(null);
    const [hasExistingVitals, setHasExistingVitals] = useState(false);

    // Notification State
    const [notification, setNotification] = useState<{
        show: boolean;
        type: 'success' | 'error';
        message: string;
    }>({ show: false, type: 'success', message: '' });

    const [vitals, setVitals] = useState({
        grbs: '',
        spo2: '',
        pulse: '',
        temperature: '',
        weight: '',
        height: '',
        bp_systolic: '',
        bp_diastolic: ''
    });

    useEffect(() => {
        fetchData();
    }, [params.id, opdId]);

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ show: true, type, message });
        // Auto-hide success messages, keep errors longer
        if (type === 'success') {
            setTimeout(() => {
                setNotification(prev => ({ ...prev, show: false }));
                router.back();
            }, 2000);
        } else {
            setTimeout(() => {
                setNotification(prev => ({ ...prev, show: false }));
            }, 5000);
        }
    };

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');

            if (!opdId) {
                showNotification('error', 'No OPD visit ID provided');
                setTimeout(() => router.back(), 2000);
                return;
            }

            const [patientRes, opdRes] = await Promise.all([
                axios.get(`${API_URL}/patients/${params.id}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/opd/${opdId}`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            setPatient(patientRes.data.data.patient);

            // Handle different response structures
            let opd = opdRes.data.data?.opdVisit ||
                opdRes.data.data?.opdEntry ||
                opdRes.data.data?.opd ||
                opdRes.data.data ||
                opdRes.data;
            setOpdVisit(opd);

            // Check if vitals are in a nested vital_signs object
            let vitalsSource = opd;
            if (opd?.vital_signs && typeof opd.vital_signs === 'object') {
                vitalsSource = opd.vital_signs;
            } else if (opd?.opdEntry?.vital_signs && typeof opd.opdEntry.vital_signs === 'object') {
                vitalsSource = opd.opdEntry.vital_signs;
            }

            // Check if any vitals exist
            const vitalsExist = !!(vitalsSource?.grbs || vitalsSource?.spo2 || vitalsSource?.pulse || vitalsSource?.temperature ||
                vitalsSource?.bp_systolic || vitalsSource?.bp_diastolic || vitalsSource?.height || vitalsSource?.weight);

            setHasExistingVitals(vitalsExist);

            // Pre-fill existing vitals if any
            const vitalData = {
                grbs: vitalsSource?.grbs || '',
                spo2: vitalsSource?.spo2 || '',
                pulse: vitalsSource?.pulse || '',
                height: vitalsSource?.height || '',
                weight: vitalsSource?.weight || '',
                bp_systolic: vitalsSource?.bp_systolic || '',
                bp_diastolic: vitalsSource?.bp_diastolic || '',
                temperature: vitalsSource?.temperature || ''
            };

            setVitals(vitalData);
        } catch (error: any) {
            console.error('Error fetching data:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
            showNotification('error', `Failed to load data: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            // Map frontend field names to backend API field names
            const vitalsData = {
                patient_id: params.id,
                opd_id: opdId,
                blood_glucose: vitals.grbs || null,
                spo2: vitals.spo2 || null,
                pulse_rate: vitals.pulse || null,
                temperature: vitals.temperature || null,
                blood_pressure_systolic: vitals.bp_systolic || null,
                blood_pressure_diastolic: vitals.bp_diastolic || null,
                height: vitals.height || null,
                weight: vitals.weight || null,
                recorded_by: user.user_id
            };

            await axios.post(
                `${API_URL}/vitals`,
                vitalsData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const message = hasExistingVitals ? 'Vitals updated successfully!' : 'Vitals saved successfully!';
            showNotification('success', message);
        } catch (error: any) {
            console.error('Error saving vitals:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
            showNotification('error', `Failed to save vitals: ${errorMessage} ${error.response?.data?.debug ? JSON.stringify(error.response.data.debug) : ''}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
                    <p className="text-slate-500 font-medium">Loading patient vitals...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20 relative">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-4 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">
                            {hasExistingVitals ? 'Update Vital Signs' : 'Record Vital Signs'}
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">
                            {patient?.first_name} {patient?.last_name} • MRN: {patient?.mrn_number}
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 pt-8">
                {/* Introduction Card */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100 mb-8 flex items-start gap-4 shadow-sm">
                    <div className="p-3 bg-emerald-100 rounded-xl shadow-inner">
                        <Activity className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-emerald-900">Vital Signs</h2>
                        <p className="text-emerald-700 leading-relaxed max-w-2xl">
                            {hasExistingVitals
                                ? 'Update the patient vitals below. All changes will be recorded in the patient history.'
                                : 'Enter current patient vitals. Valid ranges are checked automatically.'}
                        </p>
                    </div>
                </div>

                {/* Vitals Form Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* GRBS */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all duration-300 group">
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <Droplets className="w-4 h-4 text-rose-500" />
                            GRBS (mg/dL)
                        </label>
                        <input
                            type="number"
                            value={vitals.grbs}
                            onChange={(e) => setVitals({ ...vitals, grbs: e.target.value })}
                            placeholder="e.g., 110"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white font-medium text-slate-900 placeholder:text-slate-400 group-hover:bg-emerald-50/30"
                        />
                    </div>

                    {/* SpO2 */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all duration-300 group">
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <Wind className="w-4 h-4 text-sky-500" />
                            SpO2 (%)
                        </label>
                        <input
                            type="number"
                            value={vitals.spo2}
                            onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                            placeholder="e.g., 98"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white font-medium text-slate-900 placeholder:text-slate-400 group-hover:bg-emerald-50/30"
                        />
                    </div>

                    {/* Pulse */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all duration-300 group">
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <Heart className="w-4 h-4 text-rose-500" />
                            Pulse (bpm)
                        </label>
                        <input
                            type="number"
                            value={vitals.pulse}
                            onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                            placeholder="e.g., 72"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white font-medium text-slate-900 placeholder:text-slate-400 group-hover:bg-emerald-50/30"
                        />
                    </div>

                    {/* Temperature */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all duration-300 group">
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <Thermometer className="w-4 h-4 text-orange-500" />
                            Temperature (°F)
                        </label>
                        <input
                            type="number"
                            value={vitals.temperature}
                            onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                            placeholder="e.g., 98.6"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white font-medium text-slate-900 placeholder:text-slate-400 group-hover:bg-emerald-50/30"
                        />
                    </div>

                    {/* BP Systolic */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all duration-300 group">
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-indigo-500" />
                            BP Systolic (mmHg)
                        </label>
                        <input
                            type="number"
                            value={vitals.bp_systolic}
                            onChange={(e) => setVitals({ ...vitals, bp_systolic: e.target.value })}
                            placeholder="e.g., 120"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white font-medium text-slate-900 placeholder:text-slate-400 group-hover:bg-emerald-50/30"
                        />
                    </div>

                    {/* BP Diastolic */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all duration-300 group">
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-purple-500" />
                            BP Diastolic (mmHg)
                        </label>
                        <input
                            type="number"
                            value={vitals.bp_diastolic}
                            onChange={(e) => setVitals({ ...vitals, bp_diastolic: e.target.value })}
                            placeholder="e.g., 80"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white font-medium text-slate-900 placeholder:text-slate-400 group-hover:bg-emerald-50/30"
                        />
                    </div>

                    {/* Height */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all duration-300 group">
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <Ruler className="w-4 h-4 text-teal-500" />
                            Height (cm)
                        </label>
                        <input
                            type="number"
                            value={vitals.height}
                            onChange={(e) => setVitals({ ...vitals, height: e.target.value })}
                            placeholder="e.g., 170"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white font-medium text-slate-900 placeholder:text-slate-400 group-hover:bg-emerald-50/30"
                        />
                    </div>

                    {/* Weight */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all duration-300 group">
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <Weight className="w-4 h-4 text-emerald-500" />
                            Weight (kg)
                        </label>
                        <input
                            type="number"
                            value={vitals.weight}
                            onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                            placeholder="e.g., 70"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white font-medium text-slate-900 placeholder:text-slate-400 group-hover:bg-emerald-50/30"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 mt-8 pt-6 border-t border-slate-200">
                    <button
                        onClick={() => router.back()}
                        className="flex-1 px-6 py-4 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-all active:scale-[0.98]"
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                {hasExistingVitals ? 'Update Vitals' : 'Save Vitals'}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Premium Toast Notification */}
            <AnimatePresence>
                {notification.show && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-none"
                    >
                        <div className={`
                            pointer-events-auto flex items-start gap-4 p-4 rounded-2xl shadow-2xl border backdrop-blur-xl
                            ${notification.type === 'success'
                                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                                : 'bg-rose-50/90 border-rose-200 text-rose-900'}
                        `}>
                            <div className={`p-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                {notification.type === 'success' ? (
                                    <CheckCircle className="w-6 h-6" />
                                ) : (
                                    <AlertCircle className="w-6 h-6" />
                                )}
                            </div>
                            <div className="flex-1 pt-1">
                                <h3 className="font-bold text-lg mb-1">
                                    {notification.type === 'success' ? 'Success' : 'Error'}
                                </h3>
                                <p className="text-sm font-medium opacity-90 leading-relaxed">
                                    {notification.message}
                                </p>
                            </div>
                            <button
                                onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                                className={`p-1 rounded-lg hover:bg-black/5 transition-colors ${notification.type === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
