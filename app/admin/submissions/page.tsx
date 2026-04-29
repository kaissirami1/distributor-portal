import { prisma } from "../../../lib/prisma";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type PageProps = {
    searchParams: Promise<{
        status?: string;
        q?: string;
    }>;
};

export default async function SubmissionsPage({ searchParams }: PageProps) {
    const { status, q } = await searchParams;

    const statusFilter = status || "all";
    const searchQuery = q || "";

    const submissions = await prisma.submission.findMany({
        where: {
            AND: [
                statusFilter !== "all" ? { status: statusFilter } : {},
                searchQuery
                    ? {
                        OR: [
                            { name: { contains: searchQuery } },
                            { email: { contains: searchQuery } },
                            { companyName: { contains: searchQuery } },
                            { productName: { contains: searchQuery } },
                            { category: { contains: searchQuery } },
                        ],
                    }
                    : {},
            ],
        },
        orderBy: { createdAt: "desc" },
    });

    async function updateStatus(formData: FormData) {
        "use server";

        const id = Number(formData.get("id"));
        const status = formData.get("status") as string;

        const updatedSubmission = await prisma.submission.update({
            where: { id },
            data: { status },
        });

        if (status === "approved") {
            await resend.emails.send({
                from: "Makram Distributions <onboarding@resend.dev>",
                to: updatedSubmission.email,
                subject: "Your product submission has been approved",
                html: `
          <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.6; max-width: 600px;">
            <h2>Makram Distributions</h2>
            <p>Hi ${updatedSubmission.name},</p>
            <p>
              We reviewed your product submission for
              <strong>${updatedSubmission.productName}</strong>.
            </p>
            <p>
              Your product has been approved for the next step in our distribution review process.
              We will contact you soon with more details.
            </p>
            <br/>
            <p>Best regards,<br/>Makram Distributions</p>
          </div>
        `,
            });
        }

        if (status === "rejected") {
            await resend.emails.send({
                from: "Makram Distributions <onboarding@resend.dev>",
                to: updatedSubmission.email,
                subject: "Update on your product submission",
                html: `
          <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.6; max-width: 600px;">
            <h2>Makram Distributions</h2>
            <p>Hi ${updatedSubmission.name},</p>
            <p>
              Thank you for submitting
              <strong>${updatedSubmission.productName}</strong>.
            </p>
            <p>
              After reviewing the information, we are not moving forward with this product at this time.
            </p>
            <p>
              We appreciate your interest and may reconsider in the future if there is a better fit.
            </p>
            <br/>
            <p>Best regards,<br/>Makram Distributions</p>
          </div>
        `,
            });
        }

        revalidatePath("/admin/submissions");
    }

    function getStatusColor(status: string) {
        switch (status) {
            case "approved":
                return "text-green-400";
            case "rejected":
                return "text-red-400";
            case "reviewing":
                return "text-blue-400";
            default:
                return "text-yellow-400";
        }
    }

    return (
        <div className="p-8">
            <div className="flex justify-between mb-6">
                <h1 className="text-3xl font-bold">Submissions</h1>

                <a
                    href="/admin/export"
                    className="bg-white text-black px-4 py-2 rounded font-semibold"
                >
                    Export Excel
                </a>
            </div>

            <form
                action="/admin/submissions"
                className="flex flex-col md:flex-row gap-3 mb-6"
            >
                <input
                    name="q"
                    defaultValue={searchQuery}
                    placeholder="Search name, email, company, product..."
                    className="bg-black/50 border border-zinc-700 rounded px-4 py-2 flex-1"
                />

                <select
                    name="status"
                    defaultValue={statusFilter}
                    className="bg-black/50 border border-zinc-700 rounded px-4 py-2"
                >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>

                <button className="bg-amber-200 text-black px-5 py-2 rounded font-semibold">
                    Filter
                </button>

                <Link
                    href="/admin/submissions"
                    className="border border-zinc-700 px-5 py-2 rounded text-center"
                >
                    Reset
                </Link>
            </form>

            <div className="space-y-4">
                {submissions.length === 0 ? (
                    <p className="text-gray-400">No submissions found.</p>
                ) : (
                    submissions.map((s) => (
                        <div
                            key={s.id}
                            className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col md:flex-row justify-between gap-4 md:items-center"
                        >
                            <div>
                                <p className="font-semibold">{s.productName}</p>
                                <p className="text-sm text-gray-400">{s.companyName || "-"}</p>
                                <p className="text-sm text-gray-500">{s.email}</p>
                                <p className={`text-sm ${getStatusColor(s.status)}`}>
                                    {s.status}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <form action={updateStatus}>
                                    <input type="hidden" name="id" value={s.id} />
                                    <input type="hidden" name="status" value="pending" />
                                    <button className="text-yellow-400 text-sm">Pending</button>
                                </form>

                                <form action={updateStatus}>
                                    <input type="hidden" name="id" value={s.id} />
                                    <input type="hidden" name="status" value="reviewing" />
                                    <button className="text-blue-400 text-sm">Review</button>
                                </form>

                                <form action={updateStatus}>
                                    <input type="hidden" name="id" value={s.id} />
                                    <input type="hidden" name="status" value="approved" />
                                    <button className="text-green-400 text-sm">Approve</button>
                                </form>

                                <form action={updateStatus}>
                                    <input type="hidden" name="id" value={s.id} />
                                    <input type="hidden" name="status" value="rejected" />
                                    <button className="text-red-400 text-sm">Reject</button>
                                </form>

                                <Link
                                    href={`/admin/submissions/${s.id}`}
                                    className="text-white text-sm underline"
                                >
                                    View
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}