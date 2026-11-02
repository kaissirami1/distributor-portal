import { PAYMENT_METHODS } from "@/lib/payments";

// "Who bought it, and have they paid?" — shared by every log-a-sale form.
// Leave "Paid already" unticked and the sale shows up under Payments → Owed to you.
export function SaleBillingFields({ stores, showInvoice = true }: { stores: { id: number; name: string }[]; showInvoice?: boolean }) {
    const input = "admin-input mt-1";
    return (
        <>
            <label className="block text-xs text-zinc-500">Sold to (store)
                <select name="storeId" defaultValue="" className={input}>
                    <option value="">Not set</option>
                    {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </label>
            {showInvoice && (
                <label className="block text-xs text-zinc-500">Invoice #
                    <input name="invoiceNumber" placeholder="Optional" className={input} />
                </label>
            )}
            <label className="block text-xs text-zinc-500">Payment due
                <input name="dueDate" type="date" className={input} />
            </label>
            <div className="text-xs text-zinc-500">
                <label className="flex items-center gap-2 text-sm text-zinc-300 mt-5">
                    <input name="paid" type="checkbox" className="w-4 h-4 accent-white" /> Paid already
                </label>
                <select name="paymentMethod" defaultValue="" aria-label="How they paid" className={`${input} mt-2`}>
                    <option value="">How they paid</option>
                    {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>
        </>
    );
}
