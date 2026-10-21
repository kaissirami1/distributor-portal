import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, sessionUser } from "./session";

// The logged-in admin's username (e.g. "Rami"), or null if nobody is logged in
export async function currentAdmin() {
    const cookieStore = await cookies();
    return sessionUser(cookieStore.get(SESSION_COOKIE)?.value);
}

// True when the person viewing the page is logged in to the admin panel
export async function isAdmin() {
    return (await currentAdmin()) !== null;
}

// Sends anyone who isn't logged in to the login page, otherwise returns their username.
// Every admin page and admin action calls this, in addition to proxy.ts.
export async function requireAdmin() {
    const admin = await currentAdmin();
    if (!admin) redirect("/admin/login");
    return admin;
}
