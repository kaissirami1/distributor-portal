import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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

    // Allow login page to render without sidebar
    if (!isLoggedIn) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen flex bg-zinc-950 text-white">
            {/* Sidebar */}
            <aside className="w-56 flex-shrink-0 border-r border-zinc-800 flex flex-col">
                {/* Logo */}
                <div className="px-5 py-5 border-b border-zinc-800">
                    <a href="/">
                        <img src="/logo.png" alt="Makram Distributions" className="h-10 w-auto" />
                    </a>
                    <p className="text-xs text-zinc-500 mt-2">Admin Panel</p>
                </div>

                {/* Nav links */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    <SidebarLink href="/admin" label="Dashboard" icon="📊" exact />
                    <SidebarLink href="/admin/submissions" label="Submissions" icon="📋" />
                    <SidebarLink href="/admin/products" label="Products" icon="📦" />
                    <SidebarLink href="/admin/export" label="Export Excel" icon="📥" />
                </nav>

                {/* Bottom links */}
                <div className="px-3 py-4 border-t border-zinc-800 space-y-1">
                    <a
                        href="/"
                        target="_blank"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                    >
                        <span>🌐</span> View Site
                    </a>
                    <a
                        href="/admin/login"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition"
                    >
                        <span>🚪</span> Logout
                    </a>
                </div>
            </aside>

            {/* Main content */}
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
    exact,
}: {
    href: string;
    label: string;
    icon: string;
    exact?: boolean;
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