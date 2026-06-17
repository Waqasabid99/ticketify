"use server";

import { apiRequest } from "@/api/apiHandler";
import { revalidateTag } from "next/cache";

export const getScreens = async (params = {}) => {
    const response = await apiRequest({
        url: "/screens",
        method: "GET",
        params: params,
        cache: "force-cache",
        tags: ["screens"],
    })

    if (!response.success) {
        throw new Error(response.message)
    }

    return response.data
};

export const getScreen = async (id) => {
    const response = await apiRequest({
        url: `/screens/${id}`,
        method: "GET",
        cache: "force-cache",
        tags: ["screens"],
    })

    if (!response.success) {
        throw new Error(response.message)
    }

    return response.data
};

export const createScreen = async (screenData) => {
    const response = await apiRequest({
        url: "/screens",
        method: "POST",
        withCredentials: true,
        data: screenData,
        cache: "no-store",
    })

    if (!response.success) {
        throw new Error(response.message)
    }

    revalidateTag("screens", "max");
    revalidateTag("movies", "max");

    return response.data
};

export const updateScreen = async (id, screenData) => {
    const response = await apiRequest({
        url: `/screens/${id}`,
        method: "PATCH",
        withCredentials: true,
        data: screenData,
        cache: "no-store",
    })

    if (!response.success) {
        throw new Error(response.message)
    }

    revalidateTag("screens", "max");
    revalidateTag("movies", "max");

    return response.data
};

export const deleteScreen = async (id) => {
    const response = await apiRequest({
        url: `/screens/${id}`,
        method: "DELETE",
        withCredentials: true,
        cache: "no-store",
    })

    if (!response.success) {
        throw new Error(response.message)
    }

    revalidateTag("screens", "max");
    revalidateTag("movies", "max");

    return response.data
};
