export const getSeatByScreen = async (screenIds) => {
    try {
        const res = await fetch(`${process.env.API_BASE_URL}/seats/${screenIds}/seats`)
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message);
        }
        const { data } = await res.json();
        return { seats: data?.seats };
    } catch (err) {
        console.log("Error fetching seats : ", err);
        throw new Error(err.message);
    }
}