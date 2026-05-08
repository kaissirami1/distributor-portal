import { prisma } from "../../lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardCharts } from "./DashboardCharts";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
    const cookieStore = await cookies();
    const isLoggedIn = cookieStore.get("admin-auth")?.value === "true";
    if (!isLoggedIn) redirect("/admin/login");

    // ── Stat counts ──────────────────────────────────────────────────────────
    const [total, pending, reviewing, approved, rejected] = await Promise.all([
        prisma.submission.count(),
        prisma.submission.count({ where: { status: "pending" } }),
        prisma.submission.count({ where: { status: "reviewing" } }),
        prisma.submission.count({ where: { status: "approved" } }),
        prisma.submission.count({ where: { status: "rejected" } }),
    ]);

    // ── Submissions per day (last 30 days) ───────────────────────────────────
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSubmissions = await prisma.submission.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
    });

    // Group by date string
    const countsByDay: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        countsByDay[key] = 0;
    }
    recentSubmissions.forEach((s) => {
        const key = s.createdAt.toISOString().slice(0, 10);
        if (key in countsByDay) countsByDay[key]++;
    });

    const dailyData = Object.entries(countsByDay).map(([date, count]) => ({
        date,
        count,
    }));

    // ── Top categories ────────────────────────────────────────────────────────
    const allWithCategory = await prisma.submission.findMany({
        select: { category: true },
        where: { category: { not: null } },
    });

    const categoryCounts: Record<string, number> = {};
    allWithCategory.forEach(({ category }) => {
        if (category) categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    const topCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

    // ── Recent submissions ────────────────────────────────────────────────────
    const recent = await prisma.submission.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, productName: true, name: true, status: true, createdAt: true },
    });

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <StatCard label="Total" value={total} color="text-white" />
                <StatCard label="Pending" value={pending} color="text-yellow-400" />
                <StatCard label="Reviewing" value={reviewing} color="text-blue-400" />
                <StatCard label="Approved" value={approved} color="text-green-400" />
                <StatCard label="Rejected" value={rejected} color="text-red-400" />
            </div>

            {/* ── Charts ── */}
            <DashboardCharts
                dailyData={dailyData}
                statusData={[
                    { label: "Pending", value: pending, color: "#facc15" },
                    { label: "Reviewing", value: reviewing, color: "#60a5fa" },
                    { label: "Approved", value: approved, color: "#4ade80" },
                    { label: "Rejected", value: rejected, color: "#f87171" },
                ]}
                topCategories={topCategories}
            />

            {/* ── Recent submissions ── */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mt-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Recent Submissions</h2>
                    <a href="/admin/submissions" className="text-sm text-gray-400 underline">
                        View all →
                    </a>
                </div>
                <div className="space-y-3">
                    {recent.map((s) => (
                        <a
                            key={s.id}
                            href={`/admin/submissions/${s.id}`}
                            className="flex items-center justify-between p-3 rounded-lg bg-black/40 hover:bg-black/60 transition"
                        >
                            <div>
                                <p className="font-medium text-sm">{s.productName}</p>
                                <p className="text-xs text-gray-500">{s.name}</p>
                            </div>
                            <div className="text-right">
                                <span className={`text-xs font-semibold ${statusColor(s.status)}`}>
                                    {s.status}
                                </span>
                                <p className="text-xs text-gray-600 mt-0.5">
                                    {new Date(s.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </a>
                    ))}
                    {recent.length === 0 && (
                        <p className="text-gray-500 text-sm">No submissions yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </div>
    );
}

function statusColor(status: string) {
    switch (status) {
        case "approved": return "text-green-400";
        case "rejected": return "text-red-400";
        case "reviewing": return "text-blue-400";
        default: return "text-yellow-400";
    }
}