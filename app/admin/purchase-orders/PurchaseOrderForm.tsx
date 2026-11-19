"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AdminButton, AdminLink } from "@/components/admin/ui";
import { money, plural } from "@/lib/inventory";
import { PAYMENT_TERMS } from "@/lib/purchaseOrders";
import { savePurchaseOrder, type LineInput } from "./actions";

export type FormItem = { id: number; name: string; sku: string | null; unit: string; cost: number; casesPerPallet: number | null; sellerId: number | null };

// What the product search box shows for an item: its name and the seller's item number
const itemLabel = (i: FormItem) => (i.sku ? `${i.name} · #${i.sku}` : i.name);
export type FormSeller = { id: number; name: string };
export type FormOrder = {
    id: number;
    sellerId: number | null;
    shipTo: string | null;
    wantedBy: string | null; // YYYY-MM-DD
    termsDays: number;
    notes: string | null;
    lines: LineInput[];
};

type Line = LineInput & { key: number; search: string };

const emptyLine = (key: number): Line => ({ key, search: "", itemId: "", qty: "", by: "case", perPallet: "", unitCost: "", newName: "", unit: "case" });

export function PurchaseOrderForm({ sellers, items, order, presetSellerId, defaultShipTo }: {
    sellers: FormSeller[];
    items: FormItem[];
    order?: FormOrder;
    presetSellerId?: number;
    defaultShipTo?: string;
}) {
    const [state, formAction, pending] = useActionState(savePurchaseOrder, {});
    const [sellerId, setSellerId] = useState(String(order?.sellerId ?? presetSellerId ?? ""));
    const [lines, setLines] = useState<Line[]>(() => (order?.lines.length
        ? order.lines.map((l, i) => {
            const item = items.find((it) => String(it.id) === l.itemId);
            return { ...emptyLine(i), ...l, key: i, search: item ? itemLabel(item) : "" };
        })
        : [emptyLine(0)]));
    const [nextKey, setNextKey] = useState(lines.length);

    // The search suggests this seller's products (or every product, if they have none yet)
    const theirs = items.filter((i) => String(i.sellerId) === sellerId);
    const choices = theirs.length ? theirs : items;

    // Typing in a product's search box: once it matches a product (by name or item number), pick it
    function search(key: number, value: string) {
        const typed = value.trim().replace(/^#/, "").toLowerCase();
        const item = choices.find((i) => itemLabel(i).toLowerCase() === value.trim().toLowerCase() || (i.sku && i.sku.toLowerCase() === typed))
            ?? items.find((i) => itemLabel(i) === value.trim());
        setLines((all) => all.map((l) => (l.key === key ? { ...l, search: item ? itemLabel(item) : value } : l)));
        update(key, { itemId: item ? String(item.id) : "" });
    }

    function update(key: number, patch: Partial<LineInput>) {
        setLines((all) => all.map((l) => {
            if (l.key !== key) return l;
            const next = { ...l, ...patch };
            // Picking a different product fills in its last price and pallet size
            if (patch.itemId && patch.itemId !== "new" && patch.itemId !== l.itemId) {
                const item = items.find((i) => String(i.id) === patch.itemId);
                if (item) {
                    if (item.cost > 0 || l.unitCost === "") next.unitCost = item.cost > 0 ? String(item.cost) : "";
                    if (item.casesPerPallet) next.perPallet = String(item.casesPerPallet);
                    next.unit = item.unit;
                }
            }
            return next;
        }));
    }

    const addLine = () => {
        setLines((all) => [...all, emptyLine(nextKey)]);
        setNextKey((k) => k + 1);
    };
    const removeLine = (key: number) => setLines((all) => (all.length > 1 ? all.filter((l) => l.key !== key) : all));

    // Cases and money for each line, and the whole order
    const figures = lines.map((l) => {
        const qty = Number(l.qty), per = Number(l.perPallet), cost = Number(l.unitCost);
        const cases = l.by === "pallet" ? (Number.isInteger(qty) && Number.isInteger(per) && qty > 0 && per > 0 ? qty * per : null) : Number.isInteger(qty) && qty > 0 ? qty : null;
        const total = cases !== null && l.unitCost !== "" && Number.isFinite(cost) ? cases * cost : null;
        return { cases, total };
    });
    const totalCases = figures.reduce((n, f) => n + (f.cases ?? 0), 0);
    const totalMoney = figures.reduce((n, f) => n + (f.total ?? 0), 0);

    const field = "admin-input mt-1.5";
    const label = "text-sm text-zinc-300";
    const box = "bg-zinc-900 border border-zinc-800 rounded-xl p-5";

    return (
        <form action={formAction} className="space-y-6">
            {order && <input type="hidden" name="id" value={order.id} />}
            <input type="hidden" name="lines" value={JSON.stringify(lines.map((l) => ({ itemId: l.itemId, newName: l.newName, unit: l.unit, qty: l.qty, by: l.by, perPallet: l.perPallet, unitCost: l.unitCost })))} />

            {state.error && <p role="alert" className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">{state.error}</p>}

            <section className={`${box} grid sm:grid-cols-2 gap-4`}>
                <h2 className="sm:col-span-2 font-semibold">The order</h2>
                <label className="block">
                    <span className={label}>Seller *</span>
                    <select name="sellerId" required value={sellerId} onChange={(e) => setSellerId(e.target.value)} className={field}>
                        <option value="" disabled>Pick a seller…</option>
                        {sellers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <span className="block text-xs text-zinc-500 mt-1">Not listed? <Link href="/admin/sellers/new" className="underline hover:text-white">Add the seller</Link> first.</span>
                </label>
                <label className="block">
                    <span className={label}>Payment terms</span>
                    <select name="termsDays" defaultValue={order?.termsDays ?? 30} className={field}>
                        {PAYMENT_TERMS.map((t) => <option key={t.days} value={t.days}>{t.label}{t.days ? `: pay ${t.days} days after it arrives` : ""}</option>)}
                    </select>
                </label>
                <label className="block">
                    <span className={label}>Ship to (your warehouse)</span>
                    <textarea name="shipTo" rows={3} defaultValue={order?.shipTo ?? defaultShipTo ?? ""} placeholder={"Warehouse name\nStreet\nCity, CA ZIP"} className={`${field} resize-y`} />
                    {defaultShipTo && !order && <span className="block text-xs text-zinc-500 mt-1">Filled in from your last order.</span>}
                </label>
                <div className="space-y-4">
                    <label className="block">
                        <span className={label}>Need it at the warehouse by</span>
                        <input type="date" name="wantedBy" defaultValue={order?.wantedBy ?? ""} className={field} />
                    </label>
                    <label className="block">
                        <span className={label}>Note to the seller</span>
                        <input name="notes" defaultValue={order?.notes ?? ""} placeholder="e.g. Please call before delivery" className={field} />
                    </label>
                </div>
            </section>

            <section className={box}>
                <div className="flex items-center justify-between gap-3 mb-4">
                    <h2 className="font-semibold">Products</h2>
                    <span className="text-xs text-zinc-500">
                        {sellerId && theirs.length > 0 ? `${theirs.length.toLocaleString("en-US")} products from this seller` : sellerId ? "No products from this seller yet: search all, or add a new one" : ""}
                    </span>
                </div>
                <datalist id="po-products">
                    {choices.map((it) => <option key={it.id} value={itemLabel(it)} />)}
                </datalist>

                <div className="space-y-4">
                    {lines.map((l, i) => {
                        const f = figures[i];
                        const units = plural(l.unit || "case");
                        return (
                            <div key={l.key} className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-start pb-4 border-b border-zinc-800 last:border-0 last:pb-0">
                                <div className="col-span-2 sm:col-span-4">
                                    <span className="flex items-center justify-between gap-2 text-xs text-zinc-500">
                                        <label htmlFor={`po-product-${l.key}`}>Product {i + 1}</label>
                                        <span className="flex gap-3">
                                            {l.itemId === "new"
                                                ? <button type="button" onClick={() => update(l.key, { itemId: "" })} className="hover:text-white">Pick from the list instead</button>
                                                : <button type="button" onClick={() => update(l.key, { itemId: "new" })} className="hover:text-white">+ New product</button>}
                                            {lines.length > 1 && (
                                                <button type="button" onClick={() => removeLine(l.key)} aria-label={`Remove product ${i + 1}`} className="hover:text-red-400">Remove</button>
                                            )}
                                        </span>
                                    </span>
                                    {l.itemId === "new" ? (
                                        <>
                                            <input id={`po-product-${l.key}`} value={l.newName} onChange={(e) => update(l.key, { newName: e.target.value })} required placeholder="New product's name" className={field} />
                                            <span className="block text-xs text-zinc-500 mt-1">It&apos;s added to Inventory. Set its selling price there.</span>
                                        </>
                                    ) : (
                                        <>
                                            <input
                                                id={`po-product-${l.key}`}
                                                list="po-products"
                                                value={l.search}
                                                onChange={(e) => search(l.key, e.target.value)}
                                                placeholder="Type a name or item number"
                                                autoComplete="off"
                                                aria-invalid={l.search !== "" && !l.itemId}
                                                className={`${field} ${l.search !== "" && !l.itemId ? "border-amber-700" : ""}`}
                                            />
                                            {l.search !== "" && !l.itemId && <span className="block text-xs text-amber-300 mt-1">Pick one of the suggestions, or add it as a new product.</span>}
                                        </>
                                    )}
                                </div>
                                <label className="block">
                                    <span className="text-xs text-zinc-500">Order by</span>
                                    <select value={l.by} onChange={(e) => update(l.key, { by: e.target.value as "case" | "pallet" })} className={field}>
                                        <option value="case">{units.charAt(0).toUpperCase() + units.slice(1)}</option>
                                        <option value="pallet">Pallets</option>
                                    </select>
                                </label>
                                <label className="block">
                                    <span className="text-xs text-zinc-500">How many</span>
                                    <input type="number" min={1} step={1} required value={l.qty} onChange={(e) => update(l.key, { qty: e.target.value })} className={field} />
                                </label>
                                {l.by === "pallet" ? (
                                    <label className="block">
                                        <span className="text-xs text-zinc-500">{units.charAt(0).toUpperCase() + units.slice(1)} / pallet</span>
                                        <input type="number" min={1} step={1} required value={l.perPallet} onChange={(e) => update(l.key, { perPallet: e.target.value })} placeholder="e.g. 60" className={field} />
                                    </label>
                                ) : <div className="hidden sm:block" />}
                                <label className="block">
                                    <span className="text-xs text-zinc-500">Price per {l.unit || "case"}</span>
                                    <input type="number" min={0} step="0.01" required value={l.unitCost} onChange={(e) => update(l.key, { unitCost: e.target.value })} placeholder="0.00" className={field} />
                                </label>
                                <p className="col-span-2 sm:col-span-4 text-sm text-zinc-400 -mt-1">
                                    {f.cases !== null ? <><span className="text-white">{f.cases} {f.cases === 1 ? l.unit || "case" : units}</span>{f.total !== null && <> · {money(f.total)}</>}</> : " "}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-zinc-800">
                    <AdminButton type="button" variant="secondary" onClick={addLine}>+ Add another product</AdminButton>
                    <p className="text-sm">
                        <span className="text-zinc-400">{totalCases} cases · </span>
                        <span className="font-semibold text-white text-base tabular-nums">{money(totalMoney)}</span>
                    </p>
                </div>
            </section>

            <div className="flex flex-wrap gap-2">
                <AdminButton type="submit" disabled={pending}>{pending ? "Saving…" : order ? "Save changes" : "Save order"}</AdminButton>
                <AdminLink href={order ? `/admin/purchase-orders/${order.id}` : "/admin/purchase-orders"} variant="ghost">Cancel</AdminLink>
            </div>
            {!order && <p className="text-xs text-zinc-500">Saving doesn&apos;t send anything. On the next page you can print it, save it as a PDF, or email it to the seller.</p>}
        </form>
    );
}
