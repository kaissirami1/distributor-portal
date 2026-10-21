// ─────────────────────────────────────────────────────────────────────────────
// The math behind Admin → Price Calculator: what one case costs to land in a
// California store, and what to charge stores for the margin we want.
// ─────────────────────────────────────────────────────────────────────────────

export type PricingInputs = {
    sellerPrice: number;     // seller's price per case ($)
    unitsPerCase: number;
    palletShipping: number;  // cost to ship one pallet to California ($)
    casesPerPallet: number;
    receiving: number;       // warehouse fee to receive a pallet ($)
    storage: number;         // warehouse storage per pallet, per month ($)
    months: number;          // how long a pallet sits in the warehouse
    orderFee: number;        // warehouse fee to pack and deliver one store order ($)
    casesPerOrder: number;   // cases in a typical store order
    margin: number;          // our margin (%)
    storeMargin: number;     // the store's margin on the shelf (%)
};

// The numbers the calculator starts with. Examples only, not real quotes.
export const EXAMPLE_INPUTS: PricingInputs = {
    sellerPrice: 30,
    unitsPerCase: 12,
    palletShipping: 600,
    casesPerPallet: 60,
    receiving: 15,
    storage: 25,
    months: 1,
    orderFee: 12,
    casesPerOrder: 5,
    margin: 25,
    storeMargin: 35,
};

export function calculatePrice(v: PricingInputs) {
    // Each shared cost is split across the cases it covers
    const freight = v.palletShipping / v.casesPerPallet;
    const warehouse = (v.receiving + v.storage * v.months) / v.casesPerPallet;
    const delivery = v.orderFee / v.casesPerOrder;
    const landed = v.sellerPrice + freight + warehouse + delivery;

    // Margin is our share of the price the store pays: at 25% we keep $25 of every $100
    const price = landed / (1 - v.margin / 100);
    const profit = price - landed;
    const unitPrice = price / v.unitsPerCase;
    const shelfPrice = unitPrice / (1 - v.storeMargin / 100);

    return {
        freight,
        warehouse,
        delivery,
        landed,
        price,
        unitPrice,
        shelfPrice,
        profit,
        profitPerOrder: profit * v.casesPerOrder,
        profitPerPallet: profit * v.casesPerPallet,
    };
}
