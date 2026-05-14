import { prisma } from "../../lib/prisma";

type PageProps = {
    searchParams: Promise<{
        email?: string;
        trackingId?: string;
    }>;
};

export const metadata = {
    title: "Track Your Submission | Makram Distributions",
};

function statusInfo(status: string) {
    switch (status) {
        case "approved":
            return {
                label: "Approved",
                color: "text-green-400",
                bg: "bg-green-900/20 border-green-800",
                dot: "bg-green-500",
                message: "Your product has been approved for the next step in our distribution review process. We will be in touch with you shortly.",
            };
        case "rejected":
            return {
                label: "Not Moving Forward",
                color: "text-red-400",
                bg: "bg-red-900/20 border-red-800",
                dot: "bg-red-500",
                message: "After careful review, we are not moving forward with this product at this time. We appreciate your interest in Makram Distributions.",
            };
        case "reviewing":
            return {
                label: "Under Review",
                color: "text-blue-400",
                bg: "bg-blue-900/20 border-blue-800",
                dot: "bg-blue-500",
                message: "Your submission is currently being reviewed by our team. This process typically takes a few business days.",
            };
        default:
            return {
                label: "Pending Review",
                color: "text-yellow-400",
                bg: "bg-yellow-900/20 border-yellow-800",
                dot: "bg-yellow-500",
                message: "Your submission has been received and is in the queue for review. We will update you as soon as our team begins the evaluation.",
            };
    }
}

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
                sales: {
                    select: { quantity: true, revenue: true, createdAt: true },
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        if (!submission) {
            error = "No submission found. Please check your email and tracking ID.";
        }
    }

    const totalUnits = submission?.sales.reduce((sum, s) => sum + s.quantity, 0) ?? 0;
    const totalRevenue = submission?.sales.reduce((sum, s) => sum + s.revenue, 0) ?? 0;

    return (
        <main className="min-h-screen text-white bg-[radial-gradient(circle_at_top_left,#7a5a2a_0%,#2a2112_28%,#090806_65%,#000_100%)]">
            <section className="px-6 py-24 text-center">
                <div className="max-w-xl mx-auto">
                    <p className="text-sm uppercase tracking-[0.45em] text-amber-300/70 mb-4">
                        Submission Tracker
                    </p>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Track Your Submission
                    </h1>
                    <p className="text-stone-400 mb-10">
                        Enter the email address and tracking ID from your confirmation email to check your submission status.
                    </p>

                    {/* Lookup form */}
                    <form
                        action="/track"
                        method="GET"
                        className="bg-black/40 border border-amber-200/10 rounded-2xl p-6 text-left space-y-4 backdrop-blur-xl mb-8"
                    >
                        <div>
                            <label className="block text-sm text-amber-100 mb-1.5">Email Address</label>
                            <input
                                name="email"
                                type="email"
                                required
                                defaultValue={email || ""}
                                placeholder="you@example.com"
                                className="w-full bg-black/50 border border-amber-200/20 rounded-lg px-4 py-2.5 text-sm placeholder:text-stone-600 focus:outline-none focus:border-amber-200/40"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-amber-100 mb-1.5">Tracking ID</label>
                            <input
                                name="trackingId"
                                required
                                defaultValue={trackingId || ""}
                                placeholder="MKR-00001"
                                className="w-full bg-black/50 border border-amber-200/20 rounded-lg px-4 py-2.5 text-sm placeholder:text-stone-600 focus:outline-none focus:border-amber-200/40"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-amber-200 text-black py-2.5 rounded-lg font-semibold text-sm hover:bg-amber-100 transition"
                        >
                            Check Status
                        </button>
                    </form>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Result */}
                    {submission && (() => {
                        const info = statusInfo(submission.status);
                        return (
                            <div className="space-y-4 text-left">
                                {/* Status card */}
                                <div className={`border rounded-2xl p-6 ${info.bg}`}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-3 h-3 rounded-full ${info.dot}`} />
                                        <span className={`font-semibold text-lg ${info.color}`}>
                                            {info.label}
                                        </span>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <p className="text-sm text-gray-300">
                                            <span className="text-gray-500">Product: </span>
                                            {submission.productName}
                                        </p>
                                        {submission.companyName && (
                                            <p className="text-sm text-gray-300">
                                                <span className="text-gray-500">Company: </span>
                                                {submission.companyName}
                                            </p>
                                        )}
                                        <p className="text-sm text-gray-300">
                                            <span className="text-gray-500">Tracking ID: </span>
                                            {submission.trackingId}
                                        </p>
                                        <p className="text-sm text-gray-300">
                                            <span className="text-gray-500">Submitted: </span>
                                            {new Date(submission.createdAt).toLocaleDateString("en-US", {
                                                year: "numeric", month: "long", day: "numeric",
                                            })}
                                        </p>
                                    </div>

                                    <p className="text-sm text-stone-300 leading-relaxed border-t border-white/10 pt-4">
                                        {info.message}
                                    </p>
                                </div>

                                {/* Sales summary — only show if there are sales */}
                                {submission.sales.length > 0 && (
                                    <div className="bg-black/40 border border-amber-200/10 rounded-2xl p-6">
                                        <h2 className="text-lg font-semibold text-amber-100 mb-4">Sales Summary</h2>

                                        <div className="grid grid-cols-2 gap-4 mb-5">
                                            <div className="bg-white/5 rounded-xl p-4 text-center">
                                                <p className="text-2xl font-bold text-white">{totalUnits}</p>
                                                <p className="text-xs text-stone-500 mt-1">Total Units Sold</p>
                                            </div>
                                            <div className="bg-white/5 rounded-xl p-4 text-center">
                                                <p className="text-2xl font-bold text-green-400">${totalRevenue.toFixed(2)}</p>
                                                <p className="text-xs text-stone-500 mt-1">Total Revenue</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {submission.sales.map((sale, i) => (
                                                <div key={i} className="flex justify-between items-center text-sm py-2 border-b border-white/5 last:border-0">
                                                    <span className="text-gray-400">
                                                        {new Date(sale.createdAt).toLocaleDateString("en-US", {
                                                            month: "short", day: "numeric", year: "numeric",
                                                        })}
                                                    </span>
                                                    <span className="text-gray-300">{sale.quantity} units</span>
                                                    <span className="text-green-400 font-medium">${sale.revenue.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>
            </section>
        </main>
    );
}