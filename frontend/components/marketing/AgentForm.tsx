'use client';

import React, { useState } from 'react';
import { createReferralAgent, updateReferralAgent } from '@/lib/api/marketing';
import { ReferralAgent } from '@/types/marketing';
import { Save, User, Building, Phone, Mail, Briefcase, FileText, CreditCard, Upload } from 'lucide-react';

interface AgentFormProps {
    agent?: ReferralAgent;
    onSuccess: () => void;
    onCancel: () => void;
}

const AgentForm: React.FC<AgentFormProps> = ({ agent, onSuccess, onCancel }) => {
    const isEdit = !!agent;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: agent?.name || '',
        mobile: agent?.mobile || '',
        company: agent?.company || '',
        role: agent?.role || '',
        remarks: agent?.remarks || '',
        email: agent?.email || '',
        status: agent?.status || 'Active',
        bank_name: agent?.bank_name || '',
        bank_branch: agent?.bank_branch || '',
        bank_account_number: agent?.bank_account_number || '',
        bank_ifsc_code: agent?.bank_ifsc_code || '',
        pan_card_number: agent?.pan_card_number || '',
        pan_upload_path: agent?.pan_upload_path || ''
    });

    const [panFile, setPanFile] = useState<File | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'mobile') {
            const numericValue = value.replace(/\D/g, '').slice(0, 10);
            setFormData({ ...formData, [name]: numericValue });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPanFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (key !== 'pan_upload_path') {
                    data.append(key, value || '');
                }
            });
            if (panFile) {
                data.append('pan', panFile);
            }
            // Preserve existing path if no new file is selected, though backend handles COALESCE usually.
            // But for FormData, we usually don't send the path string if we want to keep it, or we send it.
            // Our backend code uses: pan_upload_path = req.files['pan'] ? ... : req.body.pan_upload_path.
            // So if we don't send file, we SHOULD send the old path in body if we want to be explicit, or rely on undefined check.
            // In updateReferralAgent: pan_upload_path = COALESCE($13, pan_upload_path). $13 comes from req.files or req.body.
            // If req.files is undefined, it checks req.body.pan_upload_path.
            // So safe to append it.
            if (formData.pan_upload_path && !panFile) {
                data.append('pan_upload_path', formData.pan_upload_path);
            }

            if (isEdit && agent) {
                await updateReferralAgent(agent.id, data); // Type assertion might be needed if updateReferralAgent expects object not FormData in TS definition?
            } else {
                await createReferralAgent(data);
            }
            onSuccess();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to save agent details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-100 mb-6">
                <h2 className="text-xl font-bold text-gray-800">{isEdit ? 'Edit Agent Details' : 'Add New Referral Agent'}</h2>
            </div>

            {error && (
                <div className="mx-6 mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
                    {error}
                </div>
            )}

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Details */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input name="name" value={formData.name} onChange={handleChange} required
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50/50" placeholder="Agent Name" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input name="mobile" value={formData.mobile} onChange={handleChange} required
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50/50" placeholder="Mobile Number" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company / Organization</label>
                    <div className="relative">
                        <Building className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input name="company" value={formData.company} onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50/50" placeholder="Company Name" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role / Designation *</label>
                    <div className="relative">
                        <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                        <select name="role" value={formData.role} onChange={handleChange} required
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50/50 appearance-none">
                            <option value="">-- Select Role --</option>
                            <optgroup label="Clinics / Hospitals">
                                <option value="Doctor (General Physician)">Doctor (General Physician)</option>
                                <option value="Specialist Doctor">Specialist Doctor</option>
                                <option value="Clinic Manager">Clinic Manager</option>
                                <option value="Clinic Administrator">Clinic Administrator</option>
                                <option value="Pathologist / Lab Director">Pathologist / Lab Director</option>
                            </optgroup>
                            <optgroup label="Corporates / Offices">
                                <option value="HR Manager">HR Manager</option>
                                <option value="Corporate Wellness Coordinator">Corporate Wellness Coordinator</option>
                                <option value="Finance / Procurement Head">Finance / Procurement Head</option>
                            </optgroup>
                            <optgroup label="Diagnostics / Other Centers">
                                <option value="Radiologist / Imaging Center Owner">Radiologist / Imaging Center Owner</option>
                                <option value="Lab Technician / Supervisor">Lab Technician / Supervisor</option>
                                <option value="Referral Coordinator">Referral Coordinator</option>
                                <option value="Business Development Executive">Business Development Executive</option>
                            </optgroup>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input type="email" name="email" value={formData.email} onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50/50" placeholder="Email Address" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <div className="relative">
                        <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg bg-gray-50/50">
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows={2}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50/50" placeholder="Additional notes..." />
                    </div>
                </div>

                {/* Divider for Bank Details */}
                <div className="md:col-span-2 mt-4 mb-2">
                    <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Bank & Identity Details (Optional)</h3>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <div className="relative">
                        <Building className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input name="bank_name" value={formData.bank_name} onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50/50" placeholder="Bank Name" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                    <div className="relative">
                        <input name="bank_branch" value={formData.bank_branch} onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50/50" placeholder="Branch Name" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <div className="relative">
                        <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input name="bank_account_number" value={formData.bank_account_number} onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50/50" placeholder="Account Number" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                    <div className="relative">
                        <input name="bank_ifsc_code" value={formData.bank_ifsc_code} onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50/50" placeholder="IFSC Code" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PAN Card Number</label>
                    <div className="relative">
                        <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input name="pan_card_number" value={formData.pan_card_number} onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50/50" placeholder="PAN Number" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PAN Card Upload</label>
                    <div className="relative flex items-center gap-2">
                        <Upload className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input type="file" onChange={handleFileChange} accept="image/*,.pdf"
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50/50 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    </div>
                    {formData.pan_upload_path && (
                        <div className="mt-1 text-xs text-green-600">
                            Current file: ...{formData.pan_upload_path.split(/[\/\\]/).pop()}
                        </div>
                    )}
                </div>

            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                <button type="button" onClick={onCancel} className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition shadow-sm">
                    Cancel
                </button>
                <button type="submit" disabled={loading} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-md flex items-center gap-2">
                    <Save size={18} />
                    {loading ? 'Saving...' : (isEdit ? 'Update Agent' : 'Save Agent')}
                </button>
            </div>
        </form>
    );
};

export default AgentForm;
