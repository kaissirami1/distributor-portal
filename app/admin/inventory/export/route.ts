import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { asText, csvResponse } from "@/lib/csv";
import { marginPercent } from "@/lib/inventory";

// Admin → Inventory → "Download CSV": every item, one row each
export async function GET() {
    await requireAdmin();

    const items = await prisma.inventoryItem.findMany({
        orderBy: { name: "asc" },
        include: {
            seller: { select: { name: true } },
            movements: { where: { reason: { in: ["received", "start"] } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1 },
        },
    });

    const round = (n: number) => Math.round(n * 100) / 100;

    return csvResponse(
        "inventory",
        [
            "Item", "Seller", "Case barcode", "SKU", "Unit", "In stock", "Per pallet", "In stock (pallets)",
            "Cost per unit", "Price per unit", "Margin %", "Stock value at cost", "Stock value at price",
            "Low stock alert at", "Where it's stored", "Last received", "Last batch #", "Notes", "Added",
        ],
        items.map((i) => {
            const last = i.movements[0];
            return [
                i.name,
                i.seller?.name ?? i.supplier,
                asText(i.caseBarcode),
                asText(i.sku),
                i.unit,
                i.quantity,
                i.casesPerPallet,
                i.casesPerPallet ? round(i.quantity / i.casesPerPallet) : null,
                round(i.cost),
                round(i.price),
                i.price > 0 ? round(marginPercent(i.cost, i.price)) : null,
                round(i.quantity * i.cost),
                round(i.quantity * i.price),
                i.lowStockAt,
                i.location,
                last?.createdAt,
                asText(last?.batch),
                i.notes,
                i.createdAt,
            ];
        }),
    );
}
