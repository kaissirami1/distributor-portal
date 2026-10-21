"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { SafeImage } from "@/components/admin/SafeImage";
import { AdminButton, AdminLink } from "@/components/admin/ui";
import { saveProduct } from "./actions";

// Photos larger than this are rejected (the host limits uploads to about 4.5 MB)
const MAX_PHOTO_MB = 4;

type Product = {
    id: number;
    name: string;
    origin: string;
    description: string;
    image: string | null;
};

export function ProductForm({ product, origins }: { product?: Product; origins: string[] }) {
    const [image, setImage] = useState(product?.image ?? "");
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");

    async function uploadPhoto(file: File) {
        setUploadError("");
        if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
            setUploadError(`That photo is too large. Photos must be under ${MAX_PHOTO_MB} MB.`);
            return;
        }
        setUploading(true);
        try {
            const body = new FormData();
            body.append("file", file);
            const res = await fetch("/api/upload", { method: "POST", body });
            if (!res.ok) throw new Error("Upload failed");
            const { url } = await res.json();
            setImage(url);
        } catch {
            setUploadError("The photo couldn't be uploaded. Please try again.");
        }
        setUploading(false);
    }

    return (
        <form action={saveProduct} className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
            {product && <input type="hidden" name="id" value={product.id} />}
            <input type="hidden" name="image" value={image} />

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-5">
                <label className="block">
                    <span className="text-sm text-zinc-300">Product name *</span>
                    <input name="name" required defaultValue={product?.name} placeholder="e.g. Ashta Cream" className="admin-input mt-1.5" />
                </label>

                <label className="block">
                    <span className="text-sm text-zinc-300">Origin / cuisine *</span>
                    <input
                        name="origin"
                        required
                        list="origin-options"
                        defaultValue={product?.origin}
                        placeholder="e.g. Lebanese, Mexican, Italian"
                        className="admin-input mt-1.5"
                    />
                    <datalist id="origin-options">
                        {origins.map((o) => <option key={o} value={o} />)}
                    </datalist>
                    <span className="block text-xs text-zinc-500 mt-1">Shoppers can filter the products page by this.</span>
                </label>

                <label className="block">
                    <span className="text-sm text-zinc-300">Description *</span>
                    <textarea
                        name="description"
                        required
                        rows={5}
                        defaultValue={product?.description}
                        placeholder="What it is, how it's used, what makes it special"
                        className="admin-input mt-1.5 resize-y"
                    />
                </label>

                <div className="flex flex-wrap gap-2 pt-2">
                    <SaveButton disabled={uploading} isNew={!product} />
                    <AdminLink href="/admin/products" variant="ghost">Cancel</AdminLink>
                </div>
            </div>

            {/* Photo */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
                <p className="text-sm text-zinc-300">Photo</p>
                <SafeImage src={image || null} alt="Product photo" className="w-full aspect-[4/3] rounded-lg border border-zinc-800" />

                <label className="block">
                    <span className="sr-only">Upload a photo</span>
                    <input
                        type="file"
                        accept="image/*"
                        disabled={uploading}
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadPhoto(file);
                        }}
                        className="block w-full text-sm text-zinc-400 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-white file:text-black file:font-semibold file:cursor-pointer"
                    />
                </label>
                {uploading && <p className="text-sm text-zinc-400">Uploading photo…</p>}
                {uploadError && <p role="alert" className="text-sm text-red-400">{uploadError}</p>}

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
        </form>
    );
}

function SaveButton({ disabled, isNew }: { disabled: boolean; isNew: boolean }) {
    const { pending } = useFormStatus();
    return (
        <AdminButton type="submit" disabled={disabled || pending}>
            {pending ? "Saving…" : isNew ? "Add product" : "Save changes"}
        </AdminButton>
    );
}
