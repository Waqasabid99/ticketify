import { apiRequest } from "@/api/apiHandler";

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
