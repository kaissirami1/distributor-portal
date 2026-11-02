// ─────────────────────────────────────────────────────────────────────────────
// Settings for Admin → Stores: the stores you visit and sell to.
// Rename stages, add store types or outcomes here; every Stores page updates.
// ─────────────────────────────────────────────────────────────────────────────

// Where each store is with you, in order
export const STORE_STAGES = [
    { key: "new", label: "Not visited yet", badge: "bg-zinc-800 text-zinc-300" },
    { key: "visited", label: "Visited", badge: "bg-blue-900/50 text-blue-300" },
    { key: "samples", label: "Samples given", badge: "bg-purple-900/50 text-purple-300" },
    { key: "interested", label: "Interested", badge: "bg-amber-900/50 text-amber-300" },
    { key: "customer", label: "Ordering", badge: "bg-green-900/50 text-green-300" },
    { key: "not_interested", label: "Not interested", badge: "bg-red-900/40 text-red-300" },
] as const;

export type StoreStage = (typeof STORE_STAGES)[number]["key"];

export function storeStage(key: string) {
    return STORE_STAGES.find((s) => s.key === key) ?? STORE_STAGES[0];
}

// Suggestions for the "Type of store" box (you can type anything)
export const STORE_TYPES = [
    "Middle Eastern market",
    "Latin market",
    "Asian market",
    "Grocery store",
    "Specialty / gourmet shop",
    "Deli",
    "Bakery",
    "Café",
    "Restaurant",
    "Convenience store",
    "Wholesaler",
];

// Who you talked to
export const CONTACT_ROLES = ["Owner", "Manager", "Buyer", "Employee", "Other"];

// How you were in touch
export const VISIT_KINDS = [
    { key: "visit", label: "Visited in person" },
    { key: "call", label: "Phone call" },
    { key: "message", label: "Email or text" },
];

// How it went
export const VISIT_OUTCOMES = [
    "Interested",
    "Wants prices",
    "Follow up later",
    "Placed an order",
    "Not interested",
    "Owner wasn't there",
];
