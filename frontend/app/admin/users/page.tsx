'use client';

import { useState } from 'react';
import { UserPlus, Stethoscope, Users, Briefcase, UserCog, TrendingUp } from 'lucide-react';
import ClientAdminsPage from '../client-admins/page';
import DoctorsPage from '../doctors/page';
// import NursesPage from '../nurses/page';
import ReceptionistsPage from '../receptionists/page';
import AccountantsPage from '../accountants/page';
import MarketingUsersPage from '../marketing-users/page';

export default function UserManagementPage() {
    const [activeTab, setActiveTab] = useState('client-admins');

    const tabs = [
        { id: 'client-admins', label: 'Client Admins', icon: UserPlus, component: ClientAdminsPage },
        { id: 'doctors', label: 'Doctors', icon: Stethoscope, component: DoctorsPage },
        // { id: 'nurses', label: 'Nurses', icon: Users, component: NursesPage },
        { id: 'receptionists', label: 'Receptionists', icon: Briefcase, component: ReceptionistsPage },
        { id: 'marketing', label: 'Marketing', icon: TrendingUp, component: MarketingUsersPage },
        { id: 'accountants', label: 'Accountants', icon: UserCog, component: AccountantsPage },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600 text-sm">Manage all users across the system from a single place.</p>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-1 overflow-x-auto pb-1" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                                    ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }
                                `}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {tabs.map((tab) => (
                    <div key={tab.id} className={activeTab === tab.id ? 'block' : 'hidden'}>
                        <tab.component />
                    </div>
                ))}
            </div>
        </div>
    );
}
