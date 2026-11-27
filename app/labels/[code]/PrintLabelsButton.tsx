"use client";

export function PrintLabelsButton() {
    return (
        <button type="button" onClick={() => window.print()} className="px-5 py-2.5 rounded-lg font-semibold" style={{ background: "#111", color: "#fff" }}>
            Print labels
        </button>
    );
}
