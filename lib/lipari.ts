import { randomBytes, randomInt } from "node:crypto";
import { prisma } from "./prisma";

// ─────────────────────────────────────────────────────────────────────────────
// Admin → Lipari: selling Lipari Distributions' products to stores.
// Each product we order is its own purchase order (PO) with its own delivery
// barcode (DO). Lipari ships the pallets to our 3PL warehouse, the 3PL scans
// the barcode and delivers to the store, the store pays us, and we pay Lipari.
// Lipari never sees which store an order is for, or what we charge.
// ─────────────────────────────────────────────────────────────────────────────

// The seller this section is for (matched by name, so renaming "Lipari Foods" ↔ "Lipari Distributions" is fine)
export async function getLipari() {
    return prisma.seller.findFirst({ where: { name: { contains: "Lipari", mode: "insensitive" } }, orderBy: { id: "asc" } });
}

export const LIPARI_STEPS = [
    { key: "draft", label: "Not sent", badge: "bg-zinc-800 text-zinc-300" },
    { key: "sent", label: "Sent to Lipari", badge: "bg-blue-900/50 text-blue-300" },
    { key: "confirmed", label: "Lipari confirmed", badge: "bg-purple-900/50 text-purple-300" },
    { key: "shipped", label: "On the way to the 3PL", badge: "bg-amber-900/50 text-amber-300" },
    { key: "received", label: "At the 3PL", badge: "bg-amber-900/50 text-amber-300" },
    { key: "delivered", label: "Delivered to store", badge: "bg-green-900/50 text-green-400" },
    { key: "cancelled", label: "Cancelled", badge: "bg-zinc-800 text-zinc-500" },
] as const;

export const lipariStep = (status: string) => LIPARI_STEPS.find((s) => s.key === status) ?? LIPARI_STEPS[0];

// Orders still moving: not delivered and not cancelled
export const LIPARI_OPEN = ["draft", "sent", "confirmed", "shipped", "received"];

// The delivery barcode's value: random letters and digits that mean nothing on their own
// (no 0/O or 1/I, so it can also be read out loud if a scan fails)
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function newDeliveryCode() {
    return Array.from({ length: 10 }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join("");
}

// The private link for a group of orders' pallet labels (long and random, so it can't be guessed)
export const newBatchCode = () => randomBytes(18).toString("base64url");

// What the store owes us / we earn on one order
export const orderMoney = (line: { cases: number; unitCost: number; salePrice: number | null } | undefined) => {
    if (!line) return { cost: 0, sale: 0, profit: 0 };
    const cost = line.cases * line.unitCost;
    const sale = line.cases * (line.salePrice ?? 0);
    return { cost, sale, profit: sale - cost };
};

// A store's or 3PL's address on one line, skipping a part that's already in it (e.g. a store named "…, Anaheim" in Anaheim)
export const oneLine = (...parts: (string | null | undefined)[]) =>
    parts.map((p) => p?.trim()).filter((p): p is string => Boolean(p))
        .filter((p, i, all) => !all.slice(0, i).some((earlier) => earlier.toLowerCase().includes(p.toLowerCase())))
        .join(", ");
