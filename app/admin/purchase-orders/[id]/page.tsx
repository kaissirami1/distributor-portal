import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { site } from "@/lib/site";
import { formatDate } from "@/lib/dates";
import { money, plural } from "@/lib/inventory";
import { casesText, orderCases, orderTotal, payBy, poNumber, poStatus, receivedTotal, termsLabel } from "@/lib/purchaseOrders";
import { ConfirmButton } from "@/components/ConfirmButton";
import { PaymentBadge } from "@/components/admin/PaymentBadge";
import { AdminButton, AdminLink, Detail, PageHeader, Panel } from "@/components/admin/ui";
import { CheckIcon } from "@/components/admin/icons";
import { deleteOrder, markShipped, receiveOrder, setOrderStatus } from "../actions";
import { PurchaseOrderForm } from "../PurchaseOrderForm";
import { MessageBox, PrintButton } from "../OrderTools";
import { PoStatusBadge } from "../PoStatusBadge";

export const metadata = { title: "Purchase order" };

type PageProps = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ edit?: string; saved?: string; status?: string; error?: string }>;
};

const NOTICES: Record<string, string> = {
    saved: "Saved.",
    sent: "Marked as sent to the seller.",
    confirmed: "Marked as confirmed by the seller.",
    shipped: "Marked as shipped.",
    received: "Arrived: the stock is in Inventory and the bill is in Payments.",
    cancelled: "Order cancelled.",
    draft: "Reopened as a draft.",
};

const ERRORS: Record<string, string> = {
    received: "Enter how many of each product arrived, as whole numbers (0 if none came).",
    nothing: "Enter how many cases arrived. If nothing came, leave the order as it is.",
};

const STEPS = [
    { key: "draft", label: "Made", at: "createdAt" },
    { key: "sent", label: "Sent", at: "sentAt" },
    { key: "confirmed", label: "Confirmed", at: "confirmedAt" },
    { key: "shipped", label: "Shipped", at: "shippedAt" },
    { key: "received", label: "Arrived", at: "receivedAt" },
] as const;

