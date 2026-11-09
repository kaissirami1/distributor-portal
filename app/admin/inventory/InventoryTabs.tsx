import Link from "next/link";

// "Items | Sellers" tabs at the top of the Inventory and Sellers pages
export function InventoryTabs({ active, counts }: { active: "items" | "sellers"; counts: { items: number; sellers: number } }) {
    const tabs = [
        { key: "items", label: "Items", href: "/admin/inventory", count: counts.items },
        { key: "sellers", label: "Sellers", href: "/admin/sellers", count: counts.sellers },
    ];
    return (
        <nav aria-label="Inventory sections" className="flex gap-1 border-b border-zinc-800 -mt-4">
            {tabs.map((t) => (
                <Link
                    key={t.key}
                    href={t.href}
                    aria-current={active === t.key ? "page" : undefined}
                    className={`px-4 py-2.5 -mb-px border-b-2 text-sm transition ${active === t.key ? "border-white text-white font-semibold" : "border-transparent text-zinc-400 hover:text-white"}`}
                >
                    {t.label} <span className="text-zinc-500">{t.count}</span>
                </Link>
            ))}
        </nav>
    );
}
