import { prisma } from "../../../lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function AdminProductsPage() {
    const cookieStore = await cookies();
    const isLoggedIn = cookieStore.get("admin-auth")?.value === "true";
    if (!isLoggedIn) redirect("/admin/login");

    const products = await prisma.product.findMany({
        orderBy: { createdAt: "desc" },
    });

    async function addProduct(formData: FormData) {
        "use server";
        const name = formData.get("name") as string;
        const description = formData.get("description") as string;
        const origin = formData.get("origin") as string;
        const image = formData.get("image") as string;

        if (!name.trim() || !description.trim() || !origin.trim()) return;

        await prisma.product.create({
            data: { name, description, origin, image: image || null },
        });

        revalidatePath("/admin/products");
        revalidatePath("/products");
    }

    async function deleteProduct(formData: FormData) {
        "use server";
        const id = Number(formData.get("id"));
        await prisma.product.delete({ where: { id } });
        revalidatePath("/admin/products");
        revalidatePath("/products");
    }

    return (
        <div className="p-8 max-w-5xl">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Products</h1>
                <a href="/products" target="_blank" className="text-sm text-gray-400 underline">
                    View public page ↗
                </a>
            </div>

            {/* Add product form */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
                <h2 className="text-lg font-semibold mb-4">Add Product</h2>
                <form action={addProduct} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-gray-400 block mb-1">Product Name *</label>
                            <input
                                name="name"
                                required
                                placeholder="e.g. Ashta Cream"
                                className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 block mb-1">Origin / Cuisine *</label>
                            <input
                                name="origin"
                                required
                                placeholder="e.g. Lebanese, Mexican, Italian"
                                className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 block mb-1">Description *</label>
                        <textarea
                            name="description"
                            required
                            placeholder="Short description of the product..."
                            rows={3}
                            className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-500 resize-none"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 block mb-1">Image URL (Cloudinary or any URL)</label>
                        <input
                            name="image"
                            placeholder="https://..."
                            className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-white text-black px-5 py-2 rounded font-semibold text-sm hover:bg-gray-100 transition"
                    >
                        Add Product
                    </button>
                </form>
            </div>

            {/* Products list */}
            <div className="space-y-3">
                {products.length === 0 ? (
                    <p className="text-gray-500 text-sm">No products yet. Add one above.</p>
                ) : (
                    products.map((p) => (
                        <div
                            key={p.id}
                            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex gap-4 items-start"
                        >
                            {p.image ? (
                                <img
                                    src={p.image}
                                    alt={p.name}
                                    className="w-20 h-20 object-cover rounded-lg border border-zinc-700 flex-shrink-0"
                                />
                            ) : (
                                <div className="w-20 h-20 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-zinc-600 text-xs">No image</span>
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-semibold">{p.name}</p>
                                        <span className="inline-block text-xs text-amber-300/70 border border-amber-300/20 rounded-full px-2 py-0.5 mt-1 mb-2">
                                            {p.origin}
                                        </span>
                                        <p className="text-sm text-gray-400 leading-relaxed">{p.description}</p>
                                    </div>
                                    <form action={deleteProduct} className="flex-shrink-0">
                                        <input type="hidden" name="id" value={p.id} />
                                        <button
                                            type="submit"
                                            className="text-zinc-600 hover:text-red-400 text-sm transition-colors"
                                            title="Delete product"
                                        >
                                            Delete
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}