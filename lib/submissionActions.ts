"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { requireAdmin } from "./auth";

// Permanently deletes submissions with their notes, status history, documents and sales.
// Uploaded files stay in Cloudinary but are no longer linked anywhere.
export async function deleteSubmissions(ids: number[]) {
    await requireAdmin();
    const clean = ids.filter((id) => Number.isInteger(id));
    if (clean.length === 0) return 0;

    const where = { submissionId: { in: clean } };
    const [, , , , deleted] = await prisma.$transaction([
        prisma.sale.deleteMany({ where }),
        prisma.reviewNote.deleteMany({ where }),
        prisma.statusEvent.deleteMany({ where }),
        prisma.document.deleteMany({ where }),
        prisma.submission.deleteMany({ where: { id: { in: clean } } }),
    ]);

    revalidatePath("/admin", "layout");
    return deleted.count;
}

// The Delete button on a submission's own page
export async function deleteSubmissionFromPage(formData: FormData) {
    const id = Number(formData.get("submissionId"));
    const name = String(formData.get("productName") ?? "");
    await deleteSubmissions([id]);
    redirect(`/admin/submissions?deleted=${encodeURIComponent(name)}`);
}
