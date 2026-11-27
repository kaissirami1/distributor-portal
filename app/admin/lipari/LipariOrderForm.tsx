"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AdminButton, AdminLink } from "@/components/admin/ui";
import { money, plural } from "@/lib/inventory";
import { PAYMENT_TERMS } from "@/lib/purchaseOrders";
import { saveLipariOrders, type OrderRow } from "./actions";

export type FormProduct = { id: number; name: string; sku: string | null; unit: string; cost: number; price: number; casesPerPallet: number | null };
export type FormStore = { id: number; name: string; city: string | null };
export type FormWarehouse = { id: number; name: string; status: string };
export type FormOrder = { id: number; warehouseId: number | null; termsDays: number; wantedBy: string; notes: string; row: OrderRow };

// What the product search box shows: the name and Lipari's item number
const productLabel = (p: FormProduct) => (p.sku ? `${p.name} · #${p.sku}` : p.name);

type Row = OrderRow & { key: number; search: string };
const emptyRow = (key: number): Row => ({ key, search: "", itemId: "", storeId: "", by: "case", qty: "", perPallet: "", unitCost: "", salePrice: "", storeTerms: "30" });

export function LipariOrderForm({ products, stores, warehouses, defaultWarehouseId, order }: {
    products: FormProduct[];
    stores: FormStore[];
    warehouses: FormWarehouse[];
    defaultWarehouseId?: number;
    order?: FormOrder;
}) {
    const [state, formAction, pending] = useActionState(saveLipariOrders, {});
    const [rows, setRows] = useState<Row[]>(() => {
        if (!order) return [emptyRow(0)];
        const p = products.find((x) => String(x.id) === order.row.itemId);
        return [{ ...emptyRow(0), ...order.row, search: p ? productLabel(p) : "" }];
    });
    const [nextKey, setNextKey] = useState(1);

    const set = (key: number, patch: Partial<Row>) => setRows((all) => all.map((r) => (r.key === key ? { ...r, ...patch } : r)));

    // Typing in the product box: once it matches a product (by name or item number), pick it and fill in its last prices
    function search(key: number, value: string) {
        const typed = value.trim().replace(/^#/, "").toLowerCase();
        const p = products.find((x) => productLabel(x).toLowerCase() === value.trim().toLowerCase() || (x.sku && x.sku.toLowerCase() === typed));
        const row = rows.find((r) => r.key === key);
        if (p && row && String(p.id) !== row.itemId) {
            set(key, {
                search: productLabel(p),
                itemId: String(p.id),
                unitCost: p.cost > 0 ? String(p.cost) : row.unitCost,
                salePrice: p.price > 0 ? String(p.price) : row.salePrice,
                perPallet: p.casesPerPallet ? String(p.casesPerPallet) : row.perPallet,
            });
        } else {
            set(key, { search: value, itemId: p ? String(p.id) : "" });
        }
    }

    const addRow = () => {
        // A new row starts with the same store as the last one, since orders often go to one store
        setRows((all) => [...all, { ...emptyRow(nextKey), storeId: all[all.length - 1]?.storeId ?? "", storeTerms: all[all.length - 1]?.storeTerms ?? "30" }]);
        setNextKey((k) => k + 1);
    };
    const removeRow = (key: number) => setRows((all) => (all.length > 1 ? all.filter((r) => r.key !== key) : all));

    const figures = rows.map((r) => {
        const qty = Number(r.qty), per = Number(r.perPallet);
        const cases = r.by === "pallet" ? (Number.isInteger(qty) && Number.isInteger(per) && qty > 0 && per > 0 ? qty * per : null) : Number.isInteger(qty) && qty > 0 ? qty : null;
        const cost = r.unitCost === "" ? null : Number(r.unitCost), sale = r.salePrice === "" ? null : Number(r.salePrice);
        return {
            cases,
            lipari: cases !== null && cost !== null && Number.isFinite(cost) ? cases * cost : null,
            store: cases !== null && sale !== null && Number.isFinite(sale) ? cases * sale : null,
        };
    });
    const sum = (k: "cases" | "lipari" | "store") => figures.reduce((n, f) => n + (f[k] ?? 0), 0);
    const profit = sum("store") - sum("lipari");

    const field = "admin-input mt-1.5";
    const small = "text-xs text-zinc-500";
    const box = "bg-zinc-900 border border-zinc-800 rounded-xl p-5";

    return (
        <form action={formAction} className="space-y-6">
            {order && <input type="hidden" name="id" value={order.id} />}
            <input type="hidden" name="rows" value={JSON.stringify(rows.map((r) => ({ itemId: r.itemId, storeId: r.storeId, by: r.by, qty: r.qty, perPallet: r.perPallet, unitCost: r.unitCost, salePrice: r.salePrice, storeTerms: r.storeTerms })))} />
            <datalist id="lipari-products">
                {products.map((p) => <option key={p.id} value={productLabel(p)} />)}
            </datalist>

            {state.error && <p role="alert" className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">{state.error}</p>}

            <section className={`${box} grid sm:grid-cols-2 gap-4`}>
                <h2 className="sm:col-span-2 font-semibold">Shipping and payment</h2>
                <label className="block">
                    <span className="text-sm text-zinc-300">Lipari ships to (3PL) *</span>
                    <select name="warehouseId" required defaultValue={order?.warehouseId ?? defaultWarehouseId ?? ""} className={field}>
                        <option value="" disabled>Pick a 3PL…</option>
                        {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}{w.status === "quoting" ? " (getting quotes)" : w.status === "not_using" ? " (not using)" : ""}</option>)}
                    </select>
                    <span className={`block mt-1 ${small}`}>{warehouses.length === 0 ? "No 3PLs yet: " : "Not listed? "}<Link href="/admin/warehouses/new" className="underline hover:text-white">Add a 3PL</Link></span>
                </label>
                <label className="block">
                    <span className="text-sm text-zinc-300">You pay Lipari</span>
                    <select name="termsDays" defaultValue={order?.termsDays ?? 30} className={field}>
                        {PAYMENT_TERMS.map((t) => <option key={t.days} value={t.days}>{t.label}{t.days ? `: ${t.days} days after it reaches the 3PL` : ""}</option>)}
                    </select>
                </label>
                <label className="block">
                    <span className="text-sm text-zinc-300">Need it at the 3PL by</span>
                    <input type="date" name="wantedBy" defaultValue={order?.wantedBy ?? ""} className={field} />
                </label>
                <label className="block">
                    <span className="text-sm text-zinc-300">Note to Lipari</span>
                    <input name="notes" defaultValue={order?.notes ?? ""} placeholder="Optional" className={field} />
                </label>
            </section>

            <section className={box}>
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                    <h2 className="font-semibold">{order ? "The order" : "What you're ordering"}</h2>
                    {!order && <span className={small}>Each product becomes its own purchase order, with its own delivery barcode.</span>}
                </div>

                <div className="space-y-5">
                    {rows.map((r, i) => {
                        const f = figures[i];
                        const units = plural("case");
                        return (
                            <div key={r.key} className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-start pb-5 border-b border-zinc-800 last:border-0 last:pb-0">
                                <div className="col-span-2 sm:col-span-4 flex items-center justify-between gap-2">
                                    <span className="text-sm font-semibold">{order ? "Product" : `Purchase order ${i + 1}`}</span>
                                    {rows.length > 1 && <button type="button" onClick={() => removeRow(r.key)} className="text-xs text-zinc-500 hover:text-red-400">Remove</button>}
                                </div>
                                <label className="col-span-2 sm:col-span-3 block">
                                    <span className={small}>Lipari product</span>
                                    <input
                                        list="lipari-products"
                                        value={r.search}
                                        onChange={(e) => search(r.key, e.target.value)}
                                        placeholder="Type a name or item number"
                                        autoComplete="off"
                                        aria-invalid={r.search !== "" && !r.itemId}
                                        className={`${field} ${r.search !== "" && !r.itemId ? "border-amber-700" : ""}`}
                                    />
                                    {r.search !== "" && !r.itemId && <span className="block text-xs text-amber-300 mt-1">Pick one of the suggestions.</span>}
                                </label>
                                <label className="col-span-2 sm:col-span-1 block">
                                    <span className={small}>For store</span>
                                    <select value={r.storeId} onChange={(e) => set(r.key, { storeId: e.target.value })} required className={field}>
                                        <option value="" disabled>Pick a store…</option>
                                        {stores.map((s) => <option key={s.id} value={s.id}>{s.name}{s.city && !s.name.toLowerCase().includes(s.city.toLowerCase()) ? `, ${s.city}` : ""}</option>)}
                                    </select>
                                </label>
                                <label className="block">
                                    <span className={small}>Order by</span>
                                    <select value={r.by} onChange={(e) => set(r.key, { by: e.target.value as "case" | "pallet" })} className={field}>
                                        <option value="case">Cases</option>
                                        <option value="pallet">Pallets</option>
                                    </select>
                                </label>
                                <label className="block">
                                    <span className={small}>How many {r.by === "pallet" ? "pallets" : units}</span>
                                    <input type="number" min={1} step={1} required value={r.qty} onChange={(e) => set(r.key, { qty: e.target.value })} className={field} />
                                </label>
                                {r.by === "pallet" ? (
                                    <label className="block">
                                        <span className={small}>Cases in one pallet</span>
                                        <input type="number" min={1} step={1} required value={r.perPallet} onChange={(e) => set(r.key, { perPallet: e.target.value })} placeholder="e.g. 60" className={field} />
                                    </label>
                                ) : <div className="hidden sm:block" />}
                                <label className="block">
                                    <span className={small}>Store pays you</span>
                                    <select value={r.storeTerms} onChange={(e) => set(r.key, { storeTerms: e.target.value })} className={field}>
                                        {PAYMENT_TERMS.map((t) => <option key={t.days} value={t.days}>{t.days ? `Net ${t.days}` : "On delivery"}</option>)}
                                    </select>
                                </label>
                                <label className="block">
                                    <span className={small}>Lipari&apos;s price / case</span>
                                    <input type="number" min={0} step="0.01" required value={r.unitCost} onChange={(e) => set(r.key, { unitCost: e.target.value })} placeholder="0.00" className={field} />
                                </label>
                                <label className="block">
                                    <span className={small}>Your price / case</span>
                                    <input type="number" min={0} step="0.01" required value={r.salePrice} onChange={(e) => set(r.key, { salePrice: e.target.value })} placeholder="0.00" className={field} />
                                </label>
                                <p className="col-span-2 text-sm text-zinc-400 sm:self-end sm:pb-2">
                                    {f.cases !== null ? (
                                        <>
                                            <span className="text-white">{f.cases} cases</span>
                                            {f.lipari !== null && f.store !== null && (
                                                <> · you pay {money(f.lipari)} · store pays {money(f.store)} · <span className={f.store - f.lipari < 0 ? "text-red-400" : "text-green-400"}>profit {money(f.store - f.lipari)}</span></>
                                            )}
                                        </>
                                    ) : " "}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {!order && (
                    <div className="mt-5 pt-4 border-t border-zinc-800">
                        <AdminButton type="button" variant="secondary" onClick={addRow}>+ Add another product</AdminButton>
                    </div>
                )}
            </section>

            <section className={`${box} grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm`}>
                <div><p className="text-zinc-500">Purchase orders</p><p className="text-lg font-semibold">{rows.length}</p></div>
                <div><p className="text-zinc-500">You pay Lipari</p><p className="text-lg font-semibold tabular-nums">{money(sum("lipari"))}</p></div>
                <div><p className="text-zinc-500">Stores pay you</p><p className="text-lg font-semibold tabular-nums">{money(sum("store"))}</p></div>
                <div><p className="text-zinc-500">Your profit</p><p className={`text-lg font-semibold tabular-nums ${profit < 0 ? "text-red-400" : "text-green-400"}`}>{money(profit)}</p></div>
            </section>

            <div className="flex flex-wrap items-center gap-3">
                <AdminButton type="submit" disabled={pending}>
                    {pending ? "Saving…" : order ? "Save changes" : rows.length === 1 ? "Create purchase order" : `Create ${rows.length} purchase orders`}
                </AdminButton>
                <AdminLink href={order ? `/admin/lipari/${order.id}` : "/admin/lipari"} variant="ghost">Cancel</AdminLink>
                {!order && <span className="text-xs text-zinc-500">Nothing is sent yet. Next you&apos;ll get the email for Lipari, the pallet labels, and the message for the 3PL.</span>}
            </div>
        </form>
    );
}
