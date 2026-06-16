import { getEnums } from "@/actions/enum.action";
import { getAllTickets } from "@/actions/ticket.action";
import Tickets from "@/components/dashboard/ticket/Tickets";

export const generateMetadata = async () => {
    return {
        title: "Tickets - Dashboard",
        description: "Tickets Management",
    };
};

const page = async ({ searchParams }) => {
    const params = await searchParams;
    const pageVal = params?.page || 1;
    const limitVal = params?.limit || 10;
    const [data, userRoles] = await Promise.all([
        await getAllTickets({ page: pageVal, limit: limitVal }),
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
        <Tickets tickets={data?.tickets} pagination={pagination} adminRoles={adminRoles} />
    )
}

export default page;
