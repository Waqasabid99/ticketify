export const verifyEmail = async (token) => {
    try {
        const res = await fetch(`${process.env.API_BASE_URL}/email/verify`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ token })
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message);
        }

        return res.json();
    } catch (error) {
        console.log("Error in Email verification : ", error)
        throw new Error(error.message)
    }
}