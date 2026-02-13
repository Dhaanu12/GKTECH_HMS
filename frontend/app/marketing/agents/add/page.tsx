'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import AgentForm from '@/components/marketing/AgentForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AddReferralAgentPage() {
    const router = useRouter();

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/marketing/agents" className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Add New Referral Agent</h1>
                    <p className="text-sm text-gray-500">Register a new referral agent (e.g. HR, Clinic Manager)</p>
                </div>
            </div>

            <AgentForm
                onSuccess={() => {
                    router.push('/marketing/agents');
                }}
                onCancel={() => router.back()}
            />
        </div>
    );
}
