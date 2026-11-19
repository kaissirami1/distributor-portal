import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { marginPercent, money, palletCount, unitCount } from "@/lib/inventory";
import { SafeImage } from "@/components/admin/SafeImage";
import { AdminLink, EmptyState, PageHeader, Stat } from "@/components/admin/ui";
import { CheckIcon, DownloadIcon, PlusIcon, SearchIcon } from "@/components/admin/icons";
import { InventoryTabs } from "./InventoryTabs";

export const metadata = { title: "Inventory" };

type PageProps = { searchParams: Promise<{ q?: string; low?: string; deleted?: string }> };

// A big catalog (e.g. a seller's 1,600 products) would make the page slow: show this many, search for the rest
const SHOW_AT_ONCE = 200;

export default async function InventoryPage({ searchParams }: PageProps) {
    await requireAdmin();
    const { q, low, deleted } = await searchParams;
    const searchQuery = q?.trim() || "";

    const [all, sellerCount] = await Promise.all([
        prisma.inventoryItem.findMany({
            orderBy: { name: "asc" },
            include: {
                seller: { select: { name: true } },
                movements: { where: { batch: { not: null } }, select: { batch: true } },
            },
        }),
        prisma.seller.count(),
    ]);
    const isLow = (i: (typeof all)[number]) => i.lowStockAt !== null && i.quantity <= i.lowStockAt;

    // Scanned or typed an exact case barcode or SKU: go straight to that item
    const exact = searchQuery && all.filter((i) => [i.caseBarcode, i.sku].some((code) => code && code.toLowerCase() === searchQuery.toLowerCase().replace(/\s+/g, "")));
    if (exact && exact.length === 1) redirect(`/admin/inventory/${exact[0].id}`);

    const items = all.filter((i) => {
        if (low && !isLow(i)) return false;
        if (!searchQuery) return true;
        const batches = i.movements.map((m) => m.batch).join(" ");
        const hay = `${i.name} ${i.sku ?? ""} ${i.caseBarcode ?? ""} ${i.seller?.name ?? i.supplier ?? ""} ${i.location ?? ""} ${batches}`.toLowerCase();
        return hay.includes(searchQuery.toLowerCase());
    // What you have in stock first, then the rest of the catalog (each A to Z)
    }).sort((a, b) => Number(b.quantity > 0) - Number(a.quantity > 0));

    const lowCount = all.filter(isLow).length;
    const valueAtCost = all.reduce((sum, i) => sum + i.quantity * i.cost, 0);
    const valueAtPrice = all.reduce((sum, i) => sum + i.quantity * i.price, 0);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Inventory"
                description="Products you buy and hold yourself. Click an item to receive stock, record a sale, or edit it."
                actions={
                    <>
                        {all.length > 0 && <AdminLink href="/admin/inventory/export" download><DownloadIcon className="w-4 h-4" /> Download CSV</AdminLink>}
                        <AdminLink href="/admin/inventory/new" variant="primary"><PlusIcon className="w-4 h-4" /> Add item</AdminLink>
                    </>
                }
            />
            <InventoryTabs active="items" counts={{ items: all.length, sellers: sellerCount }} />

            {deleted && (
                <p role="status" className="flex items-center gap-2 rounded-lg border border-green-900 bg-green-950/40 px-4 py-3 text-sm text-green-300">
                    <CheckIcon className="w-4 h-4" /> Deleted &quot;{deleted}&quot;.
                </p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Items" value={all.length} />
                <Stat label="Low stock" value={lowCount} tone={lowCount ? "text-amber-300" : "text-white"} href={lowCount ? "/admin/inventory?low=1" : undefined} />
                <Stat label="Stock value at cost" value={money(valueAtCost)} />
                <Stat label="Stock value at your prices" value={money(valueAtPrice)} tone="text-green-400" />
            </div>

            <form action="/admin/inventory" method="GET" className="flex flex-wrap gap-2">
                <label className="flex-1 min-w-56 flex items-center gap-2 bg-black border border-zinc-700 rounded-lg px-3 focus-within:border-zinc-500">
                    <SearchIcon className="w-4 h-4 text-zinc-500" />
                    <input name="q" defaultValue={searchQuery} placeholder="Search or scan: name, barcode, SKU, seller, batch #" aria-label="Search inventory" className="flex-1 bg-transparent py-2 text-sm focus:outline-none" />
                </label>
                {low && <input type="hidden" name="low" value="1" />}
                <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold bg-white text-black hover:bg-zinc-200">Search</button>
                {(searchQuery || low) && (
                    <Link href="/admin/inventory" className="px-4 py-2 rounded-lg text-sm border border-zinc-700 text-zinc-300 hover:border-zinc-500">
                        Show all
                    </Link>
                )}
            </form>

            {items.length === 0 ? (
                <EmptyState
                    title={all.length === 0 ? "Nothing in inventory yet" : "No items match"}
                    text={all.length === 0 ? "Add the products you buy yourself, with what you paid and what you sell them for." : undefined}
                    action={all.length === 0 && <AdminLink href="/admin/inventory/new" variant="primary"><PlusIcon className="w-4 h-4" /> Add item</AdminLink>}
                />
            ) : (
                <div className="border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="hidden md:grid grid-cols-[3.5rem_minmax(0,2fr)_9rem_5.5rem_5.5rem_4.5rem] gap-4 items-center px-4 py-2.5 bg-zinc-900 text-xs uppercase tracking-wide text-zinc-500">
                        <span />
                        <span>Item</span>
                        <span className="text-right">In stock</span>
                        <span className="text-right">Cost</span>
                        <span className="text-right">Price</span>
                        <span className="text-right">Margin</span>
                    </div>
                    <ul className="divide-y divide-zinc-800">
                        {items.slice(0, SHOW_AT_ONCE).map((i) => (
                            <li key={i.id}>
                                <Link
                                    href={`/admin/inventory/${i.id}`}
                                    className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] md:grid-cols-[3.5rem_minmax(0,2fr)_9rem_5.5rem_5.5rem_4.5rem] gap-x-4 gap-y-1 items-center px-4 py-3 hover:bg-zinc-900 transition"
                                >
                                    <SafeImage src={i.image} alt="" compact className="w-14 h-14 rounded-lg" />
                                    <div className="min-w-0">
                                        <p className="font-medium truncate">{i.name}</p>
                                        <p className="text-xs text-zinc-500 truncate">
                                            {[i.seller?.name ?? i.supplier, i.sku && `Item #${i.sku}`, i.caseBarcode && `Case ${i.caseBarcode}`, i.location].filter(Boolean).join(" · ") || "Click to add details"}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`tabular-nums font-medium ${isLow(i) ? "text-amber-300" : ""}`}>{unitCount(i.quantity, i.unit)}</p>
                                        {palletCount(i.quantity, i.unit, i.casesPerPallet) && <p className="text-xs text-zinc-500">{palletCount(i.quantity, i.unit, i.casesPerPallet)}</p>}
                                        {isLow(i) && <p className="text-xs text-amber-300">Low stock</p>}
                                    </div>
                                    <p className="hidden md:block text-right tabular-nums text-zinc-400">{money(i.cost)}</p>
                                    <p className="hidden md:block text-right tabular-nums">{money(i.price)}</p>
                                    <p className={`hidden md:block text-right tabular-nums ${marginPercent(i.cost, i.price) < 0 ? "text-red-400" : "text-green-400"}`}>
                                        {i.price > 0 ? `${marginPercent(i.cost, i.price).toFixed(0)}%` : "—"}
                                    </p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    {items.length > SHOW_AT_ONCE && (
                        <p className="px-4 py-3 text-sm text-zinc-400 border-t border-zinc-800 bg-zinc-900">
                            Showing {SHOW_AT_ONCE} of {items.length.toLocaleString("en-US")} items. Search by name, item number or seller to find the rest.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
