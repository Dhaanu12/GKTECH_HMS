// 'use client';

// import React, { useState, useEffect, useCallback } from 'react';
// import axios from 'axios';
// import { Calendar, Filter, Building2, Stethoscope, UserCog, UserCheck, BarChart3, Download } from 'lucide-react';
// import BranchPerformance from '@/components/reports/BranchPerformance';
// import StaffPerformance from '@/components/reports/StaffPerformance';
// import OverviewPerformance from '@/components/reports/OverviewPerformance';

// export default function ClientAdminReports() {
//     const [activeTab, setActiveTab] = useState('overview'); // overview, branch, doctor, nurse, receptionist
//     const [dateRange, setDateRange] = useState({
//         startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of current year
//         endDate: new Date().toISOString().split('T')[0]
//     });

//     const [loading, setLoading] = useState(false);
//     const [data, setData] = useState<any>(null);

//     const fetchData = useCallback(async () => {
//         setLoading(true);
//         setData(null); // Clear old data to prevent type mismatches
//         try {
//             const token = localStorage.getItem('token');
//             const headers = { Authorization: `Bearer ${token}` };
//             const params = { startDate: dateRange.startDate, endDate: dateRange.endDate };

//             let endpoint = '';

//             // We'll use different endpoints based on the active tab
//             // For 'overview', we can stick to the existing analytics or a mix
//             // For others, use the new reporting controller

//             if (activeTab === 'branch') {
//                 const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/clientadmins/reports/branch`, { headers, params });
//                 setData(res.data.data);
//             } else if (['doctor', 'nurse', 'receptionist'].includes(activeTab)) {
//                 const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/clientadmins/reports/staff`, {
//                     headers,
//                     params: { ...params, type: activeTab.toUpperCase() }
//                 });
//                 setData(res.data.data);
//             } else {
//                 // Overview - Keep using the robust existing endpoint for summary
//                 const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/clientadmins/analytics`, { headers, params });
//                 setData(res.data.data);
//             }

//         } catch (error) {
//             console.error('Error fetching reports:', error);
//         } finally {
//             setLoading(false);
//         }
//     }, [activeTab, dateRange]);

//     useEffect(() => {
//         fetchData();
//     }, [fetchData]);

//     const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
//     };

//     return (
//         <div className="space-y-8 animate-in fade-in duration-700 min-h-screen pb-20">
//             {/* Header Section */}
//             <div className="flex flex-col md:flex-row justify-between items-end gap-6">
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
//                     <button onClick={fetchData} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition" title="Refresh">
//                         <Filter className="w-4 h-4" />
//                     </button>
//                     <button className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition" title="Export">
//                         <Download className="w-4 h-4" />
//                     </button>
//                 </div>
//             </div>

//             {/* Tabs */}
//             <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-1">
//                 <TabButton id="overview" label="Overview" icon={BarChart3} active={activeTab} onClick={setActiveTab} />
//                 <TabButton id="branch" label="Branch Reports" icon={Building2} active={activeTab} onClick={setActiveTab} />
//                 <TabButton id="doctor" label="Doctors" icon={Stethoscope} active={activeTab} onClick={setActiveTab} />
//                 <TabButton id="nurse" label="Nurses" icon={UserCheck} active={activeTab} onClick={setActiveTab} />
//                 <TabButton id="receptionist" label="Receptionists" icon={UserCog} active={activeTab} onClick={setActiveTab} />
//                 {/* <TabButton id="compare" label="Comparisons" icon={ArrowRightLeft} active={activeTab} onClick={setActiveTab} /> */}
//             </div>

//             {/* Content Area */}
//             <div className="min-h-[400px]">
//                 {loading ? (
//                     <div className="flex items-center justify-center h-64">
//                         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//                     </div>
//                 ) : (
//                     <>
//                         {activeTab === 'overview' && data && (
//                             <OverviewPerformance data={data} />
//                         )}

//                         {activeTab === 'branch' && data && <BranchPerformance data={data} />}

