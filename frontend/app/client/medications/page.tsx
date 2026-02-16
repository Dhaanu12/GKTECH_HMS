'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Search, Plus, Filter, Upload, Pill, Building2 } from 'lucide-react';
import AddNewMedicationModal from './components/AddNewMedicationModal';
import ImportMedicationModal from './components/ImportMedicationModal';
import api from '@/lib/axios';

interface Medication {
    id: number;
    medicine_name: string;
    generic_name: string;
    strength: string;
    dosage_form: string;
    prescription_required: boolean;
    is_global: boolean;
    hospital_id?: number;
    isSelected?: boolean;
    manufacturer_name?: string;
}

interface Branch {
    branch_id: number;
    branch_name: string;
}

export default function MedicationsPage() {
    const { user } = useAuth();
    const [medications, setMedications] = useState<Medication[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all' or 'my_branch'
    const [showAddModal, setShowAddModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Fetch branches to select the active one (assuming user has branches)
    const [branchId, setBranchId] = useState<number | null>(null);

    // Debounce search
    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (branchId) fetchMedications(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Handle filter or branch change
    useEffect(() => {
        if (branchId) {
            fetchMedications(1);
        }
    }, [filterType, branchId]);

    useEffect(() => {
        // Fetch branches or use user's branch
        fetchBranches();
    }, [user]);



    const fetchBranches = async () => {
        try {
            const response = await api.get('/branches');
            const data = response.data;
            let branchList: Branch[] = [];

            if (Array.isArray(data)) {
                branchList = data;
            } else if (data.data && Array.isArray(data.data.branches)) {
                branchList = data.data.branches;
            } else if (Array.isArray(data.data)) {
                branchList = data.data;
            }

            setBranches(branchList);

            if (branchList.length > 0 && !branchId) {
                setBranchId(branchList[0].branch_id);
            }
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const fetchMedications = async (page = 1) => {
        if (!branchId) return;
        setLoading(true);
        try {
            const response = await api.get(`/medications`, {
                params: {
                    branch_id: branchId,
                    page,
                    limit: 20,
                    search: searchTerm,
                    filter: filterType
                }
            });
            const { data, meta } = response.data;
            setMedications(data);
            setCurrentPage(meta.page);
            setTotalPages(meta.totalPages);
            setTotalItems(meta.total);
        } catch (error) {
            console.error('Error fetching medications:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleMedication = async (medicationId: number, currentStatus: boolean) => {
        if (!branchId) return;

        // Optimistic Update
        setMedications(prev => prev.map(m =>
            m.id === medicationId ? { ...m, isSelected: !currentStatus } : m
        ));

        try {
            await api.post('/medications/toggle', {
                branch_id: branchId,
                medication_id: medicationId,
                is_active: !currentStatus
            });
        } catch (error) {
            // Revert on failure
            setMedications(prev => prev.map(m =>
                m.id === medicationId ? { ...m, isSelected: currentStatus } : m
            ));
            alert('Failed to update medication status');
        }
    };

    // Filter Logic moved to backend for search, but client-side filter for 'my_branch' 
    // might be tricky with pagination if we only fetched a page.
    // For now, if filtered by 'my_branch', we rely on the checkbox visually
    // OR ideally, we pass a filter param to backend.
    // Given the previous requirement "Show My Branch Only", let's modify backend to support that filter if needed.
    // BUT for now, let's keep search backend-side, and we see if we can just show what we have.

    // Actually, if 'My Branch Only' is active, the backend should probably filter it.
    // But since we just implemented sorting (Selected First), user sees their meds at the top.

    // Let's stick to the current view of "All Meds" usually. 
    // If we want "My Branch Only" we should filter in backend.
    // For this step, I'll remove the client-side filtering and assume backend returns what we asked for.
    // Since we sort selected first, "My Branch Only" visual filter is less critical OR 
    // we can implement a backend filter toggle later.

    // To keep it simple and performant, I will assume the list is the source of truth.
    const displayedMedications = medications;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Medication Management</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <select
                            value={branchId || ''}
                            onChange={(e) => setBranchId(Number(e.target.value))}
                            className="text-sm text-slate-600 bg-transparent border-none focus:ring-0 cursor-pointer font-medium hover:text-slate-900"
                        >
                            {branches.map(branch => (
                                <option key={branch.branch_id} value={branch.branch_id}>
                                    {branch.branch_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-slate-700 hover:bg-gray-50 transition-colors"
                    >
                        <Upload className="w-4 h-4" />
                        Import Excel
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Medication
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by medicine name or generic name..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            // Debounced effect handles fetch
                        }}
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setFilterType('all')}
                        >
                            All Medications
                        </button>
                        <button
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === 'my_branch' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setFilterType('my_branch')}
                        >
                            My Branch Only
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm w-16">Active</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Medicine Name</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Generic Name</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Manufacturer</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Strength</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Form</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Type</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                        Loading medications...
                                    </td>
                                </tr>
                            ) : displayedMedications.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        <Pill className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-lg font-medium text-gray-700">No medications found</p>
                                        <p className="text-sm">Try adjusting your search or filters</p>
                                    </td>
                                </tr>
                            ) : (
                                displayedMedications.map((med) => (
                                    <tr key={med.id} className={`hover:bg-gray-50 transition-colors ${med.isSelected ? 'bg-blue-50/30' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={med.isSelected || false}
                                                    onChange={() => toggleMedication(med.id, med.isSelected || false)}
                                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{med.medicine_name}</div>
                                            {!med.is_global && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                                                    Custom
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{med.generic_name || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600">{med.manufacturer_name || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600">{med.strength}</td>
                                        <td className="px-6 py-4 text-gray-600">{med.dosage_form}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${med.prescription_required ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                {med.prescription_required ? 'Rx' : 'OTC'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {totalItems > 0 && (
                <div className="mt-6 flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-500">
                        Showing page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
                        <span className="ml-2 text-gray-400">({totalItems} total)</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => fetchMedications(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => fetchMedications(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Modals */}
            {showAddModal && (
                <AddNewMedicationModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    branchId={branchId}
                    onSuccess={() => fetchMedications(currentPage)}
                />
            )}

            {showImportModal && (
                <ImportMedicationModal
                    isOpen={showImportModal}
                    onClose={() => setShowImportModal(false)}
                    branchId={branchId}
                    onSuccess={() => fetchMedications(currentPage)}
                />
            )}
        </div>
    );
}
