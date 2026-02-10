import React, { useState, useEffect } from 'react';
import { X, Printer, Trash2, Phone, User, FileText, CreditCard, Banknote, Smartphone, AlertCircle, ChevronRight, Stethoscope, Building2, MapPin, Plus, Minus, Calendar } from 'lucide-react';
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
    const [contactNumber, setContactNumber] = useState('');
    const [caretakerPhone, setCaretakerPhone] = useState('');

    // Cancellation State
    const [showCancelConfirm, setShowCancelConfirm] = useState<number | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancellingItem, setCancellingItem] = useState(false);

    useEffect(() => {
        if (isOpen && opdData) {
            initializeData();
        }
    }, [isOpen, opdData]);

    const initializeData = async () => {
        let currentContact = opdData.patient_contact_number || opdData.patient?.contact_number || '';
        setContactNumber(currentContact);

        if (opdData.opd_id) {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/billing/pending/${opdData.opd_id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const { items: fetchedItems, patient_phone, caretaker_phone } = response.data.data;

                if (caretaker_phone) setCaretakerPhone(caretaker_phone);

                if (!currentContact) {
                    if (patient_phone) {
                        setContactNumber(patient_phone);
                    } else if (caretaker_phone) {
                        setContactNumber(caretaker_phone);
                    }
                }

                if (fetchedItems && fetchedItems.length > 0) {
                    setItems(fetchedItems.map((item: any) => ({
                        ...item,
                        quantity: parseFloat(item.quantity) || 1,
                        unit_price: parseFloat(item.unit_price || item.service_price || item.final_price),
                        final_price: parseFloat(item.final_price)
                    })));
                } else if (opdData.consultation_fee > 0) {
                    setItems([{
                        service_type: 'consultation',
                        service_name: 'OPD Consultation',
                        quantity: 1,
                        unit_price: parseFloat(opdData.consultation_fee),
                        subtotal: parseFloat(opdData.consultation_fee),
                        final_price: parseFloat(opdData.consultation_fee),
                        is_cancellable: false
                    }]);
                }
            } catch (error) {
                console.warn('Failed to fetch pending items', error);
                if (opdData.consultation_fee > 0) {
                    setItems([{
                        service_type: 'consultation',
                        service_name: 'OPD Consultation',
                        quantity: 1,
                        unit_price: parseFloat(opdData.consultation_fee),
                        subtotal: parseFloat(opdData.consultation_fee),
                        final_price: parseFloat(opdData.consultation_fee),
                        is_cancellable: false
                    }]);
                }
            }
        }
    };

    const updateQuantity = (index: number, change: number) => {
        setItems(prev => prev.map((item, i) => {
            if (i === index && item.status !== 'Cancelled') {
                const newQty = Math.max(1, item.quantity + change);
                const newFinalPrice = newQty * item.unit_price;
                return { ...item, quantity: newQty, final_price: newFinalPrice };
            }
            return item;
        }));
    };

    useEffect(() => {
        if (!contactNumber && caretakerPhone) {
            setContactNumber(caretakerPhone);
        }
    }, [caretakerPhone, contactNumber]);

    useEffect(() => {
        calculateTotals();
    }, [items, discount]);

    const calculateTotals = () => {
        const sub = items.filter(i => i.status !== 'Cancelled').reduce((sum, item) => sum + item.final_price, 0);
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

    const handleCancelItem = async (bill_detail_id: number) => {
        if (!cancelReason.trim()) return alert('Please enter a cancellation reason');

        setCancellingItem(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/billing/cancel-item`,
                { bill_detail_id, cancellation_reason: cancelReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setItems(prev => prev.map(item =>
                item.bill_detail_id === bill_detail_id
                    ? { ...item, status: 'Cancelled', is_cancelled: true, final_price: 0 }
                    : item
            ));

            setShowCancelConfirm(null);
            setCancelReason('');
        } catch (error: any) {
            console.error('Cancellation Error:', error);
            alert(error.response?.data?.message || 'Failed to cancel item');
        } finally {
            setCancellingItem(false);
        }
    };

    const handleSubmit = async (isPayLater = false) => {
        if (!contactNumber) {
            return alert('Patient Contact Number is mandatory!');
        }

        // Validate 10-digit number
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(contactNumber)) {
            return alert('Please enter a valid 10-digit Patient Contact Number!');
        }

        // Also check if User has tried to enter something but it's invalid
        if (contactNumber.length !== 10) {
            return alert('Contact number must be exactly 10 digits.');
        }


        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                opd_id: opdData.opd_id,
                opd_number: opdData.opd_number,
                branch_id: opdData.branch_id,
                patient_id: opdData.patient_id,
                mrn_number: opdData.mrn_number || opdData.patient?.mrn_number,
                patient_name: `${opdData.patient_first_name || opdData.patient?.first_name} ${opdData.patient_last_name || opdData.patient?.last_name || ''}`.trim(),
                contact_number: contactNumber,
                payment_mode: isPayLater ? 'Cash' : paymentMode,
                items: items.filter(i => i.status !== 'Cancelled'),
                discount_type: discount.type,
                discount_value: discount.value,
                total_amount: totals.total,
                paid_amount: isPayLater ? 0 : totals.total
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

    // Construct Doctor Name
    const getDoctorName = () => {
        if (opdData?.doctor_name) return opdData.doctor_name;
        if (opdData?.doctor_first_name) {
            return `Dr. ${opdData.doctor_first_name} ${opdData.doctor_last_name || ''}`.trim();
        }
        return 'Dr. Unknown';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] flex overflow-hidden font-sans">

                {/* LEFT COLUMN (65%) */}
                <div className="w-[65%] flex flex-col bg-white">
                    {/* Header with Prominent OPD Info */}
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">New Invoice</h2>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-sm font-bold border border-blue-100">
                                    <FileText className="w-3.5 h-3.5" />
                                    #{opdData?.opd_number}
                                </span>
                                <span className="flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1 rounded-md text-sm font-semibold border border-slate-200">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(opdData?.visit_date || new Date()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            {/* Placeholder for maybe Hospital Name or Branch */}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Patient Section - Modern Grid with More Info */}
                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full -z-0 opacity-50"></div>

                            <div className="flex justify-between items-start mb-5 relative z-10">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                        {opdData?.patient_first_name} {opdData?.patient_last_name}
                                        <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                            {opdData?.visit_type || 'Walk-in'}
                                        </span>
                                    </h3>
                                    <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-2">
                                        <span className="bg-slate-100 px-1.5 rounded text-xs text-slate-600 font-bold tracking-wide">MRN</span>
                                        {opdData?.mrn_number || 'N/A'}
                                    </p>
                                </div>
                                <div className="bg-blue-600/5 text-blue-700 px-4 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wide border border-blue-100">
                                    {opdData?.department_name || 'General'}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-5 gap-x-8 text-sm relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100">
                                        <User className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Age / Gender</p>
                                        <p className="font-bold text-slate-900 text-base">{opdData?.age || '--'} Y / {opdData?.gender || '--'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100">
                                        <Stethoscope className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Consulting Doctor</p>
                                        <p className="font-bold text-slate-900 text-base">{getDoctorName()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 col-span-2 pt-3 border-t border-slate-50 mt-1">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100">
                                        <MapPin className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Address</p>
                                        <p className="font-bold text-slate-900 text-base truncate">
                                            {[opdData?.address || opdData?.patient?.address || opdData?.address_line1, opdData?.city].filter(Boolean).join(', ') || 'No address provided'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bill Items Table */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 mb-3 ml-1 flex items-center gap-2">
                                Billable Items
                                <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full">{items.length}</span>
                            </h3>
                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="px-5 py-3 text-left w-[40%] text-xs uppercase tracking-wider">Service</th>
                                            <th className="px-5 py-3 text-center text-xs uppercase tracking-wider">Qty</th>
                                            <th className="px-5 py-3 text-right text-xs uppercase tracking-wider">Price</th>
                                            <th className="px-5 py-3 text-right text-xs uppercase tracking-wider">Total</th>
                                            <th className="px-5 py-3 text-center w-16 text-xs uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {items.map((item, idx) => (
                                            <tr key={idx} className={`group ${item.status === 'Cancelled' ? 'bg-red-50/50' : 'hover:bg-slate-50'}`}>
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-col">
                                                        <span className={`font-semibold ${item.status === 'Cancelled' ? 'text-red-400 line-through' : 'text-slate-800'}`}>
                                                            {item.service_name}
                                                        </span>
                                                        {item.status === 'Cancelled' && <span className="text-[10px] text-red-500 font-bold uppercase mt-0.5">Cancelled</span>}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {item.status !== 'Cancelled' ? (
                                                        <div className={`flex items-center justify-center gap-1 bg-white border border-slate-200 rounded-lg p-1 w-fit mx-auto shadow-sm ${(item.service_type === 'consultation' || item.service_name?.toLowerCase().includes('consultation')) ? 'opacity-60 bg-slate-50' : ''}`}>
                                                            <button
                                                                onClick={() => updateQuantity(idx, -1)}
                                                                disabled={item.service_type === 'consultation' || item.service_name?.toLowerCase().includes('consultation')}
                                                                className="w-6 h-6 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                <Minus className="w-3 h-3" />
                                                            </button>
                                                            <span className="w-8 text-center font-bold text-slate-700">{item.quantity}</span>
                                                            <button
                                                                onClick={() => updateQuantity(idx, 1)}
                                                                disabled={item.service_type === 'consultation' || item.service_name?.toLowerCase().includes('consultation')}
                                                                className="w-6 h-6 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center text-slate-400 font-medium">{item.quantity}</div>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-right text-slate-500 font-medium">₹{item.unit_price}</td>
                                                <td className="px-5 py-4 text-right font-bold text-slate-900 text-base">
                                                    {item.status === 'Cancelled' ? '₹0.00' : `₹${item.final_price?.toFixed(2)}`}
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    {item.status !== 'Cancelled' && (
                                                        <button
                                                            onClick={item.is_cancellable ? () => setShowCancelConfirm(item.bill_detail_id) : undefined}
                                                            disabled={!item.is_cancellable}
                                                            className={`p-2 rounded-lg transition-all ${!item.is_cancellable
                                                                ? 'text-slate-400 opacity-70 cursor-not-allowed'
                                                                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                                                }`}
                                                            title={!item.is_cancellable ? "This item cannot be cancelled" : "Cancel Item"}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN (35%) - Summary */}
                <div className="w-[35%] bg-slate-50 border-l border-slate-200 flex flex-col relative z-10 shadow-[-1px_0_10px_rgba(0,0,0,0.02)]">
                    {/* Spacer to maintain layout consistency after removing the X button */}
                    <div className="h-[68px]"></div>


                    <div className="flex-1 px-8 space-y-8 overflow-y-auto">

                        {/* Summary Header */}
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Payable</span>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-5xl font-black text-slate-900 tracking-tight">₹{totals.total.toFixed(2)}</span>
                                <span className="text-sm font-bold text-slate-400">INR</span>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Payment Mode</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['Cash', 'UPI', 'Card'].map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => setPaymentMode(mode)}
                                        className={`py-3.5 rounded-xl text-sm font-bold border transition-all flex flex-col items-center gap-2 ${paymentMode === mode
                                            ? 'bg-white border-blue-600 text-blue-600 ring-2 ring-blue-600/20 shadow-lg shadow-blue-500/10'
                                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        {mode === 'Cash' && <Banknote className="w-5 h-5" />}
                                        {mode === 'UPI' && <Smartphone className="w-5 h-5" />}
                                        {mode === 'Card' && <CreditCard className="w-5 h-5" />}
                                        <span>{mode}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                                Patient Contact
                                <span className="text-red-500">*</span>
                            </label>
                            <div className="relative group">
                                <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="tel"
                                    maxLength={10}
                                    value={contactNumber}
                                    onChange={(e) => {
                                        const re = /^[0-9\b]+$/;
                                        if (e.target.value === '' || re.test(e.target.value)) {
                                            setContactNumber(e.target.value);
                                        }
                                    }}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 shadow-sm"
                                    placeholder="Enter 10-digit number"
                                />

                            </div>
                            {caretakerPhone && contactNumber === caretakerPhone && (
                                <p className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded inline-block border border-amber-100">
                                    Using Emergency Contact
                                </p>
                            )}
                        </div>

                        {/* Discount */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Discount</label>
                                {discount.type === 'none' && (
                                    <button
                                        onClick={() => setDiscount({ type: 'fixed', value: 0 })}
                                        className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline bg-blue-50 px-2 py-0.5 rounded"
                                    >
                                        + Add Discount
                                    </button>
                                )}
                            </div>

                            {discount.type !== 'none' && (
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="number"
                                            value={discount.value || ''}
                                            onChange={(e) => setDiscount({ ...discount, value: parseFloat(e.target.value) || 0 })}
                                            className="w-full pl-3 pr-8 py-3 bg-white border border-slate-200 rounded-xl text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm placeholder:text-slate-300"
                                            placeholder="0"
                                        />
                                        <span className="absolute right-3 top-3 text-xl font-bold text-slate-500">
                                            {discount.type === 'percentage' ? '%' : '₹'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setDiscount({ type: 'none', value: 0 })}
                                        className="px-4 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-slate-200 hover:border-red-100 bg-white"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Calculations */}
                        <div className="space-y-3 pt-6 border-t border-slate-200 text-sm">
                            <div className="flex justify-between text-slate-500">
                                <span className="font-medium">Subtotal</span>
                                <span className="font-bold text-slate-700">₹{totals.subtotal.toFixed(2)}</span>
                            </div>
                            {totals.discountAmount > 0 && (
                                <div className="flex justify-between text-slate-500">
                                    <span className="font-medium">Discount</span>
                                    <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">-₹{totals.discountAmount.toFixed(2)}</span>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="p-8 bg-slate-50 border-t border-slate-200 space-y-4">
                        <button
                            onClick={() => handleSubmit(false)}
                            disabled={loading || !contactNumber || contactNumber.length !== 10}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-200 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 group active:scale-[0.98]"
                        >
                            {loading ? 'Processing...' : (
                                <>
                                    <Printer className="w-5 h-5" />
                                    Pay & Print Invoice
                                </>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-3 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors hover:underline rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            Or Pay Later
                        </button>
                    </div>
                </div>

            </div>

            {/* Cancel Confirmation Modal */}
            {showCancelConfirm && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 transform transition-all scale-100">
                        <div className="flex items-center gap-3 mb-4 text-red-600">
                            <AlertCircle className="w-6 h-6" />
                            <h3 className="text-lg font-bold text-slate-900">Cancel Service?</h3>
                        </div>
                        <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
                            Are you sure you want to cancel this item? This action cannot be undone. Please select a reason.
                        </p>
                        <div className="mb-6">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Reason for cancellation</label>
                            <select
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-slate-50"
                            >
                                <option value="">Select Reason...</option>
                                <option value="Patient Refused">Patient Refused</option>
                                <option value="Doctor Changed Advice">Doctor Changed Advice</option>
                                <option value="Duplicate Entry">Duplicate Entry</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => { setShowCancelConfirm(null); setCancelReason(''); }}
                                className="py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors bg-white border border-slate-200"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => handleCancelItem(showCancelConfirm)}
                                disabled={cancellingItem || !cancelReason}
                                className="py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-200 disabled:opacity-50 transition-all"
                            >
                                {cancellingItem ? 'Cancelling...' : 'Confirm Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillingModal;
