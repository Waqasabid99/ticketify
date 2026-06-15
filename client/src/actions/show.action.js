"use server";

import { apiRequest } from "@/api/apiHandler";
import { revalidateTag } from "next/cache";

export const getShows = async () => {
    const res = await apiRequest(
        {
            url: `/shows`,
            method: "GET",
            withCredentials: false,
            cache: "force-cache",
            tags: ["shows"],
        }
    );

    if (!res.success) {
        throw new Error(res.message);
    }
    return res.data;
};

export const getShowByMovie = async (movieId) => {
    const res = await apiRequest(
        {
            url: `/shows/movie/${movieId}`,
            method: "GET",
            withCredentials: false,
            cache: "force-cache",
            tags: ["shows"],
        }
    );

    if (!res.success) {
        throw new Error(res.message);
    }
    return res.data;
};

export const getShowById = async (showId) => {
    const res = await apiRequest(
        {
            url: `/shows/${showId}`,
            method: "GET",
            withCredentials: false,
            cache: "force-cache",
            tags: ["shows"],
        }
    );

    if (!res.success) {
        throw new Error(res.message);
    }
    return res.data;
};

export const createShow = async (payload) => {
    const response = await apiRequest({
        url: `/shows`,
        method: "POST",
        withCredentials: true,
        data: payload
    });

    if (!response.success) {
        throw new Error(response.message);
    };

    revalidateTag('shows', "max");
    return response.data;
};

export const updateShow = async (id, payload) => {
    const response = await apiRequest({
        url: `/shows/${id}`,
        method: "PATCH",
        withCredentials: true,
        data: payload
    });

    if (!response.success) {
        throw new Error(response.message);
    };

    revalidateTag('shows', "max");
    return response.data;
};

export const deleteShow = async (id) => {
    const response = await apiRequest({
        url: `/shows/${id}`,
        method: "DELETE",
        withCredentials: true,
    });

    if (!response.success) {
        throw new Error(response.message);
    };

    revalidateTag('shows', "max");
    return response.data;
};
