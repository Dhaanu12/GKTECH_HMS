'use client';

import { useState, useEffect } from 'react';
import { Users, FileSpreadsheet, Plus, Download, Upload, Check, X, ArrowRight, Eye, Image as ImageIcon, Hospital, Phone } from 'lucide-react';
import {
    getReferralDoctorsWithPercentages,
    getHospitalServices,
    bulkInsertServicePercentages,
    exportCSVTemplate,
    importCSV
} from '@/lib/api/accounts';
import { ReferralDoctor, HospitalService } from '@/types/accounts';

type TabType = 'wizard' | 'csv';

export default function BulkSetupPage() {
    const [activeTab, setActiveTab] = useState<TabType>('wizard');
    const [doctors, setDoctors] = useState<ReferralDoctor[]>([]);
    const [services, setServices] = useState<HospitalService[]>([]);
    const [loading, setLoading] = useState(true);

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

    const tabs = [
        { id: 'wizard' as TabType, name: 'Add Percentage Setup', icon: Plus, description: 'Step-by-step addition of percentages' },
        // { id: 'csv' as TabType, name: 'CSV Import', icon: FileSpreadsheet, description: 'Upload spreadsheet' },
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <p className="text-lg font-bold text-gray-900">Create service percentages for multiple doctors efficiently</p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="grid grid-cols-2 gap-0 border-b border-gray-200">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`p-6 text-left transition-colors border-b-2 ${activeTab === tab.id
                                    ? 'border-blue-600 bg-blue-50'
                                    : 'border-transparent hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                                    <h3 className={`font-semibold ${activeTab === tab.id ? 'text-blue-900' : 'text-gray-700'}`}>
                                        {tab.name}
                                    </h3>
                                </div>
                                <p className="text-sm text-gray-600">{tab.description}</p>
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'wizard' && <TemplateWizard doctors={doctors} services={services} onSuccess={fetchData} />}
                    {/* {activeTab === 'csv' && <CSVImport onSuccess={fetchData} />} */}
                </div>
            </div>
        </div>
    );
}

// Template Wizard Component
function TemplateWizard({ doctors, services, onSuccess }: { doctors: ReferralDoctor[], services: HospitalService[], onSuccess: () => void }) {
    const [step, setStep] = useState(1);
    const [selectedDoctors, setSelectedDoctors] = useState<number[]>([]);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [serviceConfigurations, setServiceConfigurations] = useState<Record<string, {
        referral_pay: string;
        cash_percentage: number | string;
        inpatient_percentage: number | string;
    }>>({});
    const [submitting, setSubmitting] = useState(false);
    const [selectedPanImage, setSelectedPanImage] = useState<{ url: string; title: string; doctorName: string } | null>(null);

    // Notifications state
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Get doctors without percentages
    const doctorsWithoutPercentages = doctors.filter(d => {
        // Handle various empty states (null, undefined, empty array, string "[]")
        if (!d.percentages) return true;
        if (Array.isArray(d.percentages) && d.percentages.length === 0) return true;
        if (typeof d.percentages === 'string' && (d.percentages === '[]' || d.percentages === '')) return true;
        return false;
    });

    console.log('Doctors details for debugging:', {
        total: doctors.length,
        withoutPercentages: doctorsWithoutPercentages.length,
        firstDoctor: doctors[0]
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

    const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL?.replace('/api', '') || 'http://192.168.10.87:5000';

    return (
        <div>
            {/* Notifications */}
            {successMessage && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-md shadow-sm animate-in slide-in-from-top-2">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <Check className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-green-700">{successMessage}</p>
                        </div>
                    </div>
                </div>
            )}

            {errorMessage && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md shadow-sm animate-in slide-in-from-top-2">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <X className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{errorMessage}</p>
                        </div>
                    </div>
                </div>
            )}

            {step === 1 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">Step 1: Select Doctors</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Showing {doctorsWithoutPercentages.length} doctors without service configurations
                    </p>

                    <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
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
                                className="w-5 h-5 text-blue-600"
                            />
                            <span className="font-semibold">Select All ({doctorsWithoutPercentages.length})</span>
                        </label>

                        {doctorsWithoutPercentages.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">No doctors available for setup</p>
                        ) : (
                            doctorsWithoutPercentages.map((doctor) => (
                                <label key={doctor.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded cursor-pointer transition-colors group">
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
                                        className="w-5 h-5 text-blue-600 mt-1"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-gray-900">{doctor.doctor_name}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
                                            <span className="font-medium text-blue-600">{doctor.speciality_type}</span>
                                            <span>•</span>
                                            <span>{doctor.mobile_number}</span>
                                        </div>
                                    </div>
                                </label>
                            ))
                        )}
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={() => setStep(2)}
                            disabled={selectedDoctors.length === 0}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                        >
                            Next <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div>
                    {/* Selected Doctors Summary Panel */}
                    <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-gray-900">Selected Referral Doctors</h4>
                                <p className="text-sm text-gray-600">{selectedDoctors.length} doctor(s) selected for percentage setup</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {doctors
                                .filter(doc => selectedDoctors.includes(doc.id))
                                .map((doctor) => (
                                    <div
                                        key={doctor.id}
                                        className="bg-white rounded-lg p-4 border border-blue-100 hover:border-blue-300 transition-all shadow-sm hover:shadow-md"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="text-blue-700 font-bold text-sm">
                                                    {doctor.doctor_name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-bold text-gray-900 truncate">{doctor.doctor_name}</h5>
                                                <p className="text-xs text-blue-600 font-semibold mt-0.5">{doctor.speciality_type}</p>

                                                <div className="mt-2 space-y-1">
                                                    {doctor.medical_council_membership_number && (
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-700">
                                                            <span className="font-bold text-gray-600">Reg:</span>
                                                            <span className="font-mono font-semibold">{doctor.medical_council_membership_number}</span>
                                                        </div>
                                                    )}
                                                    {doctor.clinic_name && (
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-700">
                                                            <Hospital className="w-3.5 h-3.5 text-blue-600" />
                                                            <span className="truncate font-semibold">{doctor.clinic_name}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-700">
                                                        <Phone className="w-3.5 h-3.5 text-blue-600" />
                                                        <span className="font-semibold">{doctor.mobile_number}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    <h3 className="text-lg font-semibold mb-4">Step 2: Select Services & Set Percentages</h3>

                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer border border-gray-200">
                            <input
                                type="checkbox"
                                checked={selectedServices.length === services.length && services.length > 0}
                                onChange={(e) => toggleAllServices(e.target.checked)}
                                className="w-5 h-5 text-blue-600"
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
                                            className="w-5 h-5 text-blue-600 mt-1 self-start"
                                        />
                                        <div className="flex-1">
                                            <span className="font-medium text-gray-900">{service.service_name}</span>
                                        </div>
                                    </label>

                                    {isSelected && (
                                        <div className="px-4 pb-4 pl-12 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                                    Referral Pay
                                                </label>
                                                <select
                                                    value={referralPay}
                                                    onChange={(e) => updateServiceConfig(service.service_name, 'referral_pay', e.target.value)}
                                                    className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    <option value="Y">Yes</option>
                                                    <option value="N">No</option>
                                                </select>
                                            </div>

                                            {referralPay === 'Y' && (
                                                <>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                                            Cash %
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                value={config.cash_percentage ?? ''}
                                                                onChange={(e) => updateServiceConfig(service.service_name, 'cash_percentage', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                                min="0"
                                                                max="100"
                                                                step="0.01"
                                                                placeholder="0"
                                                                className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                                            Insurance %
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                value={config.inpatient_percentage ?? ''}
                                                                onChange={(e) => updateServiceConfig(service.service_name, 'inpatient_percentage', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                                min="0"
                                                                max="100"
                                                                step="0.01"
                                                                placeholder="0"
                                                                className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            />
                                                        </div>
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
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-gray-600">
                                {selectedServices.length} service(s) selected
                            </div>
                            <button
                                onClick={() => setStep(3)}
                                disabled={selectedServices.length === 0}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                Review <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
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
                            <div className="mt-2 mb-4 pl-4 space-y-3 max-h-60 overflow-y-auto border-l-2 border-blue-200">
                                {selectedDoctors.map(id => {
                                    const doc = doctors.find(d => d.id === id);
                                    if (!doc) return null;
                                    return (
                                        <div key={id} className="text-sm bg-white/50 p-2 rounded hover:bg-white transition-colors">
                                            <div className="font-semibold text-blue-800">{doc.doctor_name}</div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 mt-1">
                                                <div><span className="font-medium">Speciality:</span> {doc.speciality_type || 'N/A'}</div>
                                                <div><span className="font-medium">Clinic/Hospital:</span> {doc.clinic_name || 'N/A'}</div>
                                                <div className="col-span-full"><span className="font-medium">Medical Council No:</span> {doc.medical_council_membership_number || 'N/A'}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <p><span className="font-medium">Services:</span> {selectedServices.length}</p>
                            <div className="mt-2 mb-4 pl-4 space-y-1 max-h-40 overflow-y-auto border-l-2 border-blue-200 text-gray-600">
                                <p className="font-medium mb-1 text-blue-900 text-xs uppercase tracking-wide">Preview:</p>
                                {selectedServices.map(s => (
                                    <p key={s}>
                                        <span className="font-medium">{s}:</span>{' '}
                                        Cash {serviceConfigurations[s]?.cash_percentage ?? 0}%,{' '}
                                        Insurance {serviceConfigurations[s]?.inpatient_percentage ?? 0}%
                                    </p>
                                ))}
                            </div>
                            <p><span className="font-medium">Total Configuration:</span> {selectedDoctors.length * selectedServices.length}</p>
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
                            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 font-semibold flex items-center gap-2 shadow-md transform hover:-translate-y-0.5 transition-all"
                        >
                            {submitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Check className="w-5 h-5" />
                                    Create
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Image Viewer Modal */}
            {selectedPanImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col h-auto max-h-[90vh] animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">PAN Card Document</h3>
                                <p className="text-sm text-gray-500">{selectedPanImage.doctorName}</p>
                            </div>
                            <button
                                onClick={() => setSelectedPanImage(null)}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body - Image */}
                        <div className="flex-1 overflow-auto p-8 bg-gray-100/50 flex items-center justify-center min-h-[300px]">
                            <img
                                src={selectedPanImage.url}
                                alt={selectedPanImage.title}
                                className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md border border-gray-200"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400?text=Image+Load+Error';
                                }}
                            />
                        </div>

                        {/* Modal Footer - Actions */}
                        <div className="p-4 border-t bg-gray-50 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setSelectedPanImage(null)}
                                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                            <a
                                href={selectedPanImage.url}
                                download={`${selectedPanImage.doctorName.replace(/\s+/g, '_')}_PAN_Card`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
                            >
                                <Download className="w-4 h-4" />
                                Download Image
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// CSV Import Component
function CSVImport({ onSuccess }: { onSuccess: () => void }) {
    const [csvData, setCsvData] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);

    const handleDownloadTemplate = async () => {
        try {
            const response = await fetch('/api/marketing/export-csv-template', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to download template');
            }

            // Get the blob with explicit CSV MIME type
            const blob = await response.blob();
            const csvBlob = new Blob([blob], { type: 'text/csv;charset=utf-8;' });

            // Create download link
            const url = window.URL.createObjectURL(csvBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'service_percentages_template.csv';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();

            // Cleanup
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 100);
        } catch (error: any) {
            console.error('Download error:', error);
            alert('Failed to download template');
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const rows = text.split('\n').slice(1); // Skip header

            const data = rows.map(row => {
                const [doctor_id, doctor_name, service_type, referral_pay, cash_percentage, inpatient_percentage] = row.split(',');
                return {
                    doctor_id: parseInt(doctor_id),
                    service_type: service_type?.trim(),
                    referral_pay: referral_pay?.trim(),
                    cash_percentage: parseFloat(cash_percentage),
                    inpatient_percentage: parseFloat(inpatient_percentage)
                };
            }).filter(row => row.doctor_id && row.service_type);

            setCsvData(data);
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        try {
            setUploading(true);
            const result = await importCSV(csvData);

            if (result.success) {
                alert(`Successfully imported ${result.data.inserted} records!`);
                setCsvData([]);
                onSuccess();
            }
        } catch (error: any) {
            alert('Failed to import CSV: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                <h3 className="text-lg font-semibold mb-2">Import from CSV</h3>
                <p className="text-sm text-gray-600">Download the template, fill it out, and upload</p>
            </div>

            {/* Step 1: Download Template */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                        1
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold mb-2">Download Template</h4>
                        <p className="text-sm text-gray-600 mb-4">Get the CSV template with sample data</p>
                        <button
                            onClick={handleDownloadTemplate}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Download Template
                        </button>
                    </div>
                </div>
            </div>

            {/* Step 2: Upload File */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                        2
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold mb-2">Upload Filled CSV</h4>
                        <p className="text-sm text-gray-600 mb-4">Upload your completed CSV file</p>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {csvData.length > 0 && (
                            <p className="mt-2 text-sm text-green-600">
                                ✓ {csvData.length} records loaded
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Step 3: Import */}
            {csvData.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                            3
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold mb-2">Import Data</h4>
                            <p className="text-sm text-gray-600 mb-4">Review and import {csvData.length} records</p>
                            <button
                                onClick={handleImport}
                                disabled={uploading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {uploading ? 'Importing...' : 'Import Records'}
                                <Upload className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
