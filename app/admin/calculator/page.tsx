import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { PriceCalculator } from "./PriceCalculator";

export const metadata = { title: "Price Calculator" };

export default async function PriceCalculatorPage() {
    await requireAdmin();
    return (
        <div>
            <PageHeader
                title="Price Calculator"
                description="What one case costs to land in a California store, and what to charge stores for the margin we want."
            />
            <PriceCalculator />
        </div>
    );
}
