'use client';

import { useState } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle } from 'lucide-react';

import api from '@/lib/axios';

interface Status {
    type: 'success' | 'error';
    message: string;
    stats?: {
        added: number;
        skipped: number;
        total: number;
    };
}

export default function ImportMedicationModal({ isOpen, onClose, branchId, onSuccess }: { isOpen: boolean; onClose: () => void; branchId: number | null; onSuccess: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<Status | null>(null); // { type: 'success' | 'error', message: '', stats: {} }

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus(null);
        }
    };

    const handleUpload = async () => {
        if (!file || !branchId) return;

        setLoading(true);
        setStatus(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('branch_id', String(branchId));

        try {
            const response = await api.post('/medications/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            const data = response.data;

            if (response.status === 200) {
                setStatus({
                    type: 'success',
                    message: `Import processed! Added: ${data.stats.added}, Skipped: ${data.stats.skipped}`,
                    stats: data.stats
                });
                // Delay close to show success
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 2000);
            } else {
                setStatus({ type: 'error', message: data.message || 'Upload failed' });
            }
        } catch (err: any) {
            setStatus({ type: 'error', message: err.response?.data?.message || 'An error occurred during upload' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-xl font-semibold text-gray-800">Import Medications</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8">
                    {!status ? (
                        <div className="flex flex-col items-center gap-4">
                            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-blue-500 transition-colors bg-white">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                                        <FileSpreadsheet className="w-8 h-8" />
                                    </div>
                                    <p className="mb-2 text-sm text-gray-500">
                                        <span className="font-semibold text-gray-700">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500">Excel files only (.xlsx)</p>
                                    {file && (
                                        <div className="mt-4 px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full font-medium">
                                            {file.name}
                                        </div>
                                    )}
                                </div>
                                <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileChange} />
                            </label>

                            <button
                                onClick={handleUpload}
                                disabled={!file || loading}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5" />
                                        Upload & Import
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => {
                                    const headers = ['Medicine Name', 'Generic Name', 'Strength', 'Manufacturer', 'Dosage Form', 'Drug Class'];
                                    const sampleRow = ['Paracetamol', 'Paracetamol', '500mg', 'GSK', 'Tablet', 'Analgesic'];
                                    const csvContent = "data:text/csv;charset=utf-8,"
                                        + headers.join(",") + "\n" + sampleRow.join(",");

                                    const encodedUri = encodeURI(csvContent);
                                    const link = document.createElement("a");
                                    link.setAttribute("href", encodedUri);
                                    link.setAttribute("download", "medication_import_template.csv");
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                                className="w-full py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="text-xl">⇩</span> Download Sample Template (.csv)
                            </button>
                        </div>
                    ) : status.type === 'success' ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
                            <p className="text-gray-600 mb-6">{status.message}</p>
                            <p className="text-sm text-gray-400">Closing automatically...</p>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <X className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Import Failed</h3>
                            <p className="text-red-600 mb-6">{status.message}</p>
                            <button
                                onClick={() => setStatus(null)}
                                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
