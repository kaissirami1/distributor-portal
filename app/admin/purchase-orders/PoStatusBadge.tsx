import { poStatus } from "@/lib/purchaseOrders";

export function PoStatusBadge({ status }: { status: string }) {
    const s = poStatus(status);
    return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${s.badge}`}>{s.label}</span>;
}
