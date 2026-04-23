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
        <div className="p-10">
            <h1 className="text-2xl font-bold mb-6">Submit Your Product</h1>

            <form action={handleSubmit} className="flex flex-col gap-4 max-w-md">
                <input name="name" placeholder="Your Name" className="border p-2" />
                <input name="email" placeholder="Email" className="border p-2" />
                <input name="companyName" placeholder="Company Name" className="border p-2" />
                <input name="productName" placeholder="Product Name" className="border p-2" />
                <input name="category" placeholder="Category" className="border p-2" />
                <input name="cost" placeholder="Cost" className="border p-2" />
                <input name="minimumOrder" placeholder="Minimum Order" className="border p-2" />
                <input name="city" placeholder="City" className="border p-2" />
                <input name="county" placeholder="County" className="border p-2" />
                <input
                    name="imageUrl"
                    placeholder="Image URL"
                    className="border p-2"
                />
                <textarea name="notes" placeholder="Notes" className="border p-2" />

                <button className="bg-black text-white p-2 rounded">
                    Submit
                </button>
            </form>
        </div>
    );
}