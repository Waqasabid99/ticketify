import { getMovieBySlug } from "@/actions/movies.action";
import MovieDetailPage from "@/components/movie/MovieDetail";
import { generateMovieMetadata } from "@/lib";

export const generateMetadata = async ({ params }) => {
    const { slug } = await params;
    const movie = await getMovieBySlug(slug);
    return generateMovieMetadata(movie);
}

const page = async ({ params }) => {
    const { slug } = await params;
    const movie = await getMovieBySlug(slug);
    return (
        <MovieDetailPage movie={movie} />
    )
};

export default page;