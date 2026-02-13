'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DoctorForm from '@/components/marketing/DoctorForm';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getReferralDoctorById } from '@/lib/api/marketing';
import { ReferralDoctor } from '@/types/marketing';

export default function EditReferralDoctorPage() {
    const router = useRouter();
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    const [doctor, setDoctor] = useState<ReferralDoctor | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        console.log('Edit Page Mounted. ID from params:', id);

        const fetchDoctor = async () => {
            if (!id) {
                console.error('No ID found!');
                setError('Invalid Doctor ID');
                setLoading(false);
                return;
            }

            try {
                console.log('Fetching doctor with ID:', id);
                const res = await getReferralDoctorById(parseInt(id));
                console.log('Fetch response:', res);
                if (res.success) {
                    setDoctor(res.data);
                } else {
                    setError('Failed to fetch doctor details.');
                }
            } catch (err) {
                console.error('Error fetching doctor:', err);
                setError('Error loading doctor details. Check console.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchDoctor();
        } else {
            console.error('ID is missing from params');
            setError('Missing ID parameter');
            setLoading(false);
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="mt-2 text-gray-500">Loading doctor details for ID: {id}...</p>
            </div>
        );
    }

    if (error || !doctor) {
        return (
            <div className="max-w-5xl mx-auto mt-8 p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
                {error || 'Doctor not found.'}
                <div className="mt-4">
                    <Link href="/marketing/doctors" className="text-blue-600 hover:underline">Return to list</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/marketing/doctors" className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Referral Doctor</h1>
                    <p className="text-sm text-gray-500">Update doctor details</p>
                </div>
            </div>

            <DoctorForm
                doctor={doctor}
                onSuccess={() => {
                    router.push('/marketing/doctors');
                }}
                onCancel={() => router.back()}
            />
        </div>
    );
}
