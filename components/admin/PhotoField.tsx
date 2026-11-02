"use client";

import { useState } from "react";
import { SafeImage } from "./SafeImage";

// Photos larger than this are rejected (the host limits uploads to about 4.5 MB)
const MAX_PHOTO_MB = 4;

// A photo picker for admin forms: upload from your computer or phone, or paste a link.
// The chosen photo's address is sent with the form under `name`.
export function PhotoField({ name, initial, onUploadingChange }: { name: string; initial?: string | null; onUploadingChange?: (uploading: boolean) => void }) {
    const [image, setImage] = useState(initial ?? "");
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    async function upload(file: File) {
        setError("");
        if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
            setError(`That photo is too large. Photos must be under ${MAX_PHOTO_MB} MB.`);
            return;
        }
        setUploading(true);
        onUploadingChange?.(true);
        try {
            const body = new FormData();
            body.append("file", file);
            const res = await fetch("/api/upload", { method: "POST", body });
            if (!res.ok) throw new Error("Upload failed");
            setImage((await res.json()).url);
        } catch {
            setError("The photo couldn't be uploaded. Please try again.");
        }
        setUploading(false);
        onUploadingChange?.(false);
    }

    return (
        <div className="space-y-3">
            <input type="hidden" name={name} value={image} />
            <SafeImage src={image || null} alt="Photo" className="w-full aspect-[4/3] rounded-lg border border-zinc-800" emptyClassName="w-full h-32 rounded-lg border border-zinc-800" />
            <input
                type="file"
                accept="image/*"
                disabled={uploading}
                aria-label="Upload a photo"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) upload(file);
                }}
                className="block w-full text-sm text-zinc-400 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-white file:text-black file:font-semibold file:cursor-pointer"
            />
            {uploading && <p className="text-sm text-zinc-400">Uploading photo…</p>}
            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
            <label className="block">
                <span className="text-xs text-zinc-500">Or paste an image link</span>
                <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://" className="admin-input mt-1" />
            </label>
            {image && (
                <button type="button" onClick={() => setImage("")} className="text-xs text-zinc-500 hover:text-red-400">
                    Remove photo
                </button>
            )}
        </div>
    );
}
