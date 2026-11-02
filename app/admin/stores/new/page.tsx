import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { StoreForm } from "../StoreForm";

export const metadata = { title: "Add store" };

export default async function NewStorePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    await requireAdmin();
    const { error } = await searchParams;
    return (
        <div>
            <PageHeader back={{ href: "/admin/stores", label: "Stores" }} title="Add store" description="Only the name is required. You can fill in the rest later." />
            {error && <p role="alert" className="mb-4 text-sm text-red-400">Please enter the store's name.</p>}
            <StoreForm />
        </div>
    );
}
