import axios from "axios";

const API_URL = process.env.API_BASE_URL || "http://localhost:8000/api/v1"
export const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

// ─── Token Refresh Interceptor ─────────────────────────────────────────────
// Tracks whether a refresh is already in-flight and queues concurrent 401s
// so we only fire one /auth/refresh-token request at a time.

let isRefreshing = false;
let refreshQueue = []; // [{resolve, reject}]

const processQueue = (error) => {
    refreshQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve();
    });
    refreshQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        const is401 = error.response?.status === 401;
        const isRefreshEndpoint = originalRequest.url?.includes("/auth/refresh-token");
        const isLoginEndpoint = originalRequest.url?.includes("/auth/login");
        const alreadyRetried = originalRequest._retry;

        // Don't attempt refresh for login/refresh endpoints or already-retried requests
        if (!is401 || isRefreshEndpoint || isLoginEndpoint || alreadyRetried) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (isRefreshing) {
            // Another refresh is already in-flight — queue this request
            return new Promise((resolve, reject) => {
                refreshQueue.push({ resolve, reject });
            })
                .then(() => api(originalRequest))
                .catch((err) => Promise.reject(err));
        }

        isRefreshing = true;

        try {
            await api.post("/auth/refresh-token");
            processQueue(null);
            return api(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError);

            // Refresh failed — clear persisted auth state and redirect to login
            try {
                const { useAuthStore } = await import("@/store/authStore");
                useAuthStore.getState()._clearAuth();
            } catch (_) {
                // Store not available (e.g. during SSR or early boot) — no-op
            }

            if (typeof window !== "undefined") {
                window.location.href = "/login";
            }

            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);
