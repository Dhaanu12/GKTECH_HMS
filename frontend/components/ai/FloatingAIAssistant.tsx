'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
    Sparkles, 
    X, 
    Send, 
    Trash2, 
    ChevronDown, 
    User, 
    Bot,
    AlertCircle,
    Zap,
    Activity,
    FileText,
    ClipboardList,
    Minimize2,
    CheckCircle,
    XCircle,
    DollarSign,
    CalendarPlus,
    Stethoscope,
} from 'lucide-react';
import { useAI } from './AIContextProvider';

interface QuickAction {
    label: string;
    prompt: string;
    icon: React.ReactNode;
}

const pageQuickActions: Record<string, QuickAction[]> = {
    'patients': [
        { label: 'Summarize patient', prompt: 'Generate a brief summary of this patient\'s current status based on their recent vitals and history.', icon: <User className="w-3.5 h-3.5" /> },
        { label: 'Analyze vitals', prompt: 'Analyze the patient\'s vital signs trends and highlight any concerns.', icon: <Activity className="w-3.5 h-3.5" /> },
    ],
    'lab-schedule': [
        { label: 'Interpret results', prompt: 'Help me interpret the lab results I\'m currently viewing.', icon: <FileText className="w-3.5 h-3.5" /> },
        { label: 'Priority check', prompt: 'Which of the pending lab orders should be prioritized?', icon: <Zap className="w-3.5 h-3.5" /> },
    ],
    'feedbacks': [
        { label: 'Analyze sentiment', prompt: 'Analyze the sentiment of recent patient feedback and identify key themes.', icon: <ClipboardList className="w-3.5 h-3.5" /> },
        { label: 'Suggest response', prompt: 'Suggest a professional response to address this patient feedback.', icon: <FileText className="w-3.5 h-3.5" /> },
    ],
    'dashboard': [
        { label: 'Dashboard insights', prompt: 'What insights can you provide from the current dashboard metrics?', icon: <Activity className="w-3.5 h-3.5" /> },
        { label: 'Optimization tips', prompt: 'What operational improvements would you suggest based on current data?', icon: <Zap className="w-3.5 h-3.5" /> },
    ],
    'appointments': [
        { label: 'Schedule optimization', prompt: 'Are there any scheduling conflicts or optimization opportunities for today\'s appointments?', icon: <ClipboardList className="w-3.5 h-3.5" /> },
        { label: 'Doctor availability', prompt: 'Which doctors are available today?', icon: <Stethoscope className="w-3.5 h-3.5" /> },
    ],
    'opd': [
        { label: 'Patient lookup', prompt: 'Help me find a patient in the system.', icon: <User className="w-3.5 h-3.5" /> },
        { label: 'Today\'s OPD', prompt: 'Show me today\'s OPD summary.', icon: <Activity className="w-3.5 h-3.5" /> },
    ],
    'billing': [
        { label: 'Pending summary', prompt: 'Summarize pending payments and bills.', icon: <DollarSign className="w-3.5 h-3.5" /> },
        { label: 'Overdue bills', prompt: 'Are there any long-overdue bills?', icon: <AlertCircle className="w-3.5 h-3.5" /> },
    ],
    'default': [
        { label: 'How can I help?', prompt: 'What can you help me with in the hospital management system?', icon: <Sparkles className="w-3.5 h-3.5" /> },
    ],
};

