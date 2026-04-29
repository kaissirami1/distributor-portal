export const metadata = {
    title: "About",
};

export default function AboutPage() {
    return (
        <main className="min-h-screen text-white bg-[radial-gradient(circle_at_top_left,#7a5a2a_0%,#2a2112_28%,#090806_65%,#000_100%)]">
            <section className="px-6 py-24">
                <div className="max-w-5xl mx-auto">
                    <p className="text-sm uppercase tracking-[0.4em] text-amber-300/70 mb-4">
                        About Makram Distributions
                    </p>

                    <h1 className="text-5xl md:text-6xl font-bold mb-6">
                        Building a selective product distribution platform.
                    </h1>

                    <p className="text-stone-300 text-lg max-w-3xl">
                        Makram Distributions reviews small and emerging products for
                        potential distribution opportunities across California markets. Our
                        focus is on organized product intake, careful review, and identifying
                        where products may fit best.
                    </p>
                </div>
            </section>

            <section className="px-6 py-16 border-t border-amber-200/10">
                <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
                    <div className="bg-black/35 border border-amber-200/10 rounded-3xl p-8">
                        <h2 className="text-2xl font-bold text-amber-100 mb-4">
                            What We Focus On
                        </h2>
                        <p className="text-stone-300">
                            We look for products with clear presentation, strong potential,
                            and realistic readiness for retail, wholesale, or regional
                            distribution opportunities.
                        </p>
                    </div>

                    <div className="bg-black/35 border border-amber-200/10 rounded-3xl p-8">
                        <h2 className="text-2xl font-bold text-amber-100 mb-4">
                            Our Market
                        </h2>
                        <p className="text-stone-300">
                            Our primary focus is California, including Orange County, Los
                            Angeles, San Diego, and surrounding regional markets.
                        </p>
                    </div>
                </div>
            </section>

            <section className="px-6 py-20">
                <div className="max-w-5xl mx-auto bg-black/35 border border-amber-200/10 rounded-3xl p-8 md:p-10">
                    <h2 className="text-3xl font-bold mb-4">Our Approach</h2>
                    <p className="text-stone-300 mb-6">
                        We believe distribution starts with organization. Every product
                        submission is reviewed through a structured process that considers
                        product type, brand presentation, target location, supporting
                        documents, barcode information, and market fit.
                    </p>

                    <a
                        href="/submit"
                        className="inline-block bg-amber-200 text-black px-6 py-3 rounded-full font-semibold hover:bg-amber-100 transition"
                    >
                        Submit Your Product
                    </a>
                </div>
            </section>
        </main>
    );
}