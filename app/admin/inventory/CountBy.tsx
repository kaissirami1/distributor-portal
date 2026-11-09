"use client";

import { plural } from "@/lib/inventory";

export type CountBy = "case" | "pallet";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// "Cases | Pallets" switch for adding stock. Sends its choice as a hidden field.
export function CountByToggle({ value, onChange, unit, name }: { value: CountBy; onChange: (v: CountBy) => void; unit: string; name: string }) {
    const options: [CountBy, string][] = [["case", capitalize(plural(unit || "case"))], ["pallet", "Pallets"]];
    return (
        <div role="radiogroup" aria-label="Count by" className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-zinc-800/60">
            {options.map(([v, label]) => (
                <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={value === v}
                    onClick={() => onChange(v)}
                    className={`py-1.5 rounded-md text-sm font-medium transition ${value === v ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}
                >
                    {label}
                </button>
            ))}
            <input type="hidden" name={name} value={value} />
        </div>
    );
}

// What will be added, e.g. "Adds 120 cases (2 pallets × 60)"
export function countSummary(by: CountBy, qty: string, perPallet: string, unit: string) {
    const n = Number(qty), per = Number(perPallet);
    if (!qty || !Number.isInteger(n) || n <= 0) return null;
    if (by === "case") return { cases: n, text: `${n} ${n === 1 ? unit : plural(unit)}` };
    if (!perPallet || !Number.isInteger(per) || per <= 0) return null;
    return { cases: n * per, text: `${n * per} ${plural(unit)} (${n} pallet${n === 1 ? "" : "s"} × ${per})` };
}
