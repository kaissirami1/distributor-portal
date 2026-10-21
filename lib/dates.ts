// Date helpers for the admin panel, e.g. "Sep 6, 2026" and "6 weeks ago"

const DAY = 24 * 60 * 60 * 1000;

export function formatDate(date: Date | string) {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(date: Date | string) {
    return new Date(date).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

// The date n days before now
export function daysAgo(n: number) {
    return new Date(Date.now() - n * DAY);
}

export function daysSince(date: Date | string) {
    return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / DAY));
}

export function timeAgo(date: Date | string) {
    const days = daysSince(date);
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 14) return `${days} days ago`;
    if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
}

// How urgent a submission that's still waiting for a reply is
export function waitingTone(days: number) {
    if (days > 7) return "text-red-400";
    if (days > 2) return "text-amber-300";
    return "text-zinc-400";
}
