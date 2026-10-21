"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

// Pages that show products, refreshed after every change so the website is up to date
function refreshProductPages() {
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/admin/products", "layout");
}

// Adds a new product, or saves changes when the form has an id
export async function saveProduct(formData: FormData) {
    await requireAdmin();
    const id = Number(formData.get("id")) || null;
    const data = {
        name: String(formData.get("name") ?? "").trim(),
        origin: String(formData.get("origin") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim(),
        image: String(formData.get("image") ?? "").trim() || null,
    };

    if (!data.name || !data.origin || !data.description) {
        redirect(`/admin/products/${id ?? "new"}?error=missing`);
    }

    if (id) {
        await prisma.product.update({ where: { id }, data });
    } else {
        await prisma.product.create({ data });
    }

    refreshProductPages();
    redirect(`/admin/products?saved=${encodeURIComponent(data.name)}`);
}

export async function deleteProduct(formData: FormData) {
    await requireAdmin();
    const id = Number(formData.get("id"));
    const product = await prisma.product.delete({ where: { id } });
    refreshProductPages();
    redirect(`/admin/products?deleted=${encodeURIComponent(product.name)}`);
}
