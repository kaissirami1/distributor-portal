import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, isValidSessionToken } from "./lib/session";

// Runs before every admin page and admin API request: only logged-in admins get through.
export default async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isAuthenticated = await isValidSessionToken(request.cookies.get(SESSION_COOKIE)?.value);

    if (pathname === "/admin/login") {
        return isAuthenticated ? NextResponse.redirect(new URL("/admin", request.url)) : NextResponse.next();
    }

    // Logging out always works, even with an expired session
    if (pathname === "/api/admin/logout") return NextResponse.next();

    if (!isAuthenticated) {
        if (pathname.startsWith("/api/")) {
            return NextResponse.json({ error: "Not logged in" }, { status: 401 });
        }
        return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/api/admin/:path*"],
};
