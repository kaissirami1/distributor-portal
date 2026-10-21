import { ButtonLink, Card, PageHeader } from "@/components/ui";

export const metadata = {
    title: "About",
};

// ── Text on this page: edit freely ──────────────────────────────────────────

const highlights = [
    {
        title: "What We Focus On",
        text: "We look for products with clear presentation, strong potential, and realistic readiness for retail, wholesale, or regional distribution opportunities.",
    },
    {
        title: "Our Market",
        text: "Our primary focus is California, including Orange County, Los Angeles, San Diego, and surrounding regional markets.",
    },
];

// ── Page ────────────────────────────────────────────────────────────────────

export default function AboutPage() {
    return (
        <>
            <PageHeader
                align="left"
                eyebrow="About Makram Distributions"
                title="Building a selective product distribution platform."
                text="Makram Distributions reviews small and emerging products for potential distribution opportunities across California markets. Our focus is on organized product intake, careful review, and identifying where products may fit best."
            />

            <section className="px-6 py-16 border-t border-gold/10">
                <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
                    {highlights.map((h) => (
                        <Card key={h.title} className="p-8">
                            <h2 className="text-2xl font-bold text-gold-light mb-4">{h.title}</h2>
                            <p className="text-stone-300">{h.text}</p>
                        </Card>
                    ))}
                </div>
            </section>

            <section className="px-6 py-20">
                <Card className="max-w-4xl mx-auto p-8 md:p-10">
                    <h2 className="text-3xl font-bold mb-4">Our Approach</h2>
                    <p className="text-stone-300 mb-6">
                        We believe distribution starts with organization. Every product
                        submission is reviewed through a structured process that considers
                        product type, brand presentation, target location, supporting
                        documents, barcode information, and market fit.
                    </p>
                    <ButtonLink href="/submit">Submit Your Product</ButtonLink>
                </Card>
            </section>
        </>
    );
}
