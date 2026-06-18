import { NextResponse } from "next/server";
import { applyAuthCookiesFromResponse, proxyAuthRequest } from "@/lib/authProxy";

export async function POST(request) {
    const body = await request.json();
    const { response, data } = await proxyAuthRequest({
        path: "/auth/login",
        body,
    });

    if (!response.ok) {
        return NextResponse.json(data, { status: response.status });
    }

    await applyAuthCookiesFromResponse(response);

    return NextResponse.json(data);
}
