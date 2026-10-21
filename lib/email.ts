import { Resend } from "resend";
import { site } from "./site";

const resend = new Resend(process.env.RESEND_API_KEY);

// Emails come from, and admin notifications go to, the address in lib/site.ts
export const FROM_ADDRESS = `${site.name} <${site.email}>`;
export const ADMIN_EMAIL = site.email;

type Email = {
    to: string;
    subject: string;
    html: string;
};

// Outside production, emails never reach real vendors or retailers: they go to
// DEV_EMAIL_TO when it is set, and are only logged to the terminal otherwise.
export async function sendEmail({ to, subject, html }: Email) {
    if (process.env.NODE_ENV !== "production") {
        const devTo = process.env.DEV_EMAIL_TO;
        if (!devTo) {
            console.log(`[dev] email not sent — to: ${to} | subject: ${subject}`);
            return;
        }
        return resend.emails.send({
            from: FROM_ADDRESS,
            to: devTo,
            subject: `[DEV → ${to}] ${subject}`,
            html,
        });
    }

    return resend.emails.send({ from: FROM_ADDRESS, to, subject, html });
}

// The dark header with the gold line, same as the submission confirmation email
export function brandedEmail(label: string, content: string) {
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

// Makes text safe to put inside an email (so a name like <b> can't change the layout)
export function escapeHtml(text: string) {
    return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
