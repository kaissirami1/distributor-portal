"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { WAREHOUSE_LABELS } from "./labels";

const WAREHOUSE_STATUSES = Object.keys(WAREHOUSE_LABELS);

const text = (formData: FormData, key: string, max = 300) => String(formData.get(key) ?? "").trim().slice(0, max) || null;

// A price box: empty means "don't know yet"
const fee = (formData: FormData, key: string) => {
    const raw = String(formData.get(key) ?? "").trim();
    const n = Number(raw);
    return raw !== "" && Number.isFinite(n) && n >= 0 ? n : null;
};

export async function saveWarehouse(formData: FormData) {
    await requireAdmin();
    const id = Number(formData.get("id")) || null;
    const name = text(formData, "name", 120);
    if (!name) redirect(id ? `/admin/warehouses/${id}?edit=1&error=name` : "/admin/warehouses/new?error=name");

    const status = String(formData.get("status") ?? "");
    const data = {
        name,
        contactName: text(formData, "contactName", 120),
        email: text(formData, "email", 200),
        phone: text(formData, "phone", 40),
        address: text(formData, "address"),
        city: text(formData, "city", 80),
        state: text(formData, "state", 40),
        zip: text(formData, "zip", 20),
        hours: text(formData, "hours"),
        receivingFee: fee(formData, "receivingFee"),
        storageFee: fee(formData, "storageFee"),
        deliveryFee: fee(formData, "deliveryFee"),
        status: WAREHOUSE_STATUSES.includes(status) ? status : "quoting",
        notes: text(formData, "notes", 2000),
    };

    const saved = id ? await prisma.warehouse.update({ where: { id }, data }) : await prisma.warehouse.create({ data });
    revalidatePath("/admin", "layout");
    redirect(`/admin/warehouses/${saved.id}?saved=1`);
}

// Orders that used it keep their ship-to address; they just stop linking here
export async function deleteWarehouse(formData: FormData) {
    await requireAdmin();
    const w = await prisma.warehouse.delete({ where: { id: Number(formData.get("id")) } });
    revalidatePath("/admin", "layout");
    redirect(`/admin/warehouses?deleted=${encodeURIComponent(w.name)}`);
}
