import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { MOVEMENT_LABELS, REMOVE_REASONS, marginPercent, money, unitCount } from "@/lib/inventory";
import { formatDate, formatDateTime } from "@/lib/dates";
import { ConfirmButton } from "@/components/ConfirmButton";
import { SafeImage } from "@/components/admin/SafeImage";
import { AdminButton, AdminLink, PageHeader, Panel, Stat } from "@/components/admin/ui";
import { CheckIcon } from "@/components/admin/icons";
import { ItemForm } from "../ItemForm";
import { changeStock, deleteItem } from "../actions";

export const metadata = { title: "Inventory item" };

type PageProps = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ saved?: string; updated?: string; error?: string; edit?: string }>;
};

const UPDATED: Record<string, string> = {
    received: "Stock received.",
    sold: "Sale recorded. It's also on your Sales page.",
    remove: "Stock removed.",
};
const ERRORS: Record<string, string> = {
    qty: "Please enter a whole number of 1 or more.",
    "too-many": "You can't take out more than you have in stock.",
    "1": "Please enter a name, and a cost and price of 0 or more.",
};

export default async function InventoryItemPage({ params, searchParams }: PageProps) {
    await requireAdmin();
    const { id } = await params;
    const { saved, updated, error, edit } = await searchParams;
    const itemId = Number(id);
    if (!Number.isInteger(itemId)) notFound();

    const item = await prisma.inventoryItem.findUnique({
        where: { id: itemId },
        include: {
            movements: { orderBy: { createdAt: "desc" } },
            sales: { orderBy: { createdAt: "desc" } },
        },
    });
    if (!item) notFound();

    const low = item.lowStockAt !== null && item.quantity <= item.lowStockAt;
    const soldUnits = item.sales.reduce((n, s) => n + s.quantity, 0);
    const soldRevenue = item.sales.reduce((n, s) => n + s.revenue, 0);
    const unit = item.unit;
    const input = "admin-input mt-1";

    if (edit) {
        return (
            <div>
                <PageHeader back={{ href: `/admin/inventory/${item.id}`, label: item.name }} title={`Edit ${item.name}`} />
                {error && <p role="alert" className="mb-4 text-sm text-red-400">{ERRORS[error] ?? ERRORS["1"]}</p>}
                <ItemForm item={item} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                back={{ href: "/admin/inventory", label: "Inventory" }}
                title={item.name}
                description={[item.sku, item.supplier && `from ${item.supplier}`, item.location && `stored at ${item.location}`].filter(Boolean).join(" · ") || undefined}
                actions={<AdminLink href={`/admin/inventory/${item.id}?edit=1`}>Edit details</AdminLink>}
            />

            {(saved || updated) && (
                <p role="status" className="flex items-center gap-2 rounded-lg border border-green-900 bg-green-950/40 px-4 py-3 text-sm text-green-300">
                    <CheckIcon className="w-4 h-4" /> {updated ? UPDATED[updated] ?? "Updated." : "Saved."}
                </p>
            )}
            {error && <p role="alert" className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">{ERRORS[error] ?? "Something went wrong."}</p>}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="In stock" value={unitCount(item.quantity, unit)} tone={low ? "text-amber-300" : "text-white"} />
                <Stat label={`Cost / price per ${unit}`} value={<span className="text-2xl">{money(item.cost)} / {money(item.price)}</span>} />
                <Stat label="Margin" value={item.price > 0 ? `${marginPercent(item.cost, item.price).toFixed(1)}%` : "—"} tone={marginPercent(item.cost, item.price) < 0 ? "text-red-400" : "text-green-400"} />
                <Stat label="Sold so far" value={<span className="text-2xl">{unitCount(soldUnits, unit)} · {money(soldRevenue)}</span>} />
            </div>
            {low && <p className="text-sm text-amber-300">⚠️ Low stock: you have {unitCount(item.quantity, unit)} left (alert set at {item.lowStockAt}).</p>}

            <div className="grid lg:grid-cols-3 gap-6 items-start">
                {/* ── Stock actions ── */}
                <div className="lg:col-span-2 space-y-6 min-w-0">
                    <div className="grid md:grid-cols-3 gap-4">
                        <Panel title="Receive stock">
                            <form action={changeStock} className="space-y-3">
                                <input type="hidden" name="itemId" value={item.id} />
                                <input type="hidden" name="kind" value="received" />
                                <label className="block text-xs text-zinc-500">How many {unit}s
                                    <input name="quantity" type="number" min="1" step="1" required className={input} />
                                </label>
                                <label className="block text-xs text-zinc-500">Note
                                    <input name="note" placeholder="e.g. Delivery from supplier" className={input} />
                                </label>
                                <AdminButton type="submit" className="w-full">+ Add to stock</AdminButton>
                            </form>
                        </Panel>

                        <Panel title="Record a sale">
                            <form action={changeStock} className="space-y-3">
                                <input type="hidden" name="itemId" value={item.id} />
                                <input type="hidden" name="kind" value="sold" />
                                <label className="block text-xs text-zinc-500">How many {unit}s
                                    <input name="quantity" type="number" min="1" max={item.quantity} step="1" required className={input} />
                                </label>
                                <label className="block text-xs text-zinc-500">Price per {unit} ($)
                                    <input name="unitPrice" type="number" min="0" step="0.01" defaultValue={item.price} className={input} />
                                </label>
                                <label className="block text-xs text-zinc-500">Sold to / note
                                    <input name="note" placeholder="e.g. Store name" className={input} />
                                </label>
                                <AdminButton type="submit" className="w-full" disabled={item.quantity === 0}>− Record sale</AdminButton>
                            </form>
                        </Panel>

                        <Panel title="Remove stock">
                            <form action={changeStock} className="space-y-3">
                                <input type="hidden" name="itemId" value={item.id} />
                                <input type="hidden" name="kind" value="remove" />
                                <label className="block text-xs text-zinc-500">How many {unit}s
                                    <input name="quantity" type="number" min="1" max={item.quantity} step="1" required className={input} />
                                </label>
                                <label className="block text-xs text-zinc-500">Reason
                                    <select name="reason" className={input}>
                                        {REMOVE_REASONS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                                    </select>
                                </label>
                                <label className="block text-xs text-zinc-500">Note
                                    <input name="note" placeholder="Optional" className={input} />
                                </label>
                                <AdminButton type="submit" variant="secondary" className="w-full" disabled={item.quantity === 0}>− Remove</AdminButton>
                            </form>
                        </Panel>
                    </div>

                    {/* ── History ── */}
                    <Panel title="Stock history">
                        {item.movements.length === 0 ? (
                            <p className="text-sm text-zinc-500">No stock changes yet.</p>
                        ) : (
                            <ul className="divide-y divide-zinc-800 -my-2">
                                {item.movements.map((m) => (
                                    <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 text-sm">
                                        <span className={`w-20 tabular-nums font-semibold ${m.change > 0 ? "text-green-400" : "text-red-400"}`}>
                                            {m.change > 0 ? `+${m.change}` : m.change}
                                        </span>
                                        <span className="flex-1 min-w-40">
                                            {MOVEMENT_LABELS[m.reason] ?? m.reason}
                                            {m.note && <span className="text-zinc-500"> · {m.note}</span>}
                                        </span>
                                        <span className="text-xs text-zinc-500">{m.author ? `${m.author} · ` : ""}{formatDateTime(m.createdAt)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>
                </div>

                {/* ── Photo, notes, delete ── */}
                <div className="space-y-6 min-w-0">
                    <SafeImage src={item.image} alt={item.name} className="w-full aspect-[4/3] rounded-xl border border-zinc-800" emptyClassName="w-full h-32 rounded-xl border border-zinc-800" />
                    {item.notes && (
                        <Panel title="Notes"><p className="text-sm whitespace-pre-wrap text-zinc-300">{item.notes}</p></Panel>
                    )}
                    <p className="text-xs text-zinc-500">Added {formatDate(item.createdAt)}{item.lowStockAt !== null ? ` · low-stock alert at ${item.lowStockAt}` : ""}</p>
                    <form action={deleteItem} className="border-t border-zinc-800 pt-4">
                        <input type="hidden" name="itemId" value={item.id} />
                        <ConfirmButton
                            type="submit"
                            message={`Delete "${item.name}"? Its stock history${item.sales.length ? ` and ${item.sales.length} sale(s)` : ""} will be deleted too. This can't be undone.`}
                            className="px-4 py-2 rounded-lg text-sm font-semibold border border-red-900 text-red-400 hover:bg-red-950"
                        >
                            Delete item
                        </ConfirmButton>
                    </form>
                </div>
            </div>
        </div>
    );
}
