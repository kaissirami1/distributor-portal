"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/lib/site";
import {
    BoxIcon, CalculatorIcon, CloseIcon, DashboardIcon, DownloadIcon, GlobeIcon, InboxIcon, LogoutIcon, MenuIcon, SalesIcon,
} from "./icons";

// The admin sidebar (a slide-out menu on phones). Add a page to the menu here.
const links = [
    { href: "/admin", label: "Dashboard", Icon: DashboardIcon },
    { href: "/admin/submissions", label: "Submissions", Icon: InboxIcon, badge: "waiting" as const },
    { href: "/admin/products", label: "Products", Icon: BoxIcon },
    { href: "/admin/calculator", label: "Price Calculator", Icon: CalculatorIcon },
    { href: "/admin/sales", label: "Sales", Icon: SalesIcon },
];

export function AdminNav({ waiting, admin }: { waiting: number; admin: string }) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

    const menu = (
        <nav className="flex flex-col h-full">
            {/* Phone menu only: a close button */}
            <div className="lg:hidden px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-sm text-zinc-400">Menu</span>
                <button onClick={() => setOpen(false)} className="p-2 text-zinc-400 hover:text-white" aria-label="Close menu">
                    <CloseIcon />
                </button>
            </div>

            <div className="flex-1 px-3 py-4 lg:pt-8 space-y-1">
                {links.map(({ href, label, Icon, badge }) => (
                    <Link
                        key={href}
                        href={href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${isActive(href)
                            ? "bg-zinc-800 text-white font-medium"
                            : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                            }`}
                    >
                        <Icon className="w-5 h-5 shrink-0" />
                        <span className="flex-1">{label}</span>
                        {badge === "waiting" && waiting > 0 && (
                            <span className="min-w-6 px-1.5 py-0.5 rounded-full bg-amber-300 text-black text-xs font-bold text-center" title={`${waiting} waiting for a reply`}>
                                {waiting}
                            </span>
                        )}
                    </Link>
                ))}
                <a
                    href="/admin/export"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition"
                >
                    <DownloadIcon className="w-5 h-5 shrink-0" />
                    Export to Excel
                </a>
            </div>

            <div className="px-3 py-4 border-t border-zinc-800 space-y-1">
                <p className="px-3 pb-2 text-xs text-zinc-500">Logged in as <span className="text-zinc-300">{admin}</span></p>
                <a
                    href="/"
                    target="_blank"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition"
                >
                    <GlobeIcon className="w-5 h-5 shrink-0" /> View website
                </a>
                <form action="/api/admin/logout" method="POST">
                    <button
                        type="submit"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-zinc-800/60 transition w-full"
                    >
                        <LogoutIcon className="w-5 h-5 shrink-0" /> Log out
                    </button>
                </form>
            </div>
        </nav>
    );

    return (
        <>
            {/* Phone: top bar with a menu button */}
            <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
                <Link href="/admin" className="flex items-center gap-2">
                    <img src="/logo.png" alt={site.name} className="h-8 w-auto rounded" />
                    <span className="text-sm text-zinc-400">Admin</span>
                </Link>
                <button onClick={() => setOpen(true)} className="relative p-2 text-zinc-300" aria-label="Open menu">
                    <MenuIcon className="w-6 h-6" />
                    {waiting > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-300" />}
                </button>
            </div>

            {/* Phone: slide-out menu */}
            {open && (
                <div className="lg:hidden fixed inset-0 z-40">
                    <button className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-label="Close menu" />
                    <aside className="absolute left-0 top-0 bottom-0 w-72 bg-zinc-950 border-r border-zinc-800">{menu}</aside>
                </div>
            )}

            {/* Desktop: fixed sidebar */}
            <aside className="hidden lg:block w-60 shrink-0 border-r border-zinc-800 sticky top-0 h-screen">{menu}</aside>
        </>
    );
}
