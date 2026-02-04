'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Activity, Save, Loader2 } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function RecordVitals() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const opdId = searchParams.get('opd_id');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [patient, setPatient] = useState<any>(null);
    const [opdVisit, setOpdVisit] = useState<any>(null);

    const [vitals, setVitals] = useState({
        grbs: '',
        spo2: '',
        pulse: '',
        height: '',
        weight: '',
        bp_systolic: '',
        bp_diastolic: '',
        temperature: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [patientRes, opdRes] = await Promise.all([
                axios.get(`${API_URL}/patients/${params.id}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/opd/${opdId}`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            setPatient(patientRes.data.data.patient);
            const opd = opdRes.data.data.opdVisit;
            setOpdVisit(opd);

            // Pre-fill existing vitals if any
            setVitals({
                grbs: opd.grbs || '',
                spo2: opd.spo2 || '',
                pulse: opd.pulse || '',
                height: opd.height || '',
                weight: opd.weight || '',
                bp_systolic: opd.bp_systolic || '',
                bp_diastolic: opd.bp_diastolic || '',
                temperature: opd.temperature || ''
            });
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Failed to load patient data');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.patch(
                `${API_URL}/opd/${opdId}`,
                vitals,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert('Vitals saved successfully!');
            router.back();
        } catch (error) {
            console.error('Error saving vitals:', error);
            alert('Failed to save vitals');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-white/60 rounded-lg transition"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Record Vital Signs</h1>
                        <p className="text-sm text-slate-500">
                            {patient?.first_name} {patient?.last_name} • MRN: {patient?.mrn_number}
                        </p>
                    </div>
                </div>

                {/* Vitals Form */}
                <div className="glass-panel p-8 rounded-3xl border border-white/60 bg-white/40 shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <Activity className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Vital Signs</h2>
                            <p className="text-sm text-slate-500">Enter or update patient vitals</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* GRBS */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                GRBS (mg/dL)
                            </label>
                            <input
                                type="number"
                                value={vitals.grbs}
                                onChange={(e) => setVitals({ ...vitals, grbs: e.target.value })}
                                placeholder="e.g., 110"
                                className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                            />
                        </div>

                        {/* SpO2 */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                SpO2 (%)
                            </label>
                            <input
                                type="number"
                                value={vitals.spo2}
                                onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                                placeholder="e.g., 98"
                                className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                            />
                        </div>

                        {/* Pulse */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Pulse (bpm)
                            </label>
                            <input
                                type="number"
                                value={vitals.pulse}
                                onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                                placeholder="e.g., 72"
                                className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                            />
                        </div>

                        {/* Temperature */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Temperature (°F)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={vitals.temperature}
                                onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                                placeholder="e.g., 98.6"
                                className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                            />
                        </div>

                        {/* BP Systolic */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                BP Systolic (mmHg)
                            </label>
                            <input
                                type="number"
                                value={vitals.bp_systolic}
                                onChange={(e) => setVitals({ ...vitals, bp_systolic: e.target.value })}
                                placeholder="e.g., 120"
                                className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                            />
                        </div>

                        {/* BP Diastolic */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                BP Diastolic (mmHg)
                            </label>
                            <input
                                type="number"
                                value={vitals.bp_diastolic}
                                onChange={(e) => setVitals({ ...vitals, bp_diastolic: e.target.value })}
                                placeholder="e.g., 80"
                                className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                            />
                        </div>

                        {/* Height */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Height (cm)
                            </label>
                            <input
                                type="number"
                                value={vitals.height}
                                onChange={(e) => setVitals({ ...vitals, height: e.target.value })}
                                placeholder="e.g., 170"
                                className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                            />
                        </div>

                        {/* Weight */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Weight (kg)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={vitals.weight}
                                onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                                placeholder="e.g., 70"
                                className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 mt-8 pt-6 border-t border-slate-200">
                        <button
                            onClick={() => router.back()}
                            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Save Vitals
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
