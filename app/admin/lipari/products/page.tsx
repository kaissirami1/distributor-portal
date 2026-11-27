import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { marginPercent, money } from "@/lib/inventory";
import { LIPARI_OPEN, getLipari } from "@/lib/lipari";
import { AdminLink, EmptyState, PageHeader } from "@/components/admin/ui";
import { PlusIcon, SearchIcon } from "@/components/admin/icons";
import { LipariTabs } from "../LipariTabs";

export const metadata = { title: "Lipari products" };

type PageProps = { searchParams: Promise<{ q?: string; priced?: string }> };

const SHOW_AT_ONCE = 100;

export default async function LipariProductsPage({ searchParams }: PageProps) {
    await requireAdmin();
    const { q, priced } = await searchParams;
    const search = q?.trim() ?? "";
    const lipari = await getLipari();
    if (!lipari) return <EmptyState title="Lipari isn't set up" text="Lipari Distributions needs to be in your sellers list." />;

    const [products, open] = await Promise.all([
        prisma.inventoryItem.findMany({
            where: { sellerId: lipari.id },
            select: { id: true, name: true, sku: true, caseBarcode: true, cost: true, price: true, notes: true },
            orderBy: { name: "asc" },
        }),
        prisma.purchaseOrder.count({ where: { sellerId: lipari.id, status: { in: LIPARI_OPEN } } }),
    ]);

    // Typed or scanned an exact item number or case barcode: open that product
    const typed = search.replace(/^#/, "").replace(/\s+/g, "").toLowerCase();
    const exact = typed ? products.filter((p) => p.sku?.toLowerCase() === typed || p.caseBarcode?.toLowerCase() === typed) : [];
    if (exact.length === 1) redirect(`/admin/inventory/${exact[0].id}`);

    const matches = products
        .filter((p) => !priced || p.price > 0)
        .filter((p) => !search || `${p.name} ${p.sku ?? ""} ${p.caseBarcode ?? ""} ${p.notes ?? ""}`.toLowerCase().includes(search.toLowerCase()))
        // Products you've priced first: those are the ones you're selling
        .sort((a, b) => Number(b.price > 0) - Number(a.price > 0));
    const pricedCount = products.filter((p) => p.price > 0).length;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Lipari"
                description="Everything Lipari sells. Set Lipari's price and your price on a product, and new orders fill them in."
                actions={<AdminLink href="/admin/lipari/new" variant="primary"><PlusIcon className="w-4 h-4" /> New order</AdminLink>}
            />
            <LipariTabs active="products" counts={{ open, products: products.length }} />

            <form action="/admin/lipari/products" method="GET" className="flex flex-wrap gap-2">
                <label className="flex-1 min-w-56 flex items-center gap-2 bg-black border border-zinc-700 rounded-lg px-3 focus-within:border-zinc-500">
                    <SearchIcon className="w-4 h-4 text-zinc-500" />
                    <input name="q" defaultValue={search} placeholder="Search or scan: name, item number, barcode" aria-label="Search Lipari products" className="flex-1 bg-transparent py-2 text-sm focus:outline-none" />
                </label>
                {priced && <input type="hidden" name="priced" value="1" />}
                <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold bg-white text-black hover:bg-zinc-200">Search</button>
            </form>

            <div className="flex flex-wrap gap-2 text-sm">
                <Link href={`/admin/lipari/products${search ? `?q=${encodeURIComponent(search)}` : ""}`} className={`px-3 py-1.5 rounded-lg ${!priced ? "bg-zinc-800 text-white font-semibold" : "text-zinc-400 hover:text-white"}`}>All ({products.length.toLocaleString("en-US")})</Link>
                <Link href={`/admin/lipari/products?priced=1${search ? `&q=${encodeURIComponent(search)}` : ""}`} className={`px-3 py-1.5 rounded-lg ${priced ? "bg-zinc-800 text-white font-semibold" : "text-zinc-400 hover:text-white"}`}>With your price ({pricedCount})</Link>
            </div>

            {matches.length === 0 ? (
                <EmptyState title="No products match" text={priced ? "You haven't set your price on any products yet. Open a product and click Edit details." : undefined} />
            ) : (
                <div className="border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="hidden md:grid grid-cols-[6rem_minmax(0,1fr)_6rem_6rem_4.5rem] gap-4 px-4 py-2.5 bg-zinc-900 text-xs uppercase tracking-wide text-zinc-500">
                        <span>Item #</span><span>Product</span><span className="text-right">Lipari</span><span className="text-right">You</span><span className="text-right">Margin</span>
                    </div>
                    <ul className="divide-y divide-zinc-800">
                        {matches.slice(0, SHOW_AT_ONCE).map((p) => (
                            <li key={p.id}>
                                <Link href={`/admin/inventory/${p.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[6rem_minmax(0,1fr)_6rem_6rem_4.5rem] gap-x-4 gap-y-0.5 items-center px-4 py-3 hover:bg-zinc-900 transition">
                                    <span className="hidden md:block font-mono text-sm text-zinc-400">{p.sku ?? "—"}</span>
                                    <span className="min-w-0">
                                        <span className="block truncate">{p.name}</span>
                                        <span className="md:hidden block text-xs text-zinc-500 font-mono">#{p.sku}</span>
                                    </span>
                                    <span className="hidden md:block text-right tabular-nums text-zinc-400">{p.cost > 0 ? money(p.cost) : "—"}</span>
                                    <span className="text-right tabular-nums">{p.price > 0 ? money(p.price) : <span className="text-zinc-500">—</span>}</span>
                                    <span className={`hidden md:block text-right tabular-nums ${p.price > 0 && marginPercent(p.cost, p.price) < 0 ? "text-red-400" : "text-green-400"}`}>{p.price > 0 && p.cost > 0 ? `${marginPercent(p.cost, p.price).toFixed(0)}%` : "—"}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    {matches.length > SHOW_AT_ONCE && (
                        <p className="px-4 py-3 text-sm text-zinc-400 border-t border-zinc-800 bg-zinc-900">
                            Showing {SHOW_AT_ONCE} of {matches.length.toLocaleString("en-US")}. Search by name or item number to find the rest.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
