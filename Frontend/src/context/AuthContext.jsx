import { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Runs once on app mount — asks the backend "who am I?" based on
    // whatever cookies are present. This is what makes login survive
    // a closed tab/refresh, since cookies persist but React state doesn't.
    const checkAuth = async () => {
        try {
            const response = await API.get('/api/users/me');
            setUser(response.data.user);
        } catch (error) {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (email, password) => {
        await API.post('/api/users/login', { email, password });
        await checkAuth(); // populate user state from the fresh session
    };

    const logout = async () => {
        try {
            await API.post('/api/users/logout');
        } finally {
            setUser(null);
        }
    };

    const value = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        checkAuth,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};