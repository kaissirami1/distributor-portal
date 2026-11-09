// ─────────────────────────────────────────────────────────────────────────────
// Settings for Admin → Inventory (products we buy and hold ourselves).
// ─────────────────────────────────────────────────────────────────────────────

// What one "unit" of stock can be. Shown as suggestions in the item form.
// (Pallets aren't a unit: set "cases per pallet" on an item to count and receive it in pallets.)
export const STOCK_UNITS = ["case", "box", "unit", "bag", "jar", "bottle"];

// Why stock went down when it wasn't a sale
export const REMOVE_REASONS = [
    { key: "damaged", label: "Damaged or expired" },
    { key: "sample", label: "Given as samples" },
    { key: "adjustment", label: "Count correction" },
];

// How each kind of stock change is described in an item's history
export const MOVEMENT_LABELS: Record<string, string> = {
    received: "Received",
    sold: "Sold",
    damaged: "Damaged or expired",
    sample: "Samples",
    adjustment: "Count correction",
    "sale-deleted": "Sale deleted, stock returned",
    start: "Starting stock",
};

export const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

// e.g. "case" → "cases", "box" → "boxes"
export function plural(unit: string) {
    if (/s$/.test(unit)) return unit;
    return unit.endsWith("x") ? `${unit}es` : `${unit}s`;
}

// e.g. 1 → "1 case", 3 → "3 cases"
export function unitCount(n: number, unit: string) {
    return `${n} ${Math.abs(n) === 1 ? unit : plural(unit)}`;
}

// Stock in pallets, e.g. 130 cases at 60 per pallet → "2 pallets + 10 cases"
export function palletCount(quantity: number, unit: string, casesPerPallet: number | null) {
    if (!casesPerPallet || casesPerPallet <= 0) return null;
    const full = Math.floor(quantity / casesPerPallet);
    const extra = quantity % casesPerPallet;
    if (full === 0) return extra === 0 ? "0 pallets" : `less than 1 pallet`;
    return `${unitCount(full, "pallet")}${extra ? ` + ${unitCount(extra, unit)}` : ""}`;
}

// Our margin: the share of the selling price we keep
export function marginPercent(cost: number, price: number) {
    return price > 0 ? ((price - cost) / price) * 100 : 0;
}
