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
