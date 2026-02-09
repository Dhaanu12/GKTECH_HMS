'use client';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Activity, FileText } from 'lucide-react';

interface MlcModalProps {
    isOpen: boolean;
    onClose: () => void;
    mlcData: any;
    setMlcData?: (data: any) => void;
    onSave?: () => void;
    onPrint: () => void;
    onOpenWoundCert: () => void;
    isReadOnly?: boolean;
    existingMlc?: any;
}

export default function MlcModal({
    isOpen,
    onClose,
    mlcData,
    setMlcData,
    onSave,
    onPrint,
    onOpenWoundCert,
    isReadOnly = false,
    existingMlc
}: MlcModalProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!isOpen || !mounted) return null;

    const modalContent = (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all scale-100">
                <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-red-600" />
                        {existingMlc ? `MLC Certificate: ${existingMlc.mlc_number}` : (isReadOnly ? 'MLC Certificate' : 'Generate MLC Certificate')}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full">
                        <span className="text-2xl leading-none">×</span>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Police Station Name</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-600"
                                placeholder="Enter Station Name"
                                value={mlcData?.police_station || ''}
                                onChange={(e) => setMlcData && !isReadOnly && setMlcData({ ...mlcData, police_station: e.target.value })}
                                disabled={isReadOnly}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">District</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-600"
                                placeholder="Enter District"
                                value={mlcData?.police_station_district || ''}
                                onChange={(e) => setMlcData && !isReadOnly && setMlcData({ ...mlcData, police_station_district: e.target.value })}
                                disabled={isReadOnly}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Brought By</label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-600"
                            placeholder="Name of person who brought the patient"
                            value={mlcData?.brought_by || ''}
                            onChange={(e) => setMlcData && !isReadOnly && setMlcData({ ...mlcData, brought_by: e.target.value })}
                            disabled={isReadOnly}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">History (Alleged by patient/attendant)</label>
                        <textarea
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-600 min-h-[80px]"
                            rows={3}
                            placeholder="Describe the history of the incident..."
                            value={mlcData?.history_alleged || ''}
                            onChange={(e) => setMlcData && !isReadOnly && setMlcData({ ...mlcData, history_alleged: e.target.value })}
                            disabled={isReadOnly}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Brief Injury Description *</label>
                        <textarea
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-600 min-h-[80px]"
                            rows={3}
                            placeholder="Describe visible injuries..."
                            value={mlcData?.injury_description || ''}
                            onChange={(e) => setMlcData && !isReadOnly && setMlcData({ ...mlcData, injury_description: e.target.value })}
                            disabled={isReadOnly}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Opinion / Nature of Injury *</label>
                        <select
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-600"
                            value={mlcData?.nature_of_injury || 'Simple'}
                            onChange={(e) => setMlcData && !isReadOnly && setMlcData({ ...mlcData, nature_of_injury: e.target.value })}
                            disabled={isReadOnly}
                        >
                            <option value="Simple">Simple</option>
                            <option value="Grievous">Grievous</option>
                            <option value="Dangerous to Life">Dangerous to Life</option>
                        </select>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 rounded-xl font-bold transition-all"
                    >
                        Close
                    </button>

                    {(existingMlc || isReadOnly) && (
                        <button
                            onClick={onPrint}
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all"
                        >
                            <FileText className="w-4 h-4" />
                            MLC Certificate
                        </button>
                    )}

                    {!isReadOnly && onSave && (
                        <button
                            onClick={onSave}
                            className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold shadow-lg shadow-red-500/30 transition-all"
                        >
                            {existingMlc ? 'Update Details' : 'Generate Certificate'}
                        </button>
                    )}

                    <button
                        onClick={onOpenWoundCert}
                        className="px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-bold flex items-center gap-2 shadow-lg shadow-orange-500/30 transition-all"
                        title="View Wound Certificate"
                    >
                        <FileText size={18} />
                        Wound Cert
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
