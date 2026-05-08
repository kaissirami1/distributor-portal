import { prisma } from "../../../../lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";

type PageProps = {
    params: Promise<{ id: string }>;
};

function statusBadge(status: string) {
    const base = "inline-block px-2 py-0.5 rounded text-xs font-semibold";
    switch (status) {
        case "approved": return `${base} bg-green-900/50 text-green-400`;
        case "rejected": return `${base} bg-red-900/50 text-red-400`;
        case "reviewing": return `${base} bg-blue-900/50 text-blue-400`;
        default: return `${base} bg-yellow-900/50 text-yellow-400`;
    }
}

function statusDot(status: string) {
    switch (status) {
        case "approved": return "bg-green-500";
        case "rejected": return "bg-red-500";
        case "reviewing": return "bg-blue-500";
        default: return "bg-yellow-500";
    }
}

const STATUS_OPTIONS = ["pending", "reviewing", "approved", "rejected"];

export default async function SubmissionDetailsPage({ params }: PageProps) {
    const cookieStore = await cookies();
    const isLoggedIn = cookieStore.get("admin-auth")?.value === "true";
    if (!isLoggedIn) redirect("/admin/login");

    const { id } = await params;
    const submissionId = Number(id);

    const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: {
            reviewNotes: { orderBy: { createdAt: "asc" } },
            statusEvents: { orderBy: { createdAt: "asc" } },
        },
    });

    async function addReviewNote(formData: FormData) {
        "use server";
        const content = formData.get("content") as string;
        const subId = Number(formData.get("submissionId"));
        if (!content.trim()) return;
        await prisma.reviewNote.create({ data: { content, submissionId: subId } });
        revalidatePath(`/admin/submissions/${subId}`);
    }

    async function changeStatus(formData: FormData) {
        "use server";
        const subId = Number(formData.get("submissionId"));
        const newStatus = formData.get("status") as string;
        const current = await prisma.submission.findUnique({
            where: { id: subId },
            select: { status: true },
        });
        if (!current || current.status === newStatus) return;
        await prisma.$transaction([
            prisma.submission.update({ where: { id: subId }, data: { status: newStatus } }),
            prisma.statusEvent.create({
                data: { submissionId: subId, fromStatus: current.status, toStatus: newStatus },
            }),
        ]);
        revalidatePath(`/admin/submissions/${subId}`);
        revalidatePath("/admin/submissions");
    }

    async function deleteNote(formData: FormData) {
        "use server";
        const noteId = Number(formData.get("noteId"));
        const subId = Number(formData.get("submissionId"));
        await prisma.reviewNote.delete({ where: { id: noteId } });
        revalidatePath(`/admin/submissions/${subId}`);
    }

    if (!submission) {
        return (
            <div className="p-10">
                <p>Submission not found.</p>
                <Link href="/admin/submissions" className="underline">Back to submissions</Link>
            </div>
        );
    }

    type TimelineItem =
        | { kind: "note"; id: number; content: string; createdAt: Date }
        | { kind: "status"; id: number; fromStatus: string; toStatus: string; createdAt: Date };

    const timeline: TimelineItem[] = [
        ...submission.reviewNotes.map((n) => ({
            kind: "note" as const,
            id: n.id,
            content: n.content,
            createdAt: n.createdAt,
        })),
        ...submission.statusEvents.map((e) => ({
            kind: "status" as const,
            id: e.id,
            fromStatus: e.fromStatus,
            toStatus: e.toStatus,
            createdAt: e.createdAt,
        })),
    ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return (
        <div className="p-10 max-w-4xl">
            <Link href="/admin/submissions" className="text-gray-400 hover:text-white text-sm">
                ← Back to submissions
            </Link>

            <div className="flex flex-wrap items-start justify-between gap-4 mt-6 mb-4">
                <div>
                    <h1 className="text-3xl font-bold">{submission.productName}</h1>
                    <p className="text-gray-400 mt-1">{submission.companyName || ""}</p>
                </div>
                <span className={statusBadge(submission.status)}>{submission.status}</span>
            </div>

            {/* Status changer */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
                <p className="text-sm font-semibold text-gray-400 mb-3">Change Status</p>
                <form action={changeStatus} className="flex flex-wrap gap-2">
                    <input type="hidden" name="submissionId" value={submission.id} />
                    {STATUS_OPTIONS.map((s) => (
                        <button
                            key={s}
                            name="status"
                            value={s}
                            className={`px-4 py-1.5 rounded text-sm font-semibold border transition-colors ${submission.status === s
                                ? "border-white text-white bg-white/10 cursor-default"
                                : "border-zinc-700 text-gray-400 hover:border-zinc-400 hover:text-white"
                                }`}
                        >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </form>
            </div>

            {/* Product image */}
            {submission.imageUrl && (
                <img
                    src={submission.imageUrl}
                    alt="product"
                    className="w-full max-h-80 object-cover rounded-xl mb-6 border border-zinc-700"
                />
            )}

            {/* Details */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3 mb-6">
                <DetailRow label="Name" value={submission.name} />
                <DetailRow label="Email" value={
                    <a href={`mailto:${submission.email}`} className="text-blue-400 underline">{submission.email}</a>
                } />
                <DetailRow label="Phone" value={
                    submission.phone
                        ? <a href={`tel:${submission.phone}`} className="text-blue-400 underline">{submission.phone}</a>
                        : "—"
                } />
                <DetailRow label="Company" value={submission.companyName} />
                <DetailRow label="Category" value={submission.category} />
                <DetailRow label="Cost" value={submission.cost} />
                <DetailRow label="Min. Order" value={submission.minimumOrder} />
                <DetailRow label="Product URL" value={
                    submission.productUrl
                        ? <a href={submission.productUrl} target="_blank" className="text-blue-400 underline">Open product link</a>
                        : "—"
                } />
                <DetailRow label="Documents" value={
                    submission.documentsUrl
                        ? <a href={submission.documentsUrl} target="_blank" className="inline-block bg-white text-black px-3 py-1 rounded text-sm font-semibold">Download / Open File</a>
                        : "—"
                } />
                <div>
                    <span className="text-sm text-gray-400 font-medium">Barcode / UPC: </span>
                    {submission.barcode ? (
                        submission.barcode.startsWith("/uploads") ? (
                            <div className="mt-2">
                                <img src={submission.barcode} alt="barcode" className="w-64 max-h-48 object-contain border border-zinc-700 rounded bg-white p-2" />
                                <a href={submission.barcode} target="_blank" className="inline-block mt-2 text-blue-400 underline text-sm">Open barcode file</a>
                            </div>
                        ) : <span className="text-sm">{submission.barcode}</span>
                    ) : <span className="text-sm text-gray-600">—</span>}
                </div>
                <DetailRow label="City" value={submission.city} />
                <DetailRow label="County" value={submission.county} />
                <DetailRow label="Notes" value={submission.notes} />
                <DetailRow label="Tracking ID" value={submission.trackingId || "—"} />
            </div>

            {/* Activity timeline */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-5">Activity</h2>

                <form action={addReviewNote} className="mb-6">
                    <input type="hidden" name="submissionId" value={submission.id} />
                    <textarea
                        name="content"
                        placeholder="Add a private review note..."
                        className="w-full min-h-24 bg-black border border-zinc-700 rounded p-3 mb-3 resize-y focus:border-zinc-500 focus:outline-none"
                    />
                    <button className="bg-white text-black px-4 py-2 rounded font-semibold text-sm">
                        Save Note
                    </button>
                </form>

                {timeline.length === 0 ? (
                    <p className="text-gray-500 text-sm">No activity yet.</p>
                ) : (
                    <div className="relative">
                        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-zinc-800" />
                        <div className="space-y-5">
                            {timeline.map((item) =>
                                item.kind === "note" ? (
                                    <div key={`note-${item.id}`} className="flex gap-4">
                                        <div className="flex-shrink-0 w-4 h-4 rounded-full bg-zinc-700 border border-zinc-500 mt-1 z-10" />
                                        <div className="flex-1 bg-black border border-zinc-800 rounded-lg p-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm leading-relaxed">{item.content}</p>
                                                <form action={deleteNote} className="flex-shrink-0">
                                                    <input type="hidden" name="noteId" value={item.id} />
                                                    <input type="hidden" name="submissionId" value={submission.id} />
                                                    <button type="submit" className="text-zinc-600 hover:text-red-400 text-xs transition-colors" title="Delete note">✕</button>
                                                </form>
                                            </div>
                                            <p className="text-xs text-gray-600 mt-2">{new Date(item.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div key={`status-${item.id}`} className="flex gap-4 items-center">
                                        <div className={`flex-shrink-0 w-4 h-4 rounded-full ${statusDot(item.toStatus)} z-10`} />
                                        <div className="flex-1 flex flex-wrap items-center gap-2 text-sm text-gray-400">
                                            <span>Status changed</span>
                                            <span className={statusBadge(item.fromStatus)}>{item.fromStatus}</span>
                                            <span>→</span>
                                            <span className={statusBadge(item.toStatus)}>{item.toStatus}</span>
                                            <span className="text-xs text-gray-600 ml-auto">{new Date(item.createdAt).toLocaleString()}</span>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode | string | null | undefined }) {
    return (
        <div>
            <span className="text-sm text-gray-400 font-medium">{label}: </span>
            <span className="text-sm">{value ?? <span className="text-gray-600">—</span>}</span>
        </div>
    );
}