import { prisma } from "../../../lib/prisma";
import Link from "next/link";
import { SubmissionsClient } from "./SubmissionsClient";

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
                            { name: { contains: searchQuery, mode: "insensitive" } },
                            { email: { contains: searchQuery, mode: "insensitive" } },
                            { companyName: { contains: searchQuery, mode: "insensitive" } },
                            { productName: { contains: searchQuery, mode: "insensitive" } },
                            { category: { contains: searchQuery, mode: "insensitive" } },
                        ],
                    }
                    : {},
            ],
        },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            productName: true,
            companyName: true,
            email: true,
            status: true,
            createdAt: true,
            category: true,
            trackingId: true,
        },
    });

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
                method="GET"
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
                <button
                    type="submit"
                    className="bg-amber-200 text-black px-5 py-2 rounded font-semibold"
                >
                    Filter
                </button>
                <Link
                    href="/admin/submissions"
                    className="border border-zinc-700 px-5 py-2 rounded text-center"
                >
                    Reset
                </Link>
            </form>

            <SubmissionsClient
                submissions={submissions.map((s) => ({
                    ...s,
                    createdAt: s.createdAt.toISOString(),
                }))}
                statusFilter={statusFilter}
                searchQuery={searchQuery}
            />
        </div>
    );
}