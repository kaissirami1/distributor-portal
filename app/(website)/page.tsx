import { prisma } from "@/lib/prisma";
import { categories } from "@/lib/site";
import { ButtonLink, Card, Eyebrow, Section, SectionHeader } from "@/components/ui";
import { ProductCard } from "@/components/ProductCard";

export const metadata = {
  title: "Home",
};

// ── Text on this page: edit freely ──────────────────────────────────────────

const audiences = [
  {
    eyebrow: "For Vendors",
    title: "Have a product to distribute?",
    text: "Submit your product for review. We evaluate fit, readiness, and market potential across California markets. If it's a match, we handle the rest.",
    points: [
      "Simple online submission process",
      "Track your submission status in real time",
      "Direct feedback from our team",
      "Sales visibility once distributed",
    ],
    button: { href: "/submit", label: "Submit Your Product →", variant: "primary" as const },
  },
  {
    eyebrow: "For Retailers",
    title: "Looking for unique products?",
    text: "Browse our curated catalog of distributed products. From Lebanese specialties to emerging brands — find something your customers will love.",
    points: [
      "Curated selection of quality products",
      "Filter by origin",
      "Request any product directly",
      "Serving Orange County, LA, San Diego",
    ],
    button: { href: "/products", label: "Browse Products →", variant: "light" as const },
  },
];

const processSteps = [
  { title: "Submit", text: "Provide your product details, documents, images, and barcode information." },
  { title: "Review", text: "We review the submission for market fit, presentation, and readiness." },
  { title: "Contact", text: "If there is a fit, we reach out for more information or next steps." },
  { title: "Move Forward", text: "Approved products can move into onboarding and distribution planning." },
];

const faqs = [
  { q: "Do you guarantee placement?", a: "No. Every product is reviewed before any decision is made." },
  { q: "Do you work with small brands?", a: "Yes. We are especially interested in small and emerging products with strong potential." },
  { q: "What happens after submission?", a: "Your product is reviewed internally. If it appears to be a fit, we contact you for next steps." },
  { q: "What markets do you focus on?", a: "We focus on California, especially Orange County, Los Angeles, San Diego, and surrounding areas." },
  { q: "How do I carry one of your products in my store?", a: "Browse our products page and click 'Request this Product' on anything you're interested in. We'll reach out with pricing and availability." },
];

// ── Page ────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  // The 3 newest products from the catalog (managed in Admin → Products)
  const featuredProducts = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <>
      {/* ── Hero ── */}
      <section className="px-6 py-36 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),transparent)] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative">
          <Eyebrow className="fade-up tracking-[0.45em] mb-6">Makram Distributions</Eyebrow>
          <h1 className="fade-up text-6xl md:text-8xl font-bold leading-[0.95]">
            Distribution Built
            <br />
            <span className="text-gold-light/80">For Better Products</span>
          </h1>
          <p className="fade-up-delay text-stone-300 max-w-3xl mx-auto mt-8 text-lg md:text-xl">
            We connect quality products with California retailers. Whether you're a vendor looking to distribute or a retailer looking to stock — we make it happen.
          </p>
          <div className="fade-up-delay mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <ButtonLink href="/submit" size="lg">Submit Your Product</ButtonLink>
            <ButtonLink href="/products" variant="outline" size="lg">Browse Products</ButtonLink>
            <ButtonLink href="/track" variant="outline" size="lg">Track Submission</ButtonLink>
          </div>
        </div>
      </section>

      {/* ── Two audiences ── */}
      <section className="px-6 py-20 border-t border-gold/10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
          {audiences.map((a) => (
            <Card key={a.eyebrow} className="p-8">
              <Eyebrow className="tracking-[0.35em]">{a.eyebrow}</Eyebrow>
              <h2 className="text-3xl font-bold text-gold-light mb-4">{a.title}</h2>
              <p className="text-stone-300 mb-6">{a.text}</p>
              <ul className="space-y-2 text-stone-400 text-sm mb-8">
                {a.points.map((point) => (
                  <li key={point}>✓ {point}</li>
                ))}
              </ul>
              <ButtonLink href={a.button.href} variant={a.button.variant}>{a.button.label}</ButtonLink>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Featured products ── */}
      <Section>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <Eyebrow className="tracking-[0.35em]">Our Products</Eyebrow>
            <h2 className="text-4xl md:text-5xl font-bold">What We Distribute</h2>
          </div>
          <ButtonLink href="/products" variant="outline" size="sm" className="self-start md:self-auto whitespace-nowrap">
            View all products →
          </ButtonLink>
        </div>

        {featuredProducts.length === 0 ? (
          <Card className="text-center py-16">
            <p className="text-stone-500">Products coming soon.</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <ButtonLink href="/products">Browse All Products</ButtonLink>
        </div>
      </Section>

      {/* ── Process (the "How It Works" menu link jumps here) ── */}
      <Section id="process">
        <SectionHeader eyebrow="Process" title="A clear review path" />
        <div className="grid md:grid-cols-4 gap-6">
          {processSteps.map((step, i) => (
            <div key={step.title} className="hover-lift bg-white/[0.05] border border-gold/10 rounded-3xl p-6">
              <p className="text-gold-dark/60 mb-3">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="font-semibold text-gold-light mb-3">{step.title}</h3>
              <p className="text-stone-300 text-sm">{step.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Categories (edit the list in lib/site.ts) ── */}
      <section className="px-6 py-24">
        <Card className="hover-lift max-w-6xl mx-auto p-10 md:p-14 text-center">
          <Eyebrow className="tracking-[0.35em]">Product Categories</Eyebrow>
          <h2 className="text-4xl md:text-5xl font-bold mb-8">Built for more than one category</h2>
          <div className="grid md:grid-cols-5 gap-4 text-stone-300">
            {categories.map((item) => (
              <div key={item} className="hover-lift border border-gold/10 rounded-2xl p-4 bg-white/[0.04]">
                {item}
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* ── FAQ ── */}
      <section className="px-6 py-24 border-t border-gold/10">
        <div className="max-w-4xl mx-auto">
          <SectionHeader title="Frequently Asked Questions" />
          <div className="space-y-5">
            {faqs.map(({ q, a }) => (
              <div key={q} className="hover-lift bg-black/35 border border-gold/10 rounded-2xl p-6">
                <h3 className="font-semibold text-gold-light mb-2">{q}</h3>
                <p className="text-stone-300">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final call to action ── */}
      <section className="px-6 py-28 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-5">Ready to get started?</h2>
        <p className="text-stone-300 mb-9">
          Whether you want to distribute your product or stock your shelves — we're here to help.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <ButtonLink href="/submit" size="lg">Submit Your Product</ButtonLink>
          <ButtonLink href="/products" variant="outline" size="lg">Browse Products</ButtonLink>
        </div>
      </section>
    </>
  );
}
