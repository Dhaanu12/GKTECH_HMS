'use client';

import { useParams } from 'next/navigation';
import PatientProfile from '@/components/patient/PatientProfile';

export default function NursePatientDetailsPage() {
    const params = useParams();
    // handle potential array for id
    const id = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : '';

    if (!id) return <div className="p-12 text-center text-slate-500">Loading patient...</div>;

    return <PatientProfile patientId={id} userRole="nurse" />;
}
