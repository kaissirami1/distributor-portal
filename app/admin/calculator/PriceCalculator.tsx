"use client";

import { useEffect, useState } from "react";
import { EXAMPLE_INPUTS, calculatePrice, type PricingInputs } from "@/lib/pricing";

// The calculator's math lives in lib/pricing.ts; this file is the form and results.

type Key = keyof PricingInputs;

type FieldDef = {
    key: Key;
    label: string;
    prefix?: string;
    suffix?: string;
    min: number;
    max?: number;
    step: string;
};

const GROUPS: { title: string; hint?: string; fields: FieldDef[] }[] = [
    {
        title: "The product",
        fields: [
            { key: "sellerPrice", label: "Seller's price per case", prefix: "$", min: 0, step: "0.01" },
            { key: "unitsPerCase", label: "Units in a case", suffix: "units", min: 1, step: "1" },
        ],
    },
    {
        title: "Shipping to California",
        fields: [
            { key: "palletShipping", label: "Cost to ship one pallet", prefix: "$", min: 0, step: "1" },
            { key: "casesPerPallet", label: "Cases on a pallet", suffix: "cases", min: 1, step: "1" },
        ],
    },
    {
        title: "California warehouse (3PL)",
        hint: "From the warehouse's price list.",
        fields: [
            { key: "receiving", label: "Fee to receive a pallet", prefix: "$", min: 0, step: "0.01" },
            { key: "storage", label: "Storage per pallet, per month", prefix: "$", min: 0, step: "0.01" },
            { key: "months", label: "Months a pallet sits", suffix: "months", min: 0, step: "0.5" },
            { key: "orderFee", label: "To pack and deliver one store order", prefix: "$", min: 0, step: "0.01" },
        ],
    },
    {
        title: "Selling to stores",
        fields: [
            { key: "casesPerOrder", label: "Cases in a typical store order", suffix: "cases", min: 1, step: "1" },
            { key: "margin", label: "Our margin", suffix: "%", min: 0, max: 90, step: "1" },
            { key: "storeMargin", label: "Store's margin on the shelf", suffix: "%", min: 0, max: 90, step: "1" },
        ],
    },
];

const FIELDS = GROUPS.flatMap((g) => g.fields);
const STORAGE_KEY = "admin-price-calculator:v1";

type Form = Record<Key, string> & { name: string; competitor: string };

const exampleForm: Form = {
    name: "Example: Za'atar, 8 oz jar",
    competitor: "",
    ...(Object.fromEntries(Object.entries(EXAMPLE_INPUTS).map(([k, v]) => [k, String(v)])) as Record<Key, string>),
};

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const pct = (n: number) => `${Math.round(n)}%`;

function fieldError(f: FieldDef, raw: string) {
    const n = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(n) || n < f.min || (f.max !== undefined && n > f.max)) {
        return f.max !== undefined ? `Use ${f.min}–${f.max}.` : `Enter ${f.min} or more.`;
    }
    return "";
}

