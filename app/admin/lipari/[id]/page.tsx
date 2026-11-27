import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { money } from "@/lib/inventory";
import { payBy, poNumber, termsLabel } from "@/lib/purchaseOrders";
import { getLipari, lipariStep, oneLine, orderMoney } from "@/lib/lipari";
import { Barcode } from "@/components/Barcode";
import { ConfirmButton } from "@/components/ConfirmButton";
import { PaymentBadge } from "@/components/admin/PaymentBadge";
import { AdminButton, AdminLink, Detail, PageHeader, Panel } from "@/components/admin/ui";
import { CheckIcon } from "@/components/admin/icons";
import { deleteLipariOrder, markAtWarehouse, markDelivered, markLipariShipped, setLipariStatus } from "../actions";
import { LipariOrderForm } from "../LipariOrderForm";

export const metadata = { title: "Lipari order" };

type PageProps = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ edit?: string; saved?: string; status?: string; error?: string }>;
};

const NOTICES: Record<string, string> = {
    saved: "Saved.",
    sent: "Marked as sent to Lipari.",
    confirmed: "Marked as confirmed by Lipari.",
    shipped: "Marked as on the way to the 3PL.",
    received: "At the 3PL. What you owe Lipari is now in Payments.",
    delivered: "Delivered. What the store owes you is now in Payments and on the store's page.",
    cancelled: "Order cancelled.",
    draft: "Reopened.",
};

const ERRORS: Record<string, string> = {
    received: "Enter how many cases arrived at the 3PL, as a whole number.",
    delivered: "Enter how many cases were delivered to the store, as a whole number.",
};

const STEPS = [
    { key: "draft", label: "Made", at: "createdAt" },
    { key: "sent", label: "Sent", at: "sentAt" },
    { key: "confirmed", label: "Confirmed", at: "confirmedAt" },
    { key: "shipped", label: "Shipped", at: "shippedAt" },
    { key: "received", label: "At 3PL", at: "receivedAt" },
    { key: "delivered", label: "Delivered", at: "deliveredAt" },
] as const;

