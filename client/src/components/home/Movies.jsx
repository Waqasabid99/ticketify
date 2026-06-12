import MovieCard from "../ui/MovieCard"

const Movies = ({ movies, title }) => {
    return (
        <section className="my-10 px-10">
            <h2 className="text-2xl font-bold mb-4">{title}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-5 gap-y-8">                {movies?.map((movie) => (
                <MovieCard key={movie?.id} movie={movie} />
            ))}
            </div>
        </section>
    )
}

export default Movies