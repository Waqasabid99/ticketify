import { NextResponse } from "next/server";
import {
    applyAuthCookiesFromResponse,
    clearAuthCookies,
    proxyAuthRequest,
} from "@/lib/authProxy";

export async function POST() {
    const { response, data } = await proxyAuthRequest({
        path: "/auth/refresh-token",
        forwardCookies: true,
    });

    if (!response.ok) {
        await clearAuthCookies();
        return NextResponse.json(data, { status: response.status });
    }

    await applyAuthCookiesFromResponse(response);

    return NextResponse.json(data);
}
