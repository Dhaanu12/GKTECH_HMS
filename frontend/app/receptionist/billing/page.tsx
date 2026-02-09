'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Calendar, Filter, Printer, Eye, CreditCard, Clock, CheckCircle, User, FileText, Stethoscope, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import InvoiceTemplate from '@/components/billing/InvoiceTemplate';
import BillingModal from '@/components/billing/BillingModal';

export default function BillingPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'paid' | 'pending' | 'cancelled'>('pending');
    const [bills, setBills] = useState([]);
    const [pendingItems, setPendingItems] = useState([]);
    const [cancelledBills, setCancelledBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    // Default to today's date formatted as YYYY-MM-DD
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Modals
    const [selectedBill, setSelectedBill] = useState<any>(null);
    const [showInvoice, setShowInvoice] = useState(false);

    const [selectedPendingOpd, setSelectedPendingOpd] = useState<any>(null);
    const [showBillingModal, setShowBillingModal] = useState(false);


    useEffect(() => {
        fetchAllData();
    }, [search, selectedDate]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchBills(), fetchPendingClearances(), fetchCancelledBills()]);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBills = async () => {
        try {
            const token = localStorage.getItem('token');
            const params: any = {};
            if (search) params.search = search;
            if (selectedDate) {
                params.startDate = selectedDate;
                params.endDate = selectedDate;
            }
            params.status = 'Paid';

            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/billing`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });

            setBills(response.data.data.bills);
        } catch (error) {
            console.error('Error fetching bills:', error);
        }
    };

    const fetchPendingClearances = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/billing/pending-clearances`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Filter locally for search if needed, as the endpoint might not support search yet
            let data = response.data.data.pending;
            if (search) {
                const lowerSearch = search.toLowerCase();
                data = data.filter((item: any) =>
                    item.patient_name?.toLowerCase().includes(lowerSearch) ||
                    item.mrn_number?.toLowerCase().includes(lowerSearch) ||
                    item.bill_number?.toLowerCase().includes(lowerSearch)
                );
            }
            setPendingItems(data);
        } catch (error) {
            console.error('Error fetching pending items:', error);
        }
    };

    const fetchCancelledBills = async () => {
        try {
            const token = localStorage.getItem('token');
            const params: any = {};
            if (search) params.search = search;
            if (selectedDate) {
                params.startDate = selectedDate;
                params.endDate = selectedDate;
            }
            params.status = 'Cancelled';

            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/billing`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });

            setCancelledBills(response.data.data.bills);
        } catch (error) {
            console.error('Error fetching cancelled bills:', error);
        }
    };

    const handleViewInvoice = async (billId: number) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/billing/${billId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Merge bill and items
            setSelectedBill({
                ...response.data.data.bill,
                items: response.data.data.items
            });
            setShowInvoice(true);
        } catch (error) {
            console.error('Error fetching bill details:', error);
        }
    };

    const handleProcessBill = (item: any) => {
        setSelectedPendingOpd({
            opd_id: item.opd_id,
            opd_number: item.opd_number,
            bill_master_id: item.bill_master_id,
            branch_id: item.branch_id,
            patient_id: item.patient_id,
            mrn_number: item.mrn_number,
            patient_first_name: item.patient_name.split(' ')[0],
            patient_last_name: item.patient_name.split(' ').slice(1).join(' '),
            patient: {
                contact_number: item.contact_number
            },
            consultation_fee: 0 // We rely on backend fetching pending items
        });
        setShowBillingModal(true);
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Billing & Invoices</h1>
                    <p className="text-gray-500">Manage patient bills, payments and clearances</p>
                </div>

                {/* Stats Widget could go here */}
            </div>

            {/* Controls & Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4 justify-between items-center">

                {/* Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl self-start lg:self-center">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'pending'
                            ? 'bg-white text-amber-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Pending Payments
                        {pendingItems.length > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'
                                }`}>
                                {pendingItems.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('paid')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'paid'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Paid Bills
                        {bills.length > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'paid' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'
                                }`}>
                                {bills.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('cancelled')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'cancelled'
                            ? 'bg-white text-rose-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Cancelled
                        {cancelledBills.length > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'cancelled' ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-500'
                                }`}>
                                {cancelledBills.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Search & Date */}
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by Bill #, Patient..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium placeholder:text-slate-400"
                        />
                    </div>
                    <div className="relative">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {
                loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-slate-500 font-medium">Loading records...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeTab === 'paid' ? (
                            /* Paid Bills List */
                            bills.length > 0 ? (
                                bills.map((bill: any) => (
                                    <div key={bill.bill_master_id} className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-100 transition-all cursor-default flex flex-col justify-between min-h-[220px]">
                                        <div>
                                            <div className="flex justify-between items-start mb-5">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-2xl ${bill.payment_mode === 'Cash' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                        <CreditCard className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-slate-700 font-bold uppercase tracking-wider">{bill.invoice_number}</p>
                                                        <p className="text-xs text-slate-600 font-medium mt-0.5">{new Date(bill.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-extrabold text-slate-900">₹{parseFloat(bill.total_amount).toFixed(2)}</p>
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase bg-emerald-50 text-emerald-600 tracking-wider mt-1">
                                                        Paid
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mb-6">
                                                <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">
                                                    {bill.patient_name}
                                                </h3>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <span className="bg-slate-100 px-3 py-1 rounded-lg text-xs font-bold text-slate-700">MRN: {bill.mrn_number}</span>
                                                </div>

                                                {/* Doctor info if available */}
                                                {(bill.doctor_name || bill.department_name) && (
                                                    <div className="flex items-center gap-4 text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                        <div className="p-2 bg-white rounded-lg text-blue-500 shadow-sm shrink-0">
                                                            <Stethoscope className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-800 text-sm">{bill.doctor_name || 'Unknown Doctor'}</span>
                                                            {bill.department_name && <span className="text-xs text-slate-600 font-semibold uppercase tracking-wide mt-0.5">{bill.department_name}</span>}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-5 border-t border-slate-100 flex justify-between items-center mt-auto">
                                            <span className="text-xs text-slate-600 font-bold uppercase tracking-wider flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                                {bill.payment_mode}
                                            </span>
                                            <button
                                                onClick={() => handleViewInvoice(bill.bill_master_id)}
                                                className="text-sm font-bold text-slate-600 hover:text-blue-600 flex items-center gap-2 transition-colors group/btn bg-slate-50 hover:bg-blue-50 px-4 py-2 rounded-lg"
                                            >
                                                <Eye className="w-4 h-4 text-slate-500 group-hover/btn:text-blue-500 transition-colors" />
                                                View Invoice
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <FileText className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">No paid bills found</h3>
                                    <p className="text-slate-500">No transaction records for this date.</p>
                                </div>
                            )
                        ) : activeTab === 'cancelled' ? (
                            /* Cancelled Bills List */
                            cancelledBills.length > 0 ? (
                                cancelledBills.map((bill: any) => (
                                    <div key={bill.bill_master_id} className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg hover:border-rose-100 transition-all cursor-default flex flex-col justify-between min-h-[220px]">
                                        <div>
                                            <div className="flex justify-between items-start mb-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 rounded-2xl bg-rose-50 text-rose-600">
                                                        <FileText className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-slate-700 font-bold uppercase tracking-wider">{bill.invoice_number}</p>
                                                        <p className="text-xs text-slate-600 font-medium mt-0.5">{new Date(bill.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-extrabold text-slate-900">₹{parseFloat(bill.total_amount).toFixed(2)}</p>
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase bg-rose-50 text-rose-600 tracking-wider mt-1">
                                                        Cancelled
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mb-6">
                                                <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">
                                                    {bill.patient_name}
                                                </h3>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <span className="bg-slate-100 px-3 py-1 rounded-lg text-xs font-bold text-slate-700">MRN: {bill.mrn_number}</span>
                                                </div>

                                                {/* Doctor info if available */}
                                                {(bill.doctor_name || bill.department_name) && (
                                                    <div className="flex items-center gap-4 text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                        <div className="p-2 bg-white rounded-lg text-rose-500 shadow-sm shrink-0">
                                                            <Stethoscope className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-800 text-sm">{bill.doctor_name || 'Unknown Doctor'}</span>
                                                            {bill.department_name && <span className="text-xs text-slate-600 font-semibold uppercase tracking-wide mt-0.5">{bill.department_name}</span>}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-5 border-t border-slate-100 flex justify-between items-center mt-auto">
                                            <span className="text-xs text-slate-600 font-bold uppercase tracking-wider flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-rose-300"></span>
                                                {bill.status}
                                            </span>
                                            <button
                                                onClick={() => handleViewInvoice(bill.bill_master_id)}
                                                className="text-sm font-bold text-slate-600 hover:text-rose-600 flex items-center gap-2 transition-colors group/btn bg-slate-50 hover:bg-rose-50 px-4 py-2 rounded-lg"
                                            >
                                                <Eye className="w-4 h-4 text-slate-500 group-hover/btn:text-rose-500 transition-colors" />
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <FileText className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">No cancelled bills found</h3>
                                    <p className="text-slate-500">No cancelled records for this date.</p>
                                </div>
                            )
                        ) : (
                            /* Pending Clearances List */
                            pendingItems.length > 0 ? (
                                pendingItems.map((item: any) => (
                                    <div key={item.opd_id} className="group bg-white rounded-2xl p-6 border-l-4 border-l-amber-400 border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between min-h-[220px]">
                                        <div>
                                            <div className="flex justify-between items-start mb-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                                                        <Clock className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-slate-700 font-bold uppercase tracking-wider">Token: {item.token_number}</p>
                                                        <p className="text-xs text-slate-600 font-medium mt-0.5">{new Date(item.visit_date).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-extrabold text-slate-900">₹{parseFloat(item.total_pending_amount).toFixed(2)}</p>
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase bg-amber-100 text-amber-700 tracking-wider mt-1">
                                                        Pending
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mb-6">
                                                <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">
                                                    {item.patient_name}
                                                </h3>
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    <span className="bg-slate-100 px-3 py-1 rounded-lg text-xs font-bold text-slate-700">MRN: {item.mrn_number}</span>
                                                </div>

                                                <div className="flex items-center gap-4 text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                    <div className="p-2 bg-white rounded-lg text-amber-500 shadow-sm shrink-0">
                                                        <Stethoscope className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800 text-sm">{item.doctor_name}</span>
                                                        {item.department_name && <span className="text-xs text-slate-600 font-semibold uppercase tracking-wide mt-0.5">{item.department_name}</span>}
                                                    </div>
                                                </div>

                                                <div className="mt-4 px-2 text-xs text-slate-700 font-bold flex items-center gap-2 uppercase tracking-wide">
                                                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                                                    {item.pending_items_count} items awaiting clearance
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-5 border-t border-slate-100 mt-auto">
                                            <button
                                                onClick={() => handleProcessBill(item)}
                                                className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white rounded-xl font-bold shadow-lg shadow-black/10 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 text-sm tracking-wide"
                                            >
                                                <CreditCard className="w-5 h-5" /> Process Payment
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle className="w-10 h-10 text-emerald-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">All Cleared!</h3>
                                    <p className="text-slate-500">No pending payments found.</p>
                                </div>
                            )
                        )}
                    </div>
                )
            }

            {/* Invoice Modal */}
            {
                showInvoice && selectedBill && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:absolute print:inset-0">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto print:shadow-none print:w-full print:max-w-none print:h-auto print:overflow-visible">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 print:hidden">
                                <h2 className="text-lg font-bold text-gray-800">Invoice Preview</h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => window.print()}
                                        className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg flex items-center gap-2"
                                    >
                                        <Printer className="w-4 h-4" /> Print
                                    </button>
                                    <button
                                        onClick={() => setShowInvoice(false)}
                                        className="p-2 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-lg"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="print:block">
                                <InvoiceTemplate
                                    billData={selectedBill}
                                    hospitalData={{
                                        name: user?.hospital_name,
                                        address: user?.address_line1 || 'Hospital Address',
                                        phone: user?.contact_number,
                                        email: user?.email
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Billing Modal for Processing Pending items */}
            {
                showBillingModal && selectedPendingOpd && (
                    <BillingModal
                        isOpen={showBillingModal}
                        onClose={() => {
                            setShowBillingModal(false);
                            setSelectedPendingOpd(null);
                        }}
                        opdData={selectedPendingOpd}
                        onSuccess={() => {
                            fetchPendingClearances(); // Refresh pending list
                            if (activeTab === 'paid') fetchBills(); // Refresh paid list if visible (though we are likely on pending tab)
                        }}
                    />
                )
            }
        </div >
    );
}

function XIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    );
}
