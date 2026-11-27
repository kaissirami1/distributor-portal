import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/inventory";
import { formatDate } from "@/lib/dates";
import { lipariStep, oneLine } from "@/lib/lipari";
import { poNumber } from "@/lib/purchaseOrders";
import { ConfirmButton } from "@/components/ConfirmButton";
import { AdminLink, Detail, PageHeader, Panel } from "@/components/admin/ui";
import { CheckIcon, MailIcon, PhoneIcon } from "@/components/admin/icons";
import { WarehouseForm } from "../WarehouseForm";
import { deleteWarehouse } from "../actions";
import { warehouseLabel } from "../labels";

export const metadata = { title: "3PL Warehouse" };

type PageProps = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ edit?: string; saved?: string; error?: string }>;
};

export default async function WarehousePage({ params, searchParams }: PageProps) {
    await requireAdmin();
    const { id } = await params;
    const { edit, saved, error } = await searchParams;
    const w = await prisma.warehouse.findUnique({
        where: { id: Number(id) || 0 },
        include: { purchaseOrders: { orderBy: { createdAt: "desc" }, take: 20, include: { lines: { select: { itemName: true, cases: true } } } } },
    });
    if (!w) notFound();

    if (edit) {
        return (
            <div>
                <PageHeader back={{ href: `/admin/warehouses/${w.id}`, label: w.name }} title={`Edit ${w.name}`} />
                {error && <p role="alert" className="mb-4 text-sm text-red-400">Please enter the company name.</p>}
                <WarehouseForm warehouse={w} />
            </div>
        );
    }

    const status = warehouseLabel(w.status);
    const fee = (n: number | null) => (n === null ? "Not quoted yet" : money(n));

    return (
        <div className="space-y-6">
            <PageHeader
                back={{ href: "/admin/warehouses", label: "3PL Warehouses" }}
                title={<span className="flex flex-wrap items-center gap-3">{w.name} <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${status.badge}`}>{status.label}</span></span>}
                description={oneLine(w.address, w.city, w.state, w.zip) || undefined}
                actions={
                    <>
                        {w.phone && <AdminLink href={`tel:${w.phone}`} variant="primary"><PhoneIcon className="w-4 h-4" /> Call</AdminLink>}
                        {w.email && <AdminLink href={`mailto:${w.email}`}><MailIcon className="w-4 h-4" /> Email</AdminLink>}
                        <AdminLink href={`/admin/warehouses/${w.id}?edit=1`}>Edit details</AdminLink>
                    </>
                }
            />

            {saved && (
                <p role="status" className="flex items-center gap-2 rounded-lg border border-green-900 bg-green-950/40 px-4 py-3 text-sm text-green-300">
                    <CheckIcon className="w-4 h-4" /> Saved.
                </p>
            )}

            <div className="grid lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6 min-w-0">
                    <Panel title="Their prices">
                        <dl className="grid sm:grid-cols-3 gap-4">
                            <Detail label="To receive a pallet">{fee(w.receivingFee)}</Detail>
                            <Detail label="Storage, per pallet per month">{fee(w.storageFee)}</Detail>
                            <Detail label="Delivery to a store">{fee(w.deliveryFee)}</Detail>
                        </dl>
                    </Panel>

                    <Panel title="Orders shipped here">
                        {w.purchaseOrders.length === 0 ? (
                            <p className="text-sm text-zinc-500">None yet. Pick this 3PL when you place a Lipari order.</p>
                        ) : (
                            <ul className="divide-y divide-zinc-800 -my-2">
                                {w.purchaseOrders.map((o) => (
                                    <li key={o.id}>
                                        <Link href={`/admin/lipari/${o.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 -mx-2 px-2 rounded-lg hover:bg-zinc-800/60 transition">
                                            <span className="font-mono text-sm text-zinc-400">{poNumber(o.id)}</span>
                                            <span className="flex-1 min-w-40 text-sm">{o.lines[0]?.itemName ?? "—"}{o.storeName ? <span className="text-zinc-500"> → {o.storeName}</span> : null}</span>
                                            <span className="text-xs text-zinc-500">{lipariStep(o.status).label} · {formatDate(o.createdAt)}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>
                </div>

                <div className="space-y-6">
                    <Panel title="Details">
                        <dl className="space-y-4">
                            <Detail label="Contact">{w.contactName || "Not given"}</Detail>
                            <Detail label="Phone">{w.phone || "Not given"}</Detail>
                            <Detail label="Email">{w.email || "Not given"}</Detail>
                            <Detail label="Hours / delivery days">{w.hours || "Not given"}</Detail>
                            {w.notes && <Detail label="Notes"><span className="whitespace-pre-line">{w.notes}</span></Detail>}
                        </dl>
                    </Panel>
                    <form action={deleteWarehouse}>
                        <input type="hidden" name="id" value={w.id} />
                        <ConfirmButton message={`Delete ${w.name}? Orders already shipped there keep their address.`} type="submit" className="text-sm text-red-400 hover:text-red-300">
                            Delete this 3PL
                        </ConfirmButton>
                    </form>
                </div>
            </div>
        </div>
    );
}
