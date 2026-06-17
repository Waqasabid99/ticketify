import PrivacyPolicy from "@/components/pages/PrivacyPolicy";

export const generateMetadata = async () => {
    return {
        title: "Privacy Policy",
        description: "Privacy Policy",
    };
};

const page = () => {
    return (
        <PrivacyPolicy />
    )
}

export default page