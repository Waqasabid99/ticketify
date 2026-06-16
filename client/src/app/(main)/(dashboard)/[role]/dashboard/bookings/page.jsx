import { getAllBookings } from "@/actions/booking.action";
import { getEnums } from "@/actions/enum.action";
import Bookings from "@/components/dashboard/booking/Bookings";

export const generateMetadata = async () => {
    return {
        title: "Bookings - Dashboard",
        description: "Bookings Management",
    };
};

const page = async ({ searchParams }) => {
    const params = await searchParams;
    const pageVal = params?.page || 1;
    const limitVal = params?.limit || 10;
    const [data, userRoles] = await Promise.all([
        await getAllBookings({ page: pageVal, limit: limitVal }),
        await getEnums("userRole")
    ])

    const pagination = {
        page: data?.page,
        limit: data?.limit,
        total: data?.total,
        totalPages: data?.totalPages,
    }
    const adminRoles = userRoles?.filter((role) => role !== "CUSTOMER");

    return (
        <Bookings bookings={data?.bookings} pagination={pagination} adminRoles={adminRoles} />
    );
};

export default page;
