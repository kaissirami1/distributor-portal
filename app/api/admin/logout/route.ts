import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST(request: NextRequest) {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
    cookieStore.delete("admin-auth"); // the old login cookie
    return NextResponse.redirect(new URL("/admin/login", request.url), 303);
}
