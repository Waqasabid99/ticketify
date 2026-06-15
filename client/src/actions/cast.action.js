"use server";

import { apiRequest } from "@/api/apiHandler";
import { revalidateTag } from "next/cache";

export const getCast = async (movieId) => {
    const response = await apiRequest({
        url: `/movies/${movieId}/cast`,
        method: "GET",
        cache: "force-cache",
        tags: ["cast"],
    });

    if (!response.success) throw new Error(response.message);
    console.log(response.data);
    return response.data;
};

export const addCast = async (payload) => {
    const response = await apiRequest({
        url: `/movies/${payload.movieId}/cast`,
        method: "POST",
        data: payload,
        withCredentials: true,
    });

    revalidateTag("cast", "max", 1);

    if (!response.success) throw new Error(response.message);
    console.log(response.data);
    return response.data;
};

export const updateCast = async (payload) => {
    const response = await apiRequest({
        url: `/movies/${payload.movieId}/cast/${payload.castId}`,
        method: "PATCH",
        data: payload,
        withCredentials: true
    });

    revalidateTag("cast", "max", 1);

    if (!response.success) throw new Error(response.message);
    console.log(response.data);
    return response.data;
};

export const deleteCast = async (payload) => {
    const response = await apiRequest({
        url: `/movies/${payload.movieId}/cast`,
        method: "DELETE",
        data: payload,
        withCredentials: true
    });

    revalidateTag("cast", "max", 1);

    if (!response.success) throw new Error(response.message);
    console.log(response.data);
    return response.data;
};

export const removeCastMember = async (payload) => {
    const response = await apiRequest({
        url: `/movies/${payload.movieId}/cast/${payload.castId}`,
        method: "DELETE",
        withCredentials: true,
    });
    revalidateTag("cast", "max", 1);
    if (!response.success) throw new Error(response.message);
    console.log(response.data);
    return response.data;
};
