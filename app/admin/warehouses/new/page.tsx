import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { WarehouseForm } from "../WarehouseForm";

export const metadata = { title: "Add 3PL" };

type PageProps = { searchParams: Promise<{ error?: string }> };

export default async function NewWarehousePage({ searchParams }: PageProps) {
    await requireAdmin();
    const { error } = await searchParams;
    return (
        <div>
            <PageHeader back={{ href: "/admin/warehouses", label: "3PL Warehouses" }} title="Add a 3PL" description="Fill in what you know. You can add the rest when they send a quote." />
            {error && <p role="alert" className="mb-4 text-sm text-red-400">Please enter the company name.</p>}
            <WarehouseForm />
        </div>
    );
}
