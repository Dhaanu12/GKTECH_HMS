import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Plus, Trash2, Search, X, IndianRupee, Edit, Eye, Save, Copy } from 'lucide-react';

interface BillingSetupFormProps {
    branchId: number | null;
    onClose: () => void;
    branches?: any[]; // List of all branches in hospital
}

interface Service {
    service_id: number;
    service_name: string;
    category: string;
}

interface ExistingSetup {
    billing_setup_id: number;
    type_of_service: string;
    service_name: string;
    patient_charge: string;
    b2b_charge: string;
    special_charge: string;
    package_details?: any[];
}

interface PackageDetail {
    type: 'Lab Test' | 'Scan' | 'Procedure';
    service_name: string;
    patient_charge: string;
    b2b_charge: string;
    special_charge: string;
    // UI state for search
    searchResults?: Service[];
    showSuggestions?: boolean;
}

type BillingType = 'Lab Test' | 'Scan' | 'Procedure' | 'Package';

export default function BillingSetupForm({ branchId, onClose, branches: allBranches = [] }: BillingSetupFormProps) {
    const [billingType, setBillingType] = useState<BillingType>('Lab Test');
    const [serviceName, setServiceName] = useState('');
    const [searchResults, setSearchResults] = useState<Service[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [existingSetups, setExistingSetups] = useState<ExistingSetup[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [expandedPackageId, setExpandedPackageId] = useState<number | null>(null); // Track expanded package
    // Charges for the main item (Service or Package)
    const [charges, setCharges] = useState({
        patient_charge: '',
        b2b_charge: '',
        special_charge: ''
    });

    // Table Search and Filter State
    const [tableSearch, setTableSearch] = useState('');
    const [tableFilter, setTableFilter] = useState<string>('All');

    // Package Details
    const [packageDetails, setPackageDetails] = useState<PackageDetail[]>([]);

    // Ref for scrolling to form
    const formRef = useRef<HTMLDivElement>(null);

    // Copy from branch state
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [selectedSourceBranch, setSelectedSourceBranch] = useState<number | null>(null);

    useEffect(() => {
        if (branchId) {
            fetchExistingSetups();
        }
    }, [branchId]);

    const handleCopyFromBranch = async () => {
        if (!selectedSourceBranch || !branchId) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/billing-setup/copy-from-branch', {
                sourceBranchId: selectedSourceBranch,
                targetBranchId: branchId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Billing setups copied successfully!');
            setShowCopyModal(false);
            setSelectedSourceBranch(null);
            fetchExistingSetups();
        } catch (error: any) {
            console.error('Error copying billing setups:', error);
            alert(error.response?.data?.message || 'Failed to copy billing setups');
        }
    };

    const fetchExistingSetups = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/billing-setup/branch/${branchId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setExistingSetups(response.data);
        } catch (error) {
            console.error('Error fetching existing setups:', error);
        }
    };

    const handleSearch = async (term: string) => {
        setServiceName(term);
        // Allow search for even single letter as requested
        if (term.length === 0) {
            setSearchResults([]);
            setShowSuggestions(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            // Mapping UI type to partial category match if possible, or just passing category
            // Assuming DB categories match somewhat or we search broadly.
            // "Lab Test" might map to "Laboratory", "Scan" to "Radiology" etc? 
            // For now, let's try to map strictly if we know the DB values.
            // Based on previous check: "General" was one category.
            // If the user wants specific filtering, we might need a mapping.
            // For now, let's send the UI type as category query if not 'Package'

            // Mapping UI type to DB category
            let categoryParam = '';
            if (billingType !== 'Package') {
                const categoryMap: Record<string, string> = {
                    'Lab Test': 'lab_test',
                    'Scan': 'scan',
                    'Procedure': 'procedure'
                };
                const mappedCategory = categoryMap[billingType] || billingType.toLowerCase();
                categoryParam = `&category=${mappedCategory}`;
            }

            const response = await axios.get(`http://localhost:5000/api/billing-setup/search-services?term=${term}${categoryParam}&branchId=${branchId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSearchResults(response.data);
            setShowSuggestions(true);
        } catch (error) {
            console.error('Error searching services:', error);
        }
    };

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
            // Map the row's selected type to DB category
            const rowType = newDetails[index].type;
            const categoryMap: Record<string, string> = {
                'Lab Test': 'lab_test',
                'Scan': 'scan',
                'Procedure': 'procedure'
            };
            const mappedCategory = categoryMap[rowType] || 'lab_test';

            const response = await axios.get(`http://localhost:5000/api/billing-setup/search-services?term=${term}&category=${mappedCategory}&branchId=${branchId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            newDetails[index].searchResults = response.data;
            newDetails[index].showSuggestions = true;
            setPackageDetails(newDetails);
        } catch (error) {
            console.error('Error searching package service:', error);
        }
    };

    const selectPackageService = (index: number, service: Service) => {
        const newDetails = [...packageDetails];
        newDetails[index].service_name = service.service_name;
        newDetails[index].showSuggestions = false;
        setPackageDetails(newDetails);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!branchId) {
            alert('Branch ID is missing.');
            return;
        }

        try {
            const token = localStorage.getItem('token');

            const categoryMap: Record<string, string> = {
                'Lab Test': 'lab_test',
                'Scan': 'scan',
                'Procedure': 'procedure',
                'Package': 'package'
            };
            const apiType = categoryMap[billingType] || billingType.toLowerCase();

            const payload = {
                branch_id: branchId,
                type_of_service: apiType,
                service_name: serviceName,
                patient_charge: parseFloat(charges.patient_charge) || 0,
                b2b_charge: parseFloat(charges.b2b_charge) || 0,
                special_charge: parseFloat(charges.special_charge) || 0,
                package_details: billingType === 'Package' ? packageDetails.map(d => ({
                    type: d.type, // Send type to backend
                    service_name: d.service_name,
                    patient_charge: parseFloat(d.patient_charge) || 0,
                    b2b_charge: parseFloat(d.b2b_charge) || 0,
                    special_charge: parseFloat(d.special_charge) || 0
                })) : []
            };

            if (editingId) {
                await axios.put(`http://localhost:5000/api/billing-setup/update/${editingId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Billing setup updated successfully!');
            } else {
                await axios.post('http://localhost:5000/api/billing-setup/create', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Billing setup saved successfully!');
            }

            fetchExistingSetups();
            resetForm();

        } catch (error: any) {
            console.error('Error saving billing setup:', error);
            alert(error.response?.data?.message || 'Failed to save billing setup');
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setServiceName('');
        setCharges({ patient_charge: '', b2b_charge: '', special_charge: '' });
        setPackageDetails([]);
        setBillingType('Lab Test');
    };

    const handleEdit = (setup: ExistingSetup) => {
        setEditingId(setup.billing_setup_id);

        // Map DB type back to UI BillingType
        const dbType = setup.type_of_service;
        let uiType: BillingType = 'Lab Test';
        if (dbType === 'package') uiType = 'Package';
        else if (dbType === 'scan') uiType = 'Scan';
        else if (dbType === 'procedure') uiType = 'Procedure';
        else uiType = 'Lab Test'; // Default fallback

        setBillingType(uiType);
        setServiceName(setup.service_name);
        setCharges({
            patient_charge: setup.patient_charge,
            b2b_charge: setup.b2b_charge,
            special_charge: setup.special_charge
        });

        // Set package details if any
        if (uiType === 'Package' && setup.package_details) {
            const mappedDetails = setup.package_details.map((d: any) => ({
                type: (d.type_of_service === 'Lab Test' ? 'Lab Test' :
                    d.type_of_service === 'Scan' ? 'Scan' :
                        d.type_of_service === 'Procedure' ? 'Procedure' :
                            // Fallback for older data or mismatch
                            d.type_of_service === 'lab_test' ? 'Lab Test' :
                                d.type_of_service === 'scan' ? 'Scan' :
                                    d.type_of_service === 'procedure' ? 'Procedure' : 'Lab Test') as any,
                service_name: d.service_name,
                patient_charge: d.patient_charge,
                b2b_charge: d.b2b_charge,
                special_charge: d.special_charge,
                searchResults: [],
                showSuggestions: false
            }));
            setPackageDetails(mappedDetails);
        } else {
            setPackageDetails([]);
        }

        // Scroll to form
        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    return (
        <div className="space-y-8" ref={formRef}>
            {/* Copy from Branch Button */}
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={() => setShowCopyModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
                >
                    <Copy className="w-4 h-4" />
                    Copy from Branch
                </button>
            </div>

            {/* Type Selection */}
            <div className="grid grid-cols-4 gap-3 bg-gray-50 p-2 rounded-xl">
                {['Lab Test', 'Scan', 'Procedure', 'Package'].map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setBillingType(t as BillingType)}
                        className={`py-2.5 text-sm font-medium rounded-lg transition-all ${billingType === t
                            ? 'bg-white text-blue-600 shadow-md ring-1 ring-black/5'
                            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                            }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Service Name Input (Search only if NOT package) */}
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {billingType === 'Package' ? 'Package Name' : 'Service Name'} *
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            required
                            value={serviceName}
                            onChange={(e) => billingType === 'Package' ? setServiceName(e.target.value) : handleSearch(e.target.value)}
                            onFocus={() => { if (billingType !== 'Package' && serviceName.length > 0) setShowSuggestions(true); }}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={billingType === 'Package' ? "Enter package name" : "Search for service..."}
                        />
                        {billingType !== 'Package' && (
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        )}
                        {/* Static icon for package name? Or just none. */}
                        {billingType === 'Package' && (
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">PKG</div>
                        )}
                    </div>

                    {/* Suggestions Dropdown (Only for single service mode) */}
                    {billingType !== 'Package' && showSuggestions && searchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {searchResults.map((service) => (
                                <button
                                    key={service.service_id}
                                    type="button"
                                    onClick={() => {
                                        setServiceName(service.service_name);
                                        setShowSuggestions(false);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 block border-b border-gray-50 last:border-0"
                                >
                                    {service.service_name}
                                    <span className="text-xs text-gray-400 ml-2">({service.category})</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main Charges */}
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Patient Charge</label>
                        <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="number"
                                value={charges.patient_charge}
                                onChange={(e) => setCharges({ ...charges, patient_charge: e.target.value })}
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">B2B Charge</label>
                        <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="number"
                                value={charges.b2b_charge}
                                onChange={(e) => setCharges({ ...charges, b2b_charge: e.target.value })}
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Special Charge</label>
                        <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="number"
                                value={charges.special_charge}
                                onChange={(e) => setCharges({ ...charges, special_charge: e.target.value })}
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </div>

                {/* Package Details */}
                {billingType === 'Package' && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-semibold text-gray-900">Package Details</h4>
                            <button
                                type="button"
                                onClick={addPackageDetail}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" /> Add Component
                            </button>
                        </div>

                        {packageDetails.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No components added yet.</p>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="py-2 px-3 text-sm font-medium text-gray-600">Type</th>
                                        <th className="py-2 px-3 text-sm font-medium text-gray-600 w-1/3">Service Name</th>
                                        <th className="py-2 px-3 text-sm font-medium text-gray-600">Patient</th>
                                        <th className="py-2 px-3 text-sm font-medium text-gray-600">B2B</th>
                                        <th className="py-2 px-3 text-sm font-medium text-gray-600">Special</th>
                                        <th className="py-2 px-3 text-sm font-medium text-gray-600"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {packageDetails.map((detail, index) => (
                                        <tr key={index} className="border-b border-gray-100 last:border-0">
                                            <td className="p-2 align-top">
                                                <select
                                                    value={detail.type}
                                                    onChange={(e) => updatePackageDetail(index, 'type', e.target.value as PackageDetail['type'])}
                                                    className="w-full py-2 pl-2 pr-6 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="Lab Test">Lab Test</option>
                                                    <option value="Scan">Scan</option>
                                                    <option value="Procedure">Procedure</option>
                                                </select>
                                            </td>
                                            <td className="p-2 align-top relative">
                                                <input
                                                    type="text"
                                                    value={detail.service_name}
                                                    onChange={(e) => handlePackageSearch(index, e.target.value)}
                                                    onFocus={() => {
                                                        if (detail.service_name.length > 0) {
                                                            updatePackageDetail(index, 'showSuggestions', true);
                                                        }
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Search..."
                                                />
                                                {detail.showSuggestions && (detail.searchResults?.length || 0) > 0 && (
                                                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                        {detail.searchResults?.map((s) => (
                                                            <button
                                                                key={s.service_id}
                                                                type="button"
                                                                onClick={() => selectPackageService(index, s)}
                                                                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-gray-700 block border-b border-gray-50"
                                                            >
                                                                {s.service_name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                {detail.showSuggestions && (
                                                    <div
                                                        className="fixed inset-0 z-10 cursor-default"
                                                        onClick={() => updatePackageDetail(index, 'showSuggestions', false)}
                                                    />
                                                )}
                                            </td>
                                            <td className="p-2 align-top">
                                                <div className="relative">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                                                    <input
                                                        type="number"
                                                        value={detail.patient_charge}
                                                        onChange={(e) => updatePackageDetail(index, 'patient_charge', e.target.value)}
                                                        className="w-full pl-6 pr-3 py-2 border border-gray-300 rounded-md text-sm"
                                                        placeholder="Pt."
                                                    />
                                                </div>
                                            </td>
                                            <td className="p-2 align-top">
                                                <div className="relative">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                                                    <input
                                                        type="number"
                                                        value={detail.b2b_charge}
                                                        onChange={(e) => updatePackageDetail(index, 'b2b_charge', e.target.value)}
                                                        className="w-full pl-6 pr-3 py-2 border border-gray-300 rounded-md text-sm"
                                                        placeholder="B2B"
                                                    />
                                                </div>
                                            </td>
                                            <td className="p-2 align-top">
                                                <div className="relative">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                                                    <input
                                                        type="number"
                                                        value={detail.special_charge}
                                                        onChange={(e) => updatePackageDetail(index, 'special_charge', e.target.value)}
                                                        className="w-full pl-6 pr-3 py-2 border border-gray-300 rounded-md text-sm"
                                                        placeholder="Spl."
                                                    />
                                                </div>
                                            </td>
                                            <td className="p-2 align-top">
                                                <button
                                                    type="button"
                                                    onClick={() => removePackageDetail(index)}
                                                    className="text-gray-400 hover:text-red-500 p-2"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                    >
                        Back
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-500/30"
                    >
                        {editingId ? 'Update Setup' : 'Save Setup'}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            {/* Existing Setups Table */}
            <div className="mt-8">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h3 className="text-lg font-semibold text-gray-900">Existing Billing Setups</h3>
                    <div className="flex gap-4 w-full md:w-auto">
                        {/* Filter Dropdown */}
                        <select
                            value={tableFilter}
                            onChange={(e) => setTableFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="All">All Types</option>
                            <option value="lab_test">Lab Test</option>
                            <option value="scan">Scan</option>
                            <option value="procedure">Procedure</option>
                            <option value="package">Package</option>
                        </select>
                        {/* Search Input */}
                        <div className="relative w-full md:w-64">
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={tableSearch}
                                onChange={(e) => setTableSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                        </div>
                    </div>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Service Name</th>
                                <th className="px-4 py-3 text-right">Patient</th>
                                <th className="px-4 py-3 text-right">B2B</th>
                                <th className="px-4 py-3 text-right">Special</th>
                                <th className="px-4 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {existingSetups
                                .filter(setup => {
                                    // Apply Type Filter
                                    if (tableFilter !== 'All' && setup.type_of_service.toLowerCase() !== tableFilter.toLowerCase()) return false;
                                    // Apply Name Search
                                    if (tableSearch && !setup.service_name.toLowerCase().includes(tableSearch.toLowerCase())) return false;
                                    return true;
                                })
                                .length > 0 ? (
                                existingSetups
                                    .filter(setup => {
                                        if (tableFilter !== 'All' && setup.type_of_service.toLowerCase() !== tableFilter.toLowerCase()) return false;
                                        if (tableSearch && !setup.service_name.toLowerCase().includes(tableSearch.toLowerCase())) return false;
                                        return true;
                                    })
                                    .map((setup) => (
                                        <>
                                            <tr key={setup.billing_setup_id} className="hover:bg-gray-50/50">
                                                <td className="px-4 py-3 text-gray-600 capitalize">{setup.type_of_service}</td>
                                                <td className="px-4 py-3 text-gray-900 font-medium">{setup.service_name}</td>
                                                <td className="px-4 py-3 text-right font-medium text-gray-900">₹{setup.patient_charge}</td>
                                                <td className="px-4 py-3 text-right text-gray-600">₹{setup.b2b_charge}</td>
                                                <td className="px-4 py-3 text-right text-gray-600">₹{setup.special_charge}</td>
                                                <td className="px-4 py-3 text-center flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(setup)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    {setup.type_of_service === 'package' && (
                                                        <button
                                                            onClick={() => setExpandedPackageId(expandedPackageId === setup.billing_setup_id ? null : setup.billing_setup_id)}
                                                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                            {/* Expanded Package Details Row */}
                                            {setup.type_of_service === 'package' && expandedPackageId === setup.billing_setup_id && setup.package_details && setup.package_details.length > 0 && (
                                                <tr key={`${setup.billing_setup_id}-details`} className="bg-blue-50/30">
                                                    <td colSpan={6} className="px-4 py-4">
                                                        <div className="bg-white rounded-lg border border-blue-200 p-4">
                                                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Package Components</h4>
                                                            <table className="w-full text-sm">
                                                                <thead className="bg-gray-50 text-gray-600 font-medium">
                                                                    <tr>
                                                                        <th className="px-3 py-2 text-left">Type</th>
                                                                        <th className="px-3 py-2 text-left">Service Name</th>
                                                                        <th className="px-3 py-2 text-right">Patient</th>
                                                                        <th className="px-3 py-2 text-right">B2B</th>
                                                                        <th className="px-3 py-2 text-right">Special</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-100">
                                                                    {setup.package_details.map((d: any, i: number) => (
                                                                        <tr key={i} className="hover:bg-gray-50">
                                                                            <td className="px-3 py-2 capitalize text-gray-600">{d.type_of_service || '-'}</td>
                                                                            <td className="px-3 py-2 font-medium text-gray-900">{d.service_name}</td>
                                                                            <td className="px-3 py-2 text-right text-gray-900">₹{d.patient_charge}</td>
                                                                            <td className="px-3 py-2 text-right text-gray-600">₹{d.b2b_charge}</td>
                                                                            <td className="px-3 py-2 text-right text-gray-600">₹{d.special_charge}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                        No billing setups found for this branch.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Copy from Branch Modal */}
            {showCopyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="border-b border-gray-100 p-4 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900">Copy Billing Setups</h3>
                            <button onClick={() => setShowCopyModal(false)} className="p-2 hover:bg-gray-200 rounded-full">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4">
                                Select a branch to copy all billing setups from:
                            </p>
                            <select
                                value={selectedSourceBranch || ''}
                                onChange={(e) => setSelectedSourceBranch(Number(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">-- Select Branch --</option>
                                {allBranches
                                    .filter((b: any) => b.branch_id !== branchId)
                                    .map((branch) => (
                                        <option key={branch.branch_id} value={branch.branch_id}>
                                            {branch.branch_name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <div className="border-t border-gray-100 p-4 flex justify-end gap-3">
                            <button
                                onClick={() => setShowCopyModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCopyFromBranch}
                                disabled={!selectedSourceBranch}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
