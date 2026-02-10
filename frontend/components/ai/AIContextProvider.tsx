'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { ChatMessage, AIContext as AICtx, chat, streamChat, getAIStatus, RateLimitInfo } from '@/lib/api/ai';

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

    const sendMessageStreaming = useCallback(async (content: string) => {
        if (!content.trim()) return;
        
        setError(null);
        setIsStreaming(true);

        const userMessage: ChatMessage = { role: 'user', content };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);

        let streamedContent = '';
        setMessages([...newMessages, { role: 'assistant', content: '' }]);

        try {
            await streamChat(
                newMessages,
                getContext(),
                (chunk) => {
                    streamedContent += chunk;
                    setMessages([...newMessages, { role: 'assistant', content: streamedContent }]);
                },
                () => {
                    setIsStreaming(false);
                    refreshStatus();
                },
                (errorMsg) => {
                    setError(errorMsg);
                    setIsStreaming(false);
                }
            );
        } catch (err: any) {
            setError(err.message || 'Stream failed');
            setIsStreaming(false);
        }
    }, [messages, getContext, refreshStatus]);

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
