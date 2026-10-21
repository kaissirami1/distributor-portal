"use client";

import { useState } from "react";
import { ImageIcon } from "./icons";

// Shows an image, or a clear placeholder if there isn't one or it fails to load
export function SafeImage({ src, alt, className = "" }: { src?: string | null; alt: string; className?: string }) {
    const [broken, setBroken] = useState(false);

    if (!src || broken) {
        return (
            <div className={`flex flex-col items-center justify-center gap-2 bg-zinc-900 text-zinc-500 text-sm text-center p-4 ${className}`}>
                <ImageIcon className="w-8 h-8" />
                <span>{src ? "This image couldn't be loaded" : "No image"}</span>
                {src && (
                    <a href={src} target="_blank" rel="noreferrer" className="text-xs text-blue-400 underline break-all">
                        Open the image link
                    </a>
                )}
            </div>
        );
    }

    return <img src={src} alt={alt} onError={() => setBroken(true)} className={`object-cover ${className}`} />;
}
