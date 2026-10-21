import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { DashboardCharts } from "./DashboardCharts";
import { STATUSES, statusInfo } from "@/lib/status";
import { StatusBadge } from "@/components/StatusBadge";
import { AdminLink, EmptyState, PageHeader, Panel, Stat } from "@/components/admin/ui";
import { CheckIcon } from "@/components/admin/icons";
import { daysAgo, daysSince, formatDate, timeAgo, waitingTone } from "@/lib/dates";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
    await requireAdmin();

    const weekAgo = daysAgo(7);
    const thirtyDaysAgo = daysAgo(30);

    const [total, newThisWeek, statusCounts, needsReply, recent, recentDates, withCategory] = await Promise.all([
        prisma.submission.count(),
        prisma.submission.count({ where: { createdAt: { gte: weekAgo } } }),
        Promise.all(STATUSES.map((status) => prisma.submission.count({ where: { status } }))),
        // Waiting the longest comes first
        prisma.submission.findMany({
            where: { status: "pending" },
            orderBy: { createdAt: "asc" },
            select: { id: true, productName: true, companyName: true, name: true, createdAt: true, category: true },
        }),
        prisma.submission.findMany({
            orderBy: { createdAt: "desc" },
            take: 6,
            select: { id: true, productName: true, companyName: true, name: true, status: true, createdAt: true },
        }),
        prisma.submission.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, select: { createdAt: true } }),
        prisma.submission.findMany({ where: { category: { not: null } }, select: { category: true } }),
    ]);

    const counts = STATUSES.map((status, i) => ({ status, ...statusInfo[status], value: statusCounts[i] }));
    const count = (s: string) => counts.find((c) => c.status === s)?.value ?? 0;

    // Submissions per day for the last 30 days
    const countsByDay: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
        countsByDay[daysAgo(i).toISOString().slice(0, 10)] = 0;
    }
    recentDates.forEach((s) => {
        const key = s.createdAt.toISOString().slice(0, 10);
        if (key in countsByDay) countsByDay[key]++;
    });
    const dailyData = Object.entries(countsByDay).map(([date, n]) => ({ date, count: n }));

    const categoryCounts: Record<string, number> = {};
    withCategory.forEach(({ category }) => {
        if (category) categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    const topCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, n]) => ({ name, count: n }));

    return (
        <div className="space-y-8">
            <PageHeader
                title="Dashboard"
                description={new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                actions={<AdminLink href="/admin/submissions">All submissions</AdminLink>}
            />

            {/* ── Needs your reply ── */}
            <Panel
                title={
                    <span className="flex items-center gap-2">
                        Needs your reply
                        {needsReply.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-300 text-black text-xs font-bold">{needsReply.length}</span>
                        )}
                    </span>
                }
                action={needsReply.length > 0 && <Link href="/admin/submissions?status=pending" className="text-sm text-zinc-400 hover:text-white">See all →</Link>}
            >
                {needsReply.length === 0 ? (
                    <div className="flex items-center gap-3 text-zinc-400">
                        <CheckIcon className="w-5 h-5 text-green-400" /> You're all caught up. Every submission has been answered.
                    </div>
                ) : (
                    <ul className="divide-y divide-zinc-800 -my-2">
                        {needsReply.map((s) => {
                            const days = daysSince(s.createdAt);
                            return (
                                <li key={s.id}>
                                    <Link href={`/admin/submissions/${s.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 -mx-2 px-2 rounded-lg hover:bg-zinc-800/60 transition">
                                        <div className="flex-1 min-w-48">
                                            <p className="font-medium">{s.productName}</p>
                                            <p className="text-sm text-zinc-500">{s.companyName || s.name}{s.category ? ` · ${s.category}` : ""}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-medium ${waitingTone(days)}`}>
                                                {days === 0 ? "Came in today" : `Waiting ${days} day${days === 1 ? "" : "s"}`}
                                            </p>
                                            <p className="text-xs text-zinc-500">Received {formatDate(s.createdAt)}</p>
                                        </div>
                                        <span className="text-zinc-500" aria-hidden="true">→</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Panel>

            {/* ── Numbers ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Waiting for reply" value={count("pending")} tone={count("pending") ? "text-amber-300" : "text-white"} href="/admin/submissions?status=pending" />
                <Stat label="Under review" value={count("reviewing")} tone="text-blue-400" href="/admin/submissions?status=reviewing" />
                <Stat label="Approved" value={count("approved")} tone="text-green-400" href="/admin/submissions?status=approved" />
                <Stat label="New this week" value={newThisWeek} href="/admin/submissions" />
            </div>

            {/* ── Latest submissions ── */}
            <Panel title="Latest submissions" action={<Link href="/admin/submissions" className="text-sm text-zinc-400 hover:text-white">View all {total} →</Link>}>
                {recent.length === 0 ? (
                    <EmptyState title="No submissions yet" text="When vendors submit products on your website, they show up here." />
                ) : (
                    <ul className="divide-y divide-zinc-800 -my-2">
                        {recent.map((s) => (
                            <li key={s.id}>
                                <Link href={`/admin/submissions/${s.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 -mx-2 px-2 rounded-lg hover:bg-zinc-800/60 transition">
                                    <div className="flex-1 min-w-48">
                                        <p className="font-medium">{s.productName}</p>
                                        <p className="text-sm text-zinc-500">{s.companyName || s.name}</p>
                                    </div>
                                    <StatusBadge status={s.status} />
                                    <p className="text-sm text-zinc-500 w-28 text-right">{timeAgo(s.createdAt)}</p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </Panel>

            {/* ── Charts ── */}
            <DashboardCharts
                dailyData={dailyData}
                statusData={counts.map((c) => ({ label: c.label, value: c.value, color: c.chart }))}
                topCategories={topCategories}
            />
        </div>
    );
}
