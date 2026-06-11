import ResetPassword from "@/components/auth/ResetPassword";

export const metadata = {
    title: "Reset Password - Ticketify",
    description: "Reset your password",
};

const page = async ({ searchParams }) => {
    const { token } = await searchParams;

    if (!token) {
        return <div>Token not found</div>
    }

    return <ResetPassword token={token} />
}

export default page