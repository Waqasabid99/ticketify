import Settings from "@/components/dashboard/Setting/Settings";

export const generateMetadata = async () => {
    return {
        title: "Settings",
        description: "Settings page",
    };
};

const page = () => {
    return (
        <Settings />
    )
}

export default page