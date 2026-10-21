import { site } from "@/lib/site";

type Product = {
    name: string;
    description: string;
    origin: string;
    image: string | null;
};

// Pre-filled email a retailer sends when they click "Request this Product"
function requestLink(productName: string) {
    const subject = `Product Request: ${productName}`;
    const body = `Hi ${site.name},\n\nI am interested in carrying ${productName} in my store.\n\nPlease send me more information about pricing and availability.\n\nThank you.`;
    return `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// One product in the catalog grid (homepage and products page)
export function ProductCard({ product }: { product: Product }) {
    return (
        <div className="bg-white/[0.04] border border-gold/10 rounded-3xl overflow-hidden hover:border-gold/25 transition group flex flex-col">
            <div className="aspect-[4/3] overflow-hidden bg-black/40 flex items-center justify-center">
                {product.image ? (
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                ) : (
                    <span className="text-stone-700 text-sm">No image</span>
                )}
            </div>
            <div className="p-5 flex flex-col flex-1">
                <span className="inline-block text-xs text-gold-dark/70 border border-gold-dark/20 rounded-full px-3 py-0.5 mb-3 self-start">
                    {product.origin}
                </span>
                <h3 className="font-semibold text-lg text-gold-light mb-2">{product.name}</h3>
                <p className="text-stone-400 text-sm leading-relaxed flex-1">{product.description}</p>
                <a
                    href={requestLink(product.name)}
                    className="mt-4 w-full text-center bg-gold/10 border border-gold/20 text-gold px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gold/20 transition"
                >
                    Request this Product
                </a>
            </div>
        </div>
    );
}
