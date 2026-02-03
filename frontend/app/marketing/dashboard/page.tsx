'use client';

import React, { useState, useEffect } from 'react';
import DoctorForm from '@/components/marketing/DoctorForm';
import { getReferralDoctors } from '@/lib/api/marketing';
import { ReferralDoctor } from '@/types/marketing';
import { Plus, Edit } from 'lucide-react';

export default function MarketingDashboard() {
    const [view, setView] = useState<'list' | 'form'>('list');
    const [doctors, setDoctors] = useState<ReferralDoctor[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<ReferralDoctor | undefined>(undefined);

    const fetchDoctors = async () => {
        try {
            const res = await getReferralDoctors(true); // Masked by default
            if (res.success) setDoctors(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (view === 'list') fetchDoctors();
    }, [view]);

    const handleEdit = (doc: ReferralDoctor) => {
        setSelectedDoctor(doc);
        setView('form');
    };

    const handleNew = () => {
        setSelectedDoctor(undefined);
        setView('form');
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Referral Doctors List</h2>

            {view === 'list' ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {doctors.map(doc => (
                        <div key={doc.uuid} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                            <h3 className="font-semibold text-lg">{doc.doctor_name}</h3>
                            <p className="text-sm text-gray-500">{doc.speciality_type}</p>
                            <p className="text-sm text-gray-500">{doc.mobile_number}</p>
                            <div className="mt-4 flex justify-between items-center">
                                <span className={`text-xs px-2 py-1 rounded-full ${doc.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {doc.status || 'Pending'}
                                </span>
                                <button onClick={() => handleEdit(doc)} className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                                    <Edit className="w-3 h-3 mr-1" /> Edit
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="max-w-4xl mx-auto">
                    <DoctorForm
                        doctor={selectedDoctor}
                        onSuccess={() => setView('list')}
                        onCancel={() => setView('list')}
                    />
                </div>
            )}
        </div>
    );
}
