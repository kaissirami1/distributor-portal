// ─────────────────────────────────────────────────────────────────────────────
// Settings for Admin → Inventory → Purchase orders (orders we place with sellers).
// An order goes: Draft → Sent → Confirmed → Shipped → Arrived (or Cancelled).
// ─────────────────────────────────────────────────────────────────────────────

export const PO_STATUSES = [
    { key: "draft", label: "Draft", badge: "bg-zinc-800 text-zinc-300", hint: "Not sent to the seller yet" },
    { key: "sent", label: "Sent", badge: "bg-blue-900/50 text-blue-300", hint: "Waiting for the seller to confirm" },
    { key: "confirmed", label: "Confirmed", badge: "bg-purple-900/50 text-purple-300", hint: "The seller is getting it ready" },
    { key: "shipped", label: "Shipped", badge: "bg-amber-900/50 text-amber-300", hint: "On its way to the warehouse" },
    { key: "received", label: "Arrived", badge: "bg-green-900/50 text-green-400", hint: "In stock, bill added to Payments" },
    { key: "cancelled", label: "Cancelled", badge: "bg-zinc-800 text-zinc-500", hint: "" },
] as const;

export type PoStatus = (typeof PO_STATUSES)[number]["key"];

export const poStatus = (key: string) => PO_STATUSES.find((s) => s.key === key) ?? PO_STATUSES[0];

// Orders that are still on their way to us
export const OPEN_STATUSES: PoStatus[] = ["draft", "sent", "confirmed", "shipped"];

// When we pay: days after the order arrives
export const PAYMENT_TERMS = [
    { days: 0, label: "Due when it arrives" },
    { days: 15, label: "Net 15" },
    { days: 30, label: "Net 30" },
    { days: 45, label: "Net 45" },
    { days: 60, label: "Net 60" },
];

export const termsLabel = (days: number) => PAYMENT_TERMS.find((t) => t.days === days)?.label ?? `Net ${days}`;

// PO-0007
export const poNumber = (id: number) => `PO-${String(id).padStart(4, "0")}`;

type Line = { cases: number; unitCost: number; receivedCases?: number | null };

export const orderTotal = (lines: Line[]) => lines.reduce((sum, l) => sum + l.cases * l.unitCost, 0);
export const orderCases = (lines: Line[]) => lines.reduce((sum, l) => sum + l.cases, 0);
export const arrivedCases = (lines: Line[]) => lines.reduce((sum, l) => sum + (l.receivedCases ?? 0), 0);

// Cases ordered, or once it has arrived, the cases that actually came
export const casesText = (status: string, lines: Line[]) => (status === "received" ? `${arrivedCases(lines)} cases arrived` : `${orderCases(lines)} cases`);

// What we owe once it has arrived: only what actually came
export const receivedTotal = (lines: Line[]) => lines.reduce((sum, l) => sum + (l.receivedCases ?? 0) * l.unitCost, 0);

// The pay-by date for an order that arrived on `arrived`
export function payBy(arrived: Date, termsDays: number) {
    const due = new Date(arrived);
    due.setDate(due.getDate() + termsDays);
    return due;
}
