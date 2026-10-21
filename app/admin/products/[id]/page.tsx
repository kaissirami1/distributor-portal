import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/ConfirmButton";
import { AdminLink, PageHeader } from "@/components/admin/ui";
import { formatDate } from "@/lib/dates";
import { ProductForm } from "../ProductForm";
import { deleteProduct } from "../actions";

export const metadata = { title: "Edit product" };

type PageProps = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ error?: string }>;
};

export default async function EditProductPage({ params, searchParams }: PageProps) {
    await requireAdmin();
    const { id } = await params;
    const { error } = await searchParams;
    const productId = Number(id);
    if (!Number.isInteger(productId)) notFound();

    const [product, origins] = await Promise.all([
        prisma.product.findUnique({ where: { id: productId } }),
        prisma.product.findMany({ select: { origin: true }, distinct: ["origin"], orderBy: { origin: "asc" } }),
    ]);
    if (!product) notFound();

    return (
        <div>
            <PageHeader
                back={{ href: "/admin/products", label: "All products" }}
                title={product.name}
                description={`Added ${formatDate(product.createdAt)}`}
                actions={<AdminLink href="/products" newTab>View on website</AdminLink>}
            />
            {error && <p role="alert" className="mb-4 text-sm text-red-400">Please fill in the name, origin and description.</p>}
            <ProductForm product={product} origins={origins.map((o) => o.origin)} />

            <form action={deleteProduct} className="mt-10 border-t border-zinc-800 pt-6 flex flex-wrap items-center justify-between gap-3">
                <input type="hidden" name="id" value={product.id} />
                <p className="text-sm text-zinc-500">Removing a product takes it off your website right away.</p>
                <ConfirmButton
                    type="submit"
                    message={`Delete "${product.name}"? It will be removed from your website. This can't be undone.`}
                    className="px-4 py-2 rounded-lg text-sm font-semibold border border-red-900 text-red-400 hover:bg-red-950"
                >
                    Delete product
                </ConfirmButton>
            </form>
        </div>
    );
}
