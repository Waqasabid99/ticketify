import ContactPage from "@/components/pages/Contact";

export const generateMetadata = async () => {
    return {
        title: "Contact Us",
        description: "Contact us",
    };
};

const page = () => {
    return (
        <ContactPage />
    )
}

export default page