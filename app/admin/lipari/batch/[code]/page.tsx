import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { site } from "@/lib/site";
import { formatDate } from "@/lib/dates";
import { money } from "@/lib/inventory";
import { poNumber, termsLabel } from "@/lib/purchaseOrders";
import { getLipari, lipariStep, oneLine, orderMoney } from "@/lib/lipari";
import { AdminButton, AdminLink, PageHeader, Panel } from "@/components/admin/ui";
import { CheckIcon } from "@/components/admin/icons";
import { MessageBox } from "../../../purchase-orders/OrderTools";
import { markBatchSent } from "../../actions";

export const metadata = { title: "Send to Lipari" };

type PageProps = { params: Promise<{ code: string }>; searchParams: Promise<{ created?: string; sent?: string }> };

export default async function LipariBatchPage({ params, searchParams }: PageProps) {
    const admin = await requireAdmin();
    const { code } = await params;
    const { created, sent } = await searchParams;
    const lipari = await getLipari();

    const orders = await prisma.purchaseOrder.findMany({
        where: { batchCode: code, status: { not: "cancelled" } },
        orderBy: { id: "asc" },
        include: {
            lines: { include: { item: { select: { sku: true } } } },
            store: { select: { name: true, address: true, city: true, contactName: true, phone: true } },
            warehouse: true,
        },
    });
    if (orders.length === 0) notFound();

    const first = orders[0];
    const wh = first.warehouse;
    const unsent = orders.filter((o) => o.status === "draft").length;
    const qty = (cases: number, pallets: number | null) => (pallets ? `${pallets} pallet${pallets === 1 ? "" : "s"} (${cases} cases)` : `${cases} cases`);
    const labelsUrl = `${site.url}/labels/${code}`;
    const totalLipari = orders.reduce((n, o) => n + orderMoney(o.lines[0]).cost, 0);
    const totalStores = orders.reduce((n, o) => n + orderMoney(o.lines[0]).sale, 0);
    const signOff = `Thank you,\n${admin}\n${site.name}\n${site.phone} · ${site.email}`;

    // To Lipari: products, quantities, prices, where to ship and the labels. Never which store.
    const lipariMessage = [
        `Hi ${lipari?.contactName?.split(" ")[0] || "Lipari team"},`,
        `Please see our purchase order${orders.length === 1 ? "" : "s"} below. ${orders.length === 1 ? "It has" : "Each one is a separate order with"} its own pallet label.`,
        orders.map((o) => {
            const l = o.lines[0];
            return `${poNumber(o.id)}: ${l?.item?.sku ? `#${l.item.sku} ` : ""}${l?.itemName ?? ""}\n   ${l ? qty(l.cases, l.pallets) : ""} at ${money(l?.unitCost ?? 0)} per case = ${money((l?.cases ?? 0) * (l?.unitCost ?? 0))}`;
        }).join("\n\n"),
        `Total: ${money(totalLipari)}`,
        `Ship everything to:\n${first.shipTo ?? "(warehouse address)"}${wh?.hours ? `\nReceiving hours: ${wh.hours}` : ""}`,
        `Pallet labels: please print them from this link and put the matching label on each pallet. Every purchase order has its own barcode, so please keep each order on its own pallet(s).\n${labelsUrl}`,
        [first.wantedBy && `Needed by: ${formatDate(first.wantedBy)}`, `Payment terms: ${termsLabel(first.termsDays)}${first.termsDays ? " from delivery" : ""}`].filter(Boolean).join("\n"),
        first.notes,
        "Please put the PO number on each invoice and packing slip, and list the batch/lot number and best-by date for each product.",
        signOff,
    ].filter(Boolean).join("\n\n");

    // To the 3PL: which barcode goes to which store
    const warehouseMessage = [
        `Hello${wh?.contactName ? ` ${wh.contactName.split(" ")[0]}` : ""},`,
        `${lipari?.name ?? "Lipari Distributions"} is shipping the pallets below to you for ${site.name}. Each pallet has a barcode label. Please deliver each one to the store listed for its barcode.`,
        orders.map((o) => {
            const l = o.lines[0];
            const s = o.store;
            return [
                `Barcode ${o.doCode}  (${poNumber(o.id)})`,
                `   ${l?.itemName ?? ""}: ${l ? qty(l.cases, l.pallets) : ""}`,
                `   Deliver to: ${s ? oneLine(s.name, s.address, s.city) : o.storeName ?? "(store)"}`,
                s?.contactName || s?.phone ? `   Store contact: ${[s?.contactName, s?.phone].filter(Boolean).join(", ")}` : null,
            ].filter(Boolean).join("\n");
        }).join("\n\n"),
        `Expected at your dock: ${first.expectedAt ? formatDate(first.expectedAt) : first.wantedBy ? `by ${formatDate(first.wantedBy)}` : "we'll confirm the date"}`,
        "Please let us know when the pallets arrive, and when each one is delivered.",
        signOff,
    ].join("\n\n");

    return (
        <div className="space-y-6">
            <PageHeader
                back={{ href: "/admin/lipari", label: "Lipari orders" }}
                title={orders.length === 1 ? `Send ${poNumber(first.id)} to Lipari` : `Send ${orders.length} purchase orders to Lipari`}
                description={<>{orders.map((o) => poNumber(o.id)).join(", ")} · you pay {money(totalLipari)} · stores pay {money(totalStores)} · <span className="text-green-400">profit {money(totalStores - totalLipari)}</span></>}
            />

            {(created || sent) && (
                <p role="status" className="flex items-center gap-2 rounded-lg border border-green-900 bg-green-950/40 px-4 py-3 text-sm text-green-300">
                    <CheckIcon className="w-4 h-4" /> {sent ? "Marked as sent to Lipari." : `Created ${created} purchase order${created === "1" ? "" : "s"}, each with its own barcode. Now send them below.`}
                </p>
            )}

            <Panel title="1. Email the orders to Lipari">
                <p className="text-sm text-zinc-400 mb-4">
                    This lists each PO, its products and Lipari&apos;s prices, the 3PL to ship to, and the link to print the pallet labels. It never mentions your stores.
                    {!lipari?.email && <> Lipari&apos;s email isn&apos;t saved yet: <Link href={`/admin/sellers/${lipari?.id}?edit=1`} className="underline hover:text-white">add it</Link>, or type it in your email.</>}
                </p>
                <MessageBox subject={`Purchase order${orders.length === 1 ? "" : "s"} ${orders.map((o) => poNumber(o.id)).join(", ")} from ${site.name}`} body={lipariMessage} to={lipari?.email} label={lipari?.email ? `Email ${lipari.email}` : "Open in email"} />
                {unsent > 0 ? (
                    <form action={markBatchSent} className="mt-4 pt-4 border-t border-zinc-800">
                        <input type="hidden" name="batch" value={code} />
                        <AdminButton type="submit">I sent it: mark {unsent === 1 ? "it" : `all ${unsent}`} as sent</AdminButton>
                    </form>
                ) : <p className="mt-4 pt-4 border-t border-zinc-800 text-sm text-green-400">Sent to Lipari{first.sentAt ? ` on ${formatDate(first.sentAt)}` : ""}.</p>}
            </Panel>

            <Panel title="2. Pallet labels">
                <p className="text-sm text-zinc-400 mb-4">
                    One label per pallet, each with its order&apos;s barcode. The labels show the PO number and Lipari&apos;s product so Lipari puts them on the right pallets, but never the store or prices. Lipari opens them from the link in the email.
                </p>
                <AdminLink href={`/labels/${code}`} newTab>Open the labels</AdminLink>
            </Panel>

            <Panel title="3. Tell the 3PL where each barcode goes">
                <p className="text-sm text-zinc-400 mb-4">
                    {wh ? <>Send this to <span className="text-white">{wh.name}</span> before the pallets arrive. It matches each barcode to its store.</> : "Send this to your 3PL before the pallets arrive."}
                </p>
                <MessageBox subject={`Incoming from ${lipari?.name ?? "Lipari"}: ${orders.map((o) => poNumber(o.id)).join(", ")}`} body={warehouseMessage} to={wh?.email} label={wh?.email ? `Email ${wh.email}` : "Open in email"} />
            </Panel>

            <Panel title="The orders">
                <ul className="divide-y divide-zinc-800 -my-2">
                    {orders.map((o) => {
                        const l = o.lines[0];
                        const step = lipariStep(o.status);
                        return (
                            <li key={o.id}>
                                <Link href={`/admin/lipari/${o.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 -mx-2 px-2 rounded-lg hover:bg-zinc-800/60 transition">
                                    <span className="font-mono text-sm text-zinc-400">{poNumber(o.id)}</span>
                                    <span className="flex-1 min-w-48 text-sm">{l?.itemName}<span className="text-zinc-500"> → {o.storeName}</span></span>
                                    <span className="font-mono text-xs text-zinc-500">{o.doCode}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${step.badge}`}>{step.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </Panel>
        </div>
    );
}
