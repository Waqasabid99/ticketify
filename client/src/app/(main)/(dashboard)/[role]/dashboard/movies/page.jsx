import { getMovies } from "@/actions/movies.action";
import Movies from "@/components/dashboard/movie/Movies"

export const generateMetadata = async () => {
    return {
        title: "Movies - Dashboard",
        description: "Manage movies",
    }
}

const page = async ({ searchParams }) => {
    const params = await searchParams;
    const pageVal = params?.page || 1;
    const limitVal = params?.limit || 10;
    const data = await getMovies({ page: pageVal, limit: limitVal });
    const pagination = {
        page: data?.page,
        limit: data?.limit,
        total: data?.total,
        totalPages: data?.totalPages,
    }
    return (
        <Movies
            movies={data.movies}
            pagination={pagination}
        />
    )
}

export default page;
