// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import axios from 'axios';
// import { toPng } from 'html-to-image';
// import { Calendar, Filter, Building2, Stethoscope, UserCog, UserCheck, BarChart3, FileText } from 'lucide-react';

// // New Dashboard Components for Overview
// import { KPIGrid } from '@/components/dashboard/KPIGrid';
// import { RevenueTrendChart, RevenueBreakdownPie } from '@/components/dashboard/RevenueCharts';
// import { TopDiagnosesChart, DiseaseTrendChart } from '@/components/dashboard/ClinicalCharts';
// import { PeakHoursChart, EfficiencyMetrics } from '@/components/dashboard/OperationalCharts';
// import { PatientRetentionChart, HighValuePatientsTable } from '@/components/dashboard/PatientCharts';

// // Existing Report Components
// import BranchPerformance from '@/components/reports/BranchPerformance';
// import StaffPerformance from '@/components/reports/StaffPerformance';

// export default function ClientAdminReports() {
//     const [activeTab, setActiveTab] = useState('overview');
//     const [dateRange, setDateRange] = useState({
//         startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
//         endDate: new Date().toISOString().split('T')[0]
//     });

//     const [loading, setLoading] = useState(false);
//     const [data, setData] = useState<any>(null);
//     const [error, setError] = useState<string | null>(null);
//     const [fetchTrigger, setFetchTrigger] = useState(0);
//     const [exporting, setExporting] = useState(false);

//     useEffect(() => {
//         const fetchData = async () => {
//             console.log('🔄 Fetching data...');
//             setLoading(true);
//             setData(null);
//             setError(null);

//             try {
//                 const token = localStorage.getItem('token');
//                 const headers = { Authorization: `Bearer ${token}` };
//                 const params = {
//                     startDate: dateRange.startDate,
//                     endDate: dateRange.endDate
//                 };

//                 let res;

//                 if (activeTab === 'branch') {
//                     res = await axios.get(
//                         `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/clientadmins/reports/branch`,
//                         { headers, params }
//                     );
//                 } else if (['doctor', 'nurse', 'receptionist'].includes(activeTab)) {
//                     res = await axios.get(
//                         `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/clientadmins/reports/staff`,
//                         {
//                             headers,
//                             params: { ...params, type: activeTab.toUpperCase() }
//                         }
//                     );
//                 } else {
//                     // Overview - Use new Executive Stats
//                     res = await axios.get(
//                         `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/clientadmins/executive-stats`,
//                         { headers, params }
//                     );
//                 }

//                 console.log('📥 Received response:', res.data);
//                 setData(res.data.data);

//             } catch (error: any) {
//                 console.error('❌ Error:', error);
//                 setError(error.response?.data?.message || error.message || 'Failed to fetch data');
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchData();
//     }, [activeTab, fetchTrigger]);

//     const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
//     };

//     const handleApplyFilter = () => {
//         setFetchTrigger(prev => prev + 1);
//     };

//     const handleExportPDF = async () => {
//         // PDF Export logic (simplified for brevity, similar to before but without raw HTML generation for charts if possible, or using window.print)
//         // For now, retaining the window.print approach but noting that it might need refined CSS for correct page breaks.
//         alert("Use browser print (Ctrl+P) and Save as PDF for best results.");
//         window.print();
//     };

//     return (
//         <div className="space-y-8 animate-in fade-in duration-700 min-h-screen pb-20 print:p-0">
//             {/* Header Section */}
//             <div className="flex flex-col md:flex-row justify-between items-end gap-6 print:hidden">
//                 <div>
//                     <h1 className="text-4xl font-heading font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
//                         Advanced Reports
//                     </h1>
//                     <p className="text-slate-500 mt-2 text-lg">Detailed performance analysis and comparisons.</p>
//                 </div>

//                 <div className="flex items-center gap-4 bg-white/60 p-2 rounded-xl border border-white/60 shadow-sm backdrop-blur-sm">
//                     <div className="flex items-center gap-2 px-2 text-slate-500 font-medium">
//                         <Calendar className="w-4 h-4" />
//                         <span className="text-xs uppercase tracking-wider font-bold">Period</span>
//                     </div>
//                     <input
//                         type="date"
//                         name="startDate"
//                         value={dateRange.startDate}
//                         onChange={handleDateChange}
//                         className="bg-white/80 border-none rounded-lg text-slate-700 font-semibold focus:ring-2 focus:ring-blue-500/20 shadow-inner px-3 py-1.5 text-sm"
//                     />
//                     <span className="text-slate-300">|</span>
//                     <input
//                         type="date"
//                         name="endDate"
//                         value={dateRange.endDate}
//                         onChange={handleDateChange}
//                         className="bg-white/80 border-none rounded-lg text-slate-700 font-semibold focus:ring-2 focus:ring-blue-500/20 shadow-inner px-3 py-1.5 text-sm"
//                     />
//                     <button
//                         onClick={handleApplyFilter}
//                         disabled={loading}
//                         className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition disabled:opacity-50"
//                         title="Apply Filters"
//                     >
//                         <Filter className="w-4 h-4" />
//                     </button>
//                     <button
//                         onClick={handleExportPDF}
//                         disabled={loading}
//                         className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
//                         title="Print / PDF"
//                     >
//                         <FileText className="w-4 h-4" />
//                     </button>
//                 </div>
//             </div>

//             {/* Tabs */}
//             <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-1 print:hidden">
//                 <TabButton id="overview" label="Overview" icon={BarChart3} active={activeTab} onClick={setActiveTab} />
//                 <TabButton id="branch" label="Branch Reports" icon={Building2} active={activeTab} onClick={setActiveTab} />
//                 <TabButton id="doctor" label="Doctors" icon={Stethoscope} active={activeTab} onClick={setActiveTab} />
//                 <TabButton id="nurse" label="Nurses" icon={UserCheck} active={activeTab} onClick={setActiveTab} />
//                 <TabButton id="receptionist" label="Receptionists" icon={UserCog} active={activeTab} onClick={setActiveTab} />
//             </div>

//             {/* Content Area */}
//             <div className="min-h-[400px] print:min-h-0">
//                 {error && (
//                     <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-4 print:hidden">
//                         <strong>Error:</strong> {error}
//                     </div>
//                 )}

