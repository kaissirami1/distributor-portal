"use client";

import { useState } from "react";
import { AdminButton } from "@/components/admin/ui";
import { money, plural } from "@/lib/inventory";
import { CountByToggle, countSummary, type CountBy } from "./CountBy";
import { changeStock } from "./actions";

// "Receive stock" on an item's page: count it in cases or pallets, with the seller's batch number
export function ReceiveStockForm({ itemId, unit, casesPerPallet, cost }: { itemId: number; unit: string; casesPerPallet: number | null; cost: number }) {
    const [by, setBy] = useState<CountBy>(casesPerPallet ? "pallet" : "case");
    const [qty, setQty] = useState("");
    const [perPallet, setPerPallet] = useState(casesPerPallet ? String(casesPerPallet) : "");
    const [unitCost, setUnitCost] = useState("");

    const units = plural(unit);
    const adds = countSummary(by, qty, perPallet, unit);
    const each = unitCost === "" ? cost : Number(unitCost);
    const input = "admin-input mt-1";
    const label = "block text-xs text-zinc-500";

    return (
        <form action={changeStock} className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 items-start">
            <input type="hidden" name="itemId" value={itemId} />
            <input type="hidden" name="kind" value="received" />

            <div className="sm:col-span-2 xl:col-span-4 max-w-xs">
                <CountByToggle name="receiveBy" value={by} onChange={setBy} unit={unit} />
            </div>

            <label className={label}>How many {by === "pallet" ? "pallets" : units} *
                <input name="quantity" type="number" min="1" step="1" required value={qty} onChange={(e) => setQty(e.target.value)} className={input} />
            </label>
            {by === "pallet" && (
                <label className={label}>{units.charAt(0).toUpperCase() + units.slice(1)} in one pallet *
                    <input name="casesPerPallet" type="number" min="1" step="1" required value={perPallet} onChange={(e) => setPerPallet(e.target.value)} placeholder="e.g. 60" className={input} />
                </label>
            )}
            <label className={label}>Cost per {unit}{by === "pallet" ? " *" : ""}
                <input
                    name="unitCost"
                    type="number"
                    min="0"
                    step="0.01"
                    required={by === "pallet"}
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    placeholder={by === "pallet" ? "0.00" : `Same as before (${money(cost)})`}
                    className={input}
                />
            </label>
            <label className={label}>Batch / lot number
                <input name="batch" placeholder="From the seller" className={`${input} font-mono`} />
            </label>
            <label className={`${label} sm:col-span-2 ${by === "pallet" ? "xl:col-span-4" : "xl:col-span-1"}`}>Note
                <input name="note" placeholder="e.g. Delivery from seller" className={input} />
            </label>

            <div className="sm:col-span-2 xl:col-span-4 flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
                <AdminButton type="submit">+ Add to stock</AdminButton>
                <p className="text-sm text-zinc-400">
                    {adds
                        ? <>Adds <span className="text-white font-medium">{adds.text}</span>{Number.isFinite(each) ? <> · {money(adds.cases * each)} total cost</> : null}</>
                        : by === "pallet" && !perPallet ? `Enter how many ${units} are in one pallet.` : null}
                </p>
            </div>
        </form>
    );
}
