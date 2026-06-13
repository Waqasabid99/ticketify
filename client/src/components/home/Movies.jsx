import LottieAnimation from "../ui/LottieAnimation";
import MovieCard from "../ui/MovieCard";
import Loader from "../ui/Loader";
import animationData from "../../../public/animations/not-found.json";

const Movies = ({ movies, title, isLoading = false }) => {

    if (isLoading) {
        return (
            <section className="mt-20 px-10 flex items-center justify-center">
                <Loader variant="dots" size="lg" text="Finding movies..." />
            </section>
        );
    }

    if (!movies || movies?.length === 0) {
        return (
            <section className="mt-20 px-10 flex flex-col items-center justify-center gap-4">
                <LottieAnimation animationData={animationData} className="size-72" />
                <div className="text-center">
                    <p className="text-3xl font-semibold text-(--color-text-primary)">
                        No movies found
                    </p>
                    <p className="text-base text-(--color-text-secondary) mt-2">
                        Try adjusting your filters or search for something else.
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="my-10 px-10">
            <h2 className="text-2xl font-bold mb-6">{title}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-5 gap-y-8">
                {movies?.map((movie) => (
                    <MovieCard key={movie?.id} movie={movie} />
                ))}
            </div>
        </section>
    );
};

export default Movies;
