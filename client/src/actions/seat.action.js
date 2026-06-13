import { apiRequest } from "@/api/apiHandler";

export const getSeatByScreen = async (screenIds) => {

    const res = await apiRequest(
        {
            url: `/seats/${screenIds}/seats`,
            method: "GET",
            withCredentials: false,
            cache: "force-cache",
            tags: ["seats"],
        }
    );
    if (!res.success) {
        throw new Error(res.message)
    }
    return res.data;
};
