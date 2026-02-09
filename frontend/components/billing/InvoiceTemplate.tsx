import React from 'react';

interface InvoiceTemplateProps {
    billData: any;
    hospitalData: any;
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ billData, hospitalData }) => {
    // Helper to format date
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString(); // Matches "2/8/2026 22:55:00" format roughly or locale specific
    };

    return (
        <div id="invoice-print-area" className="bg-white p-8 max-w-3xl mx-auto font-sans">
            {/* Header */}
            <div className="text-center mb-4">
                <h1 className="text-2xl font-bold text-blue-900 uppercase tracking-wide">
                    {hospitalData?.name || 'CARE 24 MEDICAL CENTRE & HOSPITAL MAIN BRANCH'}
                </h1>
                {/* ISO Certification - Placeholder as requested by design */}
                <p className="text-gray-500 text-sm font-semibold mt-1">ISO 9001:2015 Certified</p>

                {/* Helpline absolute right */}
                <div className="absolute top-8 right-8 text-right">
                    <p className="text-sm text-gray-800">Helpline: {hospitalData?.phone || '7406455036'}</p>
                </div>
            </div>

            {/* Separator Line */}
            <div className="border-b-2 border-slate-800 mb-4"></div>

            {/* Title */}
            <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-slate-900 uppercase underline decoration-2 underline-offset-4">OPD PAYMENT RECEIPT</h2>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6 text-sm font-medium text-slate-800">
                <div className="grid grid-cols-[140px_1fr]">
                    <span className="text-slate-600">Q.No / Receipt No.:</span>
                    <span className="font-bold">{billData?.token_number ? billData.token_number : ''} / {billData?.bill_number?.split('-').pop() || '1'}</span>
                </div>
                <div className="grid grid-cols-[80px_1fr]">
                    <span className="text-slate-600">Date:</span>
                    <span>{formatDate(billData?.created_at)}</span>
                </div>

                <div className="grid grid-cols-[140px_1fr]">
                    <span className="text-slate-600">UHID / OPD ID:</span>
                    <span className="uppercase">{billData?.mrn_number} / {billData?.opd_number}</span>
                </div>
                <div className="grid grid-cols-[80px_1fr]">
                    <span className="text-slate-600">Name:</span>
                    <span className="font-bold uppercase">{billData?.patient_name}</span>
                </div>
            </div>

            {/* Items Table */}
            <div className="mb-4">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="border-y-2 border-slate-800">
                            <th className="py-2 text-left w-16 font-bold text-slate-900">S.No.</th>
                            <th className="py-2 text-left font-bold text-slate-900">Particular</th>
                            <th className="py-2 text-right font-bold text-slate-900">Amount(Rs)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {billData?.items?.map((item: any, idx: number) => (
                            <tr key={idx}>
                                <td className="py-3 pl-2 align-top">{idx + 1}</td>
                                <td className="py-3 align-top">{item.service_name}</td>
                                <td className="py-3 text-right font-medium">{parseFloat(item.final_price).toFixed(2)}</td>
                            </tr>
                        ))}
                        {/* Minimum height filler if needed */}
                        {(!billData?.items || billData?.items.length === 0) && (
                            <tr><td colSpan={3} className="py-8 text-center text-gray-400">No items</td></tr>
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="border-y-2 border-slate-800">
                            <td colSpan={2} className="py-2 text-right font-bold text-slate-900 pr-4">Paid Amount</td>
                            <td className="py-2 text-right font-bold text-slate-900">{parseFloat(billData?.paid_amount || billData?.total_amount).toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Footer */}
            <div className="mt-12 flex justify-between items-end">
                <div className="text-sm italic text-slate-700">
                    Received with thanks <strong>Rs. {parseFloat(billData?.paid_amount || billData?.total_amount).toFixed(0)} /-</strong>
                </div>

                <div className="text-center">
                    <div className="w-48 border-t border-slate-400 mb-1"></div>
                    <p className="text-sm text-slate-600">Authorized Signature</p>
                </div>
            </div>

            {/* Print Specific styles to ensure clean output */}
            <style jsx global>{`
                @media print {
                    #invoice-print-area {
                        display: block !important;
                        width: 100%;
                        max-width: none;
                        padding: 10mm;
                    }
                }
            `}</style>
        </div>
    );
};

export default InvoiceTemplate;
