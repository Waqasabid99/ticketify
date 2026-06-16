"use server";

import { apiRequest } from "@/api/apiHandler";

export const createPaymentIntent = async (bookingId) => {
    const response = await apiRequest({
        url: "/payments/intent",
        method: "POST",
        data: bookingId,
        withCredentials: true,
        cache: "no-store"
    });

    if (!response.success) {
        throw new Error(response.message);
    }

    return response.data;
};

export const retryPayment = async (bookingId) => {
    const response = await apiRequest({
        url: "/payments/retry",
        method: "POST",
        data: bookingId,
        withCredentials: true,
        cache: "no-store"
    });

    if (!response.success) {
        throw new Error(response.message);
    }

    return response.data;
};
