'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users, Search, Save, X, Plus, Download, Upload,
    ArrowLeft, Check, AlertCircle, Loader2, FileSpreadsheet,
    Settings2, Percent, CheckCircle2, Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
    getReferralDoctorsWithPercentages,
    getHospitalServices,
    upsertServicePercentage
} from '@/lib/api/accounts';
import { ReferralDoctor, HospitalService, ServicePercentage } from '@/types/accounts';

export default function ReferralConfigPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const doctorId = parseInt(resolvedParams.id);

    // State
    const [doctor, setDoctor] = useState<ReferralDoctor | null>(null);
    const [allServices, setAllServices] = useState<HospitalService[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [editingConfigs, setEditingConfigs] = useState<Record<string, Partial<ServicePercentage>>>({});
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Load initial data
    useEffect(() => {
        fetchData();
    }, [doctorId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [doctorsRes, servicesRes] = await Promise.all([
                getReferralDoctorsWithPercentages(),
                getHospitalServices()
            ]);

            if (doctorsRes.success) {
                const currentDoctor = doctorsRes.data.find(d => d.id === doctorId);
                if (currentDoctor) {
                    setDoctor(currentDoctor);

                    // Initialize editing configs with existing values
                    const initialConfigs: Record<string, Partial<ServicePercentage>> = {};
                    const existingPercentages = Array.isArray(currentDoctor.percentages) ? currentDoctor.percentages : [];

                    existingPercentages.forEach(p => {
                        initialConfigs[p.service_type] = {
                            referral_pay: p.referral_pay,
                            cash_percentage: p.cash_percentage,
                            inpatient_percentage: p.inpatient_percentage
                        };
                    });
                    setEditingConfigs(initialConfigs);
                }
            }

            if (servicesRes.success) {
                setAllServices(servicesRes.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setMessage({ type: 'error', text: 'Failed to load configuration data' });
        } finally {
            setLoading(false);
        }
    };

    // Filter services based on search
    const filteredServices = allServices.filter(service =>
        service.service_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handle individual change
    const handleConfigChange = (serviceName: string, field: keyof ServicePercentage, value: any) => {
        setEditingConfigs(prev => ({
            ...prev,
            [serviceName]: {
                ...(prev[serviceName] || { referral_pay: 'N', cash_percentage: 0, inpatient_percentage: 0 }),
                [field]: value
            }
        }));
    };

    // Bulk Management
    const toggleServiceSelection = (serviceName: string) => {
        setSelectedServices(prev =>
            prev.includes(serviceName)
                ? prev.filter(s => s !== serviceName)
                : [...prev, serviceName]
        );
    };

    const toggleAllOnPage = (checked: boolean) => {
        if (checked) {
            const allVisible = filteredServices.map(s => s.service_name);
            setSelectedServices(prev => Array.from(new Set([...prev, ...allVisible])));
        } else {
            const allVisible = filteredServices.map(s => s.service_name);
            setSelectedServices(prev => prev.filter(s => !allVisible.includes(s)));
        }
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

    // Excel Support
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
        XLSX.writeFile(wb, `Referral_Config_${doctor?.doctor_name.replace(/\s+/g, '_')}.xlsx`);
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
                setMessage({ type: 'success', text: 'Excel data applied successfully! Don\'t forget to Save Changes.' });
            } catch (err) {
                console.error(err);
                setMessage({ type: 'error', text: 'Failed to parse Excel file. Please use the correct template.' });
            }
        };
        reader.readAsBinaryString(file);
    };

    // Save
    const handleSaveAll = async () => {
        if (!doctor) return;
        setSaving(true);
        setMessage(null);

        try {
            // Only save what's in editingConfigs (or all if we want to ensure all are updated)
            // But usually we only save what's "Active" or has values.
            // For now, let's save everything that exists in editingConfigs mapping
            const entries = Object.entries(editingConfigs);

            const promises = entries.map(([serviceName, config]) => {
                return upsertServicePercentage({
                    referral_doctor_id: doctorId,
                    service_type: serviceName,
                    referral_pay: config.referral_pay || 'N',
                    cash_percentage: config.cash_percentage || 0,
                    inpatient_percentage: config.inpatient_percentage || 0,
                    status: 'Active'
                });
            });

            await Promise.all(promises);
            setMessage({ type: 'success', text: 'All configurations saved successfully!' });
            fetchData(); // Refresh to ensure state is sync with backend
        } catch (error) {
            console.error('Error saving:', error);
            setMessage({ type: 'error', text: 'Failed to save changes. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Loading doctor configuration...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Directory
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Manage Services: {doctor?.doctor_name}</h1>
                            <p className="text-sm text-gray-500">{doctor?.speciality_type} • {doctor?.clinic_name}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleDownloadTemplate}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition shadow-sm font-medium"
                    >
                        <Download className="w-4 h-4 text-gray-400" />
                        Download Template
                    </button>
                    <div className="relative">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleFileUpload}
                            title="Upload Excel"
                        />
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition shadow-sm font-medium">
                            <Upload className="w-4 h-4 text-gray-400" />
                            Upload Excel
                        </button>
                    </div>
                </div>
            </div>

            {/* Notification */}
            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="text-sm font-medium">{message.text}</span>
                    <button onClick={() => setMessage(null)} className="ml-auto text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Controls Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search services..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                    />
                </div>

                {selectedServices.length > 0 && (
                    <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 animate-in zoom-in-95">
                        <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">{selectedServices.length} Selected</span>
                        <div className="h-4 w-px bg-blue-200" />
                        <button
                            onClick={() => handleBulkAction('enable')}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                        >
                            Enable Payout
                        </button>
                        <button
                            onClick={() => handleBulkAction('disable')}
                            className="text-xs font-bold text-red-600 hover:text-red-800 transition"
                        >
                            Disable Payout
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Info className="w-3.5 h-3.5" />
                    Showing {filteredServices.length} of {allServices.length} services
                </div>
            </div>

            {/* Services Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 w-10">
                                    <input
                                        type="checkbox"
                                        checked={filteredServices.length > 0 && filteredServices.every(s => selectedServices.includes(s.service_name))}
                                        onChange={(e) => toggleAllOnPage(e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Service Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Referral Payout</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Cash %</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Insurance %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredServices.length > 0 ? (
                                filteredServices.map((service) => {
                                    const config = editingConfigs[service.service_name] || {};
                                    const isEnabled = config.referral_pay === 'Y';
                                    const isSelected = selectedServices.includes(service.service_name);

                                    return (
                                        <tr
                                            key={service.service_name}
                                            className={`group transition-colors ${isSelected ? 'bg-blue-50/30' : 'hover:bg-gray-50/50'}`}
                                        >
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleServiceSelection(service.service_name)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                                        <Settings2 className="w-5 h-5" />
                                                    </div>
                                                    <span className="font-semibold text-gray-900">{service.service_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={isEnabled}
                                                            onChange={(e) => handleConfigChange(service.service_name, 'referral_pay', e.target.checked ? 'Y' : 'N')}
                                                        />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                        <span className={`ml-3 text-sm font-medium ${isEnabled ? 'text-blue-600' : 'text-gray-500'}`}>
                                                            {isEnabled ? 'Enabled' : 'Disabled'}
                                                        </span>
                                                    </label>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="relative max-w-[120px]">
                                                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                    <input
                                                        type="number"
                                                        value={config.cash_percentage ?? 0}
                                                        onChange={(e) => handleConfigChange(service.service_name, 'cash_percentage', parseFloat(e.target.value) || 0)}
                                                        disabled={!isEnabled}
                                                        className={`w-full pl-4 pr-10 py-2 border rounded-xl text-sm transition-all ${isEnabled ? 'bg-white border-gray-200 focus:ring-2 focus:ring-blue-500' : 'bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed'
                                                            }`}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="relative max-w-[120px]">
                                                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                    <input
                                                        type="number"
                                                        value={config.inpatient_percentage ?? 0}
                                                        onChange={(e) => handleConfigChange(service.service_name, 'inpatient_percentage', parseFloat(e.target.value) || 0)}
                                                        disabled={!isEnabled}
                                                        className={`w-full pl-4 pr-10 py-2 border rounded-xl text-sm transition-all ${isEnabled ? 'bg-white border-gray-200 focus:ring-2 focus:ring-blue-500' : 'bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed'
                                                            }`}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <Search className="w-12 h-12 text-gray-200 mb-4" />
                                            <p className="text-gray-500 font-medium text-lg">No services found</p>
                                            <p className="text-gray-400 text-sm">Try adjusting your search query</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Sticky Actions Bar */}
            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white/80 backdrop-blur-md border-t border-gray-200 p-4 z-40">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="hidden md:block">
                        <p className="text-sm font-medium text-gray-500">
                            Configure percentages for <span className="text-gray-900 font-bold">{doctor?.doctor_name}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button
                            onClick={() => router.back()}
                            className="flex-1 md:flex-none px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveAll}
                            disabled={saving}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition transform active:scale-[0.98] disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
