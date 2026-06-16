"use server";

import { apiRequest } from "@/api/apiHandler";
import { revalidateTag } from "next/cache";

// ─── Seat Availability (public) ───────────────────────────────────────────────

export const getShowSeatAvailability = async (showId) => {
    const response = await apiRequest({
        url: `/bookings/shows/${showId}/seats`,
        method: "GET",
        cache: "no-store", // always fresh — seats change in real time
    });

    if (!response.success) throw new Error(response.message);
    return response.data;
};

// ─── Create Booking ───────────────────────────────────────────────────────────

export const createBooking = async (payload) => {
    const response = await apiRequest({
        url: "/bookings",
        method: "POST",
        data: payload,
        withCredentials: true,
        cache: "no-store",
    });

    revalidateTag("bookings");

    if (!response.success) throw new Error(response.message);
    return response.data;
};

// ─── My Bookings (customer) ───────────────────────────────────────────────────

export const getMyBookings = async (params = {}) => {
    const response = await apiRequest({
        url: "/bookings/me",
        method: "GET",
        params,
        withCredentials: true,
        cache: "force-cache",
        tags: ["bookings", "my-bookings"],
    });

    if (!response.success) return { bookings: [], total: 0, page: 1, totalPages: 0 };
    return response.data;
};

// ─── All Bookings (admin) ─────────────────────────────────────────────────────

export const getAllBookings = async (params = {}) => {
    const response = await apiRequest({
        url: "/bookings",
        method: "GET",
        params,
        withCredentials: true,
        cache: "force-cache",
        tags: ["bookings"],
    });

    if (!response.success) return { bookings: [], total: 0, page: 1, totalPages: 0 };
    return response.data;
};

// ─── Get Booking By ID ────────────────────────────────────────────────────────

export const getBookingById = async (bookingId) => {
    const response = await apiRequest({
        url: `/bookings/${bookingId}`,
        method: "GET",
        withCredentials: true,
        cache: "force-cache",
        tags: ["bookings", `booking-${bookingId}`],
    });

    if (!response.success) throw new Error(response.message);
    return response.data;
};

// ─── Get Tickets By Booking ───────────────────────────────────────────────────

export const getTicketsByBooking = async (bookingId) => {
    const response = await apiRequest({
        url: `/bookings/${bookingId}/tickets`,
        method: "GET",
        withCredentials: true,
        cache: "force-cache",
        tags: ["bookings", `booking-${bookingId}`, "tickets"],
    });

    if (!response.success) throw new Error(response.message);
    return response.data;
};

// ─── Confirm Booking ──────────────────────────────────────────────────────────

export const confirmBooking = async (bookingId) => {
    const response = await apiRequest({
        url: `/bookings/${bookingId}/confirm`,
        method: "PATCH",
        withCredentials: true,
        cache: "no-store",
    });

    revalidateTag("bookings");
    revalidateTag(`booking-${bookingId}`);
    revalidateTag("tickets");

    if (!response.success) throw new Error(response.message);
    return response.data;
};

// ─── Cancel Booking ───────────────────────────────────────────────────────────

export const cancelBooking = async (bookingId) => {
    const response = await apiRequest({
        url: `/bookings/${bookingId}/cancel`,
        method: "PATCH",
        withCredentials: true,
        cache: "no-store",
    });

    revalidateTag("bookings");
    revalidateTag(`booking-${bookingId}`);
    revalidateTag("tickets");

    if (!response.success) throw new Error(response.message);
    return response.data;
};

// ─── Expire Stale Bookings (internal / cron) ──────────────────────────────────

export const expireStaleBookings = async () => {
    const response = await apiRequest({
        url: "/bookings/internal/expire",
        method: "POST",
        withCredentials: true,
        cache: "no-store",
    });

    revalidateTag("bookings");

    if (!response.success) throw new Error(response.message);
    return response.data;
};
