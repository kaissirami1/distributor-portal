import dns from "node:dns/promises";
import net from "node:net";

// ─────────────────────────────────────────────────────────────────────────────
// Website previews for links vendors send us (title, description, image).
// The page is fetched by our server, never by your browser, and only public
// websites are allowed: links pointing at private or internal network addresses
// are refused, so a vendor can't use a link to poke at systems behind our host.
// ─────────────────────────────────────────────────────────────────────────────

export type LinkPreview = {
    url: string;          // where the link finally led
    host: string;         // e.g. gloriasshito.com
    secure: boolean;      // https
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
    error?: string;       // why there's no preview, in plain words
};

const MAX_REDIRECTS = 3;
const MAX_BYTES = 600_000;
const TIMEOUT_MS = 6000;

function isPrivateAddress(ip: string) {
    if (net.isIPv4(ip)) {
        const [a, b] = ip.split(".").map(Number);
        return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
            || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
    }
    const v6 = ip.toLowerCase();
    if (v6.startsWith("::ffff:")) return isPrivateAddress(v6.slice(7));
    return v6 === "::1" || v6 === "::" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80");
}

async function isPublicHost(hostname: string) {
    if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".internal")) return false;
    const addresses = net.isIP(hostname) ? [{ address: hostname }] : await dns.lookup(hostname, { all: true });
    return addresses.length > 0 && addresses.every((a) => !isPrivateAddress(a.address));
}

// Reads at most MAX_BYTES of the page, which is plenty to reach the <head>
async function readStart(res: Response) {
    const reader = res.body?.getReader();
    if (!reader) return "";
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (size < MAX_BYTES) {
        const { done, value } = await reader.read();
        if (done || !value) break;
        chunks.push(value);
        size += value.length;
    }
    reader.cancel().catch(() => { });
    return new TextDecoder().decode(Buffer.concat(chunks));
}

function decode(text: string) {
    return text
        .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
        .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
        .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim();
}

function readMeta(html: string) {
    const meta: Record<string, string> = {};
    for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
        const attrs: Record<string, string> = {};
        for (const m of tag.matchAll(/([a-zA-Z:_-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) {
            attrs[m[1].toLowerCase()] = m[3] ?? m[4] ?? "";
        }
        const key = (attrs.property || attrs.name || "").toLowerCase();
        if (key && attrs.content && !(key in meta)) meta[key] = decode(attrs.content);
    }
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
    return { meta, title: title ? decode(title) : undefined };
}

export async function getLinkPreview(raw: string): Promise<LinkPreview> {
    let url: URL;
    try {
        url = new URL(/^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`);
    } catch {
        return { url: raw, host: raw, secure: false, error: "This isn't a valid web address." };
    }
    const base = () => ({ url: url.toString(), host: url.hostname.replace(/^www\./, ""), secure: url.protocol === "https:" });
    if (url.protocol !== "http:" && url.protocol !== "https:") return { ...base(), error: "This isn't a normal website link." };

    try {
        let res: Response | null = null;
        for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
            if (!(await isPublicHost(url.hostname))) {
                return { ...base(), error: "This link points to a private network address, so it wasn't opened." };
            }
            res = await fetch(url, {
                redirect: "manual",
                signal: AbortSignal.timeout(TIMEOUT_MS),
                headers: {
                    "user-agent": "Mozilla/5.0 (compatible; MakramDistributionsLinkPreview/1.0)",
                    accept: "text/html,application/xhtml+xml",
                },
                next: { revalidate: 60 * 60 * 24 }, // remember a preview for a day
            });
            const next = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
            if (!next) break;
            url = new URL(next, url);
            if (hop === MAX_REDIRECTS) return { ...base(), error: "This link redirects too many times." };
        }

        if (!res || !res.ok) return { ...base(), error: `The website didn't load (error ${res?.status ?? "unknown"}).` };
        if (!(res.headers.get("content-type") ?? "").includes("html")) {
            return { ...base(), error: "This link opens a file, not a web page." };
        }

        const { meta, title } = readMeta(await readStart(res));
        const image = meta["og:image"] || meta["og:image:url"] || meta["twitter:image"];
        let imageUrl: string | undefined;
        try {
            const resolved = image ? new URL(image, url) : null;
            if (resolved && (resolved.protocol === "https:" || resolved.protocol === "http:")) imageUrl = resolved.toString();
        } catch { }

        return {
            ...base(),
            title: (meta["og:title"] || meta["twitter:title"] || title)?.slice(0, 200),
            description: (meta["og:description"] || meta["description"] || meta["twitter:description"])?.slice(0, 400),
            siteName: meta["og:site_name"]?.slice(0, 100),
            image: imageUrl,
        };
    } catch (err) {
        const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
        return { ...base(), error: timedOut ? "The website took too long to answer." : "The website couldn't be reached." };
    }
}
