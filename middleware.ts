import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    const isAdmin = req.cookies.get("admin-auth")?.value === "true";

    const { pathname } = req.nextUrl;

    // Protect ONLY admin routes
    if (pathname.startsWith("/admin")) {
        if (!isAdmin) {
            return NextResponse.redirect(new URL("/admin/login", req.url));
        }
    }

    return NextResponse.next();
}