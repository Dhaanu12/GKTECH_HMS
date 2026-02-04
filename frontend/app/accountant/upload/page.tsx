'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Loader2, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import SearchableSelect from '@/components/ui/SearchableSelect';

export default function UploadPage() {
    const { user } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [uploadStats, setUploadStats] = useState<{ count: number } | null>(null);

    useEffect(() => {
        if (user) {
            fetchBranches();
        }
    }, [user]);

    const fetchBranches = async () => {
        try {
            const token = localStorage.getItem('token');
            // User requested to simply take hospital_id and fetch branches.
            // We can get hospital_id from the user context (which is hydrated from localStorage).

            if (user?.hospital_id) {
                const res = await axios.get(`http://localhost:5000/api/branches/hospital/${user.hospital_id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setBranches(res.data.data.branches || []);
            } else {
                console.warn('No hospital_id found in user context');
                // Optional: Fallback to all branches if no hospital_id (though likely not desired for strict multi-tenancy)
                // or just leave empty.
            }
        } catch (error) {
            console.error("Error fetching branches", error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setMessage(null);
            setUploadStats(null);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setMessage({ type: 'error', text: 'Please select a file to upload.' });
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        if (selectedBranch) {
            formData.append('branch_id', selectedBranch);
            // Assuming hospital_id is in user object, otherwise try to find it from branch list if available
            // but the branch list item likely has hospital_id.
            const branch = branches.find((b: any) => b.branch_id === selectedBranch);
            // If branch has hospital_id use it, else use user's hospital_id
            const hid = (branch as any)?.hospital_id || user?.hospital_id;
            if (hid) formData.append('hospital_id', String(hid));
        }

        setLoading(true);
        setMessage(null);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/accountant/upload-claims', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.status === 'success') {
                setMessage({ type: 'success', text: 'File uploaded and processed successfully!' });
                setUploadStats({ count: response.data.count });
                setFile(null);
                // Reset file input
                const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            }
        } catch (err: any) {
            console.error(err);
            setMessage({
                type: 'error',
                text: err.response?.data?.message || 'Failed to upload file. Please check the format and try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Upload Insurance Claims</h1>
                <p className="mt-1 text-sm text-gray-500">Upload CSV or Excel files to bulk import claims data.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <form onSubmit={handleUpload} className="space-y-6">

                    <div className="w-full">
                        <div className="mb-4">
                            <SearchableSelect
                                label="Select Branch *"
                                options={branches.map((b: any) => ({
                                    value: b.branch_id,
                                    label: b.branch_name,
                                    code: b.branch_code
                                }))}
                                value={selectedBranch}
                                onChange={setSelectedBranch}
                                placeholder="Select branch for this upload"
                            />
                        </div>

                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select File
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:bg-gray-50 transition-colors cursor-pointer relative">
                            <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                accept=".csv, .xlsx, .xls"
                                onChange={handleFileChange}
                            />
                            <div className="space-y-1 text-center pointer-events-none">
                                {file ? (
                                    <div className="flex flex-col items-center">
                                        <FileText className="mx-auto h-12 w-12 text-blue-500" />
                                        <p className="mt-2 text-sm text-gray-900 font-medium">{file.name}</p>
                                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        <div className="flex text-sm text-gray-600 justify-center">
                                            <span className="font-medium text-blue-600 hover:text-blue-500">
                                                Upload a file
                                            </span>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            CSV, XLS, XLSX up to 10MB
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-xl flex items-start gap-3 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            {message.type === 'success' ? (
                                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            ) : (
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            )}
                            <span>{message.text}</span>
                        </div>
                    )}

                    {uploadStats && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-sm text-center">
                            Successfully processed <strong>{uploadStats.count}</strong> records.
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading || !file || !selectedBranch}
                            className="inline-flex justify-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                'Upload and Process'
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-semibold text-blue-800">Expected File Format</h4>
                    <a
                        href="/sample_claims.xlsx"
                        download
                        className="flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-900 transition-colors bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm"
                    >
                        <Upload className="w-3 h-3 rotate-180" />
                        Download Sample CSV
                    </a>
                </div>
                <p className="text-xs text-blue-600 mb-2">The file should contain headers matching these fields (case-insensitive):</p>
                <div className="flex flex-wrap gap-2 text-xs text-blue-700 font-mono">
                    <span className="bg-white px-2 py-1 rounded border border-blue-100">S.NO</span>
                    <span className="bg-white px-2 py-1 rounded border border-blue-100">IP NO</span>
                    <span className="bg-white px-2 py-1 rounded border border-blue-100">PATIENT NAME</span>
                    <span className="bg-white px-2 py-1 rounded border border-blue-100">DR NAME</span>
                    <span className="bg-white px-2 py-1 rounded border border-blue-100">APPROVAL NO</span>
                    <span className="bg-white px-2 py-1 rounded border border-blue-100">FROM DATE ADMISSION</span>
                    <span className="bg-white px-2 py-1 rounded border border-blue-100">TO DATE DISCHARGE</span>
                    <span className="bg-white px-2 py-1 rounded border border-blue-100">DEPT</span>
                    <span className="bg-white px-2 py-1 rounded border border-blue-100">INSURANCE NAME</span>
                    <span className="bg-white px-2 py-1 rounded border border-blue-100">BILL AMOUNT</span>
                    <span className="bg-white px-2 py-1 rounded border border-blue-100">PENDING AMOUNT</span>
                    <span className="bg-white px-2 py-1 rounded border border-blue-100">...</span>
                </div>
            </div>
        </div>
    );
}