//                 {loading ? (
//                     <div className="flex flex-col items-center justify-center h-64 gap-4 print:hidden">
//                         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//                         <p className="text-slate-500 text-sm">Loading {activeTab} reports...</p>
//                     </div>
//                 ) : (
//                     <>
//                         {/* OVERVIEW TAB - NEW EXECUTIVE STATS */}
//                         {activeTab === 'overview' && data && (
//                             <div className="space-y-6">
//                                 <div className="print:block hidden mb-6 text-center border-b pb-4">
//                                     <h1 className="text-2xl font-bold text-slate-800">Executive Summary Report</h1>
//                                     <p className="text-slate-500">{dateRange.startDate} to {dateRange.endDate}</p>
//                                 </div>

//                                 {/* KPI Cards */}
//                                 <section className="break-inside-avoid">
//                                     <KPIGrid data={data} />
//                                 </section>

//                                 {/* Revenue Intelligence */}
//                                 <section className="break-inside-avoid bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
//                                     <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
//                                         <div className="p-1.5 bg-blue-100 rounded-md text-blue-700">
//                                             <BarChart3 className="w-4 h-4" />
//                                         </div>
//                                         Revenue Intelligence
//                                     </h2>
//                                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                                         <div className="lg:col-span-2 h-80">
//                                             <RevenueTrendChart data={data.revenue_trend} />
//                                         </div>
//                                         <div className="h-80 border-l border-gray-100 pl-6">
//                                             <RevenueBreakdownPie revenue={data.kpi?.revenue_month} breakdown={data.revenue_breakdown} />
//                                         </div>
//                                     </div>
//                                 </section>

//                                 {/* Clinical Intelligence */}
//                                 <section className="break-inside-avoid bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
//                                     <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
//                                         <div className="p-1.5 bg-emerald-100 rounded-md text-emerald-700">
//                                             <Stethoscope className="w-4 h-4" />
//                                         </div>
//                                         Clinical Intelligence
//                                     </h2>
//                                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
//                                         <div className="h-80 pr-6">
//                                             <TopDiagnosesChart data={data.diagnoses} />
//                                         </div>
//                                         <div className="h-80 pl-6 pt-6 lg:pt-0">
//                                             <DiseaseTrendChart data={data.disease_trend} />
//                                         </div>
//                                     </div>
//                                 </section>

//                                 {/* Operational Efficiency */}
//                                 <section className="break-inside-avoid bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
//                                     <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
//                                         <div className="p-1.5 bg-purple-100 rounded-md text-purple-700">
//                                             <UserCog className="w-4 h-4" />
//                                         </div>
//                                         Operational Efficiency
//                                     </h2>
//                                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                                         <div className="h-80">
//                                             <PeakHoursChart data={data.peak_hours} />
//                                         </div>
//                                         <div>
//                                             <h3 className="text-sm font-medium text-gray-700 mb-4">Key Metrics</h3>
//                                             <EfficiencyMetrics metrics={data.efficiency} />
//                                         </div>
//                                     </div>
//                                 </section>

//                                 {/* Patient Intelligence */}
//                                 <section className="break-inside-avoid grid grid-cols-1 lg:grid-cols-2 gap-6">
//                                     {/* Patient Retention Card */}
//                                     <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm h-full">
//                                         <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
//                                             <div className="p-1.5 bg-orange-100 rounded-md text-orange-700">
//                                                 <UserCheck className="w-4 h-4" />
//                                             </div>
//                                             Patient Retention
//                                         </h2>
//                                         <div className="h-64">
//                                             <PatientRetentionChart data={data.retention} />
//                                         </div>
//                                     </div>

//                                     {/* High Value Patients Card */}
//                                     <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm h-full">
//                                         <div className="h-full">
//                                             <HighValuePatientsTable data={data.high_value_patients} />
//                                         </div>
//                                     </div>
//                                 </section>
//                             </div>
//                         )}

//                         {activeTab === 'branch' && data && <BranchPerformance data={data} />}

//                         {['doctor', 'nurse', 'receptionist'].includes(activeTab) && data && (
//                             <StaffPerformance data={data} type={activeTab.toUpperCase() as any} />
//                         )}

//                         {!data && !loading && !error && (
//                             <div className="flex flex-col items-center justify-center h-64 gap-4">
//                                 <p className="text-slate-400">No data available for the selected period.</p>
//                             </div>
//                         )}
//                     </>
//                 )}
//             </div>

//             <style jsx global>{`
//                 @media print {
//                     @page { margin: 15mm; }
//                     body { -webkit-print-color-adjust: exact; }
//                 }
//             `}</style>
//         </div>
//     );
// }

// function TabButton({ id, label, icon: Icon, active, onClick }: any) {
//     const isActive = active === id;
//     return (
//         <button
//             onClick={() => onClick(id)}
//             className={`
//                 flex items-center gap-2 px-6 py-3 rounded-t-xl font-semibold text-sm transition-all duration-300
//                 ${isActive
//                     ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm translate-y-[1px]'
//                     : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
//                 }
//             `}
//         >
//             <Icon className={`w-4 h-4 ${isActive ? 'text-blue-500' : 'text-slate-400'}`} />
//             {label}
//         </button>
//     );
// }


// 'use client';

// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { Calendar, Download, TrendingUp, Building2, Stethoscope, UserCog, UserCheck, BarChart3, RefreshCw, Sparkles } from 'lucide-react';

// // Dashboard Components for Overview
// import { KPIGrid } from '@/components/dashboard/KPIGrid';
// import { RevenueTrendChart, RevenueBreakdownPie } from '@/components/dashboard/RevenueCharts';
// import { TopDiagnosesChart, DiseaseTrendChart } from '@/components/dashboard/ClinicalCharts';
// import { PeakHoursChart, EfficiencyMetrics } from '@/components/dashboard/OperationalCharts';
// import { PatientRetentionChart, HighValuePatientsTable } from '@/components/dashboard/PatientCharts';

// // Report Components
// import BranchPerformance from '@/components/reports/BranchPerformance';
// import StaffPerformance from '@/components/reports/StaffPerformance';

// export default function ClientAdminReports() {
//     const [activeTab, setActiveTab] = useState('overview');

//     // Start with no date range - let API use defaults
//     const [dateRange, setDateRange] = useState({
//         startDate: '',
//         endDate: ''
//     });

//     // Track if user has set custom dates
//     const [useCustomDates, setUseCustomDates] = useState(false);

