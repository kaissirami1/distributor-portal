import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { CONTACT_ROLES, STORE_STAGES, VISIT_KINDS, VISIT_OUTCOMES } from "@/lib/stores";
import { formatDate } from "@/lib/dates";
import { ConfirmButton } from "@/components/ConfirmButton";
import { AdminButton, AdminLink, Detail, PageHeader, Panel } from "@/components/admin/ui";
import { CheckIcon, GlobeIcon, LinkIcon, MailIcon, PhoneIcon } from "@/components/admin/icons";
import { StageBadge } from "../StageBadge";
import { StoreForm } from "../StoreForm";
import { PaymentBadge } from "@/components/admin/PaymentBadge";
import { paymentStatus } from "@/lib/payments";
import Link from "next/link";
import { clearFollowUp, deleteStore, deleteVisit, logVisit, setStage } from "../actions";

export const metadata = { title: "Store" };

type PageProps = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ edit?: string; saved?: string; logged?: string; error?: string }>;
};

const KIND_LABEL = Object.fromEntries(VISIT_KINDS.map((k) => [k.key, k.label]));

export default async function StorePage({ params, searchParams }: PageProps) {
    await requireAdmin();
    const { id } = await params;
    const { edit, saved, logged, error } = await searchParams;
    const storeId = Number(id);
    if (!Number.isInteger(storeId)) notFound();

    const store = await prisma.store.findUnique({
        where: { id: storeId },
        include: {
            visits: { orderBy: [{ date: "desc" }, { id: "desc" }] },
            sales: {
                orderBy: { createdAt: "desc" },
                include: { submission: { select: { productName: true } }, inventoryItem: { select: { name: true } } },
            },
        },
    });
    if (!store) notFound();

    if (edit) {
        return (
            <div>
                <PageHeader back={{ href: `/admin/stores/${store.id}`, label: store.name }} title={`Edit ${store.name}`} />
                {error && <p role="alert" className="mb-4 text-sm text-red-400">Please enter the store&apos;s name.</p>}
                <StoreForm store={store} />
            </div>
        );
    }

    const mapQuery = [store.name, store.address, store.city].filter(Boolean).join(", ");
    const website = store.website && (/^https?:\/\//.test(store.website) ? store.website : `https://${store.website}`);
    const today = new Date().toLocaleDateString("en-CA");
    const overdue = store.followUpOn && store.followUpOn < new Date(new Date().setHours(0, 0, 0, 0));
    const samples = store.visits.filter((v) => v.samplesGiven);
    const input = "admin-input mt-1";
    const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
    const totalBought = store.sales.reduce((n, s) => n + s.revenue, 0);
    const unpaid = store.sales.filter((s) => !s.paidAt);
    const unpaidTotal = unpaid.reduce((n, s) => n + s.revenue, 0);
    const paymentOverdue = unpaid.some((s) => paymentStatus(s) === "overdue");

    return (
        <div className="space-y-6">
            <PageHeader
                back={{ href: "/admin/stores", label: "Stores" }}
                title={store.name}
                description={
                    <span className="flex flex-wrap items-center gap-2">
                        <StageBadge stage={store.stage} />
                        <span>{[store.type, store.city].filter(Boolean).join(" · ")}</span>
                    </span>
                }
                actions={
                    <>
                        {store.phone && <AdminLink href={`tel:${store.phone}`} variant="primary"><PhoneIcon className="w-4 h-4" /> Call</AdminLink>}
                        {store.email && <AdminLink href={`mailto:${store.email}`}><MailIcon className="w-4 h-4" /> Email</AdminLink>}
                        {mapQuery && <AdminLink href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`} newTab><GlobeIcon className="w-4 h-4" /> Map</AdminLink>}
                        <AdminLink href={`/admin/stores/${store.id}?edit=1`}>Edit details</AdminLink>
                    </>
                }
            />

            {(saved || logged) && (
                <p role="status" className="flex items-center gap-2 rounded-lg border border-green-900 bg-green-950/40 px-4 py-3 text-sm text-green-300">
                    <CheckIcon className="w-4 h-4" /> {logged ? "Visit logged." : "Saved."}
                </p>
            )}

            {/* ── Next step ── */}
            {(store.nextStep || store.followUpOn) && (
                <div className={`flex flex-wrap items-center gap-3 rounded-xl border px-5 py-4 ${overdue ? "border-red-900 bg-red-950/30" : "border-amber-900/60 bg-amber-950/20"}`}>
                    <div className="flex-1 min-w-48">
                        <p className="text-xs uppercase tracking-wide text-zinc-400">Next step{store.followUpOn ? ` · ${overdue ? "overdue since" : "on"} ${formatDate(store.followUpOn)}` : ""}</p>
                        <p className="font-medium mt-0.5">{store.nextStep || "Follow up"}</p>
                    </div>
                    <form action={clearFollowUp}>
                        <input type="hidden" name="storeId" value={store.id} />
                        <AdminButton type="submit" variant="secondary"><CheckIcon className="w-4 h-4" /> Done</AdminButton>
                    </form>
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-6 items-start">
                {/* ── Left: log a visit, history ── */}
                <div className="lg:col-span-2 space-y-6 min-w-0">
                    <Panel title="Log a visit or call">
                        <form action={logVisit} className="grid sm:grid-cols-2 gap-4">
                            <input type="hidden" name="storeId" value={store.id} />
                            <label className="block text-xs text-zinc-500">Date
                                <input name="date" type="date" defaultValue={today} className={input} />
                            </label>
                            <label className="block text-xs text-zinc-500">How
                                <select name="kind" defaultValue="visit" className={input}>
                                    {VISIT_KINDS.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}
                                </select>
                            </label>
                            <label className="block text-xs text-zinc-500">Who you spoke with
                                <input name="spokeWith" defaultValue={store.contactName ?? ""} placeholder="Name" className={input} />
                            </label>
                            <label className="block text-xs text-zinc-500">Their role
                                <input name="spokeWithRole" list="visit-roles" defaultValue={store.contactRole ?? ""} placeholder="Owner, Manager…" className={input} />
                                <datalist id="visit-roles">{CONTACT_ROLES.map((r) => <option key={r} value={r} />)}</datalist>
                            </label>
                            <label className="sm:col-span-2 flex items-center gap-2 text-sm text-zinc-300">
                                <input name="decisionMaker" type="checkbox" className="w-4 h-4 accent-white" />
                                I talked to the owner or person in charge
                            </label>
                            <label className="block text-xs text-zinc-500 sm:col-span-2">Samples you left
                                <input name="samplesGiven" placeholder="e.g. 2 jars za'atar, 1 bottle pomegranate molasses (leave empty if none)" className={input} />
                            </label>
                            <label className="block text-xs text-zinc-500">How it went
                                <select name="outcome" defaultValue="" className={input}>
                                    <option value="">Choose</option>
                                    {VISIT_OUTCOMES.map((o) => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </label>
                            <label className="block text-xs text-zinc-500">Update stage
                                <select name="stage" defaultValue="" className={input}>
                                    <option value="">Automatic</option>
                                    {STORE_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                                </select>
                            </label>
                            <label className="block text-xs text-zinc-500 sm:col-span-2">Notes
                                <textarea name="notes" rows={3} placeholder="What they said, what they already carry, prices they mentioned…" className={`${input} resize-y`} />
                            </label>
                            <label className="block text-xs text-zinc-500">Next step
                                <input name="nextStep" placeholder="e.g. Call back with prices" className={input} />
                            </label>
                            <label className="block text-xs text-zinc-500">Follow up on
                                <input name="followUpOn" type="date" className={input} />
                            </label>
                            <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
                                <AdminButton type="submit">Save visit</AdminButton>
                                <p className="text-xs text-zinc-500">&quot;Automatic&quot; moves the store to Visited, or to Samples given if you left samples.</p>
                            </div>
                        </form>
                    </Panel>

                    <Panel title={`History (${store.visits.length})`}>
                        {store.visits.length === 0 ? (
                            <p className="text-sm text-zinc-500">No visits or calls logged yet.</p>
                        ) : (
                            <ol className="space-y-5">
                                {store.visits.map((v) => (
                                    <li key={v.id} className="flex gap-3">
                                        <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-zinc-400 shrink-0" />
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex flex-wrap items-baseline gap-x-2">
                                                <p className="font-medium">{KIND_LABEL[v.kind] ?? "Contact"}</p>
                                                <p className="text-sm text-zinc-500">{formatDate(v.date)}{v.author ? ` · logged by ${v.author}` : ""}</p>
                                            </div>
                                            {(v.spokeWith || v.decisionMaker) && (
                                                <p className="text-sm">
                                                    Spoke with {v.spokeWith || "someone"}{v.spokeWithRole ? ` (${v.spokeWithRole})` : ""}
                                                    {v.decisionMaker && <span className="ml-2 text-xs font-semibold text-green-400">✓ person in charge</span>}
                                                </p>
                                            )}
                                            {v.samplesGiven && <p className="text-sm"><span className="text-purple-300">Samples:</span> {v.samplesGiven}</p>}
                                            {v.outcome && <p className="text-sm"><span className="text-zinc-500">Result:</span> {v.outcome}</p>}
                                            {v.notes && <p className="text-sm text-zinc-300 whitespace-pre-wrap">{v.notes}</p>}
                                        </div>
                                        <form action={deleteVisit}>
                                            <input type="hidden" name="visitId" value={v.id} />
                                            <ConfirmButton message="Delete this entry?" type="submit" className="text-xs text-zinc-600 hover:text-red-400" title="Delete entry">✕</ConfirmButton>
                                        </form>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </Panel>
                </div>

                {/* ── Right: stage, contact, notes ── */}
                <div className="space-y-6 min-w-0 lg:sticky lg:top-6">
                    <Panel title="Stage">
                        <form action={setStage} className="grid grid-cols-2 gap-2">
                            <input type="hidden" name="storeId" value={store.id} />
                            {STORE_STAGES.map((s) => (
                                <button
                                    key={s.key}
                                    type="submit"
                                    name="stage"
                                    value={s.key}
                                    disabled={store.stage === s.key}
                                    className={`px-2 py-2 rounded-lg text-xs font-semibold border transition ${store.stage === s.key ? "border-white bg-white/10 text-white" : "border-zinc-700 text-zinc-300 hover:border-zinc-400"}`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </form>
                    </Panel>

                    <Panel title="Contact">
                        <dl className="space-y-4">
                            <Detail label="Person in charge">
                                {store.contactName && <>{store.contactName}{store.contactRole && <span className="text-zinc-500"> · {store.contactRole}</span>}</>}
                            </Detail>
                            <Detail label="Phone">{store.phone && <a href={`tel:${store.phone}`} className="text-blue-400 hover:underline">{store.phone}</a>}</Detail>
                            <Detail label="Email">{store.email && <a href={`mailto:${store.email}`} className="text-blue-400 hover:underline break-all">{store.email}</a>}</Detail>
                            <Detail label="Address">
                                {(store.address || store.city) && (
                                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                                        {[store.address, store.city].filter(Boolean).join(", ")}
                                    </a>
                                )}
                            </Detail>
                            <Detail label="Website">
                                {website && (
                                    <a href={website} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 text-blue-400 hover:underline break-all">
                                        <LinkIcon className="w-4 h-4 shrink-0" /> {store.website!.replace(/^https?:\/\//, "")}
                                    </a>
                                )}
                            </Detail>
                        </dl>
                    </Panel>

                    <Panel title="Sales & payments" action={<Link href="/admin/payments" className="text-sm text-zinc-400 hover:text-white">Payments →</Link>}>
                        {store.sales.length === 0 ? (
                            <p className="text-sm text-zinc-500">No sales to this store yet. Pick this store under &quot;Sold to&quot; when you log a sale.</p>
                        ) : (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div><p className="text-xs text-zinc-500">Bought in total</p><p className="font-semibold tabular-nums">{money(totalBought)}</p></div>
                                    <div><p className="text-xs text-zinc-500">Still owes</p><p className={`font-semibold tabular-nums ${paymentOverdue ? "text-red-400" : unpaidTotal ? "text-amber-300" : "text-green-400"}`}>{money(unpaidTotal)}</p></div>
                                </div>
                                <ul className="divide-y divide-zinc-800 text-sm">
                                    {store.sales.slice(0, 8).map((s) => (
                                        <li key={s.id} className="flex items-center justify-between gap-2 py-2">
                                            <span className="min-w-0 truncate">{s.submission?.productName ?? s.inventoryItem?.name} <span className="text-zinc-500">· {formatDate(s.createdAt)}</span></span>
                                            <span className="flex items-center gap-2 shrink-0"><span className="tabular-nums">{money(s.revenue)}</span><PaymentBadge item={s} /></span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </Panel>

                    <Panel title="Samples left here">
                        {samples.length === 0 ? (
                            <p className="text-sm text-zinc-500">None yet.</p>
                        ) : (
                            <ul className="space-y-2 text-sm">
                                {samples.map((v) => (
                                    <li key={v.id}>{v.samplesGiven} <span className="text-zinc-500">· {formatDate(v.date)}</span></li>
                                ))}
                            </ul>
                        )}
                    </Panel>

                    {store.notes && (
                        <Panel title="Notes"><p className="text-sm text-zinc-300 whitespace-pre-wrap">{store.notes}</p></Panel>
                    )}

                    <form action={deleteStore} className="border-t border-zinc-800 pt-4">
                        <input type="hidden" name="storeId" value={store.id} />
                        <ConfirmButton
                            type="submit"
                            message={`Delete "${store.name}" and its whole history? This can't be undone.`}
                            className="px-4 py-2 rounded-lg text-sm font-semibold border border-red-900 text-red-400 hover:bg-red-950"
                        >
                            Delete store
                        </ConfirmButton>
                    </form>
                </div>
            </div>
        </div>
    );
}
