import { NextResponse } from "next/server";
import { clearAuthCookies, proxyAuthRequest } from "@/lib/authProxy";

export async function POST() {
    const { response, data } = await proxyAuthRequest({
        path: "/auth/logout",
        forwardCookies: true,
    });

    await clearAuthCookies();

    return NextResponse.json(data, { status: response.status });
}