//     const [loading, setLoading] = useState(false);
//     const [data, setData] = useState<any>(null);
//     const [error, setError] = useState<string | null>(null);
//     const [fetchTrigger, setFetchTrigger] = useState(0);

//     useEffect(() => {
//         const fetchData = async () => {
//             console.log('🔄 Fetching data...');
//             setLoading(true);
//             setData(null);
//             setError(null);

//             try {
//                 const token = localStorage.getItem('token');
//                 const headers = { Authorization: `Bearer ${token}` };

//                 // Only include date params if user has set them
//                 const params: any = {};
//                 if (useCustomDates && dateRange.startDate && dateRange.endDate) {
//                     params.startDate = dateRange.startDate;
//                     params.endDate = dateRange.endDate;
//                 }

//                 let res;

//                 if (activeTab === 'branch') {
//                     res = await axios.get(
//                         `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/clientadmins/reports/branch`,
//                         { headers, params }
//                     );
//                 } else if (['doctor', 'nurse', 'receptionist'].includes(activeTab)) {
//                     res = await axios.get(
//                         `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/clientadmins/reports/staff`,
//                         {
//                             headers,
//                             params: { ...params, type: activeTab.toUpperCase() }
//                         }
//                     );
//                 } else {
//                     // Overview - Use Executive Stats (same endpoint as dashboard)
//                     res = await axios.get(
//                         `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/clientadmins/executive-stats`,
//                         { headers, params }
//                     );
//                 }

//                 console.log('📥 Received response:', res.data);

//                 // Handle response structure
//                 if (res.data && res.data.data) {
//                     setData(res.data.data);
//                 } else if (res.data) {
//                     setData(res.data);
//                 } else {
//                     throw new Error('No data received from server');
//                 }

//             } catch (error: any) {
//                 console.error('❌ Error:', error);
//                 setError(error.response?.data?.message || error.message || 'Failed to fetch data');
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchData();
//     }, [activeTab, fetchTrigger]);

//     const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
//     };

//     const handleApplyFilter = () => {
//         setUseCustomDates(true);
//         setFetchTrigger(prev => prev + 1);
//     };

//     const handleResetDates = () => {
//         setDateRange({ startDate: '', endDate: '' });
//         setUseCustomDates(false);
//         setFetchTrigger(prev => prev + 1);
//     };

//     const handleExportPDF = () => {
//         window.print();
//     };

//     const tabs = [
//         {
//             id: 'overview',
//             label: 'Executive Overview',
//             icon: TrendingUp,
//             gradient: 'from-blue-500 to-indigo-600',
//             iconBg: 'from-blue-100 to-indigo-100',
//             iconColor: 'text-blue-600'
//         },
//         {
//             id: 'branch',
//             label: 'Branch Performance',
//             icon: Building2,
//             gradient: 'from-purple-500 to-pink-600',
//             iconBg: 'from-purple-100 to-pink-100',
//             iconColor: 'text-purple-600'
//         },
//         {
//             id: 'doctor',
//             label: 'Doctor Analytics',
//             icon: Stethoscope,
//             gradient: 'from-emerald-500 to-teal-600',
//             iconBg: 'from-emerald-100 to-teal-100',
//             iconColor: 'text-emerald-600'
//         },
//         {
//             id: 'nurse',
//             label: 'Nurse Performance',
//             icon: UserCheck,
//             gradient: 'from-cyan-500 to-blue-600',
//             iconBg: 'from-cyan-100 to-blue-100',
//             iconColor: 'text-cyan-600'
//         },
//         {
//             id: 'receptionist',
//             label: 'Reception Stats',
//             icon: UserCog,
//             gradient: 'from-orange-500 to-red-600',
//             iconBg: 'from-orange-100 to-red-100',
//             iconColor: 'text-orange-600'
//         }
//     ];

//     const activeTabInfo = tabs.find(t => t.id === activeTab);

//     return (
//         <div className="space-y-6 pb-20 print:p-0">
//             {/* Premium Header */}
//             <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-3xl shadow-2xl p-8 print:hidden">
//                 {/* Background Pattern */}
//                 <div className="absolute inset-0 opacity-10">
//                     <div className="absolute inset-0" style={{
//                         backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
//                         backgroundSize: '40px 40px'
//                     }}></div>
//                 </div>

//                 <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
//                     {/* Title Section */}
//                     <div className="space-y-3">
//                         <div className="flex items-center gap-4">
//                             <div className="p-4 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl shadow-lg transform rotate-3">
//                                 <BarChart3 className="w-8 h-8 text-white" />
//                             </div>
//                             <div>
//                                 <h1 className="text-4xl font-bold text-white tracking-tight">
//                                     Advanced Analytics
//                                 </h1>
//                                 <p className="text-blue-200 text-sm font-medium mt-1 flex items-center gap-2">
//                                     <Sparkles className="w-4 h-4" />
//                                     Real-time insights and comprehensive reporting
//                                 </p>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Date Controls */}
//                     <div className="flex flex-wrap items-center gap-3 bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 shadow-xl">
//                         <div className="flex items-center gap-2 text-white/80">
//                             <Calendar className="w-5 h-5" />
//                             <span className="text-xs font-bold uppercase tracking-wider">Custom Period</span>
//                         </div>
//                         <input
//                             type="date"
//                             name="startDate"
//                             value={dateRange.startDate}
//                             onChange={handleDateChange}
//                             placeholder="Start Date"
//                             className="bg-white/90 backdrop-blur text-gray-900 border-0 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-inner"
//                         />
//                         <span className="text-white/60 font-bold">→</span>
//                         <input
//                             type="date"
//                             name="endDate"
//                             value={dateRange.endDate}
//                             onChange={handleDateChange}
//                             placeholder="End Date"
//                             className="bg-white/90 backdrop-blur text-gray-900 border-0 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-inner"
//                         />
//                         <button
//                             onClick={handleApplyFilter}
//                             disabled={loading || !dateRange.startDate || !dateRange.endDate}
//                             className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-bold text-sm disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
//                         >
//                             <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
//                             Apply
//                         </button>
//                         {useCustomDates && (
//                             <button
//                                 onClick={handleResetDates}
//                                 disabled={loading}
//                                 className="px-4 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all font-bold text-sm disabled:opacity-50 border border-white/30 shadow-lg"
//                                 title="Reset to default"
//                             >
//                                 Reset
//                             </button>
//                         )}
//                         <button
//                             onClick={handleExportPDF}
//                             disabled={loading || !data}
//                             className="px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all font-bold text-sm disabled:opacity-50 border border-white/30 shadow-lg flex items-center gap-2"
//                         >
//                             <Download className="w-4 h-4" />
//                             Export
//                         </button>
//                     </div>
//                 </div>

