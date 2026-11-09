// Turns rows into a CSV file that opens in Excel, Google Sheets or Numbers.

type Cell = string | number | null | undefined | Date | { asText: string | null };

// Barcodes, SKUs and phone numbers: keep leading zeros, and stop Excel turning them into 1.00E+13
export const asText = (value: string | null | undefined): Cell => ({ asText: value ?? null });

function cell(value: Cell) {
    if (value === null || value === undefined) return "";
    if (typeof value === "object" && "asText" in value) {
        return value.asText ? `"=""${value.asText.replace(/"/g, '""""')}"""` : "";
    }
    if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
    let text = value instanceof Date ? value.toLocaleDateString("en-CA") : String(value);
    // Stop spreadsheet apps from treating text like "=SUM(...)" as a formula
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function csvResponse(name: string, headers: string[], rows: Cell[][]) {
    const lines = [headers, ...rows].map((row) => row.map(cell).join(","));
    const today = new Date().toLocaleDateString("en-CA");
    // The BOM at the start makes Excel read accents and symbols correctly
    return new Response("﻿" + lines.join("\r\n") + "\r\n", {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="makram-${name}-${today}.csv"`,
            "Cache-Control": "no-store",
        },
    });
}
