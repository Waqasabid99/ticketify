"use server";

import { apiRequest } from "@/api/apiHandler";
import { revalidateTag } from "next/cache";

export const getGenres = async (params = {}) => {
    const response = await apiRequest(
        {
            url: "/genres",
            method: "GET",
            withCredentials: false,
            params,
            cache: "force-cache",
            tags: ["genres"]
        }
    );

    if (!response.success) {
        return [];
    };

    return response.data;
};

export const createGenre = async (genre) => {
    const response = await apiRequest(
        {
            url: "/genres",
            method: "POST",
            withCredentials: true,
            data: genre,
            cache: "no-store",
        },
    );

    if (!response.success) {
        throw new Error(response.message);
    };

    revalidateTag("genres", "max");
    revalidateTag("movies", "max");

    return response;
};

export const updateGenre = async (id, genre) => {
    const response = await apiRequest(
        {
            url: `/genres/${id}`,
            method: "PATCH",
            withCredentials: true,
            data: genre,
            cache: "no-store",
        },
    );

    if (!response.success) {
        throw new Error(response.message);
    };

    revalidateTag("genres", "max");
    revalidateTag("movies", "max");

    return response;
};

export const deleteGenre = async (id) => {
    const response = await apiRequest(
        {
            url: `/genres/${id}`,
            method: "DELETE",
            withCredentials: true,
            cache: "no-store",
        },
    );

    if (!response.success) {
        throw new Error(response.message);
    };

    revalidateTag("genres", "max");
    revalidateTag("movies", "max");

    return response;
};
