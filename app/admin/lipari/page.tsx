import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { money } from "@/lib/inventory";
import { poNumber } from "@/lib/purchaseOrders";
import { LIPARI_OPEN, getLipari, lipariStep, orderMoney } from "@/lib/lipari";
import { AdminLink, EmptyState, PageHeader, Stat } from "@/components/admin/ui";
import { CheckIcon, PlusIcon } from "@/components/admin/icons";
import { LipariTabs } from "./LipariTabs";

export const metadata = { title: "Lipari" };

type PageProps = { searchParams: Promise<{ show?: string; deleted?: string }> };

export default async function LipariOrdersPage({ searchParams }: PageProps) {
    await requireAdmin();
    const { show = "open", deleted } = await searchParams;
    const lipari = await getLipari();
    if (!lipari) return <EmptyState title="Lipari isn't set up" text="Lipari Distributions needs to be in your sellers list." />;

    const [orders, productCount] = await Promise.all([
        prisma.purchaseOrder.findMany({
            where: { sellerId: lipari.id },
            orderBy: { createdAt: "desc" },
            include: {
                lines: { include: { item: { select: { sku: true } } } },
                sales: { select: { revenue: true, paidAt: true } },
                bill: { select: { amount: true, paidAt: true } },
            },
        }),
        prisma.inventoryItem.count({ where: { sellerId: lipari.id } }),
    ]);

    const open = orders.filter((o) => LIPARI_OPEN.includes(o.status));
    const shown = show === "all" ? orders : show === "delivered" ? orders.filter((o) => o.status === "delivered") : open;
    const storesOwe = orders.flatMap((o) => o.sales).filter((s) => !s.paidAt).reduce((n, s) => n + s.revenue, 0);
    const youOwe = orders.map((o) => o.bill).filter((b) => b && !b.paidAt).reduce((n, b) => n + b!.amount, 0);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const profitThisMonth = orders.filter((o) => o.status === "delivered" && o.deliveredAt && o.deliveredAt >= monthStart).reduce((n, o) => n + orderMoney(o.lines[0]).profit, 0);

    // Orders emailed to Lipari together stay together
    const groups: { batch: string | null; orders: typeof shown }[] = [];
    for (const o of shown) {
        const g = o.batchCode ? groups.find((x) => x.batch === o.batchCode) : undefined;
        if (g) g.orders.push(o);
        else groups.push({ batch: o.batchCode, orders: [o] });
    }

    const filters = [
        { key: "open", label: "Open", count: open.length },
        { key: "delivered", label: "Delivered", count: orders.filter((o) => o.status === "delivered").length },
        { key: "all", label: "All", count: orders.length },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Lipari"
                description="Sell Lipari's products to your stores: order from Lipari, they ship to your 3PL, the 3PL delivers, the store pays you, you pay Lipari."
                actions={
                    <>
                        <AdminLink href={`/admin/sellers/${lipari.id}?edit=1`}>Lipari&apos;s contact details</AdminLink>
                        <AdminLink href="/admin/lipari/new" variant="primary"><PlusIcon className="w-4 h-4" /> New order</AdminLink>
                    </>
                }
            />
            <LipariTabs active="orders" counts={{ open: open.length, products: productCount }} />

            {deleted && (
                <p role="status" className="flex items-center gap-2 rounded-lg border border-green-900 bg-green-950/40 px-4 py-3 text-sm text-green-300">
                    <CheckIcon className="w-4 h-4" /> Deleted {deleted}.
                </p>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Stat label="Open orders" value={open.length} />
                <Stat label="Stores owe you" value={money(storesOwe)} tone={storesOwe ? "text-green-400" : "text-white"} href="/admin/payments" />
                <Stat label="You owe Lipari" value={money(youOwe)} tone={youOwe ? "text-amber-300" : "text-white"} href="/admin/payments" />
                <Stat label="Profit this month" value={money(profitThisMonth)} tone="text-green-400" />
            </div>

            {orders.length > 0 && (
                <div className="flex gap-2 text-sm">
                    {filters.map((f) => (
                        <Link key={f.key} href={f.key === "open" ? "/admin/lipari" : `/admin/lipari?show=${f.key}`} className={`px-3 py-1.5 rounded-lg ${show === f.key ? "bg-zinc-800 text-white font-semibold" : "text-zinc-400 hover:text-white"}`}>
                            {f.label} ({f.count})
                        </Link>
                    ))}
                </div>
            )}

            {shown.length === 0 ? (
                <EmptyState
                    title={orders.length === 0 ? "No Lipari orders yet" : "Nothing here"}
                    text={orders.length === 0 ? "When a store says yes, make an order: pick the products and the store, and you'll get the email for Lipari and the pallet labels." : undefined}
                    action={<AdminLink href="/admin/lipari/new" variant="primary"><PlusIcon className="w-4 h-4" /> New order</AdminLink>}
                />
            ) : (
                <div className="space-y-4">
                    {groups.map((g, gi) => {
                        const first = g.orders[0];
                        return (
                            <section key={g.batch ?? `single-${gi}`} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                                <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-zinc-800 text-sm">
                                    <span className="text-zinc-400">
                                        {first.sentAt ? `Sent to Lipari ${formatDate(first.sentAt)}` : `Made ${formatDate(first.createdAt)}, not sent yet`}
                                        {" · "}{g.orders.length} {g.orders.length === 1 ? "order" : "orders"}
                                    </span>
                                    {g.batch && <Link href={`/admin/lipari/batch/${g.batch}`} className="text-zinc-300 underline hover:text-white">Email, labels and 3PL message →</Link>}
                                </div>
                                <ul className="divide-y divide-zinc-800">
                                    {g.orders.map((o) => {
                                        const line = o.lines[0];
                                        const step = lipariStep(o.status);
                                        const m = orderMoney(line);
                                        return (
                                            <li key={o.id}>
                                                <Link href={`/admin/lipari/${o.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[6rem_minmax(0,1fr)_9rem_6rem] gap-x-4 gap-y-1 items-center px-5 py-3 hover:bg-zinc-800/50 transition">
                                                    <span className="font-mono text-sm text-zinc-400">{poNumber(o.id)}</span>
                                                    <span className="min-w-0 col-span-2 sm:col-span-1 order-3 sm:order-none">
                                                        <span className="block truncate">{line?.itemName ?? "—"}</span>
                                                        <span className="block text-xs text-zinc-500 truncate">
                                                            {[line?.item?.sku && `#${line.item.sku}`, line && `${line.cases} cases`, o.storeName && `→ ${o.storeName}`].filter(Boolean).join(" · ")}
                                                        </span>
                                                    </span>
                                                    <span className="justify-self-end sm:justify-self-start"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${step.badge}`}>{step.label}</span></span>
                                                    <span className={`hidden sm:block text-right text-sm tabular-nums ${m.profit < 0 ? "text-red-400" : "text-green-400"}`} title="Your profit">{line?.salePrice !== null && line?.salePrice !== undefined ? money(m.profit) : "—"}</span>
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </section>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
