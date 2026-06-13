import { getMovies, getReleasedMovies } from "@/actions/movies.action"
import Hero from "@/components/home/Hero"
import Movies from "@/components/home/Movies"

const page = async () => {
  const { movies } = await getMovies();
  const releasedMovies = await getReleasedMovies();

  return (
    <>
      {movies?.length > 0 && (
        <Hero movies={movies} />
      )}

      {releasedMovies?.length > 0 && (
        <Movies movies={releasedMovies} title="Now Showing" />
      )}

      {movies?.length > 0 && (
        <>
          <Movies movies={movies} title="Coming Soon" />
          <Movies movies={movies} title="Events" />
        </>
      )}
    </>
  )
}

export default page;