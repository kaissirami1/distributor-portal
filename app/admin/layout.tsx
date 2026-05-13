import { cookies } from "next/headers";
import Link from "next/link";

export const metadata = {
    title: "Admin | Makram Distributions",
};

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const isLoggedIn = cookieStore.get("admin-auth")?.value === "true";

    if (!isLoggedIn) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen flex bg-zinc-950 text-white">
            <aside className="w-56 flex-shrink-0 border-r border-zinc-800 flex flex-col">
                <div className="px-5 py-5 border-b border-zinc-800">
                    <a href="/">
                        <img src="/logo.png" alt="Makram Distributions" className="h-10 w-auto" />
                    </a>
                    <p className="text-xs text-zinc-500 mt-2">Admin Panel</p>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1">
                    <SidebarLink href="/admin" label="Dashboard" icon="📊" />
                    <SidebarLink href="/admin/submissions" label="Submissions" icon="📋" />
                    <SidebarLink href="/admin/products" label="Products" icon="📦" />
                    <SidebarLink href="/admin/export" label="Export Excel" icon="📥" />
                </nav>

                <div className="px-3 py-4 border-t border-zinc-800 space-y-1">
                    <a
                        href="/"
                        target="_blank"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                    >
                        <span>🌐</span> View Site
                    </a>
                    <form action="/api/admin/logout" method="POST">
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition w-full"
                        >
                            <span>🚪</span> Logout
                        </button>
                    </form>
                </div>
            </aside>

            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}

function SidebarLink({
    href,
    label,
    icon,
}: {
    href: string;
    label: string;
    icon: string;
}) {
    return (
        <Link
            href={href}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
            <span>{icon}</span>
            {label}
        </Link>
    );
}