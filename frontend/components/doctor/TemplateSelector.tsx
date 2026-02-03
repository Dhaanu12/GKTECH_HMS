'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, FileText, AlertTriangle, Shield, Clock, User, Pill, ChevronDown, ChevronUp, Sparkles, Search, Check, AlertCircle, Info } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

interface TemplateMedication {
    template_med_id: number;
    drug_name: string;
    drug_strength: string | null;
    dose: string | null;
    frequency: string | null;
    duration_days: number | null;
    duration_text: string | null;
    route: string;
    instructions: string | null;
    is_optional: boolean;
    contraindicated_allergies?: string[];
    age_min?: number | null;
    age_max?: number | null;
}

interface Template {
    template_id: number;
    name: string;
    diagnosis_name: string;
    description: string | null;
    specialty: string | null;
    usage_count: number;
    medications: TemplateMedication[] | null;
    safeMedications?: TemplateMedication[];
    excludedMedications?: { drug_name: string; reason: string; severity: string }[];
    warnings?: { drug: string; warning: string; severity: string }[];
    isSafe?: boolean;
}

interface PatientContext {
    name: string;
    age: number | null;
    gender: string | null;
    ageCategory: string;
    allergies: string[];
    allergyRaw: string | null;
    currentMedications: string[];
    recentDiagnoses: string[];
    liveVitals: any;
    visitCount: number;
}

interface TemplateSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyTemplate: (medications: any[]) => void;
    diagnosis: string;
    patientId: number | null;
    opdId: number | null;
}

