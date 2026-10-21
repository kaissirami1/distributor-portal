"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DOCUMENT_TYPES, MAX_DOCUMENT_MB, OTHER_DOCUMENT, type DocumentType } from "@/lib/documents";
import type { DocumentInput, SaveResult } from "@/lib/documentActions";

// The list of documents we need, with an upload button for each.
// Used on the seller's tracking page and on the submission page in admin.
// Which documents are asked for is set in lib/documents.ts.

export type SavedDocument = {
    id: number;
    type: string;
    url: string | null;
    fileName: string | null;
    value: string | null;
    uploadedBy: string;
    createdAt: string;
};

type Props = {
    documents: SavedDocument[];
    save: (input: DocumentInput) => Promise<SaveResult>;
    deleteAction?: (formData: FormData) => Promise<void>;
    admin?: boolean;
};

const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export function DocumentChecklist({ documents, save, deleteAction, admin }: Props) {
    const received = DOCUMENT_TYPES.filter((t) => documents.some((d) => d.type === t.key)).length;

    return (
        <div>
            <p className={`text-sm mb-4 ${received === DOCUMENT_TYPES.length ? "text-green-400" : admin ? "text-zinc-400" : "text-stone-400"}`}>
                {received} of {DOCUMENT_TYPES.length} received
                {received === DOCUMENT_TYPES.length && " · all set"}
            </p>
            <ul className="space-y-3">
                {[...DOCUMENT_TYPES, OTHER_DOCUMENT].map((type) => (
                    <DocumentRow
                        key={type.key}
                        type={type}
                        docs={documents.filter((d) => d.type === type.key)}
                        save={save}
                        deleteAction={deleteAction}
                        admin={admin}
                    />
                ))}
            </ul>
        </div>
    );
}

function DocumentRow({ type, docs, save, deleteAction, admin }: {
    type: DocumentType;
    docs: SavedDocument[];
    save: Props["save"];
    deleteAction?: Props["deleteAction"];
    admin?: boolean;
}) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [text, setText] = useState("");
    const isOther = type.key === OTHER_DOCUMENT.key;
    const done = docs.length > 0;

    async function finish(result: SaveResult) {
        if (result.ok) {
            setText("");
            router.refresh();
        } else {
            setError(result.error);
        }
        setBusy(false);
    }

    async function uploadFile(file: File) {
        setError("");
        if (file.size > MAX_DOCUMENT_MB * 1024 * 1024) {
            setError(`"${file.name}" is too large. Files must be under ${MAX_DOCUMENT_MB} MB.`);
            return;
        }
        setBusy(true);
        try {
            const body = new FormData();
            body.append("file", file);
            const res = await fetch("/api/upload", { method: "POST", body });
            if (!res.ok) throw new Error("Upload failed");
            const { url } = await res.json();
            await finish(await save({ type: type.key, url, fileName: file.name }));
        } catch {
            setError(`We couldn't upload "${file.name}". Please try again.`);
            setBusy(false);
        }
    }

    async function saveText() {
        if (!text.trim()) return;
        setError("");
        setBusy(true);
        await finish(await save({ type: type.key, value: text }));
    }

    const box = admin ? "border-zinc-800 bg-black/30" : "border-gold/10 bg-black/30";
    const muted = admin ? "text-zinc-500" : "text-stone-500";
    const button = admin
        ? "border border-zinc-700 text-zinc-200 hover:border-zinc-500"
        : "border border-gold/30 text-gold-light hover:bg-gold/10";

    return (
        <li className={`border rounded-xl p-4 ${box}`}>
            <div className="flex flex-wrap items-start gap-3">
                <span
                    className={`mt-0.5 w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${done ? "bg-green-500 text-black" : isOther ? "border border-zinc-600" : "border border-amber-400/70"}`}
                    aria-hidden="true"
                >
                    {done ? "✓" : ""}
                </span>
                <div className="flex-1 min-w-48">
                    <p className="font-medium">
                        {type.label}
                        {!isOther && !done && <span className="ml-2 text-xs font-normal text-amber-300">Needed</span>}
                        {isOther && <span className={`ml-2 text-xs font-normal ${muted}`}>Optional</span>}
                    </p>
                    <p className={`text-sm mt-0.5 ${muted}`}>{type.hint}</p>

                    {docs.length > 0 && (
                        <ul className="mt-2 space-y-1">
                            {docs.map((d) => (
                                <li key={d.id} className="flex flex-wrap items-center gap-x-2 text-sm">
                                    {d.url ? (
                                        <a href={d.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline break-all">
                                            {d.fileName || "Open file"}
                                        </a>
                                    ) : (
                                        <span className="font-mono">{d.value}</span>
                                    )}
                                    <span className={`text-xs ${muted}`}>
                                        {formatDate(d.createdAt)}{admin ? (d.uploadedBy === "seller" ? " · from seller" : ` · added by ${d.uploadedBy}`) : ""}
                                    </span>
                                    {admin && deleteAction && (
                                        <form action={deleteAction} onSubmit={(e) => { if (!confirm("Remove this document?")) e.preventDefault(); }}>
                                            <input type="hidden" name="documentId" value={d.id} />
                                            <button type="submit" className="text-xs text-zinc-500 hover:text-red-400">Remove</button>
                                        </form>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Upload or type it in */}
                <div className="w-full sm:w-auto">
                    {type.input === "text" ? (
                        <div className="flex gap-2">
                            <input
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder={done ? "Update number" : "Enter number"}
                                aria-label={type.label}
                                className={admin ? "admin-input w-44" : "input py-2 w-44"}
                            />
                            <button type="button" onClick={saveText} disabled={busy || !text.trim()} className={`px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 ${button}`}>
                                {busy ? "Saving…" : "Save"}
                            </button>
                        </div>
                    ) : (
                        <label className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer ${button} ${busy ? "opacity-50 pointer-events-none" : ""}`}>
                            {busy ? "Uploading…" : done ? (isOther ? "Add another" : "Upload new version") : "Upload file"}
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.heic,.webp,.doc,.docx,.xls,.xlsx,.csv,image/*"
                                className="sr-only"
                                disabled={busy}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    e.target.value = "";
                                    if (file) uploadFile(file);
                                }}
                            />
                        </label>
                    )}
                </div>
            </div>
            {error && <p role="alert" className="text-sm text-red-400 mt-2">{error}</p>}
        </li>
    );
}
