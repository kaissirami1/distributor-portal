import { Resend } from "resend";

export const metadata = {
    title: "Contact",
};

const resend = new Resend(process.env.RESEND_API_KEY);

export default function ContactPage() {
    async function handleContact(formData: FormData) {
        "use server";

        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const company = formData.get("company") as string;
        const message = formData.get("message") as string;

        try {
            await resend.emails.send({
                from: "Makram Distributions <info@makramdistributions.com>",
                to: "info@makramdistributions.com",
                subject: "New Contact Message - Makram Distributions",
                html: `
          <div style="font-family: Arial; max-width:600px;">
            <h2>New Contact Message</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Company:</strong> ${company || "-"}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
          </div>
        `,
            });

            console.log("Contact email sent successfully");
        } catch (error) {
            console.error("CONTACT EMAIL ERROR:", error);
        }
    }

    return (
        <main className="min-h-screen text-white bg-[radial-gradient(circle_at_top_left,#7a5a2a_0%,#2a2112_28%,#090806_65%,#000_100%)]">
            <section className="px-6 py-24">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-sm uppercase tracking-[0.4em] text-amber-300/70 mb-4">
                            Contact
                        </p>

                        <h1 className="text-5xl md:text-6xl font-bold mb-5">
                            Contact Our Team
                        </h1>

                        <p className="text-stone-300 max-w-2xl mx-auto text-lg">
                            Have a question about distribution, product review, or working
                            with Makram Distributions? Send us a message.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <form
                            action={handleContact}
                            className="bg-black/40 border border-amber-200/10 rounded-[2rem] p-8 space-y-5 backdrop-blur-xl"
                        >
                            <input name="name" placeholder="Full Name *" className="input" required />
                            <input name="email" type="email" placeholder="Email *" className="input" required />
                            <input name="company" placeholder="Company Name" className="input" />

                            <textarea
                                name="message"
                                placeholder="How can we help?"
                                className="input min-h-36"
                                required
                            />

                            <button className="w-full bg-amber-200 text-black py-4 rounded-full font-semibold hover:bg-amber-100 transition">
                                Send Message
                            </button>
                        </form>

                        <div className="bg-black/35 border border-amber-200/10 rounded-[2rem] p-8">
                            <h2 className="text-2xl font-bold text-amber-100 mb-4">
                                Product Submissions
                            </h2>

                            <p className="text-stone-300 mb-6">
                                If you are ready to submit a product for review, use the product
                                application instead. That form allows you to upload images,
                                documents, barcode files, and product information.
                            </p>

                            <a
                                href="/submit"
                                className="inline-block bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition"
                            >
                                Submit Your Product
                            </a>

                            <div className="mt-10 text-stone-400 space-y-2">
                                <p>Email: info@makramdistributions.com</p>
                                <p>Phone: (000) 000-0000</p>
                                <p>California</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}