"use client";

import type { ButtonHTMLAttributes } from "react";

// A button that asks "Are you sure?" before it does anything.
// Use it for deleting things: <ConfirmButton message="Delete this note?" ...>
export function ConfirmButton({
    message,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { message: string }) {
    return (
        <button
            {...props}
            onClick={(e) => {
                if (!confirm(message)) e.preventDefault();
            }}
        />
    );
}
