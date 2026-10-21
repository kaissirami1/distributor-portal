// ─────────────────────────────────────────────────────────────────────────────
// The four stages a product submission moves through, and how each one looks.
// Used by the admin panel and the public tracking page.
// ─────────────────────────────────────────────────────────────────────────────

export const STATUSES = ["pending", "reviewing", "approved", "rejected"] as const;
export type Status = (typeof STATUSES)[number];

type StatusInfo = {
    label: string;        // name shown in the admin panel
    publicLabel: string;  // name shown to vendors on the tracking page
    message: string;      // explanation shown to vendors on the tracking page
    badge: string;        // style of the small colored label
    dot: string;          // style of the colored dot
    text: string;         // text color
    panel: string;        // style of the status box on the tracking page
    chart: string;        // color in the dashboard charts
};

export const statusInfo: Record<Status, StatusInfo> = {
    pending: {
        label: "Pending",
        publicLabel: "Pending Review",
        message: "Your submission has been received and is in the queue for review. We will update you as soon as our team begins the evaluation.",
        badge: "bg-yellow-900/50 text-yellow-400",
        dot: "bg-yellow-500",
        text: "text-yellow-400",
        panel: "bg-yellow-900/20 border-yellow-800",
        chart: "#facc15",
    },
    reviewing: {
        label: "Reviewing",
        publicLabel: "Under Review",
        message: "Your submission is currently being reviewed by our team. This process typically takes a few business days.",
        badge: "bg-blue-900/50 text-blue-400",
        dot: "bg-blue-500",
        text: "text-blue-400",
        panel: "bg-blue-900/20 border-blue-800",
        chart: "#60a5fa",
    },
    approved: {
        label: "Approved",
        publicLabel: "Approved",
        message: "Your product has been approved for the next step in our distribution review process. We will be in touch with you shortly.",
        badge: "bg-green-900/50 text-green-400",
        dot: "bg-green-500",
        text: "text-green-400",
        panel: "bg-green-900/20 border-green-800",
        chart: "#4ade80",
    },
    rejected: {
        label: "Rejected",
        publicLabel: "Not Moving Forward",
        message: "After careful review, we are not moving forward with this product at this time. We appreciate your interest in Makram Distributions.",
        badge: "bg-red-900/50 text-red-400",
        dot: "bg-red-500",
        text: "text-red-400",
        panel: "bg-red-900/20 border-red-800",
        chart: "#f87171",
    },
};

// Looks up a status, falling back to "pending" for anything unexpected
export function getStatus(status: string): StatusInfo {
    return statusInfo[status as Status] ?? statusInfo.pending;
}
