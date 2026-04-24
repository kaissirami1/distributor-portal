import { prisma } from "../../../../lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

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

    const submission = await prisma.submission.findUnique({
        where: {
            id: Number(id),
        },
    });

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
        <div className="p-10 max-w-3xl">
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
                    className="w-full h-80 object-cover rounded-xl mb-6"
                />
            )}

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3">
                <p><strong>Name:</strong> {submission.name}</p>
                <p><strong>Email:</strong> {submission.email}</p>
                <p><strong>Company:</strong> {submission.companyName || "-"}</p>
                <p><strong>Status:</strong> {submission.status}</p>
                <p><strong>Category:</strong> {submission.category || "-"}</p>
                <p><strong>Cost:</strong> {submission.cost || "-"}</p>
                <p><strong>Minimum Order:</strong> {submission.minimumOrder || "-"}</p>
                <p><strong>City:</strong> {submission.city || "-"}</p>
                <p><strong>County:</strong> {submission.county || "-"}</p>
                <p><strong>Notes:</strong> {submission.notes || "-"}</p>
                <p>
                    <strong>Created:</strong>{" "}
                    {new Date(submission.createdAt).toLocaleString()}
                </p>
            </div>
        </div>
    );
}