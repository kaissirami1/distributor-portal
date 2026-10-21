"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/admin/ui";
import { daysSince, formatDate, timeAgo, waitingTone } from "@/lib/dates";

type Submission = {
    id: number;
    productName: string;
    companyName: string | null;
    name: string;
    email: string;
    status: string;
    createdAt: string;
    category: string | null;
    trackingId: string | null;
};

export function SubmissionsClient({ submissions, emptyText }: { submissions: Submission[]; emptyText: string }) {
    const router = useRouter();
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [bulkLoading, setBulkLoading] = useState(false);
    const [message, setMessage] = useState("");

    const allSelected = submissions.length > 0 && selected.size === submissions.length;

    function toggleAll() {
        setSelected(allSelected ? new Set() : new Set(submissions.map((s) => s.id)));
    }

    function toggleOne(id: number) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    async function bulkUpdate(status: string) {
        if (selected.size === 0) return;
        // Approving or rejecting emails every selected vendor, so double-check first
        if (
            (status === "approved" || status === "rejected") &&
            !confirm(`Mark ${selected.size} submission(s) as ${status}? Each vendor will get an email.`)
        ) {
            return;
        }
        setBulkLoading(true);
        setMessage("");
        const res = await fetch("/api/admin/submissions/bulk-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: Array.from(selected), status }),
        });
        if (res.ok) {
            setMessage(`Updated ${selected.size} submission(s).`);
            setSelected(new Set());
            router.refresh();
        } else {
            setMessage("Couldn't update the selected submissions. Please try again.");
        }
        setBulkLoading(false);
    }

    if (submissions.length === 0) {
        return <EmptyState title={emptyText} />;
    }

    return (
        <div>
            {/* Bulk actions, shown once something is ticked */}
            {selected.size > 0 && (
                <div className="sticky top-16 lg:top-2 z-10 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 mb-3 flex flex-wrap items-center gap-2 shadow-xl">
                    <span className="text-sm font-medium mr-auto">{selected.size} selected</span>
                    <button onClick={() => bulkUpdate("reviewing")} disabled={bulkLoading} className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-900/40 text-blue-300 border border-blue-800 hover:bg-blue-900/70 disabled:opacity-50">
                        Mark reviewing
                    </button>
                    <button onClick={() => bulkUpdate("approved")} disabled={bulkLoading} className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-green-900/40 text-green-300 border border-green-800 hover:bg-green-900/70 disabled:opacity-50">
                        Approve
                    </button>
                    <button onClick={() => bulkUpdate("rejected")} disabled={bulkLoading} className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-900/40 text-red-300 border border-red-800 hover:bg-red-900/70 disabled:opacity-50">
                        Reject
                    </button>
                    <button onClick={() => setSelected(new Set())} className="px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-white">
                        Cancel
                    </button>
                </div>
            )}
            {message && <p role="status" className="text-sm text-zinc-400 mb-3">{message}</p>}

            <div className="border border-zinc-800 rounded-xl overflow-hidden">
                {/* Column titles (desktop) */}
                <div className="hidden md:grid grid-cols-[2rem_minmax(0,2.2fr)_minmax(0,1.6fr)_minmax(0,1fr)_7rem_6.5rem] gap-4 items-center px-4 py-2.5 bg-zinc-900 text-xs uppercase tracking-wide text-zinc-500">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" className="w-4 h-4 accent-white cursor-pointer" />
                    <span>Product</span>
                    <span>Contact</span>
                    <span>Category</span>
                    <span>Received</span>
                    <span>Status</span>
                </div>

                <ul className="divide-y divide-zinc-800">
                    {submissions.map((s) => {
                        const days = daysSince(s.createdAt);
                        return (
                            <li
                                key={s.id}
                                onClick={() => router.push(`/admin/submissions/${s.id}`)}
                                className={`grid grid-cols-[2rem_minmax(0,1fr)] md:grid-cols-[2rem_minmax(0,2.2fr)_minmax(0,1.6fr)_minmax(0,1fr)_7rem_6.5rem] gap-x-4 gap-y-1 items-center px-4 py-3.5 cursor-pointer transition ${selected.has(s.id) ? "bg-zinc-800/70" : "hover:bg-zinc-900"}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selected.has(s.id)}
                                    onChange={() => toggleOne(s.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    aria-label={`Select ${s.productName}`}
                                    className="w-4 h-4 accent-white cursor-pointer md:row-span-1 row-span-5 self-start md:self-center mt-1 md:mt-0"
                                />
                                <div className="min-w-0">
                                    <Link href={`/admin/submissions/${s.id}`} onClick={(e) => e.stopPropagation()} className="font-medium hover:underline">
                                        {s.productName}
                                    </Link>
                                    <p className="text-sm text-zinc-500 truncate">
                                        {s.companyName || "No company given"}
                                        {s.trackingId && <span className="font-mono text-xs text-zinc-600"> · {s.trackingId}</span>}
                                    </p>
                                </div>
                                <div className="min-w-0 text-sm">
                                    <p className="truncate">{s.name}</p>
                                    <a href={`mailto:${s.email}`} onClick={(e) => e.stopPropagation()} className="text-zinc-500 hover:text-blue-400 truncate block">
                                        {s.email}
                                    </a>
                                </div>
                                <p className="text-sm text-zinc-400 truncate">{s.category || "—"}</p>
                                <div className="text-sm">
                                    <p>{formatDate(s.createdAt)}</p>
                                    <p className={`text-xs ${s.status === "pending" ? waitingTone(days) : "text-zinc-500"}`}>
                                        {s.status === "pending" && days > 0 ? `waiting ${days}d` : timeAgo(s.createdAt)}
                                    </p>
                                </div>
                                <div><StatusBadge status={s.status} /></div>
                            </li>
                        );
                    })}
                </ul>
            </div>
            <p className="text-xs text-zinc-500 mt-3">Tick the boxes to update several at once.</p>
        </div>
    );
}
