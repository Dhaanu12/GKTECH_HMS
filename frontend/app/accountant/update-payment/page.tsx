'use client';

import { useState } from 'react';
import axios from 'axios';
import { Search, Save, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';

interface Claim {
    claim_id: string;
    patient_name: string;
    ip_no: string;
    approval_no: string;
    insurance_name: string;
    bill_amount: string;
    approval_amount: string;
    amount_received: string;
    pending_amount: string;
    tds: string;
    bank_name: string;
    transaction_date: string;
    utr_no: string;
    remarks: string;
    co_pay: string;
    discount: string;
    advance_amount: string;
    moc_discount: string;
    number_field_1: string;
    system_notes: string;
    is_updated: number; // 0 or 1
}

export default function UpdatePaymentPage() {
    const { user } = useAuth();

    const [approvalNo, setApprovalNo] = useState('');
    const [loading, setLoading] = useState(false);
    const [claim, setClaim] = useState<Claim | null>(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [saving, setSaving] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        amount_received: '',
        tds: '',
        bank_name: '',
        transaction_date: '',
        utr_no: '',
        remarks: '',
        co_pay: '',
        discount: '',
        advance_amount: '',
        moc_discount: '',
        number_field_1: '',
        system_notes: '',
        pending_amount: ''
    });

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!approvalNo.trim()) return;

        setLoading(true);
        setMessage({ type: '', text: '' });
        setClaim(null);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/accountant/claim/approval/${approvalNo}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.status === 'success') {
                const data = res.data.data;
                setClaim(data);

                // Pre-fill form
                setFormData({
                    amount_received: data.amount_received || '',
                    tds: data.tds || '',
                    bank_name: data.bank_name || '',
                    transaction_date: data.transaction_date ? data.transaction_date.split('T')[0] : '',
                    utr_no: data.utr_no || '',
                    remarks: data.remarks || '',
                    co_pay: data.co_pay || '',
                    discount: data.discount || '',
                    advance_amount: data.advance_amount || '',
                    moc_discount: data.moc_discount || '',
                    number_field_1: data.number_field_1 || '',
                    system_notes: data.system_notes || '',
                    pending_amount: data.pending_amount || ''
                });
            }
        } catch (error: any) {
            console.error(error);
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Claim not found or error occurred'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!claim) return;

        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`http://localhost:5000/api/accountant/claim/${claim.claim_id}/payment`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.status === 'success') {
                setMessage({ type: 'success', text: 'Payment details updated successfully' });
                setClaim({ ...claim, ...res.data.data }); // Update local state

                // Update pending amount calculation display immediately
                // Logic handled by backend return generally, but for immediate feedback:
                /* 
                   Pending Calc = Approval - Received
                   (Assuming this calculation is desired client-side too) 
                */
            }
        } catch (error: any) {
            console.error(error);
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to update payment'
            });
        } finally {
            setSaving(false);
        }
    };

    // Calculations
    // Calculations
    const approvalAmount = claim ? parseFloat(claim.approval_amount || '0') : 0;
    // Manual pending amount
    // const pendingAmount = Math.max(0, approvalAmount - receivedAmount);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/accountant/reports" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Update Payment</h1>
                    <p className="text-gray-500">Search by Approval Number to update details.</p>
                </div>
            </div>

            {/* Search Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm max-w-2xl">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="flex-1">
                        <label className="sr-only">Approval Number</label>
                        <input
                            type="text"
                            placeholder="Enter Approval Number"
                            value={approvalNo}
                            onChange={(e) => setApprovalNo(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? 'Searching...' : <><Search className="w-4 h-4" /> Search</>}
                    </button>
                </form>
                {message.text && (
                    <div className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                        {message.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        {message.text}
                    </div>
                )}
            </div>

            {/* Result Section */}
            {claim && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                    {/* Claim Details Card */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-slate-50 p-6 rounded-xl border border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Claim Details</h3>
                            <div className="space-y-3 text-sm">
                                <div><span className="text-gray-500">Patient:</span> <span className="font-medium">{claim.patient_name}</span></div>
                                <div><span className="text-gray-500">IP Number:</span> <span className="font-medium">{claim.ip_no}</span></div>
                                <div><span className="text-gray-500">Insurance:</span> <span className="font-medium">{claim.insurance_name}</span></div>
                                <div><span className="text-gray-500">Bill Amount:</span> <span className="font-medium">₹{Number(claim.bill_amount).toLocaleString('en-IN')}</span></div>
                                <div><span className="text-gray-500">CO-PAY:</span> <span className="font-medium ">₹{Number(claim.co_pay).toLocaleString('en-IN')}</span></div>
                                <div><span className="text-gray-500">ADVANCE AMOUNT:</span> <span className="font-medium ">₹{Number(claim.advance_amount).toLocaleString('en-IN')}</span></div>
                                <div><span className="text-gray-500">Approval Amount:</span> <span className="font-medium text-blue-600">₹{Number(claim.approval_amount).toLocaleString('en-IN')}</span></div>
                            </div>
                        </div>


                    </div>

                    {/* Edit Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                <h3 className="font-semibold text-gray-900">Update Payment Details</h3>
                            </div>
                            <form onSubmit={handleUpdate} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Amount Received</label>
                                    <input
                                        type="number"
                                        value={formData.amount_received}
                                        onChange={(e) => setFormData({ ...formData, amount_received: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="0"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">TDS</label>
                                    <input
                                        type="number"
                                        value={formData.tds}
                                        onChange={(e) => setFormData({ ...formData, tds: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="0"
                                    />
                                </div>





                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">MOC Discount</label>
                                    <input
                                        type="number"
                                        value={formData.moc_discount}
                                        onChange={(e) => setFormData({ ...formData, moc_discount: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="0"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Pending Amount</label>
                                    <input
                                        type="number"
                                        value={formData.pending_amount}
                                        onChange={(e) => setFormData({ ...formData, pending_amount: e.target.value })}
                                        className="w-full px-3 py-2 border border-blue-300 bg-blue-50 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="0"
                                    />
                                </div>



                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Transaction Date</label>
                                    <input
                                        type="date"
                                        value={formData.transaction_date}
                                        onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Bank Name</label>
                                    <input
                                        type="text"
                                        value={formData.bank_name}
                                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Bank Name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">UTR No.</label>
                                    <input
                                        type="text"
                                        value={formData.utr_no}
                                        onChange={(e) => setFormData({ ...formData, utr_no: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Transaction Ref No"
                                    />
                                </div>

                                <div className="col-span-1 md:col-span-2 space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Remarks</label>
                                    <textarea
                                        value={formData.remarks}
                                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Notes..."
                                        rows={3}
                                    />
                                </div>



                                <div className="col-span-1 md:col-span-2 pt-4">
                                    {claim && claim.is_updated === 1 ? (
                                        <div className="w-full py-3 bg-gray-50 text-gray-500 font-medium rounded-lg border border-gray-200 flex items-center justify-center gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                                            Payment Already Updated
                                        </div>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-md flex items-center justify-center gap-2"
                                        >
                                            <Save className="w-5 h-5" />
                                            {saving ? 'Updating Payment...' : 'Update Payment Details'}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
