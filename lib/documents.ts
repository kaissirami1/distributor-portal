// ─────────────────────────────────────────────────────────────────────────────
// The documents we ask every seller for. Add, remove or reword items here:
// the seller's upload page, the admin checklist and the "request documents"
// email all update.
//   input: "file" → they upload a file; "text" → they type it in (e.g. a number)
// ─────────────────────────────────────────────────────────────────────────────

export const DOCUMENT_TYPES = [
    {
        key: "license",
        label: "Food license",
        hint: "Your state license to make and sell food, for example from your state's agriculture department.",
        input: "file",
    },
    {
        key: "fda",
        label: "FDA facility registration number",
        hint: "The FDA registration number of the facility that makes the product.",
        input: "text",
    },
    {
        key: "insurance",
        label: "Product liability insurance certificate",
        hint: "A certificate of insurance that lists Makram Distributions as additional insured.",
        input: "file",
    },
    {
        key: "guarantee",
        label: "Continuing guarantee letter",
        hint: "A signed letter stating your products are safe and correctly labeled.",
        input: "file",
    },
    {
        key: "priceList",
        label: "Wholesale price list",
        hint: "Price per case, case sizes, minimum order, and shelf life.",
        input: "file",
    },
] as const;

// Anything else a seller wants to send: spec sheets, organic or kosher certificates, photos
export const OTHER_DOCUMENT = {
    key: "other",
    label: "Other documents",
    hint: "Spec sheets, organic or kosher certificates, product photos, or anything else that helps.",
    input: "file",
} as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number] | typeof OTHER_DOCUMENT;

const ALL = [...DOCUMENT_TYPES, OTHER_DOCUMENT];

export function documentType(key: string): DocumentType | undefined {
    return ALL.find((t) => t.key === key);
}

// Uploads larger than this are rejected (the host limits uploads to about 4.5 MB)
export const MAX_DOCUMENT_MB = 4;
