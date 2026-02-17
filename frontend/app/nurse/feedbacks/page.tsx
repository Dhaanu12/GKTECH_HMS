'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    MessageSquare,
    Star,
    Search,
    Plus,
    User,
    Calendar,
    ThumbsUp,
    ThumbsDown,
    Filter,
    MoreHorizontal,
    CheckCircle2,
    Smile,
    Meh,
    Frown,
    Loader2,
    Download,
    Edit3,
    Trash2,
    X,
    Check,
    MessageCircle,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    Sparkles
} from 'lucide-react';
import { AIInsightCard, AILoadingIndicator, useAI } from '@/components/ai';
import { analyzeFeedback } from '@/lib/api/ai';

const API_URL = 'http://localhost:5000/api';

interface Feedback {
    id: number;
    patient_id: number | null;
    patient_name: string;
    mrn: string | null;
    service_context: string;
    rating: number;
    tags: string;
    comment: string;
    sentiment: string;
    nurse_id: number;
    nurse_name: string;
    is_addressed: boolean;
    addressed_at: string | null;
    addressed_by_name: string | null;
    follow_up_notes: string | null;
    created_at: string;
}

interface Stats {
    total: string;
    positive: string;
    negative: string;
    neutral: string;
    addressed: string;
    avg_rating: string;
}

