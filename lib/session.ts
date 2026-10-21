// ─────────────────────────────────────────────────────────────────────────────
// Admin accounts and login sessions.
//
// Accounts are set in the ADMIN_ACCOUNTS setting (in .env on your Mac, and in
// Vercel → Settings → Environment Variables for the live site), like this:
//     ADMIN_ACCOUNTS="Rami:password1,mazen:password2"
// Usernames and passwords can't contain ":" or ",".
// (If ADMIN_ACCOUNTS isn't set, the older ADMIN_USERNAME / ADMIN_PASSWORD pair is used.)
//
// After a correct login, the browser gets a cookie holding the username, an
// expiry time, and a signature made from the account passwords. Nobody can fake
// it without knowing the passwords, and changing any password logs everyone out.
// ─────────────────────────────────────────────────────────────────────────────

export const SESSION_COOKIE = "admin-session";
export const SESSION_DAYS = 7;

type Account = { username: string; password: string };

function accounts(): Account[] {
    const list = process.env.ADMIN_ACCOUNTS;
    if (list) {
        return list
            .split(",")
            .map((entry) => {
                const i = entry.indexOf(":");
                return { username: entry.slice(0, i).trim(), password: entry.slice(i + 1).trim() };
            })
            .filter((a) => a.username && a.password);
    }
    const { ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;
    return ADMIN_USERNAME && ADMIN_PASSWORD ? [{ username: ADMIN_USERNAME, password: ADMIN_PASSWORD }] : [];
}

// Compares every character so a wrong guess takes the same time as a right one
function sameText(a: string, b: string) {
    let diff = a.length ^ b.length;
    for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    return diff === 0;
}

// Returns the account's username if the username and password are right
export function checkLogin(username: string, password: string) {
    const account = accounts().find((a) => a.username.toLowerCase() === username.trim().toLowerCase());
    return account && sameText(account.password, password) ? account.username : null;
}

async function sign(value: string) {
    const secret = accounts().map((a) => `${a.username}:${a.password}`).join("|");
    if (!secret) throw new Error("No admin accounts are set (ADMIN_ACCOUNTS)");
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

export async function createSessionToken(username: string) {
    const payload = `${Buffer.from(username).toString("base64url")}.${Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000}`;
    return `${payload}.${await sign(payload)}`;
}

// The logged-in admin's username, or null if the cookie is missing, expired or fake
export async function sessionUser(token: string | undefined) {
    if (!token || accounts().length === 0) return null;
    const [user, expires, signature] = token.split(".");
    if (!user || !expires || !signature || Number(expires) < Date.now()) return null;
    if (!sameText(await sign(`${user}.${expires}`), signature)) return null;

    const username = Buffer.from(user, "base64url").toString();
    // An account that was removed can't keep using an old cookie
    return accounts().some((a) => a.username === username) ? username : null;
}

export async function isValidSessionToken(token: string | undefined) {
    return (await sessionUser(token)) !== null;
}