// The date box format, for California's calendar day
const dayValue = (d: Date | null) => (d ? d.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" }) : "");

export default async function LipariOrderPage({ params, searchParams }: PageProps) {
    await requireAdmin();
    const { id } = await params;
    const { edit, saved, status: changed, error } = await searchParams;

    const order = await prisma.purchaseOrder.findUnique({
        where: { id: Number(id) || 0 },
        include: {
            lines: { include: { item: { select: { id: true, sku: true } } } },
            store: true,
            warehouse: true,
            bill: true,
            sales: true,
        },
    });
    if (!order) notFound();

    const number = poNumber(order.id);
    const line = order.lines[0];
    const editable = ["draft", "sent", "confirmed"].includes(order.status);
    const open = ["draft", "sent", "confirmed", "shipped"].includes(order.status);

    // ── Edit mode ───────────────────────────────────────────────────────────
    if (edit && editable && line) {
        const lipari = await getLipari();
        const [products, stores, warehouses] = await Promise.all([
            prisma.inventoryItem.findMany({ where: { sellerId: lipari?.id ?? -1 }, select: { id: true, name: true, sku: true, unit: true, cost: true, price: true, casesPerPallet: true }, orderBy: { name: "asc" } }),
            prisma.store.findMany({ select: { id: true, name: true, city: true }, orderBy: { name: "asc" } }),
            prisma.warehouse.findMany({ select: { id: true, name: true, status: true }, orderBy: { name: "asc" } }),
        ]);
        return (
            <div>
                <PageHeader back={{ href: `/admin/lipari/${order.id}`, label: number }} title={`Edit ${number}`} description="Its barcode stays the same." />
                <LipariOrderForm
                    products={products}
                    stores={stores}
                    warehouses={warehouses}
                    order={{
                        id: order.id,
                        warehouseId: order.warehouseId,
                        termsDays: order.termsDays,
                        wantedBy: dayValue(order.wantedBy),
                        notes: order.notes ?? "",
                        row: {
                            itemId: line.itemId ? String(line.itemId) : "",
                            storeId: order.storeId ? String(order.storeId) : "",
                            by: line.pallets ? "pallet" : "case",
                            qty: String(line.pallets ?? line.cases),
                            perPallet: line.pallets ? String(line.cases / line.pallets) : "",
                            unitCost: String(line.unitCost),
                            salePrice: line.salePrice !== null ? String(line.salePrice) : "",
                            storeTerms: String(order.storeTermsDays),
                        },
                    }}
                />
            </div>
        );
    }

    const step = lipariStep(order.status);
    const m = orderMoney(line);
    const stepIndex = STEPS.findIndex((s) => s.key === order.status);
    const sale = order.sales[0];
    const notice = saved ? NOTICES.saved : changed ? NOTICES[changed] : null;
    const qty = line ? (line.pallets ? `${line.pallets} pallet${line.pallets === 1 ? "" : "s"} (${line.cases} cases)` : `${line.cases} cases`) : "—";
    const input = "admin-input mt-1";
    const label = "block text-xs text-zinc-500";

    return (
        <div className="space-y-6">
            <PageHeader
                back={{ href: "/admin/lipari", label: "Lipari orders" }}
                title={<span className="flex flex-wrap items-center gap-3">{number} <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${step.badge}`}>{step.label}</span></span>}
                description={<>{line?.itemName}{order.storeName && <> → {order.storeId ? <Link href={`/admin/stores/${order.storeId}`} className="hover:underline">{order.storeName}</Link> : order.storeName}</>}</>}
                actions={
                    <>
                        {order.batchCode && <AdminLink href={`/admin/lipari/batch/${order.batchCode}`}>Email, labels and 3PL message</AdminLink>}
                        {editable && <AdminLink href={`/admin/lipari/${order.id}?edit=1`}>Edit order</AdminLink>}
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
                    <form action={setLipariStatus}>
                        <input type="hidden" name="id" value={order.id} />
                        <input type="hidden" name="to" value="draft" />
                        <AdminButton type="submit" variant="secondary">Reopen it</AdminButton>
                    </form>
                </div>
            ) : (
                <ol className="grid grid-cols-6 gap-1" aria-label="Order progress">
                    {STEPS.map((s, i) => {
                        const at = order[s.at];
                        const done = i <= stepIndex;
                        return (
                            <li key={s.key} className="min-w-0" aria-current={i === stepIndex ? "step" : undefined}>
                                <div className={`h-1.5 rounded-full ${done ? (i === stepIndex && order.status !== "delivered" ? "bg-amber-300" : "bg-green-400") : "bg-zinc-800"}`} />
                                <p className={`mt-2 text-xs sm:text-sm truncate ${done ? "text-white font-medium" : "text-zinc-500"}`}>{s.label}</p>
                                <p className="text-xs text-zinc-500 truncate">{done && at ? formatDate(at) : " "}</p>
                            </li>
                        );
                    })}
                </ol>
            )}

            {/* ── Next step ─────────────────────────────────────────────── */}
            {order.status === "draft" && (
                <Panel title="Next: send it to Lipari">
                    <p className="text-sm text-zinc-400 mb-4">The email for Lipari, the pallet labels and the 3PL message are ready on the send page.</p>
                    <div className="flex flex-wrap gap-2">
                        {order.batchCode && <AdminLink href={`/admin/lipari/batch/${order.batchCode}`} variant="primary">Go to the send page</AdminLink>}
                        <form action={setLipariStatus}>
                            <input type="hidden" name="id" value={order.id} />
                            <input type="hidden" name="to" value="sent" />
                            <AdminButton type="submit" variant="secondary">I sent it: mark as sent</AdminButton>
                        </form>
                    </div>
                </Panel>
            )}

            {order.status === "sent" && (
                <Panel title="Next: Lipari confirms">
                    <form action={setLipariStatus}>
                        <input type="hidden" name="id" value={order.id} />
                        <input type="hidden" name="to" value="confirmed" />
                        <AdminButton type="submit">Lipari confirmed it</AdminButton>
                    </form>
                </Panel>
            )}

            {(order.status === "sent" || order.status === "confirmed" || order.status === "shipped") && (
                <Panel title={order.status === "shipped" ? "Shipping details" : "Next: when Lipari ships it"}>
                    <form action={markLipariShipped} className="grid sm:grid-cols-[minmax(0,1fr)_12rem_auto] gap-3 items-end">
                        <input type="hidden" name="id" value={order.id} />
                        <label className={label}>Tracking or bill of lading number
                            <input name="tracking" defaultValue={order.tracking ?? ""} placeholder="From Lipari or the trucking company" className={input} />
                        </label>
                        <label className={label}>Arriving at the 3PL on
                            <input type="date" name="expectedAt" defaultValue={dayValue(order.expectedAt)} className={input} />
                        </label>
                        <AdminButton type="submit" variant={order.status === "shipped" ? "secondary" : "primary"}>{order.status === "shipped" ? "Update" : "Mark as shipped"}</AdminButton>
                    </form>
                </Panel>
            )}

            {open && order.status !== "draft" && (
                <Panel title={order.status === "shipped" ? "Next: when it reaches the 3PL" : "Already at the 3PL?"}>
                    <form action={markAtWarehouse} className="grid sm:grid-cols-[10rem_10rem_minmax(0,1fr)_auto] gap-3 items-end">
                        <input type="hidden" name="id" value={order.id} />
                        <label className={label}>Arrived on
                            <input type="date" name="arrivedOn" required defaultValue={dayValue(new Date())} className={input} />
                        </label>
                        <label className={label}>Cases that arrived
                            <input type="number" name="received" min={0} step={1} required defaultValue={line?.cases} className={input} />
                        </label>
                        <label className={label}>Batch / lot number
                            <input name="batch" placeholder="From the packing slip" className={`${input} font-mono`} />
                        </label>
                        <AdminButton type="submit">It&apos;s at the 3PL</AdminButton>
                    </form>
                    <p className="text-xs text-zinc-500 mt-3">This adds what you owe Lipari for the cases that arrived to Payments, due {order.termsDays ? `${order.termsDays} days later (${termsLabel(order.termsDays)})` : "right away"}.</p>
                </Panel>
            )}

            {order.status === "received" && (
                <Panel title="Next: when the 3PL delivers it to the store">
                    <form action={markDelivered} className="grid sm:grid-cols-[10rem_10rem_auto] gap-3 items-end">
                        <input type="hidden" name="id" value={order.id} />
                        <label className={label}>Delivered on
                            <input type="date" name="deliveredOn" required defaultValue={dayValue(new Date())} className={input} />
                        </label>
                        <label className={label}>Cases delivered
                            <input type="number" name="delivered" min={0} step={1} required defaultValue={line?.receivedCases ?? line?.cases} className={input} />
                        </label>
                        <AdminButton type="submit">Delivered to {order.storeName ?? "the store"}</AdminButton>
                    </form>
                    <p className="text-xs text-zinc-500 mt-3">The store then owes you for the cases delivered, due {order.storeTermsDays ? `${order.storeTermsDays} days later` : "on delivery"}. It shows in Payments and on the store&apos;s page.</p>
                </Panel>
            )}

            {/* ── Money ─────────────────────────────────────────────────── */}
            <Panel title="Money">
                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                    <div>
                        <p className="text-zinc-500">You pay Lipari</p>
                        <p className="text-lg font-semibold tabular-nums">{money(order.bill?.amount ?? m.cost)}</p>
                        <p className="text-xs text-zinc-500">{line && `${line.receivedCases ?? line.cases} × ${money(line.unitCost)}`} · {termsLabel(order.termsDays)}</p>
                        {order.bill ? (
                            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs"><PaymentBadge item={order.bill} />{!order.bill.paidAt && order.bill.dueDate && <span className="text-zinc-500">by {formatDate(order.bill.dueDate)}</span>}</p>
                        ) : <p className="text-xs text-zinc-500 mt-1">Bill added when it reaches the 3PL</p>}
                    </div>
                    <div>
                        <p className="text-zinc-500">{order.storeName ?? "The store"} pays you</p>
                        <p className="text-lg font-semibold tabular-nums">{money(sale?.revenue ?? m.sale)}</p>
                        <p className="text-xs text-zinc-500">{line && `${sale?.quantity ?? line.cases} × ${money(line.salePrice ?? 0)}`} · {order.storeTermsDays ? `Net ${order.storeTermsDays}` : "On delivery"}</p>
                        {sale ? (
                            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs"><PaymentBadge item={sale} />{!sale.paidAt && sale.dueDate && <span className="text-zinc-500">by {formatDate(sale.dueDate)}</span>}</p>
                        ) : <p className="text-xs text-zinc-500 mt-1">Added when it&apos;s delivered</p>}
                    </div>
                    <div>
                        <p className="text-zinc-500">Your profit</p>
                        <p className={`text-lg font-semibold tabular-nums ${(sale && order.bill ? sale.revenue - order.bill.amount : m.profit) < 0 ? "text-red-400" : "text-green-400"}`}>
                            {money(sale && order.bill ? sale.revenue - order.bill.amount : m.profit)}
                        </p>
                        {line && line.salePrice !== null && <p className="text-xs text-zinc-500">{money(line.salePrice - line.unitCost)} per case</p>}
                    </div>
                </div>
                {(order.bill || sale) && <AdminLink href="/admin/payments" className="mt-4">Go to Payments</AdminLink>}
            </Panel>

            <div className="grid lg:grid-cols-3 gap-6 items-start">
                <Panel title="Details" className="lg:col-span-2">
                    <dl className="grid sm:grid-cols-2 gap-4">
                        <Detail label="Product">
                            {line?.item ? <Link href={`/admin/inventory/${line.item.id}`} className="hover:underline">{line.itemName}</Link> : line?.itemName}
                            {line?.item?.sku && <span className="block text-xs text-zinc-500">Lipari #{line.item.sku}</span>}
                        </Detail>
                        <Detail label="Quantity">{qty}{line?.receivedCases !== null && line?.receivedCases !== undefined && line.receivedCases !== line.cases ? ` · ${line.receivedCases} arrived` : ""}</Detail>
                        <Detail label="Deliver to (store)">
                            {order.store ? <><Link href={`/admin/stores/${order.store.id}`} className="hover:underline">{order.store.name}</Link><span className="block text-xs text-zinc-500">{oneLine(order.store.address, order.store.city) || "No address on file"}</span></> : order.storeName ?? "—"}
                        </Detail>
                        <Detail label="Ship to (3PL)">
                            {order.warehouse ? <Link href={`/admin/warehouses/${order.warehouse.id}`} className="hover:underline">{order.warehouse.name}</Link> : null}
                            <span className="block text-xs text-zinc-500 whitespace-pre-line">{order.shipTo}</span>
                        </Detail>
                        {order.wantedBy && <Detail label="Needed by">{formatDate(order.wantedBy)}</Detail>}
                        {order.expectedAt && <Detail label="Arriving at the 3PL">{formatDate(order.expectedAt)}</Detail>}
                        {order.tracking && <Detail label="Tracking / bill of lading"><span className="font-mono">{order.tracking}</span></Detail>}
                        {line?.batch && <Detail label="Batch / lot"><span className="font-mono">{line.batch}</span></Detail>}
                        {order.receivedAt && order.termsDays > 0 && !order.bill && <Detail label="Pay Lipari by">{formatDate(payBy(order.receivedAt, order.termsDays))}</Detail>}
                        {order.notes && <Detail label="Note to Lipari" wide>{order.notes}</Detail>}
                        <Detail label="Made">{formatDate(order.createdAt)}{order.author ? ` by ${order.author}` : ""}</Detail>
                    </dl>
                </Panel>

                {order.doCode && (
                    <Panel title="Delivery barcode">
                        <div className="rounded-lg bg-white p-2"><Barcode value={order.doCode} height={70} className="w-full h-auto" /></div>
                        <p className="text-xs text-zinc-500 mt-2">Code <span className="font-mono text-zinc-300">{order.doCode}</span>. Only you and the 3PL know which store it means.</p>
                        {order.batchCode && <AdminLink href={`/labels/${order.batchCode}`} newTab className="mt-3">Open the pallet labels</AdminLink>}
                    </Panel>
                )}
            </div>

            {!["received", "delivered"].includes(order.status) && (
                <div className="flex flex-wrap gap-3 border-t border-zinc-800 pt-6">
                    {open && (
                        <form action={setLipariStatus}>
                            <input type="hidden" name="id" value={order.id} />
                            <input type="hidden" name="to" value="cancelled" />
                            <ConfirmButton message={`Cancel ${number}? You can reopen it later.`} type="submit" className="text-sm text-zinc-400 hover:text-white px-3 py-2">Cancel order</ConfirmButton>
                        </form>
                    )}
                    <form action={deleteLipariOrder}>
                        <input type="hidden" name="id" value={order.id} />
                        <ConfirmButton message={`Delete ${number} for good? This can't be undone.`} type="submit" className="text-sm text-red-400 hover:text-red-300 px-3 py-2">Delete order</ConfirmButton>
                    </form>
                </div>
            )}
        </div>
    );
}
