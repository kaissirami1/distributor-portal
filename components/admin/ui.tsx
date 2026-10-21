// ─────────────────────────────────────────────────────────────────────────────
// Shared building blocks for the admin panel: page titles, panels, buttons.
// Change a style here and every admin page updates.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

// ── Page title row ──────────────────────────────────────────────────────────

export function PageHeader({
    title,
    description,
    actions,
    back,
}: {
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    back?: { href: string; label: string };
}) {
    return (
        <div className="mb-8">
            {back && (
                <Link href={back.href} className="inline-block text-sm text-zinc-400 hover:text-white mb-4">
                    ← {back.label}
                </Link>
            )}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-2xl md:text-3xl font-bold text-balance">{title}</h1>
                    {description && <div className="text-zinc-400 mt-1.5">{description}</div>}
                </div>
                {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
            </div>
        </div>
    );
}

// ── Panels ──────────────────────────────────────────────────────────────────

export function Panel({
    title,
    action,
    children,
    className = "",
}: {
    title?: ReactNode;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section className={`bg-zinc-900 border border-zinc-800 rounded-xl ${className}`}>
            {(title || action) && (
                <div className="flex items-center justify-between gap-3 px-5 pt-5">
                    {title && <h2 className="font-semibold">{title}</h2>}
                    {action}
                </div>
            )}
            <div className="p-5">{children}</div>
        </section>
    );
}

// A big number with a label, e.g. "Waiting for reply: 3"
export function Stat({ label, value, tone = "text-white", href }: { label: string; value: ReactNode; tone?: string; href?: string }) {
    const inner = (
        <>
            <p className="text-sm text-zinc-400">{label}</p>
            <p className={`text-3xl font-bold tabular-nums mt-1 ${tone}`}>{value}</p>
        </>
    );
    const classes = "block bg-zinc-900 border border-zinc-800 rounded-xl p-5";
    return href
        ? <Link href={href} className={`${classes} hover:border-zinc-600 transition`}>{inner}</Link>
        : <div className={classes}>{inner}</div>;
}

// Shown when a list has nothing in it
export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
    return (
        <div className="text-center py-12 px-6 border border-dashed border-zinc-800 rounded-xl">
            <p className="font-medium">{title}</p>
            {text && <p className="text-sm text-zinc-500 mt-1">{text}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

// ── Buttons ─────────────────────────────────────────────────────────────────

type Variant = "primary" | "secondary" | "danger" | "ghost";

export const adminButton: Record<Variant, string> = {
    primary: "bg-white text-black hover:bg-zinc-200",
    secondary: "border border-zinc-700 text-zinc-200 hover:border-zinc-500 hover:text-white",
    danger: "border border-red-900 text-red-400 hover:bg-red-950 hover:text-red-300",
    ghost: "text-zinc-400 hover:text-white hover:bg-zinc-800",
};

const base = "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed";

export function AdminButton({ variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
    return <button {...props} className={`${base} ${adminButton[variant]} ${className}`} />;
}

// A link that looks like a button. Outside links, email and phone use a plain <a>.
export function AdminLink({
    href,
    variant = "secondary",
    newTab,
    className = "",
    children,
}: {
    href: string;
    variant?: Variant;
    newTab?: boolean;
    className?: string;
    children: ReactNode;
}) {
    const classes = `${base} ${adminButton[variant]} ${className}`;
    if (/^(mailto:|tel:|https?:)/.test(href) || newTab) {
        return (
            <a href={href} className={classes} {...(newTab ? { target: "_blank", rel: "noreferrer" } : {})}>
                {children}
            </a>
        );
    }
    return <Link href={href} className={classes}>{children}</Link>;
}

// A label + value pair inside a details grid
export function Detail({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
    return (
        <div className={wide ? "sm:col-span-2" : ""}>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
            <dd className="mt-1 text-sm text-zinc-100 break-words">{children || <span className="text-zinc-600">Not given</span>}</dd>
        </div>
    );
}
