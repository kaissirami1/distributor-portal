import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { asText, csvResponse } from "@/lib/csv";
import { storeStage } from "@/lib/stores";

// Admin → Stores → "Download CSV": every store, one row each
export async function GET() {
    await requireAdmin();

    const stores = await prisma.store.findMany({
        orderBy: { name: "asc" },
        include: {
            visits: { orderBy: [{ date: "desc" }, { id: "desc" }], select: { date: true, samplesGiven: true } },
            sales: { select: { revenue: true, paidAt: true } },
        },
    });

    const round = (n: number) => Math.round(n * 100) / 100;

    return csvResponse(
        "stores",
        [
            "Store", "Type", "Stage", "Person in charge", "Role", "Phone", "Email", "Address", "City", "Website",
            "Next step", "Follow up on", "Last contact", "Contacts logged", "Samples given", "Total sold to them", "Unpaid", "Notes", "Added",
        ],
        stores.map((s) => [
            s.name,
            s.type,
            storeStage(s.stage).label,
            s.contactName,
            s.contactRole,
            asText(s.phone),
            s.email,
            s.address,
            s.city,
            s.website,
            s.nextStep,
            s.followUpOn,
            s.visits[0]?.date,
            s.visits.length,
            s.visits.map((v) => v.samplesGiven).filter(Boolean).join("; "),
            round(s.sales.reduce((n, x) => n + x.revenue, 0)),
            round(s.sales.filter((x) => !x.paidAt).reduce((n, x) => n + x.revenue, 0)),
            s.notes,
            s.createdAt,
        ]),
    );
}
