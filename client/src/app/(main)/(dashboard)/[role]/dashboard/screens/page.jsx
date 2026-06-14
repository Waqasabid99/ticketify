import { getScreens } from "@/actions/screen.action";
import { getTheaters } from "@/actions/theater.action";
import Screens from "@/components/dashboard/screen/Screens";

export const generateMetadata = async () => {
    return {
        title: "Screens - Dashboard",
        description: "Manage screens and auditoriums",
    }
}

const page = async ({ searchParams }) => {
    const params = await searchParams;
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const theaters = await getTheaters();
    const screens = await getScreens({ page, limit });
    console.log(screens)
    const pagination = {
        page: screens?.page,
        limit: screens?.limit,
        total: screens?.total,
        totalPages: screens?.totalPages,
    }
    return (
        <Screens screens={screens?.screens} pagination={pagination} theaters={theaters?.cinemas} SCREEN_TYPES={screens?.screenType} SEAT_TYPES={screens?.seatType} />
    )
}

export default page