//                 {/* Date Range Indicator */}
//                 {useCustomDates && dateRange.startDate && dateRange.endDate && (
//                     <div className="relative z-10 mt-4 flex items-center gap-2 text-blue-200 text-sm">
//                         <span className="font-semibold">Showing data from:</span>
//                         <span className="px-3 py-1 bg-white/10 rounded-lg font-bold">
//                             {dateRange.startDate} to {dateRange.endDate}
//                         </span>
//                     </div>
//                 )}
//                 {!useCustomDates && (
//                     <div className="relative z-10 mt-4 flex items-center gap-2 text-blue-200 text-sm">
//                         <span className="px-3 py-1 bg-white/10 rounded-lg font-semibold">
//                             Showing all available data
//                         </span>
//                     </div>
//                 )}
//             </div>

//             {/* Modern Tab Navigation */}
//             <div className="relative">
//                 <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-2 print:hidden overflow-x-auto">
//                     <div className="flex gap-2 min-w-max">
//                         {tabs.map((tab) => {
//                             const Icon = tab.icon;
//                             const isActive = activeTab === tab.id;
//                             return (
//                                 <button
//                                     key={tab.id}
//                                     onClick={() => setActiveTab(tab.id)}
//                                     className={`
//                                         group relative flex items-center gap-3 px-6 py-4 rounded-xl font-semibold text-sm transition-all duration-300 whitespace-nowrap
//                                         ${isActive
//                                             ? `bg-gradient-to-r ${tab.gradient} text-white shadow-xl transform scale-105`
//                                             : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
//                                         }
//                                     `}
//                                 >
//                                     <div className={`
//                                         p-2 rounded-lg transition-all
//                                         ${isActive
//                                             ? 'bg-white/20'
//                                             : `bg-gradient-to-br ${tab.iconBg}`
//                                         }
//                                     `}>
//                                         <Icon className={`w-5 h-5 ${isActive ? 'text-white' : tab.iconColor}`} />
//                                     </div>
//                                     <span>{tab.label}</span>
//                                     {isActive && (
//                                         <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-current rounded-full"></div>
//                                     )}
//                                 </button>
//                             );
//                         })}
//                     </div>
//                 </div>
//             </div>

//             {/* Content Area */}
//             <div className="min-h-[500px] print:min-h-0">
//                 {/* Error Display */}
//                 {error && (
//                     <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 rounded-2xl p-6 text-red-900 mb-6 print:hidden shadow-lg">
//                         <div className="flex items-start gap-4">
//                             <div className="p-3 bg-red-100 rounded-xl flex-shrink-0">
//                                 <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
//                                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//                                 </svg>
//                             </div>
//                             <div className="flex-1">
//                                 <h3 className="font-bold text-xl mb-2">Unable to Load Data</h3>
//                                 <p className="text-sm text-red-700">{error}</p>
//                                 <button
//                                     onClick={() => setFetchTrigger(prev => prev + 1)}
//                                     className="mt-4 px-5 py-2.5 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all text-sm font-bold inline-flex items-center gap-2 shadow-lg"
//                                 >
//                                     <RefreshCw className="w-4 h-4" />
//                                     Retry
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 )}

//                 {/* Loading State */}
//                 {loading && (
//                     <div className="flex flex-col items-center justify-center h-96 gap-6 print:hidden bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
//                         <div className="relative">
//                             <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200"></div>
//                             <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-blue-600 absolute top-0 left-0"></div>
//                             <div className="absolute inset-0 flex items-center justify-center">
//                                 <BarChart3 className="w-8 h-8 text-blue-600 animate-pulse" />
//                             </div>
//                         </div>
//                         <div className="text-center">
//                             <p className="text-gray-800 font-bold text-lg">Loading {activeTabInfo?.label}...</p>
//                             <p className="text-gray-500 text-sm mt-2">
//                                 {useCustomDates && dateRange.startDate && dateRange.endDate
//                                     ? `Analyzing data from ${dateRange.startDate} to ${dateRange.endDate}`
//                                     : 'Fetching all available data'
//                                 }
//                             </p>
//                         </div>
//                     </div>
//                 )}

//                 {/* Content - Same as before but with empty data checks */}
//                 {!loading && !error && (
//                     <>
//                         {/* OVERVIEW TAB */}
//                         {activeTab === 'overview' && data && (
//                             <div className="space-y-6">
//                                 {/* Print Header */}
//                                 <div className="print:block hidden mb-8 text-center border-b-2 border-gray-300 pb-4">
//                                     <h1 className="text-3xl font-bold text-gray-900">Executive Summary Report</h1>
//                                     {useCustomDates && dateRange.startDate && dateRange.endDate && (
//                                         <p className="text-gray-600 mt-2">{dateRange.startDate} to {dateRange.endDate}</p>
//                                     )}
//                                 </div>

//                                 {/* KPI Cards */}
//                                 <section className="break-inside-avoid">
//                                     <KPIGrid data={data} />
//                                 </section>

//                                 {/* Revenue Intelligence */}
//                                 <section className="break-inside-avoid bg-white rounded-2xl border border-gray-200 p-8 shadow-lg hover:shadow-xl transition-all">
//                                     <div className="flex items-center gap-3 mb-6">
//                                         <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg">
//                                             <BarChart3 className="w-6 h-6" />
//                                         </div>
//                                         <div>
//                                             <h2 className="text-2xl font-bold text-gray-900">Revenue Intelligence</h2>
//                                             <p className="text-sm text-gray-500 mt-1">Financial performance and trends</p>
//                                         </div>
//                                     </div>
//                                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//                                         <div className="lg:col-span-2 h-80">
//                                             {data.revenue_trend && data.revenue_trend.length > 0 ? (
//                                                 <RevenueTrendChart data={data.revenue_trend} />
//                                             ) : (
//                                                 <div className="flex items-center justify-center h-full bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
//                                                     <p className="text-gray-400 text-sm">No revenue trend data available</p>
//                                                 </div>
//                                             )}
//                                         </div>
//                                         <div className="h-80 border-l border-gray-200 pl-8">
//                                             {data.kpi?.revenue_month || data.revenue_breakdown ? (
//                                                 <RevenueBreakdownPie
//                                                     revenue={data.kpi?.revenue_month || 0}
//                                                     breakdown={data.revenue_breakdown || []}
//                                                 />
//                                             ) : (
//                                                 <div className="flex items-center justify-center h-full bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
//                                                     <p className="text-gray-400 text-sm text-center">No breakdown data available</p>
//                                                 </div>
//                                             )}
//                                         </div>
//                                     </div>
//                                 </section>

