"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { REMOVE_REASONS } from "@/lib/inventory";

function refresh(id?: number) {
    revalidatePath("/admin/inventory");
    if (id) revalidatePath(`/admin/inventory/${id}`);
    revalidatePath("/admin/sales");
}

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const number = (formData: FormData, key: string) => Number(text(formData, key));

// Adds a new item, or saves changes when the form has an id
export async function saveItem(formData: FormData) {
    const admin = await requireAdmin();
    const id = Number(formData.get("id")) || null;
    const lowStockAt = text(formData, "lowStockAt");
    const data = {
        name: text(formData, "name"),
        sku: text(formData, "sku") || null,
        supplier: text(formData, "supplier") || null,
        unit: text(formData, "unit") || "case",
        cost: number(formData, "cost"),
        price: number(formData, "price"),
        lowStockAt: lowStockAt === "" ? null : Math.max(0, Math.floor(Number(lowStockAt))),
        location: text(formData, "location") || null,
        notes: text(formData, "notes") || null,
        image: text(formData, "image") || null,
    };
    if (!data.name || !Number.isFinite(data.cost) || data.cost < 0 || !Number.isFinite(data.price) || data.price < 0) {
        redirect(`/admin/inventory/${id ?? "new"}?error=1`);
    }

    if (id) {
        await prisma.inventoryItem.update({ where: { id }, data });
        refresh(id);
        redirect(`/admin/inventory/${id}?saved=1`);
    }

    // New item: record its starting stock in the history
    const start = Math.max(0, Math.floor(number(formData, "quantity") || 0));
    const item = await prisma.inventoryItem.create({
        data: {
            ...data,
            quantity: start,
            movements: start > 0 ? { create: { change: start, reason: "start", author: admin } } : undefined,
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
        await prisma.$transaction([
            prisma.inventoryItem.update({ where: { id }, data: { quantity: { increment: qty } } }),
            prisma.inventoryMovement.create({ data: { itemId: id, change: qty, reason: "received", note, author: admin } }),
        ]);
    } else if (kind === "sold") {
        const unitPrice = number(formData, "unitPrice");
        const revenue = Number.isFinite(unitPrice) && unitPrice >= 0 ? unitPrice * qty : item.price * qty;
        await prisma.$transaction([
            prisma.inventoryItem.update({ where: { id }, data: { quantity: { decrement: qty } } }),
            prisma.inventoryMovement.create({ data: { itemId: id, change: -qty, reason: "sold", note, author: admin } }),
            prisma.sale.create({ data: { inventoryItemId: id, quantity: qty, revenue, note } }),
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
