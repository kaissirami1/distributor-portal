import { AdminButton, AdminLink } from "@/components/admin/ui";
import { saveSeller } from "./actions";

type Seller = {
    id?: number;
    name: string;
    contactName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    website: string | null;
    notes: string | null;
};

// The form for adding a seller or editing their details
export function SellerForm({ seller }: { seller?: Partial<Seller> }) {
    const field = "admin-input mt-1.5";
    const label = "text-sm text-zinc-300";
    const box = "bg-zinc-900 border border-zinc-800 rounded-xl p-5 grid sm:grid-cols-2 gap-4";

    return (
        <form action={saveSeller} className="space-y-6 max-w-3xl">
            {seller?.id && <input type="hidden" name="id" value={seller.id} />}

            <section className={box}>
                <h2 className="sm:col-span-2 font-semibold">The business</h2>
                <label className="block sm:col-span-2">
                    <span className={label}>Business name *</span>
                    <input name="name" required defaultValue={seller?.name ?? ""} placeholder="e.g. Gloria's Kitchen" className={field} />
                </label>
                <label className="block sm:col-span-2">
                    <span className={label}>Address</span>
                    <input name="address" defaultValue={seller?.address ?? ""} placeholder="Where you pick up, or where they ship from" className={field} />
                </label>
                <label className="block">
                    <span className={label}>City</span>
                    <input name="city" defaultValue={seller?.city ?? ""} placeholder="e.g. Dearborn" className={field} />
                </label>
                <label className="block">
                    <span className={label}>State</span>
                    <input name="state" defaultValue={seller?.state ?? ""} placeholder="e.g. MI" className={field} />
                </label>
                <label className="block sm:col-span-2">
                    <span className={label}>Website or Instagram</span>
                    <input name="website" defaultValue={seller?.website ?? ""} placeholder="https://" className={field} />
                </label>
            </section>

            <section className={box}>
                <h2 className="sm:col-span-2 font-semibold">Who you deal with</h2>
                <label className="block sm:col-span-2">
                    <span className={label}>Contact name</span>
                    <input name="contactName" defaultValue={seller?.contactName ?? ""} className={field} />
                </label>
                <label className="block">
                    <span className={label}>Phone</span>
                    <input name="phone" type="tel" defaultValue={seller?.phone ?? ""} className={field} />
                </label>
                <label className="block">
                    <span className={label}>Email</span>
                    <input name="email" type="email" defaultValue={seller?.email ?? ""} className={field} />
                </label>
                <label className="block sm:col-span-2">
                    <span className={label}>Notes</span>
                    <textarea name="notes" rows={4} defaultValue={seller?.notes ?? ""} placeholder="Payment terms, lead time, minimum order, licenses on file" className={`${field} resize-y`} />
                </label>
            </section>

            <div className="flex flex-wrap gap-2">
                <AdminButton type="submit">{seller?.id ? "Save changes" : "Add seller"}</AdminButton>
                <AdminLink href={seller?.id ? `/admin/sellers/${seller.id}` : "/admin/sellers"} variant="ghost">Cancel</AdminLink>
            </div>
        </form>
    );
}
