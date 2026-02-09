'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/lib/AuthContext';
import { Building2, Users, Stethoscope, Briefcase, Sparkles } from 'lucide-react';
import { AIInsightCard, AILoadingIndicator } from '@/components/ai';
import { getDashboardInsights } from '@/lib/api/ai';

export default function ClientDashboard() {
    const { user } = useAuth();
    const [statsData, setStatsData] = useState({
        branches: 0,
        doctors: 0,
        nurses: 0,
        receptionists: 0
    });
    
    // AI insights state
    const [aiInsights, setAiInsights] = useState<string | null>(null);
    const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
    
    const handleGenerateInsights = async () => {
        setAiInsightsLoading(true);
        setAiInsights(null);
        
        try {
            const result = await getDashboardInsights({
                totalBranches: statsData.branches,
                totalDoctors: statsData.doctors,
                totalNurses: statsData.nurses,
                totalReceptionists: statsData.receptionists,
                roleType: 'Client Admin',
                hospitalName: user?.hospital_name || 'Unknown',
                timestamp: new Date().toISOString(),
            });
            
            if (result.success) {
                setAiInsights(result.message);
            } else {
                setAiInsights(result.message);
            }
        } catch (err) {
            setAiInsights('Failed to generate insights. Please try again.');
        } finally {
            setAiInsightsLoading(false);
        }
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('/api/clientadmins/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStatsData(response.data.data.stats);
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            }
        };
        fetchStats();
    }, []);

    const stats = [
        { title: 'Total Branches', value: statsData.branches, color: 'blue', icon: Building2 },
        { title: 'Total Doctors', value: statsData.doctors, color: 'green', icon: Stethoscope },
        { title: 'Total Nurses', value: statsData.nurses, color: 'purple', icon: Users },
        { title: 'Receptionists', value: statsData.receptionists, color: 'orange', icon: Briefcase },
    ];

    return (
        <div>
            {/* Welcome Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
                <h3 className="text-xl font-semibold mb-4">Welcome, {user?.username}!</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Role</p>
                        <p className="font-medium">Client Admin</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{user?.email || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Hospital ID</p>
                        <p className="font-medium">{user?.hospital_id || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <p className="font-medium text-green-600">Active</p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    const colorClasses = {
                        blue: 'bg-blue-500',
                        green: 'bg-green-500',
                        purple: 'bg-purple-500',
                        orange: 'bg-orange-500'
                    };

                    return (
                        <div key={stat.title} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                            <div className={`w-12 h-12 ${colorClasses[stat.color as keyof typeof colorClasses]} rounded-lg flex items-center justify-center mb-4`}>
                                <Icon className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="text-gray-600 text-sm font-medium">{stat.title}</h4>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* AI Insights Panel */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg text-white">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">AI Insights</h3>
                            <p className="text-xs text-slate-500">Get AI-powered analysis of your hospital metrics</p>
                        </div>
                    </div>
                    <button
                        onClick={handleGenerateInsights}
                        disabled={aiInsightsLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium text-sm hover:from-indigo-600 hover:to-purple-600 transition-all shadow-md disabled:opacity-50"
                    >
                        <Sparkles className="w-4 h-4" />
                        {aiInsightsLoading ? 'Analyzing...' : 'Generate Insights'}
                    </button>
                </div>
                
                {aiInsightsLoading && (
                    <AILoadingIndicator text="Analyzing dashboard metrics..." />
                )}
                {aiInsights && !aiInsightsLoading && (
                    <AIInsightCard
                        title="Dashboard Analysis"
                        content={aiInsights}
                        type="info"
                        onDismiss={() => setAiInsights(null)}
                    />
                )}
                {!aiInsights && !aiInsightsLoading && (
                    <p className="text-sm text-slate-500 text-center py-4">
                        Click "Generate Insights" to get AI-powered analysis of your hospital metrics.
                    </p>
                )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <p className="text-gray-600 text-sm">Management features coming soon...</p>
            </div>
        </div>
    );
}

function QuickActionButton({ title, href }: { title: string; href: string }) {
    return (
        <a
            href={href}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition text-center cursor-pointer"
        >
            <p className="font-medium text-gray-700">{title}</p>
        </a>
    );
}
