'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Lock, Mail, Loader2, AlertCircle, Stethoscope } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                email: formData.email,
                password: formData.password
            });

            if (response.data.status === 'success') {
                const { accessToken, user } = response.data.data;

                console.log('Login successful. Full response:', response.data);
                console.log('User object:', user);

                localStorage.setItem('token', accessToken);
                localStorage.setItem('user', JSON.stringify(user));

                // Backend returns role_code as a flat property on user object
                const roleCode = user.role_code;
                console.log('Detected Role Code:', roleCode);

                // Redirect based on role
                let targetPath = '/dashboard';

                if (roleCode === 'SUPER_ADMIN') {
                    targetPath = '/admin/dashboard';
                } else if (roleCode === 'CLIENT_ADMIN') {
                    targetPath = '/client/dashboard';
                } else if (roleCode === 'DOCTOR') {
                    targetPath = '/doctor/dashboard';
                } else if (roleCode === 'NURSE') {
                    targetPath = '/nurse/dashboard';
                } else if (roleCode === 'RECEPTIONIST') {
                    targetPath = '/receptionist/dashboard';
                } else if (roleCode === 'ACCOUNTANT' || roleCode === 'ACCOUNTANT_MANAGER') {
                    targetPath = '/accountant/dashboard';
                } else if (roleCode === 'MRKT_EXEC' || roleCode === 'MRKT_MNGR') {
                    targetPath = '/marketing/dashboard';
                }

                console.log('Attempting to navigate to:', targetPath);

                // Use window.location.href for a hard navigation to ensure state is fresh
                // This often fixes issues where router.push doesn't trigger a re-render or middleware interferes
                window.location.href = targetPath;
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0f172a]">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0 animate-gradient-x bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 opacity-80"></div>

            {/* Ambient Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600 rounded-full blur-[120px] opacity-20 animate-float"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600 rounded-full blur-[120px] opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>

            {/* Glass Container */}
            <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden rounded-3xl glass-panel shadow-2xl mx-4 transition-all duration-500">
                {/* Left Side: Brand/Vision */}
                <div className="hidden md:flex flex-col justify-between p-12 bg-black/20 backdrop-blur-sm border-r border-white/10 text-white relative">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center backdrop-blur text-xl font-bold border border-white/10">
                                <Stethoscope className="w-6 h-6 text-blue-400" />
                            </div>
                            <h1 className="font-heading font-bold text-2xl tracking-wide text-white">CareNex AI</h1>
                        </div>
                        <h2 className="text-4xl font-heading font-bold leading-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-indigo-200">
                            Healthcare.<br />Reimagined.
                        </h2>
                        <p className="text-blue-100/70 leading-relaxed max-w-sm font-light">
                            Experience the future of hospital administration. <br />
                            <span className="font-medium text-white">Intelligent. Predictive. Seamless.</span>
                        </p>
                    </div>

                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-md relative z-10 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-white">System Operational</span>
                        </div>
                        <p className="text-xs text-white/40">v2.4.0 (Stable) • Server: US-East</p>
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="p-8 md:p-12 bg-white/70 backdrop-blur-lg">
                    <div className="mb-10">
                        <h3 className="text-3xl font-bold text-slate-800 font-heading mb-2">Welcome Back</h3>
                        <p className="text-slate-500">Enter your credentials to access the portal.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50/80 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-sm backdrop-blur-sm animate-pulse">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Inputs using glass-input class */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-300" />
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl glass-input text-slate-900 placeholder:text-slate-400 focus:bg-white transition-all duration-300"
                                    placeholder="admin@phchms.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-semibold text-slate-700">Password</label>
                                <a href="#" className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">Forgot password?</a>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-300" />
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl glass-input text-slate-900 placeholder:text-slate-400 focus:bg-white transition-all duration-300"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 group mt-8"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    Sign In <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-200/60 text-center">
                        <p className="text-xs text-slate-500 bg-white/50 inline-block px-3 py-1 rounded-full border border-slate-100">
                            Demo: <span className="font-semibold text-slate-700">admin@phchms.com</span> / <span className="font-semibold text-slate-700">Admin123!</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
