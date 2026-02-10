'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Brain } from 'lucide-react';

interface AILoadingIndicatorProps {
    text?: string;
    variant?: 'inline' | 'overlay' | 'compact';
    className?: string;
}

export function AILoadingIndicator({
    text = 'Analyzing...',
    variant = 'inline',
    className = '',
}: AILoadingIndicatorProps) {
    if (variant === 'compact') {
        return (
            <div className={`inline-flex items-center gap-1.5 text-blue-600 ${className}`}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                    <Sparkles className="w-3.5 h-3.5" />
                </motion.div>
                <span className="text-xs font-medium">{text}</span>
            </div>
        );
    }

    if (variant === 'overlay') {
        return (
            <div className={`absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg z-10 ${className}`}>
                <div className="flex flex-col items-center gap-3">
                    <motion.div
                        className="relative"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-200">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        {/* Orbiting sparkles */}
                        <motion.div
                            className="absolute -top-1 -right-1"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        >
                            <Sparkles className="w-4 h-4 text-amber-400" />
                        </motion.div>
                    </motion.div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-600">{text}</span>
                        <motion.span
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="text-slate-400"
                        >
                            ...
                        </motion.span>
                    </div>
                </div>
            </div>
        );
    }

    // Default inline variant
    return (
        <div className={`flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 ${className}`}>
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="flex-shrink-0"
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-md">
                    <Sparkles className="w-4 h-4 text-white" />
                </div>
            </motion.div>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">{text}</span>
                    <motion.div
                        className="flex gap-1"
                        initial="hidden"
                        animate="visible"
                    >
                        {[0, 1, 2].map((i) => (
                            <motion.span
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-blue-400"
                                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                }}
                            />
                        ))}
                    </motion.div>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">CareNex AI is processing your request</p>
            </div>
        </div>
    );
}

export default AILoadingIndicator;
