import { getMovies } from "@/actions/movies.action"
import AllMoviesClient from "@/components/movie/AllMoviesClient";

export const generateMetadata = async () => {
    return {
        title: "Movies",
        description: "Browse and filter all movies",
    }
}

const page = async ({ searchParams }) => {
    const params = await searchParams;
    const { movies } = await getMovies(params);
    const urlParams = new URLSearchParams();
    let title = "All Movies";

    Object.keys(params).forEach((key) => {
        if (params[key]) {
            urlParams.append(key, params[key]);

            if (key === "genreSlug") {
                title = `${params[key]} movies`;
            } else if (key === "castSlug") {
                title = `Movies featuring ${params[key]}`;
            } else if (key === "search") {
                title = `Results for "${params[key]}"`;
            }
        }
    });


    return (
        <main className="min-h-screen">
            <AllMoviesClient movies={movies} title={title} />
        </main>
    )
}

export default page;
