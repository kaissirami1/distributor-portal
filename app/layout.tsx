import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "./Navbar";

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
        <Navbar />

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
                <a href="/products" className="block hover:text-white transition">Our Products</a>
                <a href="/track" className="block hover:text-white transition">Track Submission</a>
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