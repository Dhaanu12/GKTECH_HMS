'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    FileText, BarChart3, Upload, Download, Search, Filter,
    ChevronDown, ChevronUp, Save, X, AlertCircle, CheckCircle2,
    Loader2, Calendar, Building2
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import SearchableSelect from '@/components/ui/SearchableSelect';
import HospitalBranchChart from '@/components/charts/HospitalBranchChart';
import InsurerComparisonChart from '@/components/charts/InsurerComparisonChart';
import BranchInsurerChart from '@/components/charts/BranchInsurerChart';
import InsurersDistributionChart from '@/components/charts/InsurersDistributionChart';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Claim {
    claim_id: number;
    s_no: string;
    ip_no: string;
    patient_name: string;
    doctor_name: string;
    approval_no: string;
    admission_date: string;
    discharge_date: string;
    insurance_name: string;
    bill_amount: number;
    approval_amount: number;
    amount_received: number;
    pending_amount: number;
    tds: number;
    bank_name: string;
    transaction_date: string;
    utr_no: string;
    remarks: string;
    co_pay: number;
    discount: number;
    advance_amount: number;
    is_updated: number;
}

interface Branch {
    branch_id: number;
    branch_name: string;
}

export default function ClaimsPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'claims' | 'analytics'>('claims');

    // Claims state
    const [claims, setClaims] = useState<Claim[]>([]);
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [insuranceCompanies, setInsuranceCompanies] = useState<string[]>([]);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [editingClaim, setEditingClaim] = useState<Partial<Claim> | null>(null);
    const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [saving, setSaving] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        branch_id: '',
        insurance_name: '',
        search: '',
        from_date: '',
        to_date: ''
    });

    // Upload modal state
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadBranch, setUploadBranch] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 50;

    // Analytics state
    const [analyticsSummary, setAnalyticsSummary] = useState<any>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    useEffect(() => {
        fetchBranches();
    }, []);

    useEffect(() => {
        if (activeTab === 'claims') {
            fetchClaims();
        } else if (activeTab === 'analytics') {
            fetchAnalyticsSummary();
        }

        // Handle auto-open upload modal from URL
        const params = new URLSearchParams(window.location.search);
        if (params.get('upload') === 'true') {
            setShowUploadModal(true);
            // Clean up URL without refreshing
            window.history.replaceState({}, '', window.location.pathname);
        }

        const activeParam = params.get('active');
        if (activeParam === 'analytics' || activeParam === 'claims') {
            setActiveTab(activeParam as any);
            // Clean up URL without refreshing
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [activeTab, page]);

    const fetchBranches = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/accountant/branches', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBranches(response.data.data?.branches || []);
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const fetchInsuranceCompanies = async (branchId?: string) => {
        try {
            const token = localStorage.getItem('token');
            const params = branchId ? `?branch_id=${branchId}` : '';
            const response = await axios.get(`/api/accountant/insurance-companies${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInsuranceCompanies(response.data.data || []);
        } catch (error) {
            console.error('Error fetching insurance companies:', error);
        }
    };

    const fetchClaims = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', pageSize.toString());

            if (filters.branch_id) params.append('branch_id', filters.branch_id);
            if (filters.insurance_name) params.append('insurance_name', filters.insurance_name);
            if (filters.search) params.append('search', filters.search);
            if (filters.from_date) params.append('from_date', filters.from_date);
            if (filters.to_date) params.append('to_date', filters.to_date);

            const response = await axios.get(`/api/accountant/claims?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setClaims(response.data.data || []);
            setTotalPages(response.data.pagination?.totalPages || 1);
        } catch (error) {
            console.error('Error fetching claims:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalyticsSummary = async () => {
        setAnalyticsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/accountant/analytics/insurers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAnalyticsSummary(response.data.data.summary);
        } catch (error) {
            console.error('Error fetching analytics summary:', error);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const handleApplyFilters = () => {
        setPage(1);
        fetchClaims();
    };

    const handleRowClick = (claim: Claim) => {
        if (expandedRow === claim.claim_id) {
            setExpandedRow(null);
            setEditingClaim(null);
        } else {
            setExpandedRow(claim.claim_id);
            setEditingClaim({ ...claim });
        }
        setSaveStatus(null);
    };

    const handleEditChange = (field: string, value: string | number) => {
        if (editingClaim) {
            setEditingClaim({ ...editingClaim, [field]: value });
        }
    };

    const handleSave = async () => {
        if (!editingClaim || !expandedRow) return;

        setSaving(true);
        setSaveStatus(null);

        try {
            const token = localStorage.getItem('token');
            await axios.patch(`/api/accountant/claims/${expandedRow}`, editingClaim, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSaveStatus({ type: 'success', message: 'Payment updated successfully!' });
            fetchClaims();

            setTimeout(() => {
                setExpandedRow(null);
                setEditingClaim(null);
            }, 1500);
        } catch (error: any) {
            setSaveStatus({
                type: 'error',
                message: error.response?.data?.message || 'Failed to update payment'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleUpload = async () => {
        if (!uploadFile || !uploadBranch) return;

        setUploading(true);
        setUploadResult(null);

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('file', uploadFile);
            formData.append('branch_id', uploadBranch);

            const response = await axios.post('/api/accountant/upload', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setUploadResult({
                success: true,
                message: 'Upload successful!',
                count: response.data.count || response.data.data?.length
            });

            setTimeout(() => {
                setShowUploadModal(false);
                setUploadFile(null);
                setUploadBranch('');
                setUploadResult(null);
                fetchClaims();
            }, 2000);
        } catch (error: any) {
            setUploadResult({
                success: false,
                message: error.response?.data?.message || 'Upload failed'
            });
        } finally {
            setUploading(false);
        }
    };

    const handleExportPDF = () => {
        if (claims.length === 0) return;

        const doc = new jsPDF('l', 'mm', 'a4');
        doc.setFontSize(16);
        doc.text('Insurance Claims Report', 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);

        const columns = ['IP No', 'Patient', 'Insurance', 'Bill Amt', 'Approval', 'Received', 'Pending'];
        const rows = claims.map(c => [
            c.ip_no,
            c.patient_name,
            c.insurance_name,
            `₹${c.bill_amount?.toLocaleString() || 0}`,
            `₹${c.approval_amount?.toLocaleString() || 0}`,
            `₹${c.amount_received?.toLocaleString() || 0}`,
            `₹${c.pending_amount?.toLocaleString() || 0}`
        ]);

        autoTable(doc, {
            head: [columns],
            body: rows,
            startY: 28,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [37, 99, 235] }
        });

        doc.save(`Claims_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const tabs = [
        { id: 'claims', label: 'View & Edit', icon: FileText },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Claims Management</h1>
                    <p className="text-gray-500 text-sm mt-1">View, edit, and analyze insurance claims</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-medium"
                    >
                        <Upload className="w-4 h-4" />
                        Upload
                    </button>
                    <button
                        onClick={handleExportPDF}
                        disabled={claims.length === 0}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" />
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${activeTab === tab.id
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Claims Tab */}
            {activeTab === 'claims' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex flex-wrap gap-3 items-end">
                            <div className="min-w-[160px]">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Branch</label>
                                <select
                                    value={filters.branch_id}
                                    onChange={(e) => {
                                        setFilters({ ...filters, branch_id: e.target.value });
                                        fetchInsuranceCompanies(e.target.value);
                                    }}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Branches</option>
                                    {branches.map((b) => (
                                        <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="min-w-[160px]">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Insurance</label>
                                <select
                                    value={filters.insurance_name}
                                    onChange={(e) => setFilters({ ...filters, insurance_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Insurance</option>
                                    {insuranceCompanies.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
                                <input
                                    type="date"
                                    value={filters.from_date}
                                    onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
                                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
                                <input
                                    type="date"
                                    value={filters.to_date}
                                    onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
                                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="IP No, Patient, Approval..."
                                        value={filters.search}
                                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleApplyFilters}
                                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 font-medium"
                            >
                                <Filter className="w-4 h-4" />
                                Apply
                            </button>
                        </div>
                    </div>

                    {/* Claims Table */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-600">IP No</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Patient</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Insurance</th>
                                        <th className="text-right py-3 px-4 font-semibold text-gray-600">Bill</th>
                                        <th className="text-right py-3 px-4 font-semibold text-gray-600">Received</th>
                                        <th className="text-right py-3 px-4 font-semibold text-gray-600">Pending</th>
                                        <th className="py-3 px-4"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center">
                                                <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                                                <p className="text-gray-500 mt-2">Loading claims...</p>
                                            </td>
                                        </tr>
                                    ) : claims.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-gray-500">
                                                No claims found. Try adjusting your filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        claims.map((claim) => (
                                            <>
                                                <tr
                                                    key={claim.claim_id}
                                                    onClick={() => handleRowClick(claim)}
                                                    className={`border-b border-gray-100 cursor-pointer transition-colors ${expandedRow === claim.claim_id ? 'bg-blue-50' : 'hover:bg-gray-50'
                                                        } ${claim.is_updated === 1 ? 'opacity-60' : ''}`}
                                                >
                                                    <td className="py-3 px-4 font-mono text-xs">{claim.ip_no}</td>
                                                    <td className="py-3 px-4">{claim.patient_name}</td>
                                                    <td className="py-3 px-4">
                                                        <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs">
                                                            {claim.insurance_name}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">{formatCurrency(claim.bill_amount)}</td>
                                                    <td className="py-3 px-4 text-right text-green-600">{formatCurrency(claim.amount_received)}</td>
                                                    <td className="py-3 px-4 text-right font-semibold text-red-600">{formatCurrency(claim.pending_amount)}</td>
                                                    <td className="py-3 px-4">
                                                        {expandedRow === claim.claim_id ? (
                                                            <ChevronUp className="w-4 h-4 text-gray-400" />
                                                        ) : (
                                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                                        )}
                                                    </td>
                                                </tr>

                                                {/* Expanded Edit Row */}
                                                {expandedRow === claim.claim_id && editingClaim && (
                                                    <tr className="bg-blue-50/50">
                                                        <td colSpan={7} className="p-4">
                                                            {claim.is_updated === 1 ? (
                                                                <div className="text-center py-4 text-gray-500">
                                                                    <AlertCircle className="w-5 h-5 mx-auto mb-2" />
                                                                    This claim has already been updated and cannot be modified.
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-4">
                                                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                                                        <div>
                                                                            <label className="block text-xs font-medium text-gray-600 mb-1">Amount Received</label>
                                                                            <input
                                                                                type="number"
                                                                                value={editingClaim.amount_received || ''}
                                                                                onChange={(e) => handleEditChange('amount_received', parseFloat(e.target.value) || 0)}
                                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs font-medium text-gray-600 mb-1">TDS</label>
                                                                            <input
                                                                                type="number"
                                                                                value={editingClaim.tds || ''}
                                                                                onChange={(e) => handleEditChange('tds', parseFloat(e.target.value) || 0)}
                                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs font-medium text-gray-600 mb-1">Pending Amount</label>
                                                                            <input
                                                                                type="number"
                                                                                value={editingClaim.pending_amount || ''}
                                                                                onChange={(e) => handleEditChange('pending_amount', parseFloat(e.target.value) || 0)}
                                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs font-medium text-gray-600 mb-1">Transaction Date</label>
                                                                            <input
                                                                                type="date"
                                                                                value={editingClaim.transaction_date?.split('T')[0] || ''}
                                                                                onChange={(e) => handleEditChange('transaction_date', e.target.value)}
                                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs font-medium text-gray-600 mb-1">Bank Name</label>
                                                                            <input
                                                                                type="text"
                                                                                value={editingClaim.bank_name || ''}
                                                                                onChange={(e) => handleEditChange('bank_name', e.target.value)}
                                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs font-medium text-gray-600 mb-1">UTR No</label>
                                                                            <input
                                                                                type="text"
                                                                                value={editingClaim.utr_no || ''}
                                                                                onChange={(e) => handleEditChange('utr_no', e.target.value)}
                                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
                                                                        <input
                                                                            type="text"
                                                                            value={editingClaim.remarks || ''}
                                                                            onChange={(e) => handleEditChange('remarks', e.target.value)}
                                                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                                        />
                                                                    </div>

                                                                    {saveStatus && (
                                                                        <div className={`flex items-center gap-2 p-3 rounded-lg ${saveStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                                                            }`}>
                                                                            {saveStatus.type === 'success' ? (
                                                                                <CheckCircle2 className="w-4 h-4" />
                                                                            ) : (
                                                                                <AlertCircle className="w-4 h-4" />
                                                                            )}
                                                                            {saveStatus.message}
                                                                        </div>
                                                                    )}

                                                                    <div className="flex gap-3">
                                                                        <button
                                                                            onClick={handleSave}
                                                                            disabled={saving}
                                                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                                                                        >
                                                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                                            Save Changes
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                setExpandedRow(null);
                                                                                setEditingClaim(null);
                                                                            }}
                                                                            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                                <p className="text-sm text-gray-500">
                                    Page {page} of {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
                <div className="space-y-6">
                    {/* Summary Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Total Claims</p>
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        {analyticsSummary?.total_claims?.toLocaleString() || '0'}
                                    </h3>
                                </div>
                            </div>
                            <div className="h-1 w-full bg-gray-50 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-full" />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
                                    <BarChart3 className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Total Billing</p>
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        {formatCurrency(analyticsSummary?.total_bill_amount)}
                                    </h3>
                                </div>
                            </div>
                            <div className="h-1 w-full bg-gray-50 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 w-full" />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Active Insurers</p>
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        {analyticsSummary?.total_insurers || '0'}
                                    </h3>
                                </div>
                            </div>
                            <div className="h-1 w-full bg-gray-50 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 w-full" />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Avg Claim Size</p>
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        {formatCurrency(analyticsSummary?.total_bill_amount / (analyticsSummary?.total_claims || 1))}
                                    </h3>
                                </div>
                            </div>
                            <div className="h-1 w-full bg-gray-50 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 w-full" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-blue-600" />
                                    Billing Distribution
                                </h2>
                                <span className="text-xs font-medium px-2 py-1 bg-amber-50 text-amber-600 rounded-lg">By Insurer</span>
                            </div>
                            <div>
                                <InsurersDistributionChart />
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                    Hospital & Branch distribution
                                </h2>
                                <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded-lg">Performance</span>
                            </div>
                            <div>
                                <HospitalBranchChart />
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-blue-600" />
                                    Insurer Claims Count
                                </h2>
                                <span className="text-xs font-medium px-2 py-1 bg-green-50 text-green-600 rounded-lg">Market Share</span>
                            </div>
                            <div>
                                <InsurerComparisonChart />
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-blue-600" />
                                    Branch-wise Insurer Breakdown
                                </h2>
                                <span className="text-xs font-medium px-2 py-1 bg-purple-50 text-purple-600 rounded-lg">Deep Dive</span>
                            </div>
                            <div>
                                <BranchInsurerChart />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Upload Claims</h2>
                            <button
                                onClick={() => {
                                    setShowUploadModal(false);
                                    setUploadFile(null);
                                    setUploadBranch('');
                                    setUploadResult(null);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Branch</label>
                                <select
                                    value={uploadBranch}
                                    onChange={(e) => setUploadBranch(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Select a branch...</option>
                                    {branches.map((b) => (
                                        <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Excel File</label>
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <label htmlFor="file-upload" className="cursor-pointer">
                                        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                        {uploadFile ? (
                                            <p className="text-blue-600 font-medium">{uploadFile.name}</p>
                                        ) : (
                                            <p className="text-gray-500">Click to select or drag file here</p>
                                        )}
                                    </label>
                                </div>
                            </div>

                            {uploadResult && (
                                <div className={`flex items-center gap-2 p-3 rounded-lg ${uploadResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                    }`}>
                                    {uploadResult.success ? (
                                        <CheckCircle2 className="w-4 h-4" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4" />
                                    )}
                                    {uploadResult.message}{uploadResult.count ? ` (${uploadResult.count} records)` : ''}
                                </div>
                            )}

                            <button
                                onClick={handleUpload}
                                disabled={!uploadFile || !uploadBranch || uploading}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        Upload Claims
                                    </>
                                )}
                            </button>

                            {/* Format Guide */}
                            <div className="pt-4 border-t border-gray-100">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-semibold text-gray-900">Expected File Format</h4>
                                    <a
                                        href="/templates/claims_template.xlsx"
                                        download
                                        className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100"
                                    >
                                        <Download className="w-3 h-3" />
                                        Download Template
                                    </a>
                                </div>
                                <p className="text-xs text-gray-500 mb-3">Please ensure your file headers match these fields (case-insensitive):</p>
                                <div className="flex flex-wrap gap-1.5 text-[10px] text-gray-600 transition-all">
                                    {['S NO', 'IP NO', 'PATIENT NAME', 'DR NAME', 'APPROVAL NO', 'FROM DATE ADMISSION', 'TO DATE DISCHARGE', 'DEPT', 'INSURANCE NAME', 'BILL AMOUNT', 'PENDING AMOUNT'].map(field => (
                                        <span key={field} className="bg-gray-100 px-2 py-1 rounded border border-gray-200">
                                            {field}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
