import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
    const isAdmin = req.cookies.get("admin-auth")?.value === "true";
    const { pathname } = req.nextUrl;

    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
        if (!isAdmin) {
            return NextResponse.redirect(new URL("/admin/login", req.url));
        }
    }

    return NextResponse.next();
}