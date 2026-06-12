import { getMovieBySlug } from '@/actions/movies.action';
import { getSeatByScreen } from '@/actions/seat.action';
import { getShowByMovie } from '@/actions/show.action';
import BookTicket from '@/components/movie/BookTicket'
import { generateMovieMetadata } from '@/lib/';

export const generateMetadata = async ({ params }) => {
    const { slug } = await params;
    const { movie } = await getMovieBySlug(slug);
    return generateMovieMetadata(movie);
}

const page = async ({ params }) => {
    const { slug } = await params;
    const { movie } = await getMovieBySlug(slug);
    const { shows } = await getShowByMovie(movie.id);
    const { seats } = await getSeatByScreen(shows.map((show) => show.screenId))
    console.log(seats)

    return (
        <BookTicket movie={movie} shows={shows} />
    )
}

export default page