import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1"
export const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

const refreshApi = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Refresh lock (prevents multiple refresh calls)
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error = null) => {
  failedQueue.forEach((promise) => {
    if (error) promise.reject(error);
    else promise.resolve();
  });
  failedQueue = [];
};

const shouldSkipRefresh = (requestUrl = "") => {
  const authPaths = [
    "/auth/login",
    "/auth/register",
    "/auth/forget-password",
    "/auth/refresh-token",
    "/auth/logout",
    "/auth/verify",
  ];

  return authPaths.some((path) => requestUrl.includes(path));
};

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (
      (status === 401 || status === 403) &&
      !originalRequest?._retry &&
      !shouldSkipRefresh(originalRequest?.url)
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await refreshApi.post("/auth/refresh-token");
        processQueue();
        return api(originalRequest);
      } catch (err) {
        processQueue(err);
        useAuthStore.getState().forceLogout();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;