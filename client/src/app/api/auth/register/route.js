import { NextResponse } from "next/server";
import { proxyAuthRequest } from "@/lib/authProxy";

export async function POST(request) {
    const body = await request.json();
    const { response, data } = await proxyAuthRequest({
        path: "/auth/register",
        body,
    });

    return NextResponse.json(data, { status: response.status });
}
