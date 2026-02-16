'use client';

import { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

import api from '@/lib/axios';

export default function AddNewMedicationModal({ isOpen, onClose, branchId, onSuccess }: { isOpen: boolean; onClose: () => void; branchId: number | null; onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        medicine_name: '',
        generic_name: '',
        strength: '',
        manufacturer_name: '',
        dosage_form: 'Tablet',
        prescription_required: false,
        is_global: false,
        frequency: '',
        duration: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [addToAllBranches, setAddToAllBranches] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!branchId && !addToAllBranches) return;

        setLoading(true);
        setError('');

        try {
            await api.post('/medications/custom', {
                ...formData,
                branch_id: branchId,
                add_to_all_branches: addToAllBranches,
                hospital_id: 1 // Managed by backend from token usually, but just in case
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error creating medication:', err);
            setError(err.response?.data?.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-xl font-semibold text-gray-800">Add New Custom Medication</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Medicine Name *</label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                placeholder="e.g. Dolo 650"
                                value={formData.medicine_name}
                                onChange={(e) => setFormData({ ...formData, medicine_name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Generic Name</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                placeholder="e.g. Paracetamol"
                                value={formData.generic_name}
                                onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Strength *</label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                placeholder="e.g. 650mg"
                                value={formData.strength}
                                onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.frequency}
                                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="addToAll"
                                checked={addToAllBranches}
                                onChange={(e) => setAddToAllBranches(e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="addToAll" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
                                Add this medication to <strong>ALL</strong> my branches
                            </label>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Dosage Form</label>
                            <select
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                value={formData.dosage_form}
                                onChange={(e) => setFormData({ ...formData, dosage_form: e.target.value })}
                            >
                                <option>Tablet</option>
                                <option>Capsule</option>
                                <option>Syrup</option>
                                <option>Injection</option>
                                <option>Ointment</option>
                                <option>Drops</option>
                                <option>Suspension</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Manufacturer</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                placeholder="e.g. Micro Labs"
                                value={formData.manufacturer_name}
                                onChange={(e) => setFormData({ ...formData, manufacturer_name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="presc_req"
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    checked={formData.prescription_required}
                                    onChange={(e) => setFormData({ ...formData, prescription_required: e.target.checked })}
                                />
                                <label htmlFor="presc_req" className="text-sm text-gray-700">Prescription Required</label>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Medication
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
