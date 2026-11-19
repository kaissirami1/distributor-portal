"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PAYMENT_TERMS, payBy, poNumber } from "@/lib/purchaseOrders";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

// A date box value ("2026-11-24") as noon that day, so it shows the same in every time zone
const toDay = (value: string) => (/^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : null);

function refresh() {
    revalidatePath("/admin", "layout");
}

// ── Create or edit an order ─────────────────────────────────────────────────

export type LineInput = {
    itemId: string;      // an inventory item's id, or "new"
    newName?: string;    // for a new item
    unit?: string;
    qty: string;
    by: "case" | "pallet";
    perPallet?: string;
    unitCost: string;
};

export type FormState = { error?: string };

const EDITABLE = ["draft", "sent", "confirmed"];

export async function savePurchaseOrder(_prev: FormState, formData: FormData): Promise<FormState> {
    const admin = await requireAdmin();
    const id = Number(formData.get("id")) || null;

    const seller = await prisma.seller.findUnique({ where: { id: Number(formData.get("sellerId")) || 0 } });
    if (!seller) return { error: "Pick the seller you're ordering from." };

    const termsDays = Number(text(formData, "termsDays"));
    if (!PAYMENT_TERMS.some((t) => t.days === termsDays)) return { error: "Pick the payment terms." };

    let raw: LineInput[];
    try {
        raw = JSON.parse(text(formData, "lines") || "[]");
    } catch {
        return { error: "Something went wrong with the products. Please try again." };
    }

    // Check every product line before saving anything
    const itemIds = raw.filter((l) => l.itemId !== "new").map((l) => Number(l.itemId));
    const items = await prisma.inventoryItem.findMany({ where: { id: { in: itemIds } } });
    const lines: { itemId: number | null; newName: string | null; unit: string; cases: number; pallets: number | null; perPallet: number | null; unitCost: number }[] = [];
    for (const [i, l] of raw.entries()) {
        const row = `Product ${i + 1}`;
        const qty = Number(l.qty), cost = Number(l.unitCost), per = Number(l.perPallet);
        const item = l.itemId === "new" ? null : items.find((it) => it.id === Number(l.itemId));
        const newName = l.itemId === "new" ? String(l.newName ?? "").trim().slice(0, 120) : null;
        if (l.itemId !== "new" && !item) return { error: `${row}: pick a product.` };
        if (l.itemId === "new" && !newName) return { error: `${row}: type the new product's name.` };
        if (!Number.isInteger(qty) || qty < 1) return { error: `${row}: enter how many, as a whole number.` };
        if (l.by === "pallet" && (!Number.isInteger(per) || per < 1)) return { error: `${row}: enter how many cases are in one pallet.` };
        if (l.unitCost === "" || !Number.isFinite(cost) || cost < 0) return { error: `${row}: enter the price per case.` };
        lines.push({
            itemId: item?.id ?? null,
            newName,
            unit: item?.unit ?? (String(l.unit ?? "").trim().slice(0, 20) || "case"),
            cases: l.by === "pallet" ? qty * per : qty,
            pallets: l.by === "pallet" ? qty : null,
            perPallet: l.by === "pallet" ? per : null,
            unitCost: cost,
        });
    }
    if (lines.length === 0) return { error: "Add at least one product." };

    if (id) {
        const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
        if (!existing) return { error: "That order no longer exists." };
        if (!EDITABLE.includes(existing.status)) return { error: "This order can't be changed any more." };
    }

    // New products are added to Inventory, linked to this seller, at 0 stock
    for (const line of lines) {
        if (line.itemId === null && line.newName) {
            const created = await prisma.inventoryItem.create({
                data: { name: line.newName, unit: line.unit, sellerId: seller.id, cost: line.unitCost, price: 0, casesPerPallet: line.perPallet },
            });
            line.itemId = created.id;
        }
    }

    const data = {
        sellerId: seller.id,
        sellerName: seller.name,
        shipTo: text(formData, "shipTo").slice(0, 500) || null,
        wantedBy: toDay(text(formData, "wantedBy")),
        termsDays,
        notes: text(formData, "notes").slice(0, 2000) || null,
    };
    const lineData = lines.map((l, i) => ({
        itemId: l.itemId,
        itemName: l.newName ?? items.find((it) => it.id === l.itemId)?.name ?? `Product ${i + 1}`,
        unit: l.unit,
        cases: l.cases,
        pallets: l.pallets,
        unitCost: l.unitCost,
    }));

    let savedId: number;
    if (id) {
        await prisma.$transaction([
            prisma.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: id } }),
            prisma.purchaseOrder.update({ where: { id }, data: { ...data, lines: { create: lineData } } }),
        ]);
        savedId = id;
    } else {
        const created = await prisma.purchaseOrder.create({ data: { ...data, author: admin, lines: { create: lineData } } });
        savedId = created.id;
    }

    refresh();
    redirect(`/admin/purchase-orders/${savedId}?saved=1`);
}

// ── Moving an order along ───────────────────────────────────────────────────

