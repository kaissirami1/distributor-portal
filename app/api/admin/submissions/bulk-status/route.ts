import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
    const { ids, status } = (await req.json()) as { ids: number[]; status: string };

    if (!ids?.length || !status) {
        return NextResponse.json({ error: "Missing ids or status" }, { status: 400 });
    }

    const current = await prisma.submission.findMany({
        where: { id: { in: ids } },
        select: { id: true, status: true, email: true, name: true, productName: true },
    });

    const changing = current.filter((s) => s.status !== status);

    await prisma.$transaction([
        prisma.submission.updateMany({ where: { id: { in: ids } }, data: { status } }),
        ...changing.map((s) =>
            prisma.statusEvent.create({
                data: { submissionId: s.id, fromStatus: s.status, toStatus: status },
            })
        ),
    ]);

    if (status === "approved" || status === "rejected") {
        await Promise.allSettled(
            changing.map((s) =>
                resend.emails.send({
                    from: "Makram Distributions <onboarding@resend.dev>",
                    to: s.email,
                    subject: status === "approved"
                        ? "Your product submission has been approved"
                        : "Update on your product submission",
                    html: status === "approved"
                        ? `<div style="font-family:Arial,sans-serif;color:#111;line-height:1.6;max-width:600px"><h2>Makram Distributions</h2><p>Hi ${s.name},</p><p>Your product <strong>${s.productName}</strong> has been approved. We will contact you soon.</p><br/><p>Best regards,<br/>Makram Distributions</p></div>`
                        : `<div style="font-family:Arial,sans-serif;color:#111;line-height:1.6;max-width:600px"><h2>Makram Distributions</h2><p>Hi ${s.name},</p><p>Thank you for submitting <strong>${s.productName}</strong>. We are not moving forward at this time.</p><br/><p>Best regards,<br/>Makram Distributions</p></div>`,
                })
            )
        );
    }

    return NextResponse.json({ ok: true, updated: ids.length });
}