"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { PhotoField } from "@/components/admin/PhotoField";
import { AdminButton, AdminLink } from "@/components/admin/ui";
import { STOCK_UNITS, marginPercent, money } from "@/lib/inventory";
import { saveItem } from "./actions";

type Item = {
    id: number;
    name: string;
    sku: string | null;
    supplier: string | null;
    unit: string;
    cost: number;
    price: number;
    lowStockAt: number | null;
    location: string | null;
    notes: string | null;
    image: string | null;
};

export function ItemForm({ item }: { item?: Item }) {
    const [cost, setCost] = useState(item ? String(item.cost) : "");
    const [price, setPrice] = useState(item ? String(item.price) : "");
    const [unit, setUnit] = useState(item?.unit ?? "case");
    const [uploading, setUploading] = useState(false);

    const c = Number(cost), p = Number(price);
    const showMargin = cost !== "" && price !== "" && Number.isFinite(c) && Number.isFinite(p) && p > 0;
    const margin = marginPercent(c, p);

    const field = "admin-input mt-1.5";
    const label = "text-sm text-zinc-300";

    return (
        <form action={saveItem} className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
            {item && <input type="hidden" name="id" value={item.id} />}

            <div className="space-y-6 min-w-0">
                <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 grid sm:grid-cols-2 gap-4">
                    <label className="block sm:col-span-2">
                        <span className={label}>Name *</span>
                        <input name="name" required defaultValue={item?.name} placeholder="e.g. Za'atar Blend, 8 oz" className={field} />
                    </label>
                    <label className="block">
                        <span className={label}>SKU or barcode</span>
                        <input name="sku" defaultValue={item?.sku ?? ""} placeholder="Optional" className={field} />
                    </label>
                    <label className="block">
                        <span className={label}>Supplier</span>
                        <input name="supplier" defaultValue={item?.supplier ?? ""} placeholder="Who you buy it from" className={field} />
                    </label>
                    <label className="block">
                        <span className={label}>Unit</span>
                        <input name="unit" list="unit-options" value={unit} onChange={(e) => setUnit(e.target.value)} className={field} />
                        <datalist id="unit-options">{STOCK_UNITS.map((u) => <option key={u} value={u} />)}</datalist>
                        <span className="block text-xs text-zinc-500 mt-1">What you count stock in: case, box, unit…</span>
                    </label>
                    {!item && (
                        <label className="block">
                            <span className={label}>Quantity in stock now</span>
                            <input name="quantity" type="number" min="0" step="1" defaultValue="0" className={field} />
                        </label>
                    )}
                </section>

                {/* Price: margin updates as you type */}
                <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 grid sm:grid-cols-2 gap-4">
                    <label className="block">
                        <span className={label}>Your cost per {unit || "unit"} *</span>
                        <input name="cost" type="number" min="0" step="0.01" required value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" className={field} />
                    </label>
                    <label className="block">
                        <span className={label}>Your selling price per {unit || "unit"} *</span>
                        <input name="price" type="number" min="0" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className={field} />
                    </label>
                    <p className={`sm:col-span-2 text-sm ${showMargin ? (margin < 0 ? "text-red-400" : "text-green-400") : "text-zinc-500"}`}>
                        {showMargin
                            ? `Profit ${money(p - c)} per ${unit || "unit"} · ${margin.toFixed(1)}% margin`
                            : "Enter your cost and price to see your profit and margin."}
                    </p>
                    <p className="sm:col-span-2 text-xs text-zinc-500">
                        Need help setting the price? Use the <Link href="/admin/calculator" target="_blank" className="underline hover:text-white">Price Calculator</Link>.
                    </p>
                </section>

                <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 grid sm:grid-cols-2 gap-4">
                    <label className="block">
                        <span className={label}>Warn me when stock is at or below</span>
                        <input name="lowStockAt" type="number" min="0" step="1" defaultValue={item?.lowStockAt ?? ""} placeholder="e.g. 5" className={field} />
                    </label>
                    <label className="block">
                        <span className={label}>Where it's stored</span>
                        <input name="location" defaultValue={item?.location ?? ""} placeholder="e.g. Garage, or the warehouse name" className={field} />
                    </label>
                    <label className="block sm:col-span-2">
                        <span className={label}>Notes</span>
                        <textarea name="notes" rows={3} defaultValue={item?.notes ?? ""} placeholder="Shelf life, case size, anything to remember" className={`${field} resize-y`} />
                    </label>
                </section>

                <div className="flex flex-wrap gap-2">
                    <SaveButton disabled={uploading} isNew={!item} />
                    <AdminLink href={item ? `/admin/inventory/${item.id}` : "/admin/inventory"} variant="ghost">Cancel</AdminLink>
                </div>
            </div>

            <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <p className="text-sm text-zinc-300 mb-3">Photo</p>
                <PhotoField name="image" initial={item?.image} onUploadingChange={setUploading} />
            </section>
        </form>
    );
}

function SaveButton({ disabled, isNew }: { disabled: boolean; isNew: boolean }) {
    const { pending } = useFormStatus();
    return (
        <AdminButton type="submit" disabled={disabled || pending}>
            {pending ? "Saving…" : isNew ? "Add to inventory" : "Save changes"}
        </AdminButton>
    );
}
