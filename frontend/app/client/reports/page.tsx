'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Calendar, Filter, Building2, Stethoscope, UserCog, UserCheck, BarChart3, Download } from 'lucide-react';
import BranchPerformance from '@/components/reports/BranchPerformance';
import StaffPerformance from '@/components/reports/StaffPerformance';

export default function ClientAdminReports() {
    const [activeTab, setActiveTab] = useState('overview'); // overview, branch, doctor, nurse, receptionist
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of current year
        endDate: new Date().toISOString().split('T')[0]
    });

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            const params = { startDate: dateRange.startDate, endDate: dateRange.endDate };

            let endpoint = '';

            // We'll use different endpoints based on the active tab
            // For 'overview', we can stick to the existing analytics or a mix
            // For others, use the new reporting controller

            if (activeTab === 'branch') {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/clientadmins/reports/branch`, { headers, params });
                setData(res.data.data);
            } else if (['doctor', 'nurse', 'receptionist'].includes(activeTab)) {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/clientadmins/reports/staff`, {
                    headers,
                    params: { ...params, type: activeTab.toUpperCase() }
                });
                setData(res.data.data);
            } else {
                // Overview - Keep using the robust existing endpoint for summary
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/clientadmins/analytics`, { headers, params });
                setData(res.data.data);
            }

        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    }, [activeTab, dateRange]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 min-h-screen pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <h1 className="text-4xl font-heading font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                        Advanced Reports
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">Detailed performance analysis and comparisons.</p>
                </div>

                <div className="flex items-center gap-4 bg-white/60 p-2 rounded-xl border border-white/60 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-2 px-2 text-slate-500 font-medium">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wider font-bold">Period</span>
                    </div>
                    <input
                        type="date"
                        name="startDate"
                        value={dateRange.startDate}
                        onChange={handleDateChange}
                        className="bg-white/80 border-none rounded-lg text-slate-700 font-semibold focus:ring-2 focus:ring-blue-500/20 shadow-inner px-3 py-1.5 text-sm"
                    />
                    <span className="text-slate-300">|</span>
                    <input
                        type="date"
                        name="endDate"
                        value={dateRange.endDate}
                        onChange={handleDateChange}
                        className="bg-white/80 border-none rounded-lg text-slate-700 font-semibold focus:ring-2 focus:ring-blue-500/20 shadow-inner px-3 py-1.5 text-sm"
                    />
                    <button onClick={fetchData} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition" title="Refresh">
                        <Filter className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition" title="Export">
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-1">
                <TabButton id="overview" label="Overview" icon={BarChart3} active={activeTab} onClick={setActiveTab} />
                <TabButton id="branch" label="Branch Reports" icon={Building2} active={activeTab} onClick={setActiveTab} />
                <TabButton id="doctor" label="Doctors" icon={Stethoscope} active={activeTab} onClick={setActiveTab} />
                <TabButton id="nurse" label="Nurses" icon={UserCheck} active={activeTab} onClick={setActiveTab} />
                <TabButton id="receptionist" label="Receptionists" icon={UserCog} active={activeTab} onClick={setActiveTab} />
                {/* <TabButton id="compare" label="Comparisons" icon={ArrowRightLeft} active={activeTab} onClick={setActiveTab} /> */}
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'overview' && data && (
                            <div className="p-12 text-center text-gray-500 bg-white/50 rounded-3xl border border-dashed border-gray-300">
                                <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <h3 className="text-xl font-bold text-gray-400">General Overview</h3>
                                <p>Use the specific tabs above for detailed breakdown reports.</p>
                                {/* We could reuse the ReportPage.tsx components here if needed, but keeping it simple for now to focus on new requirements */}
                            </div>
                        )}

                        {activeTab === 'branch' && data && <BranchPerformance data={data} />}

                        {['doctor', 'nurse', 'receptionist'].includes(activeTab) && data && (
                            <StaffPerformance data={data} type={activeTab.toUpperCase() as any} />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function TabButton({ id, label, icon: Icon, active, onClick }: any) {
    const isActive = active === id;
    return (
        <button
            onClick={() => onClick(id)}
            className={`
                flex items-center gap-2 px-6 py-3 rounded-t-xl font-semibold text-sm transition-all duration-300
                ${isActive
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm translate-y-[1px]'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                }
            `}
        >
            <Icon className={`w-4 h-4 ${isActive ? 'text-blue-500' : 'text-slate-400'}`} />
            {label}
        </button>
    );
}
