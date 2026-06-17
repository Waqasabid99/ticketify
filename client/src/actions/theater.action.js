"use server";

import { apiRequest } from "@/api/apiHandler"
import { revalidateTag } from "next/cache";

export const getTheaters = async (params = {}) => {
    const response = await apiRequest({
        url: "/cinemas",
        method: "GET",
        params: params,
        cache: "force-cache",
        tags: ["theaters"],
    })

    if (!response.success) {
        throw new Error(response.message)
    }

    return response.data
};

export const getTheater = async (id) => {
    const response = await apiRequest({
        url: `/cinemas/${id}`,
        method: "GET",
        cache: "force-cache",
        tags: ["theaters"],
    })

    if (!response.success) {
        throw new Error(response.message)
    }

    return response.data
};

export const createTheater = async (theaterData) => {
    const response = await apiRequest({
        url: "/cinemas",
        method: "POST",
        withCredentials: true,
        data: theaterData,
        cache: "no-store",
    })

    if (!response.success) {
        throw new Error(response.message)
    }

    revalidateTag("theaters", "max");
    revalidateTag("movies", "max");
    revalidateTag("screens", "max");

    return response.data
};

export const updateTheater = async (id, theaterData) => {
    const response = await apiRequest({
        url: `/cinemas/${id}`,
        method: "PATCH",
        withCredentials: true,
        data: theaterData,
        cache: "no-store",
    })

    if (!response.success) {
        throw new Error(response.message)
    }

    revalidateTag("theaters", "max");
    revalidateTag("movies", "max");
    revalidateTag("screens", "max");

    return response.data
};

export const deleteTheater = async (id) => {
    const response = await apiRequest({
        url: `/cinemas/${id}`,
        method: "DELETE",
        withCredentials: true,
        cache: "no-store",
    })

    if (!response.success) {
        throw new Error(response.message)
    }

    revalidateTag("theaters", "max");
    revalidateTag("movies", "max");
    revalidateTag("screens", "max");

    return response.data
};
