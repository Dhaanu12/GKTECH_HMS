'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertTriangle, CheckCircle, Info, X, Loader2 } from 'lucide-react';

export type InsightType = 'info' | 'warning' | 'success' | 'loading';

interface AIInsightCardProps {
    title?: string;
    content: string;
    type?: InsightType;
    onDismiss?: () => void;
    isLoading?: boolean;
    className?: string;
}

const typeStyles: Record<InsightType, { bg: string; border: string; icon: React.ReactNode; glow: string }> = {
    info: {
        bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
        border: 'border-blue-200',
        icon: <Sparkles className="w-4 h-4 text-blue-600" />,
        glow: 'shadow-blue-100',
    },
    warning: {
        bg: 'bg-gradient-to-r from-amber-50 to-orange-50',
        border: 'border-amber-200',
        icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
        glow: 'shadow-amber-100',
    },
    success: {
        bg: 'bg-gradient-to-r from-emerald-50 to-green-50',
        border: 'border-emerald-200',
        icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
        glow: 'shadow-emerald-100',
    },
    loading: {
        bg: 'bg-gradient-to-r from-slate-50 to-gray-50',
        border: 'border-slate-200',
        icon: <Loader2 className="w-4 h-4 text-slate-600 animate-spin" />,
        glow: 'shadow-slate-100',
    },
};

export function AIInsightCard({
    title = 'AI Insight',
    content,
    type = 'info',
    onDismiss,
    isLoading = false,
    className = '',
}: AIInsightCardProps) {
    const effectiveType = isLoading ? 'loading' : type;
    const styles = typeStyles[effectiveType];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={`relative rounded-xl border ${styles.bg} ${styles.border} p-4 shadow-lg ${styles.glow} ${className}`}
            >
                {/* Subtle glow effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50 pointer-events-none" />
                
                <div className="relative flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                        <div className="p-1.5 rounded-lg bg-white/60 backdrop-blur-sm shadow-sm">
                            {styles.icon}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
                            {isLoading && (
                                <span className="text-xs text-slate-500 animate-pulse">Analyzing...</span>
                            )}
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {content}
                        </p>
                    </div>

                    {/* Dismiss button */}
                    {onDismiss && !isLoading && (
                        <button
                            onClick={onDismiss}
                            className="flex-shrink-0 p-1 rounded-md hover:bg-white/50 transition-colors"
                            aria-label="Dismiss"
                        >
                            <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                        </button>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

export default AIInsightCard;
