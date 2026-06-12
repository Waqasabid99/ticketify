import { getMovies, getReleasedMovies } from "@/actions/movies.action"
import Hero from "@/components/home/Hero"
import Movies from "@/components/home/Movies"

const page = async () => {
  const { movies } = await getMovies();
  const { releasedMovies } = await getReleasedMovies();
  console.log(movies)
  return (
    <>
      <Hero movies={movies} />
      <Movies movies={releasedMovies} title="Now Showing" />
      <Movies movies={movies} title="Coming Soon" />
      <Movies movies={movies} title="Events" />
    </>
  )
}

export default page;