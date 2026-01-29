'use client';

import { useState, useEffect } from 'react';
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
    Loader2
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function NurseFeedbackPage() {
    const [activeTab, setActiveTab] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        patient_name: '',
        mrn: '',
        service_context: 'Post Consultation',
        rating: 5,
        tags: [] as string[],
        comment: ''
    });

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const fetchFeedbacks = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/feedback`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFeedbacks(response.data.data);
        } catch (error) {
            console.error('Error fetching feedbacks:', error);
        } finally {
            setLoading(false);
        }
    };

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
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            await axios.post(`${API_URL}/feedback`, {
                ...formData,
                nurse_id: user.id || user.user_id // Handle different user object structures
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Reset and refresh
            setShowModal(false);
            setFormData({
                patient_name: '',
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

    // Calculate Stats
    const totalResponses = feedbacks.length;
    const positiveCount = feedbacks.filter(f => f.sentiment === 'Positive').length;
    const positivePercentage = totalResponses > 0 ? Math.round((positiveCount / totalResponses) * 100) : 0;
    const avgRating = totalResponses > 0
        ? (feedbacks.reduce((acc, curr) => acc + curr.rating, 0) / totalResponses).toFixed(1)
        : '0.0';

    // Filter Logic
    const filteredFeedbacks = feedbacks.filter(item => {
        // Tab Filter
        let matchesTab = true;
        if (activeTab === 'Positive') matchesTab = item.sentiment === 'Positive';
        if (activeTab === 'Critical') matchesTab = item.sentiment === 'Negative' || item.rating <= 2;
        if (activeTab === 'Suggestions') matchesTab = item.sentiment === 'Neutral' || item.rating === 3;

        // Search Filter
        let matchesSearch = true;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            matchesSearch = (
                item.patient_name?.toLowerCase().includes(query) ||
                item.mrn?.toLowerCase().includes(query) ||
                item.comment?.toLowerCase().includes(query)
            );
        }

        return matchesTab && matchesSearch;
    });

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 font-heading">Patient Feedback</h1>
                    <p className="text-slate-500 text-sm mt-1">Collect and manage patient satisfaction insights.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 active:scale-95 font-bold"
                >
                    <Plus className="w-5 h-5" />
                    Collect New Feedback
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Avg Rating</p>
                        <p className="text-3xl font-bold text-slate-800">{avgRating}</p>
                    </div>
                    <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
                        <Star className="w-6 h-6 fill-current" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Responses</p>
                        <p className="text-3xl font-bold text-slate-800">{totalResponses}</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Positive Sentiment</p>
                        <p className="text-3xl font-bold text-emerald-600">{positivePercentage}%</p>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl">
                        <Smile className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                        {['All', 'Positive', 'Critical', 'Suggestions'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
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
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full md:w-64"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="divide-y divide-slate-100">
                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    ) : filteredFeedbacks.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            {feedbacks.length === 0 ? "No feedback collected yet." : "No matching feedback found."}
                        </div>
                    ) : (
                        filteredFeedbacks.map((item) => (
                            <div key={item.id} className="p-6 hover:bg-slate-50 transition-colors group">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`
                                            w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold
                                            ${item.sentiment === 'Positive' ? 'bg-emerald-50 text-emerald-600' :
                                                item.sentiment === 'Neutral' ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-600'}
                                        `}>
                                            {item.sentiment === 'Positive' ? ':)' : item.sentiment === 'Neutral' ? ':|' : ':('}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-slate-800">{item.patient_name}</h3>
                                                {item.mrn && <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{item.mrn}</span>}
                                            </div>
                                            <div className="flex items-center gap-1 mb-2">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`w-3.5 h-3.5 ${i < item.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                                ))}
                                                <span className="text-xs font-medium text-slate-400 ml-2">• {item.service_context}</span>
                                            </div>
                                            <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">"{item.comment}"</p>

                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {/* Parse tags if string, else use as array */}
                                                {(typeof item.tags === 'string' ? JSON.parse(item.tags || '[]') : item.tags || []).map((tag: string) => (
                                                    <span key={tag} className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-row md:flex-col items-center md:items-end gap-2 md:gap-1">
                                        <span className="text-xs font-bold text-slate-400">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </span>
                                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Feedback Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
                            <h2 className="text-xl font-bold text-slate-800">New Patient Feedback</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <span className="sr-only">Close</span>
                                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
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

                                                if (val.length >= 1) { // Search immediately from 1st char
                                                    axios.get(`${API_URL}/patients/search?q=${val}`, {
                                                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                                                    }).then(res => {
                                                        console.log('Search results:', res.data.data.patients);
                                                        setSearchResults(res.data.data.patients || []);
                                                    }).catch(err => console.error(err));
                                                } else {
                                                    setSearchResults([]);
                                                }
                                            }}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            autoComplete="off"
                                        />
                                        {/* Type-Ahead Dropdown */}
                                        {searchResults.length > 0 && (
                                            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto w-[200%] md:w-[150%] lg:w-full">
                                                {searchResults.map(p => (
                                                    <button
                                                        key={p.patient_id}
                                                        onClick={() => {
                                                            setFormData({
                                                                ...formData,
                                                                patient_name: `${p.first_name} ${p.last_name}`,
                                                                // @ts-ignore
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
                                                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded group-hover:bg-blue-50 group-hover:text-blue-600">
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
                                    {['Doctor Care', 'Nursing Staff', 'Wait Time', 'Cleanliness', 'Billing'].map(tag => (
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
                                onClick={() => setShowModal(false)}
                                disabled={submitting}
                                className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                {submitting ? 'Submitting...' : 'Submit Feedback'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
