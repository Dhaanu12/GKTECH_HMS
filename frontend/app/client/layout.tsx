'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, UserPlus, Building2, Hospital, Stethoscope, Activity, LogOut, Menu, X, Settings } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { AIContextProvider, FloatingAIAssistant } from '@/components/ai';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, loading, user, logout } = useAuth();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
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

    // Client Admin Navigation - kept within /client routes only 


    const navItems = [
        { name: 'Dashboard', path: '/client/dashboard', icon: LayoutDashboard },
        { name: 'Branches', path: '/client/branches', icon: Building2 },
        { name: 'Clinic Setup', path: '/client/clinic-setup', icon: Settings },
        { name: 'User Management', path: '/client/users', icon: Users },
        { name: 'Referrals', path: '/client/referrals', icon: Hospital },
        { name: 'Reports', path: '/client/reports', icon: Stethoscope },
        { name: 'Schedule', path: '/client/doctor-schedule', icon: Activity },
        { name: 'Medications', path: '/client/medications', icon: Stethoscope }, // Using Stethoscope as placeholder or Pill if available
        { name: 'Profile', path: '/client/profile', icon: Building2 },
    ];

    return (
        <div className="min-h-screen bg-[#EBF5FF] flex">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-blue-950 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-xl flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
                    <Link href="/client/dashboard" className="flex items-center gap-3">
                        <div className="w-10 h-10 relative overflow-hidden">
                            <img src="/logo.png" alt="Logo" className="object-contain w-full h-full" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight leading-tight">CareNex AI</h1>
                            <p className="text-[10px] text-blue-200 uppercase tracking-wider font-semibold">Client Admin</p>
                        </div>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                    >
                        <X className="w-6 h-6" />
                    </button>
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
                                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
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
                    <div className="px-4 lg:px-8 py-4 flex justify-between items-center relative">
                        {/* Left: Mobile Menu & Logo & Page Title */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                            {user?.hospital_logo ? (
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden bg-white border border-gray-200 shadow-sm">
                                    <img
                                        src={`http://localhost:5000/${user.hospital_logo.replace(/\\/g, '/')}`}
                                        alt="Hospital Logo"
                                        className="w-full h-full object-contain p-1"
                                    />
                                </div >
                            ) : (
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                                    <span className="text-white font-bold text-lg">P</span>
                                </div>
                            )}
                            <h2 className="text-xl font-semibold text-slate-700">
                                {navItems.find(item => item.path === pathname)?.name || 'Dashboard'}
                            </h2>
                        </div >

                        {/* Center: Hospital Name */}
                        < div className="absolute left-1/2 transform -translate-x-1/2" >
                            <h1 className="text-2xl font-bold text-blue-900">
                                {user?.hospital_name ?
                                    user.hospital_name.charAt(0).toUpperCase() + user.hospital_name.slice(1)
                                    : 'CareNex AI'}
                            </h1>
                        </div >

                        {/* Right: User Info & Logout */}
                        < div className="flex items-center gap-4" >
                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                                    <p className="text-xs text-gray-500 capitalize">Client Admin</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-900 font-bold border border-blue-200 shadow-sm">
                                    {user?.username?.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div className="h-8 w-px bg-gray-200 mx-1 hidden sm:block"></div>
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                                title="Sign Out"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="hidden sm:inline text-sm font-medium">Logout</span>
                            </button>
                        </div >
                    </div >
                </header >

                {/* Content */}
                < main className="flex-1 overflow-auto p-8 bg-[#EBF5FF]" >
                    <AIContextProvider role="client_admin" initialPage={pathname}>
                        {children}
                        <FloatingAIAssistant />
                    </AIContextProvider>
                </main >
            </div >
        </div >
    );
}
