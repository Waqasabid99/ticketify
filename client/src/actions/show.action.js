export const getShowByMovie = async (movieId) => {
    try {
        const res = await fetch(`${process.env.API_BASE_URL}/shows/movie/${movieId}`)
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message);
        }
        const { data } = await res.json();
        return { shows: data?.shows };
    } catch (err) {
        console.log("Error fetching shows : ", err);
        throw new Error(err.message);
    }
};