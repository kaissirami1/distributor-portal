import { getLinkPreview } from "@/lib/linkPreview";
import { LinkIcon } from "./icons";

// A preview of a website a vendor linked to, so you can see where it goes before clicking.
// Wrap it in <Suspense fallback={<LinkPreviewLoading url={...} />}> so the page doesn't wait for it.
export async function LinkPreviewCard({ url }: { url: string }) {
    const p = await getLinkPreview(url);

    const address = (
        <p className={`text-sm flex items-center gap-1.5 break-all ${p.secure ? "text-zinc-300" : "text-amber-300"}`}>
            <span aria-hidden="true">{p.secure ? "🔒" : "⚠️"}</span>
            <span>{p.secure ? p.url.replace(/^https:\/\//, "") : `Not secure: ${p.url}`}</span>
        </p>
    );

    return (
        <div className="border border-zinc-800 rounded-xl overflow-hidden bg-black/30">
            {p.image && !p.error && (
                // The preview image comes from their website, shown without telling it where you came from
                <img src={p.image} alt="" referrerPolicy="no-referrer" className="w-full max-h-56 object-cover border-b border-zinc-800" />
            )}
            <div className="p-4 space-y-2">
                {p.error ? (
                    <p className="text-sm text-zinc-400">No preview available. {p.error}</p>
                ) : (
                    <>
                        {p.siteName && <p className="text-xs uppercase tracking-wide text-zinc-500">{p.siteName}</p>}
                        <p className="font-semibold">{p.title || p.host}</p>
                        {p.description && <p className="text-sm text-zinc-400 line-clamp-3">{p.description}</p>}
                    </>
                )}
                {address}
                <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 rounded-lg text-sm font-semibold border border-zinc-700 text-zinc-200 hover:border-zinc-500"
                >
                    <LinkIcon className="w-4 h-4" /> Open website
                </a>
            </div>
        </div>
    );
}

export function LinkPreviewLoading({ url }: { url: string }) {
    return (
        <div className="border border-zinc-800 rounded-xl p-4 bg-black/30 animate-pulse">
            <p className="text-sm text-zinc-500">Loading a preview of {url.replace(/^https?:\/\//, "")}…</p>
        </div>
    );
}
