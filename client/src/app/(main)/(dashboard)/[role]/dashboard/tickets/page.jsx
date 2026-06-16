import { getEnums } from "@/actions/enum.action";
import { getAllTickets, getMyTickets } from "@/actions/ticket.action";
import Tickets from "@/components/dashboard/ticket/Tickets";

export const generateMetadata = async () => {
    return {
        title: "Tickets - Dashboard",
        description: "Tickets Management",
    };
};

const page = async ({ searchParams, params }) => {
    const { role } = await params;
    const query = await searchParams;
    const pageVal = query?.page || 1;
    const limitVal = query?.limit || 10;

    let data;
    if (role === "customer") {
        data = await getMyTickets({ page: pageVal, limit: limitVal });
    } else {
        data = await getAllTickets({ page: pageVal, limit: limitVal });
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
        <Tickets tickets={data?.tickets || []} pagination={pagination} adminRoles={adminRoles} />
    )
}

export default page;
