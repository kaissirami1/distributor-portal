import { prisma } from "../../lib/prisma";
import { redirect } from "next/navigation";
import { Resend } from "resend";

export const metadata = {
    title: "Submit Your Product",
};

const resend = new Resend(process.env.RESEND_API_KEY);

export default function SubmitPage() {
    async function handleSubmit(formData: FormData) {
        "use server";

        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const phone = formData.get("phone") as string;
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
                phone,
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

        // User confirmation email
        await resend.emails.send({
            from: "Makram Distributions <onboarding@resend.dev>",
            to: email,
            subject: "We received your product submission",
            html: `
        <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.6; max-width: 600px;">
          <h2 style="margin-bottom: 8px;">Makram Distributions</h2>
          <hr style="border: none; border-top: 1px solid #ddd;" />

          <p>Hi ${name},</p>

          <p>
            Thank you for submitting your product application to Makram Distributions.
            We have received your information and will review it carefully.
          </p>

          <p>
            If your product looks like a good fit for distribution, we will contact you
            with the next steps.
          </p>

          <p style="margin-top: 24px;">
            Best regards,<br />
            Makram Distributions
          </p>
        </div>
      `,
        });

        // Admin notification email
        await resend.emails.send({
            from: "Makram Distributions <onboarding@resend.dev>",
            to: "YOUR_EMAIL_HERE@gmail.com",
            subject: "New Product Submission",
            html: `
        <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.6; max-width: 600px;">
          <h2 style="margin-bottom: 8px;">New Product Submission</h2>
          <hr style="border: none; border-top: 1px solid #ddd;" />

          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || "-"}</p>
          <p><strong>Company:</strong> ${companyName || "-"}</p>
          <p><strong>Product:</strong> ${productName}</p>
          <p><strong>Category:</strong> ${category || "-"}</p>
          <p><strong>Wholesale Cost:</strong> ${cost || "-"}</p>
          <p><strong>Minimum Order:</strong> ${minimumOrder || "-"}</p>
          <p><strong>City:</strong> ${city || "-"}</p>
          <p><strong>County:</strong> ${county || "-"}</p>
          <p><strong>Image URL:</strong> ${imageUrl || "-"}</p>
          <p><strong>Notes:</strong> ${notes || "-"}</p>

          <p style="margin-top: 24px;">
            Review this submission in your Makram Distributions admin dashboard.
          </p>
        </div>
      `,
        });

        redirect("/thank-you");
    }

    return (
        <main className="min-h-screen bg-black text-white">
            <nav className="border-b border-zinc-800 px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">

                    <div className="font-bold tracking-wide text-white">
                        Makram Distributions
                    </div>

                    <div className="flex gap-6 text-sm text-gray-400">
                        <a href="/submit" className="hover:text-white transition">
                            Submit
                        </a>
                        <a href="/admin/login" className="hover:text-white transition">
                            Admin
                        </a>
                    </div>

                </div>
            </nav>

            <div className="px-6 py-12">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-10">
                        <p className="text-sm uppercase tracking-[0.3em] text-gray-500">
                            Distributor Application
                        </p>

                        <h1 className="text-4xl md:text-5xl font-bold mt-3">
                            Submit Your Product
                        </h1>

                        <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
                            Share your product details so we can review whether it is a good fit
                            for distribution.
                        </p>
                    </div>

                    <form
                        action={handleSubmit}
                        className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-8 shadow-2xl"
                    >
                        <section>
                            <h2 className="text-xl font-semibold mb-4">
                                Contact Information
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input required name="name" placeholder="Full Name *" className="input" />
                                <input required type="email" name="email" placeholder="Email *" className="input" />
                                <input name="phone" placeholder="Phone Number" className="input" />
                                <input required name="companyName" placeholder="Company Name *" className="input md:col-span-2" />
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-4">Product Details</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input required name="productName" placeholder="Product Name *" className="input" />
                                <input required name="category" placeholder="Category *" className="input" />
                                <input name="cost" placeholder="Wholesale Cost" className="input" />
                                <input name="minimumOrder" placeholder="Minimum Order" className="input" />
                                <input name="imageUrl" placeholder="Product Image URL" className="input md:col-span-2" />
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-4">Target Location</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input name="city" placeholder="City" className="input" />
                                <input name="county" placeholder="County" className="input" />
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-4">Additional Notes</h2>

                            <textarea
                                name="notes"
                                placeholder="Tell us anything important about your product..."
                                className="input min-h-32"
                            />
                        </section>

                        <button className="w-full bg-white text-black rounded-xl p-4 font-semibold hover:bg-gray-200 transition">
                            Submit Application
                        </button>

                        <p className="text-xs text-gray-500 text-center">
                            Fields marked with * are required.
                        </p>
                    </form>
                </div>
            </div>
        </main>
    );
}