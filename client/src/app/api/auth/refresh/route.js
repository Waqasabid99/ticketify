// app/api/auth/refresh/route.js
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { extractTokenFromSetCookie } from "../login/route";

export async function POST() {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
        return NextResponse.json({ success: false, message: "No refresh token" }, { status: 401 });
    }

    const response = await fetch(`${process.env.API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Cookie: `refreshToken=${refreshToken}`,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        cookieStore.delete("accessToken");
        cookieStore.delete("refreshToken");
        return NextResponse.json(data, { status: response.status });
    }

    // Same pattern — read from Set-Cookie, re-set on Vercel domain
    const setCookieHeader = response.headers.get("set-cookie");
    const newAccessToken = extractTokenFromSetCookie(setCookieHeader, "accessToken");

    if (newAccessToken) {
        cookieStore.set("accessToken", newAccessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            maxAge: 60 * 15,
            path: "/",
        });
    }

    return NextResponse.json({ success: true });
}
