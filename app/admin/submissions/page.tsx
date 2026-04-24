import { prisma } from "../../../lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

type SearchParams = Promise<{
    status?: string;
    q?: string;
}>;

export default async function AdminSubmissionsPage({
    searchParams,
}: {
    searchParams: SearchParams;
}) {
    const { status, q } = await searchParams;

    const cookieStore = await cookies();
    const isLoggedIn = cookieStore.get("admin-auth")?.value === "true";

    if (!isLoggedIn) {
        redirect("/admin/login");
    }

    const statusFilter = status;
    const searchQuery = q || "";

    const submissions = await prisma.submission.findMany({
        where: {
            AND: [
                statusFilter ? { status: statusFilter } : {},
                searchQuery
                    ? {
                        OR: [
                            { name: { contains: searchQuery } },
                            { companyName: { contains: searchQuery } },
                            { productName: { contains: searchQuery } },
                        ],
                    }
                    : {},
            ],
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    const totalCount = await prisma.submission.count();
    const pendingCount = await prisma.submission.count({
        where: { status: "pending" },
    });
    const approvedCount = await prisma.submission.count({
        where: { status: "approved" },
    });
    const rejectedCount = await prisma.submission.count({
        where: { status: "rejected" },
    });

    async function updateStatus(formData: FormData) {
        "use server";

        const id = Number(formData.get("id"));
        const status = formData.get("status") as string;

        await prisma.submission.update({
            where: { id },
            data: { status },
        });

        revalidatePath("/admin/submissions");
    }

    async function logout() {
        "use server";

        const cookieStore = await cookies();
        cookieStore.delete("admin-auth");

        redirect("/admin/login");
    }

    return (
        <div className="p-10">
            <form action={logout}>
                <button className="mb-4 bg-red-600 text-white px-4 py-2 rounded">
                    Logout
                </button>
            </form>

            <h1 className="text-2xl font-bold mb-6">Submitted Products</h1>

            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-gray-800 rounded">
                    <p className="text-sm text-gray-400">Total</p>
                    <p className="text-xl font-bold">{totalCount}</p>
                </div>

                <div className="p-4 bg-yellow-900 rounded">
                    <p className="text-sm text-yellow-300">Pending</p>
                    <p className="text-xl font-bold">{pendingCount}</p>
                </div>

                <div className="p-4 bg-green-900 rounded">
                    <p className="text-sm text-green-300">Approved</p>
                    <p className="text-xl font-bold">{approvedCount}</p>
                </div>

                <div className="p-4 bg-red-900 rounded">
                    <p className="text-sm text-red-300">Rejected</p>
                    <p className="text-xl font-bold">{rejectedCount}</p>
                </div>
            </div>

            <div className="flex gap-2 mb-4">
                <a href="/admin/submissions" className="px-3 py-1 border rounded">
                    All
                </a>

                <a
                    href="/admin/submissions?status=pending"
                    className="px-3 py-1 border rounded text-yellow-400"
                >
                    Pending
                </a>

                <a
                    href="/admin/submissions?status=approved"
                    className="px-3 py-1 border rounded text-green-500"
                >
                    Approved
                </a>

                <a
                    href="/admin/submissions?status=rejected"
                    className="px-3 py-1 border rounded text-red-500"
                >
                    Rejected
                </a>
            </div>

            <form action="/admin/submissions" className="mb-6 flex gap-2">
                {statusFilter && (
                    <input type="hidden" name="status" value={statusFilter} />
                )}

                <input
                    type="text"
                    name="q"
                    defaultValue={searchQuery}
                    placeholder="Search name, company, or product"
                    className="border rounded px-3 py-2 bg-transparent w-full max-w-md"
                />

                <button className="border rounded px-4 py-2">Search</button>
            </form>

            {submissions.length === 0 ? (
                <p>No submissions found.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {submissions.map((submission) => (
                        <div
                            key={submission.id}
                            className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-md hover:scale-[1.02] cursor-pointer transition"
                        >
                            <p>
                                <strong>Name:</strong> {submission.name}
                            </p>
                            <p>
                                <strong>Email:</strong> {submission.email}
                            </p>
                            <p>
                                <strong>Company:</strong> {submission.companyName || "-"}
                            </p>
                            <p>
                                <strong>Product:</strong> {submission.productName}
                            </p>

                            {submission.imageUrl && (
                                <img
                                    src={submission.imageUrl}
                                    alt="product"
                                    className="w-40 h-40 object-cover rounded mt-2 mb-3"
                                />
                            )}

                            <p>
                                <strong>Status:</strong>{" "}
                                <span
                                    className={
                                        submission.status === "approved"
                                            ? "text-green-500"
                                            : submission.status === "rejected"
                                                ? "text-red-500"
                                                : "text-yellow-400"
                                    }
                                >
                                    {submission.status}
                                </span>
                            </p>

                            <div className="flex gap-2 mt-3 mb-3">
                                <form action={updateStatus}>
                                    <input type="hidden" name="id" value={submission.id} />
                                    <input type="hidden" name="status" value="approved" />
                                    <button
                                        disabled={submission.status === "approved"}
                                        className={`px-3 py-1 rounded text-white ${submission.status === "approved"
                                            ? "bg-gray-600 cursor-not-allowed"
                                            : "bg-green-600"
                                            }`}
                                    >
                                        Approve
                                    </button>
                                </form>

                                <form action={updateStatus}>
                                    <input type="hidden" name="id" value={submission.id} />
                                    <input type="hidden" name="status" value="rejected" />
                                    <button
                                        disabled={submission.status === "rejected"}
                                        className={`px-3 py-1 rounded text-white ${submission.status === "rejected"
                                            ? "bg-gray-600 cursor-not-allowed"
                                            : "bg-red-600"
                                            }`}
                                    >
                                        Reject
                                    </button>
                                </form>
                            </div>
                            <div className="flex gap-2 mt-3 mb-3">
                                <form action={updateStatus}>
                                    <input type="hidden" name="id" value={submission.id} />
                                    <input type="hidden" name="status" value="approved" />
                                    <button>Approve</button>
                                </form>

                                <form action={updateStatus}>
                                    <input type="hidden" name="id" value={submission.id} />
                                    <input type="hidden" name="status" value="rejected" />
                                    <button>Reject</button>
                                </form>
                            </div>

                            {/* 👇 ADD THIS RIGHT HERE */}
                            <Link
                                href={`/admin/submissions/${submission.id}`}
                                className="inline-block mt-2 px-3 py-1 border rounded"
                            >
                                View Details
                            </Link>
                            <p>
                                <strong>Category:</strong> {submission.category || "-"}
                            </p>
                            <p>
                                <strong>Cost:</strong> {submission.cost || "-"}
                            </p>
                            <p>
                                <strong>Minimum Order:</strong>{" "}
                                {submission.minimumOrder || "-"}
                            </p>
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
                    ))}
                </div>
            )}
        </div>
    );
}