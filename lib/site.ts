// ─────────────────────────────────────────────────────────────────────────────
// Business details used across the whole website.
// Change something here and it updates everywhere it appears
// (top menu, footer, contact page, product request buttons, emails).
// ─────────────────────────────────────────────────────────────────────────────

export const site = {
    name: "Makram Distributions",
    email: "info@makramdistributions.com",
    phone: "(313) 888-0746",
    location: "California",
    url: "https://makramdistributions.com",
    description:
        "Makram Distributions reviews small and emerging products for potential distribution opportunities across California markets.",
};

// Links in the top menu, the mobile menu, and the footer
export const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/products", label: "Our Products" },
    { href: "/#process", label: "How It Works" },
    { href: "/track", label: "Track Submission" },
    { href: "/submit", label: "Submit Product" },
];

// The button on the right side of the top menu
export const navButton = { href: "/contact", label: "Contact Our Team" };

// Product categories: shown on the homepage and offered in the submission form
export const categories = [
    "Food & Beverage",
    "Specialty Retail",
    "Lifestyle",
    "Household",
    "Emerging Brands",
];
