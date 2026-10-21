import { PriceCalculator } from "./PriceCalculator";

export const metadata = { title: "Price Calculator" };

export default function PriceCalculatorPage() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-2">Price Calculator</h1>
            <p className="text-gray-400 mb-8 max-w-2xl">
                What one case costs to land in a California store, and what to charge stores for the margin we want.
            </p>
            <PriceCalculator />
        </div>
    );
}
