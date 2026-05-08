import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function generateTrackingId(): Promise<string> {
  const count = await prisma.submission.count();
  return `MKR-${String(count + 1).padStart(5, "0")}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    name, email, phone, companyName, productName,
    category, minimumOrder, productUrl, city, county,
    notes, imageUrl, documentsUrl, barcode,
  } = body;

  if (!name || !email || !productName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const trackingId = await generateTrackingId();

  // Save to database
  await prisma.submission.create({
    data: {
      name, email, phone, companyName, productName,
      category, minimumOrder, productUrl, city, county,
      notes, imageUrl, documentsUrl, barcode, trackingId,
    },
  });

  // Send customer confirmation email
  try {
    await resend.emails.send({
      from: "Makram Distributions <info@makramdistributions.com>",
      to: email,
      subject: "Product Submission Received",
      html: `
        <div style="background:#0a0907;padding:32px;font-family:Arial,sans-serif;color:#111;">
          <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e8dcc0;">
            <div style="background:#1a140a;padding:26px 30px;border-bottom:4px solid #d6b25e;">
              <h1 style="margin:0;color:#f5e6b8;font-size:24px;">Makram Distributions</h1>
              <p style="margin:6px 0 0;color:#d7c59a;font-size:13px;letter-spacing:1px;text-transform:uppercase;">
                Product Submission Received
              </p>
            </div>
            <div style="padding:30px;">
              <h2 style="margin:0 0 16px;color:#111;font-size:22px;">Thank you for your submission</h2>
              <p style="font-size:15px;line-height:1.7;margin:0 0 16px;">Hi ${name},</p>
              <p style="font-size:15px;line-height:1.7;margin:0 0 16px;">
                We received your product submission for <strong>${productName}</strong>.
                Our team will review the information, supporting files, and distribution fit.
              </p>
              <div style="background:#f8f4ea;border:1px solid #eadfca;border-radius:12px;padding:18px;margin:22px 0;">
                <p style="margin:0 0 8px;font-size:14px;"><strong>Product:</strong> ${productName}</p>
                <p style="margin:0 0 8px;font-size:14px;"><strong>Company:</strong> ${companyName || "-"}</p>
                <p style="margin:0 0 8px;font-size:14px;"><strong>Category:</strong> ${category || "-"}</p>
                <p style="margin:0;font-size:14px;"><strong>Tracking ID:</strong> ${trackingId}</p>
              </div>
              <p style="font-size:15px;line-height:1.7;margin:0 0 16px;">
                You can check your submission status at any time using your tracking ID:
              </p>
              <a 
                href="https://makramdistributions.com/track?email=${encodeURIComponent(email)}&trackingId=${trackingId}"
                style="display:inline-block;background:#d6b25e;color:#000;padding:12px 24px;border-radius:8px;font-weight:600;text-decoration:none;font-size:14px;margin-bottom:16px;"
              >
                Track My Submission
              </a>
              <p style="font-size:13px;color:#777;margin:0 0 16px;">
                Or visit makramdistributions.com/track and enter your email and tracking ID: <strong>${trackingId}</strong>
              </p>
              <p style="font-size:15px;line-height:1.7;margin:24px 0 0;">
                Best regards,<br/><strong>Makram Distributions</strong>
              </p>
            </div>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("Customer email error:", err);
  }

  // Send admin notification email
  try {
    await resend.emails.send({
      from: "Makram Distributions <info@makramdistributions.com>",
      to: "info@makramdistributions.com",
      subject: `New Submission: ${productName} (${trackingId})`,
      html: `
        <div style="background:#0a0907;padding:32px;font-family:Arial,sans-serif;color:#111;">
          <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e8dcc0;">
            <div style="background:#1a140a;padding:26px 30px;border-bottom:4px solid #d6b25e;">
              <h1 style="margin:0;color:#f5e6b8;font-size:24px;">New Product Submission</h1>
              <p style="margin:6px 0 0;color:#d7c59a;font-size:13px;letter-spacing:1px;text-transform:uppercase;">
                ${trackingId} — Makram Distributions
              </p>
            </div>
            <div style="padding:30px;">
              <div style="background:#f8f4ea;border:1px solid #eadfca;border-radius:12px;padding:18px;margin-bottom:20px;">
                <p style="margin:0 0 8px;"><strong>Name:</strong> ${name}</p>
                <p style="margin:0 0 8px;"><strong>Email:</strong> ${email}</p>
                <p style="margin:0 0 8px;"><strong>Phone:</strong> ${phone || "-"}</p>
                <p style="margin:0;"><strong>Company:</strong> ${companyName || "-"}</p>
              </div>
              <div style="background:#ffffff;border:1px solid #eadfca;border-radius:12px;padding:18px;margin-bottom:20px;">
                <p style="margin:0 0 8px;"><strong>Product:</strong> ${productName}</p>
                <p style="margin:0 0 8px;"><strong>Tracking ID:</strong> ${trackingId}</p>
                <p style="margin:0 0 8px;"><strong>Category:</strong> ${category || "-"}</p>
                <p style="margin:0 0 8px;"><strong>Minimum Order:</strong> ${minimumOrder || "-"}</p>
                <p style="margin:0 0 8px;"><strong>Product URL:</strong> ${productUrl || "-"}</p>
                <p style="margin:0 0 8px;"><strong>Image:</strong> ${imageUrl || "-"}</p>
                <p style="margin:0 0 8px;"><strong>Documents:</strong> ${documentsUrl || "-"}</p>
                <p style="margin:0;"><strong>Barcode:</strong> ${barcode || "-"}</p>
              </div>
              <div style="background:#ffffff;border:1px solid #eadfca;border-radius:12px;padding:18px;">
                <p style="margin:0 0 8px;"><strong>City:</strong> ${city || "-"}</p>
                <p style="margin:0 0 8px;"><strong>County:</strong> ${county || "-"}</p>
                <p style="margin:0;"><strong>Notes:</strong> ${notes || "-"}</p>
              </div>
            </div>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("Admin email error:", err);
  }

  return NextResponse.json({ ok: true });
}