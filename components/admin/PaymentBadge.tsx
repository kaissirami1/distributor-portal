import { STATUS_BADGE, STATUS_LABEL, paymentStatus } from "@/lib/payments";

// Paid / Unpaid / Overdue label for a sale or a bill
export function PaymentBadge({ item }: { item: { paidAt: Date | null; dueDate: Date | null } }) {
    const status = paymentStatus(item);
    return <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status]}</span>;
}