export default function TemplateSelector({
    isOpen,
    onClose,
    onApplyTemplate,
    diagnosis,
    patientId,
    opdId
}: TemplateSelectorProps) {
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [patientContext, setPatientContext] = useState<PatientContext | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPatientContext, setShowPatientContext] = useState(true);
    const [selectedMeds, setSelectedMeds] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (isOpen && diagnosis) {
            fetchSuggestions();
        }
    }, [isOpen, diagnosis, patientId]);

    const fetchSuggestions = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            params.append('diagnosis', diagnosis);
            if (patientId) params.append('patient_id', patientId.toString());
            if (opdId) params.append('opd_id', opdId.toString());

            const response = await axios.get(`${API_URL}/templates/suggest?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setTemplates(response.data.data.templates || []);
            setPatientContext(response.data.data.patientContext);
        } catch (error) {
            console.error('Error fetching template suggestions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTemplate = (template: Template) => {
        setSelectedTemplate(template);
        // Pre-select all safe medications
        const safeMeds = template.safeMedications || template.medications || [];
        const requiredMedIds = new Set(
            safeMeds.filter((m: TemplateMedication) => !m.is_optional).map((m: TemplateMedication) => m.template_med_id)
        );
        setSelectedMeds(requiredMedIds);
    };

    const toggleMedication = (medId: number) => {
        const newSet = new Set(selectedMeds);
        if (newSet.has(medId)) {
            newSet.delete(medId);
        } else {
            newSet.add(medId);
        }
        setSelectedMeds(newSet);
    };

    const handleApply = async () => {
        if (!selectedTemplate) return;

        try {
            const token = localStorage.getItem('token');

            // Track usage
            await axios.post(`${API_URL}/templates/${selectedTemplate.template_id}/apply`, {
                patient_id: patientId,
                modifications: selectedMeds.size !== (selectedTemplate.medications?.length || 0) ? { selected: Array.from(selectedMeds) } : null
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Convert template medications to consultation medication format
            const allMeds = selectedTemplate.safeMedications || selectedTemplate.medications || [];
            const selectedMedications = allMeds.filter((med: TemplateMedication) => selectedMeds.has(med.template_med_id));

            const formattedMeds = selectedMedications.map((med: TemplateMedication) => {
                // Parse frequency to morning/noon/night
                const freqLower = (med.frequency || '').toLowerCase();
                const morning = freqLower.includes('morning') || freqLower.includes('mor') || freqLower.includes('twice') || freqLower.includes('thrice') || freqLower.includes('3 times') || freqLower.includes('before breakfast');
                const noon = freqLower.includes('noon') || freqLower.includes('thrice') || freqLower.includes('3 times');
                const night = freqLower.includes('night') || freqLower.includes('bedtime') || freqLower.includes('twice') || freqLower.includes('thrice') || freqLower.includes('3 times') || freqLower.includes('daily');

                return {
                    name: med.drug_name,
                    dosage: med.drug_strength || med.dose || '',
                    frequency: med.frequency || '',
                    duration: med.duration_text || (med.duration_days ? `${med.duration_days} days` : ''),
                    morning: morning || freqLower.includes('once'),
                    noon: noon,
                    night: night || freqLower.includes('once'),
                    food_timing: med.instructions?.toLowerCase().includes('before food') ? 'Before Food' : 'After Food'
                };
            });

            onApplyTemplate(formattedMeds);
            onClose();
        } catch (error) {
            console.error('Error applying template:', error);
        }
    };

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.diagnosis_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            Smart Template Suggestions
                        </h2>
                        <p className="text-purple-200 text-sm mt-0.5">
                            Based on: <span className="font-semibold text-white">{diagnosis || 'Enter diagnosis'}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex">
                    {/* Left Panel - Templates List */}
                    <div className="w-1/2 border-r border-gray-100 flex flex-col">
                        {/* Search */}
                        <div className="p-4 border-b border-gray-100">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search templates..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Patient Context (Collapsible) */}
                        {patientContext && (
                            <div className="border-b border-gray-100">
                                <button
                                    onClick={() => setShowPatientContext(!showPatientContext)}
                                    className="w-full px-4 py-2 flex items-center justify-between text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    <span className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-purple-500" />
                                        Patient Context
                                    </span>
                                    {showPatientContext ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                                {showPatientContext && (
                                    <div className="px-4 pb-3 space-y-2">
                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                            <div className="bg-blue-50 px-2 py-1 rounded">
                                                <span className="text-blue-600 font-semibold">{patientContext.age || 'N/A'}</span>
                                                <span className="text-blue-400"> yrs</span>
                                            </div>
                                            <div className="bg-purple-50 px-2 py-1 rounded text-purple-600 font-semibold">
                                                {patientContext.gender || 'N/A'}
                                            </div>
                                            <div className="bg-green-50 px-2 py-1 rounded text-green-600 font-semibold">
                                                {patientContext.visitCount} visits
                                            </div>
                                        </div>
                                        {patientContext.allergies.length > 0 && (
                                            <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                                <div className="flex items-center gap-1 text-red-600 text-xs font-bold mb-1">
                                                    <AlertTriangle className="w-3 h-3" /> ALLERGIES
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {patientContext.allergies.map((allergy, i) => (
                                                        <span key={i} className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                                            {allergy}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {patientContext.currentMedications.length > 0 && (
                                            <div className="text-xs text-gray-500">
                                                <span className="font-semibold text-gray-700">Current Meds:</span> {patientContext.currentMedications.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Templates List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {loading ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                </div>
                            ) : filteredTemplates.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                    <p className="text-sm">No templates found for this diagnosis</p>
                                </div>
                            ) : (
                                filteredTemplates.map((template) => (
                                    <button
                                        key={template.template_id}
                                        onClick={() => handleSelectTemplate(template)}
                                        className={`w-full text-left p-3 rounded-xl border transition ${selectedTemplate?.template_id === template.template_id
                                                ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500/20'
                                                : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-gray-800">{template.name}</h4>
                                                    {template.isSafe === false && (
                                                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded font-bold flex items-center gap-0.5">
                                                            <AlertCircle className="w-3 h-3" /> WARNINGS
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500">{template.diagnosis_name}</p>
                                            </div>
                                            {template.usage_count > 0 && (
                                                <span className="text-xs text-purple-600 font-semibold bg-purple-100 px-2 py-0.5 rounded-full">
                                                    Used {template.usage_count}x
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-2 text-xs">
                                            <span className="flex items-center gap-1 text-gray-500">
                                                <Pill className="w-3 h-3" />
                                                {(template.safeMedications || template.medications)?.length || 0} medications
                                            </span>
                                            {template.excludedMedications && template.excludedMedications.length > 0 && (
                                                <span className="flex items-center gap-1 text-red-500 font-medium">
                                                    <Shield className="w-3 h-3" />
                                                    {template.excludedMedications.length} excluded
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Template Details */}
                    <div className="w-1/2 flex flex-col bg-gray-50">
                        {selectedTemplate ? (
                            <>
                                <div className="p-4 bg-white border-b border-gray-100">
                                    <h3 className="font-bold text-lg text-gray-800">{selectedTemplate.name}</h3>
                                    <p className="text-sm text-gray-500">{selectedTemplate.description || selectedTemplate.diagnosis_name}</p>
                                </div>

                                {/* Excluded Medications Warning */}
                                {selectedTemplate.excludedMedications && selectedTemplate.excludedMedications.length > 0 && (
                                    <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                                        <div className="flex items-center gap-2 text-red-700 font-bold text-sm mb-2">
                                            <AlertTriangle className="w-4 h-4" />
                                            Excluded Due to Patient Allergies
                                        </div>
                                        {selectedTemplate.excludedMedications.map((med, i) => (
                                            <div key={i} className="text-xs text-red-600 flex items-center gap-2 py-1">
                                                <X className="w-3 h-3" />
                                                <span className="font-semibold">{med.drug_name}</span>
                                                <span className="text-red-400">— {med.reason}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Warnings */}
                                {selectedTemplate.warnings && selectedTemplate.warnings.length > 0 && (
                                    <div className="mx-4 mb-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                        <div className="flex items-center gap-2 text-amber-700 font-bold text-sm mb-1">
                                            <Info className="w-4 h-4" />
                                            Age/Dosing Warnings
                                        </div>
                                        {selectedTemplate.warnings.map((warning, i) => (
                                            <p key={i} className="text-xs text-amber-600">
                                                {warning.drug}: {warning.warning}
                                            </p>
                                        ))}
                                    </div>
                                )}

                                {/* Medications List */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Select Medications to Apply</p>
                                    {(selectedTemplate.safeMedications || selectedTemplate.medications || []).map((med: TemplateMedication) => (
                                        <label
                                            key={med.template_med_id}
                                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${selectedMeds.has(med.template_med_id)
                                                    ? 'bg-purple-50 border-purple-300'
                                                    : 'bg-white border-gray-200 hover:border-purple-200'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedMeds.has(med.template_med_id)}
                                                onChange={() => toggleMedication(med.template_med_id)}
                                                className="mt-1 rounded text-purple-600 focus:ring-purple-500"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-800">{med.drug_name}</span>
                                                    {med.drug_strength && (
                                                        <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                                            {med.drug_strength}
                                                        </span>
                                                    )}
                                                    {med.is_optional && (
                                                        <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                                                            Optional
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {[
                                                        med.dose && `${med.dose}`,
                                                        med.frequency,
                                                        med.duration_text || (med.duration_days && `${med.duration_days} days`)
                                                    ].filter(Boolean).join(' • ')}
                                                </div>
                                                {med.instructions && (
                                                    <p className="text-xs text-gray-400 italic mt-0.5">{med.instructions}</p>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                {/* Apply Button */}
                                <div className="p-4 bg-white border-t border-gray-100">
                                    <button
                                        onClick={handleApply}
                                        disabled={selectedMeds.size === 0}
                                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Check className="w-5 h-5" />
                                        Apply {selectedMeds.size} Medications
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-400">
                                <div className="text-center">
                                    <FileText className="w-16 h-16 mx-auto mb-3 text-gray-200" />
                                    <p className="font-medium">Select a template to preview</p>
                                    <p className="text-sm">Medications will be shown here</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
