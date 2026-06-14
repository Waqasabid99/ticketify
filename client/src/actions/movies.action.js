"use server";
import { apiRequest } from "@/api/apiHandler";
import { revalidateTag } from "next/cache";

export const getMovies = async (searchParams = "") => {
    const res = await apiRequest(
        {
            url: "/movies",
            method: "GET",
            withCredentials: false,
            params: searchParams,
            cache: "force-cache",
            tags: ["movies"],
        }
    );

    if (!res.success) {
        throw new Error(res.message)
    };

    console.log(res.data)
    return res.data;
}

export const getMovieBySlug = async (slug) => {
    const res = await apiRequest(
        {
            url: `/movies/${slug}`,
            method: "GET",
            withCredentials: false,
            cache: "force-cache",
            tags: ["movies"],
        }
    );

    if (!res.success) {
        throw new Error(res.message)
    };

    console.log(res.data)
    return res.data;
}

export const getReleasedMovies = async () => {
    const res = await apiRequest(
        {
            url: "/movies/now-showing",
            method: "GET",
            withCredentials: false,
            cache: "force-cache",
            tags: ["movies"],
        }
    );

    if (!res.success) {
        throw new Error(res.message)
    }

    console.log("Released movies : ", res?.data?.movies);
    return res?.data?.movies;
};

export const createMovie = async (payload) => {
    const response = await apiRequest({
        url: "/movies",
        method: "POST",
        data: payload,
        withCredentials: true,
    });

    revalidateTag("movies", "max", 1);

    if (!response.success) {
        console.log(response)
        throw new Error(response.message)
    }
    console.log(response.data);
    return response.data;
};

export const updateMovie = async (id, payload) => {
    const response = await apiRequest({
        url: `/movies/${id}`,
        method: "PATCH",
        data: payload,
        withCredentials: true
    });

    revalidateTag("movies", "max", 1);

    if (!response.success) throw new Error(response.message);
    console.log(response.data);
    return response.data;
};

export const deleteMovie = async (id) => {
    const response = await apiRequest({
        url: `/movies/${id}`,
        method: "DELETE",
        withCredentials: true
    });

    revalidateTag("movies", "max", 1);

    if (!response.success) throw new Error(response.message);
    console.log(response.data);
    return response.data;
};
