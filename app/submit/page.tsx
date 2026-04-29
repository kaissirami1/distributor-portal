import { prisma } from "../../lib/prisma";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { promises as fs } from "fs";
import path from "path";

export const metadata = {
    title: "Submit Your Product",
};

const resend = new Resend(process.env.RESEND_API_KEY);

export default function SubmitPage() {
    async function handleSubmit(formData: FormData) {
        "use server";

        async function saveFile(file: File | null) {
            if (!file || file.size === 0) return null;

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const uploadDir = path.join(process.cwd(), "public/uploads");
            await fs.mkdir(uploadDir, { recursive: true });

            const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
            const fileName = `${Date.now()}-${safeName}`;
            const filePath = path.join(uploadDir, fileName);

            await fs.writeFile(filePath, buffer);

            return `/uploads/${fileName}`;
        }

        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const phone = formData.get("phone") as string;
        const companyName = formData.get("companyName") as string;
        const productName = formData.get("productName") as string;
        const category = formData.get("category") as string;
        const minimumOrder = formData.get("minimumOrder") as string;
        const city = formData.get("city") as string;
        const county = formData.get("county") as string;
        const notes = formData.get("notes") as string;

        const productUrl = formData.get("productUrl") as string;
        const imageLink = formData.get("imageUrl") as string;
        const documentLink = formData.get("documentsUrl") as string;
        const barcodeText = formData.get("barcode") as string;

        const imageFile = formData.get("imageFile") as File | null;
        const documentsFile = formData.get("documentsFile") as File | null;
        const barcodeFile = formData.get("barcodeFile") as File | null;

        const uploadedImageUrl = await saveFile(imageFile);
        const uploadedDocumentsUrl = await saveFile(documentsFile);
        const uploadedBarcodeUrl = await saveFile(barcodeFile);

        const imageUrl = uploadedImageUrl || imageLink || "";
        const documentsUrl = uploadedDocumentsUrl || documentLink || "";
        const barcode = uploadedBarcodeUrl || barcodeText || "";

        await prisma.submission.create({
            data: {
                name,
                email,
                phone,
                companyName,
                productName,
                category,
                minimumOrder,
                city,
                county,
                notes,
                productUrl,
                imageUrl,
                documentsUrl,
                barcode,
            },
        });

        try {
            await resend.emails.send({
                from: "Makram Distributions <info@makramdistributions.com>",
                to: "info@makramdistributions.com",
                subject: "New Product Submission",
                html: `
      <div style="font-family: Arial; max-width:600px;">
        <h2>New Product Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "-"}</p>
        <p><strong>Company:</strong> ${companyName || "-"}</p>
        <p><strong>Product:</strong> ${productName}</p>
        <p><strong>Category:</strong> ${category || "-"}</p>
        <p><strong>Minimum Order:</strong> ${minimumOrder || "-"}</p>
        <p><strong>Product URL:</strong> ${productUrl || "-"}</p>
        <p><strong>Image:</strong> ${imageUrl || "-"}</p>
        <p><strong>Documents:</strong> ${documentsUrl || "-"}</p>
        <p><strong>Barcode:</strong> ${barcode || "-"}</p>
        <p><strong>City:</strong> ${city || "-"}</p>
        <p><strong>County:</strong> ${county || "-"}</p>
        <p><strong>Notes:</strong> ${notes || "-"}</p>
      </div>
    `,
            });

            console.log("Admin notification email sent successfully");
        } catch (error) {
            console.error("ADMIN NOTIFICATION EMAIL ERROR:", error);
        }

        redirect("/thank-you");
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
                        action={handleSubmit}
                        encType="multipart/form-data"
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
                                    <label className="block text-sm text-amber-100 mb-2">
                                        Product Image Upload
                                    </label>
                                    <input type="file" name="imageFile" accept="image/*" className="input" />
                                    <input name="imageUrl" placeholder="Or paste Product Image URL" className="input mt-3" />
                                </div>

                                <div className="rounded-2xl border border-amber-200/10 bg-black/30 p-5">
                                    <label className="block text-sm text-amber-100 mb-2">
                                        Documents Upload
                                    </label>
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
                                    <label className="block text-sm text-amber-100 mb-2">
                                        Barcode / UPC
                                    </label>
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

                        <div className="border-t border-amber-200/10 pt-6">
                            <button className="w-full bg-amber-200 text-black py-4 rounded-full font-semibold hover:bg-amber-100 transition">
                                Submit Application
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