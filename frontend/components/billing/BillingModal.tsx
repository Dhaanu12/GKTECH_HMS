import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Printer, Download } from 'lucide-react';
import axios from 'axios';

interface BillingModalProps {
    isOpen: boolean;
    onClose: () => void;
    opdData: any;
    onSuccess: (billData: any) => void;
}

const BillingModal: React.FC<BillingModalProps> = ({ isOpen, onClose, opdData, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<any[]>([]);
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [discount, setDiscount] = useState({ type: 'none', value: 0 });
    const [totals, setTotals] = useState({ subtotal: 0, discountAmount: 0, total: 0 });

    useEffect(() => {
        if (isOpen && opdData) {
            initializeItems();
        }
    }, [isOpen, opdData]);

    const initializeItems = async () => {
        let loadedItems: any[] = [];

        // 1. Try to fetch pending items from API (for Pay Later / Clearance flow)
        if (opdData.opd_id) {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/billing/pending/${opdData.opd_id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.data.items && response.data.data.items.length > 0) {
                    loadedItems = response.data.data.items.map((item: any) => ({
                        bill_detail_id: item.bill_detail_id, // Important to track existing items
                        service_type: item.service_type || 'service',
                        service_name: item.service_name,
                        quantity: 1, // Default to 1 as bill_details usually tracks individuals, or add quantity field to DB if needed
                        unit_price: parseFloat(item.service_price || item.final_price),
                        subtotal: parseFloat(item.final_price),
                        final_price: parseFloat(item.final_price)
                    }));
                }
            } catch (error) {
                console.warn('Failed to fetch pending items, falling back to props', error);
            }
        }

        // 2. Fallback: Use opdData props (for immediate Pay Now flow where items might not be pending or locally passed)
        if (loadedItems.length === 0 && opdData.consultation_fee > 0) {
            loadedItems.push({
                service_type: 'consultation',
                service_name: 'OPD Consultation',
                quantity: 1,
                unit_price: parseFloat(opdData.consultation_fee),
                subtotal: parseFloat(opdData.consultation_fee),
                final_price: parseFloat(opdData.consultation_fee)
            });
        }

        setItems(loadedItems);
    };

    useEffect(() => {
        calculateTotals();
    }, [items, discount]);

    const calculateTotals = () => {
        const sub = items.reduce((sum, item) => sum + item.final_price, 0);
        let discAmt = 0;

        if (discount.type === 'percentage') {
            discAmt = (sub * discount.value) / 100;
        } else if (discount.type === 'fixed') {
            discAmt = discount.value;
        }

        setTotals({
            subtotal: sub,
            discountAmount: discAmt,
            total: Math.max(0, sub - discAmt)
        });
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                opd_id: opdData.opd_id,
                opd_number: opdData.opd_number,
                branch_id: opdData.branch_id,
                patient_id: opdData.patient_id,
                mrn_number: opdData.mrn_number || opdData.patient?.mrn_number, // Handle different data structures
                patient_name: `${opdData.patient_first_name || opdData.patient?.first_name} ${opdData.patient_last_name || opdData.patient?.last_name || ''}`.trim(),
                contact_number: opdData.patient_contact_number || opdData.patient?.contact_number || 'N/A',
                payment_mode: paymentMode,
                items: items,
                discount_type: discount.type,
                discount_value: discount.value,
                total_amount: totals.total,
                paid_amount: totals.total // Full payment for "Pay Now"
            };

            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/billing`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            onSuccess(response.data.data);
            onClose();
        } catch (error: any) {
            console.error('Billing Error:', error);
            alert(error.response?.data?.message || 'Failed to process bill');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Process Bill</h2>
                        <p className="text-sm text-gray-500">OPD: {opdData?.opd_number} | Patient: {opdData?.patient_first_name} {opdData?.patient_last_name}</p>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Items Table */}
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 font-medium">
                                <tr>
                                    <th className="px-4 py-3">Service</th>
                                    <th className="px-4 py-3 text-right">Qty</th>
                                    <th className="px-4 py-3 text-right">Price</th>
                                    <th className="px-4 py-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="px-4 py-3">{item.service_name}</td>
                                        <td className="px-4 py-3 text-right">{item.quantity}</td>
                                        <td className="px-4 py-3 text-right">₹{item.unit_price}</td>
                                        <td className="px-4 py-3 text-right font-medium">₹{item.final_price}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Payment Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700">Payment Mode</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['Cash', 'UPI', 'Card'].map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => setPaymentMode(mode)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${paymentMode === mode
                                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                                            : 'border-gray-200 text-gray-600 hover:border-blue-200'
                                            }`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Subtotal</span>
                                <span>₹{totals.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Discount</span>
                                <span>- ₹{totals.discountAmount.toFixed(2)}</span>
                            </div>
                            <div className="pt-3 border-t border-gray-200 flex justify-between text-lg font-bold text-gray-900">
                                <span>Total Payable</span>
                                <span>₹{totals.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-amber-500 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors font-medium flex items-center gap-2"
                    >
                        Pay Later
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                        {loading ? 'Processing...' : (
                            <>
                                <Printer className="w-4 h-4" />
                                Pay & Print Invoice
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BillingModal;
