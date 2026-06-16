import { getAllBookings, getMyBookings } from "@/actions/booking.action";
import { getEnums } from "@/actions/enum.action";
import Bookings from "@/components/dashboard/booking/Bookings";

export const generateMetadata = async () => {
    return {
        title: "Bookings - Dashboard",
        description: "Bookings Management",
    };
};

const page = async ({ searchParams, params }) => {
    const { role } = await params;
    const query = await searchParams;
    const pageVal = query?.page || 1;
    const limitVal = query?.limit || 10;

    let data;
    if (role === "customer") {
        data = await getMyBookings({ page: pageVal, limit: limitVal });
    } else {
        data = await getAllBookings({ page: pageVal, limit: limitVal });
    }
    const userRoles = await getEnums("userRole");

    const pagination = {
        page: data?.page,
        limit: data?.limit,
        total: data?.total,
        totalPages: data?.totalPages,
    }
    const adminRoles = userRoles?.filter((role) => role !== "CUSTOMER");

    return (
        <Bookings bookings={data?.bookings || []} pagination={pagination} adminRoles={adminRoles} />
    );
};

export default page;
