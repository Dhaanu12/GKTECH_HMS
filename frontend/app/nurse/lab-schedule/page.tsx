'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../lib/AuthContext';
import axios from 'axios';
import {
    Beaker,
    Clock,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Play,
    Upload,
    RefreshCw,
    Search,
    Filter,
    User,
    Phone,
    Calendar,
    FileText,
    ChevronDown,
    Loader2,
    Stethoscope,
    Scan,
    Syringe,
    MoreHorizontal,
    Eye,
    Download,
    Plus,
    Edit3,
    Trash2,
    ExternalLink,
    Image,
    History,
    Sparkles
} from 'lucide-react';
import { AIInsightCard, AILoadingIndicator, useAI } from '@/components/ai';
import { interpretLabResults } from '@/lib/api/ai';

interface LabOrderDocument {
    document_id: number;
    file_name: string;
    original_file_name: string;
    file_mime_type: string;
    file_size: number;
    document_type: string;
    description: string | null;
    created_at: string;
    uploaded_by_name?: string;
}

interface LabOrder {
    order_id: number;
    order_number: string;
    patient_id: number;
    patient_name: string;
    mrn_number: string;
    patient_phone: string;
    doctor_name: string;
    nurse_name: string | null;
    branch_name: string;
    test_name: string;
    test_code: string | null;
    test_category: string;
    priority: 'Routine' | 'Urgent' | 'STAT';
    status: 'Ordered' | 'In-Progress' | 'Completed' | 'Cancelled';
    ordered_at: string;
    scheduled_for: string | null;
    completed_at: string | null;
    instructions: string | null;
    notes: string | null;
    result_summary: string | null;
    is_external: boolean; // TRUE = external (medical_services), FALSE = in-house (billing_master)
}

interface StatusCounts {
    Ordered: number;
    'In-Progress': number;
    Completed: number;
    Cancelled: number;
}

interface StatusHistoryEntry {
    history_id: number;
    order_id: number;
    previous_status: string | null;
    new_status: string;
    changed_by: number;
    changed_by_username: string;
    changed_by_email: string;
    notes: string | null;
    changed_at: string;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    'Lab': Beaker,
    'Imaging': Scan,
    'Procedure': Syringe,
    'Examination': Stethoscope,
    'Other': FileText
};