export function PriceCalculator() {
    const [form, setForm] = useState<Form>(exampleForm);

    // Bring back the numbers from last time (saved in this browser only)
    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
            // Runs once after the page appears, because the server can't see this browser's saved numbers
            // eslint-disable-next-line react-hooks/set-state-in-effect
            if (saved && typeof saved === "object") setForm({ ...exampleForm, ...saved });
        } catch { }
    }, []);

    function update(key: keyof Form, value: string) {
        const next = { ...form, [key]: value };
        setForm(next);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { }
    }

    const errors = Object.fromEntries(FIELDS.map((f) => [f.key, fieldError(f, form[f.key])])) as Record<Key, string>;
    const competitor = form.competitor.trim() === "" ? null : Number(form.competitor);
    const competitorError = competitor !== null && (!Number.isFinite(competitor) || competitor < 0) ? "Enter 0 or more, or leave empty." : "";
    const valid = FIELDS.every((f) => !errors[f.key]) && !competitorError;

    const inputs = Object.fromEntries(FIELDS.map((f) => [f.key, Number(form[f.key])])) as PricingInputs;
    const r = valid ? calculatePrice(inputs) : null;

    const segments = r
        ? [
            { label: "Seller's price", value: inputs.sellerPrice, className: "bg-zinc-300" },
            { label: "Shipping to California", value: r.freight, className: "bg-zinc-400" },
            { label: "Warehouse", value: r.warehouse, className: "bg-zinc-500" },
            { label: "Store delivery", value: r.delivery, className: "bg-zinc-600" },
            { label: "Our profit", value: r.profit, className: "bg-amber-300" },
        ]
        : [];

    let verdict = { text: "Add a similar product's shelf price to compare", className: "bg-zinc-800 text-zinc-400" };
    if (r && competitor) {
        const diff = ((r.shelfPrice - competitor) / competitor) * 100;
        verdict = diff <= 5
            ? { text: diff <= 0 ? `${pct(-diff)} cheaper than the similar product` : `Within ${pct(diff)} of the similar product`, className: "bg-green-900/50 text-green-400" }
            : { text: `${pct(diff)} more than the similar product`, className: "bg-red-900/50 text-red-400" };
    }

    return (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
            {/* Inputs */}
            <div className="space-y-5 min-w-0">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <label className="text-sm text-gray-400 block mb-1" htmlFor="calc-name">Product name</label>
                    <input id="calc-name" value={form.name} onChange={(e) => update("name", e.target.value)} className="admin-input" />
                </div>

                {GROUPS.map((group) => (
                    <fieldset key={group.title} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                        <legend className="sr-only">{group.title}</legend>
                        <h2 className="font-semibold mb-1">{group.title}</h2>
                        {group.hint && <p className="text-xs text-gray-500 mb-3">{group.hint}</p>}
                        <div className="grid sm:grid-cols-2 gap-4 mt-3">
                            {group.fields.map((f) => (
                                <div key={f.key}>
                                    <label className="text-sm text-gray-400 block mb-1" htmlFor={`calc-${f.key}`}>{f.label}</label>
                                    <div className={`flex items-center bg-black border rounded px-3 ${errors[f.key] ? "border-red-700" : "border-zinc-700 focus-within:border-zinc-500"}`}>
                                        {f.prefix && <span className="text-gray-500 text-sm">{f.prefix}</span>}
                                        <input
                                            id={`calc-${f.key}`}
                                            type="number"
                                            inputMode="decimal"
                                            min={f.min}
                                            max={f.max}
                                            step={f.step}
                                            value={form[f.key]}
                                            onChange={(e) => update(f.key, e.target.value)}
                                            className="flex-1 min-w-0 bg-transparent py-2 px-1.5 text-sm tabular-nums focus:outline-none"
                                        />
                                        {f.suffix && <span className="text-gray-500 text-sm">{f.suffix}</span>}
                                    </div>
                                    {errors[f.key] && <p className="text-xs text-red-400 mt-1">{errors[f.key]}</p>}
                                </div>
                            ))}
                            {group.title === "Selling to stores" && (
                                <div>
                                    <label className="text-sm text-gray-400 block mb-1" htmlFor="calc-competitor">
                                        Similar product's shelf price <span className="text-gray-600">(optional)</span>
                                    </label>
                                    <div className={`flex items-center bg-black border rounded px-3 ${competitorError ? "border-red-700" : "border-zinc-700 focus-within:border-zinc-500"}`}>
                                        <span className="text-gray-500 text-sm">$</span>
                                        <input
                                            id="calc-competitor"
                                            type="number"
                                            inputMode="decimal"
                                            min={0}
                                            step="0.01"
                                            value={form.competitor}
                                            onChange={(e) => update("competitor", e.target.value)}
                                            className="flex-1 min-w-0 bg-transparent py-2 px-1.5 text-sm tabular-nums focus:outline-none"
                                        />
                                        <span className="text-gray-500 text-sm">/unit</span>
                                    </div>
                                    {competitorError && <p className="text-xs text-red-400 mt-1">{competitorError}</p>}
                                </div>
                            )}
                        </div>
                    </fieldset>
                ))}

                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    <button
                        type="button"
                        onClick={() => {
                            setForm(exampleForm);
                            try { localStorage.removeItem(STORAGE_KEY); } catch { }
                        }}
                        className="border border-zinc-700 px-4 py-2 rounded text-gray-300 hover:border-zinc-500 hover:text-white"
                    >
                        Reset to example numbers
                    </button>
                    <span>Your numbers are saved in this browser.</span>
                </div>
            </div>

            {/* Results */}
            <div className="space-y-4 lg:sticky lg:top-6 min-w-0" aria-live="polite">
                <div className="bg-zinc-900 border border-amber-300/40 rounded-xl p-5">
                    <p className="text-xs uppercase tracking-wider text-gray-500">
                        Charge stores{form.name.trim() ? ` for ${form.name.trim()}` : ""}
                    </p>
                    <p className="text-4xl font-bold tabular-nums mt-1">
                        {r ? money(r.price) : "–"} <span className="text-base font-normal text-gray-500">per case</span>
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                        <span className="text-white tabular-nums">{r ? money(r.unitPrice) : "–"}</span> per unit · it costs us{" "}
                        <span className="text-white tabular-nums">{r ? money(r.landed) : "–"}</span> a case to deliver
                    </p>
                    <div className="grid grid-cols-3 gap-3 border-t border-zinc-800 mt-4 pt-4">
                        {[
                            ["Profit / case", r?.profit],
                            ["Per order", r?.profitPerOrder],
                            ["Per pallet", r?.profitPerPallet],
                        ].map(([label, value]) => (
                            <div key={label as string}>
                                <p className="text-xs text-gray-500">{label}</p>
                                <p className="text-green-400 tabular-nums font-medium">{typeof value === "number" ? money(value) : "–"}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">Where each dollar of the case price goes</p>
                    {r ? (
                        <>
                            <div className="flex h-4 rounded overflow-hidden bg-zinc-800 mb-3" role="img" aria-label="Breakdown of the price per case">
                                {segments.map((s) => (
                                    <div key={s.label} className={s.className} style={{ width: `${(s.value / r.price) * 100}%` }} title={`${s.label}: ${money(s.value)}`} />
                                ))}
                            </div>
                            <ul className="space-y-1.5 text-sm">
                                {segments.map((s) => (
                                    <li key={s.label} className="grid grid-cols-[12px_minmax(0,1fr)_auto_3.5rem] gap-2 items-center">
                                        <span className={`w-3 h-3 rounded-sm ${s.className}`} />
                                        <span className="text-gray-300">{s.label}</span>
                                        <span className="tabular-nums">{money(s.value)}</span>
                                        <span className="tabular-nums text-gray-500 text-right">{pct((s.value / r.price) * 100)}</span>
                                    </li>
                                ))}
                                <li className="grid grid-cols-[12px_minmax(0,1fr)_auto_3.5rem] gap-2 items-center border-t border-zinc-800 pt-1.5 font-semibold">
                                    <span />
                                    <span>Price per case</span>
                                    <span className="tabular-nums">{money(r.price)}</span>
                                    <span className="tabular-nums text-gray-500 text-right">100%</span>
                                </li>
                            </ul>
                        </>
                    ) : (
                        <p className="text-sm text-gray-500">Fix the highlighted numbers to see the breakdown.</p>
                    )}
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
                    <p className="text-xs uppercase tracking-wider text-gray-500">On the store shelf</p>
                    <p className="text-sm text-gray-400">
                        With the store's margin added, shoppers would pay about{" "}
                        <span className="text-white tabular-nums">{r ? money(r.shelfPrice) : "–"}</span> per unit.
                    </p>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${verdict.className}`}>{verdict.text}</span>
                </div>

                <p className="text-xs text-gray-500">
                    Margin is our share of the price the store pays: at 25%, we keep $25 of every $100.
                    The starting numbers are examples; replace them with real quotes before quoting a store.
                </p>
            </div>
        </div>
    );
}