//                                 {/* Clinical Intelligence */}
//                                 <section className="break-inside-avoid bg-white rounded-2xl border border-gray-200 p-8 shadow-lg hover:shadow-xl transition-all">
//                                     <div className="flex items-center gap-3 mb-6">
//                                         <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white shadow-lg">
//                                             <Stethoscope className="w-6 h-6" />
//                                         </div>
//                                         <div>
//                                             <h2 className="text-2xl font-bold text-gray-900">Clinical Intelligence</h2>
//                                             <p className="text-sm text-gray-500 mt-1">Disease patterns and diagnosis trends</p>
//                                         </div>
//                                     </div>
//                                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//                                         <div className="h-80">
//                                             {data.diagnoses && data.diagnoses.length > 0 ? (
//                                                 <TopDiagnosesChart data={data.diagnoses} />
//                                             ) : (
//                                                 <div className="flex items-center justify-center h-full bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
//                                                     <p className="text-gray-400 text-sm">No diagnosis data available</p>
//                                                 </div>
//                                             )}
//                                         </div>
//                                         <div className="h-80 border-l border-gray-200 pl-8">
//                                             {data.disease_trend && data.disease_trend.length > 0 ? (
//                                                 <DiseaseTrendChart data={data.disease_trend} />
//                                             ) : (
//                                                 <div className="flex items-center justify-center h-full bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
//                                                     <p className="text-gray-400 text-sm text-center">No disease trend data available</p>
//                                                 </div>
//                                             )}
//                                         </div>
//                                     </div>
//                                 </section>

//                                 {/* Operational Efficiency */}
//                                 <section className="break-inside-avoid bg-white rounded-2xl border border-gray-200 p-8 shadow-lg hover:shadow-xl transition-all">
//                                     <div className="flex items-center gap-3 mb-6">
//                                         <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl text-white shadow-lg">
//                                             <UserCog className="w-6 h-6" />
//                                         </div>
//                                         <div>
//                                             <h2 className="text-2xl font-bold text-gray-900">Operational Efficiency</h2>
//                                             <p className="text-sm text-gray-500 mt-1">Performance metrics and utilization</p>
//                                         </div>
//                                     </div>
//                                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//                                         <div className="h-80">
//                                             {data.peak_hours && data.peak_hours.length > 0 ? (
//                                                 <PeakHoursChart data={data.peak_hours} />
//                                             ) : (
//                                                 <div className="flex items-center justify-center h-full bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
//                                                     <p className="text-gray-400 text-sm">No peak hours data available</p>
//                                                 </div>
//                                             )}
//                                         </div>
//                                         <div>
//                                             <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Key Metrics</h3>
//                                             {data.efficiency ? (
//                                                 <EfficiencyMetrics metrics={data.efficiency} />
//                                             ) : (
//                                                 <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
//                                                     <p className="text-gray-400 text-sm">No efficiency data available</p>
//                                                 </div>
//                                             )}
//                                         </div>
//                                     </div>
//                                 </section>

//                                 {/* Patient Intelligence */}
//                                 <section className="break-inside-avoid grid grid-cols-1 lg:grid-cols-2 gap-6">
//                                     {/* Patient Retention */}
//                                     <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg hover:shadow-xl transition-all">
//                                         <div className="flex items-center gap-3 mb-6">
//                                             <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl text-white shadow-lg">
//                                                 <UserCheck className="w-6 h-6" />
//                                             </div>
//                                             <div>
//                                                 <h2 className="text-2xl font-bold text-gray-900">Patient Retention</h2>
//                                                 <p className="text-sm text-gray-500 mt-1">Visit frequency analysis</p>
//                                             </div>
//                                         </div>
//                                         <div className="h-64">
//                                             {data.retention && data.retention.length > 0 ? (
//                                                 <PatientRetentionChart data={data.retention} />
//                                             ) : (
//                                                 <div className="flex items-center justify-center h-full bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
//                                                     <p className="text-gray-400 text-sm">No retention data available</p>
//                                                 </div>
//                                             )}
//                                         </div>
//                                     </div>

//                                     {/* High Value Patients */}
//                                     <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg hover:shadow-xl transition-all">
//                                         {data.high_value_patients ? (
//                                             <HighValuePatientsTable data={data.high_value_patients} />
//                                         ) : (
//                                             <div className="flex items-center justify-center h-full bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
//                                                 <p className="text-gray-400 text-sm">No high value patient data available</p>
//                                             </div>
//                                         )}
//                                     </div>
//                                 </section>
//                             </div>
//                         )}

//                         {/* BRANCH TAB */}
//                         {activeTab === 'branch' && data && <BranchPerformance data={data} />}

//                         {/* STAFF TABS */}
//                         {['doctor', 'nurse', 'receptionist'].includes(activeTab) && data && (
//                             <StaffPerformance data={data} type={activeTab.toUpperCase() as any} />
//                         )}

//                         {/* No Data State */}
//                         {!data && !loading && !error && (
//                             <div className="flex flex-col items-center justify-center h-96 gap-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300">
//                                 <div className="p-6 bg-white rounded-2xl shadow-lg">
//                                     <BarChart3 className="w-16 h-16 text-gray-400" />
//                                 </div>
//                                 <div className="text-center">
//                                     <p className="text-gray-700 font-bold text-xl mb-2">No Data Available</p>
//                                     <p className="text-gray-500 text-sm max-w-md">
//                                         No data found for the selected period. Try adjusting the date range or check back later.
//                                     </p>
//                                 </div>
//                                 <button
//                                     onClick={() => setFetchTrigger(prev => prev + 1)}
//                                     className="mt-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-bold inline-flex items-center gap-2 shadow-lg"
//                                 >
//                                     <RefreshCw className="w-5 h-5" />
//                                     Refresh Data
//                                 </button>
//                             </div>
//                         )}
//                     </>
//                 )}
//             </div>

