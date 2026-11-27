import { AdminButton, AdminLink } from "@/components/admin/ui";
import { saveWarehouse } from "./actions";
import { WAREHOUSE_LABELS } from "./labels";

type Warehouse = {
    id: number;
    name: string;
    contactName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    hours: string | null;
    receivingFee: number | null;
    storageFee: number | null;
    deliveryFee: number | null;
    status: string;
    notes: string | null;
};

export function WarehouseForm({ warehouse }: { warehouse?: Warehouse }) {
    const field = "admin-input mt-1.5";
    const label = "text-sm text-zinc-300";
    const box = "bg-zinc-900 border border-zinc-800 rounded-xl p-5 grid sm:grid-cols-2 gap-4";
    const money = (name: keyof Warehouse, text: string, hint: string) => (
        <label className="block">
            <span className={label}>{text}</span>
            <div className="flex items-center gap-2 mt-1.5">
                <span className="text-sm text-zinc-500">$</span>
                <input name={name} type="number" min={0} step="0.01" defaultValue={warehouse?.[name] as number ?? ""} placeholder="Not quoted yet" className="admin-input" />
            </div>
            <span className="block text-xs text-zinc-500 mt-1">{hint}</span>
        </label>
    );

    return (
        <form action={saveWarehouse} className="space-y-6 max-w-3xl">
            {warehouse && <input type="hidden" name="id" value={warehouse.id} />}

            <section className={box}>
                <h2 className="sm:col-span-2 font-semibold">The company</h2>
                <label className="block sm:col-span-2">
                    <span className={label}>Company name *</span>
                    <input name="name" required defaultValue={warehouse?.name} placeholder="e.g. XYZ Logistics" className={field} />
                </label>
                <label className="block">
                    <span className={label}>Status</span>
                    <select name="status" defaultValue={warehouse?.status ?? "quoting"} className={field}>
                        {Object.entries(WAREHOUSE_LABELS).map(([key, l]) => <option key={key} value={key}>{l.label}</option>)}
                    </select>
                </label>
                <label className="block">
                    <span className={label}>Receiving hours / delivery days</span>
                    <input name="hours" defaultValue={warehouse?.hours ?? ""} placeholder="e.g. Mon–Fri 7am–3pm, delivers Tue & Thu" className={field} />
                </label>
            </section>

            <section className={box}>
                <h2 className="sm:col-span-2 font-semibold">Address (where Lipari ships the pallets)</h2>
                <label className="block sm:col-span-2">
                    <span className={label}>Street</span>
                    <input name="address" defaultValue={warehouse?.address ?? ""} placeholder="e.g. 1234 Warehouse Way, Dock 5" className={field} />
                </label>
                <label className="block">
                    <span className={label}>City</span>
                    <input name="city" defaultValue={warehouse?.city ?? ""} className={field} />
                </label>
                <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                        <span className={label}>State</span>
                        <input name="state" defaultValue={warehouse?.state ?? "CA"} className={field} />
                    </label>
                    <label className="block">
                        <span className={label}>ZIP</span>
                        <input name="zip" defaultValue={warehouse?.zip ?? ""} className={field} />
                    </label>
                </div>
            </section>

            <section className={box}>
                <h2 className="sm:col-span-2 font-semibold">Who you deal with</h2>
                <label className="block">
                    <span className={label}>Contact person</span>
                    <input name="contactName" defaultValue={warehouse?.contactName ?? ""} className={field} />
                </label>
                <label className="block">
                    <span className={label}>Phone</span>
                    <input name="phone" type="tel" defaultValue={warehouse?.phone ?? ""} className={field} />
                </label>
                <label className="block sm:col-span-2">
                    <span className={label}>Email</span>
                    <input name="email" type="email" defaultValue={warehouse?.email ?? ""} placeholder="Where delivery instructions go" className={field} />
                </label>
            </section>

            <section className={`${box} md:grid-cols-3`}>
                <h2 className="sm:col-span-2 md:col-span-3 font-semibold">Their prices</h2>
                {money("receivingFee", "To receive a pallet", "Per pallet that arrives")}
                {money("storageFee", "Storage", "Per pallet, per month")}
                {money("deliveryFee", "Delivery to a store", "Per delivery")}
            </section>

            <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <label className="block">
                    <span className={label}>Notes</span>
                    <textarea name="notes" rows={3} defaultValue={warehouse?.notes ?? ""} placeholder="Food-grade? Minimums? Anything from the quote" className={`${field} resize-y`} />
                </label>
            </section>

            <div className="flex flex-wrap gap-2">
                <AdminButton type="submit">{warehouse ? "Save changes" : "Save 3PL"}</AdminButton>
                <AdminLink href={warehouse ? `/admin/warehouses/${warehouse.id}` : "/admin/warehouses"} variant="ghost">Cancel</AdminLink>
            </div>
        </form>
    );
}
