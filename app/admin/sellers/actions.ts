"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

function refresh(id?: number) {
    revalidatePath("/admin/sellers");
    if (id) revalidatePath(`/admin/sellers/${id}`);
    revalidatePath("/admin/inventory");
}

// Adds a new seller, or saves changes when the form has an id
export async function saveSeller(formData: FormData) {
    await requireAdmin();
    const id = Number(formData.get("id")) || null;
    const data = {
        name: text(formData, "name"),
        contactName: text(formData, "contactName") || null,
        email: text(formData, "email") || null,
        phone: text(formData, "phone") || null,
        address: text(formData, "address") || null,
        city: text(formData, "city") || null,
        state: text(formData, "state") || null,
        website: text(formData, "website") || null,
        notes: text(formData, "notes") || null,
    };
    if (!data.name) redirect(id ? `/admin/sellers/${id}?edit=1&error=1` : "/admin/sellers/new?error=1");

    const seller = id
        ? await prisma.seller.update({ where: { id }, data })
        : await prisma.seller.create({ data });
    refresh(seller.id);
    redirect(`/admin/sellers/${seller.id}?saved=1`);
}

// Deletes the seller. Their inventory items stay, just without a seller.
export async function deleteSeller(formData: FormData) {
    await requireAdmin();
    const seller = await prisma.seller.delete({ where: { id: Number(formData.get("sellerId")) } });
    refresh();
    redirect(`/admin/sellers?deleted=${encodeURIComponent(seller.name)}`);
}
