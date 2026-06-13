import { getGenres } from "@/actions/genre.action";
import Genres from "@/components/dashboard/genre/Genres";

export const generateMetadata = () => {
    return {
        title: "Genres - Ticketify Dashboard",
        description: "Genres - Ticketify Dashboard",
    };
};

const page = async ({ searchParams }) => {
    const params = await searchParams;
    const pageVal = params?.page || 1;
    const limitVal = params?.limit || 10;
    const data = await getGenres({ page: pageVal, limit: limitVal });
    const pagination = {
        page: data?.page,
        limit: data?.limit,
        total: data?.total,
        totalPages: data?.totalPages,
    }
    console.log(data)
    return (
        <Genres genre={data?.genres} pagination={pagination} />
    )
}

export default page