// ─────────────────────────────────────────────────────────────────────────────
// Shared building blocks for the public website.
// Change a style here and every page that uses it updates.
// Brand colors (gold, gold-light, gold-dark) are set in app/globals.css.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

// ── Buttons ─────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "outline" | "light";
type ButtonSize = "sm" | "md" | "lg";

const buttonVariants: Record<ButtonVariant, string> = {
    primary: "bg-gold text-black hover:bg-gold-light",
    outline: "border border-gold/30 text-white hover:bg-gold/10",
    light: "bg-white text-black hover:bg-stone-200",
};

const buttonSizes: Record<ButtonSize, string> = {
    sm: "px-5 py-2 text-sm",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4",
};

function buttonClasses(variant: ButtonVariant, size: ButtonSize, className = "") {
    return `inline-block text-center rounded-full font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`;
}

// A link that looks like a button: <ButtonLink href="/submit">Submit</ButtonLink>
export function ButtonLink({
    href,
    variant = "primary",
    size = "md",
    className,
    children,
}: {
    href: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    className?: string;
    children: ReactNode;
}) {
    const classes = buttonClasses(variant, size, className);
    // Email, phone and outside links use a plain <a>; pages on this site use <Link>
    if (/^(mailto:|tel:|https?:)/.test(href)) {
        return <a href={href} className={classes}>{children}</a>;
    }
    return <Link href={href} className={classes}>{children}</Link>;
}

// A real button, for forms: <Button type="submit">Send</Button>
export function Button({
    variant = "primary",
    size = "md",
    className,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
    return <button {...props} className={buttonClasses(variant, size, className)} />;
}

// ── Headings ────────────────────────────────────────────────────────────────

// The small spaced-out label above a heading, e.g. "OUR PRODUCTS"
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
    return (
        <p className={`text-sm uppercase tracking-[0.4em] text-gold-dark/70 mb-4 ${className}`}>
            {children}
        </p>
    );
}

// The big title block at the top of a page
export function PageHeader({
    eyebrow,
    title,
    text,
    align = "center",
    children,
}: {
    eyebrow: string;
    title: ReactNode;
    text?: ReactNode;
    align?: "center" | "left";
    children?: ReactNode;
}) {
    const centered = align === "center";
    return (
        <section className="px-6 pt-24 pb-12">
            <div className={`max-w-4xl mx-auto ${centered ? "text-center" : ""}`}>
                <Eyebrow>{eyebrow}</Eyebrow>
                <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">{title}</h1>
                {text && (
                    <p className={`text-stone-300 text-lg max-w-2xl ${centered ? "mx-auto" : ""}`}>{text}</p>
                )}
                {children && <div className="mt-8">{children}</div>}
            </div>
        </section>
    );
}

// The heading at the start of a section further down a page
export function SectionHeader({
    eyebrow,
    title,
    align = "center",
}: {
    eyebrow?: string;
    title: ReactNode;
    align?: "center" | "left";
}) {
    return (
        <div className={align === "center" ? "text-center mb-12" : "mb-8"}>
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            <h2 className="text-4xl md:text-5xl font-bold">{title}</h2>
        </div>
    );
}

// ── Layout ──────────────────────────────────────────────────────────────────

// A full-width page section with a thin line on top
export function Section({ id, children, className = "" }: { id?: string; children: ReactNode; className?: string }) {
    return (
        <section id={id} className={`px-6 py-24 border-t border-gold/10 ${className}`}>
            <div className="max-w-6xl mx-auto">{children}</div>
        </section>
    );
}

// A rounded box with a subtle border
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
    return (
        <div className={`bg-black/35 border border-gold/10 rounded-3xl backdrop-blur-xl ${className}`}>
            {children}
        </div>
    );
}

// ── Form fields ─────────────────────────────────────────────────────────────

function FieldLabel({ label, required, hint }: { label: string; required?: boolean; hint?: string }) {
    return (
        <span className="block mb-1.5">
            <span className="text-sm text-gold-light">
                {label}
                {required && <span className="text-gold-dark"> *</span>}
            </span>
            {hint && <span className="block text-xs text-stone-500 mt-0.5">{hint}</span>}
        </span>
    );
}

type FieldProps = { label: string; hint?: string };

// A labeled text box: <Field label="Email" name="email" type="email" required />
export function Field({ label, hint, className = "", ...props }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
    return (
        <label className={`block ${className}`}>
            <FieldLabel label={label} required={props.required} hint={hint} />
            <input {...props} className="input" />
        </label>
    );
}

// A labeled multi-line text box
export function TextAreaField({ label, hint, className = "", ...props }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <label className={`block ${className}`}>
            <FieldLabel label={label} required={props.required} hint={hint} />
            <textarea rows={4} {...props} className="input resize-y" />
        </label>
    );
}

// A labeled dropdown: <SelectField label="Category" name="category" options={[...]} />
export function SelectField({
    label,
    hint,
    options,
    placeholder,
    className = "",
    ...props
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement> & { options: string[]; placeholder?: string }) {
    return (
        <label className={`block ${className}`}>
            <FieldLabel label={label} required={props.required} hint={hint} />
            <select defaultValue="" {...props} className="input">
                {placeholder && <option value="" disabled>{placeholder}</option>}
                {options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                ))}
            </select>
        </label>
    );
}
