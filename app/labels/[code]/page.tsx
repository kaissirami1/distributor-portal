import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";
import { poNumber } from "@/lib/purchaseOrders";
import { Barcode } from "@/components/Barcode";
import { PrintLabelsButton } from "./PrintLabelsButton";

// ─────────────────────────────────────────────────────────────────────────────
// Pallet labels for a group of purchase orders, opened by Lipari from our email.
// No login: the long random link is the key. Each label has the order's delivery
// barcode, the PO number and Lipari's product, so Lipari puts it on the right
// pallet. It never shows the store or any prices.
// ─────────────────────────────────────────────────────────────────────────────

export const metadata = { title: "Pallet labels", robots: { index: false, follow: false } };

type PageProps = { params: Promise<{ code: string }> };

export default async function PalletLabelsPage({ params }: PageProps) {
    const { code } = await params;
    if (!/^[A-Za-z0-9_-]{20,}$/.test(code)) notFound();

    const orders = await prisma.purchaseOrder.findMany({
        where: { batchCode: code, status: { not: "cancelled" }, doCode: { not: null } },
        orderBy: { id: "asc" },
        select: {
            id: true,
            doCode: true,
            sellerName: true,
            warehouse: { select: { name: true } },
            lines: { select: { itemName: true, cases: true, pallets: true, item: { select: { sku: true } } } },
        },
    });
    if (orders.length === 0) notFound();

    // One label per pallet (an order by the case gets one label)
    const labels = orders.flatMap((o) => {
        const l = o.lines[0];
        const count = Math.max(1, l?.pallets ?? 1);
        return Array.from({ length: count }, (_, i) => ({ key: `${o.id}-${i}`, o, l, n: i + 1, count }));
    });

    const ink = { color: "#111" } as const;

    return (
        <main className="min-h-screen" style={{ background: "#f4f4f5", ...ink }}>
            {/* Printing: one 4 × 6 in label per page, nothing else */}
            <style>{`
                @page { size: 4in 6in; margin: 0.2in; }
                @media print {
                    .no-print { display: none !important; }
                    main { background: #fff !important; }
                    .label { box-shadow: none !important; border: none !important; margin: 0 !important; width: auto !important; break-after: page; page-break-after: always; }
                    .labels { display: block !important; padding: 0 !important; }
                }
            `}</style>

            <div className="no-print max-w-3xl mx-auto px-4 pt-8 pb-4">
                <h1 className="text-2xl font-bold">Pallet labels from {site.name}</h1>
                <p className="mt-2" style={{ color: "#444" }}>
                    {labels.length} label{labels.length === 1 ? "" : "s"} for {orders.map((o) => poNumber(o.id)).join(", ")}. Please print them and put each one on its pallet.
                    Every purchase order has its own barcode, so please keep each order on its own pallet(s). They print at shipping-label size (4 × 6 in), one per page; regular paper works too.
                </p>
                <div className="mt-4"><PrintLabelsButton /></div>
            </div>

            <div className="labels grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto px-4 pb-10">
                {labels.map(({ key, o, l, n, count }) => (
                    <section key={key} className="label bg-white rounded-lg shadow-sm border" style={{ borderColor: "#ddd", padding: "0.25in" }}>
                        <Barcode value={o.doCode!} height={110} className="w-full h-auto" />
                        <div style={{ marginTop: 12, borderTop: "1px solid #ddd", paddingTop: 10 }}>
                            <p style={{ fontSize: 26, fontWeight: 800, letterSpacing: 0.5 }}>{poNumber(o.id)}</p>
                            <p style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{l?.item?.sku ? `#${l.item.sku} · ` : ""}{l?.itemName}</p>
                            <p style={{ fontSize: 15, marginTop: 8 }}>Pallet <strong>{n}</strong> of {count}{l && !l.pallets ? ` · ${l.cases} cases` : ""}</p>
                            {o.warehouse && <p style={{ fontSize: 13, marginTop: 8, color: "#444" }}>Ship to: {o.warehouse.name}</p>}
                        </div>
                    </section>
                ))}
            </div>
        </main>
    );
}
