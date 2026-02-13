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
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { getAgentReferralReports, AgentReportRow } from '@/lib/api/referralPayment';

type TabType = 'upload' | 'reports' | 'agent-reports';

interface ReportRow {
    header_id: number;
    upload_date: string;
    ip_number: string;
    service_date: string;
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
    referral_doctor_id: number;
}

interface GroupedData {
    [doctorName: string]: {
        doctorName: string;
        totalPayout: number;
        patients: {
            [patientKey: string]: {
                patientName: string;
                ipNumber: string;
                mci_id: string;
                totalPayout: number;
                dates: {
                    [serviceDate: string]: {
                        serviceDate: string;
                        totalPayout: number;
                        services: ReportRow[];
                    }
                }
            }
        }
    }
}

const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2'];

export default function ReferralPaymentsHub() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        }>
            <ReferralPaymentsContent />
        </Suspense>
    );
}

function ReferralPaymentsContent() {
    const searchParams = useSearchParams();
    const initialTab = (searchParams.get('tab') as TabType) || 'upload';
    const [activeTab, setActiveTab] = useState<TabType>(initialTab);

    const tabs = [
        { id: 'upload' as TabType, name: 'Upload Bills', icon: Upload, description: 'Upload bulk referral bills via Excel' },
        { id: 'reports' as TabType, name: 'Payment Reports', icon: BarChart3, description: 'View analytics and detailed reports' },
        { id: 'agent-reports' as TabType, name: 'Agent Reports', icon: Users, description: 'View agent referral performance' },
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
                <div className="grid grid-cols-3 gap-0 border-b border-gray-200">
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
                    {activeTab === 'agent-reports' && <AgentReportsTab />}
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
    const [selectedDateTabs, setSelectedDateTabs] = useState<Record<string, string>>({});

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

    // Grouping Logic: Doctor → Patient → Date → Services
    const groupedReports = useMemo<GroupedData>(() => {
        const groups: GroupedData = {};

        // Filter out records without service_date
        const validReports = reports.filter(row => row.service_date);

        validReports.forEach(row => {
            if (!groups[row.doctor_name]) {
                groups[row.doctor_name] = {
                    doctorName: row.doctor_name,
                    totalPayout: 0,
                    patients: {}
                };
            }

            const doctorGroup = groups[row.doctor_name];
            doctorGroup.totalPayout += Number(row.referral_amount);

            // Use IP number as unique patient key
            const patientKey = `${row.ip_number}-${row.patient_name}`;

            if (!doctorGroup.patients[patientKey]) {
                doctorGroup.patients[patientKey] = {
                    patientName: row.patient_name,
                    ipNumber: row.ip_number,
                    mci_id: row.medical_council_id,
                    totalPayout: 0,
                    dates: {}
                };
            }

            const patientGroup = doctorGroup.patients[patientKey];
            patientGroup.totalPayout += Number(row.referral_amount);

            // Group by service date
            if (!patientGroup.dates[row.service_date]) {
                patientGroup.dates[row.service_date] = {
                    serviceDate: row.service_date,
                    totalPayout: 0,
                    services: []
                };
            }

            const dateGroup = patientGroup.dates[row.service_date];
            dateGroup.totalPayout += Number(row.referral_amount);
            dateGroup.services.push(row);
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
        const pageWidth = doc.internal.pageSize.getWidth();

        // 1. Header Section
        doc.setFontSize(22);
        doc.setTextColor(37, 99, 235);
        doc.text('Referral Payments Analysis Report', 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 27);
        if (filters.fromDate || filters.toDate) {
            doc.text(`Period: ${filters.fromDate || 'All Time'} to ${filters.toDate || 'Present'}`, 14, 32);
        }

        // 2. Analytics Graph (Top Services)
        const serviceWiseTotals: Record<string, number> = {};
        reports.forEach(row => {
            serviceWiseTotals[row.service_name] = (serviceWiseTotals[row.service_name] || 0) + Number(row.referral_amount);
        });
        const sortedServices = Object.entries(serviceWiseTotals)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        const chartX = 14;
        const chartY = 40;
        const barStartX = chartX + 60;
        const chartWidth = 120;
        const barHeight = 7;
        const gap = 5;

        if (sortedServices.length > 0) {
            doc.setFontSize(12);
            doc.setTextColor(50);
            doc.text('Top Services by Referral Payout', 14, 38);

            const maxVal = Math.max(...sortedServices.map(s => s.value), 1);

            sortedServices.forEach((stat, index) => {
                const currentY = chartY + (index * (barHeight + gap));

                // Label
                doc.setFontSize(8);
                doc.setTextColor(60);
                const shortName = stat.name.length > 25 ? stat.name.substring(0, 22) + '...' : stat.name;
                doc.text(shortName, chartX, currentY + barHeight / 2 + 1);

                // Bar Background
                doc.setFillColor(245, 245, 245);
                doc.rect(barStartX, currentY, chartWidth, barHeight, 'F');

                // Data Bar
                const currentWidth = (stat.value / maxVal) * chartWidth;
                doc.setFillColor(37, 99, 235); // Blue
                doc.rect(barStartX, currentY, currentWidth, barHeight, 'F');

                // Value label
                doc.setTextColor(100);
                doc.text(`Rs.${stat.value.toLocaleString()}`, barStartX + chartWidth + 5, currentY + barHeight / 2 + 1);
            });
        }

        // 3. Admission Type Analysis (Pie Chart)
        const admissionTypeCounts: Record<string, number> = {};
        reports.forEach(row => {
            const admType = row.admission_type || 'Unknown';
            admissionTypeCounts[admType] = (admissionTypeCounts[admType] || 0) + 1;
        });
        const sortedAdmissionTypes = Object.entries(admissionTypeCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const pieChartY = chartY + (sortedServices.length * (barHeight + gap)) + 15;

        if (sortedAdmissionTypes.length > 0) {
            doc.setFontSize(12);
            doc.setTextColor(50);
            doc.text('Admission Type Distribution', 14, pieChartY - 2);

            // Pie chart settings
            const pieX = 50;
            const pieY = pieChartY + 25;
            const radius = 20;
            const totalCount = sortedAdmissionTypes.reduce((sum, item) => sum + item.value, 0);

            // Color palette
            const colors = [
                [16, 185, 129],   // Green
                [59, 130, 246],   // Blue
                [251, 146, 60],   // Orange
                [168, 85, 247],   // Purple
                [236, 72, 153],   // Pink
                [234, 179, 8],    // Yellow
            ];

            // Draw horizontal percentage bars
            const barChartX = 14;
            const barChartY = pieChartY + 5;
            const barWidth = 180;
            const barItemHeight = 12;
            const barGap = 3;

            sortedAdmissionTypes.forEach((stat, index) => {
                const percentage = (stat.value / totalCount) * 100;
                const color = colors[index % colors.length];
                const currentY = barChartY + (index * (barItemHeight + barGap));

                // Label
                doc.setFontSize(9);
                doc.setTextColor(60);
                doc.text(stat.name, barChartX, currentY + 7);

                // Background bar
                doc.setFillColor(240, 240, 240);
                doc.roundedRect(barChartX + 50, currentY, barWidth, barItemHeight, 2, 2, 'F');

                // Filled percentage bar
                const filledWidth = (percentage / 100) * barWidth;
                doc.setFillColor(color[0], color[1], color[2]);
                doc.roundedRect(barChartX + 50, currentY, filledWidth, barItemHeight, 2, 2, 'F');

                // Percentage text
                doc.setFontSize(8);
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                if (filledWidth > 15) {
                    doc.text(`${percentage.toFixed(1)}%`, barChartX + 50 + filledWidth - 12, currentY + 7.5);
                } else {
                    doc.setTextColor(60);
                    doc.text(`${percentage.toFixed(1)}%`, barChartX + 50 + filledWidth + 2, currentY + 7.5);
                }
                doc.setFont('helvetica', 'normal');

                // Count
                doc.setFontSize(7);
                doc.setTextColor(100);
                doc.text(`${stat.value} records`, barChartX + 50 + barWidth + 3, currentY + 7.5);
            });


        }

        // 4. Financial Overview
        const totalReferralAmount = reports.reduce((sum, row) => sum + Number(row.referral_amount), 0);
        const boxesY = pieChartY + 60;

        doc.setFontSize(11);
        doc.setTextColor(37, 99, 235);
        doc.text("Financial Overview", 14, boxesY - 5);

        doc.setDrawColor(37, 99, 235);
        doc.setFillColor(240, 248, 255);
        doc.roundedRect(14, boxesY, 269, 18, 2, 2, 'FD');

        doc.setFontSize(10);
        doc.setTextColor(70);
        doc.text("Total Referral Payout (Grand Total):", 20, boxesY + 11);
        doc.setFontSize(14);
        doc.setTextColor(30, 58, 138);
        doc.text(`Rs. ${totalReferralAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - 80, boxesY + 11);

        // 5. Service-wise Summary Table
        const summaryColumns = ["Service Name", "Contribution (%)", "Total Payout"];
        const summaryRows = Object.entries(serviceWiseTotals)
            .sort((a, b) => b[1] - a[1])
            .map(([name, amount]) => [
                name,
                `${((amount / totalReferralAmount) * 100).toFixed(1)}%`,
                `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
            ]);

        doc.text("Service-wise Summary", 14, boxesY + 30);
        autoTable(doc, {
            head: [summaryColumns],
            body: summaryRows,
            startY: boxesY + 35,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229], halign: 'center' },
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { halign: 'center', cellWidth: 40 },
                2: { halign: 'right', cellWidth: 50 }
            }
        });

        // 6. Detailed Report Table
        const detailedColumns = ["Date", "Doctor", "Patient", "MCI ID", "Service", "Mode", "Cost", "%", "Ref Amt"];
        const detailedRows = reports.map(row => [
            new Date(row.upload_date).toLocaleDateString(),
            row.doctor_name,
            row.patient_name,
            row.medical_council_id,
            row.service_name,
            row.payment_mode,
            `Rs. ${Number(row.service_cost).toLocaleString()}`,
            `${row.referral_percentage}%`,
            `Rs. ${Number(row.referral_amount).toLocaleString()}`
        ]);

        doc.text("Detailed Commission Report", 14, (doc as any).lastAutoTable.finalY + 12);
        autoTable(doc, {
            head: [detailedColumns],
            body: detailedRows,
            startY: (doc as any).lastAutoTable.finalY + 17,
            styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
            headStyles: { fillColor: [37, 99, 235], halign: 'center' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: {
                0: { cellWidth: 20 },
                6: { halign: 'right', cellWidth: 25 },
                7: { halign: 'center', cellWidth: 12 },
                8: { halign: 'right', cellWidth: 25 },
            },
            margin: { top: 25 }
        });

        doc.save(`Referral_Payout_Report_${new Date().toISOString().split('T')[0]}.pdf`);
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
                                                    {Object.entries(doctor.patients).map(([patKey, patient]) => {
                                                        const isPatExpanded = expandedPatients.includes(`${docName}-${patKey}`);
                                                        return (
                                                            <div key={`${docName}-${patKey}`}>
                                                                <div
                                                                    onClick={() => togglePatientExpansion(`${docName}-${patKey}`)}
                                                                    className="px-10 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-100/50 border-l-4 border-blue-400 bg-white ml-2"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-black">
                                                                            PT
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-bold text-gray-800 text-xs">{patient.patientName}</p>
                                                                            <p className="text-[10px] font-mono text-gray-400">IP: {patient.ipNumber}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="text-right">
                                                                            <p className="text-xs font-black text-gray-800">₹{patient.totalPayout.toLocaleString()}</p>
                                                                        </div>
                                                                        {isPatExpanded ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                                                                    </div>
                                                                </div>

                                                                {/* Dates as Tabs */}
                                                                {isPatExpanded && (
                                                                    <div className="bg-gray-100/30 ml-12 p-4">
                                                                        {(() => {
                                                                            const dates = Object.entries(patient.dates).sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime());
                                                                            const patientKey = `${docName}-${patKey}`;
                                                                            const selectedDate = selectedDateTabs[patientKey] || dates[0]?.[0];
                                                                            const selectedDateGroup = dates.find(([date]) => date === selectedDate)?.[1];

                                                                            return (
                                                                                <>
                                                                                    {/* Date Tabs */}
                                                                                    <div className="flex gap-2 mb-4 flex-wrap">
                                                                                        {dates.map(([serviceDate, dateGroup]) => {
                                                                                            const isSelected = serviceDate === selectedDate;
                                                                                            return (
                                                                                                <button
                                                                                                    key={serviceDate}
                                                                                                    onClick={() => setSelectedDateTabs(prev => ({ ...prev, [patientKey]: serviceDate }))}
                                                                                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isSelected
                                                                                                        ? 'bg-blue-600 text-white shadow-md'
                                                                                                        : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-200'
                                                                                                        }`}
                                                                                                >
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
                                                                                                            }`}>
                                                                                                            {new Date(serviceDate).getDate()}
                                                                                                        </div>
                                                                                                        <div className="text-left">
                                                                                                            <div className="text-[11px] leading-tight">
                                                                                                                {new Date(serviceDate).toLocaleDateString('en-IN', {
                                                                                                                    month: 'short',
                                                                                                                    day: 'numeric'
                                                                                                                })}
                                                                                                            </div>
                                                                                                            <div className={`text-[9px] leading-tight ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                                                                                                                ₹{dateGroup.totalPayout.toLocaleString()}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </button>
                                                                                            );
                                                                                        })}
                                                                                    </div>

                                                                                    {/* Services for selected date */}
                                                                                    {selectedDateGroup && (
                                                                                        <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
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
                                                                                                    {selectedDateGroup.services.map((service: ReportRow, idx: number) => (
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
                                                                                </>
                                                                            );
                                                                        })()}
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

// ============================================
// Agent Reports Tab
// ============================================
function AgentReportsTab() {
    const { user } = useAuth();
    const [reports, setReports] = useState<AgentReportRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [showAnalytics, setShowAnalytics] = useState(true);

    useEffect(() => {
        setQuickFilter('thisMonth'); // Default to this month
    }, []);

    useEffect(() => {
        fetchReports();
    }, [fromDate, toDate]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const data = await getAgentReferralReports({ fromDate, toDate });
            if (data.success) {
                setReports(data.data);
            }
        } catch (error) {
            console.error('Error fetching agent reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const setQuickFilter = (type: 'thisMonth' | 'lastMonth' | 'overall') => {
        const now = new Date();
        let start = '';
        let end = '';

        if (type === 'thisMonth') {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            start = toDateString(firstDay);
            end = toDateString(lastDay);
        } else if (type === 'lastMonth') {
            const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
            start = toDateString(firstDay);
            end = toDateString(lastDay);
        } else {
            // Overall - clear dates to fetch all
            start = '';
            end = '';
        }

        setFromDate(start);
        setToDate(end);
    };

    const toDateString = (date: Date) => {
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().split('T')[0];
    };

    const downloadReport = () => {
        const doc = new jsPDF('l', 'mm', 'a4');
        doc.setFontSize(18);
        doc.setTextColor(37, 99, 235);
        doc.text('Agent Referral Performance Report', 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 26);
        doc.text(`Period: ${fromDate || 'Start'} to ${toDate || 'Present'}`, 14, 31);

        const columns = ["Agent Name", "Mobile", "Ref. Patients", "Ref. Doctors", "Patient Comm.", "Doctor Comm.", "Total Comm."];
        const rows = filteredReports.map(row => [
            row.agent_name,
            row.mobile,
            row.patient_count,
            row.doctor_count,
            `Rs. ${Number(row.total_patient_commission).toLocaleString()}`,
            `Rs. ${Number(row.total_doctor_commission).toLocaleString()}`,
            `Rs. ${Number(row.total_commission).toLocaleString()}`
        ]);

        autoTable(doc, {
            head: [columns],
            body: rows,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235] },
            styles: { fontSize: 9 }
        });

        // Add Summary
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`Total Commission Liability: Rs. ${totalStats.commission.toLocaleString()}`, 14, finalY);

        doc.save(`Agent_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const filteredReports = reports.filter(row =>
        row.agent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.mobile.includes(searchTerm)
    );

    const totalStats = useMemo(() => {
        return reports.reduce((acc, curr) => ({
            patients: acc.patients + Number(curr.patient_count),
            doctors: acc.doctors + Number(curr.doctor_count),
            commission: acc.commission + Number(curr.total_commission)
        }), { patients: 0, doctors: 0, commission: 0 });
    }, [reports]);

    // Analytics Data Preparation
    const analyticsData = useMemo(() => {
        const sortedByPatients = [...reports].sort((a, b) => Number(b.patient_count) - Number(a.patient_count)).slice(0, 5);
        const sortedByDoctors = [...reports].sort((a, b) => Number(b.doctor_count) - Number(a.doctor_count)).slice(0, 5);

        return {
            patientLeaders: sortedByPatients.map(r => ({ name: r.agent_name, value: Number(r.patient_count) })),
            doctorLeaders: sortedByDoctors.map(r => ({ name: r.agent_name, value: Number(r.doctor_count) })),
        };
    }, [reports]);

    return (
        <div className="space-y-6">
            {/* Filters & Actions */}
            <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search agent..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {/* Date Range */}
                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200">
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="px-2 py-1 bg-transparent text-sm outline-none w-32"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="px-2 py-1 bg-transparent text-sm outline-none w-32"
                        />
                    </div>

                    {/* Quick Filters */}
                    <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                        <button onClick={() => setQuickFilter('thisMonth')} className="px-3 py-1 text-xs font-medium rounded hover:bg-gray-50">This Month</button>
                        <div className="w-px bg-gray-200 my-1"></div>
                        <button onClick={() => setQuickFilter('lastMonth')} className="px-3 py-1 text-xs font-medium rounded hover:bg-gray-50">Last Month</button>
                        <div className="w-px bg-gray-200 my-1"></div>
                        <button onClick={() => setQuickFilter('overall')} className="px-3 py-1 text-xs font-medium rounded hover:bg-gray-50">Overall</button>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
                    <button
                        onClick={() => setShowAnalytics(!showAnalytics)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showAnalytics ? 'bg-blue-100 text-blue-700' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                    >
                        <BarChart3 className="w-4 h-4" />
                        {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
                    </button>
                    <button
                        onClick={downloadReport}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                    >
                        <Download className="w-4 h-4" />
                        Download Report
                    </button>
                </div>
            </div>

            {/* Analytics Section */}
            {showAnalytics && reports.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Patient Referrals Chart */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            Top Agents by Patient Referrals
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analyticsData.patientLeaders} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '11px', fontWeight: 500 }} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="value" name="Patients" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Doctor Referrals Chart */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <User className="w-4 h-4 text-purple-600" />
                            Top Agents by Doctor Referrals
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analyticsData.doctorLeaders} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '11px', fontWeight: 500 }} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="value" name="Doctors" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Summary Row */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Total Patients</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{totalStats.patients}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Total Doctors</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{totalStats.doctors}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-600" />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Total Commission</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">₹{totalStats.commission.toLocaleString()}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                        <IndianRupee className="w-5 h-5 text-emerald-600" />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Agent Name</th>
                                <th className="px-6 py-4 text-center">Ref. Patients</th>
                                <th className="px-6 py-4 text-center">Ref. Doctors</th>
                                <th className="px-6 py-4 text-right">Patient Comm.</th>
                                <th className="px-6 py-4 text-right">Doctor Comm.</th>
                                <th className="px-6 py-4 text-right">Total Comm.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                                        Loading report data...
                                    </td>
                                </tr>
                            ) : filteredReports.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No agents found for the selected criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredReports.map((row) => (
                                    <tr key={row.agent_id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{row.agent_name}</div>
                                            <div className="text-xs text-gray-500">{row.mobile}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {row.patient_count}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                {row.doctor_count}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-600">
                                            ₹{Number(row.total_patient_commission).toLocaleString()}
                                            <div className="text-[10px] text-gray-400">Rate: ₹{row.referral_patient_commission}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-600">
                                            ₹{Number(row.total_doctor_commission).toLocaleString()}
                                            <div className="text-[10px] text-gray-400">Rate: ₹{row.referral_doc_commission}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900 bg-gray-50/50">
                                            ₹{Number(row.total_commission).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {/* Footer Totals */}
                        {!loading && filteredReports.length > 0 && (
                            <tfoot className="bg-gray-50 font-semibold text-gray-900 border-t border-gray-200">
                                <tr>
                                    <td className="px-6 py-4">Total</td>
                                    <td className="px-6 py-4 text-center">{totalStats.patients}</td>
                                    <td className="px-6 py-4 text-center">{totalStats.doctors}</td>
                                    <td className="px-6 py-4 text-right">-</td>
                                    <td className="px-6 py-4 text-right">-</td>
                                    <td className="px-6 py-4 text-right">₹{totalStats.commission.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}
