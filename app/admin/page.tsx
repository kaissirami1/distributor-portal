import { prisma } from "../../lib/prisma";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardCharts } from "./DashboardCharts";
import { STATUSES, statusInfo } from "@/lib/status";
import { StatusBadge } from "@/components/StatusBadge";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
    const cookieStore = await cookies();
    const isLoggedIn = cookieStore.get("admin-auth")?.value === "true";
    if (!isLoggedIn) redirect("/admin/login");

    // ── Stat counts ──────────────────────────────────────────────────────────
    const [total, ...statusCounts] = await Promise.all([
        prisma.submission.count(),
        ...STATUSES.map((status) => prisma.submission.count({ where: { status } })),
    ]);
    const counts = STATUSES.map((status, i) => ({ status, ...statusInfo[status], value: statusCounts[i] }));

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
                {counts.map((c) => (
                    <StatCard key={c.status} label={c.label} value={c.value} color={c.text} />
                ))}
            </div>

            {/* ── Charts ── */}
            <DashboardCharts
                dailyData={dailyData}
                statusData={counts.map((c) => ({ label: c.label, value: c.value, color: c.chart }))}
                topCategories={topCategories}
            />

            {/* ── Recent submissions ── */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mt-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Recent Submissions</h2>
                    <Link href="/admin/submissions" className="text-sm text-gray-400 underline">
                        View all →
                    </Link>
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
                                <StatusBadge status={s.status} />
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

