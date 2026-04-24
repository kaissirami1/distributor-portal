import { prisma } from "../../lib/prisma";
import { redirect } from "next/navigation";

export default function SubmitPage() {
    async function handleSubmit(formData: FormData) {
        "use server";

        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const companyName = formData.get("companyName") as string;
        const productName = formData.get("productName") as string;
        const category = formData.get("category") as string;
        const cost = formData.get("cost") as string;
        const minimumOrder = formData.get("minimumOrder") as string;
        const city = formData.get("city") as string;
        const county = formData.get("county") as string;
        const notes = formData.get("notes") as string;
        const imageUrl = formData.get("imageUrl") as string;

        await prisma.submission.create({
            data: {
                name,
                email,
                companyName,
                productName,
                category,
                cost,
                minimumOrder,
                city,
                county,
                notes,
                imageUrl,
            },
        });

        redirect("/thank-you");
    }



    return (
        <main className="min-h-screen bg-black text-white px-6 py-12">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <p className="text-sm uppercase tracking-widest text-gray-400">
                        Distributor Application
                    </p>
                    <h1 className="text-4xl font-bold mt-2">Submit Your Product</h1>
                    <p className="text-gray-400 mt-3">
                        Share your product details so we can review if it is a good fit for distribution.
                    </p>
                </div>

                <form
                    action={handleSubmit}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5 shadow-lg"
                >
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Contact Information</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="name" placeholder="Your Name" className="border border-zinc-700 bg-black rounded p-3" />
                            <input name="email" placeholder="Email" className="border border-zinc-700 bg-black rounded p-3" />
                            <input name="companyName" placeholder="Company Name" className="border border-zinc-700 bg-black rounded p-3 md:col-span-2" />
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold mb-4">Product Details</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="productName" placeholder="Product Name" className="border border-zinc-700 bg-black rounded p-3" />
                            <input name="category" placeholder="Category" className="border border-zinc-700 bg-black rounded p-3" />
                            <input name="cost" placeholder="Wholesale Cost" className="border border-zinc-700 bg-black rounded p-3" />
                            <input name="minimumOrder" placeholder="Minimum Order" className="border border-zinc-700 bg-black rounded p-3" />
                            <input name="imageUrl" placeholder="Product Image URL" className="border border-zinc-700 bg-black rounded p-3 md:col-span-2" />
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold mb-4">Location</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="city" placeholder="City" className="border border-zinc-700 bg-black rounded p-3" />
                            <input name="county" placeholder="County" className="border border-zinc-700 bg-black rounded p-3" />
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold mb-4">Additional Notes</h2>

                        <textarea
                            name="notes"
                            placeholder="Tell us anything important about your product..."
                            className="w-full border border-zinc-700 bg-black rounded p-3 min-h-32"
                        />
                    </div>

                    <button className="w-full bg-white text-black rounded p-3 font-semibold hover:bg-gray-200 transition">
                        Submit Application
                    </button>
                </form>
            </div>
        </main>
    );
}