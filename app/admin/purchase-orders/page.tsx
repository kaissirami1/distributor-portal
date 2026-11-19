import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { money } from "@/lib/inventory";
import { OPEN_STATUSES, casesText, orderTotal, poNumber, poStatus, receivedTotal } from "@/lib/purchaseOrders";
import { AdminLink, EmptyState, PageHeader, Stat } from "@/components/admin/ui";
import { CheckIcon, PlusIcon } from "@/components/admin/icons";
import { InventoryTabs } from "../inventory/InventoryTabs";
import { PoStatusBadge } from "./PoStatusBadge";

export const metadata = { title: "Purchase orders" };

type PageProps = { searchParams: Promise<{ show?: string; deleted?: string }> };

export default async function PurchaseOrdersPage({ searchParams }: PageProps) {
    await requireAdmin();
    const { show, deleted } = await searchParams;
    const showAll = show === "all";

    const [orders, itemCount, sellerCount] = await Promise.all([
        prisma.purchaseOrder.findMany({
            include: { lines: { select: { cases: true, unitCost: true, receivedCases: true } } },
            orderBy: { createdAt: "desc" },
        }),
        prisma.inventoryItem.count(),
        prisma.seller.count(),
    ]);

    const open = orders.filter((o) => OPEN_STATUSES.includes(o.status as (typeof OPEN_STATUSES)[number]));
    const shown = showAll ? orders : open;
    const onTheWay = open.filter((o) => o.status === "shipped");
    const openValue = open.reduce((n, o) => n + orderTotal(o.lines), 0);

    // The date that matters most for where the order is now
    const when = (o: (typeof orders)[number]) => {
        if (o.status === "received" && o.receivedAt) return `Arrived ${formatDate(o.receivedAt)}`;
        if (o.status === "shipped") return o.expectedAt ? `Arriving ${formatDate(o.expectedAt)}` : `Shipped ${formatDate(o.shippedAt ?? o.updatedAt)}`;
        if (o.wantedBy && o.status !== "cancelled") return `Wanted by ${formatDate(o.wantedBy)}`;
        return `Made ${formatDate(o.createdAt)}`;
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Inventory"
                description="Orders you place with sellers. When one arrives at the warehouse, its stock is added and the bill goes to Payments."
                actions={<AdminLink href="/admin/purchase-orders/new" variant="primary"><PlusIcon className="w-4 h-4" /> New purchase order</AdminLink>}
            />
            <InventoryTabs active="orders" counts={{ items: itemCount, sellers: sellerCount }} />

            {deleted && (
                <p role="status" className="flex items-center gap-2 rounded-lg border border-green-900 bg-green-950/40 px-4 py-3 text-sm text-green-300">
                    <CheckIcon className="w-4 h-4" /> Deleted {deleted}.
                </p>
            )}

            {orders.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <Stat label="Open orders" value={open.length} />
                    <Stat label="On the way" value={onTheWay.length} tone={onTheWay.length ? "text-amber-300" : "text-white"} />
                    <div className="col-span-2 sm:col-span-1"><Stat label="Open orders' value" value={money(openValue)} /></div>
                </div>
            )}

            {orders.length > 0 && (
                <div className="flex gap-2 text-sm">
                    <Link href="/admin/purchase-orders" className={`px-3 py-1.5 rounded-lg ${!showAll ? "bg-zinc-800 text-white font-semibold" : "text-zinc-400 hover:text-white"}`}>Open ({open.length})</Link>
                    <Link href="/admin/purchase-orders?show=all" className={`px-3 py-1.5 rounded-lg ${showAll ? "bg-zinc-800 text-white font-semibold" : "text-zinc-400 hover:text-white"}`}>All ({orders.length})</Link>
                </div>
            )}

            {shown.length === 0 ? (
                <EmptyState
                    title={orders.length === 0 ? "No purchase orders yet" : "No open orders"}
                    text={orders.length === 0 ? "Make one when you order from a seller: list the products, send it, and track it until it arrives." : "Everything you ordered has arrived."}
                    action={<AdminLink href="/admin/purchase-orders/new" variant="primary"><PlusIcon className="w-4 h-4" /> New purchase order</AdminLink>}
                />
            ) : (
                <ul className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800">
                    {shown.map((o) => {
                        const total = o.status === "received" ? receivedTotal(o.lines) : orderTotal(o.lines);
                        return (
                            <li key={o.id}>
                                <Link href={`/admin/purchase-orders/${o.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[6.5rem_minmax(0,1fr)_7rem_8rem] gap-x-4 gap-y-1 items-center px-5 py-4 hover:bg-zinc-800/50 transition">
                                    <span className="font-mono text-sm text-zinc-400 order-1 sm:order-none">{poNumber(o.id)}</span>
                                    <span className="min-w-0 col-span-2 sm:col-span-1 order-3 sm:order-none">
                                        <span className="block font-medium truncate">{o.sellerName}</span>
                                        <span className="block text-xs text-zinc-500 truncate">{casesText(o.status, o.lines)}<span className="sm:hidden"> · {money(total)}</span> · {when(o)}</span>
                                    </span>
                                    <span className="order-2 sm:order-none justify-self-end sm:justify-self-start" title={poStatus(o.status).hint}><PoStatusBadge status={o.status} /></span>
                                    <span className="hidden sm:block text-right tabular-nums">{money(total)}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
