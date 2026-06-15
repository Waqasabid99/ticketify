import { getEnums } from "@/actions/enum.action";
import { getAllUsers } from "@/actions/user.action";
import Users from "@/components/dashboard/user/Users";

export const generateMetadata = async () => {
    return {
        title: "Users - Dashboard",
        description: "Manage your users",
    };
};

const page = async ({ searchParams }) => {
    const params = await searchParams;
    const pageVal = params?.page || 1;
    const limitVal = params?.limit || 10;
    const data = await getAllUsers({ page: pageVal, limit: limitVal });
    const [statuses, roles] = await Promise.all([
        getEnums("userStatus"),
        getEnums("userRole")
    ]);
    const pagination = {
        page: data?.page,
        limit: data?.limit,
        total: data?.total,
        totalPages: data?.totalPages,
    }
    return (
        <Users users={data?.users} pagination={pagination} statuses={statuses} roles={roles} />
    )
}

export default page