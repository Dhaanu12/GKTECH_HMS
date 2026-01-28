'use client';

import { useAuth } from '../../../lib/AuthContext';

export default function NurseDashboard() {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.username}</h1>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <p className="text-gray-600">This is the Nurse Portal dashboard.</p>
            </div>
        </div>
    );
}
