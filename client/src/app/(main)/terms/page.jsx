import TermsOfService from "@/components/pages/Terms";

export const generateMetadata = async () => {
    return {
        title: "Terms of Use",
        description: "Terms of Use",
    };
};

const page = () => {
    return (
        <TermsOfService />
    )
}

export default page