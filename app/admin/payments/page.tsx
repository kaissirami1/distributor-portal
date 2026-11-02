import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PAYMENT_METHODS, paymentStatus } from "@/lib/payments";
import { formatDate } from "@/lib/dates";
import { deleteBill, markBillPaid, markBillUnpaid, markSalePaid, markSaleUnpaid, saveBill, updateSaleBilling } from "@/lib/paymentActions";
import { ConfirmButton } from "@/components/ConfirmButton";
import { PaymentBadge } from "@/components/admin/PaymentBadge";
import { AdminButton, EmptyState, PageHeader, Panel, Stat } from "@/components/admin/ui";

export const metadata = { title: "Payments" };

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const dateValue = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default async function PaymentsPage() {
    await requireAdmin();

    const [sales, bills, stores, sellers, suppliers] = await Promise.all([
        prisma.sale.findMany({
            orderBy: { createdAt: "asc" },
            include: {
                store: { select: { id: true, name: true } },
                submission: { select: { id: true, productName: true } },
                inventoryItem: { select: { id: true, name: true } },
            },
        }),
        prisma.bill.findMany({ orderBy: { createdAt: "desc" } }),
        prisma.store.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
        prisma.submission.findMany({ where: { status: "approved" }, select: { companyName: true, name: true } }),
        prisma.inventoryItem.findMany({ where: { supplier: { not: null } }, select: { supplier: true } }),
    ]);

    // Suggestions for "Who you owe"
    const payees = [...new Set([...sellers.map((s) => s.companyName || s.name), ...suppliers.map((s) => s.supplier!)])].sort();

    const weekAhead = new Date();
    weekAhead.setDate(weekAhead.getDate() + 7);

    // Overdue first, then by due date (no due date last), then oldest first
    const byUrgency = <T extends { paidAt: Date | null; dueDate: Date | null; createdAt: Date }>(a: T, b: T) => {
        const rank = (x: T) => (paymentStatus(x) === "overdue" ? 0 : 1);
        if (rank(a) !== rank(b)) return rank(a) - rank(b);
        const due = (x: T) => x.dueDate?.getTime() ?? Infinity;
        if (due(a) !== due(b)) return due(a) - due(b);
        return a.createdAt.getTime() - b.createdAt.getTime();
    };

    const owedToUs = sales.filter((s) => !s.paidAt).sort(byUrgency);
    const weOwe = bills.filter((b) => !b.paidAt).sort(byUrgency);
    const overdueToUs = owedToUs.filter((s) => paymentStatus(s) === "overdue");
    const dueSoon = weOwe.filter((b) => b.dueDate && b.dueDate <= weekAhead);

    const recentlyPaid = [
        ...sales.filter((s) => s.paidAt).map((s) => ({ kind: "sale" as const, id: s.id, when: s.paidAt!, who: s.store?.name ?? "A customer", what: s.submission?.productName ?? s.inventoryItem?.name ?? "Sale", amount: s.revenue, method: s.paymentMethod })),
        ...bills.filter((b) => b.paidAt).map((b) => ({ kind: "bill" as const, id: b.id, when: b.paidAt!, who: b.payee, what: b.description ?? "Bill", amount: b.amount, method: b.paymentMethod })),
    ].sort((a, b) => b.when.getTime() - a.when.getTime()).slice(0, 15);

    const sum = (list: { revenue?: number; amount?: number }[]) => list.reduce((n, x) => n + (x.revenue ?? x.amount ?? 0), 0);
    const today = new Date().toLocaleDateString("en-CA");
    const input = "admin-input mt-1";

    const methodSelect = (
        <select name="paymentMethod" defaultValue="" aria-label="Paid by" className="admin-input w-auto py-1.5">
            <option value="">Paid by…</option>
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
    );

    return (
        <div className="space-y-8">
            <PageHeader title="Payments" description="Who owes you money, and whom you owe. Mark things paid as the money moves." />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Owed to you" value={money(sum(owedToUs))} tone="text-green-400" />
                <Stat label={`Overdue (${overdueToUs.length})`} value={money(sum(overdueToUs))} tone={overdueToUs.length ? "text-red-400" : "text-white"} />
                <Stat label="You owe" value={money(sum(weOwe))} tone={weOwe.length ? "text-amber-300" : "text-white"} />
                <Stat label={`Due within 7 days (${dueSoon.length})`} value={money(sum(dueSoon))} tone={dueSoon.length ? "text-amber-300" : "text-white"} />
            </div>

            {/* ── Owed to you ── */}
            <Panel title={`Owed to you (${owedToUs.length})`}>
                {owedToUs.length === 0 ? (
                    <p className="text-sm text-zinc-500">Nobody owes you anything right now. Unpaid sales show up here.</p>
                ) : (
                    <ul className="divide-y divide-zinc-800 -my-2">
                        {owedToUs.map((s) => (
                            <li key={s.id} className="py-3 space-y-2">
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                    <div className="flex-1 min-w-48">
                                        <p className="font-medium">
                                            {s.store ? <Link href={`/admin/stores/${s.store.id}`} className="hover:underline">{s.store.name}</Link> : <span className="text-zinc-400">No store set</span>}
                                        </p>
                                        <p className="text-xs text-zinc-500">
                                            {s.submission?.productName ?? s.inventoryItem?.name} · {s.quantity} units · sold {formatDate(s.createdAt)}
                                            {s.invoiceNumber && ` · Invoice ${s.invoiceNumber}`}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold tabular-nums">{money(s.revenue)}</p>
                                        <p className="text-xs text-zinc-500">{s.dueDate ? `due ${formatDate(s.dueDate)}` : "no due date"}</p>
                                    </div>
                                    <PaymentBadge item={s} />
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <form action={markSalePaid} className="flex flex-wrap items-center gap-2">
                                        <input type="hidden" name="saleId" value={s.id} />
                                        {methodSelect}
                                        <input name="paidOn" type="date" defaultValue={today} aria-label="Paid on" className="admin-input w-auto py-1.5" />
                                        <AdminButton type="submit" className="py-1.5">Mark paid</AdminButton>
                                    </form>
                                    <details className="text-sm">
                                        <summary className="cursor-pointer text-zinc-400 hover:text-white px-2 py-1.5">Edit store, invoice or due date</summary>
                                        <form action={updateSaleBilling} className="mt-2 grid sm:grid-cols-3 gap-2 items-end">
                                            <input type="hidden" name="saleId" value={s.id} />
                                            <label className="text-xs text-zinc-500">Store
                                                <select name="storeId" defaultValue={s.storeId ?? ""} className={input}>
                                                    <option value="">Not set</option>
                                                    {stores.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
                                                </select>
                                            </label>
                                            <label className="text-xs text-zinc-500">Invoice #
                                                <input name="invoiceNumber" defaultValue={s.invoiceNumber ?? ""} className={input} />
                                            </label>
                                            <label className="text-xs text-zinc-500">Due date
                                                <input name="dueDate" type="date" defaultValue={dateValue(s.dueDate)} className={input} />
                                            </label>
                                            <AdminButton type="submit" variant="secondary" className="sm:col-span-3 justify-self-start">Save</AdminButton>
                                        </form>
                                    </details>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Panel>

            {/* ── You owe ── */}
            <Panel title={`You owe (${weOwe.length})`}>
                {weOwe.length > 0 && (
                    <ul className="divide-y divide-zinc-800 -mt-2 mb-6">
                        {weOwe.map((b) => (
                            <li key={b.id} className="py-3 space-y-2">
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                    <div className="flex-1 min-w-48">
                                        <p className="font-medium">{b.payee}</p>
                                        <p className="text-xs text-zinc-500">
                                            {[b.description, b.reference && `Their invoice ${b.reference}`, `added ${formatDate(b.createdAt)}${b.author ? ` by ${b.author}` : ""}`].filter(Boolean).join(" · ")}
                                        </p>
                                        {b.notes && <p className="text-xs text-zinc-400 mt-1">{b.notes}</p>}
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold tabular-nums">{money(b.amount)}</p>
                                        <p className="text-xs text-zinc-500">{b.dueDate ? `due ${formatDate(b.dueDate)}` : "no due date"}</p>
                                    </div>
                                    <PaymentBadge item={b} />
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <form action={markBillPaid} className="flex flex-wrap items-center gap-2">
                                        <input type="hidden" name="billId" value={b.id} />
                                        {methodSelect}
                                        <input name="paidOn" type="date" defaultValue={today} aria-label="Paid on" className="admin-input w-auto py-1.5" />
                                        <AdminButton type="submit" className="py-1.5">Mark paid</AdminButton>
                                    </form>
                                    <form action={deleteBill}>
                                        <input type="hidden" name="billId" value={b.id} />
                                        <ConfirmButton message={`Delete the bill from ${b.payee}?`} type="submit" className="text-xs text-zinc-500 hover:text-red-400 px-2 py-1.5">
                                            Delete
                                        </ConfirmButton>
                                    </form>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <form action={saveBill} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end border-t border-zinc-800 pt-5">
                    <p className="sm:col-span-2 lg:col-span-4 text-sm font-medium">Add a bill you need to pay</p>
                    <label className="text-xs text-zinc-500">Who you owe *
                        <input name="payee" required list="payees" placeholder="Seller, warehouse, freight…" className={input} />
                        <datalist id="payees">{payees.map((p) => <option key={p} value={p} />)}</datalist>
                    </label>
                    <label className="text-xs text-zinc-500">Amount ($) *
                        <input name="amount" type="number" min="0.01" step="0.01" required className={input} />
                    </label>
                    <label className="text-xs text-zinc-500">Due date
                        <input name="dueDate" type="date" className={input} />
                    </label>
                    <label className="text-xs text-zinc-500">Their invoice #
                        <input name="reference" placeholder="Optional" className={input} />
                    </label>
                    <label className="text-xs text-zinc-500 sm:col-span-2">What for
                        <input name="description" placeholder="e.g. 2 pallets of za'atar, freight to Ontario" className={input} />
                    </label>
                    <label className="text-xs text-zinc-500 sm:col-span-2 lg:col-span-1">Notes
                        <input name="notes" placeholder="Optional" className={input} />
                    </label>
                    <AdminButton type="submit">Add bill</AdminButton>
                </form>
            </Panel>

            {/* ── Recently paid ── */}
            <Panel title="Recently paid">
                {recentlyPaid.length === 0 ? (
                    <EmptyState title="Nothing marked paid yet" />
                ) : (
                    <ul className="divide-y divide-zinc-800 -my-2">
                        {recentlyPaid.map((p) => (
                            <li key={`${p.kind}-${p.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 text-sm">
                                <span className="w-28 text-zinc-500">{formatDate(p.when)}</span>
                                <span className={`w-24 text-xs font-semibold ${p.kind === "sale" ? "text-green-400" : "text-amber-300"}`}>{p.kind === "sale" ? "Received" : "You paid"}</span>
                                <span className="flex-1 min-w-40">{p.who} <span className="text-zinc-500">· {p.what}{p.method ? ` · ${p.method}` : ""}</span></span>
                                <span className="tabular-nums w-24 text-right">{money(p.amount)}</span>
                                <form action={p.kind === "sale" ? markSaleUnpaid : markBillUnpaid}>
                                    <input type="hidden" name={p.kind === "sale" ? "saleId" : "billId"} value={p.id} />
                                    <ConfirmButton message="Mark this as not paid?" type="submit" className="text-xs text-zinc-500 hover:text-white px-2 py-1">Undo</ConfirmButton>
                                </form>
                            </li>
                        ))}
                    </ul>
                )}
            </Panel>
        </div>
    );
}
