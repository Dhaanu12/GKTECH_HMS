import React from 'react';

interface InvoiceTemplateProps {
    billData: any;
    hospitalData?: any; // We now use billData for most clinic info from the enriched API
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ billData }) => {
    // Helper to format date
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Helper for amount in words (Simple version)
    const toWords = (amount: number) => {
        const words = [
            '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
            'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
        ];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        if (amount === 0) return 'Zero';

        const transform = (num: number): string => {
            if (num < 20) return words[num];
            if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + words[num % 10] : '');
            if (num < 1000) return words[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' and ' + transform(num % 100) : '');
            if (num < 100000) return transform(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + transform(num % 1000) : '');
            return num.toString();
        };

        return transform(Math.floor(amount)) + ' Rupees only';
    };

    return (
        <div id="invoice-print-area" className="bg-white p-8 max-w-4xl mx-auto text-sm leading-normal text-slate-800 font-sans print:p-0 print:max-w-[210mm] print:text-xs relative overflow-hidden">
            {/* Watermark for Cancelled Bills */}
            {(billData?.status === 'Cancelled' || billData?.payment_status === 'Cancelled' || billData?.payment_status === 'Failed') && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-10">
                    <div className="transform -rotate-45 text-[150px] font-black text-red-600 border-8 border-red-600 px-10 py-4 uppercase tracking-widest">
                        CANCELLED
                    </div>
                </div>
            )}
            {/* Header: Logo and Clinic Info */}
            <div className="flex justify-between items-start mb-6 border-b pb-6 border-slate-200">
                <div className="flex items-center gap-5">
                    <img src="/logo.png" alt="Logo" className="h-20 w-auto object-contain" />
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase print:text-2xl">
                            {billData?.clinic_name || 'GKTECH MEDICAL CENTRE'}
                        </h1>
                        <p className="text-sm font-bold text-slate-500 mt-1.5 uppercase print:text-xs">ISO 9001:2015 Certified</p>
                    </div>
                </div>
                <div className="text-right max-w-[350px]">
                    <p className="font-bold text-slate-700 whitespace-pre-line leading-relaxed text-base print:text-sm">
                        {billData?.clinic_address_line1}
                        {billData?.clinic_address_line2 && `\n${billData?.clinic_address_line2}`}
                        {`\n${billData?.clinic_city || ''} - ${billData?.clinic_pincode || ''}`}
                        {`\nPhone: ${billData?.clinic_phone || ''}`}
                    </p>
                </div>
            </div>

            {/* Title */}
            <div className="text-center py-2 bg-slate-100 border border-slate-200 mb-6 rounded">
                <h2 className="text-xl font-bold uppercase tracking-widest text-slate-900 print:text-base">Bill Cum Receipt</h2>
            </div>

            {/* Patient & Visit Details Grid */}
            <div className="grid grid-cols-[60%_40%] gap-4 border border-slate-200 rounded overflow-hidden mb-8 p-4 bg-slate-50/30">
                {/* Left Column */}
                <div className="space-y-2">
                    <div className="grid grid-cols-[110px_1fr]">
                        <span className="font-bold text-slate-500 uppercase text-sm print:text-xs">Name:</span>
                        <span className="font-bold text-slate-900 uppercase text-base print:text-sm">{billData?.patient_name}</span>
                    </div>
                    <div className="grid grid-cols-[110px_1fr]">
                        <span className="font-bold text-slate-500 uppercase">Age/Gender:</span>
                        <span className="font-bold text-slate-900">{billData?.age} Y / {billData?.gender?.charAt(0)}</span>
                    </div>
                    <div className="grid grid-cols-[110px_1fr]">
                        <span className="font-bold text-slate-500 uppercase">Address:</span>
                        <span className="font-medium text-slate-700 line-clamp-2 uppercase">
                            {billData?.patient_address_line1} {billData?.patient_address_line2}
                        </span>
                    </div>
                    <div className="grid grid-cols-[110px_1fr]">
                        <span className="font-bold text-slate-500 uppercase">Location:</span>
                        <span className="font-bold text-slate-900 uppercase">{billData?.patient_city}, {billData?.patient_state}</span>
                    </div>
                    <div className="grid grid-cols-[110px_1fr]">
                        <span className="font-bold text-slate-500 uppercase">Doctor:</span>
                        <span className="font-bold text-slate-900 uppercase">{billData?.doctor_name}</span>
                    </div>
                    <div className="grid grid-cols-[110px_1fr]">
                        <span className="font-bold text-slate-500 uppercase">Department:</span>
                        <span className="font-bold text-slate-900 uppercase">{billData?.department_name}</span>
                    </div>
                    <div className="grid grid-cols-[110px_1fr]">
                        <span className="font-bold text-slate-500 uppercase">Ref Doctor:</span>
                        <span className="font-bold text-slate-900 uppercase">{billData?.visit_type || 'Walk In'}</span>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-2">
                    <div className="grid grid-cols-[140px_1fr] gap-x-4">
                        <span className="font-bold text-slate-500 uppercase">Bill No:</span>
                        <span className="font-bold text-slate-900 uppercase">{billData?.bill_number}</span>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-x-4">
                        <span className="font-bold text-slate-500 uppercase">Bill Date:</span>
                        <span className="font-bold text-slate-900">{formatDate(billData?.billing_date)}</span>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-x-4">
                        <span className="font-bold text-slate-500 uppercase">MR No:</span>
                        <span className="font-bold text-slate-900 uppercase">{billData?.mrn_number}</span>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-x-4">
                        <span className="font-bold text-slate-500 uppercase">Visit ID:</span>
                        <span className="font-bold text-slate-900 uppercase">{billData?.opd_number}</span>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-x-4">
                        <span className="font-bold text-slate-500 uppercase">Registered Date:</span>
                        <span className="font-bold text-slate-900">{formatDateTime(billData?.registered_date)}</span>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-x-4">
                        <span className="font-bold text-slate-500 uppercase">Patient's Phone:</span>
                        <span className="font-bold text-slate-900">{billData?.contact_number}</span>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-x-4">
                        <span className="font-bold text-slate-500 uppercase">Caretaker Phone:</span>
                        <span className="font-bold text-slate-900">N/A</span>
                    </div>
                </div>
            </div>

            {/* Charges Table */}
            <div className="mb-8">
                <table className="w-full border-collapse border border-slate-300">
                    <thead>
                        <tr className="bg-slate-50 text-slate-700">
                            <th className="border border-slate-300 py-3 px-4 text-left w-28 font-bold">Date</th>
                            <th className="border border-slate-300 py-3 px-4 text-left w-36 font-bold">Head</th>
                            <th className="border border-slate-300 py-3 px-4 text-left font-bold">Description</th>
                            <th className="border border-slate-300 py-3 px-4 text-right w-24 font-bold">Rate</th>
                            <th className="border border-slate-300 py-3 px-4 text-center w-20 font-bold">Qty</th>
                            <th className="border border-slate-300 py-3 px-4 text-right w-28 font-bold">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {billData?.items?.map((item: any, idx: number) => (
                            <tr key={idx} className="text-slate-700 hover:bg-slate-50/50">
                                <td className="border border-slate-300 py-3 px-4">{formatDate(item.created_at || billData?.billing_date)}</td>
                                <td className="border border-slate-300 py-3 px-4 uppercase font-bold text-xs print:text-[10px]">{item.service_type || 'OPD'}</td>
                                <td className="border border-slate-300 py-3 px-4 uppercase font-medium">{item.service_name}</td>
                                <td className="border border-slate-300 py-3 px-4 text-right">{parseFloat(item.unit_price).toFixed(2)}</td>
                                <td className="border border-slate-300 py-3 px-4 text-center">{parseInt(item.quantity)}</td>
                                <td className="border border-slate-300 py-3 px-4 text-right font-bold">{parseFloat(item.final_price).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        {(() => {
                            const subtotal = billData?.items?.filter((i: any) => i.status !== 'Cancelled').reduce((sum: number, item: any) => sum + parseFloat(item.final_price), 0) || 0;
                            const discountAmount = parseFloat(billData?.discount_amount || 0);
                            const totalAmount = Math.max(0, subtotal - discountAmount);

                            return (
                                <>
                                    <tr className="bg-slate-50">
                                        <td colSpan={5} className="border border-slate-300 py-3 px-4 text-right font-bold text-slate-900">Sub Total</td>
                                        <td className="border border-slate-300 py-3 px-4 text-right font-black text-slate-900 text-sm">₹{subtotal.toFixed(2)}</td>
                                    </tr>
                                    {discountAmount > 0 && (
                                        <tr className="bg-slate-50">
                                            <td colSpan={5} className="border border-slate-300 py-3 px-4 text-right font-bold text-slate-900">Discount</td>
                                            <td className="border border-slate-300 py-3 px-4 text-right font-black text-red-600 text-sm">-₹{discountAmount.toFixed(2)}</td>
                                        </tr>
                                    )}
                                    <tr className="bg-slate-100">
                                        <td colSpan={5} className="border border-slate-300 py-3 px-4 text-right font-bold text-slate-900">Total Bill</td>
                                        <td className="border border-slate-300 py-3 px-4 text-right font-black text-slate-900 text-xl print:text-lg">₹{totalAmount.toFixed(2)}</td>
                                    </tr>
                                </>
                            );
                        })()}
                    </tfoot>
                </table>
            </div>

            {/* Disclaimer Section */}
            <div className="mb-8 space-y-1.5 text-slate-500 font-bold italic text-[11px]">
                <p>*Consultation valid for 4 days only for the same consultant</p>
                <p>*Consultation validity not applicable to Psychiatry Department</p>
            </div>

            {/* Payments Section */}
            <div className="mb-10">
                <table className="w-full border-collapse border border-slate-300">
                    <thead>
                        <tr className="bg-slate-50 text-slate-700">
                            <th className="border border-slate-300 py-2 px-4 text-left w-28 font-bold">Payments</th>
                            <th className="border border-slate-300 py-2 px-4 text-left w-48 font-bold">Invoice Number</th>
                            <th className="border border-slate-300 py-2 px-4 text-left font-bold">Details</th>
                            <th className="border border-slate-300 py-2 px-4 text-right w-28 font-bold">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="text-slate-700">
                            <td className="border border-slate-300 py-3 px-4 font-bold uppercase">Settlement</td>
                            <td className="border border-slate-300 py-3 px-4 font-bold text-blue-600 font-mono text-sm">{billData?.invoice_number}</td>
                            <td className="border border-slate-300 py-3 px-4 uppercase font-bold text-xs">
                                {(billData?.status === 'Cancelled' || billData?.payment_status === 'Cancelled' || billData?.payment_status === 'Failed')
                                    ? <span className="text-red-600">BILL CANCELLED</span>
                                    : `${billData?.payment_mode || 'CASH'} - FULL PAYMENT`
                                }
                            </td>
                            <td className="border border-slate-300 py-3 px-4 text-right font-bold">
                                {(billData?.status === 'Cancelled' || billData?.payment_status === 'Cancelled' || billData?.payment_status === 'Failed')
                                    ? '0.00'
                                    : parseFloat(billData?.paid_amount || billData?.total_amount).toFixed(2)
                                }
                            </td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-50">
                            <td colSpan={3} className="border border-slate-300 py-3 px-4 text-right font-bold text-slate-900">Net Payments</td>
                            <td className="border border-slate-300 py-3 px-4 text-right font-black text-slate-900 text-xl print:text-lg">
                                {(billData?.status === 'Cancelled' || billData?.payment_status === 'Cancelled' || billData?.payment_status === 'Failed')
                                    ? '0.00'
                                    : `₹${parseFloat(billData?.paid_amount || billData?.total_amount).toFixed(2)}`
                                }
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-end mt-16 pb-12">
                <div className="flex flex-col gap-4">
                    <p className="text-sm font-bold text-slate-800">
                        Received with thanks: <span className="uppercase text-slate-600 underline decoration-slate-300 underline-offset-4 decoration-1 decoration-dotted ml-2">
                            {(billData?.status === 'Cancelled' || billData?.payment_status === 'Cancelled' || billData?.payment_status === 'Failed')
                                ? 'CANCELLED'
                                : toWords(parseFloat(billData?.paid_amount || billData?.total_amount))
                            }
                        </span>
                    </p>
                </div>
                <div className="flex flex-col items-center">
                    <div className="w-48 border-b-2 border-slate-300 mb-2"></div>
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tighter">Authorized Signature</p>
                </div>
            </div>

            {/* Print Specific styles */}
            <style jsx global>{`
                @media print {
                    #invoice-print-area {
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                    }
                    @page {
                        size: A4;
                        margin: 10mm;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>
        </div>
    );
};

export default InvoiceTemplate;
