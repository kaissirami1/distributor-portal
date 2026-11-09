"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { REMOVE_REASONS } from "@/lib/inventory";
import { PAYMENT_METHODS } from "@/lib/payments";

function refresh(id?: number) {
    revalidatePath("/admin/inventory");
    if (id) revalidatePath(`/admin/inventory/${id}`);
    revalidatePath("/admin/sales");
    revalidatePath("/admin/payments");
    revalidatePath("/admin/sellers", "layout");
}

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const number = (formData: FormData, key: string) => Number(text(formData, key));

const wholeNumber = (formData: FormData, key: string) => {
    const n = Number(text(formData, key));
    return text(formData, key) !== "" && Number.isInteger(n) && n > 0 ? n : null;
};

// The seller picked in the item form. "new" adds them to the Sellers list (or reuses one with the same name).
async function pickSeller(formData: FormData) {
    const pick = text(formData, "sellerId");
    if (pick === "new") {
        const name = text(formData, "newSellerName");
        if (!name) return null;
        const existing = await prisma.seller.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
        const seller = existing ?? (await prisma.seller.create({ data: { name } }));
        revalidatePath("/admin/sellers");
        return seller.id;
    }
    const id = Number(pick);
    if (!Number.isInteger(id) || id <= 0) return null;
    return (await prisma.seller.findUnique({ where: { id }, select: { id: true } }))?.id ?? null;
}

// Adds a new item, or saves changes when the form has an id
export async function saveItem(formData: FormData) {
    const admin = await requireAdmin();
    const id = Number(formData.get("id")) || null;
    const lowStockAt = text(formData, "lowStockAt");
    const data = {
        name: text(formData, "name"),
        sku: text(formData, "sku") || null,
        caseBarcode: text(formData, "caseBarcode").replace(/\s+/g, "") || null,
        unit: text(formData, "unit") || "case",
        casesPerPallet: wholeNumber(formData, "casesPerPallet"),
        cost: number(formData, "cost"),
        price: number(formData, "price"),
        lowStockAt: lowStockAt === "" ? null : Math.max(0, Math.floor(Number(lowStockAt))),
        location: text(formData, "location") || null,
        notes: text(formData, "notes") || null,
        image: text(formData, "image") || null,
    };
    const back = id ? `/admin/inventory/${id}?edit=1&` : "/admin/inventory/new?";
    if (!data.name || !Number.isFinite(data.cost) || data.cost < 0 || !Number.isFinite(data.price) || data.price < 0) {
        redirect(`${back}error=1`);
    }

    // Starting stock (new items only), counted in cases or in pallets
    const byPallet = text(formData, "startBy") === "pallet";
    const count = Math.max(0, Math.floor(number(formData, "quantity") || 0));
    if (!id && byPallet && count > 0 && !data.casesPerPallet) redirect(`${back}error=per-pallet`);

    const sellerId = await pickSeller(formData);

    if (id) {
        await prisma.inventoryItem.update({ where: { id }, data: { ...data, sellerId } });
        refresh(id);
        redirect(`/admin/inventory/${id}?saved=1`);
    }

    const start = byPallet ? count * (data.casesPerPallet ?? 0) : count;
    const item = await prisma.inventoryItem.create({
        data: {
            ...data,
            sellerId,
            quantity: start,
            movements: start > 0
                ? {
                    create: {
                        change: start,
                        reason: "start",
                        author: admin,
                        batch: text(formData, "batch").slice(0, 100) || null,
                        unitCost: data.cost,
                        pallets: byPallet ? count : null,
                    },
                }
                : undefined,
        },
    });
    refresh(item.id);
    redirect(`/admin/inventory/${item.id}?saved=1`);
}

// Receive stock (+), record a sale (−, also logged on the Sales page), or remove stock (−)
export async function changeStock(formData: FormData) {
    const admin = await requireAdmin();
    const id = Number(formData.get("itemId"));
    const kind = text(formData, "kind"); // received | sold | remove
    const qty = Math.floor(number(formData, "quantity"));
    const note = text(formData, "note") || null;

    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) redirect("/admin/inventory");
    if (!Number.isInteger(qty) || qty <= 0) redirect(`/admin/inventory/${id}?error=qty`);
    if (kind !== "received" && qty > item.quantity) redirect(`/admin/inventory/${id}?error=too-many`);

    if (kind === "received") {
        // Pallets need how many cases are in one, and what each case cost us
        const byPallet = text(formData, "receiveBy") === "pallet";
        const perPallet = byPallet ? wholeNumber(formData, "casesPerPallet") : null;
        const costText = text(formData, "unitCost");
        const unitCost = costText === "" ? null : Number(costText);
        if (byPallet && !perPallet) redirect(`/admin/inventory/${id}?error=per-pallet`);
        if (byPallet && unitCost === null) redirect(`/admin/inventory/${id}?error=cost`);
        if (unitCost !== null && (!Number.isFinite(unitCost) || unitCost < 0)) redirect(`/admin/inventory/${id}?error=cost`);

        const cases = byPallet ? qty * perPallet! : qty;
        await prisma.$transaction([
            prisma.inventoryItem.update({
                where: { id },
                data: {
                    quantity: { increment: cases },
                    // Remember the latest cost and pallet size for next time
                    ...(unitCost !== null ? { cost: unitCost } : {}),
                    ...(perPallet ? { casesPerPallet: perPallet } : {}),
                },
            }),
            prisma.inventoryMovement.create({
                data: {
                    itemId: id,
                    change: cases,
                    reason: "received",
                    note,
                    author: admin,
                    batch: text(formData, "batch").slice(0, 100) || null,
                    unitCost: unitCost ?? item.cost,
                    pallets: byPallet ? qty : null,
                },
            }),
        ]);
    } else if (kind === "sold") {
        const unitPrice = number(formData, "unitPrice");
        const revenue = Number.isFinite(unitPrice) && unitPrice >= 0 ? unitPrice * qty : item.price * qty;
        const dueDate = text(formData, "dueDate");
        const paid = formData.get("paid") === "on";
        const billing = {
            storeId: Number(formData.get("storeId")) || null,
            dueDate: /^\d{4}-\d{2}-\d{2}$/.test(dueDate) ? new Date(`${dueDate}T12:00:00`) : null,
            paidAt: paid ? new Date() : null,
            paymentMethod: paid && PAYMENT_METHODS.includes(text(formData, "paymentMethod")) ? text(formData, "paymentMethod") : null,
        };
        await prisma.$transaction([
            prisma.inventoryItem.update({ where: { id }, data: { quantity: { decrement: qty } } }),
            prisma.inventoryMovement.create({ data: { itemId: id, change: -qty, reason: "sold", note, author: admin } }),
            prisma.sale.create({ data: { inventoryItemId: id, quantity: qty, revenue, note, ...billing } }),
        ]);
    } else {
        const reason = REMOVE_REASONS.some((r) => r.key === text(formData, "reason")) ? text(formData, "reason") : "adjustment";
        await prisma.$transaction([
            prisma.inventoryItem.update({ where: { id }, data: { quantity: { decrement: qty } } }),
            prisma.inventoryMovement.create({ data: { itemId: id, change: -qty, reason, note, author: admin } }),
        ]);
    }

    refresh(id);
    redirect(`/admin/inventory/${id}?updated=${kind}`);
}

// Deletes the item with its stock history and its sales
export async function deleteItem(formData: FormData) {
    await requireAdmin();
    const item = await prisma.inventoryItem.delete({ where: { id: Number(formData.get("itemId")) } });
    refresh();
    redirect(`/admin/inventory?deleted=${encodeURIComponent(item.name)}`);
}
