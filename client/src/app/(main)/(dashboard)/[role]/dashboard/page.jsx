import { getAnalyticsData } from "@/actions/analytics.action";
import DashboardPage from "@/components/dashboard/Dashboard";

export const generateMetadata = async () => {
    return {
        title: "Dashboard",
        description: "Manage your events and bookings",
    };
};

const page = async ({ params }) => {
    const role = await params.role;
    const data = await getAnalyticsData();

    console.log("Analytics Data is : ", data);
    console.log("Role is : ", role);

    return (
        <DashboardPage analyticsData={data} role={role} />
    )
}

export default page