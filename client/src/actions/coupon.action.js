"use server";

import { apiRequest } from "@/api/apiHandler";
import { revalidateTag } from "next/cache";

export const getCoupons = async (params) => {
    const response = await apiRequest({
        url: "/coupons",
        method: "GET",
        params: params,
        withCredentials: true,
        cache: "force-cache",
        tags: ["coupons"],
    });

    if (!response.success) {
        return [];
    }

    return response?.data;
};

export const getCoupon = async (couponId) => {
    const response = await apiRequest({
        url: `/coupons/${couponId}`,
        method: "GET",
        withCredentials: true,
        cache: "force-cache",
        tags: ["coupons"],
    });

    if (!response.success) {
        return null;
    }

    return response?.data;
};

export const getCouponUsages = async (couponId) => {
    const response = await apiRequest({
        url: `/coupons/${couponId}/usages`,
        method: "GET",
        withCredentials: true,
        cache: "force-cache",
        tags: ["coupons"],
    });

    if (!response.success) {
        return [];
    }

    return response?.data;
};

export const createCoupon = async (payload) => {
    const response = await apiRequest({
        url: "/coupons",
        method: "POST",
        data: payload,
        withCredentials: true,
    });

    revalidateTag("coupons", "max");

    if (!response.success) {
        throw new Error(response.message);
    }

    return response?.data;
};

export const updateCoupon = async (payload) => {
    const response = await apiRequest({
        url: `/coupons/${payload.couponId}`,
        method: "PATCH",
        data: payload,
        withCredentials: true,
    });

    revalidateTag("coupons", "max");

    if (!response.success) {
        throw new Error(response.message);
    }

    return response?.data;
};

export const updateCouponStatus = async (payload) => {
    const response = await apiRequest({
        url: `/coupons/${payload.couponId}/status`,
        method: "PATCH",
        data: payload,
        withCredentials: true,
    });

    revalidateTag("coupons", "max");

    if (!response.success) {
        throw new Error(response.message);
    }

    return response?.data;
};

export const deleteCoupon = async (couponId) => {
    const response = await apiRequest({
        url: `/coupons/${couponId}`,
        method: "DELETE",
        withCredentials: true,
    });

    revalidateTag("coupons", "max");

    if (!response.success) {
        throw new Error(response.message);
    }

    return response?.data;
};

export const applyCoupon = async (payload) => {
    const response = await apiRequest({
        url: `/coupons/apply`,
        method: "POST",
        data: payload,
        withCredentials: true,
    });

    revalidateTag("coupons", "max");

    if (!response.success) {
        throw new Error(response.message);
    }

    return response?.data;
};

export const removeCoupon = async (payload) => {
    const response = await apiRequest({
        url: `/coupons/remove`,
        method: "DELETE",
        data: payload,
        withCredentials: true,
    });

    revalidateTag("coupons", "max");

    if (!response.success) {
        throw new Error(response.message);
    }

    return response?.data;
};
