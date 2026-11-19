"use client";

import { useState } from "react";
import { AdminButton, adminButton } from "@/components/admin/ui";

// Opens the browser's print window: print the order, or pick "Save as PDF"
export function PrintButton({ children }: { children: React.ReactNode }) {
    return <AdminButton type="button" variant="secondary" onClick={() => window.print()}>{children}</AdminButton>;
}

// A ready-to-send message with Copy and Open in email buttons
export function MessageBox({ subject, body, to, label = "Open in email" }: { subject: string; body: string; to?: string | null; label?: string }) {
    const [copied, setCopied] = useState(false);
    const mailto = `mailto:${encodeURIComponent(to ?? "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    async function copy() {
        try {
            await navigator.clipboard.writeText(body);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { }
    }

    return (
        <div className="space-y-3">
            <textarea readOnly value={body} rows={Math.min(14, body.split("\n").length + 1)} className="admin-input font-mono text-xs leading-relaxed resize-y" onFocus={(e) => e.currentTarget.select()} />
            <div className="flex flex-wrap gap-2">
                <a href={mailto} className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${adminButton.primary}`}>{label}</a>
                <AdminButton type="button" variant="secondary" onClick={copy}>{copied ? "Copied" : "Copy message"}</AdminButton>
            </div>
        </div>
    );
}
