import { getEnums } from "@/actions/enum.action"
import AddShow from "@/components/dashboard/show/AddShow"

export const generateMetadata = async () => {
    return {
        title: "New Show - Dashboard",
        description: "New Show Page"
    }
}

const page = async () => {
    const [seatType, pricingType] = await Promise.all([
        getEnums("seatType"),
        getEnums("pricingType")
    ]);

    return (
        <AddShow seatTypes={seatType} priceTypes={pricingType} />
    )
}

export default page