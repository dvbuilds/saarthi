import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});

let isRefreshing = false;
let refreshSubscribers = [];

// Called once refresh succeeds — releases all requests that were queued
// while the refresh was in-flight.
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

        // Not a 401, or we've already retried this request once — give up
        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        // If the refresh call itself returns 401, the session is truly dead —
        // don't try to refresh again, just log the user out
        if (originalRequest.url?.includes('/refresh')) {
            isRefreshing = false;
            refreshSubscribers = [];
            window.location.href = '/login';
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (isRefreshing) {
            // A refresh is already happening — wait for it, then retry this request
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
            window.location.href = '/login';
            return Promise.reject(refreshError);
        }
    }
);

export default API;