//                         {['doctor', 'nurse', 'receptionist'].includes(activeTab) && data && (
//                             <StaffPerformance data={data} type={activeTab.toUpperCase() as any} />
//                         )}
//                     </>
//                 )}
//             </div>
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

'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Calendar, Filter, Building2, Stethoscope, UserCog, UserCheck, BarChart3, FileText } from 'lucide-react';
import BranchPerformance from '@/components/reports/BranchPerformance';
import StaffPerformance from '@/components/reports/StaffPerformance';
import OverviewPerformance from '@/components/reports/OverviewPerformance';

export default function ClientAdminReports() {
    const [activeTab, setActiveTab] = useState('overview');
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [fetchTrigger, setFetchTrigger] = useState(0);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            console.log('🔄 Fetching data...');
            console.log('Active Tab:', activeTab);
            console.log('Date Range:', dateRange);
            
            setLoading(true);
            setData(null);
            setError(null);
            
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };
                const params = { 
                    startDate: dateRange.startDate, 
                    endDate: dateRange.endDate 
                };

                console.log('📤 Sending request with params:', params);

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
                    res = await axios.get(
                        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/clientadmins/analytics`, 
                        { headers, params }
                    );
                }

                console.log('📥 Received response:', res.data);
                setData(res.data.data);

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
        console.log('📅 Date input changed:', e.target.name, '=', e.target.value);
        setDateRange(prev => ({ 
            ...prev, 
            [e.target.name]: e.target.value 
        }));
    };

    const handleApplyFilter = () => {
        console.log('🔍 Applying filter with dates:', dateRange);
        setFetchTrigger(prev => prev + 1);
    };

    const handleExportPDF = () => {
        if (!data) {
            alert('No data to export');
            return;
        }

        console.log('📄 Generating PDF report...');
        
        // Open a new window for printing
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to generate PDF');
            return;
        }

        const formatDate = (date: string) => new Date(date).toLocaleDateString();
        const formatCurrency = (value: string | number) => `₹${parseFloat(value.toString() || '0').toLocaleString('en-IN')}`;

        let htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report - ${dateRange.startDate} to ${dateRange.endDate}</title>
                <style>
                    @page {
                        size: A4;
                        margin: 20mm;
                    }
                    
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: 'Arial', sans-serif;
                        font-size: 12px;
                        line-height: 1.6;
                        color: #333;
                        padding: 20px;
                    }
                    
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 3px solid #3b82f6;
                        padding-bottom: 15px;
                    }
                    
                    .header h1 {
                        font-size: 24px;
                        color: #1e40af;
                        margin-bottom: 5px;
                    }
                    
                    .header .subtitle {
                        font-size: 14px;
                        color: #64748b;
                        margin-bottom: 10px;
                    }
                    
                    .date-range {
                        font-size: 13px;
                        color: #475569;
                        font-weight: bold;
                    }
                    
                    .section {
                        margin-bottom: 25px;
                        page-break-inside: avoid;
                    }
                    
                    .section-title {
                        font-size: 16px;
                        font-weight: bold;
                        color: #1e40af;
                        margin-bottom: 10px;
                        padding-bottom: 5px;
                        border-bottom: 2px solid #e2e8f0;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    
                    th {
                        background-color: #f1f5f9;
                        color: #334155;
                        font-weight: bold;
                        padding: 10px;
                        text-align: left;
                        border: 1px solid #cbd5e1;
                        font-size: 11px;
                        text-transform: uppercase;
                    }
                    
                    td {
                        padding: 8px 10px;
                        border: 1px solid #e2e8f0;
                    }
                    
                    tr:nth-child(even) {
                        background-color: #f8fafc;
                    }
                    
                    .summary-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 15px;
                        margin-bottom: 20px;
                    }
                    
                    .summary-card {
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        padding: 15px;
                        background: #f8fafc;
                    }
                    
                    .summary-card .label {
                        font-size: 11px;
                        color: #64748b;
                        text-transform: uppercase;
                        margin-bottom: 5px;
                        font-weight: bold;
                    }
                    
                    .summary-card .value {
                        font-size: 20px;
                        font-weight: bold;
                        color: #1e40af;
                    }
                    
                    .revenue {
                        color: #059669 !important;
                    }
                    
                    .footer {
                        margin-top: 40px;
                        text-align: center;
                        font-size: 10px;
                        color: #94a3b8;
                        border-top: 1px solid #e2e8f0;
                        padding-top: 10px;
                    }
                    
                    @media print {
                        body {
                            padding: 0;
                        }
                        
                        .no-print {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Performance Report</h1>
                    <div class="subtitle">Care24 Medical Centre & Hospital</div>
                    <div class="date-range">Period: ${formatDate(dateRange.startDate)} to ${formatDate(dateRange.endDate)}</div>
                </div>
        `;

        if (activeTab === 'overview') {
            // Summary Section
            htmlContent += `
                <div class="section">
                    <div class="section-title">Executive Summary</div>
                    <div class="summary-grid">
                        <div class="summary-card">
                            <div class="label">Total Revenue</div>
                            <div class="value revenue">${formatCurrency(data.summary?.total_revenue || 0)}</div>
                        </div>
                        <div class="summary-card">
                            <div class="label">OPD Visits</div>
                            <div class="value">${data.summary?.total_opd_visits || 0}</div>
                        </div>
                        <div class="summary-card">
                            <div class="label">Unique Patients</div>
                            <div class="value">${data.summary?.unique_patients || 0}</div>
                        </div>
                        <div class="summary-card">
                            <div class="label">MLC Cases</div>
                            <div class="value">${data.summary?.total_mlc || 0}</div>
                        </div>
                    </div>
                </div>
            `;

            // Doctor Performance
            if (data.doctorStats?.length > 0) {
                htmlContent += `
                    <div class="section">
                        <div class="section-title">Top Performing Doctors</div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Doctor Name</th>
                                    <th>Specialization</th>
                                    <th style="text-align: right;">Patients Seen</th>
                                    <th style="text-align: right;">Revenue Generated</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                data.doctorStats.slice(0, 10).forEach((doc: any) => {
                    htmlContent += `
                        <tr>
                            <td>Dr. ${doc.first_name} ${doc.last_name}</td>
                            <td>${doc.specialization}</td>
                            <td style="text-align: right;">${doc.patient_count}</td>
                            <td style="text-align: right; font-weight: bold; color: #059669;">${formatCurrency(doc.revenue_generated || 0)}</td>
                        </tr>
                    `;
                });
                
                htmlContent += `
                            </tbody>
                        </table>
                    </div>
                `;
            }

            // Department Distribution
            if (data.deptStats?.length > 0) {
                htmlContent += `
                    <div class="section">
                        <div class="section-title">Department Distribution</div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Department</th>
                                    <th style="text-align: right;">Patient Count</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                data.deptStats.forEach((dept: any) => {
                    htmlContent += `
                        <tr>
                            <td>${dept.department_name}</td>
                            <td style="text-align: right; font-weight: bold;">${dept.patient_count}</td>
                        </tr>
                    `;
                });
                
                htmlContent += `
                            </tbody>
                        </table>
                    </div>
                `;
            }

            // Daily Trends
            if (data.trends?.length > 0) {
                htmlContent += `
                    <div class="section">
                        <div class="section-title">Daily Patient Volume Trend</div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th style="text-align: right;">Patient Count</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                data.trends.forEach((trend: any) => {
                    htmlContent += `
                        <tr>
                            <td>${formatDate(trend.period_label)}</td>
                            <td style="text-align: right; font-weight: bold;">${trend.count}</td>
                        </tr>
                    `;
                });
                
                htmlContent += `
                            </tbody>
                        </table>
                    </div>
                `;
            }

        } else if (activeTab === 'branch') {
            htmlContent += `
                <div class="section">
                    <table>
                        <thead>
                            <tr>
                                <th>Branch Name</th>
                                <th>Location</th>
                                <th style="text-align: right;">Total Visits</th>
                                <th style="text-align: right;">Revenue</th>
                                <th style="text-align: right;">Unique Patients</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            data?.forEach((branch: any) => {
                htmlContent += `
                    <tr>
                        <td>${branch.branch_name || 'N/A'}</td>
                        <td>${branch.location || 'N/A'}</td>
                        <td style="text-align: right;">${branch.total_visits || 0}</td>
                        <td style="text-align: right; font-weight: bold; color: #059669;">${formatCurrency(branch.revenue || 0)}</td>
                        <td style="text-align: right;">${branch.unique_patients || 0}</td>
                    </tr>
                `;
            });
            
            htmlContent += `
                        </tbody>
                    </table>
                </div>
            `;

        } else if (['doctor', 'nurse', 'receptionist'].includes(activeTab)) {
            const staffType = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
            htmlContent += `
                <div class="section">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Branch</th>
                                <th>Specialization/Role</th>
                                <th style="text-align: right;">Patients Handled</th>
                                <th style="text-align: right;">Revenue Generated</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            data?.forEach((staff: any) => {
                htmlContent += `
                    <tr>
                        <td>${staff.first_name || ''} ${staff.last_name || ''}</td>
                        <td>${staff.branch_name || 'N/A'}</td>
                        <td>${staff.specialization || staff.role || 'N/A'}</td>
                        <td style="text-align: right;">${staff.patient_count || 0}</td>
                        <td style="text-align: right; font-weight: bold; color: #059669;">${formatCurrency(staff.revenue_generated || 0)}</td>
                    </tr>
                `;
            });
            
            htmlContent += `
                        </tbody>
                    </table>
                </div>
            `;
        }

        htmlContent += `
                <div class="footer">
                    <p>Generated on ${new Date().toLocaleString()} | Care24 Medical Centre & Hospital</p>
                    <p>This is a computer-generated report and does not require a signature.</p>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Wait for content to load, then print
        printWindow.onload = () => {
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                // Don't close automatically - let user close after printing/saving
            }, 250);
        };

        console.log('✅ PDF report window opened');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleApplyFilter();
        }
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
                        onKeyPress={handleKeyPress}
                        className="bg-white/80 border-none rounded-lg text-slate-700 font-semibold focus:ring-2 focus:ring-blue-500/20 shadow-inner px-3 py-1.5 text-sm"
                    />
                    <span className="text-slate-300">|</span>
                    <input
                        type="date"
                        name="endDate"
                        value={dateRange.endDate}
                        onChange={handleDateChange}
                        onKeyPress={handleKeyPress}
                        className="bg-white/80 border-none rounded-lg text-slate-700 font-semibold focus:ring-2 focus:ring-blue-500/20 shadow-inner px-3 py-1.5 text-sm"
                    />
                    <button 
                        onClick={handleApplyFilter} 
                        disabled={loading}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed relative group" 
                        title="Apply Filters"
                    >
                        <Filter className="w-4 h-4" />
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                            Click to apply
                        </span>
                    </button>
                    <button 
                        onClick={handleExportPDF}
                        disabled={loading || !data}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed group relative" 
                        title="Generate PDF Report"
                    >
                        <FileText className="w-4 h-4" />
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                            Export PDF
                        </span>
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
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-4">
                        <strong>Error:</strong> {error}
                    </div>
                )}
                
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="text-slate-500 text-sm">Loading {activeTab} reports...</p>
                        <p className="text-slate-400 text-xs">
                            {dateRange.startDate} to {dateRange.endDate}
                        </p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'overview' && data && (
                            <OverviewPerformance data={data} />
                        )}

                        {activeTab === 'branch' && data && <BranchPerformance data={data} />}

                        {['doctor', 'nurse', 'receptionist'].includes(activeTab) && data && (
                            <StaffPerformance data={data} type={activeTab.toUpperCase() as any} />
                        )}
                        
                        {!data && !loading && !error && (
                            <div className="flex flex-col items-center justify-center h-64 gap-4">
                                <p className="text-slate-400">No data available</p>
                            </div>
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