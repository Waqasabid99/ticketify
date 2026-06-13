import { apiRequest } from "@/api/apiHandler";

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