// The date box format, for California's calendar day
const dayValue = (d: Date | null) => (d ? d.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" }) : "");

export default async function PurchaseOrderPage({ params, searchParams }: PageProps) {
    const admin = await requireAdmin();
    const { id } = await params;
    const { edit, saved, status: changed, error } = await searchParams;

    const order = await prisma.purchaseOrder.findUnique({
        where: { id: Number(id) || 0 },
        include: { lines: { include: { item: { select: { id: true, quantity: true } } }, orderBy: { id: "asc" } }, seller: true, bill: true },
    });
    if (!order) notFound();

    const number = poNumber(order.id);
    const status = poStatus(order.status);
    const editable = ["draft", "sent", "confirmed"].includes(order.status);
    const open = ["draft", "sent", "confirmed", "shipped"].includes(order.status);
    const received = order.status === "received";

    // ── Edit mode ───────────────────────────────────────────────────────────
    if (edit && editable) {
        const [sellers, items] = await Promise.all([
            prisma.seller.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
            prisma.inventoryItem.findMany({ select: { id: true, name: true, unit: true, cost: true, casesPerPallet: true, sellerId: true }, orderBy: { name: "asc" } }),
        ]);
        return (
            <div>
                <PageHeader back={{ href: `/admin/purchase-orders/${order.id}`, label: number }} title={`Edit ${number}`} />
                <PurchaseOrderForm
                    sellers={sellers}
                    items={items}
                    order={{
                        id: order.id,
                        sellerId: order.sellerId,
                        shipTo: order.shipTo,
                        wantedBy: dayValue(order.wantedBy) || null,
                        termsDays: order.termsDays,
                        notes: order.notes,
                        lines: order.lines.map((l) => ({
                            itemId: l.itemId ? String(l.itemId) : "new",
                            newName: l.itemId ? "" : l.itemName,
                            unit: l.unit,
                            by: l.pallets ? "pallet" : "case",
                            qty: String(l.pallets ?? l.cases),
                            perPallet: l.pallets ? String(l.cases / l.pallets) : "",
                            unitCost: String(l.unitCost),
                        })),
                    }}
                />
            </div>
        );
    }

    // ── Figures and messages ────────────────────────────────────────────────
    const total = orderTotal(order.lines);
    const cases = orderCases(order.lines);
    const pallets = order.lines.reduce((n, l) => n + (l.pallets ?? 0), 0);
    const amount = (n: number, unit: string, p: number | null) => (p ? `${p} pallet${p === 1 ? "" : "s"} (${n} ${plural(unit)})` : `${n} ${n === 1 ? unit : plural(unit)}`);
    const lineText = order.lines.map((l) => `- ${l.itemName}: ${amount(l.cases, l.unit, l.pallets)} at ${money(l.unitCost)} per ${l.unit} = ${money(l.cases * l.unitCost)}`).join("\n");
    const signOff = `Thank you,\n${admin}\n${site.name}\n${site.phone} · ${site.email}`;

    const sellerMessage = [
        `Hi ${order.seller?.contactName?.split(" ")[0] || order.sellerName},`,
        `Please see our purchase order ${number} below.`,
        `${lineText}\nTotal: ${money(total)}`,
        order.shipTo ? `Ship to:\n${order.shipTo}` : null,
        [order.wantedBy && `Needed at the warehouse by: ${formatDate(order.wantedBy)}`, `Payment terms: ${termsLabel(order.termsDays)}${order.termsDays ? " from delivery" : ""}`].filter(Boolean).join("\n"),
        order.notes,
        `Please put ${number} on your invoice and packing slip, and list the batch/lot number and best-by date for each product.`,
        signOff,
    ].filter(Boolean).join("\n\n");

    const warehouseMessage = [
        "Hello,",
        `A delivery is on its way to you for ${site.name}.`,
        [
            `Reference: ${number}`,
            `From: ${order.sellerName}`,
            `Expected: ${order.expectedAt ? formatDate(order.expectedAt) : order.wantedBy ? `by ${formatDate(order.wantedBy)}` : "date to follow"}`,
            `Carrier / tracking: ${order.tracking || "to follow"}`,
            `Contents: ${pallets ? `${pallets} pallets, ` : ""}${cases} cases`,
        ].join("\n"),
        order.lines.map((l) => `- ${l.itemName}: ${amount(l.cases, l.unit, l.pallets)}`).join("\n"),
        "Please receive it into our inventory, let us know about any damage or shortage, and note the batch/lot number and best-by date on each pallet.",
        signOff,
    ].join("\n\n");

    const notice = saved ? NOTICES.saved : changed ? NOTICES[changed] : null;
    const stepIndex = STEPS.findIndex((s) => s.key === order.status);
    const input = "admin-input mt-1";
    const label = "block text-xs text-zinc-500";

    return (
        <div className="space-y-6">
            {/* ── On screen ─────────────────────────────────────────────── */}
            <div className="space-y-6 print:hidden">
                <PageHeader
                    back={{ href: "/admin/purchase-orders", label: "Purchase orders" }}
                    title={<span className="flex flex-wrap items-center gap-3">{number} <PoStatusBadge status={order.status} /></span>}
                    description={
                        <>
                            {order.sellerId ? <Link href={`/admin/sellers/${order.sellerId}`} className="hover:text-white underline-offset-2 hover:underline">{order.sellerName}</Link> : order.sellerName}
                            {" · "}{casesText(order.status, order.lines)} · {money(received ? receivedTotal(order.lines) : total)}
                        </>
                    }
                    actions={
                        <>
                            <PrintButton>Print or save PDF</PrintButton>
                            {editable && <AdminLink href={`/admin/purchase-orders/${order.id}?edit=1`}>Edit order</AdminLink>}
                        </>
                    }
                />

                {notice && (
                    <p role="status" className="flex items-center gap-2 rounded-lg border border-green-900 bg-green-950/40 px-4 py-3 text-sm text-green-300">
                        <CheckIcon className="w-4 h-4" /> {notice}
                    </p>
                )}
                {error && ERRORS[error] && <p role="alert" className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">{ERRORS[error]}</p>}

                {/* Where the order is */}
                {order.status === "cancelled" ? (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-zinc-400">This order was cancelled.</p>
                        <form action={setOrderStatus}>
                            <input type="hidden" name="id" value={order.id} />
                            <input type="hidden" name="to" value="draft" />
                            <AdminButton type="submit" variant="secondary">Reopen as a draft</AdminButton>
                        </form>
                    </div>
                ) : (
                    <ol className="grid grid-cols-5 gap-1" aria-label="Order progress">
                        {STEPS.map((s, i) => {
                            const at = order[s.at];
                            const done = i <= stepIndex;
                            return (
                                <li key={s.key} className="min-w-0" aria-current={i === stepIndex ? "step" : undefined}>
                                    <div className={`h-1.5 rounded-full ${done ? (i === stepIndex && !received ? "bg-amber-300" : "bg-green-400") : "bg-zinc-800"}`} />
                                    <p className={`mt-2 text-xs sm:text-sm truncate ${done ? "text-white font-medium" : "text-zinc-500"}`}>{s.label}</p>
                                    <p className="text-xs text-zinc-500 truncate">{done && at ? formatDate(at) : " "}</p>
                                </li>
                            );
                        })}
                    </ol>
                )}

                {/* ── Next step ─────────────────────────────────────────── */}
                {order.status === "draft" && (
                    <Panel title="Next: send it to the seller">
                        <p className="text-sm text-zinc-400 mb-4">
                            Email it with the message below, or click <span className="text-white">Print or save PDF</span> above to attach a PDF. Then mark it as sent.
                        </p>
                        <MessageBox subject={`Purchase order ${number} from ${site.name}`} body={sellerMessage} to={order.seller?.email} label={order.seller?.email ? `Email ${order.seller.email}` : "Open in email"} />
                        <form action={setOrderStatus} className="mt-4 pt-4 border-t border-zinc-800">
                            <input type="hidden" name="id" value={order.id} />
                            <input type="hidden" name="to" value="sent" />
                            <AdminButton type="submit">I sent it: mark as sent</AdminButton>
                        </form>
                    </Panel>
                )}

                {order.status === "sent" && (
                    <Panel title="Next: wait for the seller to confirm">
                        <p className="text-sm text-zinc-400 mb-4">When they reply that the order is accepted and give you a ship date, mark it confirmed.</p>
                        <form action={setOrderStatus}>
                            <input type="hidden" name="id" value={order.id} />
                            <input type="hidden" name="to" value="confirmed" />
                            <AdminButton type="submit">The seller confirmed it</AdminButton>
                        </form>
                    </Panel>
                )}

                {(order.status === "sent" || order.status === "confirmed" || order.status === "shipped") && (
                    <Panel title={order.status === "shipped" ? "Shipping details" : "Next: when it ships"}>
                        <form action={markShipped} className="grid sm:grid-cols-[minmax(0,1fr)_12rem_auto] gap-3 items-end">
                            <input type="hidden" name="id" value={order.id} />
                            <label className={label}>Tracking or bill of lading number
                                <input name="tracking" defaultValue={order.tracking ?? ""} placeholder="From the seller or the trucking company" className={input} />
                            </label>
                            <label className={label}>Arriving on
                                <input type="date" name="expectedAt" defaultValue={dayValue(order.expectedAt)} className={input} />
                            </label>
                            <AdminButton type="submit" variant={order.status === "shipped" ? "secondary" : "primary"}>{order.status === "shipped" ? "Update" : "Mark as shipped"}</AdminButton>
                        </form>
                    </Panel>
                )}

                {(order.status === "confirmed" || order.status === "shipped") && (
                    <Panel title="Tell the warehouse it's coming">
                        <p className="text-sm text-zinc-400 mb-4">Most warehouses want a heads-up before a delivery arrives. Send them this:</p>
                        <MessageBox subject={`Incoming delivery ${number} from ${order.sellerName}`} body={warehouseMessage} />
                    </Panel>
                )}

                {open && (
                    <Panel title={order.status === "shipped" ? "Next: when it arrives at the warehouse" : "Already arrived?"}>
                        <form action={receiveOrder} className="space-y-4">
                            <input type="hidden" name="id" value={order.id} />
                            <p className="text-sm text-zinc-400">Enter what actually came, from the warehouse&apos;s receiving report. The stock is added to Inventory and a bill for what arrived is added to Payments, due {termsLabel(order.termsDays).toLowerCase().startsWith("due") ? "on arrival" : `${order.termsDays} days after the arrival date`}.</p>
                            <label className={`${label} max-w-[12rem]`}>Arrived on
                                <input type="date" name="arrivedOn" required defaultValue={dayValue(new Date())} className={input} />
                            </label>
                            <div className="divide-y divide-zinc-800 border-y border-zinc-800">
                                {order.lines.map((l) => (
                                    <div key={l.id} className="grid sm:grid-cols-[minmax(0,1fr)_8rem_12rem] gap-3 py-3 items-end">
                                        <div className="min-w-0">
                                            <p className="font-medium truncate">{l.itemName}</p>
                                            <p className="text-xs text-zinc-500">Ordered {amount(l.cases, l.unit, l.pallets)}</p>
                                        </div>
                                        <label className={label}>{plural(l.unit).charAt(0).toUpperCase() + plural(l.unit).slice(1)} that arrived
                                            <input type="number" name={`received-${l.id}`} min={0} step={1} required defaultValue={l.cases} className={input} />
                                        </label>
                                        <label className={label}>Batch / lot number
                                            <input name={`batch-${l.id}`} placeholder="On the case or packing slip" className={`${input} font-mono`} />
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <AdminButton type="submit">It arrived: add to inventory</AdminButton>
                        </form>
                    </Panel>
                )}

                {received && (
                    <Panel title="Arrived">
                        <div className="grid sm:grid-cols-3 gap-4 text-sm">
                            <div>
                                <p className="text-zinc-500">Arrived</p>
                                <p className="text-white">{order.receivedAt ? formatDate(order.receivedAt) : "–"}</p>
                            </div>
                            <div>
                                <p className="text-zinc-500">Added to inventory</p>
                                <p className="text-white">{order.lines.reduce((n, l) => n + (l.receivedCases ?? 0), 0)} cases</p>
                            </div>
                            <div>
                                <p className="text-zinc-500">You owe {order.sellerName}</p>
                                {order.bill ? (
                                    <p className="text-white flex flex-wrap items-center gap-2">
                                        {money(order.bill.amount)}
                                        <PaymentBadge item={order.bill} />
                                    </p>
                                ) : <p className="text-zinc-400">No bill (nothing to pay)</p>}
                                {order.bill && !order.bill.paidAt && order.bill.dueDate && <p className="text-xs text-zinc-500">Pay by {formatDate(order.bill.dueDate)} ({termsLabel(order.termsDays)})</p>}
                            </div>
                        </div>
                        {order.bill && <AdminLink href="/admin/payments" className="mt-4">Go to Payments</AdminLink>}
                    </Panel>
                )}

                {/* ── The order ─────────────────────────────────────────── */}
                <Panel title="Products">
                    <div className="overflow-x-auto -mx-5 px-5">
                        <table className="w-full text-sm min-w-[32rem]">
                            <thead>
                                <tr className="text-left text-xs text-zinc-500 border-b border-zinc-800">
                                    <th className="py-2 pr-3 font-normal">Product</th>
                                    <th className="py-2 pr-3 font-normal">Ordered</th>
                                    {received && <th className="py-2 pr-3 font-normal">Arrived</th>}
                                    <th className="py-2 pr-3 font-normal text-right">Per case</th>
                                    <th className="py-2 font-normal text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {order.lines.map((l) => (
                                    <tr key={l.id}>
                                        <td className="py-2.5 pr-3">
                                            {l.item ? <Link href={`/admin/inventory/${l.item.id}`} className="hover:underline">{l.itemName}</Link> : l.itemName}
                                            {l.batch && <span className="block text-xs text-zinc-500 font-mono">Batch {l.batch}</span>}
                                        </td>
                                        <td className="py-2.5 pr-3 text-zinc-300">{amount(l.cases, l.unit, l.pallets)}</td>
                                        {received && <td className={`py-2.5 pr-3 ${l.receivedCases !== l.cases ? "text-amber-300" : "text-zinc-300"}`}>{l.receivedCases ?? 0}{l.receivedCases !== l.cases && " (short)"}</td>}
                                        <td className="py-2.5 pr-3 text-right tabular-nums">{money(l.unitCost)}</td>
                                        <td className="py-2.5 text-right tabular-nums">{money((received ? l.receivedCases ?? 0 : l.cases) * l.unitCost)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t border-zinc-700 font-semibold">
                                    <td className="pt-3" colSpan={received ? 4 : 3}>Total{received && total !== receivedTotal(order.lines) && <span className="font-normal text-zinc-500"> (ordered {money(total)})</span>}</td>
                                    <td className="pt-3 text-right tabular-nums">{money(received ? receivedTotal(order.lines) : total)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </Panel>

                <Panel title="Details">
                    <dl className="grid sm:grid-cols-2 gap-4">
                        <Detail label="Seller">{order.sellerId ? <Link href={`/admin/sellers/${order.sellerId}`} className="hover:underline">{order.sellerName}</Link> : order.sellerName}</Detail>
                        <Detail label="Payment terms">{termsLabel(order.termsDays)}{order.receivedAt && order.termsDays ? ` · pay by ${formatDate(payBy(order.receivedAt, order.termsDays))}` : ""}</Detail>
                        <Detail label="Ship to"><span className="whitespace-pre-line">{order.shipTo || "–"}</span></Detail>
                        <Detail label="Needed by">{order.wantedBy ? formatDate(order.wantedBy) : "–"}</Detail>
                        {order.tracking && <Detail label="Tracking / bill of lading"><span className="font-mono">{order.tracking}</span></Detail>}
                        {order.expectedAt && <Detail label="Arriving on">{formatDate(order.expectedAt)}</Detail>}
                        {order.notes && <Detail label="Note to the seller" wide>{order.notes}</Detail>}
                        <Detail label="Made">{formatDate(order.createdAt)}{order.author ? ` by ${order.author}` : ""}</Detail>
                    </dl>
                </Panel>

                {order.status !== "received" && (
                    <div className="flex flex-wrap gap-3 border-t border-zinc-800 pt-6">
                        {open && (
                            <form action={setOrderStatus}>
                                <input type="hidden" name="id" value={order.id} />
                                <input type="hidden" name="to" value="cancelled" />
                                <ConfirmButton message={`Cancel ${number}? You can reopen it later.`} type="submit" className="text-sm text-zinc-400 hover:text-white px-3 py-2">Cancel order</ConfirmButton>
                            </form>
                        )}
                        <form action={deleteOrder}>
                            <input type="hidden" name="id" value={order.id} />
                            <ConfirmButton message={`Delete ${number} for good? This can't be undone.`} type="submit" className="text-sm text-red-400 hover:text-red-300 px-3 py-2">Delete order</ConfirmButton>
                        </form>
                    </div>
                )}
                <p className="text-xs text-zinc-500">{status.hint}</p>
            </div>

            {/* ── Printed (or saved as PDF): a plain purchase order for the seller ── */}
            <PrintedOrder
                number={number}
                date={order.sentAt ?? order.createdAt}
                seller={{ name: order.sellerName, contact: order.seller?.contactName, email: order.seller?.email, phone: order.seller?.phone, address: [order.seller?.address, [order.seller?.city, order.seller?.state].filter(Boolean).join(", ")].filter(Boolean).join("\n") }}
                shipTo={order.shipTo}
                wantedBy={order.wantedBy}
                terms={`${termsLabel(order.termsDays)}${order.termsDays ? " from delivery" : ""}`}
                notes={order.notes}
                lines={order.lines.map((l) => ({ name: l.itemName, amount: amount(l.cases, l.unit, l.pallets), unitCost: l.unitCost, total: l.cases * l.unitCost }))}
                total={total}
            />
        </div>
    );
}

// Black on white, whatever the admin's Dark / Bright setting, so it prints cleanly
function PrintedOrder({ number, date, seller, shipTo, wantedBy, terms, notes, lines, total }: {
    number: string;
    date: Date;
    seller: { name: string; contact?: string | null; email?: string | null; phone?: string | null; address: string };
    shipTo: string | null;
    wantedBy: Date | null;
    terms: string;
    notes: string | null;
    lines: { name: string; amount: string; unitCost: number; total: number }[];
    total: number;
}) {
    const ink = { color: "#111" } as const;
    const muted = { color: "#555" } as const;
    const cell = { padding: "8px 6px", borderBottom: "1px solid #ddd", textAlign: "left" as const };
    return (
        <div className="hidden print:block text-sm" style={{ ...ink, background: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #111", paddingBottom: 12 }}>
                <div>
                    <p style={{ fontSize: 20, fontWeight: 700 }}>{site.name}</p>
                    <p style={muted}>{site.phone} · {site.email}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 20, fontWeight: 700, letterSpacing: 1 }}>PURCHASE ORDER</p>
                    <p style={{ fontSize: 16, fontWeight: 600 }}>{number}</p>
                    <p style={muted}>Date: {formatDate(date)}</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, margin: "16px 0" }}>
                <div>
                    <p style={{ ...muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Order from</p>
                    <p style={{ fontWeight: 600 }}>{seller.name}</p>
                    {seller.contact && <p>Attn: {seller.contact}</p>}
                    {seller.address && <p style={{ whiteSpace: "pre-line" }}>{seller.address}</p>}
                    {[seller.phone, seller.email].filter(Boolean).length > 0 && <p style={muted}>{[seller.phone, seller.email].filter(Boolean).join(" · ")}</p>}
                </div>
                <div>
                    <p style={{ ...muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Ship to</p>
                    <p style={{ whiteSpace: "pre-line" }}>{shipTo || "To be confirmed"}</p>
                </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", margin: "8px 0 16px" }}>
                <thead>
                    <tr style={{ background: "#f2f2f2" }}>
                        <th style={cell}>Product</th>
                        <th style={cell}>Quantity</th>
                        <th style={{ ...cell, textAlign: "right" }}>Price per case</th>
                        <th style={{ ...cell, textAlign: "right" }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {lines.map((l, i) => (
                        <tr key={i}>
                            <td style={cell}>{l.name}</td>
                            <td style={cell}>{l.amount}</td>
                            <td style={{ ...cell, textAlign: "right" }}>{money(l.unitCost)}</td>
                            <td style={{ ...cell, textAlign: "right" }}>{money(l.total)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan={3} style={{ ...cell, fontWeight: 700, borderBottom: "none", textAlign: "right" }}>Total</td>
                        <td style={{ ...cell, fontWeight: 700, borderBottom: "none", textAlign: "right" }}>{money(total)}</td>
                    </tr>
                </tfoot>
            </table>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div>
                    <p><strong>Payment terms:</strong> {terms}</p>
                    {wantedBy && <p><strong>Needed by:</strong> {formatDate(wantedBy)}</p>}
                    {notes && <p style={{ marginTop: 8 }}><strong>Notes:</strong> {notes}</p>}
                </div>
                <div style={muted}>
                    <p>Please put {number} on your invoice and packing slip.</p>
                    <p>List the batch/lot number and best-by date for each product.</p>
                </div>
            </div>
        </div>
    );
}
