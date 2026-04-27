import Link from "next/link";

export default function ThankYouPage() {
    return (
        <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
            <div className="max-w-xl text-center bg-zinc-950 border border-zinc-800 rounded-3xl p-10 shadow-2xl">
                <div className="text-5xl mb-4">✅</div>

                <h1 className="text-3xl font-bold mb-4">Application Received</h1>

                <p className="text-gray-400 mb-8">
                    Thank you for submitting your product. We’ll review the information and
                    contact you if it looks like a good fit for distribution.
                </p>

                <Link
                    href="/submit"
                    className="inline-block bg-white text-black px-5 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                    Submit Another Product
                </Link>
            </div>
        </main>
    );
}