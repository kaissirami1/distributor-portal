import Link from "next/link";
import { navButton, navLinks, site } from "@/lib/site";

// The footer at the bottom of every public page. Details are set in lib/site.ts.
export function Footer() {
    return (
        <footer className="border-t border-gold/10 px-6 py-12 text-sm text-stone-400">
            <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-10">
                <div className="md:col-span-2">
                    <img src="/logo.png" alt={site.name} className="h-16 mb-4" />
                    <p className="max-w-md">{site.description}</p>
                </div>

                <div>
                    <h3 className="text-gold-light font-semibold mb-4">Website</h3>
                    <div className="space-y-2">
                        {[...navLinks, navButton].map((link) => (
                            <Link key={link.href} href={link.href} className="block hover:text-white transition">
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-gold-light font-semibold mb-4">Contact</h3>
                    <div className="space-y-2">
                        <p>Email: <a href={`mailto:${site.email}`} className="hover:text-white transition">{site.email}</a></p>
                        <p>Phone: <a href={`tel:${site.phone}`} className="hover:text-white transition">{site.phone}</a></p>
                        <p>{site.location}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto border-t border-gold/10 mt-10 pt-6 flex flex-col md:flex-row justify-between gap-3 text-xs text-stone-500">
                <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
                <p>Product distribution application portal.</p>
            </div>
        </footer>
    );
}
