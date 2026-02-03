
'use client';

import { FileText, Upload, CheckCircle, Clock, DollarSign, IndianRupee, AlertCircle, ChevronDown, ChevronRight, Building2, Download, Copy, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/lib/AuthContext';
import SearchableSelect from '@/components/ui/SearchableSelect';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface GroupedClaims {
    insuranceName: string;
    totalBillAmount: number;
    pendingAmount: number;
    totalClaims: number;
    claims: any[];
}

export default function AccountantDashboard() {
    const { user } = useAuth();
    const [claims, setClaims] = useState<any[]>([]);
    const [groupedClaims, setGroupedClaims] = useState<GroupedClaims[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
    const [branches, setBranches] = useState([]);

    // Filters
    const currentYear = new Date().getFullYear();
    const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
    const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
    const [selectedBranch, setSelectedBranch] = useState<string>('');

    const [stats, setStats] = useState({
        totalClaims: 0,
        totalBillAmount: 0,
        pendingAmount: 0
    });

    const months = [
        { value: 'ALL', label: 'All Months' },
        { value: '1', label: 'January' },
        { value: '2', label: 'February' },
        { value: '3', label: 'March' },
        { value: '4', label: 'April' },
        { value: '5', label: 'May' },
        { value: '6', label: 'June' },
        { value: '7', label: 'July' },
        { value: '8', label: 'August' },
        { value: '9', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' },
    ];

    const years = ['ALL', ...Array.from({ length: 5 }, (_, i) => (currentYear - i).toString())];

    useEffect(() => {
        if (user?.hospital_id) {
            fetchBranches();
            // Set default branch if only one? Or leave select for user.
            // If we want to default to something, we can do it after branches load.
        }
    }, [user]);

    useEffect(() => {
        fetchClaims();
    }, [selectedBranch, selectedMonth, selectedYear]);

    const fetchBranches = async () => {
        try {
            const token = localStorage.getItem('token');
            if (user?.hospital_id) {
                const res = await axios.get(`/api/branches/hospital/${user.hospital_id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setBranches(res.data.data.branches || []);
            }
        } catch (error) {
            console.error("Error fetching branches", error);
        }
    };

    const fetchClaims = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (selectedBranch) params.append('branch_id', selectedBranch);
            if (selectedMonth && selectedMonth !== 'ALL') params.append('month', selectedMonth);
            if (selectedYear && selectedYear !== 'ALL') params.append('year', selectedYear);

            const response = await axios.get(`/api/accountant/claims?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 'success') {
                const data = response.data.data;
                setClaims(data);

                // Calculate stats
                const totalBill = data.reduce((sum: number, item: any) => sum + (Number(item.bill_amount) || 0), 0);
                const totalPending = data.reduce((sum: number, item: any) => sum + (Number(item.pending_amount) || 0), 0);

                setStats({
                    totalClaims: data.length,
                    totalBillAmount: totalBill,
                    pendingAmount: totalPending
                });

                // Group claims by insurance
                const grouped = data.reduce((acc: any, claim: any) => {
                    const name = claim.insurance_name || 'Unknown Insurance';
                    if (!acc[name]) {
                        acc[name] = {
                            insuranceName: name,
                            totalBillAmount: 0,
                            pendingAmount: 0,
                            totalClaims: 0,
                            claims: []
                        };
                    }
                    acc[name].claims.push(claim);
                    acc[name].totalBillAmount += (Number(claim.bill_amount) || 0);
                    acc[name].pendingAmount += (Number(claim.pending_amount) || 0);
                    acc[name].totalClaims += 1;
                    return acc;
                }, {});

                setGroupedClaims(Object.values(grouped));
            }
        } catch (err) {
            console.error('Failed to fetch claims', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (companyName: string) => {
        if (expandedCompany === companyName) {
            setExpandedCompany(null);
        } else {
            setExpandedCompany(companyName);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleDownloadPDF = (e: React.MouseEvent, group: GroupedClaims) => {
        e.stopPropagation();

        const pendingClaims = group.claims.filter(claim => (Number(claim.amount_received) || 0) === 0);

        if (pendingClaims.length === 0) {
            alert("No unpaid claims (Amount Received = 0) to download for this insurance company.");
            return;
        }

        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape mode

        doc.setFontSize(18);
        doc.text(`${group.insuranceName} - Pending Claims`, 14, 20);

        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

        const tableColumn = [
            "S.No", "IP No", "Patient Name", "Dr Name", "Approval No",
            "Admn Date", "Disch Date", "Dept", "Bill Amt",
            "Advance", "Co-Pay", "Discount", "Appr Amt",
            "Amt Recd", "Pending"
        ];

        // Helper to format numbers without symbol for PDF to avoid font issues
        const formatNum = (num: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(num);

        const tableRows = pendingClaims.map((claim, index) => [
            index + 1,
            claim.ip_no || '-',
            claim.patient_name || '-',
            claim.doctor_name || '-',
            claim.approval_no || '-',
            claim.admission_date ? new Date(claim.admission_date).toLocaleDateString() : '-',
            claim.discharge_date ? new Date(claim.discharge_date).toLocaleDateString() : '-',
            claim.department || '-',
            formatNum(Number(claim.bill_amount) || 0),
            formatNum(Number(claim.advance_amount) || 0),
            formatNum(Number(claim.co_pay) || 0),
            formatNum(Number(claim.discount) || 0),
            formatNum(Number(claim.approval_amount) || 0),
            formatNum(Number(claim.amount_received) || 0),
            formatNum(Number(claim.pending_amount) || 0)
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 35,
            styles: { fontSize: 9, cellPadding: 2 },
            headStyles: { fillColor: [37, 99, 235] }, // Blue-600
            columnStyles: {
                0: { cellWidth: 10 }, // S.No
                8: { halign: 'right' }, // Bill Amt
                9: { halign: 'right' },
                10: { halign: 'right' },
                11: { halign: 'right' },
                12: { halign: 'right' },
                13: { halign: 'right' },
                14: { halign: 'right' }, // Pending
            }
        });

        doc.save(`${group.insuranceName}_Pending_Claims.pdf`);
    };

    if (loading) return <div className="p-6">Loading dashboard...</div>;

    return (
        <div className="space-y-6 relative">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Accountant Dashboard</h1>
                    <p className="mt-1 text-sm text-gray-500">Overview of insurance claims and financial status.</p>
                </div>
                <Link href="/accountant/upload" className="flex items-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Upload className="w-4 h-4" />
                    Upload New File
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="z-10">
                    <SearchableSelect
                        label="Branch"
                        options={branches.map((b: any) => ({
                            value: b.branch_id,
                            label: b.branch_name
                        }))}
                        value={selectedBranch}
                        onChange={setSelectedBranch}
                        placeholder="All Branches"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                    <div className="relative">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white"
                        >
                            {months.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <div className="relative">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white"
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Claims</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.totalClaims}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                            <IndianRupee className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Bill Amount</p>
                            <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalBillAmount)}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Pending</p>
                            <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.pendingAmount)}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Insurance Claims Graph */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Claims Analysis by Insurance</h3>
                    <p className="text-sm text-gray-500">Bill Amount vs Pending Amount (with Claims Count)</p>
                </div>
                <div className="h-[400px] w-full">
                    {groupedClaims.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={groupedClaims}
                                margin={{
                                    top: 20,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="insuranceName"
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    axisLine={{ stroke: '#E5E7EB' }}
                                    tickLine={false}
                                    tickFormatter={(value, index) => {
                                        const count = groupedClaims[index]?.totalClaims || 0;
                                        // Truncate long names but keep the count
                                        const name = value.length > 15 ? `${value.substring(0, 12)}...` : value;
                                        return `${name} (${count})`;
                                    }}
                                />
                                <YAxis
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    axisLine={{ stroke: '#E5E7EB' }}
                                    tickLine={false}
                                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            // Find the data item to get totalClaims
                                            const dataItem = groupedClaims.find(item => item.insuranceName === label);
                                            return (
                                                <div className="bg-white p-4 border border-gray-100 shadow-xl rounded-xl">
                                                    <p className="font-bold text-gray-900 mb-2">{label}</p>
                                                    <div className="space-y-1">
                                                        <p className="text-sm text-gray-600 flex items-center justify-between gap-4">
                                                            <span>Total Claims:</span>
                                                            <span className="font-medium text-gray-900">{dataItem?.totalClaims || 0}</span>
                                                        </p>
                                                        <p className="text-sm text-blue-600 flex items-center justify-between gap-4">
                                                            <span>Bill Amount:</span>
                                                            <span className="font-medium">
                                                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(payload[0].value))}
                                                            </span>
                                                        </p>
                                                        <p className="text-sm text-red-600 flex items-center justify-between gap-4">
                                                            <span>Pending:</span>
                                                            <span className="font-medium">
                                                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(payload[1].value))}
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="totalBillAmount" name="Total Bill" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={30} />
                                <Bar dataKey="pendingAmount" name="Pending Amount" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">
                            No data available for graph
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Claims by Insurance Company</h3>
                    <span className="text-sm text-gray-500">{groupedClaims.length} Companies Found</span>
                </div>

                <div className="divide-y divide-gray-200">
                    {groupedClaims.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No claims data available. Upload a file to see insurance breakdown.
                        </div>
                    ) : (
                        groupedClaims.map((group) => (
                            <div key={group.insuranceName} className="bg-white">
                                <div
                                    className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => toggleExpand(group.insuranceName)}
                                >
                                    <div className="flex items-center gap-4">
                                        {expandedCompany === group.insuranceName ? (
                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                        ) : (
                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                        )}
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{group.insuranceName}</h4>
                                                <p className="text-sm text-gray-500">{group.totalClaims} Claims Processed</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-500">Total Bill Amount</p>
                                            <p className="text-lg font-bold text-gray-900">{formatCurrency(group.totalBillAmount)}</p>
                                        </div>

                                        {/* Download Button */}
                                        <button
                                            onClick={(e) => handleDownloadPDF(e, group)}
                                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                            title="Download PDF"
                                        >
                                            <Download className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {expandedCompany === group.insuranceName && (
                                    <div className="border-t border-gray-100 bg-gray-50/50 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm text-gray-600 whitespace-nowrap">
                                                    <thead className="bg-gray-50 text-gray-900 font-medium border-b border-gray-200">
                                                        <tr>
                                                            <th className="px-6 py-3 min-w-[100px]">IP No</th>
                                                            <th className="px-6 py-3 min-w-[150px]">Patient Name</th>
                                                            <th className="px-6 py-3 min-w-[150px]">Dr Name</th>
                                                            <th className="px-6 py-3 min-w-[120px]">Approval No</th>
                                                            <th className="px-6 py-3 min-w-[120px]">Admn Date</th>
                                                            <th className="px-6 py-3 min-w-[120px]">Disch Date</th>
                                                            <th className="px-6 py-3 min-w-[120px]">Dept</th>
                                                            <th className="px-6 py-3 min-w-[120px] text-right">Bill Amt</th>
                                                            <th className="px-6 py-3 min-w-[120px] text-right">Advance</th>
                                                            <th className="px-6 py-3 min-w-[100px] text-right">Co-Pay</th>
                                                            <th className="px-6 py-3 min-w-[100px] text-right">Discount</th>
                                                            <th className="px-6 py-3 min-w-[120px] text-right">Appr Amt</th>
                                                            <th className="px-6 py-3 min-w-[120px] text-right">Amt Recd</th>
                                                            <th className="px-6 py-3 min-w-[120px] text-right">Pending</th>
                                                            {/* <th className="px-6 py-3 min-w-[100px] text-right">TDS</th> */}
                                                            {/* <th className="px-6 py-3 min-w-[150px]">Bank Name</th> */}
                                                            {/* <th className="px-6 py-3 min-w-[120px]">Txn Date</th> */}
                                                            {/* <th className="px-6 py-3 min-w-[150px]">UTR No</th> */}
                                                            {/* <th className="px-6 py-3 min-w-[200px]">Remarks</th> */}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {group.claims.map((claim) => (
                                                            <tr key={claim.claim_id} className="hover:bg-gray-50 transition-colors">

                                                                <td className="px-6 py-3 font-medium text-gray-900">{claim.ip_no || '-'}</td>
                                                                <td className="px-6 py-3">{claim.patient_name || '-'}</td>
                                                                <td className="px-6 py-3">{claim.doctor_name || '-'}</td>
                                                                <td className="px-6 py-3">{claim.approval_no || '-'}</td>
                                                                <td className="px-6 py-3">
                                                                    {claim.admission_date ? new Date(claim.admission_date).toLocaleDateString() : '-'}
                                                                </td>
                                                                <td className="px-6 py-3">
                                                                    {claim.discharge_date ? new Date(claim.discharge_date).toLocaleDateString() : '-'}
                                                                </td>
                                                                <td className="px-6 py-3">{claim.department || '-'}</td>
                                                                <td className="px-6 py-3 text-right font-medium">{formatCurrency(Number(claim.bill_amount) || 0)}</td>
                                                                <td className="px-6 py-3 text-right">{formatCurrency(Number(claim.advance_amount) || 0)}</td>
                                                                <td className="px-6 py-3 text-right">{formatCurrency(Number(claim.co_pay) || 0)}</td>
                                                                <td className="px-6 py-3 text-right">{formatCurrency(Number(claim.discount) || 0)}</td>
                                                                <td className={`px-6 py-3 text-right ${(Number(claim.approval_amount) || 0) < (Number(claim.bill_amount) || 0) * 0.6
                                                                    ? 'text-red-600 font-bold'
                                                                    : 'text-gray-900'
                                                                    }`}>
                                                                    {formatCurrency(Number(claim.approval_amount) || 0)}
                                                                </td>
                                                                <td className={`px-6 py-3 text-right ${(Number(claim.amount_received) || 0) < (Number(claim.approval_amount) || 0) * 0.8
                                                                    ? 'text-red-600 font-bold'
                                                                    : 'text-green-600'
                                                                    }`}>
                                                                    {formatCurrency(Number(claim.amount_received) || 0)}
                                                                </td>
                                                                <td className="px-6 py-3 text-right text-red-600">{formatCurrency(Number(claim.pending_amount) || 0)}</td>
                                                                {/* <td className="px-6 py-3 text-right">{formatCurrency(Number(claim.tds) || 0)}</td> */}
                                                                {/* <td className="px-6 py-3">{claim.bank_name || '-'}</td> */}
                                                                {/* <td className="px-6 py-3">
                                                                    {claim.transaction_date ? new Date(claim.transaction_date).toLocaleDateString() : '-'}
                                                                </td> */}
                                                                {/* <td className="px-6 py-3">{claim.utr_no || '-'}</td> */}
                                                                {/* <td className="px-6 py-3">
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                                        {claim.remarks || 'Pending'}
                                                                    </span>
                                                                </td> */}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

