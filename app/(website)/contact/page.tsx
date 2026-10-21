"use client";

import { useState } from "react";
import { site } from "@/lib/site";
import { Button, ButtonLink, Card, Field, PageHeader, TextAreaField } from "@/components/ui";

// The page title is set in ./layout.tsx (this file runs in the browser, so it can't set it)

const inquiryTypes = [
    { value: "retailer", label: "Retailer / Buyer" },
    { value: "general", label: "General Inquiry" },
];

export default function ContactPage() {
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");
    const [type, setType] = useState("retailer");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        setError("");

        const payload = Object.fromEntries(new FormData(e.currentTarget).entries());

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Contact form failed");
            setSent(true);
        } catch (err) {
            console.error(err);
            setError(`Something went wrong. Please try again or email us at ${site.email}.`);
        }
        setLoading(false);
    }

    return (
        <>
            <PageHeader
                eyebrow="Contact"
                title="Contact Our Team"
                text="Whether you're a retailer looking to stock our products or have a general inquiry — we'd love to hear from you."
            />

            <section className="px-6 pb-24">
                <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
                    {/* Form */}
                    {sent ? (
                        <Card className="p-8 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-full bg-green-900/40 border border-green-700 flex items-center justify-center mb-4">
                                <span className="text-green-400 text-2xl">✓</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gold-light mb-2">Message Sent!</h2>
                            <p className="text-stone-400">We'll get back to you within 1-2 business days.</p>
                        </Card>
                    ) : (
                        <Card>
                            <form onSubmit={handleSubmit} className="p-8 space-y-5">
                                {/* Inquiry type toggle */}
                                <div>
                                    <p className="text-sm text-gold-light mb-2">I am a...</p>
                                    <div className="flex gap-2">
                                        {inquiryTypes.map(({ value, label }) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setType(value)}
                                                aria-pressed={type === value}
                                                className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${type === value
                                                    ? "bg-gold text-black border-gold"
                                                    : "border-gold/20 text-stone-400 hover:border-gold/40"
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                    <input type="hidden" name="type" value={type} />
                                </div>

                                <Field label="Full Name" name="name" required autoComplete="name" />
                                <Field label="Email Address" name="email" type="email" required autoComplete="email" />
                                <Field label="Phone Number" name="phone" type="tel" autoComplete="tel" />

                                {type === "retailer" ? (
                                    <>
                                        <Field label="Store / Business Name" name="storeName" required autoComplete="organization" />
                                        <Field label="Store Location" name="location" placeholder="City, State" />
                                        <Field label="Products you're interested in" name="productsInterested" placeholder="Optional" />
                                    </>
                                ) : (
                                    <Field label="Company Name" name="company" placeholder="Optional" autoComplete="organization" />
                                )}

                                <TextAreaField
                                    label="Message"
                                    name="message"
                                    required
                                    placeholder={type === "retailer" ? "Tell us about your store and what you're looking for..." : "How can we help?"}
                                />

                                {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}

                                <Button type="submit" size="lg" disabled={loading} className="w-full">
                                    {loading ? "Sending..." : "Send Message"}
                                </Button>
                            </form>
                        </Card>
                    )}

                    {/* Info panel */}
                    <div className="space-y-6">
                        <Card className="p-8">
                            <h2 className="text-2xl font-bold text-gold-light mb-4">For Retailers</h2>
                            <p className="text-stone-300 mb-4">
                                Interested in carrying one of our products? Fill out the form and select "Retailer / Buyer". We serve supermarkets, specialty stores, and wholesale buyers across California.
                            </p>
                            <ButtonLink href="/products" variant="light">Browse Our Products</ButtonLink>
                        </Card>

                        <Card className="p-8">
                            <h2 className="text-2xl font-bold text-gold-light mb-4">Product Submissions</h2>
                            <p className="text-stone-300 mb-4">
                                Looking to distribute your product? Use our dedicated submission form to upload images, documents, and product details.
                            </p>
                            <ButtonLink href="/submit" variant="outline">Submit Your Product</ButtonLink>
                        </Card>

                        <Card className="p-6 text-stone-400 space-y-2 text-sm">
                            <p>📧 <a href={`mailto:${site.email}`} className="hover:text-white transition">{site.email}</a></p>
                            <p>📞 <a href={`tel:${site.phone}`} className="hover:text-white transition">{site.phone}</a></p>
                            <p>📍 {site.location}</p>
                        </Card>
                    </div>
                </div>
            </section>
        </>
    );
}
