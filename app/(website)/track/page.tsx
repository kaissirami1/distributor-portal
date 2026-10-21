import { prisma } from "@/lib/prisma";
import { getStatus } from "@/lib/status";
import { Button, Card, Field, PageHeader } from "@/components/ui";
import { DocumentChecklist } from "@/components/DocumentChecklist";
import { sellerSaveDocument } from "@/lib/documentActions";

// The status names and messages vendors see here are set in lib/status.ts.
// Sales are deliberately not shown to sellers: revenue is what stores paid us.

type PageProps = {
    searchParams: Promise<{
        email?: string;
        trackingId?: string;
    }>;
};

export const metadata = {
    title: "Track Your Submission",
};

const formatDate = (date: Date, month: "long" | "short" = "long") =>
    new Date(date).toLocaleDateString("en-US", { year: "numeric", month, day: "numeric" });

export default async function TrackPage({ searchParams }: PageProps) {
    const { email, trackingId } = await searchParams;

    let submission = null;
    let error = "";

    if (email && trackingId) {
        submission = await prisma.submission.findFirst({
            where: {
                email: { equals: email.trim(), mode: "insensitive" },
                trackingId: { equals: trackingId.trim(), mode: "insensitive" },
            },
            select: {
                productName: true,
                companyName: true,
                status: true,
                createdAt: true,
                trackingId: true,
                documents: { orderBy: { createdAt: "desc" } },
            },
        });

        if (!submission) {
            error = "No submission found. Please check your email and tracking ID.";
        }
    }

    const info = submission ? getStatus(submission.status) : null;

    return (
        <>
            <PageHeader
                eyebrow="Submission Tracker"
                title="Track Your Submission"
                text="Enter the email address and tracking ID from your confirmation email to check your submission status."
            />

            <section className="px-6 pb-24">
                <div className="max-w-xl mx-auto">
                    {/* Lookup form */}
                    <Card className="mb-8">
                        <form action="/track" method="GET" className="p-6 space-y-4">
                            <Field
                                label="Email Address"
                                name="email"
                                type="email"
                                required
                                defaultValue={email || ""}
                                placeholder="you@example.com"
                                autoComplete="email"
                            />
                            <Field
                                label="Tracking ID"
                                name="trackingId"
                                required
                                defaultValue={trackingId || ""}
                                placeholder="MKR-00001"
                            />
                            <Button type="submit" className="w-full">Check Status</Button>
                        </form>
                    </Card>

                    {error && (
                        <div role="alert" className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    {submission && info && (
                        <div className="space-y-4">
                            {/* Status */}
                            <div className={`border rounded-2xl p-6 ${info.panel}`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-3 h-3 rounded-full ${info.dot}`} />
                                    <span className={`font-semibold text-lg ${info.text}`}>{info.publicLabel}</span>
                                </div>

                                <dl className="space-y-2 mb-4 text-sm">
                                    <Detail label="Product" value={submission.productName} />
                                    {submission.companyName && <Detail label="Company" value={submission.companyName} />}
                                    <Detail label="Tracking ID" value={submission.trackingId} />
                                    <Detail label="Submitted" value={formatDate(submission.createdAt)} />
                                </dl>

                                <p className="text-sm text-stone-300 leading-relaxed border-t border-white/10 pt-4">
                                    {info.message}
                                </p>
                            </div>

                            {/* Documents the seller still needs to send (not shown once a product is declined) */}
                            {submission.status !== "rejected" && submission.trackingId && email && (
                                <Card className="p-6">
                                    <div id="documents" className="scroll-mt-28" />
                                    <h2 className="text-lg font-semibold text-gold-light mb-1">Documents we need</h2>
                                    <p className="text-sm text-stone-400 mb-4">
                                        Upload these so we can move forward. PDFs or photos, up to 4 MB each.
                                    </p>
                                    <DocumentChecklist
                                        documents={submission.documents.map((d) => ({ ...d, createdAt: d.createdAt.toISOString() }))}
                                        save={sellerSaveDocument.bind(null, email, submission.trackingId)}
                                    />
                                </Card>
                            )}

                        </div>
                    )}
                </div>
            </section>
        </>
    );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="text-stone-300">
            <dt className="inline text-stone-500">{label}: </dt>
            <dd className="inline">{value}</dd>
        </div>
    );
}
