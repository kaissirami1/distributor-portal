import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { SubmissionsClient } from "./SubmissionsClient";
import { STATUSES, statusInfo } from "@/lib/status";
import { AdminLink, PageHeader } from "@/components/admin/ui";
import { DownloadIcon, SearchIcon } from "@/components/admin/icons";

export const metadata = { title: "Submissions" };

type PageProps = {
    searchParams: Promise<{
        status?: string;
        q?: string;
    }>;
};

export default async function SubmissionsPage({ searchParams }: PageProps) {
    await requireAdmin();
    const { status, q } = await searchParams;

    const statusFilter = status && STATUSES.includes(status as never) ? status : "all";
    const searchQuery = q?.trim() || "";

    const search = searchQuery
        ? {
            OR: [
                { name: { contains: searchQuery, mode: "insensitive" as const } },
                { email: { contains: searchQuery, mode: "insensitive" as const } },
                { companyName: { contains: searchQuery, mode: "insensitive" as const } },
                { productName: { contains: searchQuery, mode: "insensitive" as const } },
                { category: { contains: searchQuery, mode: "insensitive" as const } },
                { trackingId: { contains: searchQuery, mode: "insensitive" as const } },
            ],
        }
        : {};

    const [submissions, grouped] = await Promise.all([
        prisma.submission.findMany({
            where: { AND: [statusFilter !== "all" ? { status: statusFilter } : {}, search] },
            // Pending: waiting longest first. Everything else: newest first.
            orderBy: { createdAt: statusFilter === "pending" ? "asc" : "desc" },
            select: {
                id: true,
                productName: true,
                companyName: true,
                name: true,
                email: true,
                status: true,
                createdAt: true,
                category: true,
                trackingId: true,
            },
        }),
        prisma.submission.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

    const countFor = (s: string) => grouped.find((g) => g.status === s)?._count._all ?? 0;
    const total = grouped.reduce((sum, g) => sum + g._count._all, 0);
    const tabs = [
        { key: "all", label: "All", count: total },
        ...STATUSES.map((s) => ({ key: s, label: statusInfo[s].label, count: countFor(s) })),
    ];

    const tabHref = (key: string) => {
        const params = new URLSearchParams();
        if (key !== "all") params.set("status", key);
        if (searchQuery) params.set("q", searchQuery);
        const query = params.toString();
        return `/admin/submissions${query ? `?${query}` : ""}`;
    };

    return (
        <div>
            <PageHeader
                title="Submissions"
                description="Products vendors have sent through your website. Click any row to open it."
                actions={
                    <AdminLink href="/admin/export" newTab variant="secondary">
                        <DownloadIcon className="w-4 h-4" /> Export to Excel
                    </AdminLink>
                }
            />

            {/* Status tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
                {tabs.map((t) => (
                    <Link
                        key={t.key}
                        href={tabHref(t.key)}
                        className={`px-3.5 py-1.5 rounded-full text-sm border transition ${statusFilter === t.key
                            ? "bg-white text-black border-white font-semibold"
                            : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                            }`}
                    >
                        {t.label} <span className={statusFilter === t.key ? "text-zinc-600" : "text-zinc-500"}>{t.count}</span>
                    </Link>
                ))}
            </div>

            {/* Search */}
            <form action="/admin/submissions" method="GET" className="flex gap-2 mb-6">
                {statusFilter !== "all" && <input type="hidden" name="status" value={statusFilter} />}
                <label className="flex-1 flex items-center gap-2 bg-black border border-zinc-700 rounded-lg px-3 focus-within:border-zinc-500">
                    <SearchIcon className="w-4 h-4 text-zinc-500" />
                    <input
                        name="q"
                        defaultValue={searchQuery}
                        placeholder="Search by product, company, name, email or tracking ID"
                        aria-label="Search submissions"
                        className="flex-1 bg-transparent py-2 text-sm focus:outline-none"
                    />
                </label>
                <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold bg-white text-black hover:bg-zinc-200">Search</button>
                {searchQuery && (
                    <Link href={statusFilter === "all" ? "/admin/submissions" : `/admin/submissions?status=${statusFilter}`} className="px-4 py-2 rounded-lg text-sm border border-zinc-700 text-zinc-300 hover:border-zinc-500">
                        Clear
                    </Link>
                )}
            </form>

            <SubmissionsClient
                submissions={submissions.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() }))}
                emptyText={searchQuery ? `Nothing matches "${searchQuery}".` : statusFilter === "pending" ? "Nothing is waiting for a reply." : "No submissions here yet."}
            />
        </div>
    );
}
