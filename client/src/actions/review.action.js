"use server";

import { apiRequest } from "@/api/apiHandler";
import { revalidateTag } from "next/cache";

export const getReviews = async (params) => {
    const response = await apiRequest({
        url: "/reviews/reviews",
        method: "GET",
        params: params,
        withCredentials: true,
        tags: ["reviews"]
    });

    if (!response.success) {
        return [];
    }

    return response.data;
};

export const getMovieReviews = async (movieId) => {
    const response = await apiRequest({
        url: `/reviews/movies/${movieId}/reviews`,
        method: "GET",
        withCredentials: true,
        cache: "force-store",
        tags: ["reviews"]
    });

    if (!response.success) {
        return [];
    }

    return response.data;
};

export const createReview = async (payload) => {
    const response = await apiRequest({
        url: `/reviews/movies/${payload.movieId}/reviews`,
        method: "POST",
        data: payload,
        withCredentials: true,
    });

    if (!response.success) {
        return false;
    };

    revalidateTag("reviews", "max");

    return true;
};

export const getOwnReview = async (movieId) => {
    const response = await apiRequest({
        url: `/reviews/movies/${movieId}/reviews/me`,
        method: "GET",
        withCredentials: true,
        tags: ["reviews"]
    });

    if (!response.success) {
        return null;
    }

    return response.data;
};

export const getMyReviews = async () => {
    const response = await apiRequest({
        url: `/reviews/movies/my/reviews`,
        method: "GET",
        withCredentials: true,
        tags: ["reviews"]
    });

    if (!response.success) {
        return null;
    }

    return response.data;
};

export const updateOwnReview = async (movieId, payload) => {
    const response = await apiRequest({
        url: `/reviews/movies/${movieId}/reviews/me`,
        method: "PATCH",
        data: payload,
        withCredentials: true,
    });

    if (!response.success) {
        return false;
    };

    revalidateTag("reviews", "max");

    return true;
};

export const deleteOwnReview = async (movieId) => {
    const response = await apiRequest({
        url: `/reviews/movies/${movieId}/reviews/me`,
        method: "DELETE",
        withCredentials: true,
    });

    if (!response.success) {
        return false;
    };

    revalidateTag("reviews", "max");

    return true;
};

export const deleteReviewByAdmin = async (reviewId) => {
    const response = await apiRequest({
        url: `/reviews/reviews/${reviewId}`,
        method: "DELETE",
        withCredentials: true,
    });

    console.log(response);
    if (!response.success) {
        return false;
    };

    revalidateTag("reviews", "max");

    return true;
};

export const moderateReview = async (reviewId, payload) => {
    const response = await apiRequest({
        url: `/reviews/reviews/${reviewId}/status`,
        method: "PATCH",
        data: payload,
        withCredentials: true,
    });

    console.log("Moderate Review Response", response);

    if (!response.success) {
        return false;
    };

    revalidateTag("reviews", "max");

    return true;
};
