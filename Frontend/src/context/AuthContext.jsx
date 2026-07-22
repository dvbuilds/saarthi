import { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = async () => {
        try {
            const response = await API.get('/users/me');
            setUser(response.data.user);
            return true;
        } catch (error) {
            setUser(null);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    // Throws AUTH_SYNC_ERROR if the login call itself succeeded but the
    // follow-up /users/me check still comes back unauthenticated (e.g. the
    // session cookie wasn't accepted). Without this, the caller sees no
    // error at all — the promise resolves, but the user is never signed in.
    const login = async (email, password) => {
        await API.post('/users/login', { email, password });
        const authenticated = await checkAuth();
        if (!authenticated) {
            const err = new Error("Sign-in didn't complete — please try again or check your email/password.");
            err.code = 'AUTH_SYNC_ERROR';
            throw err;
        }
    };

    const register = async (fullName, email, password) => {
        await API.post('/users/register', { fullName, email, password });
        const authenticated = await checkAuth(); // register now sets cookies too, so this populates user state
        if (!authenticated) {
            const err = new Error("Account created, but sign-in didn't complete — please try logging in.");
            err.code = 'AUTH_SYNC_ERROR';
            throw err;
        }
    };

    const logout = async () => {
        try {
            await API.post('/users/logout');
        } finally {
            setUser(null);
        }
    };

    const value = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
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