export default function NurseFeedbackPage() {
    // AI context - clear patient context when on feedbacks page
    let aiContext: { setPageContext?: (page: string, patient?: string) => void } = {};
    try { aiContext = useAI(); } catch { /* AIContextProvider not available */ }

    const [activeTab, setActiveTab] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState<Feedback | null>(null);
    const [showAddressModal, setShowAddressModal] = useState<Feedback | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<Feedback | null>(null);
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState<Stats | null>(null);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 20;

    // Date filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [addressedFilter, setAddressedFilter] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        patient_name: '',
        patient_id: null as number | null,
        mrn: '',
        service_context: 'Post Consultation',
        rating: 5,
        tags: [] as string[],
        comment: ''
    });

    // Address form state
    const [followUpNotes, setFollowUpNotes] = useState('');

    // Trends data
    const [trends, setTrends] = useState<any[]>([]);
    const [topTags, setTopTags] = useState<any[]>([]);
    const [showTrends, setShowTrends] = useState(false);

    // AI analysis state
    const [aiAnalysis, setAiAnalysis] = useState<Record<number, string>>({});
    const [aiAnalysisLoading, setAiAnalysisLoading] = useState<number | null>(null);

    const handleAIAnalyzeFeedback = async (feedback: Feedback) => {
        setAiAnalysisLoading(feedback.id);

        try {
            const result = await analyzeFeedback(
                feedback.rating,
                feedback.comment,
                feedback.tags ? feedback.tags.split(',').map(t => t.trim()) : []
            );

            if (result.success) {
                setAiAnalysis(prev => ({ ...prev, [feedback.id]: result.message }));
            } else {
                setAiAnalysis(prev => ({ ...prev, [feedback.id]: result.message }));
            }
        } catch (err) {
            setAiAnalysis(prev => ({ ...prev, [feedback.id]: 'Failed to analyze feedback.' }));
        } finally {
            setAiAnalysisLoading(null);
        }
    };

    const fetchFeedbacks = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const params: Record<string, any> = {
                page,
                limit,
                search: searchQuery || undefined
            };

            // Add filters
            if (activeTab !== 'All') {
                params.sentiment = activeTab;
            }
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            if (addressedFilter) params.addressed = addressedFilter;

            const response = await axios.get(`${API_URL}/feedback`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });

            setFeedbacks(response.data.data || []);
            setStats(response.data.stats);
            setTotalPages(response.data.pagination?.totalPages || 1);
        } catch (error) {
            console.error('Error fetching feedbacks:', error);
        } finally {
            setLoading(false);
        }
    }, [page, searchQuery, activeTab, startDate, endDate, addressedFilter]);

    useEffect(() => {
        fetchFeedbacks();
    }, [fetchFeedbacks]);

    // Set AI context for feedbacks page (clears patient-specific context)
    useEffect(() => {
        if (aiContext.setPageContext && !loading && stats) {
            const feedbackContext = `Viewing Patient Feedbacks page. ` +
                `Summary: ${stats.total} total feedbacks, ${stats.positive} positive, ${stats.negative} negative, ${stats.neutral} neutral. ` +
                `Average rating: ${stats.avg_rating}/5. Addressed: ${stats.addressed}. ` +
                `Note: This is a feedbacks list. No specific patient is currently selected. ` +
                `To help with a specific patient, ask for the patient name or MRN, or use searchPatients tool.`;
            aiContext.setPageContext('/nurse/feedbacks', feedbackContext);
        }
    }, [aiContext.setPageContext, loading, stats]);

    const fetchTrends = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/feedback/stats/trends`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { days: 30 }
            });
            setTrends(response.data.data.trends || []);
            setTopTags(response.data.data.topTags || []);
        } catch (error) {
            console.error('Error fetching trends:', error);
        }
    }, []);

    useEffect(() => {
        if (showTrends) {
            fetchTrends();
        }
    }, [showTrends, fetchTrends]);

    const handleTagToggle = (tag: string) => {
        setFormData(prev => {
            if (prev.tags.includes(tag)) {
                return { ...prev, tags: prev.tags.filter(t => t !== tag) };
            } else {
                return { ...prev, tags: [...prev.tags, tag] };
            }
        });
    };

    const handleSubmit = async () => {
        if (!formData.patient_name || !formData.comment) {
            alert('Please fill in Patient Name and Comments');
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');

            await axios.post(`${API_URL}/feedback`, {
                ...formData,
                patient_id: formData.patient_id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowModal(false);
            setFormData({
                patient_name: '',
                patient_id: null,
                mrn: '',
                service_context: 'Post Consultation',
                rating: 5,
                tags: [],
                comment: ''
            });
            fetchFeedbacks();

        } catch (error) {
            console.error('Error submitting feedback:', error);
            alert('Failed to submit feedback');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async () => {
        if (!showEditModal) return;

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_URL}/feedback/${showEditModal.id}`, {
                patient_name: formData.patient_name,
                service_context: formData.service_context,
                rating: formData.rating,
                tags: formData.tags,
                comment: formData.comment
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowEditModal(null);
            fetchFeedbacks();
        } catch (error) {
            console.error('Error updating feedback:', error);
            alert('Failed to update feedback');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddress = async () => {
        if (!showAddressModal) return;

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_URL}/feedback/${showAddressModal.id}/address`, {
                is_addressed: true,
                follow_up_notes: followUpNotes
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowAddressModal(null);
            setFollowUpNotes('');
            fetchFeedbacks();
        } catch (error) {
            console.error('Error addressing feedback:', error);
            alert('Failed to address feedback');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!showDeleteConfirm) return;

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/feedback/${showDeleteConfirm.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowDeleteConfirm(null);
            fetchFeedbacks();
        } catch (error) {
            console.error('Error deleting feedback:', error);
            alert('Failed to delete feedback');
        } finally {
            setSubmitting(false);
        }
    };

    const handleExport = async () => {
        try {
            const token = localStorage.getItem('token');
            const params: Record<string, any> = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            if (activeTab !== 'All') params.sentiment = activeTab;

            const response = await axios.get(`${API_URL}/feedback/export`, {
                headers: { Authorization: `Bearer ${token}` },
                params,
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `feedback_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting feedback:', error);
            alert('Failed to export feedback');
        }
    };

    const openEditModal = (feedback: Feedback) => {
        setFormData({
            patient_name: feedback.patient_name,
            patient_id: feedback.patient_id,
            mrn: feedback.mrn || '',
            service_context: feedback.service_context,
            rating: feedback.rating,
            tags: typeof feedback.tags === 'string' ? JSON.parse(feedback.tags || '[]') : feedback.tags || [],
            comment: feedback.comment
        });
        setShowEditModal(feedback);
    };

    // Calculate display stats
    const totalResponses = stats ? parseInt(stats.total) : 0;
    const positiveCount = stats ? parseInt(stats.positive) : 0;
    const positivePercentage = totalResponses > 0 ? Math.round((positiveCount / totalResponses) * 100) : 0;
    const avgRating = stats?.avg_rating || '0.0';
    const addressedCount = stats ? parseInt(stats.addressed) : 0;

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 font-heading">Patient Feedback</h1>
                    <p className="text-slate-500 text-sm mt-1">Collect and manage patient satisfaction insights.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowTrends(!showTrends)}
                        className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl transition-all font-medium text-sm ${showTrends
                            ? 'bg-violet-50 border-violet-200 text-violet-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <TrendingUp className="w-4 h-4" />
                        Trends
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-medium text-sm"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 active:scale-95 font-bold"
                    >
                        <Plus className="w-5 h-5" />
                        Collect New Feedback
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#D97706] p-5 rounded-2xl shadow-sm flex items-center justify-between text-white">
                    <div>
                        <p className="text-white/90 text-xs font-bold uppercase tracking-wider mb-1">Avg Rating</p>
                        <p className="text-3xl font-bold text-white">{avgRating}</p>
                    </div>
                    <div className="p-3 bg-white/20 text-white rounded-xl backdrop-blur-sm">
                        <Star className="w-6 h-6 fill-current" />
                    </div>
                </div>
                <div className="bg-[#146AF5] p-5 rounded-2xl shadow-sm flex items-center justify-between text-white">
                    <div>
                        <p className="text-white/90 text-xs font-bold uppercase tracking-wider mb-1">Total Responses</p>
                        <p className="text-3xl font-bold text-white">{totalResponses}</p>
                    </div>
                    <div className="p-3 bg-white/20 text-white rounded-xl backdrop-blur-sm">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-[#009A66] p-5 rounded-2xl shadow-sm flex items-center justify-between text-white">
                    <div>
                        <p className="text-white/90 text-xs font-bold uppercase tracking-wider mb-1">Positive</p>
                        <p className="text-3xl font-bold text-white">{positivePercentage}%</p>
                    </div>
                    <div className="p-3 bg-white/20 text-white rounded-xl backdrop-blur-sm">
                        <Smile className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-[#7C3AED] p-5 rounded-2xl shadow-sm flex items-center justify-between text-white">
                    <div>
                        <p className="text-white/90 text-xs font-bold uppercase tracking-wider mb-1">Addressed</p>
                        <p className="text-3xl font-bold text-white">{addressedCount}</p>
                    </div>
                    <div className="p-3 bg-white/20 text-white rounded-xl backdrop-blur-sm">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Trends Panel */}
            {showTrends && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-top-4 duration-300">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-violet-500" />
                            30-Day Feedback Trends
                        </h2>
                    </div>
                    <div className="p-6">
                        {trends.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Sentiment Chart */}
                                <div className="lg:col-span-2">
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Daily Sentiment</h3>
                                    <div className="h-48 flex items-end gap-1">
                                        {trends.slice(-14).map((day, i) => {
                                            const total = parseInt(day.total) || 1;
                                            const positive = parseInt(day.positive) || 0;
                                            const negative = parseInt(day.negative) || 0;
                                            const neutral = parseInt(day.neutral) || 0;
                                            const maxHeight = Math.max(...trends.slice(-14).map(d => parseInt(d.total) || 1));
                                            const heightPercent = (total / maxHeight) * 100;

                                            return (
                                                <div key={i} className="flex-1 flex flex-col items-center group relative">
                                                    <div
                                                        className="w-full rounded-t-md overflow-hidden flex flex-col-reverse"
                                                        style={{ height: `${heightPercent}%`, minHeight: '8px' }}
                                                    >
                                                        {negative > 0 && (
                                                            <div
                                                                className="bg-red-400 w-full"
                                                                style={{ height: `${(negative / total) * 100}%` }}
                                                            />
                                                        )}
                                                        {neutral > 0 && (
                                                            <div
                                                                className="bg-slate-300 w-full"
                                                                style={{ height: `${(neutral / total) * 100}%` }}
                                                            />
                                                        )}
                                                        {positive > 0 && (
                                                            <div
                                                                className="bg-emerald-400 w-full"
                                                                style={{ height: `${(positive / total) * 100}%` }}
                                                            />
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 mt-1 truncate w-full text-center">
                                                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </span>

                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                                        <p className="font-bold">{new Date(day.date).toLocaleDateString()}</p>
                                                        <p className="text-emerald-300">Positive: {positive}</p>
                                                        <p className="text-slate-300">Neutral: {neutral}</p>
                                                        <p className="text-red-300">Negative: {negative}</p>
                                                        <p className="text-amber-300">Avg: {day.avg_rating}★</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex items-center justify-center gap-6 mt-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded bg-emerald-400" />
                                            <span className="text-xs text-slate-500">Positive</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded bg-slate-300" />
                                            <span className="text-xs text-slate-500">Neutral</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded bg-red-400" />
                                            <span className="text-xs text-slate-500">Negative</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Top Tags */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Top Mentioned Tags</h3>
                                    {topTags.length > 0 ? (
                                        <div className="space-y-3">
                                            {topTags.slice(0, 5).map((tag, i) => {
                                                const maxCount = parseInt(topTags[0]?.count) || 1;
                                                const percent = (parseInt(tag.count) / maxCount) * 100;
                                                return (
                                                    <div key={i}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-sm font-medium text-slate-600">{tag.tag}</span>
                                                            <span className="text-sm font-bold text-slate-800">{tag.count}</span>
                                                        </div>
                                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-violet-500 rounded-full transition-all"
                                                                style={{ width: `${percent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400">No tags data available</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <TrendingUp className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                <p>No trend data available yet</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 space-y-4 bg-slate-50/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                            {['All', 'Positive', 'Critical', 'Suggestions'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveTab(tab); setPage(1); }}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab
                                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                                        : 'text-slate-500 hover:bg-slate-100'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search patients..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full md:w-64"
                            />
                        </div>
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                placeholder="Start Date"
                            />
                            <span className="text-slate-400">to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <select
                            value={addressedFilter}
                            onChange={(e) => { setAddressedFilter(e.target.value); setPage(1); }}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        >
                            <option value="">All Status</option>
                            <option value="true">Addressed</option>
                            <option value="false">Pending</option>
                        </select>
                        {(startDate || endDate || addressedFilter) && (
                            <button
                                onClick={() => { setStartDate(''); setEndDate(''); setAddressedFilter(''); setPage(1); }}
                                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>

                {/* List */}
                <div className="divide-y divide-slate-100">
                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    ) : feedbacks.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            No feedback found.
                        </div>
                    ) : (
                        feedbacks.map((item) => (
                            <div key={item.id} className="p-6 hover:bg-slate-50 transition-colors group">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className={`
                                            w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
                                            ${item.sentiment === 'Positive' ? 'bg-emerald-50 text-emerald-600' :
                                                item.sentiment === 'Neutral' ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-600'}
                                        `}>
                                            {item.sentiment === 'Positive' ? <Smile className="w-6 h-6" /> :
                                                item.sentiment === 'Neutral' ? <Meh className="w-6 h-6" /> : <Frown className="w-6 h-6" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <h3 className="font-bold text-slate-800">{item.patient_name}</h3>
                                                {item.mrn && <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{item.mrn}</span>}
                                                {item.is_addressed && (
                                                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                        <Check className="w-3 h-3" /> Addressed
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 mb-2">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`w-3.5 h-3.5 ${i < item.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                                ))}
                                                <span className="text-xs font-medium text-slate-400 ml-2">• {item.service_context}</span>
                                                <span className="text-xs text-slate-400 ml-2">• by {item.nurse_name || 'Staff'}</span>
                                            </div>
                                            <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">"{item.comment}"</p>

                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {(typeof item.tags === 'string' ? JSON.parse(item.tags || '[]') : item.tags || []).map((tag: string) => (
                                                    <span key={tag} className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>

                                            {item.follow_up_notes && (
                                                <div className="mt-3 p-3 bg-violet-50 rounded-lg border border-violet-100">
                                                    <p className="text-xs text-violet-700">
                                                        <span className="font-semibold">Follow-up:</span> {item.follow_up_notes}
                                                    </p>
                                                    {item.addressed_by_name && (
                                                        <p className="text-xs text-violet-500 mt-1">
                                                            — {item.addressed_by_name}, {item.addressed_at ? new Date(item.addressed_at).toLocaleDateString() : ''}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* AI Analysis Button & Display */}
                                            <div className="mt-3">
                                                {aiAnalysisLoading === item.id ? (
                                                    <AILoadingIndicator text="Analyzing feedback..." variant="compact" />
                                                ) : aiAnalysis[item.id] ? (
                                                    <AIInsightCard
                                                        title="AI Analysis"
                                                        content={aiAnalysis[item.id]}
                                                        type="info"
                                                        onDismiss={() => setAiAnalysis(prev => {
                                                            const newState = { ...prev };
                                                            delete newState[item.id];
                                                            return newState;
                                                        })}
                                                        className="mt-2"
                                                    />
                                                ) : (
                                                    <button
                                                        onClick={() => handleAIAnalyzeFeedback(item)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                                        title="Get AI analysis and response suggestion"
                                                    >
                                                        <Sparkles className="w-3.5 h-3.5" />
                                                        AI Analyze & Suggest Response
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-row md:flex-col items-center md:items-end gap-2">
                                        <span className="text-xs font-bold text-slate-400">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {!item.is_addressed && (
                                                <button
                                                    onClick={() => setShowAddressModal(item)}
                                                    className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                                    title="Mark as Addressed"
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openEditModal(item)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setShowDeleteConfirm(item)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <p className="text-sm text-slate-500">
                            Page {page} of {totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* New Feedback Modal */}
            {showModal && (
                <FeedbackFormModal
                    title="New Patient Feedback"
                    formData={formData}
                    setFormData={setFormData}
                    searchResults={searchResults}
                    setSearchResults={setSearchResults}
                    onSubmit={handleSubmit}
                    onClose={() => setShowModal(false)}
                    submitting={submitting}
                    handleTagToggle={handleTagToggle}
                />
            )}

            {/* Edit Feedback Modal */}
            {showEditModal && (
                <FeedbackFormModal
                    title="Edit Feedback"
                    formData={formData}
                    setFormData={setFormData}
                    searchResults={searchResults}
                    setSearchResults={setSearchResults}
                    onSubmit={handleUpdate}
                    onClose={() => setShowEditModal(null)}
                    submitting={submitting}
                    handleTagToggle={handleTagToggle}
                    isEdit
                />
            )}

            {/* Address Feedback Modal */}
            {showAddressModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-800">Mark as Addressed</h2>
                            <p className="text-sm text-slate-500 mt-1">
                                Feedback from {showAddressModal.patient_name}
                            </p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <p className="text-sm text-slate-600">"{showAddressModal.comment}"</p>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                    Follow-up Notes
                                </label>
                                <textarea
                                    value={followUpNotes}
                                    onChange={(e) => setFollowUpNotes(e.target.value)}
                                    placeholder="Describe actions taken or response given..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none resize-none"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 flex gap-3">
                            <button
                                onClick={() => { setShowAddressModal(null); setFollowUpNotes(''); }}
                                disabled={submitting}
                                className="flex-1 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddress}
                                disabled={submitting}
                                className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Mark Addressed
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-300">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Delete Feedback?</h2>
                            <p className="text-sm text-slate-500">
                                This will permanently delete the feedback from {showDeleteConfirm.patient_name}. This action cannot be undone.
                            </p>
                        </div>
                        <div className="p-6 border-t border-slate-100 flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                disabled={submitting}
                                className="flex-1 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={submitting}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Extracted Feedback Form Modal Component
function FeedbackFormModal({
    title,
    formData,
    setFormData,
    searchResults,
    setSearchResults,
    onSubmit,
    onClose,
    submitting,
    handleTagToggle,
    isEdit = false
}: {
    title: string;
    formData: any;
    setFormData: (data: any) => void;
    searchResults: any[];
    setSearchResults: (data: any[]) => void;
    onSubmit: () => void;
    onClose: () => void;
    submitting: boolean;
    handleTagToggle: (tag: string) => void;
    isEdit?: boolean;
}) {
    const API_URL = 'http://localhost:5000/api';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
                    <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto">
                    {/* Patient Inputs */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Patient Details</label>
                        <div className="grid grid-cols-2 gap-3 relative">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Patient Name *"
                                    value={formData.patient_name}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData({ ...formData, patient_name: val });

                                        if (val.length >= 1 && !isEdit) {
                                            axios.get(`${API_URL}/patients/search?q=${val}`, {
                                                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                                            }).then(res => {
                                                setSearchResults(res.data.data.patients || []);
                                            }).catch(err => console.error(err));
                                        } else {
                                            setSearchResults([]);
                                        }
                                    }}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    autoComplete="off"
                                    disabled={isEdit}
                                />
                                {searchResults.length > 0 && (
                                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                        {searchResults.map((p: any) => (
                                            <button
                                                key={p.patient_id}
                                                onClick={() => {
                                                    setFormData({
                                                        ...formData,
                                                        patient_name: `${p.first_name} ${p.last_name}`,
                                                        patient_id: p.patient_id,
                                                        mrn: p.mrn_number
                                                    });
                                                    setSearchResults([]);
                                                }}
                                                className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex justify-between items-center group"
                                            >
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700 group-hover:text-blue-600">{p.first_name} {p.last_name}</p>
                                                    <p className="text-xs text-slate-500">{p.contact_number}</p>
                                                </div>
                                                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">
                                                    {p.mrn_number}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <input
                                type="text"
                                placeholder="MRN (Optional)"
                                value={formData.mrn}
                                onChange={(e) => setFormData({ ...formData, mrn: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                disabled={isEdit}
                            />
                        </div>
                    </div>

                    {/* Service Type */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Service Context</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['Post Consultation', 'Post Treatment'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFormData({ ...formData, service_context: type })}
                                    className={`py-2.5 rounded-xl font-bold text-sm border transition-all ${formData.service_context === type
                                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rating */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Overall Experience</label>
                        <div className="flex items-center justify-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setFormData({ ...formData, rating: star })}
                                    className="group p-1 transition-transform hover:scale-110"
                                >
                                    <Star className={`w-8 h-8 transition-colors ${formData.rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Quick Tags</label>
                        <div className="flex flex-wrap gap-2">
                            {['Doctor Care', 'Nursing Staff', 'Wait Time', 'Cleanliness', 'Billing', 'Facilities', 'Communication'].map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => handleTagToggle(tag)}
                                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${formData.tags.includes(tag)
                                        ? 'bg-slate-800 text-white border-slate-800'
                                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Comments */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Patient Comments *</label>
                        <textarea
                            className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none placeholder:text-slate-400"
                            placeholder="Type exactly what the patient said..."
                            value={formData.comment}
                            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                        ></textarea>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-4 rounded-b-3xl">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={submitting}
                        className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
                    >
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                        {submitting ? 'Saving...' : (isEdit ? 'Update Feedback' : 'Submit Feedback')}
                    </button>
                </div>
            </div>
        </div>
    );
}
