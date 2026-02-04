import { useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, X } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

interface PackageDetail {
    type: 'Lab Test' | 'Scan' | 'Procedure';
    service_name: string;
    patient_charge: string;
    b2b_charge: string;
    special_charge: string;
    searchResults?: any[];
    showSuggestions?: boolean;
}

interface PackageModalProps {
    branchId: number;
    onClose: () => void;
    onSuccess: () => void;
}

export default function PackageModal({ branchId, onClose, onSuccess }: PackageModalProps) {
    const [packageName, setPackageName] = useState('');
    const [charges, setCharges] = useState({ patient_charge: '', b2b_charge: '', special_charge: '' });
    const [packageDetails, setPackageDetails] = useState<PackageDetail[]>([]);
    const [saving, setSaving] = useState(false);

    const addPackageDetail = () => {
        setPackageDetails([...packageDetails, {
            type: 'Lab Test',
            service_name: '',
            patient_charge: '',
            b2b_charge: '',
            special_charge: '',
            searchResults: [],
            showSuggestions: false
        }]);
    };

    const removePackageDetail = (index: number) => {
        setPackageDetails(packageDetails.filter((_, i) => i !== index));
    };

    const updatePackageDetail = (index: number, field: keyof PackageDetail, value: any) => {
        const newDetails = [...packageDetails];
        // @ts-ignore
        newDetails[index][field] = value;
        setPackageDetails(newDetails);
    };

    const handlePackageSearch = async (index: number, term: string) => {
        const newDetails = [...packageDetails];
        newDetails[index].service_name = term;

        if (term.length === 0) {
            newDetails[index].searchResults = [];
            newDetails[index].showSuggestions = false;
            setPackageDetails(newDetails);
            return;
        }

        try {
            const rowType = newDetails[index].type;
            const categoryMap: Record<string, string> = {
                'Lab Test': 'lab_test',
                'Scan': 'scan',
                'Procedure': 'procedure'
            };
            const mappedCategory = categoryMap[rowType] || 'lab_test';

            const response = await axios.get(`${API_URL}/billing-setup/search-services?term=${term}&category=${mappedCategory}&branchId=${branchId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            newDetails[index].searchResults = response.data;
            newDetails[index].showSuggestions = true;
            setPackageDetails(newDetails);
        } catch (error) {
            console.error('Error searching:', error);
        }
    };

    const selectPackageService = (index: number, service: any) => {
        const newDetails = [...packageDetails];
        newDetails[index].service_name = service.service_name;
        newDetails[index].showSuggestions = false;
        setPackageDetails(newDetails);
    };

    const handleSavePackage = async () => {
        if (!packageName) {
            alert('Please enter package name');
            return;
        }
        if (packageDetails.length === 0) {
            alert('Please add at least one service to the package');
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                branch_id: branchId,
                type_of_service: 'package',
                service_name: packageName,
                patient_charge: parseFloat(charges.patient_charge) || 0,
                b2b_charge: parseFloat(charges.b2b_charge) || 0,
                special_charge: parseFloat(charges.special_charge) || 0,
                package_details: packageDetails.map(d => ({
                    type: d.type,
                    service_name: d.service_name,
                    patient_charge: parseFloat(d.patient_charge) || 0,
                    b2b_charge: parseFloat(d.b2b_charge) || 0,
                    special_charge: parseFloat(d.special_charge) || 0
                }))
            };

            await axios.post(`${API_URL}/billing-setup/create`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Package created successfully!');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving package:', error);
            alert(error.response?.data?.message || 'Failed to save package');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl my-8 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
                    <h3 className="text-xl font-bold text-gray-900">Create New Package</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto flex-grow">
                    {/* Package Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Package Name *</label>
                        <input
                            type="text"
                            value={packageName}
                            onChange={(e) => setPackageName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            placeholder="e.g., Health Checkup Basic"
                        />
                    </div>

                    {/* Package Charges */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Patient Charge (₹)</label>
                            <input
                                type="number"
                                value={charges.patient_charge}
                                onChange={(e) => setCharges({ ...charges, patient_charge: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">B2B Charge (₹)</label>
                            <input
                                type="number"
                                value={charges.b2b_charge}
                                onChange={(e) => setCharges({ ...charges, b2b_charge: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Special Charge (₹)</label>
                            <input
                                type="number"
                                value={charges.special_charge}
                                onChange={(e) => setCharges({ ...charges, special_charge: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                    </div>

                    {/* Package Items */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-700">Package Items</label>
                            <button
                                onClick={addPackageDetail}
                                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" />
                                Add Item
                            </button>
                        </div>

                        {packageDetails.length === 0 ? (
                            <div className="text-center py-6 bg-gray-50 rounded-lg text-gray-500">
                                No items added. Click "Add Item" to begin.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {packageDetails.map((detail, index) => (
                                    <div key={index} className="p-4 border rounded-lg bg-gray-50">
                                        <div className="grid grid-cols-6 gap-3 items-start">
                                            <div>
                                                <label className="block text-xs text-gray-600 mb-1">Type</label>
                                                <select
                                                    value={detail.type}
                                                    onChange={(e) => updatePackageDetail(index, 'type', e.target.value)}
                                                    className="w-full px-2 py-1.5 text-sm border rounded"
                                                >
                                                    <option value="Lab Test">Lab Test</option>
                                                    <option value="Scan">Scan</option>
                                                    <option value="Procedure">Procedure</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2 relative">
                                                <label className="block text-xs text-gray-600 mb-1">Service Name</label>
                                                <input
                                                    type="text"
                                                    value={detail.service_name}
                                                    onChange={(e) => handlePackageSearch(index, e.target.value)}
                                                    className="w-full px-2 py-1.5 text-sm border rounded"
                                                    placeholder="Search..."
                                                />
                                                {detail.showSuggestions && detail.searchResults && detail.searchResults.length > 0 && (
                                                    <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                                                        {detail.searchResults.map((service: any, idx: number) => (
                                                            <div
                                                                key={idx}
                                                                onClick={() => selectPackageService(index, service)}
                                                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                                            >
                                                                {service.service_name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-600 mb-1">Patient (₹)</label>
                                                <input
                                                    type="number"
                                                    value={detail.patient_charge}
                                                    onChange={(e) => updatePackageDetail(index, 'patient_charge', e.target.value)}
                                                    className="w-full px-2 py-1.5 text-sm border rounded"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-600 mb-1">B2B (₹)</label>
                                                <input
                                                    type="number"
                                                    value={detail.b2b_charge}
                                                    onChange={(e) => updatePackageDetail(index, 'b2b_charge', e.target.value)}
                                                    className="w-full px-2 py-1.5 text-sm border rounded"
                                                />
                                            </div>
                                            <div className="flex gap-2 items-end">
                                                <div className="flex-1">
                                                    <label className="block text-xs text-gray-600 mb-1">Special (₹)</label>
                                                    <input
                                                        type="number"
                                                        value={detail.special_charge}
                                                        onChange={(e) => updatePackageDetail(index, 'special_charge', e.target.value)}
                                                        className="w-full px-2 py-1.5 text-sm border rounded"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => removePackageDetail(index)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t flex-shrink-0 bg-white rounded-b-xl">
                    <button
                        onClick={handleSavePackage}
                        disabled={saving}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                    >
                        {saving ? 'Saving...' : 'Create Package'}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
