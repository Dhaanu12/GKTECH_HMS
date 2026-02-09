'use client';

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '@/lib/AuthContext';
import {
    Download, Search, Calendar, Filter, Loader2, IndianRupee,
    FileText, User, ChevronRight, ChevronDown, PieChart as PieChartIcon,
    BarChart3, Activity, TrendingUp, Users, ArrowUpRight
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, Sector
} from 'recharts';

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

export default function ReferralPaymentReports() {
    const { user } = useAuth();
    const [reports, setReports] = useState<ReportRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        fromDate: '',
        toDate: '',
        doctorId: ''
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

    // Analytics Data Transformation
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

        // 2. Analytics Graph (Top Services or Doctors)
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

        // 3. Payment Summaries (Grand Total Box)
        const totalReferralAmount = reports.reduce((sum, row) => sum + Number(row.referral_amount), 0);
        const boxesY = chartY + (sortedServices.length * (barHeight + gap)) + 15;

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

        // 4. Service-wise Summary Table
        const summaryColumns = ["Service Name", "Total Contribution (%)", "Total Payout Amount"];
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

        // 5. Detailed Detailed Report Table
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
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Referral Analytics</h1>
                        <p className="text-sm text-gray-500 font-medium">Insights & Detailed Payment Reports</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={exportToPDF}
                        disabled={!reports.length}
                        className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-bold px-5 py-2.5 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm hover:shadow-md"
                    >
                        <FileText className="w-4 h-4 text-blue-600" />
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Side: Summary & Data Column */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Filters Card */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                        <form onSubmit={applyFilters} className="flex flex-wrap gap-4 items-end">
                            <div className="flex-1 min-w-[140px]">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">From Date</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        name="fromDate"
                                        value={filters.fromDate}
                                        onChange={handleFilterChange}
                                        className="w-full pl-3 pr-2 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium text-gray-700"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 min-w-[140px]">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">To Date</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        name="toDate"
                                        value={filters.toDate}
                                        onChange={handleFilterChange}
                                        className="w-full pl-3 pr-2 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium text-gray-700"
                                    />
                                </div>
                            </div>
                            <div className="flex-[1.5] min-w-[200px]">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Select Doctor</label>
                                <select
                                    name="doctorId"
                                    value={filters.doctorId}
                                    onChange={handleFilterChange}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium text-gray-700 appearance-none bg-no-repeat bg-[right_1rem_center]"
                                >
                                    <option value="">All Referral Doctors</option>
                                    {doctors.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                            >
                                <Filter className="w-4 h-4" />
                                Apply
                            </button>
                        </form>
                    </div>

                    {/* Stats Horizontal */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
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
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Doctors</p>
                                <h3 className="text-xl font-bold text-gray-900">{uniqueDoctors}</h3>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                                <User className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Patients</p>
                                <h3 className="text-xl font-bold text-gray-900">{uniquePatients}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Grouped Report */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-500" />
                                Detailed Grouped Report
                            </h2>
                            <div className="flex gap-2">
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-md uppercase">
                                    {reports.length} Records
                                </span>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-100">
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
                                                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight text-sm">
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

                                            {/* Patients for this doctor */}
                                            {isDocExpanded && (
                                                <div className="bg-gray-50/50 divide-y divide-gray-100 animate-in slide-in-from-top-1 duration-200">
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

                                                                {/* Services for this patient */}
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

                {/* Right Side: Side Analytics Panel (Sticky) */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="sticky top-6 space-y-6">

                        {/* Summary Highlights Card */}
                        <div className="bg-gradient-to-br from-gray-900 to-blue-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700" />
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
                                                Dominating Category
                                            </span>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-blue-500/30">
                                            Optimize Strategy
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Top Doctors Bar Chart */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[380px]">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                    <BarChart3 className="w-4 h-4 text-blue-600" />
                                </div>
                                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Top Doctors by Payout</h3>
                            </div>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analyticsData.barData} layout="vertical" margin={{ left: -20, right: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={80} style={{ fontSize: '10px', fontWeight: 600 }} stroke="#94a3b8" />
                                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Service Wise Distribution Pie Chart */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[380px]">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                                    <PieChartIcon className="w-4 h-4 text-purple-600" />
                                </div>
                                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Service Wise Contribution</h3>
                            </div>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={analyticsData.pieData}
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {analyticsData.pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 600, paddingTop: '20px' }} />
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
