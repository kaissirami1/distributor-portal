import { prisma } from "../../../../lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";

type PageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function SubmissionDetailsPage({ params }: PageProps) {
    const cookieStore = await cookies();
    const isLoggedIn = cookieStore.get("admin-auth")?.value === "true";

    if (!isLoggedIn) {
        redirect("/admin/login");
    }

    const { id } = await params;
    const submissionId = Number(id);

    const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: {
            reviewNotes: {
                orderBy: {
                    createdAt: "desc",
                },
            },
        },
    });

    async function addReviewNote(formData: FormData) {
        "use server";

        const content = formData.get("content") as string;
        const submissionId = Number(formData.get("submissionId"));

        if (!content.trim()) return;

        await prisma.reviewNote.create({
            data: {
                content,
                submissionId,
            },
        });

        revalidatePath(`/admin/submissions/${submissionId}`);
    }

    if (!submission) {
        return (
            <div className="p-10">
                <p>Submission not found.</p>
                <Link href="/admin/submissions" className="underline">
                    Back to submissions
                </Link>
            </div>
        );
    }

    return (
        <div className="p-10 max-w-4xl">
            <Link href="/admin/submissions" className="underline">
                ← Back to submissions
            </Link>

            <h1 className="text-3xl font-bold mt-6 mb-4">
                {submission.productName}
            </h1>

            {submission.imageUrl && (
                <img
                    src={submission.imageUrl}
                    alt="product"
                    className="w-full max-h-80 object-cover rounded-xl mb-6 border border-zinc-700"
                />
            )}

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 mb-6">
                <p>
                    <strong>Name:</strong> {submission.name}
                </p>

                <p>
                    <strong>Email:</strong>{" "}
                    <a
                        href={`mailto:${submission.email}`}
                        className="text-blue-400 underline"
                    >
                        {submission.email}
                    </a>
                </p>

                <p>
                    <strong>Phone:</strong>{" "}
                    {submission.phone ? (
                        <a
                            href={`tel:${submission.phone}`}
                            className="text-blue-400 underline"
                        >
                            {submission.phone}
                        </a>
                    ) : (
                        "-"
                    )}
                </p>

                <p>
                    <strong>Company:</strong> {submission.companyName || "-"}
                </p>

                <p>
                    <strong>Status:</strong> {submission.status}
                </p>

                <p>
                    <strong>Category:</strong> {submission.category || "-"}
                </p>

                <p>
                    <strong>Minimum Order:</strong> {submission.minimumOrder || "-"}
                </p>

                <p>
                    <strong>Product URL:</strong>{" "}
                    {submission.productUrl ? (
                        <a
                            href={submission.productUrl}
                            target="_blank"
                            className="text-blue-400 underline"
                        >
                            Open product link
                        </a>
                    ) : (
                        "-"
                    )}
                </p>

                <p>
                    <strong>Documents:</strong>{" "}
                    {submission.documentsUrl ? (
                        <a
                            href={submission.documentsUrl}
                            target="_blank"
                            className="inline-block bg-white text-black px-3 py-1 rounded text-sm font-semibold"
                        >
                            Download / Open File
                        </a>
                    ) : (
                        "-"
                    )}
                </p>

                <div>
                    <p>
                        <strong>Barcode / UPC:</strong>
                    </p>

                    {submission.barcode ? (
                        submission.barcode.startsWith("/uploads") ? (
                            <div className="mt-2">
                                <img
                                    src={submission.barcode}
                                    alt="barcode"
                                    className="w-64 max-h-48 object-contain border border-zinc-700 rounded bg-white p-2"
                                />

                                <a
                                    href={submission.barcode}
                                    target="_blank"
                                    className="inline-block mt-2 text-blue-400 underline text-sm"
                                >
                                    Open barcode file
                                </a>
                            </div>
                        ) : (
                            <p className="mt-1">{submission.barcode}</p>
                        )
                    ) : (
                        <p className="mt-1">-</p>
                    )}
                </div>

                <p>
                    <strong>City:</strong> {submission.city || "-"}
                </p>

                <p>
                    <strong>County:</strong> {submission.county || "-"}
                </p>

                <p>
                    <strong>Notes:</strong> {submission.notes || "-"}
                </p>

                <p>
                    <strong>Created:</strong>{" "}
                    {new Date(submission.createdAt).toLocaleString()}
                </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">Review Notes</h2>

                <form action={addReviewNote} className="mb-6">
                    <input type="hidden" name="submissionId" value={submission.id} />

                    <textarea
                        name="content"
                        placeholder="Add a private review note..."
                        className="w-full min-h-28 bg-black border border-zinc-700 rounded p-3 mb-3"
                    />

                    <button className="bg-white text-black px-4 py-2 rounded font-semibold">
                        Save Note
                    </button>
                </form>

                {submission.reviewNotes.length === 0 ? (
                    <p className="text-gray-400">No review notes yet.</p>
                ) : (
                    <div className="space-y-3">
                        {submission.reviewNotes.map((note) => (
                            <div
                                key={note.id}
                                className="border border-zinc-800 rounded p-3 bg-black"
                            >
                                <p>{note.content}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                    {new Date(note.createdAt).toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}