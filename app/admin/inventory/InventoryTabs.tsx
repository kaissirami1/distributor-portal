import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { OPEN_STATUSES } from "@/lib/purchaseOrders";

// "Items | Sellers | Purchase orders" tabs at the top of those three pages
export async function InventoryTabs({ active, counts }: { active: "items" | "sellers" | "orders"; counts: { items: number; sellers: number } }) {
    const openOrders = await prisma.purchaseOrder.count({ where: { status: { in: OPEN_STATUSES } } });
    const tabs = [
        { key: "items", label: "Items", href: "/admin/inventory", count: counts.items },
        { key: "sellers", label: "Sellers", href: "/admin/sellers", count: counts.sellers },
        { key: "orders", label: "Purchase orders", href: "/admin/purchase-orders", count: openOrders, countLabel: "open" },
    ];
    return (
        <nav aria-label="Inventory sections" className="flex gap-1 border-b border-zinc-800 -mt-4">
            {tabs.map((t) => (
                <Link
                    key={t.key}
                    href={t.href}
                    aria-current={active === t.key ? "page" : undefined}
                    className={`px-3 sm:px-4 py-2.5 -mb-px border-b-2 text-sm whitespace-nowrap transition ${active === t.key ? "border-white text-white font-semibold" : "border-transparent text-zinc-400 hover:text-white"}`}
                >
                    {t.label} <span className="text-zinc-500" title={t.countLabel ? `${t.count} ${t.countLabel}` : undefined}>{t.count}</span>
                </Link>
            ))}
        </nav>
    );
}
