import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { money, palletCount, unitCount } from "@/lib/inventory";
import { statusInfo, type Status } from "@/lib/status";
import { formatDate } from "@/lib/dates";
import { ConfirmButton } from "@/components/ConfirmButton";
import { AdminLink, Detail, EmptyState, PageHeader, Panel, Stat } from "@/components/admin/ui";
import { CheckIcon, MailIcon, PhoneIcon, PlusIcon } from "@/components/admin/icons";
import { SellerForm } from "../SellerForm";
import { deleteSeller } from "../actions";

export const metadata = { title: "Seller" };

type PageProps = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ edit?: string; saved?: string; error?: string }>;
};

export default async function SellerPage({ params, searchParams }: PageProps) {
    await requireAdmin();
    const { id } = await params;
    const { edit, saved, error } = await searchParams;
    const sellerId = Number(id);
    if (!Number.isInteger(sellerId)) notFound();

    const seller = await prisma.seller.findUnique({
        where: { id: sellerId },
        include: { items: { orderBy: { name: "asc" } } },
    });
    if (!seller) notFound();

    if (edit) {
        return (
            <div>
                <PageHeader back={{ href: `/admin/sellers/${seller.id}`, label: seller.name }} title={`Edit ${seller.name}`} />
                {error && <p role="alert" className="mb-4 text-sm text-red-400">Please enter the business name.</p>}
                <SellerForm seller={seller} />
            </div>
        );
    }

    const [deliveryCount, deliveries, submissions] = await Promise.all([
        prisma.inventoryMovement.count({ where: { reason: "received", item: { sellerId } } }),
        prisma.inventoryMovement.findMany({
            where: { reason: "received", item: { sellerId } },
            orderBy: { createdAt: "desc" },
            take: 25,
            include: { item: { select: { id: true, name: true, unit: true } } },
        }),
        seller.email
            ? prisma.submission.findMany({
                where: { email: { equals: seller.email, mode: "insensitive" } },
                orderBy: { createdAt: "desc" },
                select: { id: true, productName: true, status: true, createdAt: true },
            })
            : Promise.resolve([]),
    ]);

    const stockAtCost = seller.items.reduce((n, i) => n + i.quantity * i.cost, 0);
    const website = seller.website && (/^https?:\/\//.test(seller.website) ? seller.website : `https://${seller.website}`);

    return (
        <div className="space-y-6">
            <PageHeader
                back={{ href: "/admin/sellers", label: "Sellers" }}
                title={seller.name}
                description={[seller.contactName, [seller.city, seller.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ") || undefined}
                actions={
                    <>
                        {seller.phone && <AdminLink href={`tel:${seller.phone}`} variant="primary"><PhoneIcon className="w-4 h-4" /> Call</AdminLink>}
                        {seller.email && <AdminLink href={`mailto:${seller.email}`}><MailIcon className="w-4 h-4" /> Email</AdminLink>}
                        <AdminLink href={`/admin/sellers/${seller.id}?edit=1`}>Edit details</AdminLink>
                    </>
                }
            />

            {saved && (
                <p role="status" className="flex items-center gap-2 rounded-lg border border-green-900 bg-green-950/40 px-4 py-3 text-sm text-green-300">
                    <CheckIcon className="w-4 h-4" /> Saved.
                </p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Stat label="Items you buy from them" value={seller.items.length} />
                <Stat label="Their stock you hold, at cost" value={money(stockAtCost)} />
                <Stat label="Deliveries received" value={deliveryCount} />
            </div>

            <div className="grid lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6 min-w-0">
                    <Panel title="Their items" action={<AdminLink href={`/admin/inventory/new?seller=${seller.id}`} variant="ghost" className="!px-2 !py-1"><PlusIcon className="w-4 h-4" /> Add item</AdminLink>}>
                        {seller.items.length === 0 ? (
                            <EmptyState title="No items yet" text="Add an inventory item and pick this seller." />
                        ) : (
                            <ul className="divide-y divide-zinc-800 -my-2">
                                {seller.items.map((i) => (
                                    <li key={i.id}>
                                        <Link href={`/admin/inventory/${i.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 -mx-2 px-2 rounded-lg hover:bg-zinc-800/60 transition">
                                            <span className="flex-1 min-w-40 font-medium">{i.name}</span>
                                            <span className="text-sm text-right tabular-nums">
                                                {unitCount(i.quantity, i.unit)}
                                                {palletCount(i.quantity, i.unit, i.casesPerPallet) && <span className="block text-xs text-zinc-500">{palletCount(i.quantity, i.unit, i.casesPerPallet)}</span>}
                                            </span>
                                            <span className="w-24 text-right text-sm tabular-nums text-zinc-400">{money(i.cost)}/{i.unit}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>

                    <Panel title="Deliveries and batch numbers" action={deliveryCount > deliveries.length && <span className="text-xs text-zinc-500">Latest {deliveries.length}</span>}>
                        {deliveries.length === 0 ? (
                            <p className="text-sm text-zinc-500">Nothing received from them yet. Use &quot;Receive stock&quot; on an item.</p>
                        ) : (
                            <div className="overflow-x-auto -mx-5 px-5">
                                <table className="w-full text-sm">
                                    <thead className="text-xs uppercase tracking-wide text-zinc-500 text-left">
                                        <tr>
                                            <th className="py-2 pr-4 font-normal">Date</th>
                                            <th className="py-2 pr-4 font-normal">Item</th>
                                            <th className="py-2 pr-4 font-normal">Batch #</th>
                                            <th className="py-2 pr-4 font-normal text-right">Received</th>
                                            <th className="py-2 font-normal text-right">Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800">
                                        {deliveries.map((d) => (
                                            <tr key={d.id}>
                                                <td className="py-2.5 pr-4 whitespace-nowrap text-zinc-400">{formatDate(d.createdAt)}</td>
                                                <td className="py-2.5 pr-4"><Link href={`/admin/inventory/${d.item.id}`} className="hover:underline">{d.item.name}</Link></td>
                                                <td className="py-2.5 pr-4 font-mono">{d.batch || <span className="text-zinc-600 font-sans">—</span>}</td>
                                                <td className="py-2.5 pr-4 text-right tabular-nums whitespace-nowrap">
                                                    {unitCount(d.change, d.item.unit)}
                                                    {d.pallets && <span className="block text-xs text-zinc-500">{unitCount(d.pallets, "pallet")}</span>}
                                                </td>
                                                <td className="py-2.5 text-right tabular-nums whitespace-nowrap">
                                                    {d.unitCost !== null ? <>{money(d.unitCost * d.change)}<span className="block text-xs text-zinc-500">{money(d.unitCost)}/{d.item.unit}</span></> : <span className="text-zinc-600">—</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Panel>
                </div>

                <div className="space-y-6 min-w-0">
                    <Panel title="Details">
                        <dl className="grid gap-4">
                            <Detail label="Contact">{seller.contactName}</Detail>
                            <Detail label="Phone">{seller.phone && <a href={`tel:${seller.phone}`} className="hover:underline">{seller.phone}</a>}</Detail>
                            <Detail label="Email">{seller.email && <a href={`mailto:${seller.email}`} className="hover:underline">{seller.email}</a>}</Detail>
                            <Detail label="Address">{[seller.address, seller.city, seller.state].filter(Boolean).join(", ")}</Detail>
                            <Detail label="Website">{website && <a href={website} target="_blank" rel="noreferrer" className="hover:underline break-all">{seller.website}</a>}</Detail>
                        </dl>
                        {seller.notes && <p className="mt-4 pt-4 border-t border-zinc-800 text-sm whitespace-pre-wrap text-zinc-300">{seller.notes}</p>}
                    </Panel>

                    {submissions.length > 0 && (
                        <Panel title="Their submissions">
                            <ul className="space-y-2">
                                {submissions.map((s) => (
                                    <li key={s.id}>
                                        <Link href={`/admin/submissions/${s.id}`} className="flex items-center gap-2 text-sm hover:underline">
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${statusInfo[s.status as Status]?.dot ?? "bg-zinc-500"}`} />
                                            <span className="flex-1 min-w-0 truncate">{s.productName}</span>
                                            <span className="text-xs text-zinc-500">{formatDate(s.createdAt)}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                            <p className="mt-3 text-xs text-zinc-500">Licenses and documents they uploaded are on each submission.</p>
                        </Panel>
                    )}

                    <p className="text-xs text-zinc-500">Added {formatDate(seller.createdAt)}</p>
                    <form action={deleteSeller} className="border-t border-zinc-800 pt-4">
                        <input type="hidden" name="sellerId" value={seller.id} />
                        <ConfirmButton
                            type="submit"
                            message={`Delete "${seller.name}"?${seller.items.length ? ` Their ${seller.items.length} item(s) stay in your inventory, just without a seller.` : ""} This can't be undone.`}
                            className="px-4 py-2 rounded-lg text-sm font-semibold border border-red-900 text-red-400 hover:bg-red-950"
                        >
                            Delete seller
                        </ConfirmButton>
                    </form>
                </div>
            </div>
        </div>
    );
}
