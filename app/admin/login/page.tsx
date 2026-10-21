import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_DAYS, createSessionToken } from "@/lib/session";
import { site } from "@/lib/site";

export const metadata = { title: "Admin login" };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    const { error } = await searchParams;

    async function login(formData: FormData) {
        "use server";

        const username = formData.get("username");
        const password = formData.get("password");

        if (
            !process.env.ADMIN_USERNAME ||
            !process.env.ADMIN_PASSWORD ||
            username !== process.env.ADMIN_USERNAME ||
            password !== process.env.ADMIN_PASSWORD
        ) {
            redirect("/admin/login?error=1");
        }

        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE, await createSessionToken(), {
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
                            That username or password isn't right. Please try again.
                        </p>
                    )}

                    <label className="block">
                        <span className="text-sm text-zinc-300">Username</span>
                        <input name="username" autoComplete="username" required className="admin-input mt-1.5" />
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
