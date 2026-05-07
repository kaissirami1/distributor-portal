"use client";

import { useState } from "react";
import Link from "next/link";

type Submission = {
    id: number;
    productName: string;
    companyName: string | null;
    email: string;
    status: string;
    createdAt: string;
    category: string | null;
};

type Props = {
    submissions: Submission[];
    statusFilter: string;
    searchQuery: string;
};

function statusBadge(status: string) {
    const base = "inline-block px-2 py-0.5 rounded text-xs font-semibold";
    switch (status) {
        case "approved": return `${base} bg-green-900/50 text-green-400`;
        case "rejected": return `${base} bg-red-900/50 text-red-400`;
        case "reviewing": return `${base} bg-blue-900/50 text-blue-400`;
        default: return `${base} bg-yellow-900/50 text-yellow-400`;
    }
}

const STATUS_BUTTONS = [
    { value: "pending", label: "Pending", color: "text-yellow-400 hover:text-yellow-300" },
    { value: "reviewing", label: "Review", color: "text-blue-400 hover:text-blue-300" },
    { value: "approved", label: "Approve", color: "text-green-400 hover:text-green-300" },
    { value: "rejected", label: "Reject", color: "text-red-400 hover:text-red-300" },
];

export function SubmissionsClient({ submissions }: Props) {
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [bulkLoading, setBulkLoading] = useState(false);
    const [statusMap, setStatusMap] = useState<Record<number, string>>(
        () => Object.fromEntries(submissions.map((s) => [s.id, s.status]))
    );

    const allSelected =
        submissions.length > 0 && selected.size === submissions.length;

    function toggleAll() {
        setSelected(allSelected ? new Set() : new Set(submissions.map((s) => s.id)));
    }

    function toggleOne(id: number) {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    async function updateSingle(id: number, status: string) {
        setStatusMap((prev) => ({ ...prev, [id]: status }));
        await fetch("/api/admin/submissions/update-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status }),
        });
    }

    async function bulkUpdate(status: string) {
        if (selected.size === 0) return;
        setBulkLoading(true);
        const ids = Array.from(selected);
        setStatusMap((prev) => {
            const next = { ...prev };
            ids.forEach((id) => (next[id] = status));
            return next;
        });
        await fetch("/api/admin/submissions/bulk-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids, status }),
        });
        setSelected(new Set());
        setBulkLoading(false);
    }

    return (
        <div>
            {/* Bulk action bar */}
            {selected.size > 0 && (
                <div className="sticky top-0 z-10 bg-zinc-950 border border-zinc-700 rounded-xl px-5 py-3 mb-4 flex flex-wrap items-center gap-3">
                    <span className="text-sm text-gray-300 font-medium">
                        {selected.size} selected
                    </span>
                    <div className="flex gap-2 ml-auto flex-wrap">
                        <button
                            onClick={() => bulkUpdate("reviewing")}
                            disabled={bulkLoading}
                            className="bg-blue-900/40 text-blue-300 border border-blue-700 px-3 py-1.5 rounded text-sm font-semibold hover:bg-blue-800/60 disabled:opacity-50"
                        >
                            Mark Reviewing
                        </button>
                        <button
                            onClick={() => bulkUpdate("approved")}
                            disabled={bulkLoading}
                            className="bg-green-900/40 text-green-300 border border-green-700 px-3 py-1.5 rounded text-sm font-semibold hover:bg-green-800/60 disabled:opacity-50"
                        >
                            Approve All
                        </button>
                        <button
                            onClick={() => bulkUpdate("rejected")}
                            disabled={bulkLoading}
                            className="bg-red-900/40 text-red-300 border border-red-700 px-3 py-1.5 rounded text-sm font-semibold hover:bg-red-800/60 disabled:opacity-50"
                        >
                            Reject All
                        </button>
                        <button
                            onClick={() => setSelected(new Set())}
                            className="border border-zinc-600 px-3 py-1.5 rounded text-sm text-gray-400 hover:text-white"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {submissions.length === 0 ? (
                <p className="text-gray-400">No submissions found.</p>
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center gap-3 px-4 py-1 text-sm text-gray-500">
                        <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleAll}
                            className="w-4 h-4 rounded border-zinc-600 accent-white cursor-pointer"
                        />
                        <span>Select all</span>
                    </div>

                    {submissions.map((s) => {
                        const currentStatus = statusMap[s.id];
                        return (
                            <div
                                key={s.id}
                                className={`bg-zinc-900 border rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4 md:items-center transition-colors ${selected.has(s.id) ? "border-zinc-500" : "border-zinc-800"
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={selected.has(s.id)}
                                        onChange={() => toggleOne(s.id)}
                                        className="mt-1 w-4 h-4 rounded border-zinc-600 accent-white cursor-pointer flex-shrink-0"
                                    />
                                    <div>
                                        <p className="font-semibold">{s.productName}</p>
                                        <p className="text-sm text-gray-400">{s.companyName || "—"}</p>
                                        <p className="text-sm text-gray-500">{s.email}</p>
                                        <span className={statusBadge(currentStatus)}>
                                            {currentStatus}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 pl-7 md:pl-0">
                                    {STATUS_BUTTONS.map(({ value, label, color }) => (
                                        <button
                                            key={value}
                                            onClick={() => updateSingle(s.id, value)}
                                            disabled={currentStatus === value}
                                            className={`text-sm ${color} disabled:opacity-30 disabled:cursor-default`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                    <Link
                                        href={`/admin/submissions/${s.id}`}
                                        className="text-white text-sm underline"
                                    >
                                        View
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}