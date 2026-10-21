// ─────────────────────────────────────────────────────────────────────────────
// Admin login sessions.
// After a correct login, the browser gets a cookie holding an expiry time plus a
// signature made with the admin password. Nobody can fake that cookie without
// knowing the password, and changing ADMIN_PASSWORD logs everyone out.
// ─────────────────────────────────────────────────────────────────────────────

export const SESSION_COOKIE = "admin-session";
export const SESSION_DAYS = 7;

async function sign(value: string) {
    const secret = process.env.ADMIN_PASSWORD;
    if (!secret) throw new Error("ADMIN_PASSWORD is not set");
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(`makram-admin-session:${secret}`),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
    return Buffer.from(signature).toString("base64url");
}

export async function createSessionToken() {
    const expires = String(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
    return `${expires}.${await sign(expires)}`;
}

export async function isValidSessionToken(token: string | undefined) {
    if (!token || !process.env.ADMIN_PASSWORD) return false;
    const [expires, signature] = token.split(".");
    if (!expires || !signature || Number(expires) < Date.now()) return false;

    const expected = await sign(expires);
    // Compare every character so the check takes the same time either way
    if (expected.length !== signature.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    return diff === 0;
}
