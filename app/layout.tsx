import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Makram Distributions",
    template: "%s | Makram Distributions",
  },
  description: "Product distribution application portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[radial-gradient(circle_at_top,#5a4725_0%,#2a2112_35%,#0a0907_70%,#000_100%)] text-white">
        <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-2xl px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <a href="/" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Makram Distributions"
                className="h-16 md:h-20 w-auto"
              />
            </a>

            <div className="hidden md:flex items-center gap-8 text-sm text-gray-300">
              <a href="/" className="hover:text-white transition">
                Home
              </a>

              <a href="/about" className="hover:text-white transition">
                About
              </a>

              <a href="/products" className="hover:text-white transition">
                Our Products
              </a>

              <a href="/track" className="hover:text-white transition">
                Track Submission
              </a>

              <div className="relative group">
                <button className="hover:text-white transition">
                  Company ▾
                </button>
                <div className="absolute left-0 top-full hidden group-hover:block pt-3">
                  <div className="w-56 rounded-xl border border-white/10 bg-zinc-950 p-3 shadow-2xl">
                    <a href="/#process" className="block rounded-lg px-3 py-2 hover:bg-white/10">
                      Our Process
                    </a>
                    <a href="/#markets" className="block rounded-lg px-3 py-2 hover:bg-white/10">
                      California Markets
                    </a>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <button className="hover:text-white transition">
                  Solutions ▾
                </button>
                <div className="absolute left-0 top-full hidden group-hover:block pt-3">
                  <div className="w-64 rounded-xl border border-white/10 bg-zinc-950 p-3 shadow-2xl">
                    <a href="/#review" className="block rounded-lg px-3 py-2 hover:bg-white/10">
                      Product Review
                    </a>
                    <a href="/#market-fit" className="block rounded-lg px-3 py-2 hover:bg-white/10">
                      Market Fit Evaluation
                    </a>
                    <a href="/#onboarding" className="block rounded-lg px-3 py-2 hover:bg-white/10">
                      Supplier Onboarding
                    </a>
                  </div>
                </div>
              </div>


            </div>

            <a
              href="/contact"
              className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-gray-200 transition shadow-md"
            >
              Contact Our Team
            </a>
          </div>
        </nav>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-amber-200/10 px-6 py-12 text-sm text-stone-400">
          <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-10">
            <div className="md:col-span-2">
              <img
                src="/logo.png"
                alt="Makram Distributions"
                className="h-16 mb-4"
              />

              <p className="max-w-md text-stone-400">
                Makram Distributions reviews small and emerging products for potential
                distribution opportunities across California markets.
              </p>
            </div>

            <div>
              <h3 className="text-amber-100 font-semibold mb-4">Website</h3>
              <div className="space-y-2">
                <a href="/" className="block hover:text-white transition">Home</a>
                <a href="/about" className="block hover:text-white transition">About</a>
                <a href="/products">Our Products</a>
                <a href="/submit" className="block hover:text-white transition">Submit Product</a>
              </div>
            </div>

            <div>
              <h3 className="text-amber-100 font-semibold mb-4">Contact</h3>
              <div className="space-y-2">
                <p>Email: info@makramdistributions.com</p>
                <p>Phone: (000) 000-0000</p>
                <p>California</p>
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto border-t border-amber-200/10 mt-10 pt-6 flex flex-col md:flex-row justify-between gap-3 text-xs text-stone-500">
            <p>© {new Date().getFullYear()} Makram Distributions. All rights reserved.</p>
            <p>Product distribution application portal.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}