"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PAYMENT_TERMS, payBy, poNumber } from "@/lib/purchaseOrders";
import { getLipari, newBatchCode, newDeliveryCode, oneLine } from "@/lib/lipari";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

// A date box value ("2026-11-24") as noon that day, so it shows the same in every time zone
const toDay = (value: string) => (/^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : null);

const TERMS = PAYMENT_TERMS.map((t) => t.days);

function refresh() {
    revalidatePath("/admin", "layout");
}

// ── Placing orders ──────────────────────────────────────────────────────────

export type OrderRow = {
    itemId: string;
    storeId: string;
    by: "case" | "pallet";
    qty: string;
    perPallet: string;
    unitCost: string;   // Lipari's price per case
    salePrice: string;  // our price per case to the store
    storeTerms: string; // days the store has to pay us
};

export type OrderFormState = { error?: string };

// One purchase order per row, each with its own delivery barcode, all in one batch (one email to Lipari).
// With an id, edits that one order instead (only before it ships).
export async function saveLipariOrders(_prev: OrderFormState, formData: FormData): Promise<OrderFormState> {
    const admin = await requireAdmin();
    const lipari = await getLipari();
    if (!lipari) return { error: "Lipari isn't in your sellers list." };
    const editId = Number(formData.get("id")) || null;

    const warehouseId = Number(formData.get("warehouseId")) || null;
    const warehouse = warehouseId ? await prisma.warehouse.findUnique({ where: { id: warehouseId } }) : null;
    if (!warehouse) return { error: "Pick the 3PL warehouse Lipari ships to. Add one under 3PL Warehouses if it isn't listed." };

    const termsDays = Number(text(formData, "termsDays"));
    if (!TERMS.includes(termsDays)) return { error: "Pick Lipari's payment terms." };

    let rows: OrderRow[];
    try {
        rows = JSON.parse(text(formData, "rows") || "[]");
    } catch {
        return { error: "Something went wrong with the products. Please try again." };
    }
    if (rows.length === 0) return { error: "Add at least one product." };
    if (editId && rows.length !== 1) return { error: "An order holds one product." };

    const [items, stores] = await Promise.all([
        prisma.inventoryItem.findMany({ where: { id: { in: rows.map((r) => Number(r.itemId) || 0) } } }),
        prisma.store.findMany({ where: { id: { in: rows.map((r) => Number(r.storeId) || 0) } } }),
    ]);

    const orders: {
        item: (typeof items)[number]; store: (typeof stores)[number];
        storeTerms: number; cost: number; sale: number; cases: number; pallets: number | null; perPallet: number | null;
    }[] = [];
    for (const [i, r] of rows.entries()) {
        const row = rows.length > 1 ? `Order ${i + 1}: ` : "";
        const item = items.find((it) => it.id === Number(r.itemId));
        const store = stores.find((s) => s.id === Number(r.storeId));
        const qty = Number(r.qty), per = Number(r.perPallet), cost = Number(r.unitCost), sale = Number(r.salePrice), storeTerms = Number(r.storeTerms);
        if (!item) return { error: `${row}pick a Lipari product.` };
        if (!store) return { error: `${row}pick the store it's for.` };
        if (!Number.isInteger(qty) || qty < 1) return { error: `${row}enter how many, as a whole number.` };
        if (r.by === "pallet" && (!Number.isInteger(per) || per < 1)) return { error: `${row}enter how many cases are in one pallet.` };
        if (r.unitCost === "" || !Number.isFinite(cost) || cost < 0) return { error: `${row}enter Lipari's price per case.` };
        if (r.salePrice === "" || !Number.isFinite(sale) || sale < 0) return { error: `${row}enter your price per case to the store.` };
        if (!TERMS.includes(storeTerms)) return { error: `${row}pick when the store pays you.` };
        orders.push({
            item, store, storeTerms, cost, sale,
            cases: r.by === "pallet" ? qty * per : qty,
            pallets: r.by === "pallet" ? qty : null,
            perPallet: r.by === "pallet" ? per : null,
        });
    }

    const shipTo = [warehouse.name, warehouse.address, oneLine(warehouse.city, [warehouse.state, warehouse.zip].filter(Boolean).join(" "))].filter(Boolean).join("\n");
    const shared = {
        sellerId: lipari.id,
        sellerName: lipari.name,
        warehouseId: warehouse.id,
        shipTo,
        termsDays,
        wantedBy: toDay(text(formData, "wantedBy")),
        notes: text(formData, "notes").slice(0, 2000) || null,
    };
    const orderData = (o: (typeof orders)[number]) => ({
        ...shared,
        storeId: o.store.id,
        storeName: o.store.name,
        storeTermsDays: o.storeTerms,
    });
    const lineData = (o: (typeof orders)[number]) => ({
        itemId: o.item.id, itemName: o.item.name, unit: o.item.unit, cases: o.cases, pallets: o.pallets, unitCost: o.cost, salePrice: o.sale,
    });
    // Each product remembers its latest Lipari price, your price and pallet size, for next time
    const rememberPrices = orders.map((o) =>
        prisma.inventoryItem.update({ where: { id: o.item.id }, data: { cost: o.cost, price: o.sale, ...(o.perPallet ? { casesPerPallet: o.perPallet } : {}) } }),
    );

    if (editId) {
        const existing = await prisma.purchaseOrder.findUnique({ where: { id: editId } });
        if (!existing) return { error: "That order no longer exists." };
        if (!["draft", "sent", "confirmed"].includes(existing.status)) return { error: "This order has shipped, so it can't be changed any more." };
        await prisma.$transaction([
            prisma.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: editId } }),
            prisma.purchaseOrder.update({ where: { id: editId }, data: { ...orderData(orders[0]), lines: { create: [lineData(orders[0])] } } }),
            ...rememberPrices,
        ]);
        refresh();
        redirect(`/admin/lipari/${editId}?saved=1`);
    }

    const batchCode = newBatchCode();
    // Barcodes are random, so a repeat is very unlikely; check anyway
    const codes = new Set<string>();
    while (codes.size < orders.length) {
        const code = newDeliveryCode();
        if (!(await prisma.purchaseOrder.findUnique({ where: { doCode: code }, select: { id: true } }))) codes.add(code);
    }
    const codeList = [...codes];
    await prisma.$transaction([
        ...orders.map((o, i) => prisma.purchaseOrder.create({
            data: { ...orderData(o), author: admin, batchCode, doCode: codeList[i], lines: { create: [lineData(o)] } },
        })),
        ...rememberPrices,
    ]);

    refresh();
    redirect(`/admin/lipari/batch/${batchCode}?created=${orders.length}`);
}

