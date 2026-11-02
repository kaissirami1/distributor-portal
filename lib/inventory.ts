// ─────────────────────────────────────────────────────────────────────────────
// Settings for Admin → Inventory (products we buy and hold ourselves).
// ─────────────────────────────────────────────────────────────────────────────

// What one "unit" of stock can be. Shown as suggestions in the item form.
export const STOCK_UNITS = ["case", "box", "unit", "pallet", "bag", "jar", "bottle"];

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

// e.g. 1 → "1 case", 3 → "3 cases"
export function unitCount(n: number, unit: string) {
    if (Math.abs(n) === 1 || /s$/.test(unit)) return `${n} ${unit}`;
    return `${n} ${unit.endsWith("x") ? `${unit}es` : `${unit}s`}`;
}

// Our margin: the share of the selling price we keep
export function marginPercent(cost: number, price: number) {
    return price > 0 ? ((price - cost) / price) * 100 : 0;
}
