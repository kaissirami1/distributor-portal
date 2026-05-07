import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
    const { id, status } = (await req.json()) as { id: number; status: string };

    if (!id || !status) {
        return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }

    const current = await prisma.submission.findUnique({
        where: { id },
        select: { status: true, email: true, name: true, productName: true },
    });

    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (current.status === status) return NextResponse.json({ ok: true, unchanged: true });

    await prisma.$transaction([
        prisma.submission.update({ where: { id }, data: { status } }),
        prisma.statusEvent.create({
            data: { submissionId: id, fromStatus: current.status, toStatus: status },
        }),
    ]);

    if (status === "approved" || status === "rejected") {
        await resend.emails.send({
            from: "Makram Distributions <onboarding@resend.dev>",
            to: current.email,
            subject: status === "approved"
                ? "Your product submission has been approved"
                : "Update on your product submission",
            html: status === "approved"
                ? `<div style="font-family:Arial,sans-serif;color:#111;line-height:1.6;max-width:600px"><h2>Makram Distributions</h2><p>Hi ${current.name},</p><p>Your product <strong>${current.productName}</strong> has been approved for the next step in our distribution review process. We will contact you soon.</p><br/><p>Best regards,<br/>Makram Distributions</p></div>`
                : `<div style="font-family:Arial,sans-serif;color:#111;line-height:1.6;max-width:600px"><h2>Makram Distributions</h2><p>Hi ${current.name},</p><p>Thank you for submitting <strong>${current.productName}</strong>. After reviewing, we are not moving forward with this product at this time.</p><br/><p>Best regards,<br/>Makram Distributions</p></div>`,
        });
    }

    return NextResponse.json({ ok: true });
}