import { prisma } from "../../../lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ExcelJS from "exceljs";

export async function GET() {
    const cookieStore = await cookies();
    const isLoggedIn = cookieStore.get("admin-auth")?.value === "true";

    if (!isLoggedIn) {
        redirect("/admin/login");
    }

    const submissions = await prisma.submission.findMany({
        orderBy: { createdAt: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Submissions");

    worksheet.columns = [
        { header: "Date", key: "date", width: 22 },
        { header: "Name", key: "name", width: 22 },
        { header: "Email", key: "email", width: 30 },
        { header: "Phone", key: "phone", width: 18 },
        { header: "Company", key: "company", width: 25 },
        { header: "Product", key: "product", width: 25 },
        { header: "Category", key: "category", width: 20 },
        { header: "Minimum Order", key: "minimumOrder", width: 18 },
        { header: "Product URL", key: "productUrl", width: 35 },
        { header: "Image/File", key: "imageUrl", width: 35 },
        { header: "Documents", key: "documentsUrl", width: 35 },
        { header: "Barcode / UPC", key: "barcode", width: 25 },
        { header: "City", key: "city", width: 18 },
        { header: "County", key: "county", width: 18 },
        { header: "Status", key: "status", width: 15 },
        { header: "Notes", key: "notes", width: 40 },
    ];

    submissions.forEach((s: any) => {
        worksheet.addRow({
            date: new Date(s.createdAt).toLocaleString(),
            name: s.name,
            email: s.email,
            phone: s.phone || "",
            company: s.companyName || "",
            product: s.productName,
            category: s.category || "",
            minimumOrder: s.minimumOrder || "",
            productUrl: s.productUrl || "",
            imageUrl: s.imageUrl || "",
            documentsUrl: s.documentsUrl || "",
            barcode: s.barcode || "",
            city: s.city || "",
            county: s.county || "",
            status: s.status,
            notes: s.notes || "",
        });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF3E4B0" },
    };

    worksheet.eachRow((row) => {
        row.eachCell((cell) => {
            cell.border = {
                top: { style: "thin", color: { argb: "FFD9D9D9" } },
                left: { style: "thin", color: { argb: "FFD9D9D9" } },
                bottom: { style: "thin", color: { argb: "FFD9D9D9" } },
                right: { style: "thin", color: { argb: "FFD9D9D9" } },
            };
            cell.alignment = { vertical: "top", wrapText: true };
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
        headers: {
            "Content-Type":
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": 'attachment; filename="makram-submissions.xlsx"',
        },
    });
}