const priorityColors = {
    'STAT': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    'Urgent': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
    'Routine': { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' }
};

const statusColors = {
    'Ordered': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', icon: Clock },
    'In-Progress': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', icon: Play },
    'Completed': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2 },
    'Cancelled': { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200', icon: XCircle }
};

export default function LabSchedulePage() {
    const { user } = useAuth();

    // AI context - clear patient context when on lab schedule
    const aiContext: { setPageContext?: (page: string, patient?: string) => void } = useAI() || {};

    const [orders, setOrders] = useState<LabOrder[]>([]);
    const [counts, setCounts] = useState<StatusCounts>({ Ordered: 0, 'In-Progress': 0, Completed: 0, Cancelled: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'All' | 'Ordered' | 'In-Progress' | 'Completed'>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedPriority, setSelectedPriority] = useState<string>('');
    const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
    const [showUploadModal, setShowUploadModal] = useState<LabOrder | null>(null);
    const [showViewResultsModal, setShowViewResultsModal] = useState<LabOrder | null>(null);
    const [showAddMoreModal, setShowAddMoreModal] = useState<LabOrder | null>(null);
    const [showHistoryModal, setShowHistoryModal] = useState<LabOrder | null>(null);

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');

            const params: Record<string, string> = {};
            if (activeTab !== 'All') {
                params.status = activeTab;
            }
            if (activeTab === 'Completed' || activeTab === 'All') {
                params.includeCompleted = 'true';
            }
            if (selectedCategory) {
                params.category = selectedCategory;
            }
            if (selectedPriority) {
                params.priority = selectedPriority;
            }

            const response = await axios.get('http://localhost:5000/api/lab-orders', {
                headers: { Authorization: `Bearer ${token}` },
                params
            });

            setOrders(response.data.data.orders);
            setCounts(response.data.data.counts);
        } catch (err: unknown) {
            console.error('Error fetching lab orders:', err);
            setError('Failed to load lab orders');
        } finally {
            setLoading(false);
        }
    }, [activeTab, selectedCategory, selectedPriority]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Set AI context for lab schedule page (clears patient-specific context)
    useEffect(() => {
        if (aiContext.setPageContext && !loading) {
            const labContext = `Viewing Lab Schedule page. ` +
                `Summary: ${counts.Ordered} ordered, ${counts['In-Progress']} in-progress, ${counts.Completed} completed. ` +
                `Total orders displayed: ${orders.length}. ` +
                `Note: This is a list of lab orders. No specific patient is currently selected. ` +
                `To help with a specific patient, ask for the patient name or MRN, or use searchPatients tool.`;
            aiContext.setPageContext('/nurse/lab-schedule', labContext);
        }
    }, [aiContext.setPageContext, loading, counts, orders.length]);

    const updateStatus = async (orderId: number, newStatus: string) => {
        try {
            setUpdatingOrderId(orderId);
            const token = localStorage.getItem('token');

            await axios.patch(
                `http://localhost:5000/api/lab-orders/${orderId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            await fetchOrders();
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update status');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const assignToMe = async (orderId: number) => {
        try {
            setUpdatingOrderId(orderId);
            const token = localStorage.getItem('token');

            await axios.patch(
                `http://localhost:5000/api/lab-orders/${orderId}/assign`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            await fetchOrders();
        } catch (err) {
            console.error('Error assigning order:', err);
            alert('Failed to assign order');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const filteredOrders = orders.filter(order => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            order.patient_name?.toLowerCase().includes(search) ||
            order.mrn_number?.toLowerCase().includes(search) ||
            order.test_name?.toLowerCase().includes(search) ||
            order.order_number?.toLowerCase().includes(search)
        );
    });

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    const isOverdue = (order: LabOrder) => {
        if (order.status === 'Completed' || order.status === 'Cancelled') return false;
        if (!order.scheduled_for) return false;
        return new Date(order.scheduled_for) < new Date();
    };

    const tabs = [
        { id: 'All', label: 'All Orders', count: counts.Ordered + counts['In-Progress'] + counts.Completed },
        { id: 'Ordered', label: 'Pending', count: counts.Ordered },
        { id: 'In-Progress', label: 'In Progress', count: counts['In-Progress'] },
        { id: 'Completed', label: 'Completed', count: counts.Completed }
    ];

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Lab Schedule</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Manage lab tests, imaging, and procedures ordered for patients
                    </p>
                </div>
                <button
                    onClick={fetchOrders}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span className="font-medium text-sm">Refresh</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#146AF5] p-5 rounded-2xl shadow-sm text-white">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2.5 rounded-xl bg-white/20 text-white backdrop-blur-sm">
                            <Clock className="w-5 h-5" />
                        </div>
                        <span className="text-3xl font-bold text-white">{counts.Ordered}</span>
                    </div>
                    <p className="text-xs font-bold text-white/90 uppercase tracking-wider">Pending</p>
                </div>
                <div className="bg-[#D97706] p-5 rounded-2xl shadow-sm text-white">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2.5 rounded-xl bg-white/20 text-white backdrop-blur-sm">
                            <Play className="w-5 h-5" />
                        </div>
                        <span className="text-3xl font-bold text-white">{counts['In-Progress']}</span>
                    </div>
                    <p className="text-xs font-bold text-white/90 uppercase tracking-wider">In Progress</p>
                </div>
                <div className="bg-[#009A66] p-5 rounded-2xl shadow-sm text-white">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2.5 rounded-xl bg-white/20 text-white backdrop-blur-sm">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <span className="text-3xl font-bold text-white">{counts.Completed}</span>
                    </div>
                    <p className="text-xs font-bold text-white/90 uppercase tracking-wider">Completed Today</p>
                </div>
                <div className="bg-[#D11C5F] p-5 rounded-2xl shadow-sm text-white">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2.5 rounded-xl bg-white/20 text-white backdrop-blur-sm">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <span className="text-3xl font-bold text-white">
                            {orders.filter(o => o.priority === 'STAT' && o.status !== 'Completed').length}
                        </span>
                    </div>
                    <p className="text-xs font-bold text-white/90 uppercase tracking-wider">STAT Orders</p>
                </div>
            </div>

            {/* Tabs and Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Tab Header */}
                <div className="flex items-center justify-between border-b border-slate-100 p-4">
                    <div className="flex gap-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                {tab.label}
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-blue-500' : 'bg-slate-200'
                                    }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by patient, MRN, or test..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div className="relative">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="appearance-none pl-4 pr-10 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                        >
                            <option value="">All Categories</option>
                            <option value="Lab">Lab</option>
                            <option value="Imaging">Imaging</option>
                            <option value="Procedure">Procedure</option>
                            <option value="Examination">Examination</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                    <div className="relative">
                        <select
                            value={selectedPriority}
                            onChange={(e) => setSelectedPriority(e.target.value)}
                            className="appearance-none pl-4 pr-10 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                        >
                            <option value="">All Priorities</option>
                            <option value="STAT">STAT</option>
                            <option value="Urgent">Urgent</option>
                            <option value="Routine">Routine</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* Orders List */}
                <div className="divide-y divide-slate-100">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            <span className="ml-3 text-slate-500">Loading orders...</span>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 text-red-500">
                            <AlertTriangle className="w-12 h-12 mb-3" />
                            <p>{error}</p>
                            <button onClick={fetchOrders} className="mt-4 text-blue-600 hover:underline">
                                Try again
                            </button>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <Beaker className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-lg font-medium">No lab orders found</p>
                            <p className="text-sm">Orders will appear here when doctors request tests</p>
                        </div>
                    ) : (
                        filteredOrders.map(order => {
                            const CategoryIcon = categoryIcons[order.test_category] || FileText;
                            const priorityStyle = priorityColors[order.priority];
                            const statusStyle = statusColors[order.status];
                            const StatusIcon = statusStyle.icon;
                            const overdue = isOverdue(order);

                            return (
                                <div
                                    key={order.order_id}
                                    className={`p-4 hover:bg-slate-50 transition-all ${overdue ? 'bg-red-50/50' : ''}`}
                                >
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                                        {/* Left: Test Info */}
                                        <div className="flex items-start gap-3 lg:col-span-5">
                                            <div className={`p-3 rounded-xl ${priorityStyle.bg} ${priorityStyle.text} shrink-0`}>
                                                <CategoryIcon className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-semibold text-slate-800 line-clamp-2">{order.test_name}</h3>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap ${priorityStyle.bg} ${priorityStyle.text}`}>
                                                        {order.priority}
                                                    </span>
                                                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${statusStyle.bg} ${statusStyle.text}`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {order.status}
                                                    </span>
                                                    {overdue && (
                                                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 whitespace-nowrap">
                                                            OVERDUE
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    {order.order_number} • {order.test_category}
                                                    {order.test_code && ` • ${order.test_code}`}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Middle: Patient Info */}
                                        <div className="flex items-center gap-6 text-sm lg:col-span-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                    {order.patient_name?.charAt(0) || 'P'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-700">{order.patient_name}</p>
                                                    <p className="text-xs text-slate-400">{order.mrn_number}</p>
                                                </div>
                                            </div>
                                            <div className="hidden md:block whitespace-nowrap">
                                                <p className="text-slate-500">
                                                    <span className="text-xs text-slate-400">Ordered:</span>{' '}
                                                    {formatDate(order.ordered_at)} {formatTime(order.ordered_at)}
                                                </p>
                                                {order.scheduled_for && (
                                                    <p className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
                                                        Scheduled: {formatDate(order.scheduled_for)} {formatTime(order.scheduled_for)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right: Actions */}
                                        <div className="flex items-center gap-2 lg:col-span-3 lg:justify-end flex-wrap">
                                            {/* Only show Start/Assign buttons for IN-HOUSE services (is_external = FALSE) */}
                                            {order.status === 'Ordered' && !order.is_external && (
                                                <>
                                                    <button
                                                        onClick={() => updateStatus(order.order_id, 'In-Progress')}
                                                        disabled={updatingOrderId === order.order_id}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all disabled:opacity-50 whitespace-nowrap"
                                                    >
                                                        {updatingOrderId === order.order_id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Play className="w-4 h-4" />
                                                        )}
                                                        Start
                                                    </button>
                                                    {!order.nurse_name && (
                                                        <button
                                                            onClick={() => assignToMe(order.order_id)}
                                                            disabled={updatingOrderId === order.order_id}
                                                            className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all whitespace-nowrap"
                                                        >
                                                            Assign to me
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                            {/* Show badge for external services */}
                                            {order.status === 'Ordered' && order.is_external && (
                                                <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold border border-amber-200 whitespace-nowrap">
                                                    External Service
                                                </span>
                                            )}
                                            {/* Only show Upload/Complete buttons for IN-HOUSE services */}
                                            {order.status === 'In-Progress' && !order.is_external && (
                                                <>
                                                    <button
                                                        onClick={() => setShowUploadModal(order)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all whitespace-nowrap"
                                                    >
                                                        <Upload className="w-4 h-4" />
                                                        Upload Result
                                                    </button>
                                                    <button
                                                        onClick={() => updateStatus(order.order_id, 'Completed')}
                                                        disabled={updatingOrderId === order.order_id}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-50 transition-all disabled:opacity-50 whitespace-nowrap"
                                                    >
                                                        {updatingOrderId === order.order_id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        )}
                                                        Complete
                                                    </button>
                                                </>
                                            )}
                                            {/* Show badge for external services in progress */}
                                            {order.status === 'In-Progress' && order.is_external && (
                                                <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold border border-amber-200 whitespace-nowrap">
                                                    External Service - In Progress
                                                </span>
                                            )}
                                            {order.status === 'Completed' && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setShowViewResultsModal(order)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-all whitespace-nowrap"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        View Results
                                                    </button>
                                                    <button
                                                        onClick={() => setShowAddMoreModal(order)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all whitespace-nowrap"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                        Add More
                                                    </button>
                                                </div>
                                            )}
                                            {/* View History button - available for all statuses */}
                                            <button
                                                onClick={() => setShowHistoryModal(order)}
                                                className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                                                title="View Status History"
                                            >
                                                <History className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Instructions Row */}
                                    {order.instructions && (
                                        <div className="mt-3 ml-14 p-2 bg-amber-50 rounded-lg border border-amber-100">
                                            <p className="text-xs text-amber-700">
                                                <span className="font-semibold">Instructions:</span> {order.instructions}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Upload Result Modal */}
            {showUploadModal && (
                <UploadResultModal
                    order={showUploadModal}
                    onClose={() => setShowUploadModal(null)}
                    onSuccess={() => {
                        setShowUploadModal(null);
                        fetchOrders();
                    }}
                />
            )}

            {/* View Results Modal */}
            {showViewResultsModal && (
                <ViewResultsModal
                    order={showViewResultsModal}
                    onClose={() => setShowViewResultsModal(null)}
                />
            )}

            {/* Add More Documents Modal */}
            {showAddMoreModal && (
                <AddMoreModal
                    order={showAddMoreModal}
                    onClose={() => setShowAddMoreModal(null)}
                    onSuccess={() => {
                        setShowAddMoreModal(null);
                        fetchOrders();
                    }}
                />
            )}

            {/* View Status History Modal */}
            {showHistoryModal && (
                <ViewHistoryModal
                    order={showHistoryModal}
                    onClose={() => setShowHistoryModal(null)}
                />
            )}
        </div>
    );
}

// Upload Result Modal Component
function UploadResultModal({
    order,
    onClose,
    onSuccess
}: {
    order: LabOrder;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [resultSummary, setResultSummary] = useState('');
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async () => {
        try {
            setUploading(true);
            setError(null);
            const token = localStorage.getItem('token');

            // Upload file if present
            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('patient_id', order.patient_id.toString());
                formData.append('lab_order_id', order.order_id.toString());
                formData.append('document_type', 'Lab Result');
                formData.append('description', description || `Result for ${order.test_name}`);

                await axios.post('http://localhost:5000/api/patient-documents', formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
            }

            // Update result summary if provided
            if (resultSummary) {
                await axios.patch(
                    `http://localhost:5000/api/lab-orders/${order.order_id}/result`,
                    { result_summary: resultSummary },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }

            // Mark as completed
            await axios.patch(
                `http://localhost:5000/api/lab-orders/${order.order_id}/status`,
                { status: 'Completed' },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            onSuccess();
        } catch (err: unknown) {
            console.error('Upload error:', err);
            const axiosError = err as { response?: { data?: { message?: string } } };
            setError(axiosError.response?.data?.message || 'Failed to upload result');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">Upload Lab Result</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        {order.test_name} for {order.patient_name}
                    </p>
                </div>

                <div className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Result Document (PDF or Image)
                        </label>
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive
                                ? 'border-blue-500 bg-blue-50'
                                : file
                                    ? 'border-emerald-300 bg-emerald-50'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            {file ? (
                                <div className="flex items-center justify-center gap-3">
                                    <FileText className="w-8 h-8 text-emerald-600" />
                                    <div className="text-left">
                                        <p className="font-medium text-slate-700">{file.name}</p>
                                        <p className="text-xs text-slate-500">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setFile(null)}
                                        className="text-slate-400 hover:text-red-500"
                                    >
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                                    <p className="text-slate-600 font-medium">
                                        Drag and drop your file here
                                    </p>
                                    <p className="text-sm text-slate-400 mt-1">or</p>
                                    <label className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-blue-700 transition-all">
                                        Browse Files
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*,application/pdf"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        />
                                    </label>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Result Summary */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Result Summary
                        </label>
                        <textarea
                            value={resultSummary}
                            onChange={(e) => setResultSummary(e.target.value)}
                            placeholder="Enter a brief summary of the test results..."
                            rows={3}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            File Description (Optional)
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g., Blood test results - CBC"
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={uploading}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={uploading || (!file && !resultSummary)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                Complete & Upload
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// View Results Modal Component
function ViewResultsModal({
    order,
    onClose
}: {
    order: LabOrder;
    onClose: () => void;
}) {
    const [documents, setDocuments] = useState<LabOrderDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloading, setDownloading] = useState<number | null>(null);

    // AI interpretation state
    const [aiInterpretation, setAiInterpretation] = useState<string | null>(null);
    const [aiInterpretationLoading, setAiInterpretationLoading] = useState(false);

    const handleAIInterpret = async () => {
        if (!order.result_summary && !order.test_name) return;

        setAiInterpretationLoading(true);
        setAiInterpretation(null);

        try {
            const result = await interpretLabResults(
                order.test_name,
                order.result_summary || undefined,
                undefined,
                undefined
            );

            if (result.success) {
                setAiInterpretation(result.message);
            } else {
                setAiInterpretation(result.message);
            }
        } catch (err) {
            setAiInterpretation('Failed to interpret results. Please try again.');
        } finally {
            setAiInterpretationLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [order.order_id]);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:5000/api/patient-documents/lab-order/${order.order_id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.status === 'success') {
                setDocuments(response.data.data.documents || []);
            }
        } catch (err) {
            console.error('Failed to fetch documents:', err);
            setError('Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (doc: LabOrderDocument) => {
        try {
            setDownloading(doc.document_id);
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:5000/api/patient-documents/${doc.document_id}/download`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob'
                }
            );

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', doc.original_file_name);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed:', err);
            alert('Failed to download file');
        } finally {
            setDownloading(null);
        }
    };

    const handleView = async (doc: LabOrderDocument) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:5000/api/patient-documents/${doc.document_id}/view`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob'
                }
            );

            // Open in new tab
            const url = window.URL.createObjectURL(new Blob([response.data], { type: doc.file_mime_type }));
            window.open(url, '_blank');
        } catch (err) {
            console.error('View failed:', err);
            alert('Failed to view file');
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isImage = (mimeType: string) => mimeType.startsWith('image/');
    const isPdf = (mimeType: string) => mimeType === 'application/pdf';

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Lab Results</h2>
                            <p className="text-sm text-slate-500 mt-1">
                                {order.test_name} for {order.patient_name}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <XCircle className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* Result Summary */}
                    {order.result_summary && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Result Summary
                                </h3>
                                <button
                                    onClick={handleAIInterpret}
                                    disabled={aiInterpretationLoading}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50"
                                    title="Get AI interpretation of results"
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    {aiInterpretationLoading ? 'Interpreting...' : 'AI Interpret'}
                                </button>
                            </div>
                            <p className="text-sm text-emerald-700 whitespace-pre-wrap">
                                {order.result_summary}
                            </p>
                        </div>
                    )}

                    {/* AI Interpretation */}
                    {aiInterpretationLoading && (
                        <div className="mb-6">
                            <AILoadingIndicator text="Interpreting lab results..." />
                        </div>
                    )}
                    {aiInterpretation && !aiInterpretationLoading && (
                        <div className="mb-6">
                            <AIInsightCard
                                title="AI Interpretation"
                                content={aiInterpretation}
                                type="info"
                                onDismiss={() => setAiInterpretation(null)}
                            />
                        </div>
                    )}

                    {/* Documents */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Uploaded Documents ({documents.length})
                        </h3>

                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                <span className="ml-2 text-slate-500">Loading documents...</span>
                            </div>
                        ) : error ? (
                            <div className="text-center py-8 text-red-500">
                                <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                                <p>{error}</p>
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p className="font-medium">No documents uploaded</p>
                                <p className="text-sm mt-1">Result summary is available above</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {documents.map(doc => (
                                    <div
                                        key={doc.document_id}
                                        className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className={`p-2 rounded-lg ${isPdf(doc.file_mime_type)
                                                ? 'bg-red-100 text-red-600'
                                                : isImage(doc.file_mime_type)
                                                    ? 'bg-blue-100 text-blue-600'
                                                    : 'bg-slate-200 text-slate-600'
                                                }`}>
                                                {isPdf(doc.file_mime_type) ? (
                                                    <FileText className="w-5 h-5" />
                                                ) : isImage(doc.file_mime_type) ? (
                                                    <Image className="w-5 h-5" />
                                                ) : (
                                                    <FileText className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-800 truncate">
                                                    {doc.original_file_name}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                    <span>{formatFileSize(doc.file_size)}</span>
                                                    <span>•</span>
                                                    <span>{formatDate(doc.created_at)}</span>
                                                    {doc.description && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="truncate">{doc.description}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 ml-3">
                                            <button
                                                onClick={() => handleView(doc)}
                                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                title="View"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDownload(doc)}
                                                disabled={downloading === doc.document_id}
                                                className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50"
                                                title="Download"
                                            >
                                                {downloading === doc.document_id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Download className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// Add More Documents Modal Component
function AddMoreModal({
    order,
    onClose,
    onSuccess
}: {
    order: LabOrder;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [resultSummary, setResultSummary] = useState(order.result_summary || '');
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async () => {
        try {
            setUploading(true);
            setError(null);
            const token = localStorage.getItem('token');

            // Upload file if present
            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('patient_id', order.patient_id.toString());
                formData.append('lab_order_id', order.order_id.toString());
                formData.append('document_type', 'Lab Result');
                formData.append('description', description || `Additional result for ${order.test_name}`);

                await axios.post('http://localhost:5000/api/patient-documents', formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
            }

            // Update result summary if changed
            if (resultSummary !== order.result_summary) {
                await axios.patch(
                    `http://localhost:5000/api/lab-orders/${order.order_id}/result`,
                    { result_summary: resultSummary },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }

            onSuccess();
        } catch (err: unknown) {
            console.error('Upload error:', err);
            const axiosError = err as { response?: { data?: { message?: string } } };
            setError(axiosError.response?.data?.message || 'Failed to update');
        } finally {
            setUploading(false);
        }
    };

    const hasChanges = file || resultSummary !== order.result_summary;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">Add More Results</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        {order.test_name} for {order.patient_name}
                    </p>
                </div>

                <div className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Additional Document (Optional)
                        </label>
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${dragActive
                                ? 'border-blue-500 bg-blue-50'
                                : file
                                    ? 'border-emerald-300 bg-emerald-50'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            {file ? (
                                <div className="flex items-center justify-center gap-3">
                                    <FileText className="w-6 h-6 text-emerald-600" />
                                    <div className="text-left">
                                        <p className="font-medium text-slate-700">{file.name}</p>
                                        <p className="text-xs text-slate-500">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setFile(null)}
                                        className="text-slate-400 hover:text-red-500"
                                    >
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                    <p className="text-sm text-slate-600">
                                        Drag and drop or{' '}
                                        <label className="text-blue-600 cursor-pointer hover:underline">
                                            browse
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*,application/pdf"
                                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                            />
                                        </label>
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* File Description */}
                    {file && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                File Description
                            </label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="e.g., Follow-up test results"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    )}

                    {/* Result Summary */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Update Result Summary
                        </label>
                        <textarea
                            value={resultSummary}
                            onChange={(e) => setResultSummary(e.target.value)}
                            placeholder="Enter or update the result summary..."
                            rows={4}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                        />
                        {order.result_summary && resultSummary !== order.result_summary && (
                            <p className="text-xs text-amber-600 mt-1">
                                Summary will be updated
                            </p>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={uploading}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={uploading || !hasChanges}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// View Status History Modal Component
function ViewHistoryModal({
    order,
    onClose
}: {
    order: LabOrder;
    onClose: () => void;
}) {
    const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                setError(null);
                const token = localStorage.getItem('token');

                const response = await axios.get(`http://localhost:5000/api/lab-orders/${order.order_id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setHistory(response.data.data.statusHistory || []);
            } catch (err) {
                console.error('Error fetching status history:', err);
                setError('Failed to load status history');
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [order.order_id]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Ordered': return 'bg-blue-500';
            case 'In-Progress': return 'bg-amber-500';
            case 'Completed': return 'bg-emerald-500';
            case 'Cancelled': return 'bg-slate-400';
            default: return 'bg-slate-400';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Ordered': return Clock;
            case 'In-Progress': return Play;
            case 'Completed': return CheckCircle2;
            case 'Cancelled': return XCircle;
            default: return Clock;
        }
    };

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-xl">
                {/* Header */}
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-xl">
                                <History className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Status History</h2>
                                <p className="text-sm text-slate-500">{order.order_number} - {order.test_name}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                        >
                            <XCircle className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                            <p className="text-slate-600">{error}</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12">
                            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">No status history available</p>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-[18px] top-6 bottom-6 w-0.5 bg-slate-200" />

                            {/* Timeline entries */}
                            <div className="space-y-6">
                                {history.map((entry, index) => {
                                    const StatusIcon = getStatusIcon(entry.new_status);
                                    const { date, time } = formatDateTime(entry.changed_at);

                                    return (
                                        <div key={entry.history_id} className="relative flex gap-4">
                                            {/* Timeline dot */}
                                            <div className={`relative z-10 w-9 h-9 rounded-full ${getStatusColor(entry.new_status)} flex items-center justify-center shadow-md`}>
                                                <StatusIcon className="w-4 h-4 text-white" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 pb-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {entry.previous_status ? (
                                                                <>
                                                                    <span className="text-sm text-slate-500">{entry.previous_status}</span>
                                                                    <span className="text-slate-400">→</span>
                                                                    <span className="text-sm font-semibold text-slate-800">{entry.new_status}</span>
                                                                </>
                                                            ) : (
                                                                <span className="text-sm font-semibold text-slate-800">
                                                                    Created as {entry.new_status}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            by {entry.changed_by_username || 'System'}
                                                        </p>
                                                    </div>
                                                    <div className="text-right text-xs text-slate-400 whitespace-nowrap">
                                                        <p>{date}</p>
                                                        <p>{time}</p>
                                                    </div>
                                                </div>
                                                {entry.notes && (
                                                    <div className="mt-2 p-2 bg-slate-50 rounded-lg">
                                                        <p className="text-xs text-slate-600">{entry.notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
