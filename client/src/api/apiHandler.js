import { cookies } from "next/headers";
export const apiRequest = async ({
    url,
    method = "GET",
    data = null,
    params = {},

    // auth
    withCredentials = false,

    // cache control
    cache = "force-cache",
    revalidate,
    tags = [],

    headers = {},
}) => {

    const baseUrl = process.env.API_BASE_URL;

    const queryString = new URLSearchParams(
        Object.entries(params).filter(
            ([, value]) =>
                value !== undefined &&
                value !== null
        )
    ).toString();

    const fullUrl = queryString
        ? `${baseUrl}${url}?${queryString}`
        : `${baseUrl}${url}`;

    try {

        const requestHeaders = {
            ...(data && {
                "Content-Type": "application/json",
            }),

            ...headers,
        };

        // Forward cookies for SSR authenticated requests
        if (withCredentials) {
            const cookieStore = await cookies();
            requestHeaders.Cookie =
                cookieStore.toString();
        }

        const response = await fetch(fullUrl, {
            method,
            headers: requestHeaders,
            body:
                data
                    ? JSON.stringify(data)
                    : undefined,

            // Next.js caching control

            cache,

            next:
                cache === "no-store"
                    ? undefined
                    : {
                        ...(revalidate !== undefined && {
                            revalidate,
                        }),

                        ...(tags.length > 0 && {
                            tags,
                        }),
                    },

        });

        const result = await response.json();
        if (!response.ok) {

            throw {
                status: response.status,
                message:
                    result?.message ||
                    "API request failed",
                data: result,
            };

        }

        return result;
    } catch (error) {
        return {

            success: false,

            status:
                error?.status ||
                500,

            message:
                error?.message ||
                "Something went wrong",

            data:
                error?.data ||
                null,
        };

    }
};
