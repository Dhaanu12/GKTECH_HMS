'use client';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileText } from 'lucide-react';

interface WoundCertModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any;
    setData?: (data: any) => void;
    onSave?: () => void;
    onPrint: () => void;
    isReadOnly?: boolean;
}

export default function WoundCertModal({
    isOpen,
    onClose,
    data,
    setData,
    onSave,
    onPrint,
    isReadOnly = false
}: WoundCertModalProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!isOpen || !mounted) return null;

    const modalContent = (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all scale-100">
                <div className="p-6 border-b border-gray-200 bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-900">Wound Certificate Details</h2>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Date & Time of Incident</label>
                            <input
                                type="datetime-local"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-600"
                                value={data?.incident_date_time || ''}
                                onChange={(e) => setData && !isReadOnly && setData({ ...data, incident_date_time: e.target.value })}
                                disabled={isReadOnly}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Alleged Cause / Weapon</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-600"
                                value={data?.alleged_cause || ''}
                                onChange={(e) => setData && !isReadOnly && setData({ ...data, alleged_cause: e.target.value })}
                                disabled={isReadOnly}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">History (As alleged) / Clinical History</label>
                        <textarea
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 h-24 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-600"
                            value={data?.history_alleged || ''}
                            onChange={(e) => setData && !isReadOnly && setData({ ...data, history_alleged: e.target.value })}
                            disabled={isReadOnly}
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Examination Findings</label>
                        <textarea
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 h-24 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-600"
                            value={data?.examination_findings || ''}
                            onChange={(e) => setData && !isReadOnly && setData({ ...data, examination_findings: e.target.value })}
                            disabled={isReadOnly}
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Nature of Injury</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-600"
                                value={data?.nature_of_injury || 'Simple'}
                                onChange={(e) => setData && !isReadOnly && setData({ ...data, nature_of_injury: e.target.value })}
                                disabled={isReadOnly}
                            >
                                <option value="Simple">Simple</option>
                                <option value="Grievous">Grievous</option>
                                <option value="Dangerous to Life">Dangerous to Life</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Danger to Life</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-600"
                                value={data?.danger_to_life || 'No'}
                                onChange={(e) => setData && !isReadOnly && setData({ ...data, danger_to_life: e.target.value })}
                                disabled={isReadOnly}
                            >
                                <option value="No">No</option>
                                <option value="Yes">Yes</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Age of Injuries</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-600"
                                placeholder="e.g. < 6 hours"
                                value={data?.age_of_injuries || ''}
                                onChange={(e) => setData && !isReadOnly && setData({ ...data, age_of_injuries: e.target.value })}
                                disabled={isReadOnly}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Remarks</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-600"
                                value={data?.remarks || ''}
                                onChange={(e) => setData && !isReadOnly && setData({ ...data, remarks: e.target.value })}
                                disabled={isReadOnly}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Treatment Given</label>
                        <textarea
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 h-16 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-600"
                            value={data?.treatment_given || ''}
                            onChange={(e) => setData && !isReadOnly && setData({ ...data, treatment_given: e.target.value })}
                            disabled={isReadOnly}
                        ></textarea>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 rounded-xl font-bold transition-all"
                    >
                        Close
                    </button>
                    {(data || isReadOnly) && (
                        <button
                            onClick={onPrint}
                            className="px-5 py-2.5 bg-gray-700 text-white rounded-xl hover:bg-gray-800 font-bold flex items-center gap-2 shadow-lg shadow-gray-500/30 transition-all"
                        >
                            <FileText className="w-4 h-4" />
                            Print Certificate
                        </button>
                    )}
                    {!isReadOnly && onSave && (
                        <button
                            onClick={onSave}
                            className="px-6 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-bold shadow-lg shadow-orange-500/30 transition-all"
                        >
                            Save Details
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
