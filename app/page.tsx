import { prisma } from "../lib/prisma";
import Link from "next/link";

export const metadata = {
  title: "Home",
};

export default async function HomePage() {
  const featuredProducts = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <main className="min-h-screen text-white bg-[radial-gradient(circle_at_top_left,#7a5a2a_0%,#2a2112_28%,#090806_65%,#000_100%)]">

      {/* ── Hero ── */}
      <section className="px-6 py-36 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),transparent)] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative">
          <p className="fade-up text-sm uppercase tracking-[0.45em] text-amber-300/70 mb-6">
            Makram Distributions
          </p>
          <h1 className="fade-up text-6xl md:text-8xl font-bold leading-[0.95]">
            Distribution Built
            <br />
            <span className="text-amber-100/80">For Better Products</span>
          </h1>
          <p className="fade-up-delay text-stone-300 max-w-3xl mx-auto mt-8 text-lg md:text-xl">
            We connect quality products with California retailers. Whether you're a vendor looking to distribute or a retailer looking to stock — we make it happen.
          </p>
          <div className="fade-up-delay mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="/submit"
              className="bg-amber-200 text-black px-8 py-4 rounded-full font-semibold hover:bg-amber-100 transition"
            >
              Submit Your Product
            </a>
            <a
              href="/products"
              className="border border-amber-200/30 px-8 py-4 rounded-full font-semibold hover:bg-amber-200/10 transition"
            >
              Browse Products
            </a>
            <a
              href="/track"
              className="border border-amber-200/30 px-8 py-4 rounded-full font-semibold hover:bg-amber-200/10 transition"
            >
              Track Submission
            </a>
          </div>
        </div>
      </section>

      {/* ── Two audiences ── */}
      <section className="px-6 py-20 border-t border-amber-200/10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Vendors */}
          <div className="bg-white/[0.04] border border-amber-200/10 rounded-3xl p-8">
            <p className="text-sm uppercase tracking-[0.35em] text-amber-300/70 mb-4">For Vendors</p>
            <h2 className="text-3xl font-bold text-amber-100 mb-4">
              Have a product to distribute?
            </h2>
            <p className="text-stone-300 mb-6">
              Submit your product for review. We evaluate fit, readiness, and market potential across California markets. If it's a match, we handle the rest.
            </p>
            <ul className="space-y-2 text-stone-400 text-sm mb-8">
              <li>✓ Simple online submission process</li>
              <li>✓ Track your submission status in real time</li>
              <li>✓ Direct feedback from our team</li>
              <li>✓ Sales visibility once distributed</li>
            </ul>
            <a
              href="/submit"
              className="inline-block bg-amber-200 text-black px-6 py-3 rounded-full font-semibold hover:bg-amber-100 transition text-sm"
            >
              Submit Your Product →
            </a>
          </div>

          {/* Retailers */}
          <div className="bg-white/[0.04] border border-amber-200/10 rounded-3xl p-8">
            <p className="text-sm uppercase tracking-[0.35em] text-amber-300/70 mb-4">For Retailers</p>
            <h2 className="text-3xl font-bold text-amber-100 mb-4">
              Looking for unique products?
            </h2>
            <p className="text-stone-300 mb-6">
              Browse our curated catalog of distributed products. From Lebanese specialties to emerging brands — find something your customers will love.
            </p>
            <ul className="space-y-2 text-stone-400 text-sm mb-8">
              <li>✓ Curated selection of quality products</li>
              <li>✓ Filter by origin and category</li>
              <li>✓ Request any product directly</li>
              <li>✓ Serving Orange County, LA, San Diego</li>
            </ul>
            <a
              href="/products"
              className="inline-block bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition text-sm"
            >
              Browse Products →
            </a>
          </div>
        </div>
      </section>

      {/* ── Featured products ── */}
      <section className="px-6 py-24 border-t border-amber-200/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-amber-300/70 mb-4">Our Products</p>
              <h2 className="text-4xl md:text-5xl font-bold">What We Distribute</h2>
            </div>
            <Link
              href="/products"
              className="border border-amber-200/30 px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-amber-200/10 transition self-start md:self-auto whitespace-nowrap"
            >
              View all products →
            </Link>
          </div>

          {featuredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white/[0.03] border border-amber-200/10 rounded-3xl">
              <p className="text-stone-500">Products coming soon.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {featuredProducts.map((product) => (
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
                    <h3 className="font-semibold text-lg text-amber-100 mb-2">{product.name}</h3>
                    <p className="text-stone-400 text-sm leading-relaxed flex-1">{product.description}</p>
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

          <div className="text-center mt-8">
            <Link
              href="/products"
              className="bg-amber-200 text-black px-8 py-3 rounded-full font-semibold hover:bg-amber-100 transition text-sm"
            >
              Browse All Products
            </Link>
          </div>
        </div>
      </section>

      {/* ── Process ── */}
      <section id="process" className="px-6 py-24 border-t border-amber-200/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm uppercase tracking-[0.35em] text-amber-300/70 mb-4">Process</p>
            <h2 className="text-4xl md:text-5xl font-bold">A clear review path</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              ["01", "Submit", "Provide your product details, documents, images, and barcode information."],
              ["02", "Review", "We review the submission for market fit, presentation, and readiness."],
              ["03", "Contact", "If there is a fit, we reach out for more information or next steps."],
              ["04", "Move Forward", "Approved products can move into onboarding and distribution planning."],
            ].map(([number, title, text]) => (
              <div key={number} className="hover-lift bg-white/[0.05] border border-amber-200/10 rounded-3xl p-6">
                <p className="text-amber-300/60 mb-3">{number}</p>
                <h3 className="font-semibold text-amber-100 mb-3">{title}</h3>
                <p className="text-stone-300 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Markets ── */}
      <section className="px-6 py-24">
        <div className="hover-lift max-w-6xl mx-auto bg-black/40 border border-amber-200/10 rounded-[2rem] p-10 md:p-14 text-center backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.35em] text-amber-300/70 mb-4">Product Categories</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-8">Built for more than one category</h2>
          <div className="grid md:grid-cols-5 gap-4 text-stone-300">
            {["Food & Beverage", "Specialty Retail", "Lifestyle", "Household", "Emerging Brands"].map((item) => (
              <div key={item} className="hover-lift border border-amber-200/10 rounded-2xl p-4 bg-white/[0.04]">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-6 py-24 border-t border-amber-200/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-5">
            {[
              ["Do you guarantee placement?", "No. Every product is reviewed before any decision is made."],
              ["Do you work with small brands?", "Yes. We are especially interested in small and emerging products with strong potential."],
              ["What happens after submission?", "Your product is reviewed internally. If it appears to be a fit, we contact you for next steps."],
              ["What markets do you focus on?", "We focus on California, especially Orange County, Los Angeles, San Diego, and surrounding areas."],
              ["How do I carry one of your products in my store?", "Browse our products page and click 'Request this Product' on anything you're interested in. We'll reach out with pricing and availability."],
            ].map(([q, a]) => (
              <div key={q} className="hover-lift bg-black/35 border border-amber-200/10 rounded-2xl p-6">
                <h3 className="font-semibold text-amber-100 mb-2">{q}</h3>
                <p className="text-stone-300">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-6 py-28 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-5">Ready to get started?</h2>
        <p className="text-stone-300 mb-9">
          Whether you want to distribute your product or stock your shelves — we're here to help.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a
            href="/submit"
            className="bg-amber-200 text-black px-10 py-4 rounded-full font-semibold hover:bg-amber-100 transition"
          >
            Submit Your Product
          </a>
          <a
            href="/products"
            className="border border-amber-200/30 px-10 py-4 rounded-full font-semibold hover:bg-amber-200/10 transition"
          >
            Browse Products
          </a>
        </div>
      </section>
    </main>
  );
}