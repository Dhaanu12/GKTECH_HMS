'use client';

import { useState, useEffect } from 'react';
import { Plus, Users, Loader2, Edit2, Shield, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { getUsers, createUser } from '@/lib/api/users';
import { getHospitals } from '@/lib/api/hospitals';
import { getBranches } from '@/lib/api/branches';

export default function MarketingManagement() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'executives' | 'managers'>('executives');
    const [marketingUsers, setMarketingUsers] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [selectedHospitalId, setSelectedHospitalId] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        phone_number: '',
        password: '',
        role_code: 'MRKT_EXEC',
        hospital_id: '',
        branch_id: ''
    });
    const [errors, setErrors] = useState<any>({});
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (user) {
            fetchMarketingUsers();
            if (user.role_code === 'SUPER_ADMIN') {
                fetchHospitals();
            } else if (user.role_code === 'CLIENT_ADMIN') {
                // Pre-fill hospital for client admin
                setFormData(prev => ({ ...prev, hospital_id: user.hospital_id?.toString() || '' }));
                fetchBranches(user.hospital_id?.toString() || '');
            }
        }
    }, [user, activeTab]); // Reload when tab changes just in case

    const fetchMarketingUsers = async () => {
        setLoading(true);
        try {
            // Filter by role based on active tab? 
            // Better to fetch both and filter locally or fetch specific.
            // getUsers API supports generic filters. 
            // Let's fetch all relevant roles.
            const res = await getUsers({
                role_code: activeTab === 'managers' ? 'MRKT_MNGR' : 'MRKT_EXEC',
                hospital_id: user?.role_code === 'CLIENT_ADMIN' ? (user.hospital_id?.toString() || undefined) : (selectedHospitalId || undefined)
            });

            if (res.success) {
                setMarketingUsers(res.data);
            }
        } catch (error) {
            console.error('Error_fetching_marketing_users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHospitals = async () => {
        try {
            const res = await getHospitals();
            if (res.success) setHospitals(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchBranches = async (hospitalId: string) => {
        if (!hospitalId) return;
        try {
            const res = await getBranches(hospitalId);
            if (res.success) setBranches(res.data);
        } catch (error) { console.error(error); }
    };

    const handleHospitalChange = (val: string) => {
        setSelectedHospitalId(val);
        setFormData(prev => ({ ...prev, hospital_id: val, branch_id: '' }));
        fetchBranches(val);
        // Also refresh list if filter applies
        setLoading(true); // Artificial loading trigger
        setTimeout(() => fetchMarketingUsers(), 100);
    };

    const validateForm = () => {
        const newErrors: any = {};
        if (!formData.first_name) newErrors.first_name = 'Required';
        if (!formData.last_name) newErrors.last_name = 'Required';
        if (!formData.username) newErrors.username = 'Required';
        if (!formData.email) newErrors.email = 'Required';
        if (!formData.password) newErrors.password = 'Required';
        if (user?.role_code === 'SUPER_ADMIN' && !formData.hospital_id) newErrors.hospital_id = 'Required';
        if (!formData.branch_id) newErrors.branch_id = 'Required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const res = await createUser(formData);
            if (res.success) {
                setMessage('User created successfully');
                setShowModal(false);
                fetchMarketingUsers();
                resetForm();
            } else {
                setMessage('Failed to create user');
            }
        } catch (error: any) {
            setMessage(error.response?.data?.message || 'Error creating user');
        } finally {
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const resetForm = () => {
        setFormData({
            first_name: '', last_name: '', username: '', email: '', phone_number: '',
            password: '',
            role_code: activeTab === 'managers' ? 'MRKT_MNGR' : 'MRKT_EXEC',
            hospital_id: user?.role_code === 'CLIENT_ADMIN' ? (user.hospital_id?.toString() || '') : '',
            branch_id: ''
        });
        setErrors({});
    };

    // Filter branches for select
    const branchOptions = branches.map(b => ({ value: b.branch_id, label: b.branch_name }));

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Marketing Team</h1>
                    <p className="text-gray-600 text-sm mt-1">Manage marketing executives and managers</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 text-white rounded-lg transition font-medium shadow-lg ${activeTab === 'managers'
                        ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'
                        }`}
                >
                    <Plus className="w-5 h-5" />
                    {activeTab === 'managers' ? 'Add Manager' : 'Add Executive'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-fit mb-8">
                <button
                    onClick={() => setActiveTab('executives')}
                    className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'executives'
                        ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    <Users className="w-4 h-4" />
                    Executives
                </button>
                <button
                    onClick={() => setActiveTab('managers')}
                    className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'managers'
                        ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    <Shield className="w-4 h-4" />
                    Managers
                </button>
            </div>

            {/* Filter for Super Admin */}
            {user?.role_code === 'SUPER_ADMIN' && (
                <div className="mb-6 w-full max-w-md bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Filter by Hospital</label>
                    <SearchableSelect
                        options={[{ value: '', label: 'All Hospitals' }, ...hospitals.map(h => ({ value: h.hospital_id, label: h.hospital_name }))]}
                        value={selectedHospitalId}
                        onChange={(val) => {
                            setSelectedHospitalId(val);
                            // trigger fetch
                            setTimeout(fetchMarketingUsers, 100);
                        }}
                        placeholder="Select Hospital"
                    />
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {marketingUsers.map((u: any) => (
                        <div key={u.user_id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition group">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${u.role_code === 'MRKT_MNGR' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'
                                    }`}>
                                    {u.role_code === 'MRKT_MNGR' ? <Shield className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                                </div>
                                <button className="text-gray-400 hover:text-gray-600">
                                    <Edit2 className="w-5 h-5" />
                                </button>
                            </div>
                            <h3 className="font-semibold text-lg text-gray-900 mb-1">
                                {u.first_name} {u.last_name}
                            </h3>
                            <p className="text-sm text-gray-500 mb-3">{u.email}</p>

                            <div className="pt-4 border-t border-gray-50 flex flex-col gap-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Username</span>
                                    <span className="font-medium">{u.username}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Branch</span>
                                    <span className="font-medium text-right truncate max-w-[150px]">{u.branch_name || 'N/A'}</span>
                                </div>
                                {user?.role_code === 'SUPER_ADMIN' && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Hospital</span>
                                        <span className="font-medium text-right truncate max-w-[150px]">{u.hospital_name || 'N/A'}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {marketingUsers.length === 0 && (
                        <div className="col-span-3 text-center py-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            No marketing users found.
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className={`p-6 border-b ${activeTab === 'managers' ? 'bg-blue-50 border-blue-100' : 'bg-indigo-50 border-indigo-100'}`}>
                            <h2 className={`text-xl font-bold ${activeTab === 'managers' ? 'text-blue-800' : 'text-indigo-800'}`}>
                                New Marketing {activeTab === 'managers' ? 'Manager' : 'Executive'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {message && <div className={`p-3 rounded text-sm ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message}</div>}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">First Name</label>
                                    <input
                                        className="w-full border p-2 rounded focus:ring-2 ring-indigo-500 outline-none"
                                        value={formData.first_name}
                                        onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                    />
                                    {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Last Name</label>
                                    <input
                                        className="w-full border p-2 rounded focus:ring-2 ring-indigo-500 outline-none"
                                        value={formData.last_name}
                                        onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                    />
                                    {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Username</label>
                                    <input
                                        className="w-full border p-2 rounded focus:ring-2 ring-indigo-500 outline-none"
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    />
                                    {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Password</label>
                                    <input
                                        type="password"
                                        className="w-full border p-2 rounded focus:ring-2 ring-indigo-500 outline-none"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                    {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email</label>
                                    <input
                                        type="email"
                                        className="w-full border p-2 rounded focus:ring-2 ring-indigo-500 outline-none"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Phone</label>
                                    <input
                                        className="w-full border p-2 rounded focus:ring-2 ring-indigo-500 outline-none"
                                        value={formData.phone_number}
                                        onChange={e => {
                                            const value = e.target.value.replace(/\D/g, "");
                                            if (value.length <= 10) {
                                                setFormData({ ...formData, phone_number: value });
                                            }
                                        }}
                                        maxLength={10}
                                        placeholder="10-digit number"
                                    />
                                </div>
                            </div>

                            {/* Hospital Select (only if Super Admin) */}
                            {user?.role_code === 'SUPER_ADMIN' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Hospital</label>
                                    <SearchableSelect
                                        options={hospitals.map(h => ({ value: h.hospital_id, label: h.hospital_name }))}
                                        value={formData.hospital_id}
                                        onChange={val => {
                                            setFormData({ ...formData, hospital_id: val, branch_id: '' });
                                            fetchBranches(val);
                                        }}
                                        placeholder="Select Hospital"
                                    />
                                    {errors.hospital_id && <p className="text-xs text-red-500 mt-1">{errors.hospital_id}</p>}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1">Branch</label>
                                <SearchableSelect
                                    options={branchOptions}
                                    value={formData.branch_id}
                                    onChange={val => setFormData({ ...formData, branch_id: val })}
                                    placeholder={user?.role_code === 'SUPER_ADMIN' && !formData.hospital_id ? "Select Hospital First" : "Select Branch"}
                                    disabled={user?.role_code === 'SUPER_ADMIN' && !formData.hospital_id}
                                />
                                {errors.branch_id && <p className="text-xs text-red-500 mt-1">{errors.branch_id}</p>}
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
                                <button
                                    type="submit"
                                    className={`px-4 py-2 text-white rounded hover:opacity-90 ${activeTab === 'managers' ? 'bg-blue-600' : 'bg-indigo-600'}`}
                                >
                                    Create User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
