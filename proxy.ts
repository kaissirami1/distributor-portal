import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isAuthenticated = request.cookies.get("admin-auth")?.value === "true";

    if (pathname === "/admin/login") {
        if (isAuthenticated) {
            return NextResponse.redirect(new URL("/admin/submissions", request.url));
        }
        return NextResponse.next();
    }

    if (!isAuthenticated) {
        return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*"],
};