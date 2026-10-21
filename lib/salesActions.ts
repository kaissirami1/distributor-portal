"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { requireAdmin } from "./auth";

function refresh(submissionId: number) {
    revalidatePath("/admin/sales");
    revalidatePath(`/admin/submissions/${submissionId}`);
    revalidatePath("/track");
}

// Logs a sale from the Sales page
export async function logSale(formData: FormData) {
    await requireAdmin();
    const submissionId = Number(formData.get("submissionId"));
    const quantity = Number(formData.get("quantity"));
    const revenue = Number(formData.get("revenue"));
    const note = String(formData.get("note") ?? "").trim();
    const date = String(formData.get("date") ?? "");

    if (!submissionId || !Number.isInteger(quantity) || quantity <= 0 || !Number.isFinite(revenue) || revenue < 0) {
        redirect("/admin/sales?error=1");
    }

    // Noon on the chosen day, so the date shows the same in every time zone
    const createdAt = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T12:00:00`) : new Date();

    await prisma.sale.create({ data: { submissionId, quantity, revenue, note: note || null, createdAt } });
    refresh(submissionId);
    redirect("/admin/sales?logged=1");
}

export async function deleteSale(formData: FormData) {
    await requireAdmin();
    const sale = await prisma.sale.delete({ where: { id: Number(formData.get("saleId")) } });
    refresh(sale.submissionId);
}
