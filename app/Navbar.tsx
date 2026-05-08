"use client";

import { useState } from "react";

export function Navbar() {
    const [open, setOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-2xl px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <a href="/" className="flex items-center gap-3">
                    <img
                        src="/logo.png"
                        alt="Makram Distributions"
                        className="h-12 md:h-16 w-auto"
                    />
                </a>

                {/* Desktop nav */}
                <div className="hidden md:flex items-center gap-8 text-sm text-gray-300">
                    <a href="/" className="hover:text-white transition">Home</a>
                    <a href="/about" className="hover:text-white transition">About</a>
                    <a href="/products" className="hover:text-white transition">Our Products</a>
                    <a href="/track" className="hover:text-white transition">Track Submission</a>

                    <div className="relative group">
                        <button className="hover:text-white transition">Company ▾</button>
                        <div className="absolute left-0 top-full hidden group-hover:block pt-3">
                            <div className="w-56 rounded-xl border border-white/10 bg-zinc-950 p-3 shadow-2xl">
                                <a href="/#process" className="block rounded-lg px-3 py-2 hover:bg-white/10">Our Process</a>
                                <a href="/#markets" className="block rounded-lg px-3 py-2 hover:bg-white/10">California Markets</a>
                            </div>
                        </div>
                    </div>

                    <div className="relative group">
                        <button className="hover:text-white transition">Solutions ▾</button>
                        <div className="absolute left-0 top-full hidden group-hover:block pt-3">
                            <div className="w-64 rounded-xl border border-white/10 bg-zinc-950 p-3 shadow-2xl">
                                <a href="/#review" className="block rounded-lg px-3 py-2 hover:bg-white/10">Product Review</a>
                                <a href="/#market-fit" className="block rounded-lg px-3 py-2 hover:bg-white/10">Market Fit Evaluation</a>
                                <a href="/#onboarding" className="block rounded-lg px-3 py-2 hover:bg-white/10">Supplier Onboarding</a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Desktop CTA */}
                <a
                    href="/contact"
                    className="hidden md:block rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-gray-200 transition shadow-md"
                >
                    Contact Our Team
                </a>

                {/* Mobile: hamburger */}
                <button
                    onClick={() => setOpen(!open)}
                    className="md:hidden flex flex-col gap-1.5 p-2"
                    aria-label="Toggle menu"
                >
                    <span className={`block w-6 h-0.5 bg-white transition-transform duration-300 ${open ? "rotate-45 translate-y-2" : ""}`} />
                    <span className={`block w-6 h-0.5 bg-white transition-opacity duration-300 ${open ? "opacity-0" : ""}`} />
                    <span className={`block w-6 h-0.5 bg-white transition-transform duration-300 ${open ? "-rotate-45 -translate-y-2" : ""}`} />
                </button>
            </div>

            {/* Mobile menu */}
            {open && (
                <div className="md:hidden mt-4 border-t border-white/10 pt-4 flex flex-col gap-1 text-sm text-gray-300">
                    <a href="/" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg hover:bg-white/10 hover:text-white transition">Home</a>
                    <a href="/about" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg hover:bg-white/10 hover:text-white transition">About</a>
                    <a href="/products" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg hover:bg-white/10 hover:text-white transition">Our Products</a>
                    <a href="/track" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg hover:bg-white/10 hover:text-white transition">Track Submission</a>
                    <a href="/#process" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg hover:bg-white/10 hover:text-white transition">Our Process</a>
                    <a href="/#markets" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg hover:bg-white/10 hover:text-white transition">California Markets</a>
                    <a href="/#review" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg hover:bg-white/10 hover:text-white transition">Product Review</a>
                    <a href="/#market-fit" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg hover:bg-white/10 hover:text-white transition">Market Fit Evaluation</a>
                    <a href="/#onboarding" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg hover:bg-white/10 hover:text-white transition">Supplier Onboarding</a>
                    <div className="pt-2 border-t border-white/10 mt-2">
                        <a
                            href="/contact"
                            onClick={() => setOpen(false)}
                            className="block w-full text-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-gray-200 transition"
                        >
                            Contact Our Team
                        </a>
                    </div>
                </div>
            )}
        </nav>
    );
}