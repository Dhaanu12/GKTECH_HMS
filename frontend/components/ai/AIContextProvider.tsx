'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import axios from 'axios';
import { ChatMessage, AIContext as AICtx, chat, streamChat, getAIStatus, RateLimitInfo } from '@/lib/api/ai';

export interface PendingAction {
    action: string;
    label: string;
    params: Record<string, any>;
    summary: string;
}

interface AIContextType {
    // Chat state
    messages: ChatMessage[];
    isLoading: boolean;
    isStreaming: boolean;
    error: string | null;

    // Context info
    currentPage: string;
    role: string;
    patientInfo: string | null;

    // Rate limiting
    rateLimit: RateLimitInfo | null;
    isAvailable: boolean;

    // Confirmation flow
    pendingAction: PendingAction | null;
    confirmAction: () => Promise<void>;
    cancelAction: () => void;

    // Actions
    sendMessage: (content: string) => Promise<void>;
    sendMessageStreaming: (content: string) => Promise<void>;
    clearChat: () => void;
    setPageContext: (page: string, patient?: string) => void;
    refreshStatus: () => Promise<void>;
}

const AIContext = createContext<AIContextType | null>(null);

export function useAI() {
    const context = useContext(AIContext);
    if (!context) {
        throw new Error('useAI must be used within an AIContextProvider');
    }
    return context;
}

interface AIContextProviderProps {
    children: ReactNode;
    role: string;
    initialPage?: string;
}

export function AIContextProvider({ children, role, initialPage = '' }: AIContextProviderProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [patientInfo, setPatientInfo] = useState<string | null>(null);
    const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
    const [isAvailable, setIsAvailable] = useState(true);
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

    // Refresh AI status on mount
    useEffect(() => {
        refreshStatus();
    }, []);

    const refreshStatus = useCallback(async () => {
        try {
            const status = await getAIStatus();
            setIsAvailable(status.service.available);
            setRateLimit(status.rateLimit);
        } catch {
            setIsAvailable(false);
        }
    }, []);

    const getContext = useCallback((): AICtx => ({
        page: currentPage,
        role,
        patientInfo: patientInfo || undefined,
    }), [currentPage, role, patientInfo]);

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim()) return;

        setError(null);
        setIsLoading(true);

        const userMessage: ChatMessage = { role: 'user', content };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);

        try {
            const response = await chat(newMessages, getContext());

            if (response.success) {
                setMessages([...newMessages, { role: 'assistant', content: response.message }]);
            } else {
                setError(response.message);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to send message');
        } finally {
            setIsLoading(false);
            refreshStatus();
        }
    }, [messages, getContext, refreshStatus]);

    // Refs for batched streaming — accumulate chunks and flush at 60fps
    const streamBufferRef = useRef('');
    const rafIdRef = useRef<number | null>(null);

    // Cleanup RAF on unmount
    useEffect(() => {
        return () => {
            if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        };
    }, []);

    const sendMessageStreaming = useCallback(async (content: string) => {
        if (!content.trim()) return;

        setError(null);
        setIsStreaming(true);

        const userMessage: ChatMessage = { role: 'user', content };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);

        streamBufferRef.current = '';
        setMessages([...newMessages, { role: 'assistant', content: '' }]);

        try {
            await streamChat(
                newMessages,
                getContext(),
                (chunk) => {
                    streamBufferRef.current += chunk;

                    // Detect confirmation payload in the streamed response
                    const confirmMatch = streamBufferRef.current.match(/\[CONFIRM_ACTION\]([\s\S]*?)\[\/CONFIRM_ACTION\]/);
                    if (confirmMatch) {
                        try {
                            const actionData = JSON.parse(confirmMatch[1]);
                            setPendingAction(actionData);
                            const cleanContent = streamBufferRef.current.replace(/\[CONFIRM_ACTION\][\s\S]*?\[\/CONFIRM_ACTION\]/, '').trim();
                            setMessages([...newMessages, { role: 'assistant', content: cleanContent }]);
                        } catch { /* ignore parse errors */ }
                    } else {
                        // Batch UI updates at ~60fps via requestAnimationFrame
                        if (!rafIdRef.current) {
                            rafIdRef.current = requestAnimationFrame(() => {
                                setMessages([...newMessages, { role: 'assistant', content: streamBufferRef.current }]);
                                rafIdRef.current = null;
                            });
                        }
                    }
                },
                () => {
                    // On complete — ensure final content is flushed
                    if (rafIdRef.current) {
                        cancelAnimationFrame(rafIdRef.current);
                        rafIdRef.current = null;
                    }
                    setMessages([...newMessages, { role: 'assistant', content: streamBufferRef.current }]);
                    setIsStreaming(false);
                    refreshStatus();
                },
                (errorMsg) => {
                    if (rafIdRef.current) {
                        cancelAnimationFrame(rafIdRef.current);
                        rafIdRef.current = null;
                    }
                    setError(errorMsg);
                    setIsStreaming(false);
                },
                // onClear: tool execution done, wipe the loading indicator before real content starts
                () => {
                    streamBufferRef.current = '';
                    setMessages([...newMessages, { role: 'assistant', content: '' }]);
                }
            );
        } catch (err: any) {
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }
            setError(err.message || 'Stream failed');
            setIsStreaming(false);
        }
    }, [messages, getContext, refreshStatus]);

    const confirmAction = useCallback(async () => {
        if (!pendingAction) return;

        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/ai/execute-action', {
                action: pendingAction.action,
                params: pendingAction.params
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const successMsg: ChatMessage = {
                role: 'assistant',
                content: `✅ ${pendingAction.label} completed successfully.`
            };
            setMessages(prev => [...prev, successMsg]);
            setPendingAction(null);
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || 'Action failed';
            setError(`Failed: ${errorMsg}`);
            setPendingAction(null);
        } finally {
            setIsLoading(false);
        }
    }, [pendingAction]);

    const cancelAction = useCallback(() => {
        const cancelMsg: ChatMessage = {
            role: 'assistant',
            content: '❌ Action cancelled.'
        };
        setMessages(prev => [...prev, cancelMsg]);
        setPendingAction(null);
    }, []);

    const clearChat = useCallback(() => {
        setMessages([]);
        setError(null);
    }, []);

    const setPageContext = useCallback((page: string, patient?: string) => {
        setCurrentPage(page);
        if (patient !== undefined) {
            setPatientInfo(patient);
        }
    }, []);

    const value: AIContextType = {
        messages,
        isLoading,
        isStreaming,
        error,
        currentPage,
        role,
        patientInfo,
        rateLimit,
        isAvailable,
        pendingAction,
        confirmAction,
        cancelAction,
        sendMessage,
        sendMessageStreaming,
        clearChat,
        setPageContext,
        refreshStatus,
    };

    return (
        <AIContext.Provider value={value}>
            {children}
        </AIContext.Provider>
    );
}

export default AIContextProvider;
