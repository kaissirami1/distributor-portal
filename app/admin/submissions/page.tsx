import { prisma } from "../../../lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import DeleteButton from "./DeleteButton";

export default async function AdminSubmissionsPage() {
    const cookieStore = await cookies();
    const isLoggedIn = cookieStore.get("admin-auth")?.value === "true";

    if (!isLoggedIn) {
        redirect("/admin/login");
    }

    const submissions = await prisma.submission.findMany({
        orderBy: { createdAt: "desc" },
    });

    async function updateStatus(formData: FormData) {
        "use server";

        const id = Number(formData.get("id"));
        const status = String(formData.get("status"));

        await prisma.submission.update({
            where: { id },
            data: { status },
        });

        revalidatePath("/admin/submissions");
    }

    async function deleteSubmission(formData: FormData) {
        "use server";

        const id = Number(formData.get("id"));

        await prisma.submission.delete({
            where: { id },
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
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Submitted Products</h1>

                <div className="flex gap-3">
                    <a
                        href="/admin/export"
                        className="bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        Export CSV
                    </a>

                    <form action={logout}>
                        <button className="bg-red-600 text-white px-4 py-2 rounded">
                            Logout
                        </button>
                    </form>
                </div>
            </div>

            <div className="overflow-x-auto border border-zinc-800 rounded-xl">
                <table className="w-full text-sm">
                    <thead className="bg-zinc-900 text-gray-300">
                        <tr>
                            <th className="text-left p-3">Date</th>
                            <th className="text-left p-3">Company</th>
                            <th className="text-left p-3">Product</th>
                            <th className="text-left p-3">Category</th>
                            <th className="text-left p-3">City</th>
                            <th className="text-left p-3">County</th>
                            <th className="text-left p-3">Status</th>
                            <th className="text-left p-3">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {submissions.map((submission) => (
                            <tr key={submission.id} className="border-t border-zinc-800">
                                <td className="p-3">
                                    {new Date(submission.createdAt).toLocaleDateString()}
                                </td>

                                <td className="p-3">{submission.companyName || "-"}</td>
                                <td className="p-3 font-medium">{submission.productName}</td>
                                <td className="p-3">{submission.category || "-"}</td>
                                <td className="p-3">{submission.city || "-"}</td>
                                <td className="p-3">{submission.county || "-"}</td>

                                <td className="p-3">
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
                                </td>

                                <td className="p-3">
                                    <div className="flex gap-2">
                                        <form action={updateStatus}>
                                            <input type="hidden" name="id" value={submission.id} />
                                            <input type="hidden" name="status" value="approved" />
                                            <button className="bg-green-600 text-white px-3 py-1 rounded">
                                                Approve
                                            </button>
                                        </form>

                                        <form action={updateStatus}>
                                            <input type="hidden" name="id" value={submission.id} />
                                            <input type="hidden" name="status" value="rejected" />
                                            <button className="bg-red-600 text-white px-3 py-1 rounded">
                                                Reject
                                            </button>
                                        </form>

                                        <Link
                                            href={`/admin/submissions/${submission.id}`}
                                            className="border px-3 py-1 rounded"
                                        >
                                            View
                                        </Link>

                                        <form action={deleteSubmission}>
                                            <input type="hidden" name="id" value={submission.id} />
                                            <DeleteButton />
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}