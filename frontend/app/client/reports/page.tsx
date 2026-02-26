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

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toPng } from 'html-to-image';
import type ExcelJS from 'exceljs';
import { Calendar, Download, TrendingUp, Building2, Stethoscope, UserCog, UserCheck, BarChart3, RefreshCw, Sparkles, Filter, X, Activity, Users, FileSpreadsheet } from 'lucide-react';

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

    // Helper to get local date string YYYY-MM-DD
    const getLocalDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const todayDate = new Date();
    const todayStr = getLocalDateString(todayDate);

    // Default to Today
    const [dateRange, setDateRange] = useState({
        startDate: todayStr,
        endDate: todayStr
    });

    const today = todayStr;

    // Track if user has set custom dates
    // For "Today" view, we treat it as custom dates being active so data loads immediately
    const [useCustomDates, setUseCustomDates] = useState(true);

    const [loading, setLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
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
                console.log('📅 Date Filter State:', {
                    useCustomDates,
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate
                });

                if (useCustomDates && dateRange.startDate && dateRange.endDate) {
                    params.startDate = dateRange.startDate;
                    params.endDate = dateRange.endDate;
                    console.log('✅ Adding date params to request:', params);
                } else {
                    console.log('⏭️ No custom dates - using backend defaults');
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
    }, [activeTab, fetchTrigger, useCustomDates]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDateRange(prev => {
            const newRange = { ...prev, [name]: value };
            // If start date is moved ahead of end date, clear end date
            if (name === 'startDate' && newRange.endDate && value > newRange.endDate) {
                newRange.endDate = '';
            }
            return newRange;
        });
    };

    const setQuickFilter = (type: 'today' | 'yesterday' | 'week' | 'month') => {
        const d = new Date();
        let start = new Date(d);
        let end = new Date(d);

        switch (type) {
            case 'today':
                // already set
                break;
            case 'yesterday':
                start.setDate(d.getDate() - 1);
                end.setDate(d.getDate() - 1);
                break;
            case 'week':
                start.setDate(d.getDate() - 7);
                break;
            case 'month':
                start.setDate(d.getDate() - 30);
                break;
        }

        setDateRange({
            startDate: getLocalDateString(start),
            endDate: getLocalDateString(end)
        });
        setUseCustomDates(true);
        // setFetchTrigger(prev => prev + 1); // useEffect will catch useCustomDates or activeTab, but maybe need trigger if values change?
        // Actually, useEffect currently depends on `useCustomDates` and `fetchTrigger`.
        // If I change `dateRange`, useEffect won't fire unless I add dateRange to deps or increment trigger.
        // But dateRange changes on every keystroke, so we don't want to auto-fetch on dateRange change usually.
        // For quick filters, we DO want to auto-fetch.
        setFetchTrigger(prev => prev + 1);
    };

    const handleApplyFilter = () => {
        console.log('🔘 Apply Filter clicked!', {
            currentDateRange: dateRange,
            currentUseCustomDates: useCustomDates
        });
        setUseCustomDates(true);
        setFetchTrigger(prev => prev + 1);
        console.log('📤 State updates dispatched: useCustomDates=true, fetchTrigger incremented');
    };

    const handleResetDates = () => {
        // Reset to Today
        const now = new Date();
        const todayS = getLocalDateString(now);
        setDateRange({ startDate: todayS, endDate: todayS });
        setUseCustomDates(true);
        setFetchTrigger(prev => prev + 1);
    };

    const reportRef = useRef<HTMLDivElement>(null);
    const chartsRef = useRef<HTMLDivElement>(null);

    // ... (existing code)

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            const token = localStorage.getItem('token');
            const params: any = {};
            if (useCustomDates && dateRange.startDate && dateRange.endDate) {
                params.startDate = dateRange.startDate;
                params.endDate = dateRange.endDate;
            }

            const [response, autoTableMod, jsPDFMod] = await Promise.all([
                axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/clientadmins/reports/export-detail`,
                    { headers: { Authorization: `Bearer ${token}` }, params }
                ),
                import('jspdf-autotable'),
                import('jspdf')
            ]);

            const exportData = response.data.data;
            const autoTable = autoTableMod.default;
            const { jsPDF } = jsPDFMod;
            const pdf = new jsPDF('l', 'mm', 'a4');
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const now = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

            const dateLabel = exportData.dateRange
                ? `${exportData.dateRange.start}  →  ${exportData.dateRange.end}`
                : 'All Available Data';

            // ── Helpers ───────────────────────────────────────────────────────
            const drawPageHeader = (section: string) => {
                pdf.setFillColor(15, 52, 150);
                pdf.rect(0, 0, pageW, 16, 'F');
                // thin accent line
                pdf.setFillColor(99, 179, 237);
                pdf.rect(0, 16, pageW, 1.2, 'F');
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(10);
                pdf.setTextColor(255, 255, 255);
                pdf.text('Global Healthcare', 12, 7);
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(8);
                pdf.text(`Analytics Report  |  ${dateLabel}`, 12, 13);
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(11);
                pdf.setTextColor(30, 64, 175);
                pdf.text(section, 12, 26);
                pdf.setTextColor(0, 0, 0);
                pdf.setFont('helvetica', 'normal');
            };

            const drawFooter = () => {
                pdf.setFillColor(240, 244, 255);
                pdf.rect(0, pageH - 8, pageW, 8, 'F');
                pdf.setFontSize(7);
                pdf.setTextColor(100);
                pdf.text(`Generated: ${now}`, 12, pageH - 3);
                pdf.text(`Page ${pdf.getNumberOfPages()}`, pageW - 12, pageH - 3, { align: 'right' });
            };

            const tableOpts = (body: any[][], head: string[][], colStyles?: any) => ({
                startY: 30,
                head,
                body,
                theme: 'grid' as const,
                headStyles: {
                    fillColor: [15, 52, 150] as [number, number, number],
                    textColor: 255, fontStyle: 'bold' as const, fontSize: 7.5,
                    cellPadding: 3
                },
                bodyStyles: { fontSize: 7, cellPadding: 2.5 },
                alternateRowStyles: { fillColor: [245, 248, 255] as [number, number, number] },
                columnStyles: colStyles || {},
                margin: { left: 12, right: 12, bottom: 14 },
                didDrawPage: () => { drawFooter(); }
            });

            // ── PAGE 1: Cover / KPI Summary ───────────────────────────────────
            // Full blue cover banner
            pdf.setFillColor(15, 52, 150);
            pdf.rect(0, 0, pageW, 45, 'F');
            pdf.setFillColor(99, 179, 237);
            pdf.rect(0, 45, pageW, 1.5, 'F');

            // Hospital branding
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(22);
            pdf.setTextColor(255, 255, 255);
            pdf.text('Global Healthcare', 14, 18);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(11);
            pdf.setTextColor(180, 210, 255);
            pdf.text('Comprehensive Analytics Report', 14, 27);
            pdf.setFontSize(9);
            pdf.setTextColor(160, 200, 255);
            pdf.text(`Period: ${dateLabel}`, 14, 35);
            pdf.text(`Generated: ${now}`, pageW - 14, 35, { align: 'right' });

            // KPI stat tiles
            const kd = data || {};
            const ex = kd.executiveStats || kd;
            const kpis = [
                { label: 'Total OPD Visits', value: ex.totalOpdVisits ?? exportData.patients?.length ?? '—', color: [30, 64, 175] as [number, number, number] },
                { label: 'Total Revenue (₹)', value: ex.totalRevenue != null ? `₹${Number(ex.totalRevenue).toLocaleString('en-IN')}` : '—', color: [5, 150, 105] as [number, number, number] },
                { label: 'New Patients', value: ex.newPatients ?? '—', color: [124, 58, 237] as [number, number, number] },
                { label: 'Lab Orders', value: exportData.labOrders?.length ?? '—', color: [217, 119, 6] as [number, number, number] },
                { label: 'Active Doctors', value: exportData.doctors?.length ?? '—', color: [2, 132, 199] as [number, number, number] },
                { label: 'Branches', value: exportData.branches?.length ?? '—', color: [190, 18, 60] as [number, number, number] },
            ];

            const cols = 3;
            const tileW = (pageW - 28 - (cols - 1) * 5) / cols;
            const tileH = 28;
            const startY = 52;

            kpis.forEach((kpi, i) => {
                const col = i % cols;
                const row = Math.floor(i / cols);
                const tx = 14 + col * (tileW + 5);
                const ty = startY + row * (tileH + 5);

                // Shadow effect
                pdf.setFillColor(210, 220, 240);
                pdf.roundedRect(tx + 0.8, ty + 0.8, tileW, tileH, 3, 3, 'F');

                // White card
                pdf.setFillColor(255, 255, 255);
                pdf.roundedRect(tx, ty, tileW, tileH, 3, 3, 'F');

                // Color accent left bar
                pdf.setFillColor(...kpi.color);
                pdf.roundedRect(tx, ty, 4, tileH, 2, 2, 'F');

                // Label
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(7.5);
                pdf.setTextColor(100, 116, 139);
                pdf.text(kpi.label, tx + 8, ty + 9);

                // Big value
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(16);
                pdf.setTextColor(...kpi.color);
                pdf.text(String(kpi.value), tx + 8, ty + 22);
            });

            // Summary counts section
            const summaryY = startY + 2 * (tileH + 5) + 6;
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(80, 100, 140);
            const totalPat = exportData.patients?.length ?? 0;
            const totalLab = exportData.labOrders?.length ?? 0;
            const totalDoc = exportData.doctors?.length ?? 0;
            const totalBr = exportData.branches?.length ?? 0;
            pdf.text(
                `This report contains ${totalPat} patient visits, ${totalLab} lab orders, ${totalDoc} doctor records, and ${totalBr} branch summaries for the selected period.`,
                14, summaryY,
                { maxWidth: pageW - 28 }
            );

            // Table of contents
            const tocY = summaryY + 10;
            pdf.setFillColor(240, 245, 255);
            pdf.roundedRect(14, tocY, pageW - 28, 28, 3, 3, 'F');
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8);
            pdf.setTextColor(15, 52, 150);
            pdf.text('Report Contents', 18, tocY + 7);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7.5);
            pdf.setTextColor(60, 80, 120);
            const tocItems = ['Page 2  —  Analytics Charts', 'Page 3  —  Patient Visit Details', 'Page 4  —  Lab Orders', 'Page 5  —  Doctor Performance', 'Page 6  —  Branch Summary'];
            tocItems.forEach((item, i) => pdf.text(item, 18 + (i % 2) * ((pageW - 36) / 2), tocY + 14 + Math.floor(i / 2) * 7));

            drawFooter();

            // ── PAGE 2: Analytics Charts ──────────────────────────────────────
            pdf.addPage();
            drawPageHeader('Analytics Charts');

            // Layout: 2x2 grid of chart panels
            const panelMargin = 12;
            const panelGap = 6;
            const panelW = (pageW - panelMargin * 2 - panelGap) / 2;
            const panelH = (pageH - 36 - panelMargin - panelGap - 14) / 2;
            const panel = (col: number, row: number) => ({
                x: panelMargin + col * (panelW + panelGap),
                y: 32 + row * (panelH + panelGap)
            });

            const drawPanelBg = (x: number, y: number, w: number, h: number, title: string) => {
                pdf.setFillColor(248, 250, 255);
                pdf.roundedRect(x, y, w, h, 3, 3, 'F');
                pdf.setDrawColor(210, 220, 240);
                pdf.setLineWidth(0.3);
                pdf.roundedRect(x, y, w, h, 3, 3, 'S');
                // Panel title bar
                pdf.setFillColor(15, 52, 150);
                pdf.roundedRect(x, y, w, 9, 3, 3, 'F');
                pdf.rect(x, y + 4, w, 5, 'F'); // flatten bottom corners
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(7.5);
                pdf.setTextColor(255, 255, 255);
                pdf.text(title, x + 5, y + 6.2);
                pdf.setTextColor(0, 0, 0);
                pdf.setFont('helvetica', 'normal');
            };

            // ── Chart 1: Revenue by Branch (horizontal bars) ──────────────────
            const c1 = panel(0, 0);
            drawPanelBg(c1.x, c1.y, panelW, panelH, 'Revenue by Branch  (₹)');
            const branchRevData = (exportData.branches || []).slice(0, 6).map((b: any) => ({
                label: (b.branch_name || 'Unknown').substring(0, 16),
                value: Number(b.billing_revenue) || 0
            }));
            const maxBrRev = Math.max(...branchRevData.map((d: any) => d.value), 1);
            const c1PadT = 14, c1PadB = 6, c1PadL = 38, c1PadR = 8;
            const c1ChartH = panelH - c1PadT - c1PadB;
            const c1ChartW = panelW - c1PadL - c1PadR;
            const barColors: [number, number, number][] = [
                [30, 64, 175], [5, 150, 105], [124, 58, 237],
                [217, 119, 6], [2, 132, 199], [190, 18, 60]
            ];
            if (branchRevData.length === 0) {
                pdf.setFontSize(7); pdf.setTextColor(150);
                pdf.text('No data', c1.x + panelW / 2, c1.y + panelH / 2, { align: 'center' });
            } else {
                const barH = Math.min((c1ChartH / branchRevData.length) - 3, 10);
                branchRevData.forEach((d: any, i: number) => {
                    const bY = c1.y + c1PadT + i * (c1ChartH / branchRevData.length);
                    const bW = (d.value / maxBrRev) * c1ChartW;
                    pdf.setFillColor(220, 230, 250);
                    pdf.roundedRect(c1.x + c1PadL, bY, c1ChartW, barH, 1, 1, 'F');
                    pdf.setFillColor(...barColors[i % barColors.length]);
                    if (bW > 0) pdf.roundedRect(c1.x + c1PadL, bY, bW, barH, 1, 1, 'F');
                    pdf.setFontSize(6.5); pdf.setTextColor(60, 80, 120);
                    pdf.text(d.label, c1.x + c1PadL - 2, bY + barH - 1.5, { align: 'right' });
                    if (d.value > 0) {
                        pdf.setFontSize(5.5); pdf.setTextColor(255, 255, 255);
                        const valText = `₹${Math.round(d.value / 1000)}k`;
                        if (bW > 12) pdf.text(valText, c1.x + c1PadL + bW - 2, bY + barH - 1.5, { align: 'right' });
                    }
                });
            }

            // ── Chart 2: Patients by Doctor (horizontal bars) ─────────────────
            const c2 = panel(1, 0);
            drawPanelBg(c2.x, c2.y, panelW, panelH, 'Patients by Doctor');
            const docData = (exportData.doctors || []).slice(0, 6).map((d: any) => ({
                label: (d.doctor_name || 'Unknown').split(' ').slice(0, 2).join(' ').substring(0, 16),
                value: Number(d.total_patients) || 0
            }));
            const maxDoc = Math.max(...docData.map((d: any) => d.value), 1);
            const c2PadT = 14, c2PadB = 6, c2PadL = 38, c2PadR = 8;
            const c2ChartH = panelH - c2PadT - c2PadB;
            const c2ChartW = panelW - c2PadL - c2PadR;
            if (docData.length === 0) {
                pdf.setFontSize(7); pdf.setTextColor(150);
                pdf.text('No data', c2.x + panelW / 2, c2.y + panelH / 2, { align: 'center' });
            } else {
                const barH2 = Math.min((c2ChartH / docData.length) - 3, 10);
                docData.forEach((d: any, i: number) => {
                    const bY = c2.y + c2PadT + i * (c2ChartH / docData.length);
                    const bW = (d.value / maxDoc) * c2ChartW;
                    pdf.setFillColor(220, 245, 235);
                    pdf.roundedRect(c2.x + c2PadL, bY, c2ChartW, barH2, 1, 1, 'F');
                    pdf.setFillColor(5, 150, 105);
                    if (bW > 0) pdf.roundedRect(c2.x + c2PadL, bY, bW, barH2, 1, 1, 'F');
                    pdf.setFontSize(6.5); pdf.setTextColor(60, 80, 120);
                    pdf.text(d.label, c2.x + c2PadL - 2, bY + barH2 - 1.5, { align: 'right' });
                    if (d.value > 0) {
                        pdf.setFontSize(6); pdf.setTextColor(255, 255, 255);
                        if (bW > 8) pdf.text(String(d.value), c2.x + c2PadL + bW - 2, bY + barH2 - 1.5, { align: 'right' });
                    }
                });
            }

            // ── Chart 3: Lab Status (vertical bars) ───────────────────────────
            const c3 = panel(0, 1);
            drawPanelBg(c3.x, c3.y, panelW, panelH, 'Lab Orders by Status');
            const labStatusMap: Record<string, number> = {};
            (exportData.labOrders || []).forEach((lo: any) => {
                const s = lo.status || 'Unknown';
                labStatusMap[s] = (labStatusMap[s] || 0) + 1;
            });
            const labStatusData = Object.entries(labStatusMap).slice(0, 6).map(([label, value]) => ({ label, value: value as number }));
            const statusColors: [number, number, number][] = [[30, 64, 175], [5, 150, 105], [217, 119, 6], [190, 18, 60], [124, 58, 237], [2, 132, 199]];
            const maxStat = Math.max(...labStatusData.map(d => d.value), 1);
            const c3PadT = 14, c3PadB = 18, c3PadL = 8, c3PadR = 8;
            const c3ChartH = panelH - c3PadT - c3PadB;
            const c3ChartW = panelW - c3PadL - c3PadR;
            if (labStatusData.length === 0) {
                pdf.setFontSize(7); pdf.setTextColor(150);
                pdf.text('No lab data', c3.x + panelW / 2, c3.y + panelH / 2, { align: 'center' });
            } else {
                const bW3 = Math.min((c3ChartW / labStatusData.length) - 4, 18);
                const baseY3 = c3.y + c3PadT + c3ChartH;
                labStatusData.forEach((d, i) => {
                    const bX = c3.x + c3PadL + i * (c3ChartW / labStatusData.length) + 2;
                    const bH = (d.value / maxStat) * c3ChartH;
                    pdf.setFillColor(230, 235, 250);
                    pdf.rect(bX, c3.y + c3PadT, bW3, c3ChartH, 'F');
                    pdf.setFillColor(...statusColors[i % statusColors.length]);
                    if (bH > 0) pdf.roundedRect(bX, baseY3 - bH, bW3, bH, 1, 1, 'F');
                    pdf.setFontSize(5.5); pdf.setTextColor(60, 80, 120);
                    pdf.text(d.label.substring(0, 10), bX + bW3 / 2, baseY3 + 4, { align: 'center' });
                    pdf.setFontSize(6.5); pdf.setTextColor(40, 60, 120);
                    pdf.text(String(d.value), bX + bW3 / 2, baseY3 - bH - 2, { align: 'center' });
                });
            }

            // ── Chart 4: Payment Mode Donut ───────────────────────────────────
            const c4 = panel(1, 1);
            drawPanelBg(c4.x, c4.y, panelW, panelH, 'Payment Mode Distribution');
            const payMap: Record<string, number> = {};
            (exportData.patients || []).forEach((p: any) => {
                const m = p.payment_mode || 'Unknown';
                payMap[m] = (payMap[m] || 0) + 1;
            });
            const payData = Object.entries(payMap).map(([label, value]) => ({ label, value: value as number }));
            const payTotal = payData.reduce((s, d) => s + d.value, 0);
            const donutColors: [number, number, number][] = [[30, 64, 175], [5, 150, 105], [217, 119, 6], [124, 58, 237], [190, 18, 60], [2, 132, 199]];
            const cx4 = c4.x + panelW * 0.38;
            const cy4 = c4.y + panelH * 0.55;
            const outerR = Math.min(panelW, panelH) * 0.28;
            const innerR = outerR * 0.52;
            if (payData.length === 0 || payTotal === 0) {
                pdf.setFontSize(7); pdf.setTextColor(150);
                pdf.text('No payment data', c4.x + panelW / 2, c4.y + panelH / 2, { align: 'center' });
            } else {
                let startAngle = -Math.PI / 2;
                payData.forEach((seg, i) => {
                    const sweep = (seg.value / payTotal) * Math.PI * 2;
                    const color = donutColors[i % donutColors.length];
                    // Draw wedge as approximated arc segments
                    const steps = Math.max(6, Math.round(sweep * 8));
                    pdf.setFillColor(...color);
                    for (let s = 0; s < steps; s++) {
                        const a1 = startAngle + (s / steps) * sweep;
                        const a2 = startAngle + ((s + 1) / steps) * sweep;
                        const x1o = cx4 + Math.cos(a1) * outerR, y1o = cy4 + Math.sin(a1) * outerR;
                        const x2o = cx4 + Math.cos(a2) * outerR, y2o = cy4 + Math.sin(a2) * outerR;
                        const x1i = cx4 + Math.cos(a1) * innerR, y1i = cy4 + Math.sin(a1) * innerR;
                        const x2i = cx4 + Math.cos(a2) * innerR, y2i = cy4 + Math.sin(a2) * innerR;
                        // Draw trapezoid quad
                        pdf.lines([[x2o - x1o, y2o - y1o], [x2i - x2o, y2i - y2o], [x1i - x2i, y1i - y2i]], x1o, y1o, [1, 1], 'F', false);
                    }
                    startAngle += sweep;
                });
                // White center
                pdf.setFillColor(248, 250, 255);
                pdf.circle(cx4, cy4, innerR, 'F');
                // Center label
                pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(15, 52, 150);
                pdf.text(String(payTotal), cx4, cy4 + 2, { align: 'center' });
                pdf.setFont('helvetica', 'normal'); pdf.setFontSize(5.5); pdf.setTextColor(100);
                pdf.text('visits', cx4, cy4 + 6.5, { align: 'center' });

                // Legend
                const legendX = c4.x + panelW * 0.72;
                let legendY = c4.y + 18;
                payData.slice(0, 5).forEach((seg, i) => {
                    pdf.setFillColor(...donutColors[i % donutColors.length]);
                    pdf.roundedRect(legendX, legendY - 3, 4, 4, 1, 1, 'F');
                    pdf.setFontSize(6.5); pdf.setTextColor(60, 80, 120);
                    const pct = Math.round((seg.value / payTotal) * 100);
                    pdf.text(`${seg.label} (${pct}%)`, legendX + 6, legendY);
                    legendY += 8;
                });
            }

            drawFooter();

            // ── PAGE 2: Patient Visits ────────────────────────────────────────
            pdf.addPage();
            drawPageHeader('Patient Visit Details');
            const patRows = (exportData.patients || []).map((r: any) => [
                r.patient_name || '—', r.mrn_number || '—', r.contact_number || '—',
                r.gender || '—', r.visit_date || '—', r.visit_type || '—',
                r.diagnosis || '—', r.consultation_fee ? `₹${r.consultation_fee}` : '—',
                r.doctor_name || '—', r.branch_name || '—',
                r.payment_mode || '—', r.payment_status || '—',
                r.paid_amount ? `₹${r.paid_amount}` : '—'
            ]);
            if (patRows.length === 0) patRows.push(['No patient visits recorded for this period', '', '', '', '', '', '', '', '', '', '', '', '']);
            autoTable(pdf, tableOpts(patRows, [['Patient', 'MRN', 'Contact', 'Gender', 'Visit Date', 'Type', 'Diagnosis', 'Fee', 'Doctor', 'Branch', 'Pay Mode', 'Status', 'Paid']]));

            // ── PAGE 3: Lab Orders ────────────────────────────────────────────
            pdf.addPage();
            drawPageHeader('Lab Orders');
            const labRows = (exportData.labOrders || []).map((r: any) => [
                r.order_number || '—', r.patient_name || '—', r.contact_number || '—',
                r.order_date || '—', r.test_name || '—', r.test_category || '—',
                r.priority || '—', r.status || '—',
                r.ordered_by_doctor || '—', r.branch_name || '—',
                r.is_external === 'true' ? 'External' : 'In-House'
            ]);
            if (labRows.length === 0) labRows.push(['No lab orders recorded for this period', '', '', '', '', '', '', '', '', '', '']);
            autoTable(pdf, tableOpts(labRows, [['Order #', 'Patient', 'Contact', 'Date', 'Test', 'Category', 'Priority', 'Status', 'Doctor', 'Branch', 'Source']]));

            // ── PAGE 4: Doctor Performance ────────────────────────────────────
            pdf.addPage();
            drawPageHeader('Doctor Performance');
            const docRows = (exportData.doctors || []).map((r: any) => [
                r.doctor_name || '—', r.specialization || '—', r.qualification || '—',
                r.branch_name || '—', r.total_patients ?? 0, r.unique_patients ?? 0,
                r.new_patients ?? 0, r.follow_ups ?? 0, r.mlc_cases ?? 0,
                `₹${Math.round(Number(r.total_revenue) || 0).toLocaleString('en-IN')}`,
                `₹${Math.round(Number(r.avg_consultation_fee) || 0)}`
            ]);
            if (docRows.length === 0) docRows.push(['No doctor records for this period', '', '', '', '', '', '', '', '', '', '']);
            autoTable(pdf, tableOpts(docRows, [['Doctor', 'Specialization', 'Qualification', 'Branch', 'Total', 'Unique', 'New', 'Follow-ups', 'MLC', 'Revenue', 'Avg Fee']]));

            // ── PAGE 5: Branch Summary ────────────────────────────────────────
            pdf.addPage();
            drawPageHeader('Branch Performance Summary');
            const brRows = (exportData.branches || []).map((r: any) => [
                r.branch_name || '—', r.branch_code || '—', r.contact_number || '—',
                r.total_opd_visits ?? 0, r.unique_patients ?? 0, r.active_doctors ?? 0,
                `₹${Math.round(Number(r.opd_revenue) || 0).toLocaleString('en-IN')}`,
                `₹${Math.round(Number(r.billing_revenue) || 0).toLocaleString('en-IN')}`,
                r.mlc_cases ?? 0, r.lab_orders ?? 0, r.lab_completed ?? 0
            ]);
            if (brRows.length === 0) brRows.push(['No branch data for this period', '', '', '', '', '', '', '', '', '', '']);
            autoTable(pdf, tableOpts(brRows, [['Branch', 'Code', 'Contact', 'OPD Visits', 'Unique Pts', 'Doctors', 'OPD Revenue', 'Bill Revenue', 'MLC', 'Lab Orders', 'Completed']]));

            pdf.save(`Global_Healthcare_Report_${exportData.dateRange?.start ?? 'all'}.pdf`);
        } catch (err) {
            console.error('PDF Export failed', err);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            const token = localStorage.getItem('token');
            const params: any = {};
            if (useCustomDates && dateRange.startDate && dateRange.endDate) {
                params.startDate = dateRange.startDate;
                params.endDate = dateRange.endDate;
            }

            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/clientadmins/reports/export-detail`,
                { headers: { Authorization: `Bearer ${token}` }, params }
            );

            const exportData = response.data.data;

            // Dynamically import ExcelJS to keep bundle light
            const ExcelJS = (await import('exceljs')).default;
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Global Healthcare HMS';
            workbook.created = new Date();

            const headerStyle: Partial<ExcelJS.Style> = {
                font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } },
                alignment: { horizontal: 'center', vertical: 'middle' },
                border: { bottom: { style: 'thin', color: { argb: 'FFBFDBFE' } } }
            };

            const addSheet = (
                name: string,
                columns: { header: string; key: string; width?: number }[],
                rows: any[]
            ) => {
                const sheet = workbook.addWorksheet(name, {
                    views: [{ state: 'frozen', ySplit: 1 }]
                });
                sheet.columns = columns.map(c => ({ ...c, width: c.width || 20 }));
                sheet.getRow(1).eachCell((cell) => { Object.assign(cell, headerStyle); });
                rows.forEach(r => {
                    const row = sheet.addRow(columns.map(c => r[c.key] ?? ''));
                    row.eachCell(cell => {
                        cell.border = {
                            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                        };
                    });
                });
                sheet.getRow(1).height = 24;
                return sheet;
            };

            // Sheet 1 — Patient Visits
            addSheet('Patient Visits', [
                { header: 'Patient ID', key: 'patient_id', width: 12 },
                { header: 'Patient Name', key: 'patient_name', width: 25 },
                { header: 'Contact', key: 'contact_number', width: 16 },
                { header: 'MRN', key: 'mrn_number', width: 15 },
                { header: 'Gender', key: 'gender', width: 10 },
                { header: 'DOB', key: 'date_of_birth', width: 14 },
                { header: 'Blood Group', key: 'blood_group', width: 13 },
                { header: 'Visit Date', key: 'visit_date', width: 14 },
                { header: 'Visit Type', key: 'visit_type', width: 13 },
                { header: 'Diagnosis', key: 'diagnosis', width: 30 },
                { header: 'Consultation Fee (₹)', key: 'consultation_fee', width: 22 },
                { header: 'MLC', key: 'is_mlc', width: 8 },
                { header: 'Doctor', key: 'doctor_name', width: 22 },
                { header: 'Specialization', key: 'specialization', width: 20 },
                { header: 'Branch', key: 'branch_name', width: 20 },
                { header: 'Bill Number', key: 'bill_number', width: 16 },
                { header: 'Bill Amount (₹)', key: 'bill_amount', width: 18 },
                { header: 'Paid Amount (₹)', key: 'paid_amount', width: 18 },
                { header: 'Pending (₹)', key: 'pending_amount', width: 15 },
                { header: 'Discount (₹)', key: 'discount_amount', width: 15 },
                { header: 'Payment Mode', key: 'payment_mode', width: 16 },
                { header: 'Payment Status', key: 'payment_status', width: 16 },
                { header: 'Billing Date', key: 'billing_date', width: 14 }
            ], exportData.patients || []);

            // Sheet 2 — Lab Orders
            addSheet('Lab Orders', [
                { header: 'Order Number', key: 'order_number', width: 18 },
                { header: 'Patient Name', key: 'patient_name', width: 25 },
                { header: 'Contact', key: 'contact_number', width: 16 },
                { header: 'MRN', key: 'mrn_number', width: 15 },
                { header: 'Order Date', key: 'order_date', width: 14 },
                { header: 'Test Name', key: 'test_name', width: 30 },
                { header: 'Category', key: 'test_category', width: 16 },
                { header: 'Priority', key: 'priority', width: 12 },
                { header: 'Status', key: 'status', width: 14 },
                { header: 'Ordered By Doctor', key: 'ordered_by_doctor', width: 25 },
                { header: 'Branch', key: 'branch_name', width: 20 },
                { header: 'Source', key: 'is_external', width: 12 },
                { header: 'Notes', key: 'notes', width: 30 }
            ], exportData.labOrders || []);

            // Sheet 3 — Doctor Performance
            addSheet('Doctor Performance', [
                { header: 'Doctor Name', key: 'doctor_name', width: 25 },
                { header: 'Specialization', key: 'specialization', width: 22 },
                { header: 'Qualification', key: 'qualification', width: 18 },
                { header: 'Branch', key: 'branch_name', width: 20 },
                { header: 'Total Patients', key: 'total_patients', width: 16 },
                { header: 'Unique Patients', key: 'unique_patients', width: 17 },
                { header: 'New Patients', key: 'new_patients', width: 15 },
                { header: 'Follow-ups', key: 'follow_ups', width: 13 },
                { header: 'MLC Cases', key: 'mlc_cases', width: 13 },
                { header: 'Total Revenue (₹)', key: 'total_revenue', width: 20 },
                { header: 'Avg Fee (₹)', key: 'avg_consultation_fee', width: 15 }
            ], exportData.doctors || []);

            // Sheet 4 — Branch Summary
            addSheet('Branch Summary', [
                { header: 'Branch Name', key: 'branch_name', width: 25 },
                { header: 'Branch Code', key: 'branch_code', width: 15 },
                { header: 'Address', key: 'address', width: 35 },
                { header: 'Contact', key: 'contact_number', width: 18 },
                { header: 'Total OPD Visits', key: 'total_opd_visits', width: 18 },
                { header: 'Unique Patients', key: 'unique_patients', width: 18 },
                { header: 'Active Doctors', key: 'active_doctors', width: 16 },
                { header: 'OPD Revenue (₹)', key: 'opd_revenue', width: 18 },
                { header: 'Billing Revenue (₹)', key: 'billing_revenue', width: 20 },
                { header: 'MLC Cases', key: 'mlc_cases', width: 13 },
                { header: 'Lab Orders', key: 'lab_orders', width: 14 },
                { header: 'Lab Completed', key: 'lab_completed', width: 16 }
            ], exportData.branches || []);

            // Save the file
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Detailed_Report_${exportData.dateRange?.start || 'all'}_to_${exportData.dateRange?.end || 'all'}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error('Excel Export failed', err);
            alert('Failed to generate Excel: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsExporting(false);
        }
    };

    const tabs = [
        {
            id: 'overview',
            label: 'Overview',
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
            <div ref={reportRef} className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 bg-white/50">

                {/* Premium Header Section */}
                <div className="mb-8 print:hidden">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
                        {/* Gradient Background Banner */}
                        <div className={`relative bg-gradient-to-r ${activeTabInfo?.gradient} p-5`}>
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute inset-0" style={{
                                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                                    backgroundSize: '24px 24px'
                                }}></div>
                            </div>

                            <div className="relative z-10">
                                {/* Title Row */}
                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                                            <BarChart3 className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h1 className="text-2xl font-bold text-white tracking-tight">
                                                Analytics Dashboard
                                            </h1>
                                            <p className="text-white/90 text-xs font-medium mt-0.5 flex items-center gap-1.5">
                                                <Sparkles className="w-3 h-3" />
                                                Comprehensive insights and performance metrics
                                            </p>
                                        </div>
                                    </div>

                                    {/* Export Buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleExportPDF}
                                            disabled={loading || !data || isExporting}
                                            className="no-print px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all font-bold text-xs disabled:opacity-50 border border-white/30 shadow-md flex items-center gap-2 hover:scale-105 transform duration-200"
                                        >
                                            {isExporting ? (
                                                <>
                                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                    </svg>
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="w-4 h-4" />
                                                    Export PDF
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={handleExportExcel}
                                            disabled={loading || isExporting}
                                            className="no-print px-4 py-2 bg-green-500/30 backdrop-blur-sm text-white rounded-lg hover:bg-green-500/50 transition-all font-bold text-xs disabled:opacity-50 border border-white/30 shadow-md flex items-center gap-2 hover:scale-105 transform duration-200"
                                            title="Download detailed Excel report with 4 sheets"
                                        >
                                            {isExporting ? (
                                                <>
                                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 12 0 018-8v8z" />
                                                    </svg>
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <FileSpreadsheet className="w-4 h-4" />
                                                    Excel (Detailed)
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>


                                {/* Date Filter Section */}
                                <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="flex items-center gap-2 text-white">
                                            <Filter className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Date Filter</span>
                                        </div>

                                        <div className="flex flex-col gap-2 flex-1">
                                            {/* Quick Filters */}
                                            <div className="flex gap-2">
                                                {[
                                                    { label: 'Today', val: 'today' },
                                                    { label: 'Yesterday', val: 'yesterday' },
                                                    { label: 'Last 7 Days', val: 'week' },
                                                    { label: 'Last 30 Days', val: 'month' }
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.val}
                                                        onClick={() => setQuickFilter(opt.val as any)}
                                                        className="px-2.5 py-1 text-[10px] font-bold text-white bg-white/20 hover:bg-white/30 rounded-md transition-all border border-white/10"
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2">
                                                <input
                                                    type="date"
                                                    name="startDate"
                                                    value={dateRange.startDate}
                                                    max={today}
                                                    onChange={handleDateChange}
                                                    className="bg-white text-gray-900 border-0 rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-white/50 focus:outline-none shadow-md min-w-[120px]"
                                                />
                                                <span className="text-white/80 font-bold text-xs">→</span>
                                                <input
                                                    type="date"
                                                    name="endDate"
                                                    value={dateRange.endDate}
                                                    min={dateRange.startDate}
                                                    max={today}
                                                    onChange={handleDateChange}
                                                    className="bg-white text-gray-900 border-0 rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-white/50 focus:outline-none shadow-md min-w-[120px]"
                                                />
                                                <button
                                                    onClick={handleApplyFilter}
                                                    disabled={loading || !dateRange.startDate || !dateRange.endDate}
                                                    className="px-4 py-1.5 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-all font-bold text-xs disabled:opacity-50 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-1.5"
                                                >
                                                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                                                    Apply
                                                </button>
                                                {useCustomDates && (
                                                    <button
                                                        onClick={handleResetDates}
                                                        disabled={loading}
                                                        className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all font-bold text-xs disabled:opacity-50 border border-white/30 shadow-md flex items-center gap-1.5"
                                                        title="Reset to Today"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                        Reset
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Active Filter Indicator */}
                                    <div className="mt-3 flex items-center gap-2 text-white/90 text-xs">
                                        {useCustomDates && dateRange.startDate && dateRange.endDate ? (
                                            <>
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span className="font-semibold">Period:</span>
                                                <span className="px-2 py-0.5 bg-white/20 rounded-md font-bold">
                                                    {new Date(dateRange.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    {' → '}
                                                    {new Date(dateRange.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span className="px-2 py-0.5 bg-white/20 rounded-md font-semibold">
                                                    All Available Data
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
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
                                    onClick={() => {
                                        if (isActive) return;
                                        setData(null);
                                        setError(null);
                                        setActiveTab(tab.id);
                                    }}
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


                {/* Content Area - captured for PDF charts */}
                <div ref={chartsRef} className="min-h-[500px] print:min-h-0">
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
            </div >

            {/* Print Styles */}
            < style jsx global > {`
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
            `}</style >
        </div >
    );
}