import { getEnums } from "@/actions/enum.action"
import { getMovies } from "@/actions/movies.action"
import Casts from "@/components/dashboard/cast/Casts"

export const generateMetadata = async () => {
    return {
        title: "Cast - Dashboard",
        description: "Manage cast",
    }
}

const page = async () => {
    const [movieData, roles] = await Promise.all([
        getMovies(),
        getEnums("castRole"),
    ]);

    return (
        <Casts movies={movieData?.movies} roleOptions={roles} />
    )
}

export default page;
