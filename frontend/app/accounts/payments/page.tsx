'use client';

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '@/lib/AuthContext';
import {
    Download, Search, Filter, Loader2, IndianRupee,
    FileText, User, ChevronRight, ChevronDown, PieChart as PieChartIcon,
    BarChart3, Activity, TrendingUp, Users, ArrowUpRight, FileUp,
    FileSpreadsheet, CheckCircle, AlertCircle, Upload, X
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, Tooltip as RechartsTooltip
} from 'recharts';

type TabType = 'upload' | 'reports';

interface ReportRow {
    header_id: number;
    upload_date: string;
    patient_name: string;
    doctor_name: string;
    medical_council_id: string;
    admission_type: string;
    payment_mode: string;
    total_referral_amount: number;
    service_name: string;
    service_cost: number;
    referral_percentage: number;
    referral_amount: number;
    file_name: string;
}

interface GroupedData {
    [doctorName: string]: {
        doctorName: string;
        totalPayout: number;
        patients: {
            [patientName: string]: {
                patientName: string;
                mci_id: string;
                totalPayout: number;
                services: ReportRow[];
            }
        }
    }
}

const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2'];

export default function ReferralPaymentsHub() {
    const [activeTab, setActiveTab] = useState<TabType>('upload');

    const tabs = [
        { id: 'upload' as TabType, name: 'Upload Bills', icon: Upload, description: 'Upload bulk referral bills via Excel' },
        { id: 'reports' as TabType, name: 'Payment Reports', icon: BarChart3, description: 'View analytics and detailed reports' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <IndianRupee className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Referral Payments</h1>
                    <p className="text-sm text-gray-500 font-medium">Upload bills and view payment analytics</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-2 gap-0 border-b border-gray-200">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`p-5 text-left transition-colors border-b-2 ${activeTab === tab.id
                                    ? 'border-blue-600 bg-blue-50/50'
                                    : 'border-transparent hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-1">
                                    <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                                    <h3 className={`font-semibold ${activeTab === tab.id ? 'text-blue-900' : 'text-gray-700'}`}>
                                        {tab.name}
                                    </h3>
                                </div>
                                <p className="text-xs text-gray-500 ml-8">{tab.description}</p>
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'upload' && <UploadBillsTab />}
                    {activeTab === 'reports' && <PaymentReportsTab />}
                </div>
            </div>
        </div>
    );
}

// ============================================
// Upload Bills Tab
// ============================================
function UploadBillsTab() {
    const { user } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [uploadStats, setUploadStats] = useState<{ batchId: number, count: number, amount: number } | null>(null);

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
                responseType: 'blob',
            });

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
                    amount: response.data.total_amount
                });
                setFile(null);
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Card */}
            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
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
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-500 transition-colors bg-white">
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
                            <div className="w-16 h-16 bg-gray-100 rounded-full shadow-sm flex items-center justify-center mb-4">
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
                        className="w-full flex items-center justify-center py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
                                    <p className="text-blue-100 text-sm">Total Amount</p>
                                    <p className="text-2xl font-bold">₹{uploadStats.amount.toLocaleString()}</p>
                                </div>
                            </div>
                            <p className="text-sm text-blue-200 mt-4 leading-relaxed">
                                The uploaded data has been saved successfully. View detailed reports in the Payment Reports tab.
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
                                <span>Fill in the required fields: <b>Patient Name</b>, <b>IP Number</b>, <b>Doctor Name</b>, <b>MCI ID</b> (Crucial for mapping).</span>
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
                                Ensure that Referral Doctors have their Service Percentages configured. If no configuration is found, the referral amount will default to 0.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================
