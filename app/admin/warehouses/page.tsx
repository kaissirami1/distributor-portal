import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/inventory";
import { oneLine } from "@/lib/lipari";
import { AdminLink, EmptyState, PageHeader } from "@/components/admin/ui";
import { CheckIcon, PlusIcon } from "@/components/admin/icons";
import { warehouseLabel } from "./labels";

export const metadata = { title: "3PL Warehouses" };

type PageProps = { searchParams: Promise<{ deleted?: string }> };

export default async function WarehousesPage({ searchParams }: PageProps) {
    await requireAdmin();
    const { deleted } = await searchParams;
    const warehouses = await prisma.warehouse.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { purchaseOrders: true } } },
    });
    // Using first, then getting quotes, then the rest
    const rank = (s: string) => ({ using: 0, quoting: 1 } as Record<string, number>)[s] ?? 2;
    warehouses.sort((a, b) => rank(a.status) - rank(b.status) || a.name.localeCompare(b.name));
    const fee = (n: number | null) => (n === null ? "–" : money(n));

    return (
        <div className="space-y-6">
            <PageHeader
                title="3PL Warehouses"
                description="The companies that receive Lipari's pallets and deliver them to your stores. Add one, and pick it when you place an order."
                actions={<AdminLink href="/admin/warehouses/new" variant="primary"><PlusIcon className="w-4 h-4" /> Add 3PL</AdminLink>}
            />

            {deleted && (
                <p role="status" className="flex items-center gap-2 rounded-lg border border-green-900 bg-green-950/40 px-4 py-3 text-sm text-green-300">
                    <CheckIcon className="w-4 h-4" /> Deleted &quot;{deleted}&quot;.
                </p>
            )}

            {warehouses.length === 0 ? (
                <EmptyState
                    title="No 3PLs yet"
                    text="Add each warehouse you're getting quotes from, with their address, contact and prices, so you can compare them and pick one when you order."
                    action={<AdminLink href="/admin/warehouses/new" variant="primary"><PlusIcon className="w-4 h-4" /> Add 3PL</AdminLink>}
                />
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {warehouses.map((w) => {
                        const status = warehouseLabel(w.status);
                        return (
                            <Link key={w.id} href={`/admin/warehouses/${w.id}`} className="block bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition">
                                <div className="flex items-start justify-between gap-3">
                                    <p className="font-semibold">{w.name}</p>
                                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${status.badge}`}>{status.label}</span>
                                </div>
                                <p className="text-sm text-zinc-400 mt-1">{oneLine(w.address, w.city, w.state) || "No address yet"}</p>
                                <p className="text-sm text-zinc-500">{[w.contactName, w.phone].filter(Boolean).join(" · ") || "No contact yet"}</p>
                                <dl className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-zinc-800 text-sm">
                                    <div><dt className="text-xs text-zinc-500">Receive / pallet</dt><dd className="tabular-nums">{fee(w.receivingFee)}</dd></div>
                                    <div><dt className="text-xs text-zinc-500">Storage / month</dt><dd className="tabular-nums">{fee(w.storageFee)}</dd></div>
                                    <div><dt className="text-xs text-zinc-500">Delivery</dt><dd className="tabular-nums">{fee(w.deliveryFee)}</dd></div>
                                </dl>
                                {w._count.purchaseOrders > 0 && <p className="text-xs text-zinc-500 mt-3">{w._count.purchaseOrders} orders shipped here</p>}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
