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
        <div id="invoice-print-area" className="bg-white p-6 max-w-[210mm] mx-auto text-[11px] leading-tight text-slate-800 font-sans print:p-0">
            {/* Header: Logo and Clinic Info */}
            <div className="flex justify-between items-start mb-4 border-b pb-4 border-slate-200">
                <div className="flex items-center gap-4">
                    <img src="/logo.png" alt="Logo" className="h-16 w-auto object-contain" />
                    <div className="flex flex-col">
                        <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">
                            {billData?.clinic_name || 'GKTECH MEDICAL CENTRE'}
                        </h1>
                        <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">ISO 9001:2015 Certified</p>
                    </div>
                </div>
                <div className="text-right max-w-[300px]">
                    <p className="font-bold text-slate-700 whitespace-pre-line leading-relaxed">
                        {billData?.clinic_address_line1}
                        {billData?.clinic_address_line2 && `\n${billData?.clinic_address_line2}`}
                        {`\n${billData?.clinic_city || ''} - ${billData?.clinic_pincode || ''}`}
                        {`\nPhone: ${billData?.clinic_phone || ''}`}
                    </p>
                </div>
            </div>

            {/* Title */}
            <div className="text-center py-1 bg-slate-100 border border-slate-200 mb-4 rounded">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800">Bill Cum Receipt</h2>
            </div>

            {/* Patient & Visit Details Grid */}
            <div className="grid grid-cols-[60%_40%] gap-0 border border-slate-200 rounded overflow-hidden mb-6 px-1">
                {/* Left Column */}
                <div className="">
                    <div className="grid grid-cols-[110px_1fr] py-1.5 px-3">
                        <span className="font-bold text-slate-500 uppercase">Name:</span>
                        <span className="font-bold text-slate-900 uppercase">{billData?.patient_name}</span>
                    </div>
                    <div className="grid grid-cols-[110px_1fr] py-1.5 px-3">
                        <span className="font-bold text-slate-500 uppercase">Age/Gender:</span>
                        <span className="font-bold text-slate-900">{billData?.age} Y / {billData?.gender?.charAt(0)}</span>
                    </div>
                    <div className="grid grid-cols-[110px_1fr] py-1.5 px-3 h-10">
                        <span className="font-bold text-slate-500 uppercase">Address:</span>
                        <span className="font-medium text-slate-700 line-clamp-2 uppercase">
                            {billData?.patient_address_line1} {billData?.patient_address_line2}
                        </span>
                    </div>
                    <div className="grid grid-cols-[110px_1fr] py-1.5 px-3">
                        <span className="font-bold text-slate-500 uppercase">Location:</span>
                        <span className="font-bold text-slate-900 uppercase">{billData?.patient_city}, {billData?.patient_state}</span>
                    </div>
                    <div className="grid grid-cols-[110px_1fr] py-1.5 px-3">
                        <span className="font-bold text-slate-500 uppercase">Doctor:</span>
                        <span className="font-bold text-slate-900 uppercase">{billData?.doctor_name}</span>
                    </div>
                    <div className="grid grid-cols-[110px_1fr] py-1.5 px-3">
                        <span className="font-bold text-slate-500 uppercase">Department:</span>
                        <span className="font-bold text-slate-900 uppercase">{billData?.department_name}</span>
                    </div>
                    <div className="grid grid-cols-[110px_1fr] py-1.5 px-3">
                        <span className="font-bold text-slate-500 uppercase">Ref Doctor:</span>
                        <span className="font-bold text-slate-900 uppercase">{billData?.visit_type || 'Walk In'}</span>
                    </div>
                </div>

                {/* Right Column */}
                <div>
                    <div className="grid grid-cols-[120px_1fr] py-1.5 px-3">
                        <span className="font-bold text-slate-500 uppercase">Bill No:</span>
                        <span className="font-bold text-slate-900 uppercase">{billData?.bill_number}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] py-1.5 px-3">
                        <span className="font-bold text-slate-500 uppercase">Bill Date:</span>
                        <span className="font-bold text-slate-900">{formatDate(billData?.billing_date)}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] py-1.5 px-3">
                        <span className="font-bold text-slate-500 uppercase">MR No:</span>
                        <span className="font-bold text-slate-900 uppercase">{billData?.mrn_number}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] py-1.5 px-3">
                        <span className="font-bold text-slate-500 uppercase">Visit ID:</span>
                        <span className="font-bold text-slate-900 uppercase">{billData?.opd_number}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] py-1.5 px-3">
                        <span className="font-bold text-slate-500 uppercase">Registered Date:</span>
                        <span className="font-bold text-slate-900">{formatDateTime(billData?.registered_date)}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] py-1.5 px-3">
                        <span className="font-bold text-slate-500 uppercase">Patient's Phone No:</span>
                        <span className="font-bold text-slate-900">{billData?.contact_number}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] py-1.5 px-3">
                        <span className="font-bold text-slate-500 uppercase">Caretaker Phone No:</span>
                        <span className="font-bold text-slate-900">N/A</span>
                    </div>
                </div>
            </div>

            {/* Charges Table */}
            <div className="mb-6">
                <table className="w-full border-collapse border border-slate-300">
                    <thead>
                        <tr className="bg-slate-50 text-slate-700">
                            <th className="border border-slate-300 py-2 px-3 text-left w-24">Date</th>
                            <th className="border border-slate-300 py-2 px-3 text-left w-32">Head</th>
                            <th className="border border-slate-300 py-2 px-3 text-left">Description</th>
                            <th className="border border-slate-300 py-2 px-3 text-right w-20">Rate</th>
                            <th className="border border-slate-300 py-2 px-3 text-center w-16">Qty</th>
                            <th className="border border-slate-300 py-2 px-3 text-right w-24">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {billData?.items?.map((item: any, idx: number) => (
                            <tr key={idx} className="text-slate-700">
                                <td className="border border-slate-300 py-2 px-3">{formatDate(item.created_at || billData?.billing_date)}</td>
                                <td className="border border-slate-300 py-2 px-3 uppercase font-bold text-[10px]">{item.service_type || 'OPD'}</td>
                                <td className="border border-slate-300 py-2 px-3 uppercase">{item.service_name}</td>
                                <td className="border border-slate-300 py-2 px-3 text-right">{parseFloat(item.unit_price).toFixed(2)}</td>
                                <td className="border border-slate-300 py-2 px-3 text-center">{parseInt(item.quantity)}</td>
                                <td className="border border-slate-300 py-2 px-3 text-right font-bold">{parseFloat(item.final_price).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-50">
                            <td colSpan={5} className="border border-slate-300 py-2 px-3 text-right font-bold text-slate-900">Sub Total</td>
                            <td className="border border-slate-300 py-2 px-3 text-right font-black text-slate-900 text-sm">₹{parseFloat(billData?.total_amount).toFixed(2)}</td>
                        </tr>
                        <tr className="bg-slate-50">
                            <td colSpan={5} className="border border-slate-300 py-2 px-3 text-right font-bold text-slate-900">Total Bill</td>
                            <td className="border border-slate-300 py-2 px-3 text-right font-black text-slate-900 text-sm">₹{parseFloat(billData?.total_amount).toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Disclaimer Section */}
            <div className="mb-6 space-y-1 text-slate-500 font-bold italic text-[10px]">
                <p>*Consultation valid for 4 days only for the same consultant</p>
                <p>*Consultation validity not applicable to Psychiatry Department</p>
            </div>

            {/* Payments Section */}
            <div className="mb-8">
                <table className="w-full border-collapse border border-slate-300">
                    <thead>
                        <tr className="bg-slate-50 text-slate-700">
                            <th className="border border-slate-300 py-1.5 px-3 text-left w-24">Payments</th>
                            <th className="border border-slate-300 py-1.5 px-3 text-left w-40">Invoice Number</th>
                            <th className="border border-slate-300 py-1.5 px-3 text-left">Details</th>
                            <th className="border border-slate-300 py-1.5 px-3 text-right w-24">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="text-slate-700">
                            <td className="border border-slate-300 py-2 px-3 font-bold uppercase">Settlement</td>
                            <td className="border border-slate-300 py-2 px-3 font-bold text-blue-600 font-mono">{billData?.invoice_number}</td>
                            <td className="border border-slate-300 py-2 px-3 uppercase font-bold">{billData?.payment_mode || 'CASH'} - FULL PAYMENT</td>
                            <td className="border border-slate-300 py-2 px-3 text-right font-bold">{parseFloat(billData?.paid_amount || billData?.total_amount).toFixed(2)}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-50">
                            <td colSpan={3} className="border border-slate-300 py-2 px-3 text-right font-bold text-slate-900">Net Payments</td>
                            <td className="border border-slate-300 py-2 px-3 text-right font-black text-slate-900 text-sm">₹{parseFloat(billData?.paid_amount || billData?.total_amount).toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-end mt-12 pb-10">
                <div className="flex flex-col gap-4">
                    <p className="text-xs font-bold text-slate-800">
                        Received with thanks: <span className="uppercase text-slate-600 underline decoration-slate-300 underline-offset-4 decoration-1 decoration-dotted">
                            {toWords(parseFloat(billData?.paid_amount || billData?.total_amount))}
                        </span>
                    </p>
                </div>
                <div className="flex flex-col items-center">
                    <div className="w-40 border-b-2 border-slate-300 mb-2"></div>
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
                        margin: 15mm;
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
