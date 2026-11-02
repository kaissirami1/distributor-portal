import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { ItemForm } from "../ItemForm";

export const metadata = { title: "Add inventory item" };

export default async function NewItemPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    await requireAdmin();
    const { error } = await searchParams;
    return (
        <div>
            <PageHeader back={{ href: "/admin/inventory", label: "Inventory" }} title="Add inventory item" description="A product you buy and hold yourself." />
            {error && <p role="alert" className="mb-4 text-sm text-red-400">Please enter a name, and a cost and price of 0 or more.</p>}
            <ItemForm />
        </div>
    );
}
