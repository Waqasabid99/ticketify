import CookiePolicy from "@/components/pages/CookiePolicy";

export const generateMetadata = async () => {
    return {
        title: "Cookie Policy",
        description: "Cookie Policy",
    };
};

const page = () => {
    return (
        <CookiePolicy />
    )
}

export default page