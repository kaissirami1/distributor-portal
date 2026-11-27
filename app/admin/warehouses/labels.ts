// How each 3PL's status reads and looks
export const WAREHOUSE_LABELS: Record<string, { label: string; badge: string }> = {
    quoting: { label: "Getting quotes", badge: "bg-blue-900/50 text-blue-300" },
    using: { label: "Using", badge: "bg-green-900/50 text-green-400" },
    not_using: { label: "Not using", badge: "bg-zinc-800 text-zinc-400" },
};

export const warehouseLabel = (status: string) => WAREHOUSE_LABELS[status] ?? WAREHOUSE_LABELS.quoting;
