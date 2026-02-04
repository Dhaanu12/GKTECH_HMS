'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface LeadFormModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LeadFormModal({ isOpen, onClose }: LeadFormModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        mobile_number: '',
        hospital_name: '',
        address: '',
        email: '',
        description: '',
        demo_date: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'mobile_number') {
            // Only allow numbers and max 10 chars
            const re = /^[0-9\b]+$/;
            if (value === '' || (re.test(value) && value.length <= 10)) {
                setFormData(prev => ({ ...prev, [name]: value }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!formData.name || !formData.mobile_number) {
            setError('Name and Mobile Number are required.');
            setLoading(false);
            return;
        }

        if (formData.mobile_number.length !== 10) {
            setError('Mobile Number must be 10 digits.');
            setLoading(false);
            return;
        }

        try {
            await axios.post('/api/leads', formData);
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onClose();
                setFormData({
                    name: '',
                    mobile_number: '',
                    hospital_name: '',
                    address: '',
                    email: '',
                    description: '',
                    demo_date: ''
                });
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 flex items-center justify-center z-[70] p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white/90 backdrop-blur-xl border border-white/50 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-slate-100">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">Request a Demo</h3>
                                    <p className="text-sm text-slate-500">Fill in the details below to get started.</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                                {success ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                        <div className="bg-green-100 p-4 rounded-full text-green-600 mb-4">
                                            <CheckCircle2 size={48} />
                                        </div>
                                        <h4 className="text-2xl font-bold text-slate-800 mb-2">Thank You!</h4>
                                        <p className="text-slate-600">Your request has been received. Our team will contact you shortly.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {error && (
                                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                                                <AlertCircle size={16} />
                                                {error}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-slate-700 uppercase">Name *</label>
                                                <input
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                                                    placeholder="Dr. John Doe"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-slate-700 uppercase">Mobile Number *</label>
                                                <input
                                                    name="mobile_number"
                                                    value={formData.mobile_number}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                                                    placeholder="9876543210"
                                                    type="tel"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-700 uppercase">Hospital / Clinic Name</label>
                                            <input
                                                name="hospital_name"
                                                value={formData.hospital_name}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                                                placeholder="City Care Hospital"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-700 uppercase">Email ID</label>
                                            <input
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                                                placeholder="doc@example.com"
                                                type="email"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-700 uppercase">Address</label>
                                            <textarea
                                                name="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                                rows={2}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 resize-none"
                                                placeholder="Hospital Address..."
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-700 uppercase">Requirements / Features</label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                rows={3}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 resize-none"
                                                placeholder="What are you looking for?"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-700 uppercase">Preferred Demo Date/Time</label>
                                            <input
                                                name="demo_date"
                                                type="datetime-local"
                                                value={formData.demo_date}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 mt-4"
                                        >
                                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Submit Request'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
