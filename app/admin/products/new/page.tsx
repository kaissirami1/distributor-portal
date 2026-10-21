import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "../ProductForm";

export const metadata = { title: "Add product" };

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    await requireAdmin();
    const { error } = await searchParams;
    const origins = await prisma.product.findMany({ select: { origin: true }, distinct: ["origin"], orderBy: { origin: "asc" } });

    return (
        <div>
            <PageHeader
                back={{ href: "/admin/products", label: "All products" }}
                title="Add product"
                description="It appears on your website's products page as soon as you save."
            />
            {error && <p role="alert" className="mb-4 text-sm text-red-400">Please fill in the name, origin and description.</p>}
            <ProductForm origins={origins.map((o) => o.origin)} />
        </div>
    );
}
