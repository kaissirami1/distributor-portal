"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { requireAdmin } from "./auth";
import { ADMIN_EMAIL, brandedEmail, escapeHtml, sendEmail } from "./email";
import { DOCUMENT_TYPES, MAX_DOCUMENT_MB, documentType } from "./documents";
import { trackingLink } from "./submissions";
import { site } from "./site";

export type DocumentInput = { type: string; url?: string; fileName?: string; value?: string };
export type SaveResult = { ok: true } | { ok: false; error: string };

// Only accept files that were uploaded through our own upload button (Cloudinary)
function clean(input: DocumentInput) {
    const type = documentType(input.type);
    const url = input.url?.trim() || null;
    const value = input.value?.trim().slice(0, 200) || null;
    const fileName = input.fileName?.trim().slice(0, 200) || null;
    if (!type) return null;
    if (url && !url.startsWith("https://res.cloudinary.com/")) return null;
    if (!url && !value) return null;
    return { type: type.key, url, value, fileName };
}

function refresh(submissionId: number) {
    revalidatePath(`/admin/submissions/${submissionId}`);
    revalidatePath("/track");
}

// ── Sellers (from their tracking page, identified by email + tracking ID) ──

export async function sellerSaveDocument(email: string, trackingId: string, input: DocumentInput): Promise<SaveResult> {
    const data = clean(input);
    if (!data) return { ok: false, error: "That upload didn't work. Please try again." };

    const submission = await prisma.submission.findFirst({
        where: {
            email: { equals: email.trim(), mode: "insensitive" },
            trackingId: { equals: trackingId.trim(), mode: "insensitive" },
        },
        select: { id: true, productName: true, companyName: true, name: true },
    });
    if (!submission) return { ok: false, error: "We couldn't find your submission. Please check your link." };

    await prisma.document.create({ data: { ...data, submissionId: submission.id, uploadedBy: "seller" } });

    // Let us know something arrived
    const label = documentType(data.type)!.label;
    const who = escapeHtml(submission.companyName || submission.name);
    await sendEmail({
        to: ADMIN_EMAIL,
        subject: `${submission.companyName || submission.name} sent: ${label}`,
        html: brandedEmail("Document Received", `
            <p style="font-size:15px;line-height:1.7;margin:0 0 16px;"><strong>${who}</strong> uploaded their <strong>${escapeHtml(label.toLowerCase())}</strong> for <strong>${escapeHtml(submission.productName)}</strong>.</p>
            <a href="${site.url}/admin/submissions/${submission.id}" style="display:inline-block;background:#d6b25e;color:#000;padding:12px 24px;border-radius:8px;font-weight:600;text-decoration:none;font-size:14px;">Open in admin</a>
        `),
    }).catch((err) => console.error("Document notification email error:", err));

    refresh(submission.id);
    return { ok: true };
}

// ── Admin ───────────────────────────────────────────────────────────────────

// For when a seller emails a document and we upload it ourselves
export async function adminSaveDocument(submissionId: number, input: DocumentInput): Promise<SaveResult> {
    const admin = await requireAdmin();
    const data = clean(input);
    if (!data) return { ok: false, error: "That upload didn't work. Please try again." };
    await prisma.document.create({ data: { ...data, submissionId, uploadedBy: admin } });
    refresh(submissionId);
    return { ok: true };
}

export async function adminDeleteDocument(formData: FormData) {
    await requireAdmin();
    const doc = await prisma.document.delete({ where: { id: Number(formData.get("documentId")) } });
    refresh(doc.submissionId);
}

// Emails the seller their personal upload link and what's still missing
export async function requestDocuments(formData: FormData) {
    const admin = await requireAdmin();
    const submissionId = Number(formData.get("submissionId"));
    const s = await prisma.submission.findUnique({
        where: { id: submissionId },
        select: { id: true, name: true, email: true, productName: true, trackingId: true, documents: { select: { type: true } } },
    });
    if (!s) return;

    const have = new Set(s.documents.map((d) => d.type));
    const missing = DOCUMENT_TYPES.filter((t) => !have.has(t.key));
    const firstName = escapeHtml(s.name.trim().split(/\s+/)[0] || "there");
    const product = escapeHtml(s.productName.trim());
    const items = (missing.length ? missing : DOCUMENT_TYPES)
        .map((t) => `<li style="margin-bottom:8px;"><strong>${escapeHtml(t.label)}</strong><br/><span style="color:#555;">${escapeHtml(t.hint)}</span></li>`)
        .join("");

    await sendEmail({
        to: s.email,
        subject: `Documents needed for ${s.productName.trim()}`,
        html: brandedEmail("Documents Needed", `
            <h2 style="margin:0 0 16px;color:#111;font-size:22px;">Documents for ${product}</h2>
            <p style="font-size:15px;line-height:1.7;margin:0 0 16px;">Hi ${firstName},</p>
            <p style="font-size:15px;line-height:1.7;margin:0 0 16px;">To move forward with <strong>${product}</strong>, please upload the following on your submission page:</p>
            <div style="background:#f8f4ea;border:1px solid #eadfca;border-radius:12px;padding:18px 22px;margin:22px 0;">
                <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.6;">${items}</ul>
            </div>
            <a href="${trackingLink(s.email, s.trackingId)}#documents" style="display:inline-block;background:#d6b25e;color:#000;padding:12px 24px;border-radius:8px;font-weight:600;text-decoration:none;font-size:14px;margin:4px 0 20px;">Upload Documents</a>
            <p style="font-size:13px;color:#777;margin:0 0 16px;">Files can be PDFs or photos, up to ${MAX_DOCUMENT_MB} MB each. You can also reply to this email with them, or call us at ${site.phone}.</p>
            <p style="font-size:15px;line-height:1.7;margin:0;">Best regards,<br/><strong>${site.name}</strong></p>
        `),
    });

    await prisma.reviewNote.create({
        data: { submissionId, author: admin, content: `Requested documents by email (${missing.length || DOCUMENT_TYPES.length} item${(missing.length || DOCUMENT_TYPES.length) === 1 ? "" : "s"}).` },
    });
    refresh(submissionId);
}
