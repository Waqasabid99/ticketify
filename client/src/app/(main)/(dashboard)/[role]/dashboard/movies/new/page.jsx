import { getEnums } from "@/actions/enum.action"
import { getGenres } from "@/actions/genre.action"
import AddMovie from "@/components/dashboard/movie/AddMovie"

export const generateMetadata = async () => {
    return {
        title: "Add Movie - Dashboard",
        description: "Add new movie",
    }
}

const page = async () => {
    const [genresData, statusData] = await Promise.all([
        getGenres(),
        getEnums("movieStatus"),
    ])

    console.log("Genres Data: ", genresData);
    console.log("Status Data: ", statusData);
    return (
        <AddMovie genres={genresData?.genres} status={statusData} />
    )
}

export default page