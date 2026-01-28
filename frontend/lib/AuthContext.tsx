'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    user_id: number;
    username: string;
    email: string;
    role_code: string;
    hospital_id?: number;
    branch_id?: number;
    activeModules?: string[];
    [key: string]: any;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => void;
    setUser: (user: User | null) => void;
    isAuthenticated: boolean;
    hasAccess: (moduleCode: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check if user is logged in on mount
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error('Error parsing user data:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        router.push('/');
    };

    const hasAccess = (moduleCode: string) => {
        if (!user) return false;
        if (user.role_code === 'SUPER_ADMIN') return true;

        // If user has activeModules property (populated from backend)
        if (user.activeModules && Array.isArray(user.activeModules)) {
            return user.activeModules.includes(moduleCode);
        }

        // Fallback for backward compatibility or if no modules assigned yet
        return false;
    };

    const value = {
        user,
        loading,
        logout,
        setUser,
        isAuthenticated: !!user,
        hasAccess
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
