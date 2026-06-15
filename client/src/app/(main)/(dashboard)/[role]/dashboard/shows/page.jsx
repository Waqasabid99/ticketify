import { getShows } from "@/actions/show.action"
import Shows from "@/components/dashboard/show/Shows"

export const generateMetadata = async () => {
    return {
        title: "Shows - Dashboard",
        description: "Shows Management Page"
    }
}

const page = async ({ searchParams }) => {
    const params = await searchParams;
    const pageVal = params?.page || 1;
    const limitVal = params?.limit || 10;
    const data = await getShows({ page: pageVal, limit: limitVal });
    const pagination = {
        page: data?.page,
        limit: data?.limit,
        total: data?.total,
        totalPages: data?.totalPages,
    }
    return (
        <Shows shows={data?.shows} pagination={pagination} showStatus={data?.showStatus} />
    )
}

export default page;