export function FloatingAIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const {
        messages,
        isLoading,
        isStreaming,
        error,
        currentPage,
        rateLimit,
        isAvailable,
        pendingAction,
        confirmAction,
        cancelAction,
        sendMessageStreaming,
        clearChat,
    } = useAI();

    // Get quick actions for current page
    const getQuickActions = (): QuickAction[] => {
        const pageName = currentPage.split('/').pop() || 'default';
        return pageQuickActions[pageName] || pageQuickActions['default'];
    };

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && !isMinimized) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, isMinimized]);

    const handleSend = async () => {
        if (!input.trim() || isLoading || isStreaming) return;
        const message = input;
        setInput('');
        await sendMessageStreaming(message);
    };

    const handleQuickAction = async (prompt: string) => {
        await sendMessageStreaming(prompt);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Floating Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-300/50 flex items-center justify-center z-50 hover:shadow-xl hover:shadow-blue-300/60 transition-shadow"
                        aria-label="Open AI Assistant"
                    >
                        <Sparkles className="w-6 h-6" />
                        {/* Pulse indicator */}
                        <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ 
                            opacity: 1, 
                            y: 0, 
                            scale: 1,
                            height: isMinimized ? 'auto' : '600px',
                        }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl shadow-slate-300/50 z-50 flex flex-col overflow-hidden border border-slate-200"
                        style={{ maxHeight: '80vh' }}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between text-white">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm">CareNex AI</h3>
                                    <p className="text-xs text-blue-100">
                                        {isAvailable ? 'Online' : 'Offline'} 
                                        {rateLimit && ` • ${rateLimit.remaining} requests left`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={clearChat}
                                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                    title="Clear chat"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setIsMinimized(!isMinimized)}
                                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                    title={isMinimized ? 'Expand' : 'Minimize'}
                                >
                                    {isMinimized ? <ChevronDown className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                    title="Close"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {!isMinimized && (
                            <>
                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                                    {messages.length === 0 ? (
                                        <div className="text-center py-8">
                                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
                                                <Sparkles className="w-8 h-8 text-blue-600" />
                                            </div>
                                            <h4 className="font-semibold text-slate-700 mb-1">How can I help?</h4>
                                            <p className="text-sm text-slate-500 mb-4">
                                                Ask me anything about patients, vitals, lab results, or workflows.
                                            </p>
                                            {/* Quick Actions */}
                                            <div className="flex flex-wrap justify-center gap-2">
                                                {getQuickActions().map((action, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleQuickAction(action.prompt)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
                                                    >
                                                        {action.icon}
                                                        {action.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        messages.map((message, idx) => (
                                            <div
                                                key={idx}
                                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                                                        message.role === 'user'
                                                            ? 'bg-blue-600 text-white rounded-br-md'
                                                            : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md shadow-sm'
                                                    }`}
                                                >
                                                    {message.role === 'assistant' && (
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <Bot className="w-3.5 h-3.5 text-blue-600" />
                                                            <span className="text-xs font-medium text-blue-600">CareNex AI</span>
                                                        </div>
                                                    )}
                                                    {message.content ? (
                                                        message.role === 'assistant' ? (
                                                            <div className="text-[13px] leading-relaxed">
                                                                <ReactMarkdown
                                                                    remarkPlugins={[remarkGfm]}
                                                                    components={{
                                                                        p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                                                                        strong: ({ children }) => <span className="font-semibold text-slate-900">{children}</span>,
                                                                        em: ({ children }) => <em className="italic text-slate-600">{children}</em>,
                                                                        ul: ({ children }) => <ul className="my-1 space-y-0.5 pl-1">{children}</ul>,
                                                                        ol: ({ children }) => <ol className="my-1 space-y-0.5 list-decimal pl-5">{children}</ol>,
                                                                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                                                                        h1: ({ children }) => <h1 className="font-semibold text-sm mt-2 mb-1 text-slate-900">{children}</h1>,
                                                                        h2: ({ children }) => <h2 className="font-semibold text-sm mt-2 mb-1 text-slate-900">{children}</h2>,
                                                                        h3: ({ children }) => <h3 className="font-semibold text-[13px] mt-2 mb-1 text-slate-900">{children}</h3>,
                                                                        h4: ({ children }) => <h4 className="font-semibold text-[13px] mt-1.5 mb-0.5 text-slate-800">{children}</h4>,
                                                                        code: ({ children }) => <code className="bg-slate-100 text-indigo-700 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                                                                        pre: ({ children }) => <pre className="bg-slate-100 p-2 rounded-lg my-1.5 overflow-x-auto text-xs">{children}</pre>,
                                                                        blockquote: ({ children }) => <blockquote className="border-l-2 border-blue-400 pl-2.5 my-1.5 text-slate-600 italic">{children}</blockquote>,
                                                                        a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">{children}</a>,
                                                                        hr: () => <hr className="my-2 border-slate-200" />,
                                                                        table: ({ children }) => <div className="overflow-x-auto my-1.5"><table className="text-xs border-collapse w-full">{children}</table></div>,
                                                                        th: ({ children }) => <th className="border border-slate-200 px-2 py-1 bg-slate-50 font-semibold text-left">{children}</th>,
                                                                        td: ({ children }) => <td className="border border-slate-200 px-2 py-1">{children}</td>,
                                                                    }}
                                                                >
                                                                    {message.content}
                                                                </ReactMarkdown>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                                                {message.content}
                                                            </p>
                                                        )
                                                    ) : (isStreaming && idx === messages.length - 1 ? (
                                                        <span className="inline-flex items-center gap-1 text-slate-400">
                                                            <span className="animate-pulse">Thinking</span>
                                                            <span className="flex gap-0.5">
                                                                <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                                <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                                <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                            </span>
                                                        </span>
                                                    ) : null)}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    
                                    {/* Confirmation Card */}
                                    {pendingAction && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-amber-50 border border-amber-200 rounded-xl p-3 shadow-sm"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                                                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                                </div>
                                                <span className="text-sm font-semibold text-amber-800">Confirm Action</span>
                                            </div>
                                            <p className="text-sm font-medium text-slate-800 mb-1">{pendingAction.label}</p>
                                            <p className="text-xs text-slate-600 mb-3">{pendingAction.summary}</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={cancelAction}
                                                    disabled={isLoading}
                                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={confirmAction}
                                                    disabled={isLoading}
                                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 rounded-lg text-xs font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    {isLoading ? 'Executing...' : 'Confirm'}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Error display */}
                                    {error && (
                                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}
                                    
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-3 bg-white border-t border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Ask CareNex AI..."
                                            disabled={isLoading || isStreaming || !isAvailable}
                                            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        <button
                                            onClick={handleSend}
                                            disabled={!input.trim() || isLoading || isStreaming || !isAvailable}
                                            className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {!isAvailable && (
                                        <p className="text-xs text-amber-600 mt-2 text-center">
                                            AI service is currently unavailable. Please try again later.
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export default FloatingAIAssistant;
