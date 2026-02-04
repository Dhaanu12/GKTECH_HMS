'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, LogOut, HeartPulse, MessageSquare } from 'lucide-react';

export default function NurseLayout({ children }: { children: React.ReactNode }) {
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

    const navItems = [
        { name: 'Dashboard', path: '/nurse/dashboard', icon: LayoutDashboard },
        { name: 'Patients', path: '/nurse/patients', icon: Users },
        { name: 'Feedbacks', path: '/nurse/feedbacks', icon: MessageSquare },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-blue-950 text-white flex flex-col shadow-xl">
                <div className="p-6 border-b border-slate-700/50">
                    <Link href="/nurse/dashboard" className="flex items-center gap-3">
                        {user?.hospital_logo ? (
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden bg-white">
                                <img
                                    src={`http://localhost:5000/${user.hospital_logo.replace(/\\/g, '/')}`}
                                    alt="Logo"
                                    className="w-full h-full object-contain p-1"
                                />
                            </div>
                        ) : (
                            <div className="w-10 h-10 relative overflow-hidden">
                                <img src="/logo.png" alt="Logo" className="object-contain w-full h-full" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-lg font-bold tracking-tight leading-tight">CareNex AI</h1>
                            <p className="text-[10px] text-blue-200 uppercase tracking-wider font-semibold">Nurse Portal</p>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                    ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/20'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
                    <p className="text-xs text-center text-slate-400">© 2026 CareNex AI</p>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="bg-white shadow-sm border-b border-gray-200 z-10">
                    <div className="px-8 py-4 flex justify-between items-center relative">
                        {/* Left: Page Title */}
                        <h2 className="text-xl font-bold text-slate-800">
                            {navItems.find(item => item.path === pathname)?.name || 'Nurse Portal'}
                        </h2>

                        {/* Center: Hospital Name */}
                        <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:block">
                            <h1 className="text-2xl font-bold text-blue-900 font-heading">
                                {user?.hospital_name ?
                                    user.hospital_name.charAt(0).toUpperCase() + user.hospital_name.slice(1)
                                    : 'CareNex AI'}
                            </h1>
                        </div>

                        {/* Right: User Info & Logout */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-slate-800 capitalize">
                                        {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username || 'Nurse'}
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium capitalize">{user?.role || 'Nurse'}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100 shadow-sm">
                                    {user?.first_name ? user.first_name[0].toUpperCase() : user?.username?.[0]?.toUpperCase() || 'N'}
                                </div>
                            </div>
                            <div className="h-8 w-px bg-gray-200 mx-1 hidden sm:block"></div>
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium text-sm"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