//             {/* Print Styles */}
//             <style jsx global>{`
//                 @media print {
//                     @page { 
//                         margin: 15mm;
//                         size: A4;
//                     }
//                     body { 
//                         -webkit-print-color-adjust: exact;
//                         print-color-adjust: exact;
//                     }
//                     .print\\:hidden {
//                         display: none !important;
//                     }
//                     .break-inside-avoid {
//                         break-inside: avoid;
//                         page-break-inside: avoid;
//                     }
//                 }
//             `}</style>
//         </div>
//     );
// }


'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Download, TrendingUp, Building2, Stethoscope, UserCog, UserCheck, BarChart3, RefreshCw, Sparkles, Filter, X } from 'lucide-react';

// Dashboard Components for Overview
import { KPIGrid } from '@/components/dashboard/KPIGrid';
import { RevenueTrendChart, RevenueBreakdownPie } from '@/components/dashboard/RevenueCharts';
import { TopDiagnosesChart, DiseaseTrendChart } from '@/components/dashboard/ClinicalCharts';
import { PeakHoursChart, EfficiencyMetrics } from '@/components/dashboard/OperationalCharts';
import { PatientRetentionChart, HighValuePatientsTable } from '@/components/dashboard/PatientCharts';

// Report Components
import BranchPerformance from '@/components/reports/BranchPerformance';
import StaffPerformance from '@/components/reports/StaffPerformance';

