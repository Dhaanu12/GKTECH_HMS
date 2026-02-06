'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import DoctorForm from '@/components/marketing/DoctorForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AddReferralDoctorPage() {
    const router = useRouter();

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/marketing/dashboard" className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Add New Referral Doctor</h1>
                    <p className="text-sm text-gray-500">Register a new doctor to the referral network</p>
                </div>
            </div>

            <DoctorForm
                onSuccess={() => {
                    alert('Doctor added successfully!');
                    router.push('/marketing/dashboard');
                }}
                onCancel={() => router.back()}
                requireLocation={true}
            />
        </div>
    );
}
