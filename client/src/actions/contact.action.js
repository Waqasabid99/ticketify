"use server";

import { apiRequest } from "@/api/apiHandler";

export const sendContactMessage = async (payload) => {
    const response = await apiRequest({
        url: "/contact",
        method: "POST",
        data: payload
    });

    console.log(response);

    if (!response.success) {
        throw new Error(response.message);
    }

    return response;
};
