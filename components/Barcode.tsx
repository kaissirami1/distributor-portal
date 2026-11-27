"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

// A scannable Code 128 barcode, drawn in black on white. By default nothing is printed under it.
export function Barcode({ value, height = 90, showValue = false, className }: { value: string; height?: number; showValue?: boolean; className?: string }) {
    const ref = useRef<SVGSVGElement>(null);
    useEffect(() => {
        if (!ref.current) return;
        JsBarcode(ref.current, value, {
            format: "CODE128",
            width: 2.4,
            height,
            margin: 12,
            displayValue: showValue,
            background: "#ffffff",
            lineColor: "#000000",
        });
    }, [value, height, showValue]);
    return <svg ref={ref} className={className} role="img" aria-label={`Barcode ${value}`} />;
}
