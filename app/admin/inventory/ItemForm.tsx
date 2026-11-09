"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { PhotoField } from "@/components/admin/PhotoField";
import { AdminButton, AdminLink } from "@/components/admin/ui";
import { STOCK_UNITS, marginPercent, money, plural } from "@/lib/inventory";
import { CountByToggle, countSummary, type CountBy } from "./CountBy";
import { saveItem } from "./actions";

type Item = {
    id: number;
    name: string;
    sku: string | null;
    caseBarcode: string | null;
    supplier: string | null;
    sellerId: number | null;
    unit: string;
    casesPerPallet: number | null;
    cost: number;
    price: number;
    lowStockAt: number | null;
    location: string | null;
    notes: string | null;
    image: string | null;
};

type Seller = { id: number; name: string };

export function ItemForm({ item, sellers, presetSellerId }: { item?: Item; sellers: Seller[]; presetSellerId?: number }) {
    // Items saved before the Sellers list have the supplier typed in: match it, or offer to add it as a seller
    const oldSupplier = item && !item.sellerId && item.supplier ? item.supplier : "";
    const oldMatch = sellers.find((s) => s.name.toLowerCase() === oldSupplier.toLowerCase());
    const startSeller = item?.sellerId ?? oldMatch?.id ?? (oldSupplier ? "new" : presetSellerId ?? "");

    const [seller, setSeller] = useState(String(startSeller));
    const [cost, setCost] = useState(item ? String(item.cost) : "");
    const [price, setPrice] = useState(item ? String(item.price) : "");
    const [unit, setUnit] = useState(item?.unit ?? "case");
    const [perPallet, setPerPallet] = useState(item?.casesPerPallet ? String(item.casesPerPallet) : "");
    const [startBy, setStartBy] = useState<CountBy>("case");
    const [startQty, setStartQty] = useState("");
    const [uploading, setUploading] = useState(false);

    const c = Number(cost), p = Number(price);
    const showMargin = cost !== "" && price !== "" && Number.isFinite(c) && Number.isFinite(p) && p > 0;
    const margin = marginPercent(c, p);
    const units = plural(unit || "case");
    const start = countSummary(startBy, startQty, perPallet, unit || "case");

    const field = "admin-input mt-1.5";
    const label = "text-sm text-zinc-300";
    const hint = "block text-xs text-zinc-500 mt-1";
    const box = "bg-zinc-900 border border-zinc-800 rounded-xl p-5 grid sm:grid-cols-2 gap-4";

    return (
        <form action={saveItem} className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
            {item && <input type="hidden" name="id" value={item.id} />}

            <div className="space-y-6 min-w-0">
                <section className={box}>
                    <h2 className="sm:col-span-2 font-semibold">The product</h2>
                    <label className="block sm:col-span-2">
                        <span className={label}>Name *</span>
                        <input name="name" required defaultValue={item?.name} placeholder="e.g. Za'atar Blend, 8 oz" className={field} />
                    </label>
                    <label className="block sm:col-span-2">
                        <span className={label}>Seller</span>
                        <select name="sellerId" value={seller} onChange={(e) => setSeller(e.target.value)} className={field}>
                            <option value="">No seller</option>
                            {sellers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            <option value="new">+ Add a new seller…</option>
                        </select>
                        <span className={hint}>Who you buy it from. <Link href="/admin/sellers" target="_blank" className="underline hover:text-white">See all sellers</Link></span>
                    </label>
                    {seller === "new" && (
                        <label className="block sm:col-span-2">
                            <span className={label}>New seller&apos;s business name *</span>
                            <input name="newSellerName" required defaultValue={oldSupplier} placeholder="e.g. Gloria's Kitchen" className={field} />
                            <span className={hint}>They&apos;ll be added to your Sellers list. You can fill in their phone and address there later.</span>
                        </label>
                    )}
                    <label className="block">
                        <span className={label}>SKU or item code</span>
                        <input name="sku" defaultValue={item?.sku ?? ""} placeholder="Optional" className={field} />
                    </label>
                    <label className="block">
                        <span className={label}>Case barcode</span>
                        <input name="caseBarcode" defaultValue={item?.caseBarcode ?? ""} placeholder="Numbers under the barcode" autoComplete="off" className={`${field} font-mono`} />
                        <span className={hint}>The barcode on the outside of the case. A barcode scanner can type it in for you.</span>
                    </label>
                </section>

                <section className={box}>
                    <h2 className="sm:col-span-2 font-semibold">Stock</h2>
                    <label className="block">
                        <span className={label}>Unit</span>
                        <input name="unit" list="unit-options" value={unit} onChange={(e) => setUnit(e.target.value)} className={field} />
                        <datalist id="unit-options">{STOCK_UNITS.map((u) => <option key={u} value={u} />)}</datalist>
                        <span className={hint}>What you count stock in: case, box, unit…</span>
                    </label>
                    <label className="block">
                        <span className={label}>{units.charAt(0).toUpperCase() + units.slice(1)} in one pallet{!item && startBy === "pallet" ? " *" : ""}</span>
                        <input name="casesPerPallet" type="number" min="1" step="1" required={!item && startBy === "pallet"} value={perPallet} onChange={(e) => setPerPallet(e.target.value)} placeholder="e.g. 60" className={field} />
                        <span className={hint}>Fill this in to see and receive stock in pallets.</span>
                    </label>

                    {!item && (
                        <div className="sm:col-span-2 grid sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
                            <div className="sm:col-span-2">
                                <p className={label}>Stock you have now</p>
                                <div className="mt-1.5 max-w-xs"><CountByToggle name="startBy" value={startBy} onChange={setStartBy} unit={unit} /></div>
                            </div>
                            <label className="block">
                                <span className={label}>How many {startBy === "pallet" ? "pallets" : units}</span>
                                <input name="quantity" type="number" min="0" step="1" value={startQty} onChange={(e) => setStartQty(e.target.value)} placeholder="0" className={field} />
                            </label>
                            <label className="block">
                                <span className={label}>Batch / lot number</span>
                                <input name="batch" placeholder="From the seller" className={`${field} font-mono`} />
                            </label>
                            <p className="sm:col-span-2 text-sm text-zinc-400">
                                {start
                                    ? <>Starts with <span className="text-white font-medium">{start.text}</span>{cost !== "" && c > 0 ? <> · {money(start.cases * c)} at cost</> : null}</>
                                    : startBy === "pallet" && !perPallet
                                        ? <span className="text-amber-300">Fill in how many {units} are in one pallet.</span>
                                        : "Leave at 0 if you'll receive it later."}
                            </p>
                        </div>
                    )}

                    <label className="block pt-4 border-t border-zinc-800">
                        <span className={label}>Warn me when stock is at or below</span>
                        <input name="lowStockAt" type="number" min="0" step="1" defaultValue={item?.lowStockAt ?? ""} placeholder="e.g. 5" className={field} />
                        <span className={hint}>In {units}.</span>
                    </label>
                    <label className="block sm:pt-4 sm:border-t border-zinc-800">
                        <span className={label}>Where it&apos;s stored</span>
                        <input name="location" defaultValue={item?.location ?? ""} placeholder="e.g. Garage, or the warehouse name" className={field} />
                    </label>
                </section>

                {/* Price: margin updates as you type */}
                <section className={box}>
                    <h2 className="sm:col-span-2 font-semibold">Price</h2>
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

                <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <label className="block">
                        <span className={label}>Notes</span>
                        <textarea name="notes" rows={3} defaultValue={item?.notes ?? ""} placeholder="Shelf life, storage temperature, anything to remember" className={`${field} resize-y`} />
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
