'use client';

import { useState, useEffect } from 'react';
import { Users, FileText, Percent, Search, Save, X, Plus } from 'lucide-react';
import { getReferralDoctorsWithPercentages, getHospitalServices } from '@/lib/api/accounts';
import { upsertServicePercentage } from '@/lib/api/accounts';
import { ReferralDoctor, HospitalService } from '@/types/accounts';

export default function AccountsDashboard() {
    const [doctors, setDoctors] = useState<ReferralDoctor[]>([]);
    const [services, setServices] = useState<HospitalService[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState<ReferralDoctor | null>(null);
    const [editingServices, setEditingServices] = useState<{ [key: string]: any }>({});
    const [saving, setSaving] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [showAddServiceDropdown, setShowAddServiceDropdown] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [doctorsRes, servicesRes] = await Promise.all([
                getReferralDoctorsWithPercentages(),
                getHospitalServices()
            ]);

            if (doctorsRes.success) setDoctors(doctorsRes.data);
            if (servicesRes.success) setServices(servicesRes.data);
        } catch (error: any) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleServiceChange = (serviceType: string, field: string, value: any) => {
        setEditingServices(prev => ({
            ...prev,
            [serviceType]: {
                ...prev[serviceType],
                [field]: value
            }
        }));
    };

    const handleSaveAllServices = async () => {
        if (!selectedDoctor) return;

        try {
            setSaving(true);

            const savePromises = (Array.isArray(selectedDoctor.percentages) ? selectedDoctor.percentages : []).map(async (percentage) => {
                const editedData = editingServices[percentage.service_type] || {};

                if (Object.keys(editedData).length === 0) return;

                const dataToSave = {
                    referral_doctor_id: selectedDoctor.id,
                    service_type: percentage.service_type,
                    cash_percentage: editedData.cash_percentage !== undefined ? parseFloat(editedData.cash_percentage) : percentage.cash_percentage,
                    inpatient_percentage: editedData.inpatient_percentage !== undefined ? parseFloat(editedData.inpatient_percentage) : percentage.inpatient_percentage,
                    referral_pay: editedData.referral_pay !== undefined ? editedData.referral_pay : percentage.referral_pay,
                    status: 'Active'
                };

                return upsertServicePercentage(dataToSave);
            });

            await Promise.all(savePromises);
            await fetchData();
            setEditingServices({});
            alert('All changes saved successfully!');
        } catch (error: any) {
            console.error('Error saving:', error);
            alert('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const handleAddService = async (serviceType: string) => {
        if (!selectedDoctor) return;

        try {
            const dataToSave = {
                referral_doctor_id: selectedDoctor.id,
                service_type: serviceType,
                cash_percentage: 0,
                inpatient_percentage: 0,
                referral_pay: 'N',
                status: 'Active'
            };

            await upsertServicePercentage(dataToSave);
            await fetchData();
            setShowAddServiceDropdown(false);

            const updatedDoctors = await getReferralDoctorsWithPercentages();
            if (updatedDoctors.success) {
                const updatedDoctor = updatedDoctors.data.find((d: ReferralDoctor) => d.id === selectedDoctor.id);
                if (updatedDoctor) setSelectedDoctor(updatedDoctor);
            }
        } catch (error: any) {
            console.error('Error adding service:', error);
            alert('Failed to add service');
        }
    };

    const hasChanges = Object.keys(editingServices).length > 0;

    const filteredDoctors = doctors.filter(doctor => {
        const matchesSearch = doctor.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doctor.speciality_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doctor.mobile_number.includes(searchTerm);

        const matchesFilter = filterStatus === 'all' || doctor.status === filterStatus;

        return matchesSearch && matchesFilter;
    });

    const stats = [
        { title: 'Total Referral Doctors', value: doctors.length, color: 'blue', icon: Users },
        { title: 'Active Services', value: services.length, color: 'green', icon: FileText },
        { title: 'Configured Percentages', value: doctors.reduce((sum, d) => sum + (Array.isArray(d.percentages) ? d.percentages.length : 0), 0), color: 'purple', icon: Percent },
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    const colorClasses = {
                        blue: 'bg-blue-500',
                        green: 'bg-green-500',
                        purple: 'bg-purple-500',
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

            {/* Main Content Area */}
            <div className="space-y-6">

                {/* Search and Filter Section */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search doctors by name, speciality or mobile..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                    </div>
                    <div className="w-full md:w-auto">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                            <option value="all">All Doctors</option>
                            <option value="Active">Active Only</option>
                            <option value="Inactive">Inactive Only</option>
                        </select>
                    </div>
                </div>

                {/* Doctors Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                        <h2 className="text-lg font-semibold text-gray-900">Referral Doctors Directory</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Speciality</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services Configured</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredDoctors.length > 0 ? (
                                    filteredDoctors.map((doctor) => (
                                        <tr
                                            key={doctor.id}
                                            onClick={() => setSelectedDoctor(doctor)}
                                            className={`cursor-pointer transition-colors ${selectedDoctor?.id === doctor.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{doctor.doctor_name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">{doctor.speciality_type}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">{doctor.mobile_number}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${doctor.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {doctor.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {Array.isArray(doctor.percentages) ? doctor.percentages.length : 0} services
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedDoctor(doctor);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900 font-medium"
                                                >
                                                    Manage
                                                </button>
                                            </td>
                                        </tr>
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

                {/* Selected Doctor Configuration Section */}
                {selectedDoctor && (
                    <div ref={(el) => { if (el && selectedDoctor) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-200 flex justify-between items-start bg-blue-50/30">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <Users className="w-5 h-5 text-blue-600" />
                                        Configuration: {selectedDoctor.doctor_name}
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Manage referral percentages and service settings for this doctor.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedDoctor(null)}
                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-gray-800">Service Percentages</h3>

                                    {/* Add Service Button */}
                                    {/* Add Service Button Section */}
                                    <div className="relative">
                                        {Array.isArray(selectedDoctor.percentages) && selectedDoctor.percentages.length > 0 && (
                                            <button
                                                onClick={() => setShowAddServiceDropdown(!showAddServiceDropdown)}
                                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Add New Service
                                            </button>
                                        )}

                                        {/* Dropdown */}
                                        {showAddServiceDropdown && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-10"
                                                    onClick={() => setShowAddServiceDropdown(false)}
                                                />
                                                <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-80 overflow-y-auto">
                                                    {services
                                                        .filter(service => Array.isArray(selectedDoctor.percentages) && !selectedDoctor.percentages.some(p => p.service_type === service.service_name))
                                                        .map((service) => (
                                                            <button
                                                                key={service.service_name}
                                                                onClick={() => handleAddService(service.service_name)}
                                                                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition text-sm border-b border-gray-100 last:border-b-0 flex justify-between items-center group"
                                                            >
                                                                <span className="font-medium text-gray-900 group-hover:text-blue-700">{service.service_name}</span>
                                                                <Plus className="w-4 h-4 text-gray-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            </button>
                                                        ))
                                                    }

                                                    {services.filter(service => Array.isArray(selectedDoctor.percentages) && !selectedDoctor.percentages.some(p => p.service_type === service.service_name)).length === 0 && (
                                                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                                            All available services are already configured
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {Array.isArray(selectedDoctor.percentages) && selectedDoctor.percentages.length > 0 ? (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                            {selectedDoctor.percentages.map((percentage, idx) => {
                                                const editedData = editingServices[percentage.service_type] || {};
                                                const isReferralPay = editedData.referral_pay !== undefined
                                                    ? editedData.referral_pay === 'Y'
                                                    : percentage.referral_pay === 'Y';

                                                return (
                                                    <div key={idx} className="bg-white p-5 border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all duration-200">
                                                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                                                            <h4 className="font-bold text-gray-800">{percentage.service_type}</h4>
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isReferralPay ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                                <Percent className="w-4 h-4" />
                                                            </div>
                                                        </div>

                                                        {/* Referral Pay Toggle */}
                                                        <div className="mb-4">
                                                            <label className="flex items-center justify-between cursor-pointer group">
                                                                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">Referral Payout</span>
                                                                <div className="relative inline-flex items-center cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isReferralPay}
                                                                        onChange={(e) => handleServiceChange(percentage.service_type, 'referral_pay', e.target.checked ? 'Y' : 'N')}
                                                                        className="sr-only peer"
                                                                    />
                                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                                </div>
                                                            </label>
                                                        </div>

                                                        {/* Percentage Inputs */}
                                                        <div className={`space-y-4 transition-opacity duration-200 ${isReferralPay ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                                                            <div>
                                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                                    Cash Percentage
                                                                </label>
                                                                <div className="relative">
                                                                    <input
                                                                        type="number"
                                                                        value={editedData.cash_percentage !== undefined ? editedData.cash_percentage : percentage.cash_percentage}
                                                                        onChange={(e) => handleServiceChange(percentage.service_type, 'cash_percentage', e.target.value)}
                                                                        min="0"
                                                                        max="100"
                                                                        step="0.01"
                                                                        className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                                                                    />
                                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                                        <span className="text-gray-500 sm:text-sm">%</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                                    Insurance Percentage
                                                                </label>
                                                                <div className="relative">
                                                                    <input
                                                                        type="number"
                                                                        value={editedData.inpatient_percentage !== undefined ? editedData.inpatient_percentage : percentage.inpatient_percentage}
                                                                        onChange={(e) => handleServiceChange(percentage.service_type, 'inpatient_percentage', e.target.value)}
                                                                        min="0"
                                                                        max="100"
                                                                        step="0.01"
                                                                        className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                                                                    />
                                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                                        <span className="text-gray-500 sm:text-sm">%</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Action Bar */}
                                        <div className="sticky bottom-4 z-10 flex justify-end">
                                            <div className="bg-white p-2 rounded-xl shadow-lg border border-gray-200 inline-flex gap-3">
                                                <button
                                                    onClick={() => {
                                                        setSelectedDoctor(null);
                                                        setEditingServices({});
                                                    }}
                                                    className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleSaveAllServices}
                                                    disabled={!hasChanges || saving}
                                                    className="inline-flex items-center justify-center gap-2 px-8 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg disabled:shadow-none"
                                                >
                                                    {saving ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
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
                                    </>
                                ) : (
                                    <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900">No Services Configured</h3>
                                        <p className="text-gray-500 mb-6">Start by adding a service for this doctor.</p>
                                        <button
                                            onClick={() => setShowAddServiceDropdown(true)}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                                        >
                                            <Plus className="w-5 h-5" />
                                            Configure First Service
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
