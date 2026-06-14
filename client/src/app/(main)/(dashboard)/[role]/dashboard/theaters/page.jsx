import { getTheaters } from "@/actions/theater.action"
import Theaters from "@/components/dashboard/theatre/Theaters"

export const generateMetadata = async () => {
    return {
        title: "Theaters - Dashboard",
        description: "Manage your movie theaters",
    }
}

const page = async ({ searchParams }) => {
    const params = await searchParams;
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const theaters = await getTheaters({ page, limit });
    const pagination = {
        page: theaters?.page,
        limit: theaters?.limit,
        total: theaters?.total,
        totalPages: theaters?.totalPages,
    }

    console.log(theaters.cinemas)
    return (
        <Theaters theaters={theaters?.cinemas} pagination={pagination} />
    )
}

export default page;
