export const getMovies = async (searchParams = "") => {
    try {
        const res = await fetch(`${process.env.API_BASE_URL}/movies?${searchParams}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            next: {
                tags: ["movies"],
            }
        })

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message);
        }

        const { data } = await res.json();
        const movies = data?.movies;

        return { movies };
    } catch (err) {
        console.log("Error fetching movies : ", err)
        throw new Error(err.message)
    }
}

export const getMovieBySlug = async (slug) => {
    try {
        const res = await fetch(`${process.env.API_BASE_URL}/movies/${slug}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            next: {
                tags: ["movies"],
            }
        })

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message);
        }

        const { data } = await res.json();

        return { movie: data };
    } catch (err) {
        console.log("Error fetching movie : ", err)
        throw new Error(err.message)
    }
}

export const getReleasedMovies = async () => {
    try {
        const res = await fetch(`${process.env.API_BASE_URL}/movies/now-showing`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            next: {
                tags: ["movies"],
            }
        })

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message);
        }

        const { data } = await res.json();
        const movies = data?.movies;

        return { releasedMovies: movies };
    } catch (err) {
        console.log("Error fetching released movies : ", err)
        throw new Error(err.message)
    }
}