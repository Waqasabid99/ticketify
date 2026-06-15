"use server";

import { apiRequest } from "@/api/apiHandler";
import { revalidateTag } from "next/cache";

export const getAllUsers = async (params) => {
    const response = await apiRequest({
        url: `/users`,
        method: "GET",
        params: params,
        withCredentials: true,
        cache: "force-cache",
        tags: ["users"],
    });

    if (!response.success) {
        throw new Error(response.message);
    }
    return response.data;
};

export const getUserById = async (userId) => {
    const response = await apiRequest({
        url: `/users/${userId}`,
        method: "GET",
        withCredentials: false,
        cache: "force-cache",
        tags: ["users"],
    });

    if (!response.success) {
        throw new Error(response.message);
    }
    return response.data;
};

export const createUser = async (payload) => {
    const response = await apiRequest({
        url: `/users`,
        method: "POST",
        withCredentials: true,
        data: payload
    });

    if (!response.success) {
        throw new Error(response.message);
    };

    revalidateTag("users", "max");
    return response.data;
};

export const updateRole = async (id, payload) => {
    const response = await apiRequest({
        url: `/users/role/${id}`,
        method: "PATCH",
        withCredentials: true,
        data: payload
    });

    if (!response.success) {
        throw new Error(response.message);
    };

    revalidateTag("users", "max");
    return response.data;
};

export const updateStatus = async (id, payload) => {
    const response = await apiRequest({
        url: `/users/status/${id}`,
        method: "PATCH",
        withCredentials: true,
        data: payload
    });

    if (!response.success) {
        throw new Error(response.message);
    };

    revalidateTag("users", "max");
    return response.data;
};

export const updateUser = async (id, payload) => {
    const response = await apiRequest({
        url: `/users/update/${id}`,
        method: "PATCH",
        withCredentials: true,
        data: payload
    });

    if (!response.success) {
        throw new Error(response.message);
    };

    revalidateTag("users", "max");
    return response.data;
};

export const deleteUser = async (id) => {
    const response = await apiRequest({
        url: `/users/${id}`,
        method: "DELETE",
        withCredentials: true,
    });

    if (!response.success) {
        throw new Error(response.message);
    };

    revalidateTag("users", "max");
    return response.data;
};
