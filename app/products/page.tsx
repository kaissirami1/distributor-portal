import { prisma } from "../../lib/prisma";
import Link from "next/link";

type PageProps = {
    searchParams: Promise<{
        q?: string;
        origin?: string;
        sort?: string;
    }>;
};

export const metadata = {
    title: "Our Products | Makram Distributions",
};

export default async function ProductsPage({ searchParams }: PageProps) {
    const { q, origin, sort } = await searchParams;

    const searchQuery = q || "";
    const originFilter = origin || "all";
    const sortOrder = sort || "newest";

    const allProducts = await prisma.product.findMany({
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
        orderBy: sortOrder === "alphabetical" ? { name: "asc" } : { createdAt: "desc" },
    });

    const allOrigins = await prisma.product.findMany({
        select: { origin: true },
        distinct: ["origin"],
        orderBy: { origin: "asc" },
    });

    const origins = allOrigins.map((p) => p.origin);

    return (
        <main className="min-h-screen text-white bg-[radial-gradient(circle_at_top_left,#7a5a2a_0%,#2a2112_28%,#090806_65%,#000_100%)]">
            {/* Header */}
            <section className="px-6 py-24 text-center">
                <div className="max-w-4xl mx-auto">
                    <p className="text-sm uppercase tracking-[0.45em] text-amber-300/70 mb-4">
                        Our Products
                    </p>
                    <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
                        What We{" "}
                        <span className="text-amber-100/80">Distribute</span>
                    </h1>
                    <p className="text-stone-300 text-lg max-w-2xl mx-auto mb-8">
                        A curated selection of products we carry across California
                        markets. Sourced from around the world, built for retail
                        and wholesale.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <a
                            href="#products"
                            className="bg-amber-200 text-black px-8 py-3 rounded-full font-semibold hover:bg-amber-100 transition text-sm"
                        >
                            Browse Products
                        </a>
                        <a
                            href="mailto:info@makramdistributions.com"
                            className="border border-amber-200/30 px-8 py-3 rounded-full font-semibold hover:bg-amber-200/10 transition text-sm"
                        >
                            Contact Us to Order
                        </a>
                    </div>
                </div>
            </section>

            {/* How it works for retailers */}
            <section className="px-6 pb-16 border-t border-amber-200/10 pt-16">
                <div className="max-w-6xl mx-auto">
                    <p className="text-sm uppercase tracking-[0.35em] text-amber-300/70 mb-4 text-center">For Retailers</p>
                    <h2 className="text-3xl font-bold text-center mb-10">Interested in carrying one of our products?</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            ["01", "Browse", "Find a product below that fits your store or market."],
                            ["02", "Request", "Click 'Request this Product' and we'll get back to you."],
                            ["03", "Partner", "We handle logistics, pricing, and delivery to your location."],
                        ].map(([num, title, text]) => (
                            <div key={num} className="bg-white/[0.04] border border-amber-200/10 rounded-3xl p-6 text-center">
                                <p className="text-amber-300/60 text-sm mb-2">{num}</p>
                                <h3 className="font-semibold text-amber-100 mb-2">{title}</h3>
                                <p className="text-stone-400 text-sm">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Filters */}
            <section id="products" className="px-6 pb-6 pt-8 border-t border-amber-200/10">
                <div className="max-w-6xl mx-auto">
                    <form
                        action="/products"
                        method="GET"
                        className="flex flex-col md:flex-row gap-3 mb-6"
                    >
                        <input
                            name="q"
                            defaultValue={searchQuery}
                            placeholder="Search products..."
                            className="bg-black/40 border border-amber-200/20 rounded-full px-5 py-2.5 text-sm flex-1 placeholder:text-stone-500 focus:outline-none focus:border-amber-200/40"
                        />
                        <input type="hidden" name="origin" value={originFilter} />
                        <select
                            name="sort"
                            defaultValue={sortOrder}
                            className="bg-black/40 border border-amber-200/20 rounded-full px-5 py-2.5 text-sm text-stone-300 focus:outline-none focus:border-amber-200/40"
                        >
                            <option value="newest">Newest first</option>
                            <option value="alphabetical">A → Z</option>
                        </select>
                        <button
                            type="submit"
                            className="bg-amber-200 text-black px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-amber-100 transition"
                        >
                            Search
                        </button>
                        <Link
                            href="/products"
                            className="border border-amber-200/30 px-6 py-2.5 rounded-full text-sm text-stone-300 text-center hover:bg-amber-200/10 transition"
                        >
                            Reset
                        </Link>
                    </form>

                    {origins.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-8">
                            <Link
                                href={`/products?sort=${sortOrder}${searchQuery ? `&q=${searchQuery}` : ""}`}
                                className={`px-4 py-1.5 rounded-full text-sm border transition ${originFilter === "all"
                                        ? "bg-amber-200 text-black border-amber-200"
                                        : "border-amber-200/20 text-stone-400 hover:border-amber-200/40 hover:text-white"
                                    }`}
                            >
                                All
                            </Link>
                            {origins.map((o) => (
                                <Link
                                    key={o}
                                    href={`/products?origin=${encodeURIComponent(o)}&sort=${sortOrder}${searchQuery ? `&q=${searchQuery}` : ""}`}
                                    className={`px-4 py-1.5 rounded-full text-sm border transition ${originFilter === o
                                            ? "bg-amber-200 text-black border-amber-200"
                                            : "border-amber-200/20 text-stone-400 hover:border-amber-200/40 hover:text-white"
                                        }`}
                                >
                                    {o}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Products grid */}
            <section className="px-6 pb-24">
                <div className="max-w-6xl mx-auto">
                    {allProducts.length === 0 ? (
                        <div className="text-center py-20 text-stone-500">
                            <p className="text-xl mb-2">No products found.</p>
                            <Link href="/products" className="text-amber-300/70 underline text-sm">
                                Clear filters
                            </Link>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {allProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="bg-white/[0.04] border border-amber-200/10 rounded-3xl overflow-hidden hover:border-amber-200/25 transition group flex flex-col"
                                >
                                    {product.image ? (
                                        <div className="aspect-[4/3] overflow-hidden bg-black/40">
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                            />
                                        </div>
                                    ) : (
                                        <div className="aspect-[4/3] bg-black/40 flex items-center justify-center">
                                            <span className="text-stone-700 text-sm">No image</span>
                                        </div>
                                    )}
                                    <div className="p-5 flex flex-col flex-1">
                                        <span className="inline-block text-xs text-amber-300/70 border border-amber-300/20 rounded-full px-3 py-0.5 mb-3 self-start">
                                            {product.origin}
                                        </span>
                                        <h3 className="font-semibold text-lg text-amber-100 mb-2">
                                            {product.name}
                                        </h3>
                                        <p className="text-stone-400 text-sm leading-relaxed flex-1">
                                            {product.description}
                                        </p>
                                        <a
                                            href={`mailto:info@makramdistributions.com?subject=Product Request: ${encodeURIComponent(product.name)}&body=Hi Makram Distributions,%0A%0AI am interested in carrying ${encodeURIComponent(product.name)} in my store.%0A%0APlease send me more information about pricing and availability.%0A%0AThank you.`}
                                            className="mt-4 w-full text-center bg-amber-200/10 border border-amber-200/20 text-amber-200 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-200/20 transition"
                                        >
                                            Request this Product
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="px-6 py-20 border-t border-amber-200/10 text-center">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Don't see what you're looking for?</h2>
                    <p className="text-stone-400 mb-8">
                        We're always adding new products. Reach out and tell us what your store needs.
                    </p>
                    <a
                        href="mailto:info@makramdistributions.com"
                        className="bg-amber-200 text-black px-8 py-3 rounded-full font-semibold hover:bg-amber-100 transition"
                    >
                        Contact Us
                    </a>
                </div>
            </section>
        </main>
    );
}