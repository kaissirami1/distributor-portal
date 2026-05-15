import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { type, name, email, phone, company, storeName, location, productsInterested, message } = body;

    if (!name || !email || !message) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const isRetailer = type === "retailer";
    const subject = isRetailer
        ? `Retailer Inquiry: ${storeName || name}`
        : `General Inquiry: ${name}`;

    try {
        await resend.emails.send({
            from: "Makram Distributions <info@makramdistributions.com>",
            to: "info@makramdistributions.com",
            subject,
            html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;color:#111;">
          <div style="background:#1a140a;padding:24px 28px;border-bottom:4px solid #d6b25e;">
            <h2 style="margin:0;color:#f5e6b8;">${isRetailer ? "New Retailer Inquiry" : "New Contact Message"}</h2>
          </div>
          <div style="padding:28px;background:#fff;">
            <p><strong>Type:</strong> ${isRetailer ? "Retailer / Buyer" : "General Inquiry"}</p>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || "—"}</p>
            ${isRetailer ? `
            <p><strong>Store Name:</strong> ${storeName || "—"}</p>
            <p><strong>Location:</strong> ${location || "—"}</p>
            <p><strong>Products Interested In:</strong> ${productsInterested || "—"}</p>
            ` : `
            <p><strong>Company:</strong> ${company || "—"}</p>
            `}
            <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
            <p><strong>Message:</strong></p>
            <p style="white-space:pre-wrap;">${message}</p>
          </div>
        </div>
      `,
        });

        // Send confirmation to the sender
        await resend.emails.send({
            from: "Makram Distributions <info@makramdistributions.com>",
            to: email,
            subject: "We received your message — Makram Distributions",
            html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;color:#111;">
          <div style="background:#1a140a;padding:24px 28px;border-bottom:4px solid #d6b25e;">
            <h2 style="margin:0;color:#f5e6b8;">Makram Distributions</h2>
          </div>
          <div style="padding:28px;background:#fff;">
            <p>Hi ${name},</p>
            <p>Thank you for reaching out. We received your message and will get back to you within 1-2 business days.</p>
            ${isRetailer ? "<p>We look forward to discussing how we can supply your store with quality products.</p>" : ""}
            <br/>
            <p>Best regards,<br/><strong>Makram Distributions</strong></p>
          </div>
        </div>
      `,
        });

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("Contact email error:", err);
        return NextResponse.json({ error: "Failed to send" }, { status: 500 });
    }
}