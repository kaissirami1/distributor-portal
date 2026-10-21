import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, SESSION_DAYS, checkLogin, createSessionToken } from "@/lib/session";
import { minutesAgo } from "@/lib/dates";
import { site } from "@/lib/site";

export const metadata = { title: "Admin login" };

// After this many wrong tries from one device, logins pause for PAUSE_MINUTES
const MAX_TRIES = 5;
const PAUSE_MINUTES = 15;

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    const { error } = await searchParams;

    async function login(formData: FormData) {
        "use server";

        const username = String(formData.get("username") ?? "").trim();
        const password = String(formData.get("password") ?? "");
        const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
        const since = minutesAgo(PAUSE_MINUTES);

        // Stop password guessing: too many wrong tries from this device, or for this username
        const [ipFailures, userFailures] = await Promise.all([
            prisma.loginAttempt.count({ where: { ip, success: false, createdAt: { gte: since } } }),
            prisma.loginAttempt.count({ where: { username: username.toLowerCase(), success: false, createdAt: { gte: since } } }),
        ]);
        if (ipFailures >= MAX_TRIES || userFailures >= MAX_TRIES * 4) {
            redirect("/admin/login?error=locked");
        }

        const user = checkLogin(username, password);
        await prisma.loginAttempt.create({ data: { username: username.toLowerCase().slice(0, 100), ip, success: !!user } });
        if (!user) redirect("/admin/login?error=1");

        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE, await createSessionToken(user), {
            httpOnly: true,
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: SESSION_DAYS * 24 * 60 * 60,
        });
        cookieStore.delete("admin-auth"); // the old, insecure login cookie

        redirect("/admin");
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <img src="/logo.png" alt={site.name} className="h-14 w-auto mx-auto mb-6 rounded" />
                <form action={login} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
                    <h1 className="text-xl font-bold">Admin login</h1>

                    {error && (
                        <p role="alert" className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
                            {error === "locked"
                                ? `Too many wrong tries. For safety, logins are paused for ${PAUSE_MINUTES} minutes. Please try again later.`
                                : "That username or password isn't right. Please try again."}
                        </p>
                    )}

                    <label className="block">
                        <span className="text-sm text-zinc-300">Username</span>
                        <input name="username" autoComplete="username" autoCapitalize="none" required className="admin-input mt-1.5" />
                    </label>
                    <label className="block">
                        <span className="text-sm text-zinc-300">Password</span>
                        <input name="password" type="password" autoComplete="current-password" required className="admin-input mt-1.5" />
                    </label>

                    <button className="w-full bg-white text-black py-2.5 rounded-lg font-semibold hover:bg-zinc-200 transition">
                        Log in
                    </button>
                    <p className="text-xs text-zinc-500 text-center">You'll stay logged in on this device for {SESSION_DAYS} days.</p>
                </form>
            </div>
        </div>
    );
}
