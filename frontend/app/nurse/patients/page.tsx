'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, User, ChevronRight, Loader2 } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function NursePatients() {
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPatients();
    }, [searchTerm]);

    const fetchPatients = async () => {
        try {
            const token = localStorage.getItem('token');
            // Use search endpoint which is accessible to nurses
            // If searchTerm is empty, it returns default list (handled by backend)
            let url = `${API_URL}/patients/search`;
            if (searchTerm) {
                url += `?q=${searchTerm}`;
            }
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPatients(response.data.data.patients || []);
        } catch (error) {
            console.error('Error fetching patients:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
                    <p className="text-gray-600 mt-1">Search and view patient records</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search patients by name, MRN, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Patient Name</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Age/Gender</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Last Visit</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Contact</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {patients.length > 0 ? (
                                patients.map((patient) => (
                                    <tr key={patient.patient_id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                                                    {patient.first_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-900 block">{patient.first_name} {patient.last_name}</span>
                                                    <span className="text-xs text-gray-500">{patient.mrn_number}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {patient.age} / {patient.gender}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {patient.last_visit ? new Date(patient.last_visit).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {patient.contact_number}
                                        </td>
                                        <td className="px-6 py-4">
                                            <a href={`/nurse/patients/${patient.patient_id}`} className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1">
                                                View Record <ChevronRight className="w-4 h-4" />
                                            </a>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-500">
                                        <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        <p>No patients found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
