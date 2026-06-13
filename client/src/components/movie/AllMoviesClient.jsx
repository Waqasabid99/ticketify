"use client";

import MovieFilters from "./MovieFilters";
import Movies from "@/components/home/Movies";

const AllMoviesClient = ({ movies, title }) => {
    return (
        <>
            <MovieFilters />
            <Movies movies={movies} title={title} />
        </>
    );
};

export default AllMoviesClient;
