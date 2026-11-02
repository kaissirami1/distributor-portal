import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { STORE_STAGES } from "@/lib/stores";
import { formatDate, timeAgo } from "@/lib/dates";
import { AdminLink, EmptyState, PageHeader, Panel } from "@/components/admin/ui";
import { CheckIcon, PlusIcon, SearchIcon } from "@/components/admin/icons";
import { StageBadge } from "./StageBadge";

export const metadata = { title: "Stores" };

type PageProps = { searchParams: Promise<{ stage?: string; q?: string; deleted?: string }> };

// End of today, so anything due today counts as due
function endOfToday() {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
}

export default async function StoresPage({ searchParams }: PageProps) {
    await requireAdmin();
    const { stage, q, deleted } = await searchParams;
    const stageFilter = STORE_STAGES.some((s) => s.key === stage) ? stage! : "all";
    const searchQuery = q?.trim() || "";

    const stores = await prisma.store.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
            visits: { orderBy: { date: "desc" }, take: 1 },
            _count: { select: { visits: true } },
        },
    });
    const sampleCounts = await prisma.storeVisit.groupBy({ by: ["storeId"], where: { samplesGiven: { not: null } }, _count: { _all: true } });
    const gotSamples = new Set(sampleCounts.map((g) => g.storeId));

    const dueBy = endOfToday();
    const due = stores
        .filter((s) => s.followUpOn && s.followUpOn <= dueBy && s.stage !== "not_interested")
        .sort((a, b) => a.followUpOn!.getTime() - b.followUpOn!.getTime());

    const shown = stores.filter((s) => {
        if (stageFilter !== "all" && s.stage !== stageFilter) return false;
        if (!searchQuery) return true;
        const hay = `${s.name} ${s.city ?? ""} ${s.type ?? ""} ${s.contactName ?? ""} ${s.address ?? ""}`.toLowerCase();
        return hay.includes(searchQuery.toLowerCase());
    });

    const tabs = [{ key: "all", label: "All", count: stores.length }, ...STORE_STAGES.map((s) => ({ key: s.key as string, label: s.label, count: stores.filter((x) => x.stage === s.key).length }))];
    const tabHref = (key: string) => {
        const params = new URLSearchParams();
        if (key !== "all") params.set("stage", key);
        if (searchQuery) params.set("q", searchQuery);
        const query = params.toString();
        return `/admin/stores${query ? `?${query}` : ""}`;
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Stores"
                description="Every store you visit or call: who's in charge, samples you left, and what to do next."
                actions={<AdminLink href="/admin/stores/new" variant="primary"><PlusIcon className="w-4 h-4" /> Add store</AdminLink>}
            />

            {deleted && (
                <p role="status" className="flex items-center gap-2 rounded-lg border border-green-900 bg-green-950/40 px-4 py-3 text-sm text-green-300">
                    <CheckIcon className="w-4 h-4" /> Deleted &quot;{deleted}&quot;.
                </p>
            )}

            {/* ── Follow-ups due ── */}
            {due.length > 0 && (
                <Panel title={<span className="flex items-center gap-2">Follow up today <span className="px-2 py-0.5 rounded-full bg-amber-300 text-black text-xs font-bold">{due.length}</span></span>}>
                    <ul className="divide-y divide-zinc-800 -my-2">
                        {due.map((s) => (
                            <li key={s.id}>
                                <Link href={`/admin/stores/${s.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 -mx-2 px-2 rounded-lg hover:bg-zinc-800/60 transition">
                                    <div className="flex-1 min-w-48">
                                        <p className="font-medium">{s.name}</p>
                                        <p className="text-sm text-zinc-400">{s.nextStep || "Follow up"}</p>
                                    </div>
                                    <p className={`text-sm font-medium ${s.followUpOn! < new Date(new Date().setHours(0, 0, 0, 0)) ? "text-red-400" : "text-amber-300"}`}>
                                        {formatDate(s.followUpOn!)}
                                    </p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Panel>
            )}

            {/* Stage tabs */}
            <div className="flex flex-wrap gap-2">
                {tabs.map((t) => (
                    <Link
                        key={t.key}
                        href={tabHref(t.key)}
                        className={`px-3.5 py-1.5 rounded-full text-sm border transition ${stageFilter === t.key ? "bg-white text-black border-white font-semibold" : "border-zinc-700 text-zinc-300 hover:border-zinc-500"}`}
                    >
                        {t.label} <span className={stageFilter === t.key ? "text-zinc-600" : "text-zinc-500"}>{t.count}</span>
                    </Link>
                ))}
            </div>

            <form action="/admin/stores" method="GET" className="flex gap-2">
                {stageFilter !== "all" && <input type="hidden" name="stage" value={stageFilter} />}
                <label className="flex-1 flex items-center gap-2 bg-black border border-zinc-700 rounded-lg px-3 focus-within:border-zinc-500">
                    <SearchIcon className="w-4 h-4 text-zinc-500" />
                    <input name="q" defaultValue={searchQuery} placeholder="Search by store, city, type or contact" aria-label="Search stores" className="flex-1 bg-transparent py-2 text-sm focus:outline-none" />
                </label>
                <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold bg-white text-black hover:bg-zinc-200">Search</button>
            </form>

            {shown.length === 0 ? (
                <EmptyState
                    title={stores.length === 0 ? "No stores yet" : "No stores match"}
                    text={stores.length === 0 ? "Add the stores you visit, then log each visit, call and sample." : undefined}
                    action={stores.length === 0 && <AdminLink href="/admin/stores/new" variant="primary"><PlusIcon className="w-4 h-4" /> Add store</AdminLink>}
                />
            ) : (
                <div className="border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="hidden md:grid grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_9rem_8rem] gap-4 px-4 py-2.5 bg-zinc-900 text-xs uppercase tracking-wide text-zinc-500">
                        <span>Store</span>
                        <span>Person in charge</span>
                        <span>Last contact</span>
                        <span>Stage</span>
                    </div>
                    <ul className="divide-y divide-zinc-800">
                        {shown.map((s) => {
                            const last = s.visits[0];
                            return (
                                <li key={s.id}>
                                    <Link
                                        href={`/admin/stores/${s.id}`}
                                        className="grid md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_9rem_8rem] gap-x-4 gap-y-1 items-center px-4 py-3.5 hover:bg-zinc-900 transition"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-medium truncate">{s.name}</p>
                                            <p className="text-sm text-zinc-500 truncate">{[s.type, s.city].filter(Boolean).join(" · ") || "No details yet"}</p>
                                        </div>
                                        <p className="text-sm truncate">
                                            {s.contactName ? <>{s.contactName}{s.contactRole && <span className="text-zinc-500"> · {s.contactRole}</span>}</> : <span className="text-zinc-600">Not known yet</span>}
                                        </p>
                                        <div className="text-sm">
                                            {last ? <p>{timeAgo(last.date)}</p> : <p className="text-zinc-600">Never</p>}
                                            <p className="text-xs text-zinc-500">
                                                {s._count.visits} contact{s._count.visits === 1 ? "" : "s"}{gotSamples.has(s.id) ? " · samples ✓" : ""}
                                            </p>
                                        </div>
                                        <div><StageBadge stage={s.stage} /></div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}
