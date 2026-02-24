'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, PlusCircle, Users, LogOut, FileText, Stethoscope } from 'lucide-react';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, loading, user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    // Marketing Navigation
    const navItems = [
        { name: 'Dashboard', path: '/marketing/dashboard', icon: LayoutDashboard },
        ...(user?.role_code === 'MRKT_MNGR' ? [{ name: 'My Team', path: '/marketing/team', icon: Users }] : []),
        { name: 'Referral Doctors', path: '/marketing/doctors', icon: Stethoscope },
        { name: 'Referral Patients', path: '/marketing/patients', icon: Users, disabled: false },
        { name: 'Manage Agents', path: '/marketing/agents', icon: Users },
        { name: 'Referral Reports', path: '/marketing/referral-payment/reports', icon: FileText },
    ];

    return (
        <div className="min-h-screen bg-[#EBF5FF] flex">
            {/* Sidebar */}
            <aside className="w-64 bg-blue-950 text-white flex flex-col shadow-xl">
                <div className="p-6 border-b border-slate-700/50">
                    <Link href="/marketing/dashboard" className="flex items-center gap-3">
                        <div className="w-8 h-8 relative overflow-hidden">
                            <img src="/logo.png" alt="Logo" className="object-contain w-full h-full" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Global Healthcare</h1>
                            <p className="text-xs text-blue-200">Marketing Panel</p>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.path;
                        const isDisabled = item.disabled;

                        return (
                            <Link
                                key={item.name}
                                href={item.path}
                                onClick={(e) => isDisabled && e.preventDefault()}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isDisabled
                                    ? 'text-slate-500 cursor-not-allowed hover:bg-transparent'
                                    : isActive
                                        ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/20'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isDisabled ? 'text-slate-600' : isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
                    <div className="px-2">
                        <p className="text-xs text-blue-200 text-center">Marketing Panel</p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="bg-white shadow-sm border-b border-gray-200 z-10 relative">
                    <div className="px-8 py-4 flex justify-between items-center h-20">
                        {/* Left: Logo & Fallback */}
                        <div className="flex items-center gap-3">
                            {user?.hospital_logo ? (
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden bg-white border border-gray-200 shadow-sm">
                                    <img
                                        src={`http://localhost:5000/${user.hospital_logo.replace(/\\/g, '/')}`}
                                        alt="Hospital Logo"
                                        className="w-full h-full object-contain p-1"
                                    />
                                </div>
                            ) : (
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shadow-sm">
                                    <span className="text-blue-900 font-bold text-lg">
                                        {user?.hospital_name ? user.hospital_name.charAt(0).toUpperCase() : 'H'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Center: Hospital Name */}
                        <div className="absolute left-1/2 transform -translate-x-1/2">
                            <h1 className="text-xl font-bold text-slate-700">
                                {user?.hospital_name || 'Sunrise Hospital'}
                            </h1>
                        </div>

                        {/* Right: User Profile & Logout */}
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-semibold text-slate-700">{user?.username}</p>
                                    <p className="text-xs text-slate-500">{user?.role_name || 'Marketing'}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-900 font-bold border border-blue-200 shadow-sm">
                                    {user?.username?.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-auto p-8 bg-[#EBF5FF]">
                    {children}
                </main>
            </div>
        </div>
    );
}
