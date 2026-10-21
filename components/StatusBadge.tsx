import { getStatus } from "@/lib/status";

// Small colored label like "Approved" (colors are set in lib/status.ts)
export function StatusBadge({ status }: { status: string }) {
    const info = getStatus(status);
    return (
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${info.badge}`}>
            {info.label}
        </span>
    );
}
