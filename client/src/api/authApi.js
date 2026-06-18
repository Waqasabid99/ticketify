import axios from "axios";

export const authApi = axios.create({
    baseURL: "/api/auth",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});
