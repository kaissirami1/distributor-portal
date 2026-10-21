import { ButtonLink, Card } from "@/components/ui";

export const metadata = {
    title: "Application Received",
};

type PageProps = {
    searchParams: Promise<{ id?: string }>;
};

export default async function ThankYouPage({ searchParams }: PageProps) {
    // The submit form sends the vendor here with their tracking ID, e.g. /thank-you?id=MKR-00012
    const { id: trackingId } = await searchParams;

    return (
        <section className="px-6 py-24 flex justify-center">
            <Card className="max-w-xl w-full text-center p-10 shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-green-900/40 border border-green-700 flex items-center justify-center mx-auto mb-5">
                    <span className="text-green-400 text-2xl">✓</span>
                </div>

                <h1 className="text-3xl font-bold mb-4">Application Received</h1>

                <p className="text-stone-400 mb-8">
                    Thank you for submitting your product. We'll review the information and
                    contact you if it looks like a good fit for distribution.
                </p>

                {trackingId && (
                    <div className="bg-black/40 border border-gold/20 rounded-2xl p-5 mb-8">
                        <p className="text-sm text-stone-400 mb-1">Your tracking ID</p>
                        <p className="text-2xl font-mono font-semibold text-gold">{trackingId}</p>
                        <p className="text-xs text-stone-500 mt-2">
                            Save this ID. We've also emailed it to you. Use it with your email
                            address to check your status anytime.
                        </p>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <ButtonLink href={trackingId ? `/track?trackingId=${encodeURIComponent(trackingId)}` : "/track"}>
                        Track My Submission
                    </ButtonLink>
                    <ButtonLink href="/submit" variant="outline">Submit Another Product</ButtonLink>
                </div>
            </Card>
        </section>
    );
}