// ── Moving orders along ─────────────────────────────────────────────────────

const OPEN = ["draft", "sent", "confirmed", "shipped"];

// "I emailed Lipari": every order in the email that wasn't sent yet becomes sent
export async function markBatchSent(formData: FormData) {
    await requireAdmin();
    const batch = text(formData, "batch");
    await prisma.purchaseOrder.updateMany({ where: { batchCode: batch, status: "draft" }, data: { status: "sent", sentAt: new Date() } });
    refresh();
    redirect(`/admin/lipari/batch/${batch}?sent=1`);
}

export async function setLipariStatus(formData: FormData) {
    await requireAdmin();
    const id = Number(formData.get("id"));
    const to = text(formData, "to");
    const order = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!order || !OPEN.concat("cancelled").includes(order.status)) redirect(`/admin/lipari/${id}`);
    const now = new Date();
    const changes: Record<string, object> = {
        sent: { status: "sent", sentAt: order.sentAt ?? now },
        confirmed: { status: "confirmed", confirmedAt: now, sentAt: order.sentAt ?? now },
        cancelled: { status: "cancelled" },
        draft: { status: "draft" },
    };
    if (!changes[to]) redirect(`/admin/lipari/${id}`);
    await prisma.purchaseOrder.update({ where: { id }, data: changes[to] });
    refresh();
    redirect(`/admin/lipari/${id}?status=${to}`);
}

