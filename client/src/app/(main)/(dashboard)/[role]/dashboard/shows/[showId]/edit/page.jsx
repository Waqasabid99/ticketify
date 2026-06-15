import { getEnums } from '@/actions/enum.action';
import { getShowById } from '@/actions/show.action';
import EditShow from '@/components/dashboard/show/EditShow'

export const generateMetadata = async () => {
    return {
        title: "Edit Show - Dashboard",
        description: "Edit Show Page"
    }
}

const page = async ({ params }) => {
    const { showId } = await params;

    const [show, seatType, pricingType] = await Promise.all([
        getShowById(showId),
        getEnums("seatType"),
        getEnums("pricingType")
    ])
    return (
        <EditShow show={show} seatTypes={seatType} priceTypes={pricingType} />
    )
}

export default page