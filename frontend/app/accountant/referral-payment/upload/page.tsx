'use client';

import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/lib/AuthContext';
import { FileUp, Download, FileSpreadsheet, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function ReferralPaymentUpload() {
    const { user } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [uploadStats, setUploadStats] = useState<{ batchId: number, count: number, skipped: number, skippedDetails?: string[], amount: number } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setMessage(null);
            setUploadStats(null);
        }
    };

    const downloadTemplate = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/referral-payment/template', {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob', // Important for file download
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Referral_Payment_Template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (error) {
            console.error('Download error:', error);
            setMessage({ type: 'error', text: 'Failed to download template.' });
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        setMessage(null);
        setUploadStats(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('/api/referral-payment/upload', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                setMessage({ type: 'success', text: 'File uploaded and processed successfully!' });
                setUploadStats({
                    batchId: response.data.batch_id,
                    count: response.data.total_records,
                    skipped: response.data.skipped_records || 0,
                    skippedDetails: response.data.skipped_details || [],
                    amount: response.data.total_amount
                });
                setFile(null); // Reset file input
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to upload file. Please check format.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Referral Payment Upload</h1>
                <p className="text-gray-600">Upload bulk referral bills via Excel</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upload Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-800">Upload Bill Data</h2>
                        <button
                            onClick={downloadTemplate}
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium px-4 py-2 bg-blue-50 rounded-lg transition"
                        >
                            <Download className="w-4 h-4" />
                            Download Template
                        </button>
                    </div>

                    <form onSubmit={handleUpload} className="space-y-6">
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-500 transition-colors bg-gray-50/50">
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="flex flex-col items-center justify-center cursor-pointer"
                            >
                                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                                    <FileSpreadsheet className={`w-8 h-8 ${file ? 'text-blue-600' : 'text-gray-400'}`} />
                                </div>
                                {file ? (
                                    <div className="text-center">
                                        <p className="text-blue-600 font-semibold text-lg">{file.name}</p>
                                        <p className="text-gray-500 text-sm mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <p className="text-gray-900 font-medium text-lg">Click to select file</p>
                                        <p className="text-gray-500 text-sm mt-1">Accepts .xlsx files only</p>
                                    </div>
                                )}
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={!file || loading}
                            className="w-full flex items-center justify-center py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-[0.98]"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : (
                                <FileUp className="w-5 h-5 mr-2" />
                            )}
                            {loading ? 'Processing...' : 'Upload & Process'}
                        </button>
                    </form>

                    {message && (
                        <div className={`mt-6 p-4 rounded-lg flex items-start gap-3 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {message.type === 'success' ? (
                                <CheckCircle className="w-5 h-5 shrink-0" />
                            ) : (
                                <AlertCircle className="w-5 h-5 shrink-0" />
                            )}
                            <span>{message.text}</span>
                        </div>
                    )}
                </div>

                {/* Instructions / Stats Card */}
                <div className="space-y-6">
                    {uploadStats && (
                        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg p-8 text-white">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <CheckCircle className="w-6 h-6" />
                                Processing Complete
                            </h3>
                            <div className="space-y-4">
                                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                    <p className="text-blue-100 text-sm">Batch ID</p>
                                    <p className="text-2xl font-mono font-bold">#{uploadStats.batchId}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                        <p className="text-blue-100 text-sm">Records Processed</p>
                                        <p className="text-2xl font-bold">{uploadStats.count}</p>
                                    </div>
                                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                        <p className="text-blue-100 text-sm">Skipped Records</p>
                                        <p className="text-2xl font-bold text-yellow-300">{uploadStats.skipped}</p>
                                    </div>
                                    <div className="col-span-2 bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                        <p className="text-blue-100 text-sm">Total Amount</p>
                                        <p className="text-2xl font-bold">₹{uploadStats.amount.toLocaleString()}</p>
                                    </div>
                                </div>

                                {uploadStats.skipped > 0 && uploadStats.skippedDetails && uploadStats.skippedDetails.length > 0 && (
                                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm mt-4 border border-yellow-500/30">
                                        <p className="text-yellow-300 text-sm font-bold mb-2 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            Skipped Records Details
                                        </p>
                                        <div className="max-h-40 overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                                            {uploadStats.skippedDetails.map((detail, idx) => (
                                                <p key={idx} className="text-xs text-blue-100 font-mono bg-white/5 p-1.5 rounded border border-white/5">
                                                    {detail}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <p className="text-sm text-blue-200 mt-4 leading-relaxed">
                                    The uploaded data has been successfully saved to the database. You can now view detailed reports in the Reports section.
                                </p>
                            </div>
                        </div>
                    )}

                    {!uploadStats && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                            <h3 className="font-semibold text-gray-900 mb-4">Instructions</h3>
                            <ul className="space-y-3 text-sm text-gray-600">
                                <li className="flex gap-2">
                                    <span className="bg-blue-100 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                                    <span>Download the template to get the correct column structure.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="bg-blue-100 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                                    <span>Fill in the required fields: <b>Patient Name</b>, <b>Doctor Name</b>, <b>MCI ID</b> (Crucial for mapping).</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="bg-blue-100 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                                    <span>Enter '1' or 'Yes' under the service columns for services availed.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="bg-blue-100 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</span>
                                    <span>Upload the file. The system will automatically calculate referral amounts based on configured percentages.</span>
                                </li>
                            </ul>

                            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                                <h4 className="text-amber-800 font-semibold mb-1 text-sm">Important Note</h4>
                                <p className="text-amber-700 text-xs">
                                    Ensure that Referral Doctors have their Service Percentages configured in the system. If no configuration is found, the referral amount will default to 0.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
