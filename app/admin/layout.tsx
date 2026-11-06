import { cookies } from "next/headers";
import { currentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata = {
    title: "Admin",
};

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Dark or bright, as picked at the bottom of the sidebar
    const theme = (await cookies()).get("admin-theme")?.value === "light" ? "light" : "dark";

    // The login page shows without the sidebar
    const admin = await currentAdmin();
    if (!admin) {
        return <div data-admin-theme={theme} className="min-h-screen bg-zinc-950 text-white">{children}</div>;
    }

    // Number shown on the sidebar badge: submissions nobody has replied to yet
    const waiting = await prisma.submission.count({ where: { status: "pending" } });

    return (
        <div data-admin-theme={theme} className="min-h-screen lg:flex bg-zinc-950 text-white">
            <AdminNav waiting={waiting} admin={admin} theme={theme} />
            <main className="flex-1 min-w-0 px-4 py-6 md:px-8 md:py-8 max-w-6xl">{children}</main>
        </div>
    );
}
