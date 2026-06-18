import { api } from "@/api/api";
import { authApi } from "@/api/authApi";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "react-toastify";

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            role: null,
            isAuthenticated: false,
            permissions: [],
            isLoading: false,
            error: null,

            // ─── Internal: called by api.js interceptor on unrecoverable 401 ───
            _clearAuth: () => {
                set({
                    user: null,
                    role: null,
                    permissions: [],
                    isAuthenticated: false,
                    isLoading: false,
                    error: null,
                });
            },

            forceLogout: () => {
                get()._clearAuth();
            },

            register: async (formData) => {
                try {
                    set({ isLoading: true, error: null });
                    const { data } = await authApi.post("/register", formData);
                    set({
                        user: data?.data?.user,
                        role: data?.data?.user?.role,
                        permissions: data?.data?.permissions || [],
                        isAuthenticated: false,
                        isLoading: false,
                    });
                    toast.success(data.message);
                    return true;
                } catch (error) {
                    console.log(error.response.data.message)
                    set({
                        isLoading: false,
                        error: error.response?.data?.message || error.message || "Something went wrong",
                    });
                    toast.error(error.response?.data?.message || "Registration failed");
                }
            },

            login: async (formData) => {
                try {
                    set({ isLoading: true, error: null });
                    const { data } = await authApi.post("/login", formData);
                    set({
                        user: data?.data?.user,
                        role: data?.data?.user?.role,
                        permissions: data?.data?.permissions || [],
                        isAuthenticated: true,
                        isLoading: false,
                    });
                    toast.success(data.message);

                    return true;
                } catch (error) {
                    set({
                        isLoading: false,
                        error: error.response?.data?.message || error.message || "Something went wrong",
                    });
                    toast.error(error.response?.data?.message || "Login failed");
                }
            },

            logout: async () => {
                try {
                    set({ isLoading: true, error: null });
                    const { data } = await authApi.post("/logout");
                    set({
                        user: null,
                        permissions: [],
                        role: null,
                        isAuthenticated: false,
                        isLoading: false,
                    });
                    toast.success(data.message);
                } catch (error) {
                    // Even if the server call fails, clear local auth state
                    set({
                        user: null,
                        permissions: [],
                        role: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: error.response?.data?.message || error.message || "Something went wrong",
                    });
                    toast.error(error.response?.data?.message || "Logout failed");
                }
            },

            // Silent session check — no success toast (called on app boot)
            verifyUser: async () => {
                try {
                    set({ isLoading: true, error: null });
                    const { data } = await authApi.post("/verify");
                    set({
                        user: data?.data?.user,
                        role: data?.data?.user?.role,
                        permissions: data?.data?.permissions || [],
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error) {
                    // Session is invalid — clear state silently
                    set({
                        user: null,
                        role: null,
                        permissions: [],
                        isAuthenticated: false,
                        isLoading: false,
                        error: null,
                    });
                }
            },

            // Manually trigger a token refresh
            refreshToken: async () => {
                try {
                    await authApi.post("/refresh-token");
                    return true;
                } catch (error) {
                    get()._clearAuth();
                    return false;
                }
            },

            forgetPassword: async (email) => {
                try {
                    set({ isLoading: true, error: null });
                    const { data } = await api.post("/auth/forget-password", { email });
                    set({ isLoading: false });
                    toast.success(data.message);
                } catch (error) {
                    set({
                        isLoading: false,
                        error: error.response?.data?.message || error.message || "Something went wrong",
                    });
                    toast.error(error.response?.data?.message || "Forgot password request failed");
                }
            },

            // Verify the email-link token and set a brand-new password
            verifyPasswordReset: async ({ token, newPassword }) => {
                try {
                    set({ isLoading: true, error: null });
                    const { data } = await api.post("/auth/verify-password-reset", { token, newPassword });
                    set({ isLoading: false });
                    toast.success(data.message);
                    return true;
                } catch (error) {
                    set({
                        isLoading: false,
                        error: error.response?.data?.message || error.message || "Something went wrong",
                    });
                    toast.error(error.response?.data?.message || "Password reset failed");
                    return false;
                }
            },

            // Change password for an already authenticated user (old + new)
            resetPassword: async (formData) => {
                try {
                    set({ isLoading: true, error: null });
                    const { data } = await api.post("/auth/reset-password", formData);
                    set({ isLoading: false });
                    toast.success(data.message);
                } catch (error) {
                    set({
                        isLoading: false,
                        error: error.response?.data?.message || error.message || "Something went wrong",
                    });
                    toast.error(error.response?.data?.message || "Password reset failed");
                }
            },
        }),

        {
            name: "ticketify-auth",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                user: state.user,
                role: state.role,
                permissions: state.permissions,
                isAuthenticated: state.isAuthenticated,
            }),
        },
    ),
);
