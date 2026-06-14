"use server";

import { apiRequest } from "@/api/apiHandler"

export const getEnums = async (type) => {
    const response = await apiRequest({
        url: `/enums?type=${type}`,
        method: "GET",
    })
    if (!response) return [];

    return response.data;
};
