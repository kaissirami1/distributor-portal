"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navButton, navLinks, site } from "@/lib/site";

// The menu at the top of every public page. Links are set in lib/site.ts.
export function Navbar() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    return (
        <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-2xl px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3">
                    <img src="/logo.png" alt={site.name} className="h-12 md:h-16 w-auto" />
                </Link>

                {/* Desktop links */}
                <div className="hidden lg:flex items-center gap-7 text-sm">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`transition hover:text-white ${pathname === link.href ? "text-white" : "text-gray-300"}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                <Link
                    href={navButton.href}
                    className="hidden lg:block rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-gray-200 transition shadow-md"
                >
                    {navButton.label}
                </Link>

                {/* Mobile: hamburger */}
                <button
                    onClick={() => setOpen(!open)}
                    className="lg:hidden flex flex-col gap-1.5 p-2"
                    aria-label="Toggle menu"
                    aria-expanded={open}
                >
                    <span className={`block w-6 h-0.5 bg-white transition-transform duration-300 ${open ? "rotate-45 translate-y-2" : ""}`} />
                    <span className={`block w-6 h-0.5 bg-white transition-opacity duration-300 ${open ? "opacity-0" : ""}`} />
                    <span className={`block w-6 h-0.5 bg-white transition-transform duration-300 ${open ? "-rotate-45 -translate-y-2" : ""}`} />
                </button>
            </div>

            {/* Mobile menu */}
            {open && (
                <div className="lg:hidden mt-4 border-t border-white/10 pt-4 flex flex-col gap-1 text-sm text-gray-300">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setOpen(false)}
                            className="px-3 py-2.5 rounded-lg hover:bg-white/10 hover:text-white transition"
                        >
                            {link.label}
                        </Link>
                    ))}
                    <div className="pt-2 border-t border-white/10 mt-2">
                        <Link
                            href={navButton.href}
                            onClick={() => setOpen(false)}
                            className="block w-full text-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-gray-200 transition"
                        >
                            {navButton.label}
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
