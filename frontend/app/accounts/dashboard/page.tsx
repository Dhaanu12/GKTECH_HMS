'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, FileText, Percent, Search, Save, X, Plus, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import { getReferralDoctorsWithPercentages, getHospitalServices } from '@/lib/api/accounts';
import { upsertServicePercentage } from '@/lib/api/accounts';
import { ReferralDoctor, HospitalService } from '@/types/accounts';

export default function AccountsDashboard() {
    const router = useRouter();
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

            // Refresh data and update selectedDoctor with fresh data
            const updatedDoctors = await getReferralDoctorsWithPercentages();
            if (updatedDoctors.success) {
                setDoctors(updatedDoctors.data);
                // Update selectedDoctor with fresh data to show saved percentages immediately
                const updatedDoctor = updatedDoctors.data.find((d: ReferralDoctor) => d.id === selectedDoctor.id);
                if (updatedDoctor) setSelectedDoctor(updatedDoctor);
            }

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
                                        <React.Fragment key={doctor.id}>
                                            <tr
                                                onClick={() => setSelectedDoctor(selectedDoctor?.id === doctor.id ? null : doctor)}
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
                                                            router.push(`/accounts/referrals/${doctor.id}`);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-900 font-medium inline-flex items-center gap-1"
                                                    >
                                                        Manage
                                                        <ExternalLink className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
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
            </div>
        </div>
    );
}
