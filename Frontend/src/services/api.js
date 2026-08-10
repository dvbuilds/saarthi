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

// Endpoints that are themselves part of the auth flow (or public/pre-auth)
// must never trigger the "access token expired -> refresh -> retry" dance.
// A 401 from /login is "wrong credentials", not "your session expired" —
// treating it the same way was the root cause of a bug where a failed
// login attempt would silently try /refresh (which also 401s, since
// there's no session yet), then hard-redirect to /login via
// window.location.href, wiping the just-set error message and looking
// like an unexplained page refresh.
const PUBLIC_AUTH_PATHS = ["/users/login", "/users/register", "/users/refresh", "/users/forgot-password", "/users/reset-password"];

const isPublicAuthRequest = (url = "") => PUBLIC_AUTH_PATHS.some((path) => url.includes(path));

API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        // The refresh call itself failed, or this 401 came from a public/
        // pre-auth endpoint (login, register, etc.) — nothing to refresh,
        // just surface the error to the caller as-is.
        if (isPublicAuthRequest(originalRequest.url)) {
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