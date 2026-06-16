"use server";

import { apiRequest } from "@/api/apiHandler";
import { revalidateTag } from "next/cache";

export const getMyTickets = async (params = {}) => {
    const response = await apiRequest({
        url: "/tickets/me",
        method: "GET",
        params,
        withCredentials: true,
        tags: ["tickets"],
    });


    if (!response.success) {
        return [];
    }


    return response.data;
};

export const getTicketById = async (ticketId) => {
    const response = await apiRequest({
        url: `/tickets/${ticketId}`,
        method: "GET",
        withCredentials: true,
        cache: "force-store",
        tags: ["tickets"],
    });


    if (!response.success) {
        return null;
    }


    return response.data;
};

export const getAllTickets = async (params = {}) => {
    const response = await apiRequest({
        url: "/tickets",
        method: "GET",
        params,
        withCredentials: true,
        cache: "no-store"
    });


    if (!response.success) {
        return [];
    }


    return response.data;
};

export const verifyTicket = async (token) => {
    const response = await apiRequest({
        url: `/tickets/verify/${token}`,
        method: "GET",
        withCredentials: true,
        cache: "no-store",
    });


    if (!response.success) {
        return {
            success: false,
            message: response.message,
            data: null,
        };
    }


    revalidateTag("tickets", "max");


    return {
        success: true,
        data: response.data,
    };
};

export const cancelTicket = async (ticketId) => {
    const response = await apiRequest({
        url: `/tickets/${ticketId}/cancel`,
        method: "PATCH",
        withCredentials: true,
    });


    if (!response.success) {
        return false;
    }


    revalidateTag("tickets", "max");


    return true;
};
