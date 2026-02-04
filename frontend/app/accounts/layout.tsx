'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    LogOut,
    Menu,
    X,
    FileText,
    Users,
    IndianRupee
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';

export default function AccountsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
            </div>
        );
    }

    if (!user) return null;

    // Consolidated Navigation - simplified for better UX
    const navigation = [
        { name: 'Dashboard', href: '/accountant/dashboard', icon: LayoutDashboard },
        { name: 'Claims', href: '/accountant/insurance-claims', icon: FileText },
        { name: 'Referral Config', href: '/accounts/referrals', icon: Users },
        { name: 'Referral Payments', href: '/accounts/payments', icon: IndianRupee },
    ];

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-blue-950 text-white border-r border-slate-700/50 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
                        <Link href="/accountant/dashboard" className="flex items-center gap-3">
                            <div className="w-10 h-10 relative overflow-hidden">
                                <img src="/logo.png" alt="Logo" className="object-contain w-full h-full" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-white">CareNex AI</h1>
                                <p className="text-xs text-blue-200">Accountant Portal</p>
                            </div>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`
                                        flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                                        ${isActive
                                            ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/20'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }
                                    `}
                                >
                                    <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                                    <span className="font-medium">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-8 shadow-sm">
                    {/* Left: Mobile Menu Button & Logo */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
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
                                <span className="text-blue-900 font-bold">P</span>
                            </div>
                        )}
                    </div>

                    {/* Center: Hospital Name */}
                    <div className="absolute left-1/2 transform -translate-x-1/2">
                        <h1 className="text-2xl font-bold text-blue-900">
                            {user?.hospital_name ?
                                user.hospital_name.charAt(0).toUpperCase() + user.hospital_name.slice(1)
                                : 'CareNex AI'}
                        </h1>
                    </div>

                    {/* Right: User Info & Logout */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                                <p className="text-xs text-gray-500 capitalize">Accountant</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-900 font-semibold border border-blue-200">
                                {user?.username?.charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div className="h-8 w-px bg-gray-200 mx-1 hidden sm:block"></div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                            title="Sign Out"
                        // @ts-ignore
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="hidden sm:inline text-sm font-medium">Logout</span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
