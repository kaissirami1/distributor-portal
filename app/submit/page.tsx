"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SubmitPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function uploadFile(file: File): Promise<string> {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        return data.url;
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        setError("");

        const form = e.currentTarget;
        const fd = new FormData(form);

        try {
            // Upload files to Cloudinary
            const imageFile = fd.get("imageFile") as File | null;
            const docFile = fd.get("documentsFile") as File | null;
            const barcodeFile = fd.get("barcodeFile") as File | null;

            const imageUrl = imageFile?.size ? await uploadFile(imageFile) : (fd.get("imageUrl") as string) || "";
            const documentsUrl = docFile?.size ? await uploadFile(docFile) : (fd.get("documentsUrl") as string) || "";
            const barcode = barcodeFile?.size ? await uploadFile(barcodeFile) : (fd.get("barcode") as string) || "";

            const payload = {
                name: fd.get("name") as string,
                email: fd.get("email") as string,
                phone: fd.get("phone") as string,
                companyName: fd.get("companyName") as string,
                productName: fd.get("productName") as string,
                category: fd.get("category") as string,
                minimumOrder: fd.get("minimumOrder") as string,
                productUrl: fd.get("productUrl") as string,
                city: fd.get("city") as string,
                county: fd.get("county") as string,
                notes: fd.get("notes") as string,
                imageUrl,
                documentsUrl,
                barcode,
            };

            const res = await fetch("/api/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Submission failed");

            router.push("/thank-you");
        } catch (err) {
            console.error(err);
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen text-white bg-[radial-gradient(circle_at_top_left,#7a5a2a_0%,#2a2112_28%,#090806_65%,#000_100%)]">
            <section className="px-6 py-20">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-sm uppercase tracking-[0.4em] text-amber-300/70 mb-4">
                            Product Application
                        </p>
                        <h1 className="text-5xl md:text-6xl font-bold mb-5">
                            Submit Your Product
                        </h1>
                        <p className="text-stone-300 max-w-2xl mx-auto text-lg">
                            Share your product information, supporting documents, images, and
                            barcode details for distribution review.
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="bg-black/40 border border-amber-200/10 rounded-[2rem] p-8 md:p-10 space-y-10 backdrop-blur-xl shadow-2xl"
                    >
                        <section>
                            <h2 className="text-2xl font-semibold text-amber-100 mb-2">
                                Contact Information
                            </h2>
                            <p className="text-stone-400 mb-5">
                                Tell us who is submitting the product.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4">
                                <input name="name" placeholder="Full Name *" className="input" required />
                                <input name="email" type="email" placeholder="Email *" className="input" required />
                                <input name="phone" placeholder="Phone Number" className="input" />
                                <input name="companyName" placeholder="Company Name" className="input" />
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-amber-100 mb-2">
                                Product Details
                            </h2>
                            <p className="text-stone-400 mb-5">
                                Include the product name, category, minimum order, and any link
                                that helps us understand the item.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4">
                                <input name="productName" placeholder="Product Name *" className="input" required />
                                <input name="category" placeholder="Category" className="input" />
                                <input name="minimumOrder" placeholder="Minimum Order / MOQ" className="input" />
                                <input name="cost" placeholder="Cost per Unit (e.g. $4.99)" className="input" />
                                <input name="productUrl" placeholder="Product Website / URL" className="input" />
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-amber-100 mb-2">
                                Uploads & Supporting Files
                            </h2>
                            <p className="text-stone-400 mb-5">
                                Upload product images, spec sheets, sell sheets, Excel files, or
                                barcode files. You may also paste URLs if files are already
                                hosted online.
                            </p>
                            <div className="grid gap-5">
                                <div className="rounded-2xl border border-amber-200/10 bg-black/30 p-5">
                                    <label className="block text-sm text-amber-100 mb-2">Product Image Upload</label>
                                    <input type="file" name="imageFile" accept="image/*" className="input" />
                                    <input name="imageUrl" placeholder="Or paste Product Image URL" className="input mt-3" />
                                </div>

                                <div className="rounded-2xl border border-amber-200/10 bg-black/30 p-5">
                                    <label className="block text-sm text-amber-100 mb-2">Documents Upload</label>
                                    <p className="text-xs text-stone-500 mb-3">
                                        PDF, Excel, CSV, Word, image files, spec sheets, sell sheets
                                    </p>
                                    <input
                                        type="file"
                                        name="documentsFile"
                                        accept=".pdf,.xls,.xlsx,.csv,.doc,.docx,image/*"
                                        className="input"
                                    />
                                    <input name="documentsUrl" placeholder="Or paste Document / Spec Sheet URL" className="input mt-3" />
                                </div>

                                <div className="rounded-2xl border border-amber-200/10 bg-black/30 p-5">
                                    <label className="block text-sm text-amber-100 mb-2">Barcode / UPC</label>
                                    <p className="text-xs text-stone-500 mb-3">
                                        Upload barcode image/PDF or enter the UPC/barcode number.
                                    </p>
                                    <input type="file" name="barcodeFile" accept="image/*,.pdf" className="input" />
                                    <input name="barcode" placeholder="Or enter Barcode / UPC Number" className="input mt-3" />
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-amber-100 mb-2">
                                Target Location
                            </h2>
                            <p className="text-stone-400 mb-5">
                                Tell us where you are hoping to distribute or sell this product.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4">
                                <input name="city" placeholder="City" className="input" />
                                <input name="county" placeholder="County" className="input" />
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-amber-100 mb-2">
                                Additional Notes
                            </h2>
                            <textarea
                                name="notes"
                                placeholder="Share any important product details, retail goals, distribution needs, or special notes..."
                                className="input min-h-32"
                            />
                        </section>

                        {error && (
                            <p className="text-red-400 text-sm text-center">{error}</p>
                        )}

                        <div className="border-t border-amber-200/10 pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-amber-200 text-black py-4 rounded-full font-semibold hover:bg-amber-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Submitting..." : "Submit Application"}
                            </button>
                            <p className="text-xs text-stone-500 text-center mt-4">
                                All submissions are reviewed before any distribution decision is made.
                            </p>
                        </div>
                    </form>
                </div>
            </section>
        </main>
    );
}