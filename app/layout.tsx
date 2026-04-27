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
      <body className="min-h-full flex flex-col bg-[radial-gradient(circle_at_top,#3a2f1b_0%,#1a140a_40%,#000_80%)] text-white">
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
              <a href="/" className="hover:text-white transition">Home</a>

              <div className="relative group">
                <button className="hover:text-white transition">
                  Company ▾
                </button>
                <div className="absolute left-0 top-full hidden group-hover:block pt-3">
                  <div className="w-56 rounded-xl border border-white/10 bg-zinc-950 p-3 shadow-2xl">
                    <a href="/#about" className="block rounded-lg px-3 py-2 hover:bg-white/10">About</a>
                    <a href="/#process" className="block rounded-lg px-3 py-2 hover:bg-white/10">Our Process</a>
                    <a href="/#markets" className="block rounded-lg px-3 py-2 hover:bg-white/10">California Markets</a>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <button className="hover:text-white transition">
                  Solutions ▾
                </button>
                <div className="absolute left-0 top-full hidden group-hover:block pt-3">
                  <div className="w-64 rounded-xl border border-white/10 bg-zinc-950 p-3 shadow-2xl">
                    <a href="/#review" className="block rounded-lg px-3 py-2 hover:bg-white/10">Product Review</a>
                    <a href="/#market-fit" className="block rounded-lg px-3 py-2 hover:bg-white/10">Market Fit Evaluation</a>
                    <a href="/#onboarding" className="block rounded-lg px-3 py-2 hover:bg-white/10">Supplier Onboarding</a>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <button className="hover:text-white transition">
                  Portal ▾
                </button>
                <div className="absolute right-0 top-full hidden group-hover:block pt-3">
                  <div className="w-56 rounded-xl border border-white/10 bg-zinc-950 p-3 shadow-2xl">
                    <a href="/submit" className="block rounded-lg px-3 py-2 hover:bg-white/10">Submit Product</a>
                    <a href="/admin/login" className="block rounded-lg px-3 py-2 hover:bg-white/10">Admin Login</a>
                  </div>
                </div>
              </div>
            </div>

            <a
              href="/submit"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-200 transition"
            >
              Submit Product
            </a>
          </div>
        </nav>

        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}