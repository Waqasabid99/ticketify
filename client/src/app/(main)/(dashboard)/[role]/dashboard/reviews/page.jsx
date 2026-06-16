import { getEnums } from "@/actions/enum.action";
import { getMovies } from "@/actions/movies.action";
import { getReviews } from "@/actions/review.action";
import Reviews from "@/components/dashboard/review/Reviews";

export const generateMetadata = async () => {
    return {
        title: "Reviews - Dashboard",
        description: "Manage and moderate reviews for movies",
    };
};

const page = async ({ searchParams }) => {
    const params = await searchParams;
    const pageVal = params?.page || 1;
    const limitVal = params?.limit || 10;
    const [data, movieData, userRoles] = await Promise.all([
        getReviews({ page: pageVal, limit: limitVal }),
        getMovies({ page: 1, limit: 0 }),
        getEnums("userRole")
    ]);

    const pagination = {
        page: data?.page,
        limit: data?.limit,
        total: data?.total,
        totalPages: data?.totalPages,
    }
    const adminRoles = userRoles?.filter((role) => role !== "CUSTOMER");
    return (
        <Reviews reviews={data?.reviews} pagination={pagination} movies={movieData?.movies} adminRoles={adminRoles} />
    )
}

export default page