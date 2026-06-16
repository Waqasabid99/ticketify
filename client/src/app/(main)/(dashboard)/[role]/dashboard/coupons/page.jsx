import { getCoupon, getCoupons } from "@/actions/coupon.action";
import { getEnums } from "@/actions/enum.action";
import Coupons from "@/components/dashboard/coupon/Coupons";

export const generateMetadata = async () => {
    return {
        title: "Coupons - Dashboard",
        description: "Coupons Management"
    };
};

const page = async ({ searchParams }) => {
    const params = await searchParams;
    const pageVal = params?.page || 1;
    const limitVal = params?.limit || 10;
    const [data, couponTypes] = await Promise.all([
        await getCoupons({ page: pageVal, limit: limitVal }),
        await getEnums("couponType")
    ])

    const pagination = {
        page: data?.page,
        limit: data?.limit,
        total: data?.total,
        totalPages: data?.totalPages,
    }

    return (
        <Coupons coupons={data?.coupons} pagination={pagination} couponTypes={couponTypes} />
    )
}

export default page