// Sent, confirmed, cancelled, or back to draft
export async function setOrderStatus(formData: FormData) {
    await requireAdmin();
    const id = Number(formData.get("id"));
    const to = text(formData, "to");
    const order = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!order || order.status === "received") redirect(`/admin/purchase-orders/${id}`);

    const now = new Date();
    const changes: Record<string, object> = {
        sent: { status: "sent", sentAt: order.sentAt ?? now },
        confirmed: { status: "confirmed", confirmedAt: now, sentAt: order.sentAt ?? now },
        cancelled: { status: "cancelled" },
        draft: { status: "draft" },
    };
    if (!changes[to]) redirect(`/admin/purchase-orders/${id}`);
    await prisma.purchaseOrder.update({ where: { id }, data: changes[to] });
    refresh();
    redirect(`/admin/purchase-orders/${id}?status=${to}`);
}

export async function markShipped(formData: FormData) {
    await requireAdmin();
    const id = Number(formData.get("id"));
    const order = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!order || !["draft", "sent", "confirmed", "shipped"].includes(order.status)) redirect(`/admin/purchase-orders/${id}`);
    const now = new Date();
    await prisma.purchaseOrder.update({
        where: { id },
        data: {
            status: "shipped",
            shippedAt: order.shippedAt ?? now,
            sentAt: order.sentAt ?? now,
            tracking: text(formData, "tracking").slice(0, 120) || null,
            expectedAt: toDay(text(formData, "expectedAt")),
        },
    });
    refresh();
    redirect(`/admin/purchase-orders/${id}?status=shipped`);
}

// It arrived at the warehouse: add what came to Inventory (with batch numbers) and make the bill in Payments
export async function receiveOrder(formData: FormData) {
    const admin = await requireAdmin();
    const id = Number(formData.get("id"));
    const order = await prisma.purchaseOrder.findUnique({ where: { id }, include: { lines: { include: { item: true } } } });
    if (!order || !["draft", "sent", "confirmed", "shipped"].includes(order.status)) redirect(`/admin/purchase-orders/${id}`);

    const arrived = toDay(text(formData, "arrivedOn")) ?? new Date();
    const counts = order.lines.map((l) => {
        const raw = text(formData, `received-${l.id}`);
        const n = Number(raw);
        return { line: l, received: raw !== "" && Number.isInteger(n) && n >= 0 && n <= 100_000 ? n : null, batch: text(formData, `batch-${l.id}`).slice(0, 100) || null };
    });
    if (counts.some((c) => c.received === null)) redirect(`/admin/purchase-orders/${id}?error=received`);
    if (counts.every((c) => c.received === 0)) redirect(`/admin/purchase-orders/${id}?error=nothing`);

    const number = poNumber(order.id);
    const amount = counts.reduce((sum, c) => sum + c.received! * c.line.unitCost, 0);
    const totalCases = counts.reduce((sum, c) => sum + c.received!, 0);
    const what = counts.filter((c) => c.received).map((c) => `${c.received} × ${c.line.itemName}`).join(", ");

    await prisma.$transaction([
        // Stock goes up, and each item remembers this cost and pallet size
        ...counts.filter((c) => c.received && c.line.item).flatMap((c) => {
            const fullPallets = c.line.pallets && c.received === c.line.cases ? c.line.pallets : null;
            const perPallet = c.line.pallets ? c.line.cases / c.line.pallets : null;
            return [
                prisma.inventoryItem.update({
                    where: { id: c.line.item!.id },
                    data: {
                        quantity: { increment: c.received! },
                        cost: c.line.unitCost,
                        ...(perPallet && Number.isInteger(perPallet) ? { casesPerPallet: perPallet } : {}),
                    },
                }),
                prisma.inventoryMovement.create({
                    data: {
                        itemId: c.line.item!.id,
                        change: c.received!,
                        reason: "received",
                        note: `${number} from ${order.sellerName}`,
                        author: admin,
                        batch: c.batch,
                        unitCost: c.line.unitCost,
                        pallets: fullPallets,
                    },
                }),
            ];
        }),
        ...counts.map((c) => prisma.purchaseOrderLine.update({ where: { id: c.line.id }, data: { receivedCases: c.received, batch: c.batch } })),
        prisma.purchaseOrder.update({
            where: { id },
            data: {
                status: "received",
                receivedAt: arrived,
                sentAt: order.sentAt ?? arrived,
                // What we owe the seller, due per the order's terms (e.g. 30 days after it arrived)
                ...(amount > 0
                    ? {
                        bill: {
                            create: {
                                payee: order.sellerName,
                                amount: Math.round(amount * 100) / 100,
                                description: `${number}: ${totalCases} cases (${what})`.slice(0, 300),
                                dueDate: payBy(arrived, order.termsDays),
                                author: admin,
                            },
                        },
                    }
                    : {}),
            },
        }),
    ]);

    refresh();
    redirect(`/admin/purchase-orders/${id}?status=received`);
}

export async function deleteOrder(formData: FormData) {
    await requireAdmin();
    const id = Number(formData.get("id"));
    const order = await prisma.purchaseOrder.findUnique({ where: { id } });
    // Orders that arrived stay, because their stock and bill depend on them
    if (order && order.status !== "received") await prisma.purchaseOrder.delete({ where: { id } });
    refresh();
    redirect(`/admin/purchase-orders?deleted=${order ? poNumber(order.id) : ""}`);
}