export default function ClientAdminReports() {
    const [activeTab, setActiveTab] = useState('overview');

    // Start with no date range - let API use defaults
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    // Track if user has set custom dates
    const [useCustomDates, setUseCustomDates] = useState(false);

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [fetchTrigger, setFetchTrigger] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            console.log('🔄 Fetching data...');
            setLoading(true);
            setData(null);
            setError(null);

            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                // Only include date params if user has set them
                const params: any = {};
                if (useCustomDates && dateRange.startDate && dateRange.endDate) {
                    params.startDate = dateRange.startDate;
                    params.endDate = dateRange.endDate;
                }

                let res;

                if (activeTab === 'branch') {
                    res = await axios.get(
                        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/clientadmins/reports/branch`,
                        { headers, params }
                    );
                } else if (['doctor', 'nurse', 'receptionist'].includes(activeTab)) {
                    res = await axios.get(
                        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/clientadmins/reports/staff`,
                        {
                            headers,
                            params: { ...params, type: activeTab.toUpperCase() }
                        }
                    );
                } else {
                    // Overview - Use Executive Stats (same endpoint as dashboard)
                    res = await axios.get(
                        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/clientadmins/executive-stats`,
                        { headers, params }
                    );
                }

                console.log('📥 Received response:', res.data);

                // Handle response structure
                if (res.data && res.data.data) {
                    setData(res.data.data);
                } else if (res.data) {
                    setData(res.data);
                } else {
                    throw new Error('No data received from server');
                }

            } catch (error: any) {
                console.error('❌ Error:', error);
                setError(error.response?.data?.message || error.message || 'Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeTab, fetchTrigger]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleApplyFilter = () => {
        setUseCustomDates(true);
        setFetchTrigger(prev => prev + 1);
    };

    const handleResetDates = () => {
        setDateRange({ startDate: '', endDate: '' });
        setUseCustomDates(false);
        setFetchTrigger(prev => prev + 1);
    };

    const handleExportPDF = () => {
        window.print();
    };

    const tabs = [
        {
            id: 'overview',
            label: 'Executive Overview',
            icon: TrendingUp,
            gradient: 'from-blue-500 to-indigo-600',
            iconBg: 'bg-blue-500',
            textColor: 'text-blue-600',
            bgLight: 'bg-blue-50'
        },
        {
            id: 'branch',
            label: 'Branch Performance',
            icon: Building2,
            gradient: 'from-purple-500 to-pink-600',
            iconBg: 'bg-purple-500',
            textColor: 'text-purple-600',
            bgLight: 'bg-purple-50'
        },
        {
            id: 'doctor',
            label: 'Doctor Analytics',
            icon: Stethoscope,
            gradient: 'from-emerald-500 to-teal-600',
            iconBg: 'bg-emerald-500',
            textColor: 'text-emerald-600',
            bgLight: 'bg-emerald-50'
        },
        {
            id: 'nurse',
            label: 'Nurse Performance',
            icon: UserCheck,
            gradient: 'from-cyan-500 to-blue-600',
            iconBg: 'bg-cyan-500',
            textColor: 'text-cyan-600',
            bgLight: 'bg-cyan-50'
        },
        {
            id: 'receptionist',
            label: 'Reception Stats',
            icon: UserCog,
            gradient: 'from-orange-500 to-red-600',
            iconBg: 'bg-orange-500',
            textColor: 'text-orange-600',
            bgLight: 'bg-orange-50'
        }
    ];

    const activeTabInfo = tabs.find(t => t.id === activeTab);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 pb-20 print:bg-white print:p-0">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0">

                {/* Premium Header Section */}
                <div className="mb-8 print:hidden">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
                        {/* Gradient Background Banner */}
                        <div className={`relative bg-gradient-to-r ${activeTabInfo?.gradient} p-8`}>
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute inset-0" style={{
                                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                                    backgroundSize: '32px 32px'
                                }}></div>
                            </div>

                            <div className="relative z-10">
                                {/* Title Row */}
                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl">
                                            <BarChart3 className="w-10 h-10 text-white" />
                                        </div>
                                        <div>
                                            <h1 className="text-4xl font-bold text-white tracking-tight">
                                                Analytics Dashboard
                                            </h1>
                                            <p className="text-white/90 text-sm font-medium mt-1 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4" />
                                                Comprehensive insights and performance metrics
                                            </p>
                                        </div>
                                    </div>

                                    {/* Export Button */}
                                    <button
                                        onClick={handleExportPDF}
                                        disabled={loading || !data}
                                        className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all font-bold text-sm disabled:opacity-50 border border-white/30 shadow-lg flex items-center gap-2 hover:scale-105 transform duration-200"
                                    >
                                        <Download className="w-5 h-5" />
                                        Export PDF
                                    </button>
                                </div>

                                {/* Date Filter Section */}
                                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex items-center gap-2 text-white">
                                            <Filter className="w-5 h-5" />
                                            <span className="text-sm font-bold uppercase tracking-wider">Date Filter</span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 flex-1">
                                            <input
                                                type="date"
                                                name="startDate"
                                                value={dateRange.startDate}
                                                onChange={handleDateChange}
                                                className="bg-white text-gray-900 border-0 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-white/50 focus:outline-none shadow-lg min-w-[150px]"
                                            />
                                            <span className="text-white/80 font-bold">→</span>
                                            <input
                                                type="date"
                                                name="endDate"
                                                value={dateRange.endDate}
                                                onChange={handleDateChange}
                                                className="bg-white text-gray-900 border-0 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-white/50 focus:outline-none shadow-lg min-w-[150px]"
                                            />

                                            <button
                                                onClick={handleApplyFilter}
                                                disabled={loading || !dateRange.startDate || !dateRange.endDate}
                                                className="px-6 py-2.5 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-all font-bold text-sm disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
                                            >
                                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                                Apply
                                            </button>

                                            {useCustomDates && (
                                                <button
                                                    onClick={handleResetDates}
                                                    disabled={loading}
                                                    className="px-4 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all font-bold text-sm disabled:opacity-50 border border-white/30 shadow-lg flex items-center gap-2"
                                                    title="Reset to default"
                                                >
                                                    <X className="w-4 h-4" />
                                                    Reset
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Active Filter Indicator */}
                                    <div className="mt-4 flex items-center gap-2 text-white/90 text-sm">
                                        {useCustomDates && dateRange.startDate && dateRange.endDate ? (
                                            <>
                                                <Calendar className="w-4 h-4" />
                                                <span className="font-semibold">Period:</span>
                                                <span className="px-3 py-1 bg-white/20 rounded-lg font-bold">
                                                    {new Date(dateRange.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    {' → '}
                                                    {new Date(dateRange.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <Calendar className="w-4 h-4" />
                                                <span className="px-3 py-1 bg-white/20 rounded-lg font-semibold">
                                                    All Available Data
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div className="bg-gray-50 border-t border-gray-200 p-4">
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`
                                                group relative flex items-center gap-3 px-6 py-4 rounded-xl font-semibold text-sm transition-all duration-300 whitespace-nowrap min-w-fit
                                                ${isActive
                                                    ? `bg-gradient-to-r ${tab.gradient} text-white shadow-xl scale-105`
                                                    : `bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 shadow-sm hover:shadow-md border border-gray-200`
                                                }
                                            `}
                                        >
                                            <div className={`
                                                p-2 rounded-lg transition-all
                                                ${isActive
                                                    ? 'bg-white/20'
                                                    : `${tab.bgLight} ${tab.textColor}`
                                                }
                                            `}>
                                                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                                            </div>
                                            <span>{tab.label}</span>
                                            {isActive && (
                                                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                                                    <div className="w-3 h-3 bg-white rounded-full shadow-lg"></div>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="min-h-[500px] print:min-h-0">
                    {/* Error Display */}
                    {error && (
                        <div className="bg-white rounded-2xl border-l-4 border-red-500 p-8 shadow-xl mb-6 print:hidden">
                            <div className="flex items-start gap-4">
                                <div className="p-4 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex-shrink-0 shadow-lg">
                                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-2xl mb-2 text-gray-900">Unable to Load Data</h3>
                                    <p className="text-sm text-gray-600 mb-4">{error}</p>
                                    <button
                                        onClick={() => setFetchTrigger(prev => prev + 1)}
                                        className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all text-sm font-bold inline-flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                    >
                                        <RefreshCw className="w-5 h-5" />
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center h-[600px] gap-8 print:hidden bg-white rounded-3xl shadow-xl border border-gray-200">
                            <div className="relative">
                                {/* Animated rings */}
                                <div className="absolute inset-0 animate-ping">
                                    <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${activeTabInfo?.gradient} opacity-20`}></div>
                                </div>
                                <div className={`relative w-24 h-24 rounded-full bg-gradient-to-r ${activeTabInfo?.gradient} flex items-center justify-center shadow-2xl`}>
                                    <div className="animate-spin">
                                        <RefreshCw className="w-12 h-12 text-white" />
                                    </div>
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-gray-900 font-bold text-2xl mb-2">Loading {activeTabInfo?.label}...</p>
                                <p className="text-gray-500 text-sm max-w-md">
                                    {useCustomDates && dateRange.startDate && dateRange.endDate
                                        ? `Analyzing data from ${new Date(dateRange.startDate).toLocaleDateString()} to ${new Date(dateRange.endDate).toLocaleDateString()}`
                                        : 'Fetching comprehensive analytics...'
                                    }
                                </p>
                                <div className="mt-6 flex gap-2 justify-center">
                                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${activeTabInfo?.gradient} animate-bounce`} style={{ animationDelay: '0ms' }}></div>
                                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${activeTabInfo?.gradient} animate-bounce`} style={{ animationDelay: '150ms' }}></div>
                                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${activeTabInfo?.gradient} animate-bounce`} style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    {!loading && !error && (
                        <>
                            {/* OVERVIEW TAB */}
                            {activeTab === 'overview' && data && (
                                <div className="space-y-6">
                                    {/* Print Header */}
                                    <div className="print:block hidden mb-8 text-center border-b-2 border-gray-300 pb-6">
                                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Executive Summary Report</h1>
                                        {useCustomDates && dateRange.startDate && dateRange.endDate && (
                                            <p className="text-gray-600 text-lg">
                                                {new Date(dateRange.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                {' - '}
                                                {new Date(dateRange.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        )}
                                    </div>

                                    {/* KPI Cards */}
                                    <section className="break-inside-avoid">
                                        <KPIGrid data={data} />
                                    </section>

                                    {/* Revenue Intelligence */}
                                    <section className="break-inside-avoid bg-white rounded-3xl border border-gray-200 p-8 shadow-xl hover:shadow-2xl transition-all">
                                        <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-200">
                                            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg">
                                                <BarChart3 className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h2 className="text-3xl font-bold text-gray-900">Revenue Intelligence</h2>
                                                <p className="text-sm text-gray-500 mt-1">Financial performance and trends analysis</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                            <div className="lg:col-span-2 h-80">
                                                {data.revenue_trend && data.revenue_trend.length > 0 ? (
                                                    <RevenueTrendChart data={data.revenue_trend} />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300">
                                                        <div className="text-center">
                                                            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                                            <p className="text-gray-400 font-medium">No revenue trend data available</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="h-80">
                                                {data.kpi?.revenue_month || data.revenue_breakdown ? (
                                                    <RevenueBreakdownPie
                                                        revenue={data.kpi?.revenue_month || 0}
                                                        breakdown={data.revenue_breakdown || []}
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300">
                                                        <div className="text-center">
                                                            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                                            <p className="text-gray-400 font-medium">No breakdown available</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </section>

                                    {/* Clinical Intelligence */}
                                    <section className="break-inside-avoid bg-white rounded-3xl border border-gray-200 p-8 shadow-xl hover:shadow-2xl transition-all">
                                        <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-200">
                                            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white shadow-lg">
                                                <Stethoscope className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h2 className="text-3xl font-bold text-gray-900">Clinical Intelligence</h2>
                                                <p className="text-sm text-gray-500 mt-1">Disease patterns and diagnosis trends</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            <div className="h-80">
                                                {data.diagnoses && data.diagnoses.length > 0 ? (
                                                    <TopDiagnosesChart data={data.diagnoses} />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-emerald-50 rounded-2xl border-2 border-dashed border-gray-300">
                                                        <div className="text-center">
                                                            <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                                            <p className="text-gray-400 font-medium">No diagnosis data available</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="h-80">
                                                {data.disease_trend && data.disease_trend.length > 0 ? (
                                                    <DiseaseTrendChart data={data.disease_trend} />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-emerald-50 rounded-2xl border-2 border-dashed border-gray-300">
                                                        <div className="text-center">
                                                            <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                                            <p className="text-gray-400 font-medium">No disease trend data</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </section>

                                    {/* Operational Efficiency */}
                                    <section className="break-inside-avoid bg-white rounded-3xl border border-gray-200 p-8 shadow-xl hover:shadow-2xl transition-all">
                                        <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-200">
                                            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl text-white shadow-lg">
                                                <UserCog className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h2 className="text-3xl font-bold text-gray-900">Operational Efficiency</h2>
                                                <p className="text-sm text-gray-500 mt-1">Performance metrics and resource utilization</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            <div className="h-80">
                                                {data.peak_hours && data.peak_hours.length > 0 ? (
                                                    <PeakHoursChart data={data.peak_hours} />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-purple-50 rounded-2xl border-2 border-dashed border-gray-300">
                                                        <div className="text-center">
                                                            <UserCog className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                                            <p className="text-gray-400 font-medium">No peak hours data</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-700 mb-6 uppercase tracking-wider">Key Performance Metrics</h3>
                                                {data.efficiency ? (
                                                    <EfficiencyMetrics metrics={data.efficiency} />
                                                ) : (
                                                    <div className="flex items-center justify-center h-64 bg-gradient-to-br from-gray-50 to-purple-50 rounded-2xl border-2 border-dashed border-gray-300">
                                                        <div className="text-center">
                                                            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                                            <p className="text-gray-400 font-medium">No efficiency data</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </section>

                                    {/* Patient Intelligence */}
                                    <section className="break-inside-avoid grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Patient Retention */}
                                        <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-xl hover:shadow-2xl transition-all">
                                            <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-200">
                                                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl text-white shadow-lg">
                                                    <UserCheck className="w-7 h-7" />
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-bold text-gray-900">Patient Retention</h2>
                                                    <p className="text-sm text-gray-500 mt-1">Visit frequency analysis</p>
                                                </div>
                                            </div>
                                            <div className="h-64">
                                                {data.retention && data.retention.length > 0 ? (
                                                    <PatientRetentionChart data={data.retention} />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-orange-50 rounded-2xl border-2 border-dashed border-gray-300">
                                                        <div className="text-center">
                                                            <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                                            <p className="text-gray-400 font-medium">No retention data</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* High Value Patients */}
                                        <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-xl hover:shadow-2xl transition-all">
                                            {data.high_value_patients ? (
                                                <HighValuePatientsTable data={data.high_value_patients} />
                                            ) : (
                                                <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-orange-50 rounded-2xl border-2 border-dashed border-gray-300 min-h-[400px]">
                                                    <div className="text-center">
                                                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                                        <p className="text-gray-400 font-medium">No high value patient data</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </div>
                            )}

                            {/* BRANCH TAB */}
                            {activeTab === 'branch' && data && <BranchPerformance data={data} />}

                            {/* STAFF TABS */}
                            {['doctor', 'nurse', 'receptionist'].includes(activeTab) && data && (
                                <StaffPerformance data={data} type={activeTab.toUpperCase() as any} />
                            )}

                            {/* No Data State */}
                            {!data && !loading && !error && (
                                <div className="flex flex-col items-center justify-center h-[600px] gap-8 bg-white rounded-3xl shadow-xl border-2 border-dashed border-gray-300">
                                    <div className="relative">
                                        <div className={`p-8 bg-gradient-to-br ${activeTabInfo?.gradient} rounded-3xl shadow-2xl`}>
                                            <BarChart3 className="w-20 h-20 text-white" />
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                                            <span className="text-2xl">📊</span>
                                        </div>
                                    </div>
                                    <div className="text-center max-w-md">
                                        <p className="text-gray-900 font-bold text-3xl mb-3">No Data Available</p>
                                        <p className="text-gray-500 text-base leading-relaxed mb-6">
                                            No data found for the selected period. Try adjusting your date range or check back later when more data is available.
                                        </p>
                                        <button
                                            onClick={() => setFetchTrigger(prev => prev + 1)}
                                            className={`px-8 py-4 bg-gradient-to-r ${activeTabInfo?.gradient} text-white rounded-xl hover:shadow-xl transition-all font-bold inline-flex items-center gap-3 shadow-lg transform hover:-translate-y-1`}
                                        >
                                            <RefreshCw className="w-6 h-6" />
                                            Refresh Data
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    @page { 
                        margin: 15mm;
                        size: A4;
                    }
                    body { 
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:block {
                        display: block !important;
                    }
                    .break-inside-avoid {
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }
                }
                
                /* Custom scrollbar */
                .scrollbar-thin::-webkit-scrollbar {
                    height: 6px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: #cbd5e0;
                    border-radius: 10px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background: #a0aec0;
                }
            `}</style>
        </div>
    );
}