// Payment Reports Tab
// ============================================
function PaymentReportsTab() {
    const { user } = useAuth();
    const [reports, setReports] = useState<ReportRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Format as YYYY-MM-DD using local time (simple slice works if consistent, or manual checks)
        // Using strict ISO slice might give prev date if UTC. Let's send standard YYYY-MM-DD
        const toDateString = (date: Date) => {
            const offset = date.getTimezoneOffset() * 60000;
            return new Date(date.getTime() - offset).toISOString().split('T')[0];
        };

        return {
            fromDate: toDateString(firstDay),
            toDate: toDateString(lastDay),
            doctorId: ''
        };
    });
    const [doctors, setDoctors] = useState<{ id: string, name: string }[]>([]);
    const [expandedDoctors, setExpandedDoctors] = useState<string[]>([]);
    const [expandedPatients, setExpandedPatients] = useState<string[]>([]);

    useEffect(() => {
        fetchDoctors();
        fetchReports();
    }, []);

    const fetchDoctors = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/marketing/referral-doctors', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setDoctors(response.data.data.map((d: any) => ({ id: d.id, name: d.doctor_name })));
            }
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const fetchReports = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (filters.fromDate) params.append('fromDate', filters.fromDate);
            if (filters.toDate) params.append('toDate', filters.toDate);
            if (filters.doctorId) params.append('doctorId', filters.doctorId);

            const response = await axios.get(`/api/referral-payment/reports?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setReports(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const applyFilters = (e: React.FormEvent) => {
        e.preventDefault();
        fetchReports();
    };

    // Analytics Data
    const analyticsData = useMemo(() => {
        const doctorPayouts: Record<string, number> = {};
        const servicePayouts: Record<string, number> = {};

        reports.forEach(row => {
            doctorPayouts[row.doctor_name] = (doctorPayouts[row.doctor_name] || 0) + Number(row.referral_amount);
            servicePayouts[row.service_name] = (servicePayouts[row.service_name] || 0) + Number(row.referral_amount);
        });

        const barData = Object.entries(doctorPayouts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        const pieData = Object.entries(servicePayouts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);

        return { barData, pieData };
    }, [reports]);

    // Grouping Logic
    const groupedReports = useMemo<GroupedData>(() => {
        const groups: GroupedData = {};

        reports.forEach(row => {
            if (!groups[row.doctor_name]) {
                groups[row.doctor_name] = {
                    doctorName: row.doctor_name,
                    totalPayout: 0,
                    patients: {}
                };
            }

            const doctorGroup = groups[row.doctor_name];
            doctorGroup.totalPayout += Number(row.referral_amount);

            if (!doctorGroup.patients[row.patient_name]) {
                doctorGroup.patients[row.patient_name] = {
                    patientName: row.patient_name,
                    mci_id: row.medical_council_id,
                    totalPayout: 0,
                    services: []
                };
            }

            const patientGroup = doctorGroup.patients[row.patient_name];
            patientGroup.totalPayout += Number(row.referral_amount);
            patientGroup.services.push(row);
        });

        return groups;
    }, [reports]);

    const toggleDoctorExpansion = (doctorName: string) => {
        setExpandedDoctors(prev =>
            prev.includes(doctorName) ? prev.filter(n => n !== doctorName) : [...prev, doctorName]
        );
    };

    const togglePatientExpansion = (patientName: string) => {
        setExpandedPatients(prev =>
            prev.includes(patientName) ? prev.filter(n => n !== patientName) : [...prev, patientName]
        );
    };

    const exportToPDF = () => {
        if (!reports.length) return;
        const doc = new jsPDF('l', 'mm', 'a4');

        doc.setFontSize(18);
        doc.text('Referral Payments Report', 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
        if (filters.fromDate || filters.toDate) {
            doc.text(`Period: ${filters.fromDate || 'Start'} to ${filters.toDate || 'End'}`, 14, 34);
        }

        const tableColumns = ["Date", "Doctor", "Patient", "MCI ID", "Service", "Mode", "Cost", "%", "Ref Amt"];
        const tableRows = reports.map(row => [
            new Date(row.upload_date).toLocaleDateString(),
            row.doctor_name,
            row.patient_name,
            row.medical_council_id,
            row.service_name,
            row.payment_mode,
            `Rs. ${Number(row.service_cost).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            `${row.referral_percentage}%`,
            `Rs. ${Number(row.referral_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        ]);

        autoTable(doc, {
            head: [tableColumns],
            body: tableRows,
            startY: filters.fromDate || filters.toDate ? 40 : 35,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [37, 99, 235] },
            columnStyles: {
                6: { halign: 'right' },
                7: { halign: 'right' },
                8: { halign: 'right' },
            }
        });

        doc.save(`Referral_Payment_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const totalAmount = reports.reduce((sum, row) => sum + Number(row.referral_amount), 0);
    const uniqueDoctors = Object.keys(groupedReports).length;
    const uniquePatients = reports.reduce((acc, row) => {
        acc.add(`${row.doctor_name}-${row.patient_name}`);
        return acc;
    }, new Set()).size;

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <form onSubmit={applyFilters} className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[140px]">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">From Date</label>
                        <input
                            type="date"
                            name="fromDate"
                            value={filters.fromDate}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 font-medium text-gray-700"
                        />
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">To Date</label>
                        <input
                            type="date"
                            name="toDate"
                            value={filters.toDate}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 font-medium text-gray-700"
                        />
                    </div>
                    <div className="flex-[1.5] min-w-[200px]">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Select Doctor</label>
                        <select
                            name="doctorId"
                            value={filters.doctorId}
                            onChange={handleFilterChange}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 font-medium text-gray-700"
                        >
                            <option value="">All Referral Doctors</option>
                            {doctors.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        <Filter className="w-4 h-4" />
                        Apply
                    </button>
                    <button
                        type="button"
                        onClick={exportToPDF}
                        disabled={!reports.length}
                        className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 disabled:opacity-50 transition flex items-center gap-2"
                    >
                        <FileText className="w-4 h-4 text-blue-600" />
                        Export PDF
                    </button>
                </form>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Stats & Data */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                                <IndianRupee className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Payout</p>
                                <h3 className="text-xl font-bold text-gray-900">₹{totalAmount.toLocaleString('en-IN')}</h3>
                            </div>
                            <div className="ml-auto">
                                <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Doctors</p>
                                <h3 className="text-xl font-bold text-gray-900">{uniqueDoctors}</h3>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                                <User className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Patients</p>
                                <h3 className="text-xl font-bold text-gray-900">{uniquePatients}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Grouped Report */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-500" />
                                Detailed Grouped Report
                            </h2>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-md uppercase">
                                {reports.length} Records
                            </span>
                        </div>

                        <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                            {loading ? (
                                <div className="p-12 text-center">
                                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-600 mb-4" />
                                    <p className="text-gray-500 font-medium">Analyzing records...</p>
                                </div>
                            ) : Object.keys(groupedReports).length === 0 ? (
                                <div className="p-12 text-center text-gray-500 bg-gray-50/30">
                                    <Search className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                    <p className="font-medium">No results found matching your filters</p>
                                </div>
                            ) : (
                                Object.entries(groupedReports).map(([docName, doctor]) => {
                                    const isDocExpanded = expandedDoctors.includes(docName);
                                    return (
                                        <div key={docName} className="bg-white">
                                            {/* Doctor Row */}
                                            <div
                                                onClick={() => toggleDoctorExpansion(docName)}
                                                className={`px-6 py-4 flex items-center justify-between cursor-pointer transition-all ${isDocExpanded ? 'bg-blue-50/30' : 'hover:bg-gray-50/50'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-1.5 rounded-lg transition-colors ${isDocExpanded ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                                        {isDocExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 text-sm uppercase tracking-tight">
                                                            {docName}
                                                        </h3>
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                                            {Object.keys(doctor.patients).length} Patients Referred
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-gray-900">₹{doctor.totalPayout.toLocaleString()}</p>
                                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">DOCTOR TOTAL</span>
                                                </div>
                                            </div>

                                            {/* Patients */}
                                            {isDocExpanded && (
                                                <div className="bg-gray-50/50 divide-y divide-gray-100">
                                                    {Object.entries(doctor.patients).map(([patName, patient]) => {
                                                        const isPatExpanded = expandedPatients.includes(`${docName}-${patName}`);
                                                        return (
                                                            <div key={`${docName}-${patName}`}>
                                                                <div
                                                                    onClick={() => togglePatientExpansion(`${docName}-${patName}`)}
                                                                    className="px-10 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-100/50 border-l-4 border-blue-400 bg-white ml-2"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-black">
                                                                            PT
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-bold text-gray-800 text-xs">{patName}</p>
                                                                            <p className="text-[10px] font-mono text-gray-400">{patient.mci_id}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="text-right">
                                                                            <p className="text-xs font-black text-gray-800">₹{patient.totalPayout.toLocaleString()}</p>
                                                                        </div>
                                                                        {isPatExpanded ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                                                                    </div>
                                                                </div>

                                                                {/* Services */}
                                                                {isPatExpanded && (
                                                                    <div className="bg-white ml-12 pb-2">
                                                                        <table className="w-full text-[11px] text-gray-600">
                                                                            <thead className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/80">
                                                                                <tr>
                                                                                    <th className="px-6 py-2 text-left">Service Name</th>
                                                                                    <th className="px-6 py-2 text-right">Cost</th>
                                                                                    <th className="px-6 py-2 text-center">%</th>
                                                                                    <th className="px-6 py-2 text-right">Payout</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-gray-50">
                                                                                {patient.services.map((service, idx) => (
                                                                                    <tr key={idx} className="hover:bg-blue-50/20">
                                                                                        <td className="px-6 py-2">
                                                                                            <span className="font-bold text-gray-700">{service.service_name}</span>
                                                                                            <span className="ml-2 text-[9px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{service.payment_mode}</span>
                                                                                        </td>
                                                                                        <td className="px-6 py-2 text-right text-gray-500 font-mono">₹{Number(service.service_cost).toLocaleString()}</td>
                                                                                        <td className="px-6 py-2 text-center">
                                                                                            <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">{service.referral_percentage}%</span>
                                                                                        </td>
                                                                                        <td className="px-6 py-2 text-right font-black text-blue-600 font-mono">₹{Number(service.referral_amount).toLocaleString()}</td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Analytics Panel */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="sticky top-6 space-y-6">
                        {/* Summary Card */}
                        <div className="bg-gradient-to-br from-gray-900 to-blue-900 text-white rounded-xl p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
                            <div className="relative z-10">
                                <p className="text-[10px] font-bold text-blue-300 uppercase tracking-[0.2em] mb-4">Payout Overview</p>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                        <span className="text-gray-400 text-xs font-medium">Avg per Doctor</span>
                                        <span className="text-lg font-bold">₹{uniqueDoctors > 0 ? (totalAmount / uniqueDoctors).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                        <span className="text-gray-400 text-xs font-medium">Top Service</span>
                                        <div className="text-right">
                                            <span className="block text-sm font-bold truncate max-w-[150px]">{analyticsData.pieData[0]?.name || 'N/A'}</span>
                                            <span className="text-[10px] text-green-400 flex items-center justify-end gap-1">
                                                <ArrowUpRight className="w-3 h-3" />
                                                Dominating
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bar Chart */}
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[320px]">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                    <BarChart3 className="w-4 h-4 text-blue-600" />
                                </div>
                                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Top Doctors</h3>
                            </div>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analyticsData.barData} layout="vertical" margin={{ left: -20, right: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={80} style={{ fontSize: '10px', fontWeight: 600 }} stroke="#94a3b8" />
                                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={16} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Pie Chart */}
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[320px]">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                                    <PieChartIcon className="w-4 h-4 text-purple-600" />
                                </div>
                                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Service Distribution</h3>
                            </div>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={analyticsData.pieData}
                                            innerRadius={50}
                                            outerRadius={75}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {analyticsData.pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 600, paddingTop: '10px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