export async function markLipariShipped(formData: FormData) {
    await requireAdmin();
    const id = Number(formData.get("id"));
    const order = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!order || !OPEN.includes(order.status)) redirect(`/admin/lipari/${id}`);
    const now = new Date();
    await prisma.purchaseOrder.update({
        where: { id },
        data: {
            status: "shipped",
            shippedAt: order.shippedAt ?? now,
            sentAt: order.sentAt ?? now,
            tracking: text(formData, "tracking").slice(0, 120) || null,
            expectedAt: toDay(text(formData, "expectedAt")),
        },
    });
    refresh();
    redirect(`/admin/lipari/${id}?status=shipped`);
}

// The 3PL received it: record what came, and add what we owe Lipari to Payments
export async function markAtWarehouse(formData: FormData) {
    const admin = await requireAdmin();
    const id = Number(formData.get("id"));
    const order = await prisma.purchaseOrder.findUnique({ where: { id }, include: { lines: { include: { item: { select: { sku: true } } } } } });
    if (!order || !OPEN.includes(order.status)) redirect(`/admin/lipari/${id}`);
    const line = order.lines[0];
    const raw = text(formData, "received");
    const received = Number(raw);
    if (!line || raw === "" || !Number.isInteger(received) || received < 0 || received > 100_000) redirect(`/admin/lipari/${id}?error=received`);

    const arrived = toDay(text(formData, "arrivedOn")) ?? new Date();
    const amount = Math.round(received * line.unitCost * 100) / 100;
    await prisma.$transaction([
        prisma.purchaseOrderLine.update({ where: { id: line.id }, data: { receivedCases: received, batch: text(formData, "batch").slice(0, 100) || null } }),
        prisma.purchaseOrder.update({
            where: { id },
            data: {
                status: "received",
                receivedAt: arrived,
                sentAt: order.sentAt ?? arrived,
                ...(amount > 0 ? {
                    bill: {
                        create: {
                            payee: order.sellerName,
                            amount,
                            description: `${poNumber(order.id)}: ${received} × ${line.item?.sku ? `#${line.item.sku} ` : ""}${line.itemName}`.slice(0, 300),
                            dueDate: payBy(arrived, order.termsDays),
                            author: admin,
                        },
                    },
                } : {}),
            },
        }),
    ]);
    refresh();
    redirect(`/admin/lipari/${id}?status=received`);
}

// The 3PL delivered it to the store: the store now owes us (in Payments, and on the store's page)
export async function markDelivered(formData: FormData) {
    await requireAdmin();
    const id = Number(formData.get("id"));
    const order = await prisma.purchaseOrder.findUnique({ where: { id }, include: { lines: true, warehouse: { select: { name: true } } } });
    if (!order || order.status !== "received") redirect(`/admin/lipari/${id}`);
    const line = order.lines[0];
    const raw = text(formData, "delivered");
    const delivered = Number(raw);
    if (!line || raw === "" || !Number.isInteger(delivered) || delivered < 0 || delivered > 100_000) redirect(`/admin/lipari/${id}?error=delivered`);

    const on = toDay(text(formData, "deliveredOn")) ?? new Date();
    await prisma.$transaction([
        prisma.purchaseOrder.update({ where: { id }, data: { status: "delivered", deliveredAt: on } }),
        ...(delivered > 0 ? [prisma.sale.create({
            data: {
                quantity: delivered,
                revenue: Math.round(delivered * (line.salePrice ?? 0) * 100) / 100,
                inventoryItemId: line.itemId,
                storeId: order.storeId,
                purchaseOrderId: order.id,
                invoiceNumber: poNumber(order.id),
                dueDate: payBy(on, order.storeTermsDays),
                note: `${poNumber(order.id)}: Lipari order delivered${order.warehouse ? ` by ${order.warehouse.name}` : ""}`,
            },
        })] : []),
    ]);
    refresh();
    redirect(`/admin/lipari/${id}?status=delivered`);
}

// Orders that reached the 3PL stay, because Lipari's bill and the store's payment depend on them
export async function deleteLipariOrder(formData: FormData) {
    await requireAdmin();
    const id = Number(formData.get("id"));
    const order = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (order && !["received", "delivered"].includes(order.status)) await prisma.purchaseOrder.delete({ where: { id } });
    refresh();
    redirect(`/admin/lipari?deleted=${order ? poNumber(order.id) : ""}`);
}
