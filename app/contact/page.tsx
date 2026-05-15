"use client";

import { useState } from "react";

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

        const fd = new FormData(e.currentTarget);
        const payload = Object.fromEntries(fd.entries());

        const res = await fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            setSent(true);
        } else {
            setError("Something went wrong. Please try again or email us directly.");
        }
        setLoading(false);
    }

    return (
        <main className="min-h-screen text-white bg-[radial-gradient(circle_at_top_left,#7a5a2a_0%,#2a2112_28%,#090806_65%,#000_100%)]">
            <section className="px-6 py-24">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-sm uppercase tracking-[0.4em] text-amber-300/70 mb-4">
                            Contact
                        </p>
                        <h1 className="text-5xl md:text-6xl font-bold mb-5">
                            Contact Our Team
                        </h1>
                        <p className="text-stone-300 max-w-2xl mx-auto text-lg">
                            Whether you're a retailer looking to stock our products or have a general inquiry — we'd love to hear from you.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Form */}
                        {sent ? (
                            <div className="bg-black/40 border border-amber-200/10 rounded-[2rem] p-8 backdrop-blur-xl flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 rounded-full bg-green-900/40 border border-green-700 flex items-center justify-center mb-4">
                                    <span className="text-green-400 text-2xl">✓</span>
                                </div>
                                <h2 className="text-2xl font-bold text-amber-100 mb-2">Message Sent!</h2>
                                <p className="text-stone-400">We'll get back to you within 1-2 business days.</p>
                            </div>
                        ) : (
                            <form
                                onSubmit={handleSubmit}
                                className="bg-black/40 border border-amber-200/10 rounded-[2rem] p-8 space-y-5 backdrop-blur-xl"
                            >
                                {/* Inquiry type toggle */}
                                <div>
                                    <p className="text-sm text-amber-100 mb-2">I am a...</p>
                                    <div className="flex gap-2">
                                        {[
                                            { value: "retailer", label: "Retailer / Buyer" },
                                            { value: "general", label: "General Inquiry" },
                                        ].map(({ value, label }) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setType(value)}
                                                className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${type === value
                                                        ? "bg-amber-200 text-black border-amber-200"
                                                        : "border-amber-200/20 text-stone-400 hover:border-amber-200/40"
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                    <input type="hidden" name="type" value={type} />
                                </div>

                                <input
                                    name="name"
                                    placeholder="Full Name *"
                                    required
                                    className="w-full bg-black/50 border border-amber-200/20 rounded-xl px-4 py-3 text-sm placeholder:text-stone-600 focus:outline-none focus:border-amber-200/40"
                                />
                                <input
                                    name="email"
                                    type="email"
                                    placeholder="Email Address *"
                                    required
                                    className="w-full bg-black/50 border border-amber-200/20 rounded-xl px-4 py-3 text-sm placeholder:text-stone-600 focus:outline-none focus:border-amber-200/40"
                                />
                                <input
                                    name="phone"
                                    type="tel"
                                    placeholder="Phone Number"
                                    className="w-full bg-black/50 border border-amber-200/20 rounded-xl px-4 py-3 text-sm placeholder:text-stone-600 focus:outline-none focus:border-amber-200/40"
                                />

                                {type === "retailer" && (
                                    <>
                                        <input
                                            name="storeName"
                                            placeholder="Store / Business Name *"
                                            required
                                            className="w-full bg-black/50 border border-amber-200/20 rounded-xl px-4 py-3 text-sm placeholder:text-stone-600 focus:outline-none focus:border-amber-200/40"
                                        />
                                        <input
                                            name="location"
                                            placeholder="Store Location (City, State)"
                                            className="w-full bg-black/50 border border-amber-200/20 rounded-xl px-4 py-3 text-sm placeholder:text-stone-600 focus:outline-none focus:border-amber-200/40"
                                        />
                                        <input
                                            name="productsInterested"
                                            placeholder="Products you're interested in (optional)"
                                            className="w-full bg-black/50 border border-amber-200/20 rounded-xl px-4 py-3 text-sm placeholder:text-stone-600 focus:outline-none focus:border-amber-200/40"
                                        />
                                    </>
                                )}

                                {type === "general" && (
                                    <input
                                        name="company"
                                        placeholder="Company Name (optional)"
                                        className="w-full bg-black/50 border border-amber-200/20 rounded-xl px-4 py-3 text-sm placeholder:text-stone-600 focus:outline-none focus:border-amber-200/40"
                                    />
                                )}

                                <textarea
                                    name="message"
                                    placeholder={type === "retailer" ? "Tell us about your store and what you're looking for..." : "How can we help?"}
                                    required
                                    rows={4}
                                    className="w-full bg-black/50 border border-amber-200/20 rounded-xl px-4 py-3 text-sm placeholder:text-stone-600 focus:outline-none focus:border-amber-200/40 resize-none"
                                />

                                {error && <p className="text-red-400 text-sm">{error}</p>}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-amber-200 text-black py-4 rounded-full font-semibold hover:bg-amber-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? "Sending..." : "Send Message"}
                                </button>
                            </form>
                        )}

                        {/* Info panel */}
                        <div className="space-y-6">
                            <div className="bg-black/35 border border-amber-200/10 rounded-[2rem] p-8">
                                <h2 className="text-2xl font-bold text-amber-100 mb-4">
                                    For Retailers
                                </h2>
                                <p className="text-stone-300 mb-4">
                                    Interested in carrying one of our products? Fill out the form and select "Retailer / Buyer". We serve supermarkets, specialty stores, and wholesale buyers across California.
                                </p>
                                <a
                                    href="/products"
                                    className="inline-block bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition text-sm"
                                >
                                    Browse Our Products
                                </a>
                            </div>

                            <div className="bg-black/35 border border-amber-200/10 rounded-[2rem] p-8">
                                <h2 className="text-2xl font-bold text-amber-100 mb-4">
                                    Product Submissions
                                </h2>
                                <p className="text-stone-300 mb-4">
                                    Looking to distribute your product? Use our dedicated submission form to upload images, documents, and product details.
                                </p>
                                <a
                                    href="/submit"
                                    className="inline-block border border-amber-200/30 text-amber-100 px-6 py-3 rounded-full font-semibold hover:bg-amber-200/10 transition text-sm"
                                >
                                    Submit Your Product
                                </a>
                            </div>

                            <div className="bg-black/35 border border-amber-200/10 rounded-[2rem] p-6 text-stone-400 space-y-2 text-sm">
                                <p>📧 info@makramdistributions.com</p>
                                <p>📞 (313) 888-0746</p>
                                <p>📍 California</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}