'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Calendar,
    Filter,
    Download,
    Search,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import SearchableSelect from '@/components/ui/SearchableSelect';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Claim {
    claim_id: string;
    s_no: string;
    ip_no: string;
    patient_name: string;
    doctor_name: string;
    approval_no: string;
    admission_date: string;
    discharge_date: string;
    department: string;
    insurance_name: string;
    bill_amount: string;
    advance_amount: string;
    co_pay: string;
    discount: string;
    approval_amount: string;
    amount_received: string;
    pending_amount: string;
    tds: string;
    bank_name: string;
    transaction_date: string;
    utr_no: string;
    remarks: string;
}

export default function ReportsPage() {
    const [claims, setClaims] = useState<Claim[]>([]);
    const [loading, setLoading] = useState(false);
    const [insuranceCompanies, setInsuranceCompanies] = useState<string[]>([]);

    // Filters
    const currentYear = new Date().getFullYear();
    const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
    const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
    const [selectedInsurance, setSelectedInsurance] = useState('ALL');

    const [statusFilter, setStatusFilter] = useState('ALL'); // Risk Analysis: LOW_APPROVAL, LOW_RECEIVED
    const [paymentFilter, setPaymentFilter] = useState('ALL'); // Payment Status: RECEIVED, NOT_RECEIVED, PENDING

    // Branch Filter
    const { user } = useAuth();
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState<string>('');

    useEffect(() => {
        if (user?.hospital_id) {
            const fetchBranches = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const res = await axios.get(`http://localhost:5000/api/branches/hospital/${user.hospital_id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setBranches(res.data.data.branches || []);
                } catch (error) {
                    console.error("Error fetching branches", error);
                }
            };
            fetchBranches();
        }
    }, [user]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const months = [
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

    const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

    useEffect(() => {
        // Fetch all claims initially
        fetchReports(1);
    }, []);

    // Fetch insurance companies
    useEffect(() => {
        const fetchInsuranceCompanies = async () => {
            try {
                const token = localStorage.getItem('token');
                const params = new URLSearchParams();
                if (selectedBranch) params.append('branch_id', selectedBranch);

                const res = await axios.get(`http://localhost:5000/api/accountant/insurance-companies?${params.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.data.status === 'success') {
                    setInsuranceCompanies(res.data.data);
                }
            } catch (error) {
                console.error("Error fetching insurance companies", error);
            }
        };
        fetchInsuranceCompanies();
    }, [selectedBranch]);

    const getDateRange = () => {
        if (selectedMonth === 'ALL' || selectedYear === 'ALL') return { start: '', end: '' };

        const year = parseInt(selectedYear);
        const month = parseInt(selectedMonth);

        // First day of cylinder
        const start = `${year}-${month.toString().padStart(2, '0')}-01`;

        // Last day of month
        const lastDay = new Date(year, month, 0).getDate();
        const end = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;

        return { start, end };
    };

    const fetchReports = async (page = 1) => {
        setLoading(true);
        try {
            const { start, end } = getDateRange();
            const params = new URLSearchParams();

            if (start) params.append('startDate', start);
            if (end) params.append('endDate', end);

            if (selectedInsurance !== 'ALL') params.append('insuranceName', selectedInsurance);
            if (statusFilter !== 'ALL') params.append('statusFilter', statusFilter);
            if (paymentFilter !== 'ALL') params.append('paymentFilter', paymentFilter);
            if (selectedBranch) params.append('branch_id', selectedBranch);
            params.append('page', page.toString());
            params.append('limit', '10');

            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/accountant/reports?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 'success') {
                setClaims(response.data.data);
                setTotalPages(response.data.totalPages);
                setCurrentPage(response.data.currentPage);

                if (selectedInsurance === 'ALL') {
                    // Do nothing, we fetch all companies separately now
                }
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        try {
            const { start, end } = getDateRange();
            const params = new URLSearchParams();
            if (start) params.append('startDate', start);
            if (end) params.append('endDate', end);
            if (selectedInsurance !== 'ALL') params.append('insuranceName', selectedInsurance);
            if (statusFilter !== 'ALL') params.append('statusFilter', statusFilter);
            if (paymentFilter !== 'ALL') params.append('paymentFilter', paymentFilter);
            if (selectedBranch) params.append('branch_id', selectedBranch);
            params.append('fetchAll', 'true');

            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/accountant/reports?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 'success') {
                const data = response.data.data;
                const doc = new jsPDF('l', 'mm', 'a4'); // Landscape

                doc.setFontSize(18);
                doc.text(`Financial Reports - ${selectedMonth}/${selectedYear}`, 14, 20);

                doc.setFontSize(10);
                doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
                doc.text(`Total Records: ${data.length}`, 200, 28);

                const fullColumns = [
                    "S.No", "IP No", "Patient", "Dr Name", "Insurance",
                    "Admn Date", "Disch Date", "Bill Amt", "Appr Amt",
                    "Amt Recd", "Pending", "TDS", "Bank", "Txn Date", "Remarks"
                ];

                // Remove symbol for PDF
                const formatNum = (num: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(num);

                const tableRows = data.map((claim: any) => [
                    claim.s_no,
                    claim.ip_no,
                    claim.patient_name,
                    claim.doctor_name,
                    claim.insurance_name,
                    formatDate(claim.admission_date),
                    formatDate(claim.discharge_date),
                    formatNum(Number(claim.bill_amount) || 0),
                    formatNum(Number(claim.approval_amount) || 0),
                    formatNum(Number(claim.amount_received) || 0),
                    formatNum(Number(claim.pending_amount) || 0),
                    formatNum(Number(claim.tds) || 0),
                    claim.bank_name || '-',
                    formatDate(claim.transaction_date),
                    claim.remarks || ''
                ]);

                autoTable(doc, {
                    head: [fullColumns],
                    body: tableRows,
                    startY: 35,
                    styles: { fontSize: 8, cellPadding: 2 },
                    headStyles: { fillColor: [37, 99, 235] },
                    columnStyles: {
                        7: { halign: 'right' },
                        8: { halign: 'right' },
                        9: { halign: 'right' },
                        10: { halign: 'right' },
                        11: { halign: 'right' },
                    }
                });

                doc.save(`Claims_Report_${selectedMonth}_${selectedYear}.pdf`);
            }
        } catch (error) {
            console.error('Error downloading report:', error);
            alert('Failed to download report');
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchReports(newPage);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-IN');
    };

    const totalClaims = claims.length;
    const totalBill = claims.reduce((acc, curr) => acc + (Number(curr.bill_amount) || 0), 0);
    const totalReceived = claims.reduce((acc, curr) => acc + (Number(curr.amount_received) || 0), 0);
    const totalPending = claims.reduce((acc, curr) => acc + (Number(curr.pending_amount) || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
                <p className="text-gray-500">Generate detailed reports with advanced filtering.</p>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Branch Filter */}
                    <div className="z-10">
                        <SearchableSelect
                            label="Branch"
                            options={branches.map((b: any) => ({
                                value: b.branch_id,
                                label: b.branch_name
                            }))}
                            value={selectedBranch}
                            onChange={(val) => {
                                // Need to manually trigger fetch or just set state and let button do it.
                                // Logic below relies on button.
                                setSelectedBranch(val);
                            }}
                            placeholder="All Branches"
                        />
                    </div>

                    {/* Month Filter */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Month</label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            <option value="ALL">All Months</option>
                            {months.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Year Filter */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Year</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            <option value="ALL">All Years</option>
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    {/* Insurance Filter */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Insurance Company</label>
                        <select
                            value={selectedInsurance}
                            onChange={(e) => setSelectedInsurance(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            <option value="ALL">All Companies</option>
                            {insuranceCompanies.map(company => (
                                <option key={company} value={company}>{company}</option>
                            ))}
                        </select>
                    </div>

                    {/* Payment Status Filter */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Payment Status</label>
                        <select
                            value={paymentFilter}
                            onChange={(e) => setPaymentFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="RECEIVED">Received (Fully Paid)</option>
                            <option value="NOT_RECEIVED">Not Received</option>
                            <option value="PENDING">Pending (Partial/Unpaid)</option>
                        </select>
                    </div>

                    {/* Condition Filter */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Risk Analysis</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            <option value="ALL">All Claims</option>
                            <option value="LOW_APPROVAL">Low Approval (&lt; 60%)</option>
                            <option value="LOW_RECEIVED">Low Received (&lt; 80%)</option>
                        </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-end gap-2">
                        <button
                            onClick={() => fetchReports(1)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm h-[42px]"
                        >
                            <Filter className="w-4 h-4" />
                            Filter
                        </button>
                        <button
                            onClick={handleDownload}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm h-[42px]"
                            title="Download Excel"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500 font-medium">Claims (Page)</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{totalClaims}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500 font-medium">Bill Amount (Page)</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(totalBill)}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500 font-medium">Received Amount (Page)</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(totalReceived)}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500 font-medium">Pending Amount (Page)</p>
                    <p className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(totalPending)}</p>
                </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-sm text-gray-600 whitespace-nowrap">
                        <thead className="bg-gray-50 text-gray-900 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 min-w-[60px]">S.No</th>
                                <th className="px-4 py-3 min-w-[100px]">IP No</th>
                                <th className="px-4 py-3 min-w-[180px]">Patient Name</th>
                                <th className="px-4 py-3 min-w-[150px]">Dr Name</th>
                                <th className="px-4 py-3 min-w-[150px]">Insurance</th>
                                <th className="px-4 py-3 min-w-[120px]">Admn Date</th>
                                <th className="px-4 py-3 min-w-[120px]">Disch Date</th>
                                <th className="px-4 py-3 min-w-[120px] text-right">Bill Amt</th>
                                <th className="px-4 py-3 min-w-[120px] text-right">Appr Amt</th>
                                <th className="px-4 py-3 min-w-[120px] text-right">Amt Recd</th>
                                <th className="px-4 py-3 min-w-[120px] text-right">Pending</th>
                                <th className="px-4 py-3 min-w-[100px] text-right">TDS</th>
                                <th className="px-4 py-3 min-w-[100px] text-right">MOC</th>
                                <th className="px-4 py-3 min-w-[100px] text-right">Co-Pay</th>
                                <th className="px-4 py-3 min-w-[100px] text-right">Discount</th>
                                <th className="px-4 py-3 min-w-[100px] text-right">Advance</th>
                                <th className="px-4 py-3 min-w-[120px]">Approval No</th>
                                <th className="px-4 py-3 min-w-[100px]">Dept</th>
                                <th className="px-4 py-3 min-w-[150px]">Bank Name</th>
                                <th className="px-4 py-3 min-w-[120px]">Txn Date</th>
                                <th className="px-4 py-3 min-w-[120px]">UTR No</th>
                                <th className="px-4 py-3 min-w-[200px]">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={21} className="px-6 py-8 text-center text-gray-500">
                                        Loading reports...
                                    </td>
                                </tr>
                            ) : claims.length === 0 ? (
                                <tr>
                                    <td colSpan={21} className="px-6 py-8 text-center text-gray-500">
                                        No claims found matching filters.
                                    </td>
                                </tr>
                            ) : (
                                claims.map((claim) => (
                                    <tr key={claim.claim_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-gray-500">{claim.s_no}</td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{claim.ip_no}</td>
                                        <td className="px-4 py-3">{claim.patient_name}</td>
                                        <td className="px-4 py-3">{claim.doctor_name}</td>
                                        <td className="px-4 py-3">{claim.insurance_name}</td>
                                        <td className="px-4 py-3">{formatDate(claim.admission_date)}</td>
                                        <td className="px-4 py-3">{formatDate(claim.discharge_date)}</td>

                                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(Number(claim.bill_amount) || 0)}</td>

                                        {/* Conditional Approval */}
                                        <td className={`px-4 py-3 text-right ${(Number(claim.approval_amount) || 0) < (Number(claim.bill_amount) || 0) * 0.6
                                            ? 'text-red-600 font-bold'
                                            : 'text-gray-900'
                                            }`}>
                                            {formatCurrency(Number(claim.approval_amount) || 0)}
                                        </td>

                                        {/* Conditional Received */}
                                        <td className={`px-4 py-3 text-right ${(Number(claim.amount_received) || 0) < (Number(claim.approval_amount) || 0) * 0.8
                                            ? 'text-red-600 font-bold'
                                            : 'text-green-600'
                                            }`}>
                                            {formatCurrency(Number(claim.amount_received) || 0)}
                                        </td>

                                        <td className="px-4 py-3 text-right text-red-600 font-medium">{formatCurrency(Number(claim.pending_amount) || 0)}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(Number(claim.tds) || 0)}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(Number(claim.co_pay) || 0)}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(Number(claim.discount) || 0)}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(Number(claim.advance_amount) || 0)}</td>

                                        <td className="px-4 py-3">{claim.approval_no}</td>
                                        <td className="px-4 py-3">{claim.department}</td>
                                        <td className="px-4 py-3">{claim.bank_name}</td>
                                        <td className="px-4 py-3">{formatDate(claim.transaction_date)}</td>
                                        <td className="px-4 py-3">{claim.utr_no}</td>
                                        <td className="px-4 py-3">{claim.remarks}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1 || loading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || loading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
