export const metadata = {
  title: "Home",
};

export default function HomePage() {
  return (
    <main className="min-h-screen text-white bg-[radial-gradient(circle_at_top,#5a4725_0%,#2a2112_35%,#0a0907_70%,#000_100%)]">
      {/* HERO */}
      <section className="px-6 py-32 text-center">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm uppercase tracking-[0.35em] text-amber-300/70 mb-5">
            Makram Distributions
          </p>

          <h1 className="text-6xl md:text-7xl font-bold leading-tight">
            Premium Product Distribution
            <br />
            <span className="text-amber-100/80">
              Across California Markets
            </span>
          </h1>

          <p className="text-stone-300 max-w-2xl mx-auto mt-6 text-lg">
            Makram Distributions evaluates and connects high-potential products
            with the right retail, wholesale, and regional distribution channels
            across Orange County, Los Angeles, San Diego, and beyond.
          </p>

          <div className="mt-10 flex justify-center gap-4">
            <a
              href="/submit"
              className="bg-amber-200 text-black px-6 py-3 rounded-full font-semibold hover:bg-amber-100 transition"
            >
              Submit Your Product
            </a>

            <a
              href="#process"
              className="border border-amber-200/30 px-6 py-3 rounded-full font-semibold hover:bg-amber-200/10 transition"
            >
              Explore Process
            </a>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="review" className="px-6 py-20 border-t border-amber-200/10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="bg-black/35 border border-amber-200/10 rounded-2xl p-6 backdrop-blur">
            <h3 className="text-xl font-semibold mb-3 text-amber-100">
              Product Evaluation
            </h3>
            <p className="text-stone-300">
              Each product is reviewed for pricing, positioning, scalability,
              and overall market readiness before moving forward.
            </p>
          </div>

          <div className="bg-black/35 border border-amber-200/10 rounded-2xl p-6 backdrop-blur">
            <h3 className="text-xl font-semibold mb-3 text-amber-100">
              Market Fit Strategy
            </h3>
            <p className="text-stone-300">
              We analyze where your product fits best—retail stores, specialty
              markets, cafes, grocery, or wholesale distribution channels.
            </p>
          </div>

          <div className="bg-black/35 border border-amber-200/10 rounded-2xl p-6 backdrop-blur">
            <h3 className="text-xl font-semibold mb-3 text-amber-100">
              Supplier Onboarding
            </h3>
            <p className="text-stone-300">
              Qualified products may move into onboarding, pricing alignment,
              and real distribution opportunities.
            </p>
          </div>
        </div>
      </section>

      {/* CALIFORNIA MARKETS */}
      <section id="markets" className="px-6 py-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-300/70 mb-4">
              California Focus
            </p>

            <h2 className="text-4xl font-bold mb-4">
              Focused on high-value California markets.
            </h2>

            <p className="text-stone-300">
              Makram Distributions operates with a strong focus on Southern
              California including Orange County, Los Angeles, and San Diego.
              We prioritize products that can succeed in competitive,
              high-demand retail environments.
            </p>
          </div>

          <div className="bg-black/35 border border-amber-200/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4 text-amber-100">
              Products We Review
            </h3>

            <ul className="space-y-3 text-stone-300">
              <li>• Small packaged consumer goods</li>
              <li>• Specialty retail products</li>
              <li>• Food and beverage items</li>
              <li>• Lifestyle and household products</li>
              <li>• Emerging brands with strong positioning</li>
            </ul>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section id="process" className="px-6 py-20 border-t border-amber-200/10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-10 text-center">
            How Our Process Works
          </h2>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                number: "01",
                title: "Submit",
                text: "Provide product details including pricing, category, and distribution goals.",
              },
              {
                number: "02",
                title: "Review",
                text: "Our team evaluates your product for market fit and potential.",
              },
              {
                number: "03",
                title: "Contact",
                text: "We reach out if your product aligns with our current focus.",
              },
              {
                number: "04",
                title: "Move Forward",
                text: "Approved products move into onboarding and distribution planning.",
              },
            ].map((step) => (
              <div
                key={step.number}
                className="bg-black/35 border border-amber-200/10 rounded-2xl p-6"
              >
                <p className="text-amber-300/60 mb-2">{step.number}</p>
                <h4 className="font-semibold mb-2 text-amber-100">
                  {step.title}
                </h4>
                <p className="text-stone-300 text-sm">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center bg-black/30 border border-amber-200/10 rounded-3xl p-10 backdrop-blur">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-300/70 mb-4">
            About
          </p>

          <h2 className="text-4xl font-bold mb-4">
            About Makram Distributions
          </h2>

          <p className="text-stone-300">
            Makram Distributions focuses on identifying and developing strong
            product opportunities across California markets. This section can be
            expanded with your full company story, mission, and long-term vision
            as the business grows.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <h2 className="text-4xl font-bold mb-4">Ready to get started?</h2>

        <p className="text-stone-300 mb-8">
          Submit your product today and we’ll review it for distribution
          potential.
        </p>

        <a
          href="/submit"
          className="bg-amber-200 text-black px-8 py-4 rounded-full font-semibold hover:bg-amber-100 transition"
        >
          Submit Your Product
        </a>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-amber-200/10 px-6 py-8 text-sm text-stone-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-4">
          <p>© {new Date().getFullYear()} Makram Distributions</p>

          <div className="flex flex-col md:flex-row gap-4">
            <p>Email: info@makramdistributions.com</p>
            <p>Phone: (000) 000-0000</p>
          </div>
        </div>
      </footer>
    </main>
  );
}