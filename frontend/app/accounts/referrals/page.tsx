'use client';

import React, { useState, useEffect } from 'react';
import {
    Users, FileSpreadsheet, Search, Save, X, Plus, Check, ArrowRight,
    Download, Upload, Percent, ChevronDown, ChevronRight, Loader2,
    Settings2, CheckCircle2, AlertCircle, Info, Hospital, Phone,
    User, ArrowUpNarrowWide, ArrowDownWideNarrow
} from 'lucide-react';
// CSV helpers (replaces xlsx to avoid security vulnerabilities)
import {
    getReferralDoctorsWithPercentages,
    getHospitalServices,
    upsertServicePercentage,
    bulkInsertServicePercentages,
    exportDoctorConfigs,
    importCSV
} from '@/lib/api/accounts';
import { ReferralDoctor, HospitalService, ServicePercentage } from '@/types/accounts';
import { ReferralAgent } from '@/types/marketing';
import { getReferralAgents, updateReferralAgent, bulkUpdateReferralAgents } from '@/lib/api/marketing';

type TabType = 'individual' | 'bulk' | 'agents';

export default function ReferralConfigHub() {
    const [activeTab, setActiveTab] = useState<TabType>('individual');
    const [doctors, setDoctors] = useState<ReferralDoctor[]>([]);
    const [services, setServices] = useState<HospitalService[]>([]);
    const [agents, setAgents] = useState<ReferralAgent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async (silent?: boolean) => {
        if (!silent) setLoading(true);
        try {
            const [doctorsRes, servicesRes, agentsRes] = await Promise.all([
                getReferralDoctorsWithPercentages(),
                getHospitalServices(),
                getReferralAgents()
            ]);

            if (doctorsRes.success) setDoctors(doctorsRes.data);
            if (servicesRes.success) setServices(servicesRes.data);
            if (agentsRes && agentsRes.success) setAgents(agentsRes.data);
        } catch (error: any) {
            console.error('Error fetching data:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const tabs = [
        { id: 'individual' as TabType, name: 'Doctors (Individual)', icon: Users, description: 'Manage doctor percentages one by one' },
        { id: 'bulk' as TabType, name: 'Doctors (Bulk)', icon: FileSpreadsheet, description: 'Configure multiple doctors at once' },
        { id: 'agents' as TabType, name: 'Agents', icon: User, description: 'Manage referral agent commissions' },
    ];

    // Stats - compute unique hospitals
    const uniqueHospitals = new Set(doctors.map(d => d.clinic_name).filter(Boolean));

    const stats = [
        { title: 'Total Referral Doctors', value: doctors.length, color: 'blue', icon: Users },
        { title: 'Active Services', value: services.length, color: 'green', icon: Settings2 },
        { title: 'Referring Hospitals', value: uniqueHospitals.size, color: 'purple', icon: Hospital },
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading configuration...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <Settings2 className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Referral Configuration</h1>
                    <p className="text-sm text-gray-500 font-medium">Manage service percentages for referral doctors</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    const colorClasses: Record<string, string> = {
                        blue: 'bg-blue-500',
                        green: 'bg-green-500',
                        purple: 'bg-purple-500',
                    };

                    return (
                        <div key={stat.title} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex items-center gap-4">
                            <div className={`w-12 h-12 ${colorClasses[stat.color]} rounded-xl flex items-center justify-center`}>
                                <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{stat.title}</h4>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-3 gap-0 border-b border-gray-200">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`p-5 text-left transition-colors border-b-2 ${activeTab === tab.id
                                    ? 'border-blue-600 bg-blue-50/50'
                                    : 'border-transparent hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-1">
                                    <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                                    <h3 className={`font-semibold ${activeTab === tab.id ? 'text-blue-900' : 'text-gray-700'}`}>
                                        {tab.name}
                                    </h3>
                                </div>
                                <p className="text-xs text-gray-500 ml-8">{tab.description}</p>
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'individual' && (
                        <IndividualSetup doctors={doctors} services={services} onUpdate={() => fetchData(true)} />
                    )}
                    {activeTab === 'bulk' && (
                        <BulkSetupWizard doctors={doctors} services={services} onSuccess={() => fetchData(true)} />
                    )}
                    {activeTab === 'agents' && (
                        <AgentSetup agents={agents} onUpdate={() => fetchData(true)} />
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================
// Individual Setup Component with Inline Expansion
// ============================================
function IndividualSetup({ doctors, services, onUpdate }: { doctors: ReferralDoctor[], services: HospitalService[], onUpdate: () => void }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [expandedDoctorId, setExpandedDoctorId] = useState<number | null>(null);

    // Sorting State
    const [sortType, setSortType] = useState<'alphabetical' | 'recent' | 'services'>('recent');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const filteredDoctors = doctors.filter(doctor => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = (doctor.doctor_name || '').toLowerCase().includes(term) ||
            (doctor.speciality_type || '').toLowerCase().includes(term) ||
            (doctor.mobile_number || '').includes(searchTerm) ||
            (doctor.clinic_name || '').toLowerCase().includes(term);
        const matchesFilter = filterStatus === 'all' || doctor.status === filterStatus;
        return matchesSearch && matchesFilter;
    }).sort((a, b) => {
        let comparison = 0;
        switch (sortType) {
            case 'alphabetical':
                comparison = a.doctor_name.localeCompare(b.doctor_name);
                break;
            case 'recent':
                // Fallback to 0 if created_at is missing (though it should be there)
                const dateA = new Date(a.created_at || 0).getTime();
                const dateB = new Date(b.created_at || 0).getTime();
                comparison = dateA - dateB;
                break;
            case 'services':
                const lenA = Array.isArray(a.percentages) ? a.percentages.length : 0;
                const lenB = Array.isArray(b.percentages) ? b.percentages.length : 0;
                comparison = lenA - lenB;
                break;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
    });

    const toggleSortOrder = () => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');

    return (
        <div className="space-y-4">
            {/* Search, Filter, and Sort */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by doctor, clinic, speciality, phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-all"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500 hidden sm:inline">Status:</span>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50"
                        >
                            <option value="all">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Pending">Pending</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>

                    {/* Sort Controls */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500 hidden sm:inline">Sort by:</span>
                        <select
                            value={sortType}
                            onChange={(e) => setSortType(e.target.value as any)}
                            className="px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50"
                        >
                            <option value="recent">Recently Added</option>
                            <option value="alphabetical">Alphabetical (A-Z)</option>
                            <option value="services">No. of Services</option>
                        </select>

                        <button
                            onClick={toggleSortOrder}
                            className="p-2.5 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
                            title={sortOrder === 'asc' ? "Ascending" : "Descending"}
                        >
                            {sortOrder === 'asc' ? <ArrowUpNarrowWide className="w-5 h-5" /> : <ArrowDownWideNarrow className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className="text-xs text-gray-500 flex items-center gap-1 font-medium bg-gray-100 px-3 py-2.5 rounded-xl whitespace-nowrap">
                        <User className="w-3.5 h-3.5" />
                        {filteredDoctors.length}
                    </div>
                </div>
            </div>

            {/* Doctors Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Doctor Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Hospital</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Speciality</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mobile</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Services</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {filteredDoctors.length > 0 ? (
                            filteredDoctors.map((doctor) => (
                                <React.Fragment key={doctor.id}>
                                    <tr
                                        className={`cursor-pointer transition-colors ${expandedDoctorId === doctor.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                        onClick={() => setExpandedDoctorId(expandedDoctorId === doctor.id ? null : doctor.id)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1.5 rounded-lg ${expandedDoctorId === doctor.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                                    {expandedDoctorId === doctor.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                </div>
                                                <div className="text-sm font-semibold text-gray-900">{doctor.doctor_name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            <div className="flex items-center gap-1.5">
                                                <Hospital className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="truncate max-w-[150px]" title={doctor.clinic_name}>{doctor.clinic_name || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{doctor.speciality_type}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{doctor.mobile_number}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${doctor.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {doctor.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-medium text-gray-600">
                                                {Array.isArray(doctor.percentages) ? doctor.percentages.filter((p: any) => p.referral_pay === 'Y').length : 0} active
                                            </span>
                                        </td>
                                    </tr>

                                    {/* Inline Expansion */}
                                    {expandedDoctorId === doctor.id && (
                                        <tr>
                                            <td colSpan={6} className="p-0">
                                                <DoctorInlineConfig
                                                    doctor={doctor}
                                                    allServices={services}
                                                    onSave={onUpdate}
                                                />
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    No doctors found matching your criteria
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ============================================
// Inline Doctor Config Component
// ============================================
// ============================================
// Inline Doctor Config Component
// ============================================
function DoctorInlineConfig({ doctor, allServices, onSave }: { doctor: ReferralDoctor, allServices: HospitalService[], onSave: () => void }) {
    const [editingConfigs, setEditingConfigs] = useState<Record<string, Partial<ServicePercentage>>>({});
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedServices, setSelectedServices] = useState<string[]>([]);

    // Upload Confirmation State
    const [showUploadConfirm, setShowUploadConfirm] = useState(false);
    const [pendingConfigs, setPendingConfigs] = useState<Record<string, Partial<ServicePercentage>>>({});
    const [uploadStats, setUploadStats] = useState({ total: 0, enabled: 0 });

    // Initialize editing configs
    useEffect(() => {
        const initialConfigs: Record<string, Partial<ServicePercentage>> = {};
        const existingPercentages = Array.isArray(doctor.percentages) ? doctor.percentages : [];
        existingPercentages.forEach(p => {
            initialConfigs[p.service_type] = {
                referral_pay: p.referral_pay,
                cash_percentage: p.cash_percentage,
                inpatient_percentage: p.inpatient_percentage
            };
        });
        setEditingConfigs(initialConfigs);
    }, [doctor]);

    const filteredServices = allServices.filter(service =>
        service.service_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleConfigChange = (serviceName: string, field: keyof ServicePercentage, value: any) => {
        setEditingConfigs(prev => ({
            ...prev,
            [serviceName]: {
                ...(prev[serviceName] || { referral_pay: 'N', cash_percentage: 0, inpatient_percentage: 0 }),
                [field]: value
            }
        }));
    };

    const toggleServiceSelection = (serviceName: string) => {
        setSelectedServices(prev =>
            prev.includes(serviceName)
                ? prev.filter(s => s !== serviceName)
                : [...prev, serviceName]
        );
    };

    const handleBulkAction = (action: 'enable' | 'disable') => {
        const newConfigs = { ...editingConfigs };
        selectedServices.forEach(serviceName => {
            newConfigs[serviceName] = {
                ...(newConfigs[serviceName] || { cash_percentage: 0, inpatient_percentage: 0 }),
                referral_pay: action === 'enable' ? 'Y' : 'N'
            };
        });
        setEditingConfigs(newConfigs);
        setMessage({ type: 'success', text: `Bulk ${action}d ${selectedServices.length} services` });
        setSelectedServices([]);
    };

    const handleSaveAll = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const entries = Object.entries(editingConfigs);
            console.log('Saving configs:', entries);
            const promises = entries.map(([serviceName, config]) => {
                const payload = {
                    referral_doctor_id: doctor.id,
                    service_type: serviceName,
                    referral_pay: config.referral_pay || 'N',
                    cash_percentage: config.cash_percentage || 0,
                    inpatient_percentage: config.inpatient_percentage || 0,
                    status: 'Active'
                };
                console.log('Payload for service:', serviceName, payload);
                return upsertServicePercentage(payload);
            });

            await Promise.all(promises);
            setMessage({ type: 'success', text: 'All configurations saved successfully!' });
            onSave();
        } catch (error) {
            console.error('Error saving:', error);
            setMessage({ type: 'error', text: 'Failed to save changes. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadTemplate = () => {
        const headers = ['Service Name', 'Referral Payout (Y/N)', 'Cash Percentage (%)', 'Insurance Percentage (%)'];
        const rows = allServices.map(s => {
            const config = editingConfigs[s.service_name] || {};
            return [
                `"${s.service_name}"`,
                config.referral_pay || 'N',
                config.cash_percentage || 0,
                config.inpatient_percentage || 0
            ].join(',');
        });
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Referral_Config_${doctor.doctor_name.replace(/\s+/g, '_')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input so same file can be selected again if needed
        e.target.value = '';

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const lines = text.split(/\r?\n/).filter(l => l.trim());
                if (lines.length < 2) throw new Error('Empty file');
                const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());

                const newConfigs: Record<string, Partial<ServicePercentage>> = { ...editingConfigs };
                let enabledCount = 0;
                let touchedCount = 0;

                lines.slice(1).forEach(line => {
                    const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
                    const row: Record<string, string> = {};
                    headers.forEach((h, i) => row[h] = cols[i] || '');
                    const serviceName = row['Service Name'];
                    if (serviceName) {
                        const payout = (row['Referral Payout (Y/N)'] || 'N').toUpperCase() === 'Y' ? 'Y' : 'N';
                        newConfigs[serviceName] = {
                            referral_pay: payout,
                            cash_percentage: parseFloat(row['Cash Percentage (%)'] || '0'),
                            inpatient_percentage: parseFloat(row['Insurance Percentage (%)'] || '0')
                        };
                        touchedCount++;
                        if (payout === 'Y') enabledCount++;
                    }
                });

                setPendingConfigs(newConfigs);
                setUploadStats({ total: touchedCount, enabled: enabledCount });
                setShowUploadConfirm(true);

            } catch (err) {
                console.error(err);
                setMessage({ type: 'error', text: 'Failed to parse CSV file. Please use the correct template.' });
            }
        };
        reader.readAsText(file);
    };

    const confirmUpload = () => {
        setEditingConfigs(pendingConfigs);
        setShowUploadConfirm(false);
        setMessage({ type: 'success', text: `Applied config from CSV. ${uploadStats.enabled} services enabled for payout. Click Save to persist.` });
    };

    return (
        <div className="bg-gradient-to-b from-blue-50/50 to-white border-t border-blue-100 p-6 animate-in slide-in-from-top-2 relative">

            {/* Confirmation Modal */}
            {showUploadConfirm && (
                <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center p-4 rounded-xl">
                    <div className="bg-white rounded-xl shadow-2xl border border-blue-100 p-6 max-w-sm w-full animate-in zoom-in-95">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Upload className="w-6 h-6" />
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 text-center mb-2">Confirm Upload</h4>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            You are about to update configurations for <span className="font-bold text-gray-800">{uploadStats.total}</span> services.
                            <br />
                            <span className="text-blue-600 font-semibold">{uploadStats.enabled} services</span> will have Payout enabled.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowUploadConfirm(false)}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmUpload}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition"
                            >
                                Apply Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header with actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Configure: {doctor.doctor_name}</h3>
                    <p className="text-sm text-gray-500">{doctor.speciality_type} • {doctor.clinic_name || 'No clinic'}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleDownloadTemplate}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                    >
                        <Download className="w-4 h-4" />
                        Download
                    </button>
                    <div className="relative">
                        <input
                            type="file"
                            accept=".csv"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleFileUpload}
                            title="Upload CSV"
                        />
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
                            <Upload className="w-4 h-4" />
                            Upload
                        </button>
                    </div>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-3 rounded-lg flex items-center gap-2 mb-4 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{message.text}</span>
                    <button onClick={() => setMessage(null)} className="ml-auto text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="relative max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search services..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {selectedServices.length > 0 && (
                    <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                        <span className="text-xs font-bold text-blue-700">{selectedServices.length} Selected</span>
                        <div className="h-4 w-px bg-blue-200" />
                        <button onClick={() => handleBulkAction('enable')} className="text-xs font-bold text-blue-600 hover:text-blue-800">
                            Enable
                        </button>
                        <button onClick={() => handleBulkAction('disable')} className="text-xs font-bold text-red-600 hover:text-red-800">
                            Disable
                        </button>
                    </div>
                )}
            </div>

            {/* Services Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-4 max-h-[400px] overflow-y-auto">
                <table className="w-full text-left">
                    <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                        <tr>
                            <th className="px-4 py-3 w-10">
                                <input
                                    type="checkbox"
                                    checked={filteredServices.length > 0 && filteredServices.every(s => selectedServices.includes(s.service_name))}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedServices(filteredServices.map(s => s.service_name));
                                        } else {
                                            setSelectedServices([]);
                                        }
                                    }}
                                    className="rounded border-gray-300 text-blue-600"
                                />
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Service</th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Payout</th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Cash %</th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Insurance %</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredServices.map((service) => {
                            const config = editingConfigs[service.service_name] || {};
                            const isEnabled = config.referral_pay === 'Y';
                            const isSelected = selectedServices.includes(service.service_name);

                            return (
                                <tr key={service.service_name} className={`${isSelected ? 'bg-blue-50/30' : 'hover:bg-gray-50/50'}`}>
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleServiceSelection(service.service_name)}
                                            className="rounded border-gray-300 text-blue-600"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                                <Settings2 className="w-4 h-4" />
                                            </div>
                                            <span className="font-medium text-gray-800 text-sm">{service.service_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={isEnabled}
                                                onChange={(e) => handleConfigChange(service.service_name, 'referral_pay', e.target.checked ? 'Y' : 'N')}
                                            />
                                            <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="relative max-w-[100px]">
                                            <input
                                                type="number"
                                                value={config.cash_percentage ?? 0}
                                                onChange={(e) => handleConfigChange(service.service_name, 'cash_percentage', parseFloat(e.target.value) || 0)}
                                                disabled={!isEnabled}
                                                className={`w-full px-3 py-1.5 border rounded-lg text-sm ${isEnabled ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed'}`}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="relative max-w-[100px]">
                                            <input
                                                type="number"
                                                value={config.inpatient_percentage ?? 0}
                                                onChange={(e) => handleConfigChange(service.service_name, 'inpatient_percentage', parseFloat(e.target.value) || 0)}
                                                disabled={!isEnabled}
                                                className={`w-full px-3 py-1.5 border rounded-lg text-sm ${isEnabled ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed'}`}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSaveAll}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save All Changes
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
// ============================================
// Bulk Setup Wizard Component
// ============================================
function BulkSetupWizard({ doctors, services, onSuccess }: { doctors: ReferralDoctor[], services: HospitalService[], onSuccess: () => void }) {
    const [step, setStep] = useState(1);
    const [selectedDoctors, setSelectedDoctors] = useState<number[]>([]);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [serviceConfigurations, setServiceConfigurations] = useState<Record<string, {
        referral_pay: string;
        cash_percentage: number | string;
        inpatient_percentage: number | string;
    }>>({});
    const [submitting, setSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Filter state
    const [viewFilter, setViewFilter] = useState<'all' | 'configured' | 'unconfigured'>('unconfigured');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Confirmation state
    const [importSummary, setImportSummary] = useState<{
        to_insert: number;
        to_update: number;
        unchanged: number;
        errors: number;
        details: any[];
    } | null>(null);
    const [pendingFileData, setPendingFileData] = useState<any[] | null>(null);

    // Filter doctors based on viewFilter
    const filteredDoctors = doctors.filter(d => {
        const hasConfig = d.percentages && Array.isArray(d.percentages) && d.percentages.length > 0;

        if (viewFilter === 'configured') return hasConfig;
        if (viewFilter === 'unconfigured') return !hasConfig;
        return true;
    });

    // Handle file upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setErrorMessage(null);
        setSuccessMessage(null);
        setImportSummary(null);

        try {
            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    const text = evt.target?.result as string;
                    const lines = text.split(/\r?\n/).filter(l => l.trim());
                    if (lines.length < 2) throw new Error('Empty file');
                    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());

                    const data = lines.slice(1).map(line => {
                        const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
                        const row: Record<string, string> = {};
                        headers.forEach((h, i) => row[h] = cols[i] || '');
                        return row;
                    });

                    // Map CSV columns to API expected format
                    const mappedData = data.map((row) => ({
                        doctor_id: parseInt(row['Doctor ID'], 10),
                        service_type: row['Service Type'],
                        referral_pay: row['Referral Pay (Y/N)'] === 'Y' ? 'Y' : 'N',
                        cash_percentage: parseFloat(row['Cash Percentage']) || 0,
                        inpatient_percentage: parseFloat(row['Insurance Percentage']) || 0
                    })).filter((item) => item.doctor_id && item.service_type);

                    if (mappedData.length === 0) {
                        throw new Error('No valid data found in file. Please check column headers.');
                    }

                    // 1. Dry Run
                    const dryRunResult = await importCSV(mappedData, true);

                    if (dryRunResult.success) {
                        setImportSummary(dryRunResult.summary);
                        setPendingFileData(mappedData);
                    }
                } catch (error: any) {
                    console.error('Error parsing/uploading file:', error);
                    setErrorMessage('Failed to upload: ' + error.message);
                } finally {
                    setIsUploading(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            };
            reader.readAsText(file);
        } catch (error: any) {
            setIsUploading(false);
            setErrorMessage('Error reading file');
        }
    };

    const confirmImport = async () => {
        if (!pendingFileData) return;

        setIsUploading(true);
        try {
            const result = await importCSV(pendingFileData, false);
            if (result.success) {
                setSuccessMessage(`Successfully imported ${result.data.inserted} configurations!`);
                setImportSummary(null);
                setPendingFileData(null);
                onSuccess(); // Refresh parent data
            }
        } catch (error: any) {
            setErrorMessage('Failed to confirm upload: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const cancelImport = () => {
        setImportSummary(null);
        setPendingFileData(null);
    };

    const handleDownload = async () => {
        try {
            setSuccessMessage('Downloading configuration...');
            const blob = await exportDoctorConfigs(viewFilter === 'all' ? undefined : viewFilter);

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `referral_configuration_${viewFilter}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setSuccessMessage(null);
        } catch (error: any) {
            console.error('Download error:', error);
            setErrorMessage('Failed to download configuration');
        }
    };

    const toggleService = (serviceName: string, isChecked: boolean) => {
        if (isChecked) {
            setSelectedServices(prev => [...prev, serviceName]);
            if (!serviceConfigurations[serviceName]) {
                setServiceConfigurations(prev => ({
                    ...prev,
                    [serviceName]: { referral_pay: 'Y', cash_percentage: '', inpatient_percentage: '' }
                }));
            }
        } else {
            setSelectedServices(prev => prev.filter(s => s !== serviceName));
        }
    };

    const toggleAllServices = (isChecked: boolean) => {
        if (isChecked) {
            const allNames = services.map(s => s.service_name);
            setSelectedServices(allNames);
            const newConfigs = { ...serviceConfigurations };
            allNames.forEach(name => {
                if (!newConfigs[name]) {
                    newConfigs[name] = { referral_pay: 'Y', cash_percentage: '', inpatient_percentage: '' };
                }
            });
            setServiceConfigurations(newConfigs);
        } else {
            setSelectedServices([]);
        }
    };

    const updateServiceConfig = (serviceName: string, field: string, value: any) => {
        setServiceConfigurations(prev => ({
            ...prev,
            [serviceName]: { ...prev[serviceName], [field]: value }
        }));
    };

    const handleSubmit = async () => {
        setErrorMessage(null);
        setSuccessMessage(null);
        try {
            setSubmitting(true);
            const servicesData = selectedServices.map(serviceName => ({
                service_type: serviceName,
                referral_pay: serviceConfigurations[serviceName].referral_pay,
                cash_percentage: typeof serviceConfigurations[serviceName].cash_percentage === 'string'
                    ? parseFloat(serviceConfigurations[serviceName].cash_percentage as string) || 0
                    : serviceConfigurations[serviceName].cash_percentage,
                inpatient_percentage: typeof serviceConfigurations[serviceName].inpatient_percentage === 'string'
                    ? parseFloat(serviceConfigurations[serviceName].inpatient_percentage as string) || 0
                    : serviceConfigurations[serviceName].inpatient_percentage
            }));

            const result = await bulkInsertServicePercentages({
                doctor_ids: selectedDoctors,
                services: servicesData
            });

            if (result.success) {
                setSuccessMessage(`Successfully created ${result.data.inserted} service configurations!`);
                setTimeout(() => {
                    setStep(1);
                    setSelectedDoctors([]);
                    setSelectedServices([]);
                    setServiceConfigurations({});
                    setSuccessMessage(null);
                    onSuccess();
                }, 2000);
            }
        } catch (error: any) {
            console.error('Bulk insert error:', error);
            setErrorMessage('Failed to create configurations: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            {/* Confirmation Dialog */}
            {importSummary && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
                        <h3 className="text-lg font-bold mb-4">Confirm Bulk Update</h3>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                                <span className="text-blue-700">Records to Update:</span>
                                <span className="font-bold text-blue-700">{importSummary.to_update}</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                                <span className="text-green-700">New Records to Insert:</span>
                                <span className="font-bold text-green-700">{importSummary.to_insert}</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span className="text-gray-600">Unchanged Records:</span>
                                <span className="font-bold text-gray-600">{importSummary.unchanged}</span>
                            </div>
                            {importSummary.errors > 0 && (
                                <div className="bg-red-50 rounded p-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-red-700 font-medium">Errors (will be skipped):</span>
                                        <span className="font-bold text-red-700">{importSummary.errors}</span>
                                    </div>
                                    <div className="text-xs text-red-600 max-h-32 overflow-y-auto space-y-1 pl-2 border-l-2 border-red-200">
                                        {importSummary.details.filter(d => d.error).slice(0, 5).map((detail, idx) => (
                                            <div key={idx}>
                                                Row {detail.row}: {detail.error}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Debug Info for Unchanged Rows */}
                            {importSummary.unchanged > 0 && (
                                <div className="bg-gray-50 rounded p-2 mt-2">
                                    <div className="text-xs font-semibold text-gray-500 mb-1">Debug Info (Unchanged Rows):</div>
                                    <div className="text-xs text-gray-500 max-h-32 overflow-y-auto space-y-1">
                                        {importSummary.details.filter(d => d.status === 'Unchanged').slice(0, 3).map((detail, idx) => (
                                            <div key={idx} className="border-b border-gray-100 pb-1 mb-1">
                                                <div className="font-medium">Row {detail.row} ({detail.diff?.service}):</div>
                                                <div className="grid grid-cols-2 gap-2 pl-2">
                                                    <div>
                                                        <span className="block text-[10px] uppercase">Current (DB):</span>
                                                        Cash: {detail.diff?.old?.cash}, Ins: {detail.diff?.old?.inpatient}, Pay: {detail.diff?.old?.pay}
                                                    </div>
                                                    <div>
                                                        <span className="block text-[10px] uppercase">New (Upload):</span>
                                                        Cash: {detail.diff?.new?.cash}, Ins: {detail.diff?.new?.inpatient}, Pay: {detail.diff?.new?.pay}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={cancelImport}
                                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmImport}
                                className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded flex items-center gap-2"
                                disabled={isUploading}
                            >
                                {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Confirm Update
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notifications */}
            {successMessage && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-md">
                    <div className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-400" />
                        <p className="text-sm text-green-700">{successMessage}</p>
                    </div>
                </div>
            )}

            {errorMessage && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
                    <div className="flex items-center gap-3">
                        <X className="h-5 w-5 text-red-400" />
                        <p className="text-sm text-red-700">{errorMessage}</p>
                    </div>
                </div>
            )}

            {/* Progress Steps */}
            <div className="flex items-center gap-4 mb-8">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                            {step > s ? <Check className="w-4 h-4" /> : s}
                        </div>
                        <span className={`text-sm font-medium ${step >= s ? 'text-gray-900' : 'text-gray-400'}`}>
                            {s === 1 ? 'Select Doctors' : s === 2 ? 'Configure Services' : 'Review'}
                        </span>
                        {s < 3 && <ArrowRight className="w-4 h-4 text-gray-300 ml-2" />}
                    </div>
                ))}
            </div>

            {step === 1 && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            {(['unconfigured', 'configured', 'all'] as const).map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setViewFilter(filter)}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${viewFilter === filter
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept=".csv,.xlsx,.xls"
                                className="hidden"
                            />
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                            >
                                <Download className="w-4 h-4" />
                                <span className="text-sm font-medium">Download</span>
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                <span className="text-sm font-medium">Upload Changes</span>
                            </button>
                        </div>
                    </div>

                    <p className="text-gray-500 mb-6">
                        Select doctors to configure manually, or download the configuration file to edit in Excel and upload changes.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 max-h-[500px] overflow-y-auto p-1">
                        {filteredDoctors.map((doc) => (
                            <div
                                key={doc.id}
                                onClick={() => {
                                    if (selectedDoctors.includes(doc.id!)) {
                                        setSelectedDoctors(prev => prev.filter(id => id !== doc.id));
                                    } else {
                                        setSelectedDoctors(prev => [...prev, doc.id!]);
                                    }
                                }}
                                className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedDoctors.includes(doc.id!)
                                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                    : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${selectedDoctors.includes(doc.id!) ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {selectedDoctors.includes(doc.id!) ? <CheckCircle2 className="w-6 h-6" /> : <User className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{doc.doctor_name}</p>
                                        <div className="flex flex-col gap-1 mt-1">
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Hospital className="w-3 h-3" />
                                                {doc.clinic_name || 'No Clinic'}
                                            </span>
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                {doc.mobile_number}
                                            </span>
                                            {doc.percentages && Array.isArray(doc.percentages) && doc.percentages.length > 0 ? (
                                                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                                                    {doc.percentages.filter((p: any) => p.referral_pay === 'Y').length} Active
                                                </span>
                                            ) : (
                                                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full w-fit">
                                                    Unconfigured
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center border-t pt-4">
                        <div className="text-sm text-gray-500">
                            {selectedDoctors.length} doctors selected
                        </div>
                        <button
                            onClick={() => setStep(2)}
                            disabled={selectedDoctors.length === 0}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next Step
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div>
                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800 font-medium">
                            <Users className="w-4 h-4 inline mr-2" />
                            {selectedDoctors.length} doctor(s) selected for configuration
                        </p>
                    </div>

                    <h3 className="text-lg font-semibold mb-4">Step 2: Select Services & Set Percentages</h3>

                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer border border-gray-200">
                            <input
                                type="checkbox"
                                checked={selectedServices.length === services.length && services.length > 0}
                                onChange={(e) => toggleAllServices(e.target.checked)}
                                className="w-5 h-5 text-blue-600 rounded"
                            />
                            <span className="font-semibold">Select All Services ({services.length})</span>
                        </label>

                        {services.map((service) => {
                            const isSelected = selectedServices.includes(service.service_name);
                            const config = serviceConfigurations[service.service_name] || {};
                            const referralPay = config.referral_pay || 'Y';

                            return (
                                <div
                                    key={service.service_name}
                                    className={`border rounded-lg transition-all ${isSelected ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200 hover:bg-gray-50'}`}
                                >
                                    <label className="flex items-center gap-3 p-4 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) => toggleService(service.service_name, e.target.checked)}
                                            className="w-5 h-5 text-blue-600 rounded"
                                        />
                                        <span className="font-medium text-gray-900">{service.service_name}</span>
                                    </label>

                                    {isSelected && (
                                        <div className="px-4 pb-4 pl-12 grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Referral Pay</label>
                                                <select
                                                    value={referralPay}
                                                    onChange={(e) => updateServiceConfig(service.service_name, 'referral_pay', e.target.value)}
                                                    className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-md"
                                                >
                                                    <option value="Y">Yes</option>
                                                    <option value="N">No</option>
                                                </select>
                                            </div>

                                            {referralPay === 'Y' && (
                                                <>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Cash %</label>
                                                        <input
                                                            type="number"
                                                            value={config.cash_percentage ?? ''}
                                                            onChange={(e) => updateServiceConfig(service.service_name, 'cash_percentage', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                            min="0"
                                                            max="100"
                                                            placeholder="0"
                                                            className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-md"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Insurance %</label>
                                                        <input
                                                            type="number"
                                                            value={config.inpatient_percentage ?? ''}
                                                            onChange={(e) => updateServiceConfig(service.service_name, 'inpatient_percentage', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                            min="0"
                                                            max="100"
                                                            placeholder="0"
                                                            className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-md"
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-6 flex justify-between">
                        <button
                            onClick={() => setStep(1)}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => setStep(3)}
                            disabled={selectedServices.length === 0}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            Review <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">Step 3: Review & Create</h3>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                        <h4 className="font-semibold text-blue-900 mb-4">Summary</h4>
                        <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Doctors:</span> {selectedDoctors.length}</p>
                            <p><span className="font-medium">Services:</span> {selectedServices.length}</p>
                            <p><span className="font-medium">Total Configurations:</span> {selectedDoctors.length * selectedServices.length}</p>

                            <div className="mt-4 pt-4 border-t border-blue-200">
                                <p className="font-medium mb-2">Services Preview:</p>
                                <div className="space-y-1 max-h-32 overflow-y-auto text-gray-600">
                                    {selectedServices.map(s => (
                                        <p key={s}>
                                            <span className="font-medium">{s}:</span>{' '}
                                            Cash {serviceConfigurations[s]?.cash_percentage ?? 0}%,{' '}
                                            Insurance {serviceConfigurations[s]?.inpatient_percentage ?? 0}%
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-between">
                        <button
                            onClick={() => setStep(2)}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold flex items-center gap-2 shadow-lg"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Check className="w-5 h-5" />
                                    Create Configurations
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================
// Agent Setup Component
// ============================================
// ============================================
// Agent Setup Component
// ============================================
function AgentSetup({ agents, onUpdate }: { agents: ReferralAgent[], onUpdate: () => void }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValues, setEditValues] = useState<{ patient: number, doc: number }>({ patient: 0, doc: 0 });
    const [saving, setSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const filteredAgents = agents.filter(agent =>
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (agent.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.mobile.includes(searchTerm)
    );

    const startEditing = (agent: ReferralAgent) => {
        setEditingId(agent.id);
        setEditValues({
            patient: typeof agent.referral_patient_commission === 'string' ? parseFloat(agent.referral_patient_commission) : (agent.referral_patient_commission || 0),
            doc: typeof agent.referral_doc_commission === 'string' ? parseFloat(agent.referral_doc_commission) : (agent.referral_doc_commission || 0)
        });
    };

    const cancelEditing = () => {
        setEditingId(null);
    };

    const saveAgent = async (id: number) => {
        setSaving(true);
        try {
            await updateReferralAgent(id, {
                referral_patient_commission: editValues.patient,
                referral_doc_commission: editValues.doc
            });
            onUpdate();
            setEditingId(null);
        } catch (error) {
            console.error('Failed to update agent commissions', error);
            alert('Failed to update. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadExcel = () => {
        const headers = ['Agent ID', 'Name', 'Mobile', 'Company', 'Patient Commission', 'Doctor Commission'];
        const rows = agents.map(agent => [
            agent.id,
            `"${agent.name}"`,
            agent.mobile,
            `"${agent.company || ''}"`,
            agent.referral_patient_commission || 0,
            agent.referral_doc_commission || 0
        ].join(','));
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Referral_Agents_Commission.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    const text = evt.target?.result as string;
                    const lines = text.split(/\r?\n/).filter(l => l.trim());
                    if (lines.length < 2) throw new Error('Empty file');
                    const csvHeaders = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());

                    const data = lines.slice(1).map(line => {
                        const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
                        const row: Record<string, string> = {};
                        csvHeaders.forEach((h, i) => row[h] = cols[i] || '');
                        return row;
                    });

                    const updates = data.map((row) => ({
                        id: parseInt(row['Agent ID'], 10),
                        referral_patient_commission: parseFloat(row['Patient Commission'] || '0'),
                        referral_doc_commission: parseFloat(row['Doctor Commission'] || '0')
                    })).filter((item) => item.id);

                    if (updates.length > 0) {
                        const response = await bulkUpdateReferralAgents(updates);
                        alert(`Process completed. Actually updated ${response.updatedCount} agents.`);
                        onUpdate();
                    } else {
                        alert('No valid data found in CSV.');
                    }
                } catch (error) {
                    console.error('Error processing CSV:', error);
                    alert('Failed to process CSV file.');
                } finally {
                    setIsUploading(false);
                    e.target.value = ''; // Reset input
                }
            };
            reader.readAsText(file);
        } catch (error) {
            console.error('Upload failed:', error);
            setIsUploading(false);
            e.target.value = '';
        }
    };

    return (
        <div className="space-y-4">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                {/* Search */}
                <div className="relative max-w-md flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search agents by name, company, mobile..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-all"
                    />
                </div>

                {/* Excel Actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleDownloadExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                    >
                        <Download className="w-4 h-4" />
                        Download Template
                    </button>
                    <div className="relative">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            className="absolute inset-0 cursor-pointer w-full h-full opacity-0 z-10"
                            onChange={handleUploadExcel}
                            disabled={isUploading}
                            title="Upload Excel"
                        />
                        <button
                            disabled={isUploading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
                        >
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {isUploading ? 'Uploading...' : 'Upload Excel'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Agents Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Agent Name</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mobile</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Created By</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Patient Commission (₹)</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Dr. Commission (₹)</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {filteredAgents.length > 0 ? (
                            filteredAgents.map((agent) => (
                                <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-900">{agent.name}</div>
                                        <div className="text-xs text-gray-500">{agent.role || 'Agent'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{agent.company || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{agent.mobile}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{agent.created_by_name || '—'}</td>

                                    {/* Inline Editing Fields */}
                                    {editingId === agent.id ? (
                                        <>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="number"
                                                    value={editValues.patient}
                                                    onChange={(e) => setEditValues({ ...editValues, patient: parseFloat(e.target.value) || 0 })}
                                                    className="w-24 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="number"
                                                    value={editValues.doc}
                                                    onChange={(e) => setEditValues({ ...editValues, doc: parseFloat(e.target.value) || 0 })}
                                                    className="w-24 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => saveAgent(agent.id)}
                                                        disabled={saving}
                                                        className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                                    >
                                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={cancelEditing}
                                                        disabled={saving}
                                                        className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                ₹ {agent.referral_patient_commission || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                ₹ {agent.referral_doc_commission || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button
                                                    onClick={() => startEditing(agent)}
                                                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                                >
                                                    Edit
                                                </button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                    No agents found matching your criteria
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
