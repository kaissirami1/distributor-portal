import { CONTACT_ROLES, STORE_STAGES, STORE_TYPES } from "@/lib/stores";
import { AdminButton, AdminLink } from "@/components/admin/ui";
import { saveStore } from "./actions";

type Store = {
    id: number;
    name: string;
    type: string | null;
    address: string | null;
    city: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    contactName: string | null;
    contactRole: string | null;
    stage: string;
    nextStep: string | null;
    followUpOn: Date | null;
    notes: string | null;
};

const dateValue = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

// The form for adding a store or editing its details
export function StoreForm({ store }: { store?: Store }) {
    const field = "admin-input mt-1.5";
    const label = "text-sm text-zinc-300";
    const box = "bg-zinc-900 border border-zinc-800 rounded-xl p-5 grid sm:grid-cols-2 gap-4";

    return (
        <form action={saveStore} className="space-y-6 max-w-3xl">
            {store && <input type="hidden" name="id" value={store.id} />}

            <section className={box}>
                <h2 className="sm:col-span-2 font-semibold">The store</h2>
                <label className="block sm:col-span-2">
                    <span className={label}>Store name *</span>
                    <input name="name" required defaultValue={store?.name} placeholder="e.g. Al Amir Market" className={field} />
                </label>
                <label className="block">
                    <span className={label}>Type of store</span>
                    <input name="type" list="store-types" defaultValue={store?.type ?? ""} placeholder="Pick or type" className={field} />
                    <datalist id="store-types">{STORE_TYPES.map((t) => <option key={t} value={t} />)}</datalist>
                </label>
                <label className="block">
                    <span className={label}>City</span>
                    <input name="city" defaultValue={store?.city ?? ""} placeholder="e.g. Anaheim" className={field} />
                </label>
                <label className="block sm:col-span-2">
                    <span className={label}>Address</span>
                    <input name="address" defaultValue={store?.address ?? ""} placeholder="Street address" className={field} />
                </label>
                <label className="block">
                    <span className={label}>Store phone</span>
                    <input name="phone" type="tel" defaultValue={store?.phone ?? ""} className={field} />
                </label>
                <label className="block">
                    <span className={label}>Email</span>
                    <input name="email" type="email" defaultValue={store?.email ?? ""} className={field} />
                </label>
                <label className="block sm:col-span-2">
                    <span className={label}>Website or Instagram</span>
                    <input name="website" defaultValue={store?.website ?? ""} placeholder="https://" className={field} />
                </label>
            </section>

            <section className={box}>
                <h2 className="sm:col-span-2 font-semibold">Owner or person in charge</h2>
                <label className="block">
                    <span className={label}>Name</span>
                    <input name="contactName" defaultValue={store?.contactName ?? ""} className={field} />
                </label>
                <label className="block">
                    <span className={label}>Role</span>
                    <input name="contactRole" list="contact-roles" defaultValue={store?.contactRole ?? ""} placeholder="Owner, Manager, Buyer…" className={field} />
                    <datalist id="contact-roles">{CONTACT_ROLES.map((r) => <option key={r} value={r} />)}</datalist>
                </label>
            </section>

            <section className={box}>
                <h2 className="sm:col-span-2 font-semibold">Where things stand</h2>
                <label className="block">
                    <span className={label}>Stage</span>
                    <select name="stage" defaultValue={store?.stage ?? "new"} className={field}>
                        {STORE_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                </label>
                <label className="block">
                    <span className={label}>Follow up on</span>
                    <input name="followUpOn" type="date" defaultValue={dateValue(store?.followUpOn ?? null)} className={field} />
                </label>
                <label className="block sm:col-span-2">
                    <span className={label}>Next step</span>
                    <input name="nextStep" defaultValue={store?.nextStep ?? ""} placeholder="e.g. Bring price list and za'atar samples" className={field} />
                </label>
                <label className="block sm:col-span-2">
                    <span className={label}>Notes</span>
                    <textarea name="notes" rows={4} defaultValue={store?.notes ?? ""} placeholder="Best time to visit, what they already carry, anything to remember" className={`${field} resize-y`} />
                </label>
            </section>

            <div className="flex flex-wrap gap-2">
                <AdminButton type="submit">{store ? "Save changes" : "Add store"}</AdminButton>
                <AdminLink href={store ? `/admin/stores/${store.id}` : "/admin/stores"} variant="ghost">Cancel</AdminLink>
            </div>
        </form>
    );
}
