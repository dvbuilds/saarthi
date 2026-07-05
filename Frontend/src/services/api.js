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
            await API.post('/api/users/refresh');
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