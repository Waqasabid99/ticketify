import CheckoutPage from '@/components/checkout/Checkout'
export const generateMetadata = async () => {
    return {
        title: "Checkout",
        description: "Checkout",
    };
};

const page = async ({ searchParams }) => {
    const { clientSecret } = await searchParams;
    return (
        <CheckoutPage clientSecret={clientSecret} />
    )
}

export default page