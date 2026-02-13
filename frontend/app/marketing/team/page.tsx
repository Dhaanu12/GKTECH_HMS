'use client';

import { useState, useEffect } from 'react';
import { Users, TrendingUp, UserCheck, Calendar, Loader2, Award } from 'lucide-react';
import axios from 'axios';

interface Executive {
    user_id: number;
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    phone_number: string;
    created_at: string;
    branch_name: string;
    hospital_name: string;
}

interface ExecutiveStats {
    total_doctors: number;
    total_patients: number;
    recent_doctors: number;
    recent_patients: number;
    active_doctors: number;
}

export default function MyTeamPage() {
    const [executives, setExecutives] = useState<Executive[]>([]);
    const [executiveStats, setExecutiveStats] = useState<Record<number, ExecutiveStats>>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchTeamExecutives();
    }, []);

    const fetchTeamExecutives = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/marketing/team-executives', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setExecutives(response.data.data);
                // Fetch stats for each executive
                response.data.data.forEach((exec: Executive) => {
                    fetchExecutiveStats(exec.user_id);
                });
            }
        } catch (error) {
            console.error('Error fetching team executives:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchExecutiveStats = async (executiveId: number) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/marketing/executive-stats/${executiveId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setExecutiveStats(prev => ({
                    ...prev,
                    [executiveId]: response.data.data
                }));
            }
        } catch (error) {
            console.error(`Error fetching stats for executive ${executiveId}:`, error);
        }
    };

    const filteredExecutives = executives.filter(exec =>
        `${exec.first_name} ${exec.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exec.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exec.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">My Team</h1>
                <p className="text-gray-600 mt-1">View and manage your marketing executives</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Team Size</p>
                            <h3 className="text-3xl font-bold mt-1">{executives.length}</h3>
                        </div>
                        <Users className="w-12 h-12 text-blue-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">Total Doctors</p>
                            <h3 className="text-3xl font-bold mt-1">
                                {Object.values(executiveStats).reduce((sum, stats) => sum + stats.total_doctors, 0)}
                            </h3>
                        </div>
                        <UserCheck className="w-12 h-12 text-green-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-medium">Total Patients</p>
                            <h3 className="text-3xl font-bold mt-1">
                                {Object.values(executiveStats).reduce((sum, stats) => sum + stats.total_patients, 0)}
                            </h3>
                        </div>
                        <TrendingUp className="w-12 h-12 text-purple-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm font-medium">This Month</p>
                            <h3 className="text-3xl font-bold mt-1">
                                {Object.values(executiveStats).reduce((sum, stats) => sum + stats.recent_doctors, 0)}
                            </h3>
                            <p className="text-orange-100 text-xs mt-1">New Doctors</p>
                        </div>
                        <Calendar className="w-12 h-12 text-orange-200" />
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <input
                    type="text"
                    placeholder="Search executives by name, email, or username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
            </div>

            {/* Executives List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExecutives.map((exec) => {
                    const stats = executiveStats[exec.user_id];
                    return (
                        <div key={exec.user_id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all duration-200 group">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                    {exec.first_name.charAt(0)}{exec.last_name.charAt(0)}
                                </div>
                                {stats && stats.recent_doctors > 0 && (
                                    <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                        <Award className="w-3 h-3" />
                                        Active
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <h3 className="font-bold text-lg text-gray-900 mb-1">
                                {exec.first_name} {exec.last_name}
                            </h3>
                            <p className="text-sm text-gray-500 mb-1">{exec.email}</p>
                            <p className="text-sm text-gray-500 mb-4">@{exec.username}</p>

                            {/* Stats */}
                            {stats ? (
                                <div className="pt-4 border-t border-gray-100 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Total Doctors</span>
                                        <span className="font-bold text-blue-600">{stats.total_doctors}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Total Patients</span>
                                        <span className="font-bold text-purple-600">{stats.total_patients}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Active Doctors</span>
                                        <span className="font-bold text-green-600">{stats.active_doctors}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                                        <span className="text-xs text-gray-500">Last 30 Days</span>
                                        <span className="text-xs font-semibold text-orange-600">
                                            +{stats.recent_doctors} doctors, +{stats.recent_patients} patients
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="pt-4 border-t border-gray-100 flex justify-center">
                                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                </div>
                            )}

                            {/* Footer */}
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-xs text-gray-400">
                                    Joined {new Date(exec.created_at).toLocaleDateString('en-IN', {
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredExecutives.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No executives found</p>
                </div>
            )}
        </div>
    );
}
