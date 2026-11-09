import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/inventory";
import { AdminLink, EmptyState, PageHeader, Panel } from "@/components/admin/ui";
import { CheckIcon, PlusIcon, SearchIcon } from "@/components/admin/icons";
import { InventoryTabs } from "../inventory/InventoryTabs";

export const metadata = { title: "Sellers" };

type PageProps = { searchParams: Promise<{ q?: string; deleted?: string }> };

export default async function SellersPage({ searchParams }: PageProps) {
    await requireAdmin();
    const { q, deleted } = await searchParams;
    const searchQuery = q?.trim() || "";

    const [sellers, submissions, itemCount] = await Promise.all([
        prisma.seller.findMany({
            orderBy: { name: "asc" },
            include: { items: { select: { quantity: true, cost: true } } },
        }),
        prisma.submission.findMany({
            where: { status: { not: "rejected" } },
            orderBy: { createdAt: "desc" },
            select: { id: true, name: true, companyName: true, email: true, productName: true, status: true },
        }),
        prisma.inventoryItem.count(),
    ]);

    const shown = sellers.filter((s) => {
        if (!searchQuery) return true;
        const hay = `${s.name} ${s.contactName ?? ""} ${s.city ?? ""} ${s.state ?? ""} ${s.email ?? ""}`.toLowerCase();
        return hay.includes(searchQuery.toLowerCase());
    });

    // People who sent products through the website but aren't sellers here yet (one per email)
    const knownEmails = new Set(sellers.map((s) => s.email?.toLowerCase()).filter(Boolean));
    const nameKey = (t: string) => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim(); // "Raíz" = "Raiz"
    const knownNames = new Set(sellers.map((s) => nameKey(s.name)));
    const suggestions = new Map<string, (typeof submissions)[number]>();
    for (const s of submissions.sort((a, b) => Number(b.status === "approved") - Number(a.status === "approved"))) {
        const email = s.email.toLowerCase();
        const name = nameKey(s.companyName || s.name);
        if (!knownEmails.has(email) && !knownNames.has(name) && !suggestions.has(email)) suggestions.set(email, s);
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Inventory"
                description="The businesses you buy inventory from. Pick one when you add an item."
                actions={<AdminLink href="/admin/sellers/new" variant="primary"><PlusIcon className="w-4 h-4" /> Add seller</AdminLink>}
            />
            <InventoryTabs active="sellers" counts={{ items: itemCount, sellers: sellers.length }} />

            {deleted && (
                <p role="status" className="flex items-center gap-2 rounded-lg border border-green-900 bg-green-950/40 px-4 py-3 text-sm text-green-300">
                    <CheckIcon className="w-4 h-4" /> Deleted &quot;{deleted}&quot;. Their items are still in your inventory.
                </p>
            )}

            {sellers.length > 0 && (
                <form action="/admin/sellers" method="GET" className="flex gap-2">
                    <label className="flex-1 flex items-center gap-2 bg-black border border-zinc-700 rounded-lg px-3 focus-within:border-zinc-500">
                        <SearchIcon className="w-4 h-4 text-zinc-500" />
                        <input name="q" defaultValue={searchQuery} placeholder="Search by name, contact, city or email" aria-label="Search sellers" className="flex-1 bg-transparent py-2 text-sm focus:outline-none" />
                    </label>
                    <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold bg-white text-black hover:bg-zinc-200">Search</button>
                </form>
            )}

            {shown.length === 0 ? (
                <EmptyState
                    title={sellers.length === 0 ? "No sellers yet" : "No sellers match"}
                    text={sellers.length === 0 ? "Add the businesses you buy from, or add one from a submission below." : undefined}
                    action={sellers.length === 0 && <AdminLink href="/admin/sellers/new" variant="primary"><PlusIcon className="w-4 h-4" /> Add seller</AdminLink>}
                />
            ) : (
                <div className="border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="hidden md:grid grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_6rem_9rem] gap-4 px-4 py-2.5 bg-zinc-900 text-xs uppercase tracking-wide text-zinc-500">
                        <span>Seller</span>
                        <span>Contact</span>
                        <span className="text-right">Items</span>
                        <span className="text-right">Stock at cost</span>
                    </div>
                    <ul className="divide-y divide-zinc-800">
                        {shown.map((s) => (
                            <li key={s.id}>
                                <Link
                                    href={`/admin/sellers/${s.id}`}
                                    className="grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_6rem_9rem] gap-x-4 gap-y-1 items-center px-4 py-3.5 hover:bg-zinc-900 transition"
                                >
                                    <div className="min-w-0">
                                        <p className="font-medium truncate">{s.name}</p>
                                        <p className="text-sm text-zinc-500 truncate">{[s.city, s.state].filter(Boolean).join(", ") || "No address yet"}</p>
                                    </div>
                                    <p className="hidden md:block text-sm truncate">
                                        {s.contactName || s.phone || s.email || <span className="text-zinc-600">Not given</span>}
                                    </p>
                                    <p className="text-right text-sm tabular-nums">{s.items.length}<span className="md:hidden text-zinc-500"> item{s.items.length === 1 ? "" : "s"}</span></p>
                                    <p className="hidden md:block text-right text-sm tabular-nums text-zinc-400">{money(s.items.reduce((n, i) => n + i.quantity * i.cost, 0))}</p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {suggestions.size > 0 && (
                <Panel title="From your submissions" action={<span className="text-xs text-zinc-500">Not added as sellers yet</span>}>
                    <ul className="divide-y divide-zinc-800 -my-2">
                        {[...suggestions.values()].slice(0, 8).map((s) => (
                            <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                                <div className="flex-1 min-w-48">
                                    <p className="font-medium">{s.companyName || s.name}</p>
                                    <p className="text-sm text-zinc-500">{s.productName}{s.status === "approved" ? " · approved" : ""}</p>
                                </div>
                                <AdminLink href={`/admin/sellers/new?from=${s.id}`}><PlusIcon className="w-4 h-4" /> Add as seller</AdminLink>
                            </li>
                        ))}
                    </ul>
                </Panel>
            )}
        </div>
    );
}
