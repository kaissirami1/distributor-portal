import { prisma } from "./prisma";
import { sendEmail } from "./email";
import { site } from "./site";
import type { Status } from "./status";

// Changes the status of one or more submissions, records it in each one's
// activity history, and emails the vendor when a product is approved or rejected.
// Used by both the submission page and the bulk buttons on the submissions list.
export async function changeSubmissionStatus(ids: number[], status: Status) {
    const current = await prisma.submission.findMany({
        where: { id: { in: ids } },
        select: { id: true, status: true, email: true, name: true, productName: true },
    });
    const changing = current.filter((s) => s.status !== status);
    if (changing.length === 0) return 0;

    await prisma.$transaction([
        prisma.submission.updateMany({ where: { id: { in: changing.map((s) => s.id) } }, data: { status } }),
        ...changing.map((s) =>
            prisma.statusEvent.create({
                data: { submissionId: s.id, fromStatus: s.status, toStatus: status },
            })
        ),
    ]);

    if (status === "approved" || status === "rejected") {
        await Promise.allSettled(changing.map((s) => sendEmail(decisionEmail(s, status))));
    }
    return changing.length;
}

// ── The emails vendors get when a decision is made ──────────────────────────

function decisionEmail(s: { email: string; name: string; productName: string }, status: "approved" | "rejected") {
    const name = escapeHtml(s.name.trim());
    const product = escapeHtml(s.productName.trim());
    const body = status === "approved"
        ? `<p>Your product <strong>${product}</strong> has been approved for the next step in our distribution review process. We will contact you soon.</p>`
        : `<p>Thank you for submitting <strong>${product}</strong>. After reviewing it, we are not moving forward with this product at this time.</p>`;

    return {
        to: s.email,
        subject: status === "approved"
            ? "Your product submission has been approved"
            : "Update on your product submission",
        html: `<div style="font-family:Arial,sans-serif;color:#111;line-height:1.6;max-width:600px"><h2>${site.name}</h2><p>Hi ${name},</p>${body}<br/><p>Best regards,<br/>${site.name}</p></div>`,
    };
}

function escapeHtml(text: string) {
    return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
