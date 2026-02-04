'use client';

import React, { useState } from 'react';
import { createModule, updateModule } from '@/lib/api/modules';
import { Module } from '@/types/marketing';
import { Save } from 'lucide-react';

interface ModuleFormProps {
    module?: Module; // If present, edit mode
    onSuccess: () => void;
    onCancel: () => void;
}

const ModuleForm: React.FC<ModuleFormProps> = ({ module, onSuccess, onCancel }) => {
    const isEdit = !!module && !!module.module_id;
    const [formData, setFormData] = useState({
        module_code: module?.module_code || '',
        module_name: module?.module_name || '',
        status: module?.status || 'Active'
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEdit && module) {
                await updateModule(module.module_id, formData);
            } else {
                await createModule(formData);
            }
            onSuccess();
        } catch (error) {
            console.error(error);
            alert('Error saving module');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
            <h3 className="text-lg font-medium">{isEdit ? 'Edit Module' : 'Create Module'}</h3>
            <div>
                <label className="block text-sm font-medium">Module Name</label>
                <input
                    type="text"
                    value={formData.module_name}
                    onChange={e => setFormData({ ...formData, module_name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium">Module Code</label>
                <input
                    type="text"
                    value={formData.module_code}
                    onChange={e => setFormData({ ...formData, module_code: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                    disabled={isEdit} // Usually code shouldn't change
                />
            </div>
            <div>
                <label className="block text-sm font-medium">Status</label>
                <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center">
                    <Save className="w-4 h-4 mr-1" /> Save
                </button>
            </div>
        </form>
    );
};

export default ModuleForm;
