'use client';

import React, { useState, useEffect } from 'react';
import { getReferralDoctors, getDoctorPercentages, upsertDoctorPercentage } from '@/lib/api/marketing';
import { ReferralDoctor, ServicePercentage } from '@/types/marketing';
import { Save } from 'lucide-react';

export default function AccountsReferralPage() {
    const [doctors, setDoctors] = useState<ReferralDoctor[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<ReferralDoctor | null>(null);
    const [percentages, setPercentages] = useState<ServicePercentage[]>([]);

    // Form state for updating percentage
    const [formData, setFormData] = useState({
        service_type: 'OPD',
        referral_pay: 0,
        cash_percentage: 0,
        inpatient_percentage: 0
    });

    useEffect(() => {
        // Fetch doctors
        getReferralDoctors(true).then(res => {
            if (res.success) setDoctors(res.data);
        });
    }, []);

    const handleSelectDoctor = async (doc: ReferralDoctor) => {
        setSelectedDoctor(doc);
        const res = await getDoctorPercentages(doc.id);
        if (res.success) setPercentages(res.data);
    };

    const handleSave = async () => {
        if (!selectedDoctor) return;
        try {
            await upsertDoctorPercentage({
                referral_doctor_id: selectedDoctor.id,
                ...formData,
                status: 'Active'
            });
            alert('Percentages Updated');
            // Refresh
            handleSelectDoctor(selectedDoctor);
        } catch (e) {
            console.error(e);
            alert('Failed to update');
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto flex h-screen overflow-hidden">
            {/* Sidebar List */}
            <div className="w-1/3 border-r pr-4 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Referral Doctors</h2>
                <div className="space-y-2">
                    {doctors.map(doc => (
                        <div
                            key={doc.id}
                            onClick={() => handleSelectDoctor(doc)}
                            className={`p-3 rounded cursor-pointer hover:bg-gray-50 ${selectedDoctor?.id === doc.id ? 'bg-blue-50 border-blue-200 border' : 'border border-gray-100'}`}
                        >
                            <h3 className="font-medium">{doc.doctor_name}</h3>
                            <p className="text-sm text-gray-500">{doc.mobile_number}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="w-2/3 pl-6 overflow-y-auto">
                {selectedDoctor ? (
                    <div>
                        <h2 className="text-xl font-bold mb-6">Manage Percentages: {selectedDoctor.doctor_name}</h2>

                        {/* Existing Percentages Table */}
                        <div className="mb-8">
                            <h3 className="font-medium mb-2">Current Configurations</h3>
                            <table className="min-w-full divide-y divide-gray-200 border">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Service</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Cash %</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">IP %</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Pay</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {percentages.map(p => (
                                        <tr key={p.uuid}>
                                            <td className="px-4 py-2 text-sm">{p.service_type}</td>
                                            <td className="px-4 py-2 text-sm">{p.cash_percentage}%</td>
                                            <td className="px-4 py-2 text-sm">{p.inpatient_percentage}%</td>
                                            <td className="px-4 py-2 text-sm">{p.referral_pay}</td>
                                        </tr>
                                    ))}
                                    {percentages.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">No percentages configured</td></tr>}
                                </tbody>
                            </table>
                        </div>

                        {/* Add/Update Form */}
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <h3 className="font-medium mb-4">Add / Update Configuration</h3>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium">Service Type</label>
                                    <select
                                        value={formData.service_type}
                                        onChange={e => setFormData({ ...formData, service_type: e.target.value })}
                                        className="mt-1 block w-full border rounded p-2"
                                    >
                                        <option value="OPD">OPD</option>
                                        <option value="IPD">IPD</option>
                                        <option value="Lab">Lab</option>
                                        <option value="Pharmacy">Pharmacy</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Referral Pay (Fixed)</label>
                                    <input
                                        type="number"
                                        value={formData.referral_pay}
                                        onChange={e => setFormData({ ...formData, referral_pay: Number(e.target.value) })}
                                        className="mt-1 block w-full border rounded p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Cash Percentage</label>
                                    <input
                                        type="number"
                                        value={formData.cash_percentage}
                                        onChange={e => setFormData({ ...formData, cash_percentage: Number(e.target.value) })}
                                        className="mt-1 block w-full border rounded p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Inpatient Percentage</label>
                                    <input
                                        type="number"
                                        value={formData.inpatient_percentage}
                                        onChange={e => setFormData({ ...formData, inpatient_percentage: Number(e.target.value) })}
                                        className="mt-1 block w-full border rounded p-2"
                                    />
                                </div>
                            </div>
                            <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center hover:bg-blue-700">
                                <Save className="w-4 h-4 mr-1" /> Save Configuration
                            </button>
                        </div>

                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        Select a doctor to manage percentages
                    </div>
                )}
            </div>
        </div>
    );
}
