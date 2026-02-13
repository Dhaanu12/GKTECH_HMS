import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Check, X, ChevronLeft, ChevronRight, Download, Upload } from 'lucide-react';

interface Service {
    service_id: number;
    service_name: string;
    service_code: string;
    category: string;
}

interface MedicalServicesSelectorProps {
    hospitalId?: number;
    branchId?: number;
    onSave?: (selectedIds: number[]) => void;
    readOnly?: boolean;
}

export default function MedicalServicesSelector({
    hospitalId,
    branchId,
    onSave,
    readOnly = false
}: MedicalServicesSelectorProps) {
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [services, setServices] = useState<Service[]>([]);
    const [selectedServiceIds, setSelectedServiceIds] = useState<Set<number>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const limit = 50;

    useEffect(() => {
        fetchCategories();
        if (hospitalId) {
            fetchExistingHospitalServices();
        } else if (branchId) {
            fetchExistingBranchServices();
        }
    }, [hospitalId, branchId]);

    useEffect(() => {
        fetchServices();
    }, [selectedCategory, searchTerm, currentPage]);

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/medical-services/categories', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategories(response.data.categories || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchServices = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/medical-services', {
                params: {
                    category: selectedCategory,
                    search: searchTerm,
                    page: currentPage,
                    limit
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            setServices(response.data.services || []);
            setTotalPages(response.data.pagination?.totalPages || 1);
            setTotal(response.data.pagination?.total || 0);
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchExistingHospitalServices = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/medical-services/hospital/${hospitalId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const existingIds = response.data.services?.map((s: any) => s.service_id) || [];
            setSelectedServiceIds(new Set(existingIds));
            console.log('Loaded existing hospital services:', existingIds);
        } catch (error) {
            console.error('Error fetching existing hospital services:', error);
        }
    };

    const fetchExistingBranchServices = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/medical-services/branch/${branchId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const existingIds = response.data.services?.map((s: any) => s.service_id) || [];
            setSelectedServiceIds(new Set(existingIds));
        } catch (error) {
            console.error('Error fetching existing branch services:', error);
        }
    };

    const handleToggleService = (serviceId: number) => {
        if (readOnly) return;
        const newSet = new Set(selectedServiceIds);
        if (newSet.has(serviceId)) {
            newSet.delete(serviceId);
        } else {
            newSet.add(serviceId);
        }
        setSelectedServiceIds(newSet);
    };

    const handleSelectAll = () => {
        if (readOnly) return;
        const newSet = new Set(selectedServiceIds);
        services.forEach(s => newSet.add(s.service_id));
        setSelectedServiceIds(newSet);
    };

    const handleClearAll = () => {
        if (readOnly) return;
        const newSet = new Set(selectedServiceIds);
        services.forEach(s => newSet.delete(s.service_id));
        setSelectedServiceIds(newSet);
    };

    const handleSave = async () => {
        if (!hospitalId && !branchId) return;

        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const serviceIds = Array.from(selectedServiceIds);

            if (branchId) {
                await axios.post(`http://localhost:5000/api/medical-services/branch/${branchId}/assign`,
                    { serviceIds },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else if (hospitalId) {
                await axios.post(`http://localhost:5000/api/medical-services/hospital/${hospitalId}/assign`,
                    { serviceIds },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }

            alert('Services saved successfully!');
            if (onSave) onSave(serviceIds);
        } catch (error: any) {
            console.error('Error saving services:', error);
            alert(error.response?.data?.message || 'Failed to save services');
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadExcel = async () => {
        if (!hospitalId && !branchId) return;

        setDownloading(true);
        try {
            const token = localStorage.getItem('token');
            const entityType = branchId ? 'branch' : 'hospital';
            const entityId = branchId || hospitalId;

            const response = await axios.get(
                `http://localhost:5000/api/medical-services/${entityType}/${entityId}/excel-download`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob'
                }
            );

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `medical-services-${entityType}-${entityId}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            console.error('Error downloading Excel:', error);
            alert(error.response?.data?.message || 'Failed to download Excel file');
        } finally {
            setDownloading(false);
        }
    };

    const handleUploadExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !hospitalId && !branchId) return;

        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            const entityType = branchId ? 'branch' : 'hospital';
            const entityId = branchId || hospitalId;

            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(
                `http://localhost:5000/api/medical-services/${entityType}/${entityId}/excel-upload`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            alert(response.data.message || 'Services imported successfully!');

            // Refresh the data
            if (branchId) {
                await fetchExistingBranchServices();
            } else if (hospitalId) {
                await fetchExistingHospitalServices();
            }
            await fetchServices();

            if (onSave) {
                onSave(Array.from(selectedServiceIds));
            }
        } catch (error: any) {
            console.error('Error uploading Excel:', error);
            const errorMsg = error.response?.data?.message || 'Failed to upload Excel file';
            const errors = error.response?.data?.errors;

            if (errors && errors.length > 0) {
                alert(`${errorMsg}:\n\n${errors.join('\n')}`);
            } else {
                alert(errorMsg);
            }
        } finally {
            setUploading(false);
            // Reset file input
            event.target.value = '';
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {/* Header */}
            <div className="border-b border-gray-200 p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Select Medical Services</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Selected: {selectedServiceIds.size} of {total} services
                        </p>
                    </div>
                    {!readOnly && (
                        <div className="flex gap-2">
                            <button
                                onClick={handleDownloadExcel}
                                disabled={downloading}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Download Excel template"
                            >
                                <Download className="w-4 h-4" />
                                {downloading ? 'Downloading...' : 'Download Excel'}
                            </button>
                            <label className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer disabled:opacity-50">
                                <Upload className="w-4 h-4" />
                                {uploading ? 'Uploading...' : 'Upload Excel'}
                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleUploadExcel}
                                    disabled={uploading}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    )}
                </div>
            </div>

            {/* Category Tabs */}
            <div className="border-b border-gray-200 p-4">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => { setSelectedCategory('all'); setCurrentPage(1); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        All
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === cat
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search and Bulk Actions */}
            <div className="border-b border-gray-200 p-4">
                <div className="flex flex-col sm:flex-row gap-3 justify-between">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            placeholder="Search services..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    {!readOnly && (
                        <div className="flex gap-2">
                            <button
                                onClick={handleSelectAll}
                                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                Select All
                            </button>
                            <button
                                onClick={handleClearAll}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Clear All
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Services List */}
            <div className="p-4">
                {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading services...</div>
                ) : services.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No services found</div>
                ) : (
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                        {services.map((service) => {
                            const isSelected = selectedServiceIds.has(service.service_id);
                            return (
                                <div
                                    key={service.service_id}
                                    onClick={() => handleToggleService(service.service_id)}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isSelected
                                        ? 'bg-blue-50 border-blue-300'
                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                        } ${readOnly ? 'cursor-not-allowed opacity-60' : ''}`}
                                >
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                                        }`}>
                                        {isSelected && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{service.service_name}</p>
                                        <p className="text-xs text-gray-500">{service.category} • {service.service_code}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="border-t border-gray-200 p-4 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Save Button */}
            {!readOnly && (hospitalId || branchId) && (
                <div className="border-t border-gray-200 p-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        {saving ? 'Saving...' : `Save Selected Services (${selectedServiceIds.size})`}
                    </button>
                </div>
            )}
        </div>
    );
}
