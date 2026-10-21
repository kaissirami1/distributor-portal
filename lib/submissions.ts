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
        select: { id: true, status: true, email: true, name: true, productName: true, trackingId: true },
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

type Vendor = { email: string; name: string; productName: string; trackingId: string | null };

export function decisionEmail(s: Vendor, status: "approved" | "rejected") {
    const firstName = escapeHtml(s.name.trim().split(/\s+/)[0] || "there");
    const product = escapeHtml(s.productName.trim());
    const p = (text: string) => `<p style="font-size:15px;line-height:1.7;margin:0 0 16px;">${text}</p>`;

    if (status === "approved") {
        const trackUrl = s.trackingId
            ? `${site.url}/track?email=${encodeURIComponent(s.email)}&trackingId=${encodeURIComponent(s.trackingId)}`
            : `${site.url}/track`;
        return {
            to: s.email,
            subject: `Good news: ${s.productName.trim()} is approved`,
            html: brandedEmail("Submission Approved", `
                <h2 style="margin:0 0 16px;color:#111;font-size:22px;">Good news: ${product} is approved</h2>
                ${p(`Hi ${firstName},`)}
                ${p(`Thank you for submitting <strong>${product}</strong>. Our team has reviewed it, and we'd like to move forward with the next steps toward distribution in California.`)}
                <div style="background:#f8f4ea;border:1px solid #eadfca;border-radius:12px;padding:18px 22px;margin:22px 0;">
                    <p style="margin:0 0 10px;font-size:15px;"><strong>What happens next</strong></p>
                    <ol style="margin:0;padding-left:20px;font-size:14px;line-height:1.7;">
                        <li style="margin-bottom:8px;">We'll reach out within a few business days to go over wholesale pricing, case sizes, and minimum orders.</li>
                        <li style="margin-bottom:8px;">We'll ask for product samples and a few documents: your food license, FDA facility registration, and certificate of product liability insurance.</li>
                        <li>Once everything is in place, we'll start introducing ${product} to retailers across California.</li>
                    </ol>
                </div>
                ${p(`To speed things up, you can reply to this email with your wholesale price list and those documents.`)}
                <a href="${trackUrl}" style="display:inline-block;background:#d6b25e;color:#000;padding:12px 24px;border-radius:8px;font-weight:600;text-decoration:none;font-size:14px;margin:4px 0 20px;">View My Submission</a>
                <p style="font-size:13px;color:#777;margin:0 0 16px;">Questions? Reply to this email or call us at ${site.phone}.</p>
                ${p(`Best regards,<br/><strong>${site.name}</strong>`)}
            `),
        };
    }

    return {
        to: s.email,
        subject: `An update on ${s.productName.trim()}`,
        html: brandedEmail("Submission Update", `
            <h2 style="margin:0 0 16px;color:#111;font-size:22px;">An update on ${product}</h2>
            ${p(`Hi ${firstName},`)}
            ${p(`Thank you for submitting <strong>${product}</strong> and for your interest in working with ${site.name}. After careful review, we're not able to move forward with it at this time.`)}
            ${p(`This often comes down to fit with the stores and markets we serve right now, not the quality of the product. You're welcome to submit other products in the future.`)}
            ${p(`Best regards,<br/><strong>${site.name}</strong>`)}
        `),
    };
}

// The dark header with the gold line, same as the submission confirmation email
function brandedEmail(label: string, content: string) {
    return `
        <div style="background:#0a0907;padding:32px;font-family:Arial,sans-serif;color:#111;">
            <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e8dcc0;">
                <div style="background:#1a140a;padding:26px 30px;border-bottom:4px solid #d6b25e;">
                    <h1 style="margin:0;color:#f5e6b8;font-size:24px;">${site.name}</h1>
                    <p style="margin:6px 0 0;color:#d7c59a;font-size:13px;letter-spacing:1px;text-transform:uppercase;">${label}</p>
                </div>
                <div style="padding:30px;">${content}</div>
            </div>
        </div>
    `;
}

function escapeHtml(text: string) {
    return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
