import Login from '@/components/auth/Login'

export const metadata = {
    title: "Login - Ticketify",
    description: "Login to your account - Ticketify",
}

const page = () => {
    return (
        <>
            <Login />
        </>
    )
}

export default page