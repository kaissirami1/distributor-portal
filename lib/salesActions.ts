"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { requireAdmin } from "./auth";
import { PAYMENT_METHODS } from "./payments";

function refresh(sale: { submissionId: number | null; inventoryItemId: number | null }) {
    revalidatePath("/admin/sales");
    revalidatePath("/admin/payments");
    if (sale.submissionId) revalidatePath(`/admin/submissions/${sale.submissionId}`);
    if (sale.inventoryItemId) {
        revalidatePath(`/admin/inventory/${sale.inventoryItemId}`);
        revalidatePath("/admin/inventory");
    }
}

// Logs a sale from the Sales page. The product is "sub-<id>" (a vendor's product)
// or "inv-<id>" (one of our inventory items, whose stock goes down).
export async function logSale(formData: FormData) {
    const admin = await requireAdmin();
    const [source, rawId] = String(formData.get("product") ?? "").split("-");
    const id = Number(rawId);
    const quantity = Number(formData.get("quantity"));
    const revenue = Number(formData.get("revenue"));
    const note = String(formData.get("note") ?? "").trim() || null;
    const date = String(formData.get("date") ?? "");

    if (!id || !["sub", "inv"].includes(source) || !Number.isInteger(quantity) || quantity <= 0 || !Number.isFinite(revenue) || revenue < 0) {
        redirect("/admin/sales?error=1");
    }

    // Noon on the chosen day, so the date shows the same in every time zone
    const toDay = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T12:00:00`) : null);
    const createdAt = toDay(date) ?? new Date();

    // Who bought it and whether they've paid
    const method = String(formData.get("paymentMethod") ?? "");
    const paid = formData.get("paid") === "on";
    const billing = {
        storeId: Number(formData.get("storeId")) || null,
        invoiceNumber: String(formData.get("invoiceNumber") ?? "").trim() || null,
        dueDate: toDay(String(formData.get("dueDate") ?? "")),
        paidAt: paid ? createdAt : null,
        paymentMethod: paid && PAYMENT_METHODS.includes(method) ? method : null,
    };

    if (source === "inv") {
        const item = await prisma.inventoryItem.findUnique({ where: { id }, select: { quantity: true } });
        if (!item) redirect("/admin/sales?error=1");
        if (quantity > item.quantity) redirect("/admin/sales?error=stock");
        await prisma.$transaction([
            prisma.inventoryItem.update({ where: { id }, data: { quantity: { decrement: quantity } } }),
            prisma.inventoryMovement.create({ data: { itemId: id, change: -quantity, reason: "sold", note, author: admin } }),
            prisma.sale.create({ data: { inventoryItemId: id, quantity, revenue, note, createdAt, ...billing } }),
        ]);
        refresh({ submissionId: null, inventoryItemId: id });
    } else {
        await prisma.sale.create({ data: { submissionId: id, quantity, revenue, note, createdAt, ...billing } });
        refresh({ submissionId: id, inventoryItemId: null });
    }
    redirect("/admin/sales?logged=1");
}

// Deleting a sale of an inventory item puts its units back in stock
export async function deleteSale(formData: FormData) {
    const admin = await requireAdmin();
    const sale = await prisma.sale.delete({ where: { id: Number(formData.get("saleId")) } });
    if (sale.inventoryItemId) {
        await prisma.$transaction([
            prisma.inventoryItem.update({ where: { id: sale.inventoryItemId }, data: { quantity: { increment: sale.quantity } } }),
            prisma.inventoryMovement.create({ data: { itemId: sale.inventoryItemId, change: sale.quantity, reason: "sale-deleted", author: admin } }),
        ]);
    }
    refresh(sale);
}
