import { getMovies } from "@/actions/movies.action"
import Movies from "@/components/home/Movies";

export const generateMetadata = async () => {
    return {
        title: "Movies",
        description: "Movies",
    }
}

const page = async () => {
    const { movies } = await getMovies();

    return (
        <main className="min-h-screen">
            <Movies movies={movies} title="All Movies" />
        </main>
    )
}

export default page