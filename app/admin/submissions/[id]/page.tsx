import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { STATUSES, getStatus, statusInfo, type Status } from "@/lib/status";
import { changeSubmissionStatus } from "@/lib/submissions";
import { daysSince, formatDate, formatDateTime, timeAgo, waitingTone } from "@/lib/dates";
import { site } from "@/lib/site";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmButton } from "@/components/ConfirmButton";
import { SafeImage } from "@/components/admin/SafeImage";
import { AdminButton, AdminLink, Detail, EmptyState, PageHeader, Panel } from "@/components/admin/ui";
import { FileIcon, LinkIcon, MailIcon, PhoneIcon } from "@/components/admin/icons";

type PageProps = {
    params: Promise<{ id: string }>;
};

export const metadata = { title: "Submission" };

export default async function SubmissionDetailsPage({ params }: PageProps) {
    await requireAdmin();

    const { id } = await params;
    const submissionId = Number(id);

    const submission = Number.isInteger(submissionId)
        ? await prisma.submission.findUnique({
            where: { id: submissionId },
            include: {
                reviewNotes: { orderBy: { createdAt: "desc" } },
                statusEvents: { orderBy: { createdAt: "desc" } },
                sales: { orderBy: { createdAt: "desc" } },
            },
        })
        : null;

    // ── Actions on this page ────────────────────────────────────────────────

    async function changeStatus(formData: FormData) {
        "use server";
        await requireAdmin();
        const status = formData.get("status") as string;
        if (!STATUSES.includes(status as Status)) return;
        await changeSubmissionStatus([Number(formData.get("submissionId"))], status as Status);
        revalidatePath(`/admin/submissions/${formData.get("submissionId")}`);
        revalidatePath("/admin", "layout");
    }

    async function addReviewNote(formData: FormData) {
        "use server";
        await requireAdmin();
        const content = (formData.get("content") as string).trim();
        const subId = Number(formData.get("submissionId"));
        if (!content) return;
        await prisma.reviewNote.create({ data: { content, submissionId: subId } });
        revalidatePath(`/admin/submissions/${subId}`);
    }

    async function deleteNote(formData: FormData) {
        "use server";
        await requireAdmin();
        await prisma.reviewNote.delete({ where: { id: Number(formData.get("noteId")) } });
        revalidatePath(`/admin/submissions/${formData.get("submissionId")}`);
    }

    async function logSale(formData: FormData) {
        "use server";
        await requireAdmin();
        const subId = Number(formData.get("submissionId"));
        const quantity = Number(formData.get("quantity"));
        const revenue = parseFloat(formData.get("revenue") as string);
        const note = (formData.get("note") as string).trim();
        if (!quantity || !revenue) return;
        await prisma.sale.create({ data: { submissionId: subId, quantity, revenue, note: note || null } });
        revalidatePath(`/admin/submissions/${subId}`);
    }

    async function deleteSale(formData: FormData) {
        "use server";
        await requireAdmin();
        await prisma.sale.delete({ where: { id: Number(formData.get("saleId")) } });
        revalidatePath(`/admin/submissions/${formData.get("submissionId")}`);
    }

    if (!submission) {
        return (
            <EmptyState
                title="Submission not found"
                text="It may have been removed, or the link is wrong."
                action={<AdminLink href="/admin/submissions">Back to submissions</AdminLink>}
            />
        );
    }

    // ── What to show ────────────────────────────────────────────────────────

    const s = submission;
    const days = daysSince(s.createdAt);
    const firstName = s.name.trim().split(/\s+/)[0];
    const emailLink = `mailto:${s.email}?subject=${encodeURIComponent(`Your product submission: ${s.productName}`)}&body=${encodeURIComponent(`Hi ${firstName},\n\nThank you for submitting ${s.productName} to ${site.name}.\n\n`)}`;
    const barcodeIsFile = !!s.barcode && /^(https?:|\/uploads)/.test(s.barcode);
    const location = [s.city, s.county].filter(Boolean).join(", ");

    const activity = [
        ...s.reviewNotes.map((n) => ({ kind: "note" as const, id: n.id, createdAt: n.createdAt, content: n.content })),
        ...s.statusEvents.map((e) => ({ kind: "status" as const, id: e.id, createdAt: e.createdAt, fromStatus: e.fromStatus, toStatus: e.toStatus })),
        { kind: "received" as const, id: 0, createdAt: s.createdAt },
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const totalUnits = s.sales.reduce((sum, x) => sum + x.quantity, 0);
    const totalRevenue = s.sales.reduce((sum, x) => sum + x.revenue, 0);

    return (
        <div>
            <PageHeader
                back={{ href: "/admin/submissions", label: "All submissions" }}
                title={s.productName}
                description={
                    <div className="space-y-1">
                        <p>{s.companyName || s.name}</p>
                        <p className="text-sm">
                            Received {formatDate(s.createdAt)} ({timeAgo(s.createdAt)})
                            {s.status === "pending" && days > 0 && (
                                <span className={`ml-2 font-medium ${waitingTone(days)}`}>· waiting for your reply for {days} day{days === 1 ? "" : "s"}</span>
                            )}
                        </p>
                    </div>
                }
                actions={
                    <>
                        <AdminLink href={emailLink} variant="primary"><MailIcon className="w-4 h-4" /> Email {firstName}</AdminLink>
                        {s.phone && <AdminLink href={`tel:${s.phone}`}><PhoneIcon className="w-4 h-4" /> Call</AdminLink>}
                    </>
                }
            />

            <div className="grid lg:grid-cols-3 gap-6 items-start">
                {/* ── Left: the product ── */}
                <div className="lg:col-span-2 space-y-6 min-w-0">
                    <SafeImage src={s.imageUrl} alt={s.productName} className="w-full aspect-video rounded-xl border border-zinc-800" />

                    <Panel title="Product">
                        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
                            <Detail label="Category">{s.category}</Detail>
                            <Detail label="Cost per unit">{s.cost}</Detail>
                            <Detail label="Minimum order">{s.minimumOrder}</Detail>
                            <Detail label="Where they want to sell">{location}</Detail>
                            <Detail label="Product website">
                                {s.productUrl && (
                                    <a href={s.productUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-blue-400 hover:underline break-all">
                                        <LinkIcon className="w-4 h-4 shrink-0" /> {s.productUrl.replace(/^https?:\/\//, "")}
                                    </a>
                                )}
                            </Detail>
                            <Detail label="Documents">
                                {s.documentsUrl && (
                                    <a href={s.documentsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-blue-400 hover:underline">
                                        <FileIcon className="w-4 h-4 shrink-0" /> Open document
                                    </a>
                                )}
                            </Detail>
                            <Detail label="Barcode / UPC">
                                {s.barcode && (barcodeIsFile ? (
                                    <span className="block space-y-2">
                                        {!s.barcode.toLowerCase().endsWith(".pdf") && (
                                            <img src={s.barcode} alt="Barcode" className="w-56 max-h-40 object-contain rounded bg-white p-2" />
                                        )}
                                        <a href={s.barcode} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Open barcode file</a>
                                    </span>
                                ) : (
                                    <span className="font-mono">{s.barcode}</span>
                                ))}
                            </Detail>
                            <Detail label="Tracking ID"><span className="font-mono">{s.trackingId}</span></Detail>
                            <Detail label="Their notes" wide>
                                {s.notes && <span className="whitespace-pre-wrap">{s.notes}</span>}
                            </Detail>
                        </dl>
                    </Panel>

                    <Panel title="Contact">
                        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
                            <Detail label="Name">{s.name}</Detail>
                            <Detail label="Company">{s.companyName}</Detail>
                            <Detail label="Email">
                                <a href={emailLink} className="text-blue-400 hover:underline">{s.email}</a>
                            </Detail>
                            <Detail label="Phone">
                                {s.phone && <a href={`tel:${s.phone}`} className="text-blue-400 hover:underline">{s.phone}</a>}
                            </Detail>
                        </dl>
                    </Panel>

                    {/* Sales */}
                    <Panel title="Sales">
                        {s.sales.length > 0 && (
                            <div className="grid grid-cols-2 gap-4 mb-5">
                                <div className="bg-black/40 rounded-lg p-4">
                                    <p className="text-2xl font-bold tabular-nums">{totalUnits}</p>
                                    <p className="text-xs text-zinc-500 mt-1">Units sold</p>
                                </div>
                                <div className="bg-black/40 rounded-lg p-4">
                                    <p className="text-2xl font-bold tabular-nums text-green-400">${totalRevenue.toFixed(2)}</p>
                                    <p className="text-xs text-zinc-500 mt-1">Revenue</p>
                                </div>
                            </div>
                        )}

                        <form action={logSale} className="grid sm:grid-cols-[1fr_1fr_2fr_auto] gap-3 items-end mb-5">
                            <input type="hidden" name="submissionId" value={s.id} />
                            <label className="text-xs text-zinc-500">Units *
                                <input name="quantity" type="number" min="1" required placeholder="24" className="admin-input mt-1" />
                            </label>
                            <label className="text-xs text-zinc-500">Revenue ($) *
                                <input name="revenue" type="number" step="0.01" min="0" required placeholder="120.00" className="admin-input mt-1" />
                            </label>
                            <label className="text-xs text-zinc-500">Note
                                <input name="note" placeholder="e.g. Anaheim market" className="admin-input mt-1" />
                            </label>
                            <AdminButton type="submit">Log sale</AdminButton>
                        </form>

                        {s.sales.length === 0 ? (
                            <p className="text-sm text-zinc-500">No sales logged yet.</p>
                        ) : (
                            <ul className="divide-y divide-zinc-800">
                                {s.sales.map((sale) => (
                                    <li key={sale.id} className="flex items-center justify-between gap-3 py-2.5">
                                        <div>
                                            <p className="text-sm font-medium">
                                                {sale.quantity} units · <span className="text-green-400">${sale.revenue.toFixed(2)}</span>
                                            </p>
                                            <p className="text-xs text-zinc-500">{formatDate(sale.createdAt)}{sale.note ? ` · ${sale.note}` : ""}</p>
                                        </div>
                                        <form action={deleteSale}>
                                            <input type="hidden" name="saleId" value={sale.id} />
                                            <input type="hidden" name="submissionId" value={s.id} />
                                            <ConfirmButton message="Delete this sale?" type="submit" className="text-xs text-zinc-500 hover:text-red-400 px-2 py-1">
                                                Delete
                                            </ConfirmButton>
                                        </form>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>
                </div>

                {/* ── Right: decision and notes ── */}
                <div className="space-y-6 min-w-0 lg:sticky lg:top-6">
                    <Panel title="Status" action={<StatusBadge status={s.status} />}>
                        <form action={changeStatus} className="grid grid-cols-2 gap-2">
                            <input type="hidden" name="submissionId" value={s.id} />
                            {STATUSES.map((status) => {
                                const current = s.status === status;
                                const classes = `px-3 py-2 rounded-lg text-sm font-semibold border transition ${current
                                    ? "border-white bg-white/10 text-white cursor-default"
                                    : "border-zinc-700 text-zinc-300 hover:border-zinc-400 hover:text-white"}`;
                                const label = statusInfo[status].label;
                                // Approving or rejecting emails the vendor, so ask first
                                return status === "approved" || status === "rejected" ? (
                                    <ConfirmButton
                                        key={status}
                                        type="submit"
                                        name="status"
                                        value={status}
                                        disabled={current}
                                        message={`Mark as ${label.toLowerCase()}? ${firstName} will get an email at ${s.email}.`}
                                        className={classes}
                                    >
                                        {label}
                                    </ConfirmButton>
                                ) : (
                                    <button key={status} type="submit" name="status" value={status} disabled={current} className={classes}>
                                        {label}
                                    </button>
                                );
                            })}
                        </form>
                        <p className="text-xs text-zinc-500 mt-3">Approved and Rejected send {firstName} an email automatically.</p>
                    </Panel>

                    <Panel title="Notes & activity">
                        <form action={addReviewNote} className="mb-5">
                            <input type="hidden" name="submissionId" value={s.id} />
                            <textarea
                                name="content"
                                rows={3}
                                placeholder="Private note, e.g. 'Called, sending samples next week'"
                                className="admin-input resize-y"
                            />
                            <AdminButton type="submit" className="mt-2 w-full">Save note</AdminButton>
                        </form>

                        <ol className="space-y-4">
                            {activity.map((item) => (
                                <li key={`${item.kind}-${item.id}`} className="flex gap-3">
                                    <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${item.kind === "status" ? getStatus(item.toStatus).dot : item.kind === "note" ? "bg-zinc-400" : "bg-zinc-600"}`} />
                                    <div className="flex-1 min-w-0">
                                        {item.kind === "note" && (
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm whitespace-pre-wrap">{item.content}</p>
                                                <form action={deleteNote}>
                                                    <input type="hidden" name="noteId" value={item.id} />
                                                    <input type="hidden" name="submissionId" value={s.id} />
                                                    <ConfirmButton message="Delete this note?" type="submit" className="text-xs text-zinc-600 hover:text-red-400" title="Delete note">
                                                        ✕
                                                    </ConfirmButton>
                                                </form>
                                            </div>
                                        )}
                                        {item.kind === "status" && (
                                            <p className="text-sm text-zinc-300 flex flex-wrap items-center gap-1.5">
                                                Status <StatusBadge status={item.fromStatus} /> → <StatusBadge status={item.toStatus} />
                                            </p>
                                        )}
                                        {item.kind === "received" && <p className="text-sm text-zinc-300">Submitted through the website</p>}
                                        <p className="text-xs text-zinc-500 mt-0.5">{formatDateTime(item.createdAt)}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </Panel>
                </div>
            </div>
        </div>
    );
}
