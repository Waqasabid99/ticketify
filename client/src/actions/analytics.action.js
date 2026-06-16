"use server";

import { apiRequest } from "@/api/apiHandler";

export const getAnalyticsData = async () => {
    const response = await apiRequest({
        url: "/analytics/dashboard",
        method: "GET",
        cache: "no-store",
        withCredentials: true,
    });

    if (!response.success) {
        throw new Error(response.message);
    }
    return response.data;
};
