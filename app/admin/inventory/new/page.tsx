import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { ItemForm } from "../ItemForm";

export const metadata = { title: "Add inventory item" };

const ERRORS: Record<string, string> = {
    "per-pallet": "To count your starting stock in pallets, enter how many cases are in one pallet.",
};

type PageProps = { searchParams: Promise<{ error?: string; seller?: string }> };

export default async function NewItemPage({ searchParams }: PageProps) {
    await requireAdmin();
    const { error, seller } = await searchParams;
    const sellers = await prisma.seller.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
    const preset = sellers.find((s) => s.id === Number(seller))?.id;

    return (
        <div>
            <PageHeader back={{ href: "/admin/inventory", label: "Inventory" }} title="Add inventory item" description="A product you buy and hold yourself." />
            {error && <p role="alert" className="mb-4 text-sm text-red-400">{ERRORS[error] ?? "Please enter a name, and a cost and price of 0 or more."}</p>}
            <ItemForm sellers={sellers} presetSellerId={preset} />
        </div>
    );
}
