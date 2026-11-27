import Link from "next/link";

// "Orders | Products" tabs at the top of the Lipari pages
export function LipariTabs({ active, counts }: { active: "orders" | "products"; counts?: { open?: number; products?: number } }) {
    const tabs = [
        { key: "orders", label: "Orders", href: "/admin/lipari", count: counts?.open, title: "open orders" },
        { key: "products", label: "Products", href: "/admin/lipari/products", count: counts?.products, title: "Lipari products" },
    ];
    return (
        <nav aria-label="Lipari sections" className="flex gap-1 border-b border-zinc-800 -mt-4">
            {tabs.map((t) => (
                <Link
                    key={t.key}
                    href={t.href}
                    aria-current={active === t.key ? "page" : undefined}
                    className={`px-3 sm:px-4 py-2.5 -mb-px border-b-2 text-sm whitespace-nowrap transition ${active === t.key ? "border-white text-white font-semibold" : "border-transparent text-zinc-400 hover:text-white"}`}
                >
                    {t.label}{t.count !== undefined && <span className="text-zinc-500" title={`${t.count} ${t.title}`}> {t.count.toLocaleString("en-US")}</span>}
                </Link>
            ))}
        </nav>
    );
}
