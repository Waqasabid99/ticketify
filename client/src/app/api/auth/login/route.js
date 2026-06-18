// app/api/auth/login/route.js
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request) {
    const body = await request.json();

    // Forward request to Render backend
    const response = await fetch(`${process.env.API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
        return NextResponse.json(data, { status: response.status });
    }

    // Extract token from the backend's Set-Cookie header
    // instead of the response body — token never touches JS
    const setCookieHeader = response.headers.get("set-cookie");
    const accessToken = extractTokenFromSetCookie(setCookieHeader, "accessToken");
    const refreshToken = extractTokenFromSetCookie(setCookieHeader, "refreshToken");

    // Re-set on Vercel domain — never exposed to client JS
    const cookieStore = await cookies();

    if (accessToken) {
        cookieStore.set("accessToken", accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            maxAge: 60 * 15,
            path: "/",
        });
    }

    if (refreshToken) {
        cookieStore.set("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
        });
    }

    // Return body WITHOUT tokens — only user data
    return NextResponse.json({
        success: true,
        data: { user: data.data.user }
    });
}

// Parse "accessToken=abc123; HttpOnly; ..." format
export function extractTokenFromSetCookie(setCookieHeader, tokenName) {
    if (!setCookieHeader) return null;
    const match = setCookieHeader
        .split(",")
        .find(part => part.trim().startsWith(`${tokenName}=`));
    if (!match) return null;
    return match.trim().split(";")[0].split("=")[1];
}
