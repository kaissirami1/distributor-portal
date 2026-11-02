"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { requireAdmin } from "./auth";
import { PAYMENT_METHODS } from "./payments";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const method = (formData: FormData) => (PAYMENT_METHODS.includes(text(formData, "paymentMethod")) ? text(formData, "paymentMethod") : null);

// A date box value ("2026-11-02") as noon that day, so it shows the same in every time zone
async function toDay(value: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : null;
}

function refresh() {
    revalidatePath("/admin", "layout");
}

// ── Money owed to us (sales) ────────────────────────────────────────────────

export async function markSalePaid(formData: FormData) {
    await requireAdmin();
    await prisma.sale.update({
        where: { id: Number(formData.get("saleId")) },
        data: { paidAt: (await toDay(text(formData, "paidOn"))) ?? new Date(), paymentMethod: method(formData) },
    });
    refresh();
}

export async function markSaleUnpaid(formData: FormData) {
    await requireAdmin();
    await prisma.sale.update({ where: { id: Number(formData.get("saleId")) }, data: { paidAt: null, paymentMethod: null } });
    refresh();
}

// Change who bought it, the invoice number or the due date
export async function updateSaleBilling(formData: FormData) {
    await requireAdmin();
    const storeId = Number(formData.get("storeId")) || null;
    await prisma.sale.update({
        where: { id: Number(formData.get("saleId")) },
        data: {
            storeId,
            invoiceNumber: text(formData, "invoiceNumber") || null,
            dueDate: await toDay(text(formData, "dueDate")),
        },
    });
    refresh();
}

// ── Money we owe (bills) ────────────────────────────────────────────────────

export async function saveBill(formData: FormData) {
    const admin = await requireAdmin();
    const amount = Number(text(formData, "amount"));
    const payee = text(formData, "payee");
    if (!payee || !Number.isFinite(amount) || amount <= 0) return;
    await prisma.bill.create({
        data: {
            payee,
            amount,
            description: text(formData, "description") || null,
            dueDate: await toDay(text(formData, "dueDate")),
            reference: text(formData, "reference") || null,
            notes: text(formData, "notes") || null,
            author: admin,
        },
    });
    refresh();
}

export async function markBillPaid(formData: FormData) {
    await requireAdmin();
    await prisma.bill.update({
        where: { id: Number(formData.get("billId")) },
        data: { paidAt: (await toDay(text(formData, "paidOn"))) ?? new Date(), paymentMethod: method(formData) },
    });
    refresh();
}

export async function markBillUnpaid(formData: FormData) {
    await requireAdmin();
    await prisma.bill.update({ where: { id: Number(formData.get("billId")) }, data: { paidAt: null, paymentMethod: null } });
    refresh();
}

export async function deleteBill(formData: FormData) {
    await requireAdmin();
    await prisma.bill.delete({ where: { id: Number(formData.get("billId")) } });
    refresh();
}
