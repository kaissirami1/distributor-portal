import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { SellerForm } from "../SellerForm";

export const metadata = { title: "Add seller" };

type PageProps = { searchParams: Promise<{ error?: string; from?: string }> };

export default async function NewSellerPage({ searchParams }: PageProps) {
    await requireAdmin();
    const { error, from } = await searchParams;

    // "Add as seller" from a submission: fill in what they already told us
    const submission = Number(from) ? await prisma.submission.findUnique({ where: { id: Number(from) } }) : null;
    const prefill = submission
        ? {
            name: submission.companyName || submission.name,
            contactName: submission.name,
            email: submission.email,
            phone: submission.phone,
            city: submission.city,
            website: null,
            notes: null, address: null, state: null,
        }
        : undefined;

    return (
        <div>
            <PageHeader
                back={{ href: "/admin/sellers", label: "Sellers" }}
                title="Add seller"
                description={submission ? `Filled in from ${submission.name}'s submission. Check it and save.` : "Only the business name is required. You can fill in the rest later."}
            />
            {error && <p role="alert" className="mb-4 text-sm text-red-400">Please enter the business name.</p>}
            <SellerForm seller={prefill} />
        </div>
    );
}
