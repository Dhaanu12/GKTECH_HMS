'use client';

import React, { useEffect, useState } from 'react';
import { Module } from '@/types/marketing';
import { getModules } from '@/lib/api/modules';
import { Edit, Plus } from 'lucide-react';

interface ModuleListProps {
    onEdit: (module: Module) => void;
}

const ModuleList: React.FC<ModuleListProps> = ({ onEdit }) => {
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchModules = async () => {
        try {
            const res = await getModules();
            if (res.success) {
                setModules(res.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchModules();
    }, []);

    if (loading) return <div>Loading modules...</div>;

    return (
        <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">System Modules</h3>
                <button
                    onClick={() => onEdit({} as Module)} // Pass empty for new
                    className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm flex items-center hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4 mr-1" /> Add Module
                </button>
            </div>
            <div className="border-t border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {modules.map((mod) => (
                            <tr key={mod.module_id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{mod.module_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{mod.module_code}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${mod.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {mod.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => onEdit(mod)} className="text-indigo-600 hover:text-indigo-900">
                                        <Edit className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ModuleList;
