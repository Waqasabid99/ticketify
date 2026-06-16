import { getEnums } from "@/actions/enum.action";
import { getMovies } from "@/actions/movies.action";
import { getMyReviews, getReviews } from "@/actions/review.action";
import Reviews from "@/components/dashboard/review/Reviews";

export const generateMetadata = async () => {
    return {
        title: "Reviews - Dashboard",
        description: "Manage and moderate reviews for movies",
    };
};

const page = async ({ searchParams, params }) => {
    const sParams = await searchParams;
    const { role } = await params;
    const pageVal = sParams?.page || 1;
    const limitVal = sParams?.limit || 10;

    let data, movieData, userRoles;
    if (role === "owner" || role === "manager" || role === "staff") {
        console.log(role, "Admin reviews...");
        [data, movieData, userRoles] = await Promise.all([
            getReviews({ page: pageVal, limit: limitVal }),
            getMovies({ page: 1, limit: 0 }),
            getEnums("userRole")
        ]);

    } else if (role === "customer") {
        console.log("Customer reviews...");
        [data, movieData, userRoles] = await Promise.all([
            getMyReviews(),
            getMovies({ page: 1, limit: 0 }),
            getEnums("userRole")
        ]);
    }

    const pagination = {
        page: data?.page,
        limit: data?.limit,
        total: data?.total,
        totalPages: data?.totalPages,
    }

    const adminRoles = userRoles?.filter((role) => role !== "CUSTOMER");
    return (
        <Reviews reviews={role === "customer" ? data : data?.reviews || []} pagination={pagination} movies={movieData?.movies} adminRoles={adminRoles} />
    )
}

export default page