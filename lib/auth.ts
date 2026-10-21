import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, isValidSessionToken } from "./session";

// True when the person viewing the page is logged in to the admin panel
export async function isAdmin() {
    const cookieStore = await cookies();
    return isValidSessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

// Sends anyone who isn't logged in to the login page.
// Every admin page and admin action calls this, in addition to proxy.ts.
export async function requireAdmin() {
    if (!(await isAdmin())) redirect("/admin/login");
}
