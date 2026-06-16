import { getAnalyticsData } from "@/actions/analytics.action";
import DashboardPage from "@/components/dashboard/Dashboard";

export const generateMetadata = async () => {
    return {
        title: "Dashboard",
        description: "Manage your events and bookings",
    };
};

const page = async ({ params }) => {
    const { role } = await params;
    const data = await getAnalyticsData();

    return (
        <DashboardPage analyticsData={data} role={role.toUpperCase()} />
    )
}

export default page