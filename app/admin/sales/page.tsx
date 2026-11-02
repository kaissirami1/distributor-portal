import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logSale, deleteSale } from "@/lib/salesActions";
import { formatDate } from "@/lib/dates";
import { ConfirmButton } from "@/components/ConfirmButton";
import { AdminButton, EmptyState, PageHeader, Panel, Stat } from "@/components/admin/ui";
import { CheckIcon } from "@/components/admin/icons";
import { SaleBillingFields } from "@/components/admin/SaleBillingFields";
import { PaymentBadge } from "@/components/admin/PaymentBadge";

export const metadata = { title: "Sales" };

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const monthLabel = (key: string) => new Date(`${key}-15T12:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });

type PageProps = { searchParams: Promise<{ logged?: string; error?: string }> };

export default async function SalesPage({ searchParams }: PageProps) {
    await requireAdmin();
    const { logged, error } = await searchParams;

    const [sales, submissions, inventory, stores] = await Promise.all([
        prisma.sale.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                submission: { select: { id: true, productName: true, companyName: true, name: true } },
                inventoryItem: { select: { id: true, name: true, supplier: true } },
                store: { select: { id: true, name: true } },
            },
        }),
        prisma.submission.findMany({
            select: { id: true, productName: true, companyName: true, name: true, status: true },
            orderBy: { productName: "asc" },
        }),
        prisma.inventoryItem.findMany({ select: { id: true, name: true, quantity: true, unit: true, price: true }, orderBy: { name: "asc" } }),
        prisma.store.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    ]);
    submissions.sort((a, b) => Number(b.status === "approved") - Number(a.status === "approved"));

    // Where a sale came from: a vendor's product or one of our inventory items
    const source = (s: (typeof sales)[number]) =>
        s.inventoryItem
            ? { key: `inv-${s.inventoryItem.id}`, name: s.inventoryItem.name, from: s.inventoryItem.supplier ? `Inventory · ${s.inventoryItem.supplier}` : "Inventory", href: `/admin/inventory/${s.inventoryItem.id}` }
            : s.submission
                ? { key: `sub-${s.submission.id}`, name: s.submission.productName, from: s.submission.companyName || s.submission.name, href: `/admin/submissions/${s.submission.id}` }
                : { key: `sale-${s.id}`, name: "Deleted product", from: "", href: "" };

    // ── Totals ──────────────────────────────────────────────────────────────
    const thisMonth = monthKey(new Date());
    const sum = (list: typeof sales) => ({
        units: list.reduce((n, s) => n + s.quantity, 0),
        revenue: list.reduce((n, s) => n + s.revenue, 0),
    });
    const allTime = sum(sales);
    const month = sum(sales.filter((s) => monthKey(s.createdAt) === thisMonth));

    // ── By product ──────────────────────────────────────────────────────────
    const byProduct = new Map<string, { name: string; from: string; href: string; units: number; revenue: number; last: Date }>();
    for (const s of sales) {
        const src = source(s);
        const row = byProduct.get(src.key) ?? { ...src, units: 0, revenue: 0, last: s.createdAt };
        row.units += s.quantity;
        row.revenue += s.revenue;
        if (s.createdAt > row.last) row.last = s.createdAt;
        byProduct.set(src.key, row);
    }
    const productRows = [...byProduct.entries()].sort((a, b) => b[1].revenue - a[1].revenue);

    // ── By month ────────────────────────────────────────────────────────────
    const byMonth = new Map<string, { units: number; revenue: number }>();
    for (const s of sales) {
        const key = monthKey(s.createdAt);
        const row = byMonth.get(key) ?? { units: 0, revenue: 0 };
        row.units += s.quantity;
        row.revenue += s.revenue;
        byMonth.set(key, row);
    }
    const monthRows = [...byMonth.entries()].sort((a, b) => b[0].localeCompare(a[0]));

    const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD for the date box
    const canLog = submissions.length > 0 || inventory.length > 0;

    return (
        <div className="space-y-8">
            <PageHeader
                title="Sales"
                description="Every sale you've logged: your own inventory and vendors' products. Selling an inventory item here also takes it out of stock."
            />

            {logged && (
                <p role="status" className="flex items-center gap-2 rounded-lg border border-green-900 bg-green-950/40 px-4 py-3 text-sm text-green-300">
                    <CheckIcon className="w-4 h-4" /> Sale logged.
                </p>
            )}
            {error && (
                <p role="alert" className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                    {error === "stock"
                        ? "You don't have that many in stock. Check the item's quantity in Inventory."
                        : "Please pick a product and enter the units (whole number) and revenue."}
                </p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Revenue this month" value={money(month.revenue)} tone="text-green-400" />
                <Stat label="Units this month" value={month.units.toLocaleString("en-US")} />
                <Stat label="Revenue, all time" value={money(allTime.revenue)} tone="text-green-400" />
                <Stat label="Units, all time" value={allTime.units.toLocaleString("en-US")} />
            </div>

            {/* ── Log a sale ── */}
            <Panel title="Log a sale">
                {!canLog ? (
                    <p className="text-sm text-zinc-500">Add an inventory item or get a product submission first, then log its sales here.</p>
                ) : (
                    <form action={logSale} className="grid sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-3 items-end">
                        <label className="text-xs text-zinc-500 sm:col-span-2 lg:col-span-1">Product *
                            <select name="product" required defaultValue="" className="admin-input mt-1">
                                <option value="" disabled>Choose a product</option>
                                {inventory.length > 0 && (
                                    <optgroup label="Your inventory">
                                        {inventory.map((i) => (
                                            <option key={`inv-${i.id}`} value={`inv-${i.id}`} disabled={i.quantity === 0}>
                                                {i.name} — {i.quantity} {i.unit}{i.quantity === 1 ? "" : "s"} in stock
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                                {submissions.length > 0 && (
                                    <optgroup label="Vendors' products">
                                        {submissions.map((p) => (
                                            <option key={`sub-${p.id}`} value={`sub-${p.id}`}>
                                                {p.productName} — {p.companyName || p.name}{p.status === "approved" ? "" : ` (${p.status})`}
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                            </select>
                        </label>
                        <label className="text-xs text-zinc-500">Units *
                            <input name="quantity" type="number" min="1" step="1" required placeholder="24" className="admin-input mt-1" />
                        </label>
                        <label className="text-xs text-zinc-500">Revenue ($) *
                            <input name="revenue" type="number" min="0" step="0.01" required placeholder="120.00" className="admin-input mt-1" />
                        </label>
                        <label className="text-xs text-zinc-500">Date
                            <input name="date" type="date" defaultValue={today} className="admin-input mt-1" />
                        </label>
                        <SaleBillingFields stores={stores} />
                        <label className="text-xs text-zinc-500 sm:col-span-2 lg:col-span-3">Note
                            <input name="note" placeholder="Optional" className="admin-input mt-1" />
                        </label>
                        <AdminButton type="submit">Log sale</AdminButton>
                    </form>
                )}
            </Panel>

            {sales.length === 0 ? (
                <EmptyState title="No sales yet" text="Logged sales will add up here by product and by month." />
            ) : (
                <>
                    <div className="grid lg:grid-cols-2 gap-6">
                        <Panel title="By product">
                            <table className="w-full text-sm">
                                <thead className="text-xs uppercase tracking-wide text-zinc-500 text-left">
                                    <tr><th className="pb-2 font-normal">Product</th><th className="pb-2 font-normal text-right">Units</th><th className="pb-2 font-normal text-right">Revenue</th></tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {productRows.map(([key, r]) => (
                                        <tr key={key}>
                                            <td className="py-2.5 pr-3">
                                                {r.href ? <Link href={r.href} className="font-medium hover:underline">{r.name}</Link> : <span className="font-medium">{r.name}</span>}
                                                <p className="text-xs text-zinc-500">{r.from}{r.from ? " · " : ""}last sale {formatDate(r.last)}</p>
                                            </td>
                                            <td className="py-2.5 text-right tabular-nums">{r.units.toLocaleString("en-US")}</td>
                                            <td className="py-2.5 text-right tabular-nums text-green-400">{money(r.revenue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Panel>

                        <Panel title="By month">
                            <table className="w-full text-sm">
                                <thead className="text-xs uppercase tracking-wide text-zinc-500 text-left">
                                    <tr><th className="pb-2 font-normal">Month</th><th className="pb-2 font-normal text-right">Units</th><th className="pb-2 font-normal text-right">Revenue</th></tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {monthRows.map(([key, r]) => (
                                        <tr key={key}>
                                            <td className="py-2.5">{monthLabel(key)}</td>
                                            <td className="py-2.5 text-right tabular-nums">{r.units.toLocaleString("en-US")}</td>
                                            <td className="py-2.5 text-right tabular-nums text-green-400">{money(r.revenue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Panel>
                    </div>

                    <Panel title={`All sales (${sales.length})`}>
                        <ul className="divide-y divide-zinc-800 -my-2">
                            {sales.map((s) => {
                                const src = source(s);
                                return (
                                    <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                                        <span className="text-sm text-zinc-500 w-28">{formatDate(s.createdAt)}</span>
                                        <div className="flex-1 min-w-40">
                                            {src.href ? <Link href={src.href} className="font-medium hover:underline">{src.name}</Link> : <span className="font-medium">{src.name}</span>}
                                            <p className="text-xs text-zinc-500">
                                                {s.store && <><Link href={`/admin/stores/${s.store.id}`} className="text-zinc-300 hover:underline">{s.store.name}</Link>{" · "}</>}
                                                {[src.from, s.invoiceNumber && `Invoice ${s.invoiceNumber}`, s.note].filter(Boolean).join(" · ")}
                                            </p>
                                        </div>
                                        <span className="text-sm tabular-nums w-20 text-right">{s.quantity} units</span>
                                        <span className="text-sm tabular-nums w-24 text-right text-green-400">{money(s.revenue)}</span>
                                        <Link href="/admin/payments" title="See Payments"><PaymentBadge item={s} /></Link>
                                        <form action={deleteSale}>
                                            <input type="hidden" name="saleId" value={s.id} />
                                            <ConfirmButton
                                                message={s.inventoryItemId ? "Delete this sale? The units go back into stock." : "Delete this sale?"}
                                                type="submit"
                                                className="text-xs text-zinc-500 hover:text-red-400 px-2 py-1"
                                            >
                                                Delete
                                            </ConfirmButton>
                                        </form>
                                    </li>
                                );
                            })}
                        </ul>
                    </Panel>
                </>
            )}
        </div>
    );
}
