import { storeStage } from "@/lib/stores";

// The colored label showing where a store is with you (colors are set in lib/stores.ts)
export function StageBadge({ stage }: { stage: string }) {
    const s = storeStage(stage);
    return <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${s.badge}`}>{s.label}</span>;
}
