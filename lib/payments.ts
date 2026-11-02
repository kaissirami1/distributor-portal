// ─────────────────────────────────────────────────────────────────────────────
// Settings for Admin → Payments: who owes us, and whom we owe.
// ─────────────────────────────────────────────────────────────────────────────

// How money was paid. Add or rename methods here.
export const PAYMENT_METHODS = ["ACH / bank transfer", "Check", "Zelle", "Card", "Wire", "Cash", "Other"];

export type PaymentStatus = "paid" | "overdue" | "unpaid";

// Start of today: anything due before this is overdue
function startOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

// Paid, overdue (due date has passed), or unpaid (not due yet, or no due date)
export function paymentStatus(item: { paidAt: Date | null; dueDate: Date | null }): PaymentStatus {
    if (item.paidAt) return "paid";
    if (item.dueDate && item.dueDate < startOfToday()) return "overdue";
    return "unpaid";
}

export const STATUS_LABEL: Record<PaymentStatus, string> = { paid: "Paid", overdue: "Overdue", unpaid: "Unpaid" };
export const STATUS_BADGE: Record<PaymentStatus, string> = {
    paid: "bg-green-900/50 text-green-300",
    overdue: "bg-red-900/50 text-red-300",
    unpaid: "bg-amber-900/50 text-amber-300",
};
