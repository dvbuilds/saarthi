import axios from 'axios';

// Always call the API through our own origin (/api/...). In dev, vite.config.js
// proxies /api to localhost:5000; in production, vercel.json rewrites /api/* to
// the Render backend. This keeps the request same-origin so the auth cookies
// (SameSite=None; Secure) are treated as 1st-party and Chrome's 3rd-party
// cookie blocking doesn't strip them.
const API = axios.create({
    baseURL: "/api",
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

        // The refresh call itself failed — nothing more to try
        if (originalRequest.url?.includes('/refresh')) {
            isRefreshing = false;
            refreshSubscribers = [];
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
            await API.post('/users/refresh');
            isRefreshing = false;
            onRefreshed();
            return API(originalRequest);
        } catch (refreshError) {
            isRefreshing = false;
            refreshSubscribers = [];

            
            if (!originalRequest.url?.includes('/me')) {
                window.location.href = '/login';
            }

            return Promise.reject(refreshError);
        }
    }
);

export default API;