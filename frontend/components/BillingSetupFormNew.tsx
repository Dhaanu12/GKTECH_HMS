import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, ChevronDown, ChevronRight, IndianRupee, Trash2, Copy, Save, X } from 'lucide-react';
import PackageModal from './PackageModal';

const API_URL = 'http://localhost:5000/api';

interface Service {
    service_id: number | null;
    service_name: string;
    category: string | null;
    type_of_service: string;
    billing_setup_id: number | null;
    patient_charge: string;
    b2b_charge: string;
    special_charge: string;
    is_package: boolean;
    package_items?: any[];
}

interface BillingSetupFormProps {
    branchId: number | null;
    onClose: () => void;
    branches?: any[];
}

export default function BillingSetupFormNew({ branchId, onClose, branches = [] }: BillingSetupFormProps) {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [expandedPackages, setExpandedPackages] = useState<Set<number>>(new Set());
    const [bulkEditMode, setBulkEditMode] = useState(false);
    const [bulkCharges, setBulkCharges] = useState({ patient_charge: '', b2b_charge: '', special_charge: '' });
    const [showPackageModal, setShowPackageModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingRows, setEditingRows] = useState<Map<number, { patient_charge: string; b2b_charge: string; special_charge: string }>>(new Map());

    useEffect(() => {
        if (branchId) {
            fetchServicesWithPricing();
        }
    }, [branchId]);

    const fetchServicesWithPricing = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/billing-setup/branch/${branchId}/services-with-pricing`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setServices(response.data.services || []);
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = () => {
        if (selectedIds.size === filteredServices.length) {
            setSelectedIds(new Set());
            setEditingRows(new Map());
        } else {
            const allIds = filteredServices.map((_, idx) => idx);
            const newSet = new Set(allIds);
            const newEditingRows = new Map<number, any>();

            allIds.forEach(idx => {
                const service = filteredServices[idx];
                newEditingRows.set(idx, {
                    patient_charge: service.patient_charge,
                    b2b_charge: service.b2b_charge,
                    special_charge: service.special_charge,
                    package_items: service.package_items ? JSON.parse(JSON.stringify(service.package_items)) : []
                });
            });

            setSelectedIds(newSet);
            setEditingRows(newEditingRows);
        }
    };

    const handleSelectRow = (index: number, service: Service) => {
        const newSet = new Set(selectedIds);
        const newEditingRows = new Map(editingRows);

        if (newSet.has(index)) {
            newSet.delete(index);
            newEditingRows.delete(index);
        } else {
            newSet.add(index);
            newEditingRows.set(index, {
                patient_charge: service.patient_charge,
                b2b_charge: service.b2b_charge,
                special_charge: service.special_charge,
                package_items: service.package_items ? JSON.parse(JSON.stringify(service.package_items)) : []
            });
        }

        setSelectedIds(newSet);
        setEditingRows(newEditingRows);
    };

    const updateEditingRow = (index: number, field: 'patient_charge' | 'b2b_charge' | 'special_charge', value: string) => {
        const newEditingRows = new Map(editingRows);
        const currentRow = newEditingRows.get(index);
        if (currentRow) {
            newEditingRows.set(index, { ...currentRow, [field]: value });
            setEditingRows(newEditingRows);
        }
    };

    const updatePackageItem = (parentIdx: number, itemIdx: number, field: string, value: string) => {
        const newEditingRows = new Map(editingRows);
        const currentRow = newEditingRows.get(parentIdx);
        if (currentRow && currentRow.package_items) {
            const newItems = [...currentRow.package_items];
            newItems[itemIdx] = { ...newItems[itemIdx], [field]: value };
            newEditingRows.set(parentIdx, { ...currentRow, package_items: newItems });
            setEditingRows(newEditingRows);
        }
    };

    const saveRow = async (index: number, service: Service) => {
        const editData = editingRows.get(index);
        if (!editData) return;

        try {
            const token = localStorage.getItem('token');
            const updateData = {
                updates: [{
                    service_name: service.service_name,
                    type_of_service: service.type_of_service,
                    patient_charge: editData.patient_charge,
                    b2b_charge: editData.b2b_charge,
                    special_charge: editData.special_charge,
                    package_items: editData.package_items // Include package items
                }]
            };

            await axios.put(`${API_URL}/billing-setup/branch/${branchId}/bulk-update`, updateData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            await fetchServicesWithPricing();

            const newSelectedIds = new Set(selectedIds);
            newSelectedIds.delete(index);
            setSelectedIds(newSelectedIds);

            const newEditingRows = new Map(editingRows);
            newEditingRows.delete(index);
            setEditingRows(newEditingRows);
        } catch (error: any) {
            console.error('Error saving:', error);
            alert(error.response?.data?.message || 'Failed to save');
        }
    };

    const handleBulkEdit = () => {
        if (selectedIds.size === 0) {
            alert('Please select at least one service');
            return;
        }
        setBulkEditMode(true);
    };

    const saveBulkEdit = async () => {
        try {
            const token = localStorage.getItem('token');
            const selectedServices = Array.from(selectedIds).map(idx => filteredServices[idx]);

            const updateData = {
                updates: selectedServices.map(service => ({
                    service_name: service.service_name,
                    type_of_service: service.type_of_service,
                    patient_charge: bulkCharges.patient_charge,
                    b2b_charge: bulkCharges.b2b_charge,
                    special_charge: bulkCharges.special_charge
                }))
            };

            await axios.put(`${API_URL}/billing-setup/branch/${branchId}/bulk-update`, updateData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            await fetchServicesWithPricing();
            setBulkEditMode(false);
            setSelectedIds(new Set());
            setEditingRows(new Map());
            setBulkCharges({ patient_charge: '', b2b_charge: '', special_charge: '' });
        } catch (error: any) {
            console.error('Error bulk saving:', error);
            alert(error.response?.data?.message || 'Failed to save');
        }
    };

    const togglePackage = (index: number) => {
        const newSet = new Set(expandedPackages);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setExpandedPackages(newSet);
    };

    const filteredServices = services.filter(s =>
        s.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Billing Configuration</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage pricing for all medical services</p>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex flex-wrap gap-3 justify-between items-center">
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowPackageModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Package
                        </button>
                        {selectedIds.size > 0 && (
                            <button
                                onClick={handleBulkEdit}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
                            >
                                <Edit2 className="w-4 h-4" />
                                Bulk Edit ({selectedIds.size})
                            </button>
                        )}
                    </div>
                    <input
                        type="text"
                        placeholder="Search services..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg w-64"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    <table className="w-full">
                        <thead className="bg-gray-100 sticky top-0 z-10">
                            <tr>
                                <th className="p-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.size > 0 && selectedIds.size === filteredServices.length}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4"
                                    />
                                </th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700">Service Name</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700">Category</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700">Patient Charge (₹)</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700">B2B Charge (₹)</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700">Special Charge (₹)</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-gray-500">Loading...</td>
                                </tr>
                            ) : filteredServices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-gray-500">No services found. Please assign medical services to this branch first.</td>
                                </tr>
                            ) : (
                                filteredServices.map((service, idx) => {
                                    const isEditing = editingRows.has(idx);
                                    const editData = editingRows.get(idx);

                                    return (
                                        <>
                                            <tr key={idx} className={`border-b hover:bg-gray-50 ${service.is_package ? 'bg-blue-50' : ''} ${isEditing ? 'bg-yellow-50' : ''}`}>
                                                <td className="p-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(idx)}
                                                        onChange={() => handleSelectRow(idx, service)}
                                                        className="w-4 h-4"
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        {service.is_package && (
                                                            <button onClick={() => togglePackage(idx)} className="p-1 hover:bg-gray-200 rounded">
                                                                {expandedPackages.has(idx) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                            </button>
                                                        )}
                                                        <span className={`${service.is_package ? 'font-semibold text-blue-700' : ''}`}>
                                                            {service.service_name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    {service.is_package ? (
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Package</span>
                                                    ) : (
                                                        <span>{service.category}</span>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    {isEditing && editData ? (
                                                        <input
                                                            type="number"
                                                            value={editData.patient_charge}
                                                            onChange={(e) => updateEditingRow(idx, 'patient_charge', e.target.value)}
                                                            className="w-24 px-2 py-1 border rounded"
                                                        />
                                                    ) : (
                                                        <span className={service.patient_charge === '0.00' ? 'text-gray-400' : ''}>
                                                            ₹{service.patient_charge}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    {isEditing && editData ? (
                                                        <input
                                                            type="number"
                                                            value={editData.b2b_charge}
                                                            onChange={(e) => updateEditingRow(idx, 'b2b_charge', e.target.value)}
                                                            className="w-24 px-2 py-1 border rounded"
                                                        />
                                                    ) : (
                                                        <span className={service.b2b_charge === '0.00' ? 'text-gray-400' : ''}>
                                                            ₹{service.b2b_charge}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    {isEditing && editData ? (
                                                        <input
                                                            type="number"
                                                            value={editData.special_charge}
                                                            onChange={(e) => updateEditingRow(idx, 'special_charge', e.target.value)}
                                                            className="w-24 px-2 py-1 border rounded"
                                                        />
                                                    ) : (
                                                        <span className={service.special_charge === '0.00' ? 'text-gray-400' : ''}>
                                                            ₹{service.special_charge}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    {isEditing ? (
                                                        <button
                                                            onClick={() => saveRow(idx, service)}
                                                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center gap-1"
                                                        >
                                                            <Save className="w-4 h-4" />
                                                            Save
                                                        </button>
                                                    ) : null}
                                                </td>
                                            </tr>
                                            {/* Package Items */}
                                            {service.is_package && expandedPackages.has(idx) && service.package_items && (
                                                service.package_items.map((item: any, itemIdx: number) => (
                                                    <tr key={`${idx}-${itemIdx}`} className="bg-blue-25 border-b">
                                                        <td className="p-3 pl-12" colSpan={2}>
                                                            <span className="text-sm text-gray-600">└─ {item.service_name}</span>
                                                        </td>
                                                        <td className="p-3 text-sm text-gray-600">{item.type_of_service}</td>
                                                        <td className="p-3 text-sm text-gray-600">
                                                            {isEditing && editData?.package_items ? (
                                                                <input
                                                                    type="number"
                                                                    value={editData.package_items[itemIdx]?.patient_charge || item.patient_charge}
                                                                    onChange={(e) => updatePackageItem(idx, itemIdx, 'patient_charge', e.target.value)}
                                                                    className="w-20 px-2 py-1 border rounded text-sm"
                                                                />
                                                            ) : (
                                                                `₹${item.patient_charge}`
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-sm text-gray-600">
                                                            {isEditing && editData?.package_items ? (
                                                                <input
                                                                    type="number"
                                                                    value={editData.package_items[itemIdx]?.b2b_charge || item.b2b_charge}
                                                                    onChange={(e) => updatePackageItem(idx, itemIdx, 'b2b_charge', e.target.value)}
                                                                    className="w-20 px-2 py-1 border rounded text-sm"
                                                                />
                                                            ) : (
                                                                `₹${item.b2b_charge}`
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-sm text-gray-600">
                                                            {isEditing && editData?.package_items ? (
                                                                <input
                                                                    type="number"
                                                                    value={editData.package_items[itemIdx]?.special_charge || item.special_charge}
                                                                    onChange={(e) => updatePackageItem(idx, itemIdx, 'special_charge', e.target.value)}
                                                                    className="w-20 px-2 py-1 border rounded text-sm"
                                                                />
                                                            ) : (
                                                                `₹${item.special_charge}`
                                                            )}
                                                        </td>
                                                        <td></td>
                                                    </tr>
                                                ))
                                            )}
                                        </>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bulk Edit Modal */}
            {bulkEditMode && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Bulk Edit Prices</h3>
                        <p className="text-sm text-gray-600 mb-4">Editing {selectedIds.size} services</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Patient Charge (₹)</label>
                                <input
                                    type="number"
                                    value={bulkCharges.patient_charge}
                                    onChange={(e) => setBulkCharges({ ...bulkCharges, patient_charge: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">B2B Charge (₹)</label>
                                <input
                                    type="number"
                                    value={bulkCharges.b2b_charge}
                                    onChange={(e) => setBulkCharges({ ...bulkCharges, b2b_charge: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Special Charge (₹)</label>
                                <input
                                    type="number"
                                    value={bulkCharges.special_charge}
                                    onChange={(e) => setBulkCharges({ ...bulkCharges, special_charge: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={saveBulkEdit} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                                Save All
                            </button>
                            <button onClick={() => setBulkEditMode(false)} className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Package Modal */}
            {showPackageModal && (
                <PackageModal
                    branchId={branchId!}
                    onClose={() => setShowPackageModal(false)}
                    onSuccess={fetchServicesWithPricing}
                />
            )}
        </div>
    );
}
