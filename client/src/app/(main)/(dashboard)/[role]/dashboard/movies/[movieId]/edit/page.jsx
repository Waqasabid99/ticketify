import { getEnums } from "@/actions/enum.action";
import { getGenres } from "@/actions/genre.action";
import { getMovieBySlug } from "@/actions/movies.action";
import EditMovie from "@/components/dashboard/movie/EditMovie"

export const generateMetadata = async () => {
    return {
        title: "Edit Movie - Dashboard",
        description: "Edit movie",
    }
}

const page = async ({ params }) => {
    const { movieId } = await params;

    const [genresData, statusData, movieData] = await Promise.all([
        getGenres(),
        getEnums("movieStatus"),
        getMovieBySlug(movieId)
    ])

    console.log("Genres Data: ", genresData?.genres);
    console.log("Status Data: ", statusData);
    console.log("Movie Data: ", movieData);
    return (
        <EditMovie
            genres={genresData?.genres}
            statuses={statusData}
            movie={movieData}
        />
    )
}

export default page