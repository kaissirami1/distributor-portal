import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getLipari } from "@/lib/lipari";
import { EmptyState, PageHeader } from "@/components/admin/ui";
import { LipariOrderForm } from "../LipariOrderForm";

export const metadata = { title: "New Lipari order" };

export default async function NewLipariOrderPage() {
    await requireAdmin();
    const lipari = await getLipari();

    const [products, stores, warehouses, last] = await Promise.all([
        lipari
            ? prisma.inventoryItem.findMany({ where: { sellerId: lipari.id }, select: { id: true, name: true, sku: true, unit: true, cost: true, price: true, casesPerPallet: true }, orderBy: { name: "asc" } })
            : [],
        prisma.store.findMany({ select: { id: true, name: true, city: true }, orderBy: { name: "asc" } }),
        prisma.warehouse.findMany({ select: { id: true, name: true, status: true }, orderBy: { name: "asc" } }),
        // The 3PL used last time, so it's already picked
        prisma.purchaseOrder.findFirst({ where: { warehouseId: { not: null } }, orderBy: { createdAt: "desc" }, select: { warehouseId: true } }),
    ]);
    // 3PLs you use first, ones you've stopped using last
    const rank = (s: string) => ({ using: 0, quoting: 1 } as Record<string, number>)[s] ?? 2;
    warehouses.sort((a, b) => rank(a.status) - rank(b.status));

    return (
        <div>
            <PageHeader
                back={{ href: "/admin/lipari", label: "Lipari orders" }}
                title="New Lipari order"
                description="Pick each product, the store it's for, and both prices. Lipari ships everything to your 3PL; the barcodes tell the 3PL which store gets what."
            />
            {!lipari ? (
                <EmptyState title="Lipari isn't set up" text="Lipari Distributions needs to be in your sellers list." />
            ) : stores.length === 0 ? (
                <EmptyState title="Add a store first" text="Orders are placed for a store. Add the store under Stores, then come back." />
            ) : (
                <LipariOrderForm products={products} stores={stores} warehouses={warehouses} defaultWarehouseId={last?.warehouseId ?? undefined} />
            )}
        </div>
    );
}
