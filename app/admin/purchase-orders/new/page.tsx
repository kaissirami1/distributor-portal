import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { PurchaseOrderForm } from "../PurchaseOrderForm";

export const metadata = { title: "New purchase order" };

type PageProps = { searchParams: Promise<{ seller?: string }> };

export default async function NewPurchaseOrderPage({ searchParams }: PageProps) {
    await requireAdmin();
    const { seller } = await searchParams;

    const [sellers, items, last] = await Promise.all([
        prisma.seller.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
        prisma.inventoryItem.findMany({ select: { id: true, name: true, sku: true, unit: true, cost: true, casesPerPallet: true, sellerId: true }, orderBy: { name: "asc" } }),
        // The warehouse address from the last order, so it doesn't need typing every time
        prisma.purchaseOrder.findFirst({ where: { shipTo: { not: null } }, orderBy: { createdAt: "desc" }, select: { shipTo: true } }),
    ]);
    const presetSellerId = sellers.find((s) => s.id === Number(seller))?.id;

    return (
        <div>
            <PageHeader back={{ href: "/admin/purchase-orders", label: "Purchase orders" }} title="New purchase order" description="What you're ordering from a seller, shipped to your warehouse." />
            <PurchaseOrderForm sellers={sellers} items={items} presetSellerId={presetSellerId} defaultShipTo={last?.shipTo ?? undefined} />
        </div>
    );
}
