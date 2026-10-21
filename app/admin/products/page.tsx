import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { SafeImage } from "@/components/admin/SafeImage";
import { AdminLink, EmptyState, PageHeader } from "@/components/admin/ui";
import { CheckIcon, PlusIcon, SearchIcon } from "@/components/admin/icons";
import { formatDate } from "@/lib/dates";

export const metadata = { title: "Products" };

type PageProps = {
    searchParams: Promise<{ q?: string; origin?: string; saved?: string; deleted?: string }>;
};

export default async function AdminProductsPage({ searchParams }: PageProps) {
    await requireAdmin();
    const { q, origin, saved, deleted } = await searchParams;
    const searchQuery = q?.trim() || "";
    const originFilter = origin || "all";

    const [products, allOrigins, total] = await Promise.all([
        prisma.product.findMany({
            where: {
                AND: [
                    originFilter !== "all" ? { origin: originFilter } : {},
                    searchQuery
                        ? {
                            OR: [
                                { name: { contains: searchQuery, mode: "insensitive" } },
                                { description: { contains: searchQuery, mode: "insensitive" } },
                                { origin: { contains: searchQuery, mode: "insensitive" } },
                            ],
                        }
                        : {},
                ],
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.product.findMany({ select: { origin: true }, distinct: ["origin"], orderBy: { origin: "asc" } }),
        prisma.product.count(),
    ]);

    const originHref = (o: string) => {
        const params = new URLSearchParams();
        if (o !== "all") params.set("origin", o);
        if (searchQuery) params.set("q", searchQuery);
        const query = params.toString();
        return `/admin/products${query ? `?${query}` : ""}`;
    };

    return (
        <div>
            <PageHeader
                title="Products"
                description={`${total} product${total === 1 ? "" : "s"} in your catalog. They show on your website's products page, newest first.`}
                actions={
                    <>
                        <AdminLink href="/products" newTab>View on website</AdminLink>
                        <AdminLink href="/admin/products/new" variant="primary"><PlusIcon className="w-4 h-4" /> Add product</AdminLink>
                    </>
                }
            />

            {(saved || deleted) && (
                <p role="status" className="mb-6 flex items-center gap-2 rounded-lg border border-green-900 bg-green-950/40 px-4 py-3 text-sm text-green-300">
                    <CheckIcon className="w-4 h-4" />
                    {saved ? `Saved "${saved}". Your website is updated.` : `Deleted "${deleted}".`}
                </p>
            )}

            {/* Search and origin filter */}
            <form action="/admin/products" method="GET" className="flex gap-2 mb-3">
                {originFilter !== "all" && <input type="hidden" name="origin" value={originFilter} />}
                <label className="flex-1 flex items-center gap-2 bg-black border border-zinc-700 rounded-lg px-3 focus-within:border-zinc-500">
                    <SearchIcon className="w-4 h-4 text-zinc-500" />
                    <input name="q" defaultValue={searchQuery} placeholder="Search products" aria-label="Search products" className="flex-1 bg-transparent py-2 text-sm focus:outline-none" />
                </label>
                <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold bg-white text-black hover:bg-zinc-200">Search</button>
            </form>
            {allOrigins.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-6">
                    {["all", ...allOrigins.map((o) => o.origin)].map((o) => (
                        <Link
                            key={o}
                            href={originHref(o)}
                            className={`px-3 py-1 rounded-full text-sm border transition ${originFilter === o ? "bg-white text-black border-white font-semibold" : "border-zinc-700 text-zinc-300 hover:border-zinc-500"}`}
                        >
                            {o === "all" ? "All" : o}
                        </Link>
                    ))}
                </div>
            )}

            {products.length === 0 ? (
                <EmptyState
                    title={total === 0 ? "No products yet" : "No products match"}
                    text={total === 0 ? "Add your first product and it will appear on your website." : "Try a different search or filter."}
                    action={total === 0 && <AdminLink href="/admin/products/new" variant="primary"><PlusIcon className="w-4 h-4" /> Add product</AdminLink>}
                />
            ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {products.map((p) => (
                        <Link
                            key={p.id}
                            href={`/admin/products/${p.id}`}
                            className="group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 transition flex flex-col"
                        >
                            <SafeImage src={p.image} alt={p.name} className="w-full aspect-[4/3]" />
                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="font-semibold group-hover:underline">{p.name}</p>
                                    <span className="text-xs text-amber-200/80 border border-amber-200/20 rounded-full px-2 py-0.5 shrink-0">{p.origin}</span>
                                </div>
                                <p className="text-sm text-zinc-400 mt-1.5 line-clamp-2 flex-1">{p.description}</p>
                                <p className="text-xs text-zinc-500 mt-3">Added {formatDate(p.createdAt)} · Click to edit</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
