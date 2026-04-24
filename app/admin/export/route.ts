import { prisma } from "../../../lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function GET() {
    const cookieStore = await cookies();
    const isLoggedIn = cookieStore.get("admin-auth")?.value === "true";

    if (!isLoggedIn) {
        redirect("/admin/login");
    }

    const submissions = await prisma.submission.findMany({
        orderBy: { createdAt: "desc" },
    });

    const headers = [
        "Date",
        "Name",
        "Email",
        "Company",
        "Product",
        "Category",
        "Cost",
        "Minimum Order",
        "City",
        "County",
        "Status",
        "Notes",
    ];

    const rows = submissions.map((s) => [
        new Date(s.createdAt).toLocaleString(),
        s.name,
        s.email,
        s.companyName || "",
        s.productName,
        s.category || "",
        s.cost || "",
        s.minimumOrder || "",
        s.city || "",
        s.county || "",
        s.status,
        s.notes || "",
    ]);

    const csv = [headers, ...rows]
        .map((row) =>
            row
                .map((value) => `"${String(value).replaceAll('"', '""')}"`)
                .join(",")
        )
        .join("\n");

    return new Response(csv, {
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": 'attachment; filename="submissions.csv"',
        },
    });
}