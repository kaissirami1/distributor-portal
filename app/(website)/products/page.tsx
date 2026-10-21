import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";
import Link from "next/link";
import { Button, ButtonLink, PageHeader, Section } from "@/components/ui";
import { ProductCard } from "@/components/ProductCard";

type PageProps = {
    searchParams: Promise<{
        q?: string;
        origin?: string;
        sort?: string;
    }>;
};

export const metadata = {
    title: "Our Products",
};

// ── Text on this page: edit freely ──────────────────────────────────────────

const retailerSteps = [
    { title: "Browse", text: "Find a product below that fits your store or market." },
    { title: "Request", text: "Click 'Request this Product' and we'll get back to you." },
    { title: "Partner", text: "We handle logistics, pricing, and delivery to your location." },
];

// ── Page ────────────────────────────────────────────────────────────────────

export default async function ProductsPage({ searchParams }: PageProps) {
    const { q, origin, sort } = await searchParams;

    const searchQuery = q || "";
    const originFilter = origin || "all";
    const sortOrder = sort || "newest";

    const products = await prisma.product.findMany({
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

    // Builds the link for an origin filter button, keeping the current search and sort
    function originLink(o: string) {
        const params = new URLSearchParams({ sort: sortOrder });
        if (o !== "all") params.set("origin", o);
        if (searchQuery) params.set("q", searchQuery);
        return `/products?${params}`;
    }

    return (
        <>
            <PageHeader
                eyebrow="Our Products"
                title={<>What We <span className="text-gold-light/80">Distribute</span></>}
                text="A curated selection of products we carry across California markets. Sourced from around the world, built for retail and wholesale."
            >
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <ButtonLink href="#products">Browse Products</ButtonLink>
                    <ButtonLink href={`mailto:${site.email}`} variant="outline">Contact Us to Order</ButtonLink>
                </div>
            </PageHeader>

            {/* How it works for retailers */}
            <section className="px-6 py-16 border-t border-gold/10">
                <div className="max-w-6xl mx-auto">
                    <p className="text-sm uppercase tracking-[0.35em] text-gold-dark/70 mb-4 text-center">For Retailers</p>
                    <h2 className="text-3xl font-bold text-center mb-10">Interested in carrying one of our products?</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {retailerSteps.map((step, i) => (
                            <div key={step.title} className="bg-white/[0.04] border border-gold/10 rounded-3xl p-6 text-center">
                                <p className="text-gold-dark/60 text-sm mb-2">{String(i + 1).padStart(2, "0")}</p>
                                <h3 className="font-semibold text-gold-light mb-2">{step.title}</h3>
                                <p className="text-stone-400 text-sm">{step.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Search and filters */}
            <section id="products" className="px-6 pb-6 pt-8 border-t border-gold/10">
                <div className="max-w-6xl mx-auto">
                    <form action="/products" method="GET" className="flex flex-col md:flex-row gap-3 mb-6">
                        <input
                            name="q"
                            defaultValue={searchQuery}
                            placeholder="Search products..."
                            aria-label="Search products"
                            className="input rounded-full flex-1"
                        />
                        <input type="hidden" name="origin" value={originFilter} />
                        <select name="sort" defaultValue={sortOrder} aria-label="Sort" className="input rounded-full md:w-auto">
                            <option value="newest">Newest first</option>
                            <option value="alphabetical">A → Z</option>
                        </select>
                        <Button type="submit" size="sm">Search</Button>
                        <ButtonLink href="/products" variant="outline" size="sm">Reset</ButtonLink>
                    </form>

                    {origins.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-8">
                            {["all", ...origins].map((o) => (
                                <Link
                                    key={o}
                                    href={originLink(o)}
                                    className={`px-4 py-1.5 rounded-full text-sm border transition ${originFilter === o
                                        ? "bg-gold text-black border-gold"
                                        : "border-gold/20 text-stone-400 hover:border-gold/40 hover:text-white"
                                        }`}
                                >
                                    {o === "all" ? "All" : o}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Products grid */}
            <section className="px-6 pb-24">
                <div className="max-w-6xl mx-auto">
                    {products.length === 0 ? (
                        <div className="text-center py-20 text-stone-500">
                            <p className="text-xl mb-2">No products found.</p>
                            <Link href="/products" className="text-gold-dark/70 underline text-sm">
                                Clear filters
                            </Link>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Bottom call to action */}
            <Section className="text-center">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Don't see what you're looking for?</h2>
                    <p className="text-stone-400 mb-8">
                        We're always adding new products. Reach out and tell us what your store needs.
                    </p>
                    <ButtonLink href="/contact">Contact Us</ButtonLink>
                </div>
            </Section>
        </>
    );
}
