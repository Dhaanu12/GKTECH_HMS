'use client';

import React, { useState, useEffect } from 'react';
import {
    Users, FileSpreadsheet, Search, Save, X, Plus, Check, ArrowRight,
    Download, Upload, Percent, ChevronDown, ChevronRight, Loader2,
    Settings2, CheckCircle2, AlertCircle, Info, Hospital, Phone
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
    getReferralDoctorsWithPercentages,
    getHospitalServices,
    upsertServicePercentage,
    bulkInsertServicePercentages
} from '@/lib/api/accounts';
import { ReferralDoctor, HospitalService, ServicePercentage } from '@/types/accounts';

type TabType = 'individual' | 'bulk';

export default function ReferralConfigHub() {
    const [activeTab, setActiveTab] = useState<TabType>('individual');
    const [doctors, setDoctors] = useState<ReferralDoctor[]>([]);
    const [services, setServices] = useState<HospitalService[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async (silent?: boolean) => {
        if (!silent) setLoading(true);
        try {
            const [doctorsRes, servicesRes] = await Promise.all([
                getReferralDoctorsWithPercentages(),
                getHospitalServices()
            ]);

            if (doctorsRes.success) setDoctors(doctorsRes.data);
            if (servicesRes.success) setServices(servicesRes.data);
        } catch (error: any) {
            console.error('Error fetching data:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const tabs = [
        { id: 'individual' as TabType, name: 'Individual Setup', icon: Users, description: 'Manage doctor percentages one by one' },
        { id: 'bulk' as TabType, name: 'Bulk Setup', icon: FileSpreadsheet, description: 'Configure multiple doctors at once' },
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
                <div className="grid grid-cols-2 gap-0 border-b border-gray-200">
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

    const filteredDoctors = doctors.filter(doctor => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = (doctor.doctor_name || '').toLowerCase().includes(term) ||
            (doctor.speciality_type || '').toLowerCase().includes(term) ||
            (doctor.mobile_number || '').includes(searchTerm) ||
            (doctor.clinic_name || '').toLowerCase().includes(term);
        const matchesFilter = filterStatus === 'all' || doctor.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-4">
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                <div className="flex items-center gap-3">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50"
                    >
                        <option value="all">All Doctors</option>
                        <option value="Active">Active Only</option>
                        <option value="Inactive">Inactive Only</option>
                    </select>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" />
                        {filteredDoctors.length} doctors
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
                                                {Array.isArray(doctor.percentages) ? doctor.percentages.length : 0} configured
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
function DoctorInlineConfig({ doctor, allServices, onSave }: { doctor: ReferralDoctor, allServices: HospitalService[], onSave: () => void }) {
    const [editingConfigs, setEditingConfigs] = useState<Record<string, Partial<ServicePercentage>>>({});
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedServices, setSelectedServices] = useState<string[]>([]);

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
            const promises = entries.map(([serviceName, config]) => {
                return upsertServicePercentage({
                    referral_doctor_id: doctor.id,
                    service_type: serviceName,
                    referral_pay: config.referral_pay || 'N',
                    cash_percentage: config.cash_percentage || 0,
                    inpatient_percentage: config.inpatient_percentage || 0,
                    status: 'Active'
                });
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
        const data = allServices.map(s => {
            const config = editingConfigs[s.service_name] || {};
            return {
                'Service Name': s.service_name,
                'Referral Payout (Y/N)': config.referral_pay || 'N',
                'Cash Percentage (%)': config.cash_percentage || 0,
                'Insurance Percentage (%)': config.inpatient_percentage || 0
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Service Percentages");
        XLSX.writeFile(wb, `Referral_Config_${doctor.doctor_name.replace(/\s+/g, '_')}.xlsx`);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const bstr = event.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                const newConfigs = { ...editingConfigs };
                data.forEach((row: any) => {
                    const serviceName = row['Service Name'];
                    if (serviceName) {
                        newConfigs[serviceName] = {
                            referral_pay: (row['Referral Payout (Y/N)'] || 'N').toString().toUpperCase() === 'Y' ? 'Y' : 'N',
                            cash_percentage: parseFloat(row['Cash Percentage (%)'] || 0),
                            inpatient_percentage: parseFloat(row['Insurance Percentage (%)'] || 0)
                        };
                    }
                });

                setEditingConfigs(newConfigs);
                setMessage({ type: 'success', text: 'Excel data applied successfully! Click Save to persist changes.' });
            } catch (err) {
                console.error(err);
                setMessage({ type: 'error', text: 'Failed to parse Excel file. Please use the correct template.' });
            }
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="bg-gradient-to-b from-blue-50/50 to-white border-t border-blue-100 p-6 animate-in slide-in-from-top-2">
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
                            accept=".xlsx, .xls"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleFileUpload}
                            title="Upload Excel"
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
                    <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
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
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Get doctors without percentages
    const doctorsWithoutPercentages = doctors.filter(d => {
        if (!d.percentages) return true;
        if (Array.isArray(d.percentages) && d.percentages.length === 0) return true;
        if (typeof d.percentages === 'string' && (d.percentages === '[]' || d.percentages === '')) return true;
        return false;
    });

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
                    <h3 className="text-lg font-semibold mb-4">Step 1: Select Doctors</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Showing {doctorsWithoutPercentages.length} doctors without service configurations
                    </p>

                    <div className="space-y-2 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-4">
                        <label className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded cursor-pointer border-b border-gray-100">
                            <input
                                type="checkbox"
                                checked={selectedDoctors.length === doctorsWithoutPercentages.length && doctorsWithoutPercentages.length > 0}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedDoctors(doctorsWithoutPercentages.map(d => d.id));
                                    } else {
                                        setSelectedDoctors([]);
                                    }
                                }}
                                className="w-5 h-5 text-blue-600 rounded"
                            />
                            <span className="font-semibold">Select All ({doctorsWithoutPercentages.length})</span>
                        </label>

                        {doctorsWithoutPercentages.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">All doctors already have configurations</p>
                        ) : (
                            doctorsWithoutPercentages.map((doctor) => (
                                <label key={doctor.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedDoctors.includes(doctor.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedDoctors([...selectedDoctors, doctor.id]);
                                            } else {
                                                setSelectedDoctors(selectedDoctors.filter(id => id !== doctor.id));
                                            }
                                        }}
                                        className="w-5 h-5 text-blue-600 rounded mt-1"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{doctor.doctor_name}</p>
                                        <p className="text-sm text-gray-500">{doctor.speciality_type} • {doctor.mobile_number}</p>
                                    </div>
                                </label>
                            ))
                        )}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={() => setStep(2)}
                            disabled={selectedDoctors.length === 0}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-medium"
                        >
                            Next <ArrowRight className="w-4 h-4" />
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
