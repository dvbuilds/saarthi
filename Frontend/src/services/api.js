import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});

let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = () => {
    refreshSubscribers.forEach((callback) => callback());
    refreshSubscribers = [];
};

const addRefreshSubscriber = (callback) => {
    refreshSubscribers.push(callback);
};

API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        // The refresh call itself failed — session is dead, but don't redirect here.
        // Let whichever caller invoked this (checkAuth, or a real protected request)
        // handle it in their own catch block.
        if (originalRequest.url?.includes('/refresh')) {
            isRefreshing = false;
            refreshSubscribers = [];
            return Promise.reject(error);
        }

        // The silent background auth check (/me) failing just means "not logged in" —
        // this is a normal, expected outcome on every logged-out page load.
        // No refresh attempt, no redirect. checkAuth's own catch sets user to null.
        if (originalRequest.url?.includes('/me')) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (isRefreshing) {
            return new Promise((resolve) => {
                addRefreshSubscriber(() => {
                    resolve(API(originalRequest));
                });
            });
        }

        isRefreshing = true;

        try {
            await API.post('/api/users/refresh');
            isRefreshing = false;
            onRefreshed();
            return API(originalRequest);
        } catch (refreshError) {
            isRefreshing = false;
            refreshSubscribers = [];
            // This IS a genuine protected-request failure (not /me, not /refresh itself) —
            // a real page tried to do something and the session is dead. Redirect here.
            window.location.href = '/login';
            return Promise.reject(refreshError);
        }
    }
);

export default API;