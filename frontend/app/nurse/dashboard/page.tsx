'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/AuthContext';
import { 
    fetchLabOrders, 
    fetchOPDEntries, 
    searchPatients,
    updateLabOrderStatus,
    assignNurseToOrder,
    LabOrder, 
    StatusCounts, 
    OPDEntry,
    Patient 
} from '../../../lib/api/nurse';
import { 
    Clock, 
    Beaker, 
    Sun, 
    Moon, 
    CheckCircle2, 
    Play,
    Search,
    RefreshCw,
    Loader2,
    AlertTriangle,
    User,
    Stethoscope,
    Calendar,
    ArrowRight,
    Phone,
    Activity,
    ClipboardList,
    UserPlus,
    XCircle
} from 'lucide-react';

// Priority color mappings
const priorityColors = {
    'STAT': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    'Urgent': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
    'Routine': { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' }
};

const statusColors = {
    'Ordered': { bg: 'bg-blue-100', text: 'text-blue-700', shadow: 'shadow-[3px_3px_0px_0px_rgba(59,130,246,0.5)]' },
    'In-Progress': { bg: 'bg-amber-100', text: 'text-amber-700', shadow: 'shadow-[3px_3px_0px_0px_rgba(245,158,11,0.5)]' },
    'Completed': { bg: 'bg-emerald-100', text: 'text-emerald-700', shadow: 'shadow-[3px_3px_0px_0px_rgba(16,185,129,0.5)]' },
    'Cancelled': { bg: 'bg-slate-100', text: 'text-slate-500', shadow: 'shadow-[3px_3px_0px_0px_rgba(148,163,184,0.5)]' }
};

export default function NurseDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    
    // State
    const [shift, setShift] = useState<'Day' | 'Night'>('Day');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Data state
    const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
    const [statusCounts, setStatusCounts] = useState<StatusCounts>({ Ordered: 0, 'In-Progress': 0, Completed: 0, Cancelled: 0 });
    const [opdEntries, setOpdEntries] = useState<OPDEntry[]>([]);
    const [activeFilter, setActiveFilter] = useState<'all' | 'mine' | 'unassigned' | 'urgent'>('all');
    
    // Patient search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Patient[]>([]);
    const [searching, setSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    
    // Current date/time
    const [currentTime, setCurrentTime] = useState(new Date());

    // Get nurse_id from user
    const nurseId = user?.nurse_id;

    // Auto-detect shift based on time
    useEffect(() => {
        const hour = new Date().getHours();
        setShift(hour >= 7 && hour < 19 ? 'Day' : 'Night');
        
        // Update time every minute
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        
        return () => clearInterval(timer);
    }, []);

    // Fetch dashboard data
    const fetchDashboardData = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication required');
                return;
            }

            // Fetch lab orders (include completed for today's count)
            const [ordersResponse, opdResponse] = await Promise.all([
                fetchLabOrders({ includeCompleted: true }),
                fetchOPDEntries().catch(() => ({ data: { opdEntries: [] } })) // Graceful fallback
            ]);

            if (ordersResponse.status === 'success') {
                setLabOrders(ordersResponse.data.orders || []);
                setStatusCounts(ordersResponse.data.counts || { Ordered: 0, 'In-Progress': 0, Completed: 0, Cancelled: 0 });
            }

            if (opdResponse.status === 'success') {
                setOpdEntries(opdResponse.data.opdEntries || []);
            }
        } catch (err: any) {
            console.error('Dashboard fetch error:', err);
            setError(err.response?.data?.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Auto-refresh every 60 seconds
    useEffect(() => {
        const refreshInterval = setInterval(() => {
            fetchDashboardData(true);
        }, 60000);

        return () => clearInterval(refreshInterval);
    }, [fetchDashboardData]);

    // Patient search handler
    const handleSearch = useCallback(async (query: string) => {
        setSearchQuery(query);
        
        if (query.length < 2) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        try {
            setSearching(true);
            // General search - searches by name, phone, MRN, and patient code
            const response = await searchPatients(query);
            if (response.status === 'success') {
                setSearchResults(response.data.patients || []);
                setShowSearchResults(true);
            }
        } catch (err) {
            console.error('Search error:', err);
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    }, []);

    // Filter lab orders based on active filter
    const filteredOrders = labOrders.filter(order => {
        // Exclude completed and cancelled for main task list
        if (order.status === 'Completed' || order.status === 'Cancelled') return false;
        
        switch (activeFilter) {
            case 'mine':
                return order.assigned_nurse_id === nurseId;
            case 'unassigned':
                return !order.assigned_nurse_id;
            case 'urgent':
                return order.priority === 'STAT' || order.priority === 'Urgent';
            default:
                return true;
        }
    });

    // Calculate metrics
    const myTasksCount = labOrders.filter(o => 
        o.assigned_nurse_id === nurseId && 
        o.status !== 'Completed' && 
        o.status !== 'Cancelled'
    ).length;
    
    const pendingCount = statusCounts.Ordered || 0;
    const urgentCount = labOrders.filter(o => 
        (o.priority === 'STAT' || o.priority === 'Urgent') && 
        o.status !== 'Completed' && 
        o.status !== 'Cancelled'
    ).length;
    
    // Completed today
    const today = new Date().toISOString().split('T')[0];
    const completedTodayCount = labOrders.filter(o => 
        o.status === 'Completed' && 
        o.completed_at?.startsWith(today)
    ).length;

    // Today's OPD with pending vitals
    const todayOPD = opdEntries.filter(entry => {
        const entryDate = new Date(entry.visit_date).toISOString().split('T')[0];
        return entryDate === today;
    });

    // Handle quick actions
    const handleStartTask = async (orderId: number) => {
        try {
            await updateLabOrderStatus(orderId, 'In-Progress');
            fetchDashboardData(true);
        } catch (err) {
            console.error('Failed to start task:', err);
        }
    };

    const handleAssignToMe = async (orderId: number) => {
        if (!nurseId) return;
        try {
            await assignNurseToOrder(orderId, nurseId);
            fetchDashboardData(true);
        } catch (err) {
            console.error('Failed to assign task:', err);
        }
    };

    // Format time
    const formatTime = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        Welcome, Nurse {user?.first_name || user?.username || 'User'}
                    </h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                            shift === 'Day' 
                                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                            {shift === 'Day' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                            {shift} Shift
                        </span>
                        <span className="text-sm text-slate-500">
                            {currentTime.toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                month: 'short', 
                                day: 'numeric' 
                            })}
                            {' • '}
                            {currentTime.toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true 
                            })}
                        </span>
                    </div>
                </div>

                <button 
                    onClick={() => fetchDashboardData(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    <span className="text-sm font-medium">Refresh</span>
                </button>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <p className="text-red-700 font-medium">{error}</p>
                    <button 
                        onClick={() => fetchDashboardData()}
                        className="ml-auto text-red-600 hover:text-red-700 font-medium text-sm"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Metrics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard 
                    label="My Tasks" 
                    value={myTasksCount} 
                    icon={ClipboardList}
                    color="blue"
                    onClick={() => setActiveFilter('mine')}
                    active={activeFilter === 'mine'}
                />
                <MetricCard 
                    label="Pending Orders" 
                    value={pendingCount} 
                    icon={Clock}
                    color="amber"
                    onClick={() => setActiveFilter('unassigned')}
                    active={activeFilter === 'unassigned'}
                />
                <MetricCard 
                    label="Urgent / STAT" 
                    value={urgentCount} 
                    icon={AlertTriangle}
                    color="red"
                    onClick={() => setActiveFilter('urgent')}
                    active={activeFilter === 'urgent'}
                />
                <MetricCard 
                    label="Completed Today" 
                    value={completedTodayCount} 
                    icon={CheckCircle2}
                    color="emerald"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Lab Orders (2/3) */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Filter Tabs */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-bold text-slate-800">Lab Orders</h2>
                        </div>
                        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                            {[
                                { key: 'all', label: 'All' },
                                { key: 'mine', label: 'Mine' },
                                { key: 'unassigned', label: 'Unassigned' },
                                { key: 'urgent', label: 'Urgent' }
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveFilter(tab.key as any)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                        activeFilter === tab.key
                                            ? 'bg-white text-slate-800 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Lab Orders List */}
                    <div className="space-y-3">
                        {filteredOrders.length === 0 ? (
                            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                                <Beaker className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 font-medium">No lab orders found</p>
                                <p className="text-sm text-slate-400 mt-1">
                                    {activeFilter !== 'all' ? 'Try changing the filter' : 'Orders will appear here when created'}
                                </p>
                            </div>
                        ) : (
                            filteredOrders.slice(0, 8).map(order => (
                                <LabOrderCard 
                                    key={order.order_id}
                                    order={order}
                                    nurseId={nurseId}
                                    onStart={() => handleStartTask(order.order_id)}
                                    onAssign={() => handleAssignToMe(order.order_id)}
                                    onClick={() => router.push('/nurse/lab-schedule')}
                                />
                            ))
                        )}
                        
                        {filteredOrders.length > 8 && (
                            <button 
                                onClick={() => router.push('/nurse/lab-schedule')}
                                className="w-full py-3 text-center text-blue-600 font-medium hover:bg-blue-50 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                View All {filteredOrders.length} Orders
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Right Column (1/3) */}
                <div className="space-y-6">
                    {/* Quick Patient Search */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <Search className="w-4 h-4 text-slate-400" />
                            Quick Patient Search
                        </h3>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                                placeholder="Search by name, phone, MRN..."
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                            {searching && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                            )}
                            
                            {/* Search Results Dropdown */}
                            {showSearchResults && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                                    {searchResults.map(patient => (
                                        <button
                                            key={patient.patient_id}
                                            onClick={() => {
                                                router.push(`/nurse/patients/${patient.patient_id}`);
                                                setShowSearchResults(false);
                                            }}
                                            className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0"
                                        >
                                            <p className="font-medium text-slate-800">
                                                {patient.first_name} {patient.last_name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                MRN: {patient.mrn_number} • {patient.contact_number}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Today's OPD Patients */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Stethoscope className="w-4 h-4 text-emerald-600" />
                                Today's OPD
                            </h3>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                {todayOPD.length}
                            </span>
                        </div>
                        
                        <div className="max-h-80 overflow-y-auto">
                            {todayOPD.length === 0 ? (
                                <div className="p-6 text-center">
                                    <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-slate-500">No OPD visits today</p>
                                </div>
                            ) : (
                                todayOPD.slice(0, 10).map(entry => (
                                    <div 
                                        key={entry.opd_id}
                                        className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                                        onClick={() => router.push(`/nurse/patients/${entry.patient_id}`)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-slate-800 text-sm">
                                                    {entry.patient_name}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    Token #{entry.token_number || '-'} • Dr. {entry.doctor_name?.split(' ')[0]}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                    entry.visit_status === 'Completed' 
                                                        ? 'bg-emerald-100 text-emerald-700' 
                                                        : entry.visit_status === 'In-consultation'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {entry.visit_status}
                                                </span>
                                                {entry.vital_signs && (
                                                    <p className="text-[10px] text-emerald-600 mt-1">Vitals recorded</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        {todayOPD.length > 10 && (
                            <div className="px-4 py-2 bg-slate-50 text-center">
                                <button className="text-xs font-medium text-blue-600 hover:text-blue-700">
                                    View All {todayOPD.length} Patients
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Quick Stats Summary */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 text-white">
                        <h3 className="text-sm font-medium text-slate-400 mb-3">Today's Summary</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-300 text-sm">Total Lab Orders</span>
                                <span className="font-bold">{labOrders.filter(o => o.status !== 'Cancelled').length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-300 text-sm">In Progress</span>
                                <span className="font-bold text-amber-400">{statusCounts['In-Progress']}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-300 text-sm">OPD Patients</span>
                                <span className="font-bold">{todayOPD.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Metric Card Component
function MetricCard({ 
    label, 
    value, 
    icon: Icon, 
    color, 
    onClick, 
    active 
}: { 
    label: string; 
    value: number; 
    icon: React.ComponentType<{ className?: string }>; 
    color: 'blue' | 'amber' | 'red' | 'emerald';
    onClick?: () => void;
    active?: boolean;
}) {
    const colorClasses = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', ring: 'ring-blue-500' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', ring: 'ring-amber-500' },
        red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', ring: 'ring-red-500' },
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', ring: 'ring-emerald-500' }
    };
    
    const c = colorClasses[color];
    
    return (
        <div 
            onClick={onClick}
            className={`
                bg-white p-4 rounded-xl border shadow-sm transition-all
                ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
                ${active ? `ring-2 ${c.ring} ${c.border}` : `${c.border}`}
            `}
        >
            <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-lg ${c.bg} ${c.text}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className="text-2xl font-bold text-slate-800">{value}</span>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</p>
        </div>
    );
}

// Lab Order Card Component
function LabOrderCard({ 
    order, 
    nurseId,
    onStart,
    onAssign,
    onClick 
}: { 
    order: LabOrder;
    nurseId?: number;
    onStart: () => void;
    onAssign: () => void;
    onClick: () => void;
}) {
    const priority = priorityColors[order.priority] || priorityColors.Routine;
    const status = statusColors[order.status] || statusColors.Ordered;
    
    const isAssignedToMe = order.assigned_nurse_id === nurseId;
    const canStart = order.status === 'Ordered' && isAssignedToMe;
    const canAssign = !order.assigned_nurse_id && nurseId;
    
    return (
        <div 
            className={`
                bg-white rounded-xl border border-slate-100 p-4 
                ${status.shadow}
                hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer
            `}
            onClick={onClick}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-800 truncate">{order.test_name}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priority.bg} ${priority.text}`}>
                            {order.priority}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {order.patient_name}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>MRN: {order.mrn_number}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span>Dr. {order.doctor_name?.split(' ')[0]}</span>
                        {order.scheduled_for && (
                            <>
                                <span className="text-slate-300">•</span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(order.scheduled_for).toLocaleTimeString('en-US', { 
                                        hour: '2-digit', 
                                        minute: '2-digit',
                                        hour12: true 
                                    })}
                                </span>
                            </>
                        )}
                        {order.nurse_name && (
                            <>
                                <span className="text-slate-300">•</span>
                                <span className="text-blue-600 font-medium">
                                    {isAssignedToMe ? 'Assigned to you' : `Nurse: ${order.nurse_name.split(' ')[0]}`}
                                </span>
                            </>
                        )}
                    </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {canAssign && (
                        <button
                            onClick={onAssign}
                            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="Assign to me"
                        >
                            <UserPlus className="w-4 h-4" />
                        </button>
                    )}
                    {canStart && (
                        <button
                            onClick={onStart}
                            className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                            title="Start task"
                        >
                            <Play className="w-4 h-4" />
                        </button>
                    )}
                    {order.status === 'In-Progress' && isAssignedToMe && (
                        <button
                            className="p-2 rounded-lg bg-amber-50 text-amber-600"
                            title="In progress"
                        >
                            <Loader2 className="w-4 h-4 animate-spin" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
