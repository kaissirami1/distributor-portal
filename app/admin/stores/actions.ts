"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { STORE_STAGES, VISIT_KINDS } from "@/lib/stores";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const isStage = (key: string) => STORE_STAGES.some((s) => s.key === key);

// A date box value ("2026-11-01") as noon that day, so it shows the same in every time zone
function day(value: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : null;
}

function refresh(id?: number) {
    revalidatePath("/admin/stores");
    if (id) revalidatePath(`/admin/stores/${id}`);
    revalidatePath("/admin");
}

// Adds a new store, or saves changes when the form has an id
export async function saveStore(formData: FormData) {
    await requireAdmin();
    const id = Number(formData.get("id")) || null;
    const stage = text(formData, "stage");
    const data = {
        name: text(formData, "name"),
        type: text(formData, "type") || null,
        address: text(formData, "address") || null,
        city: text(formData, "city") || null,
        phone: text(formData, "phone") || null,
        email: text(formData, "email") || null,
        website: text(formData, "website") || null,
        contactName: text(formData, "contactName") || null,
        contactRole: text(formData, "contactRole") || null,
        stage: isStage(stage) ? stage : "new",
        nextStep: text(formData, "nextStep") || null,
        followUpOn: day(text(formData, "followUpOn")),
        notes: text(formData, "notes") || null,
    };
    if (!data.name) redirect(`/admin/stores/${id ?? "new"}${id ? "?edit=1&" : "?"}error=1`);

    const store = id
        ? await prisma.store.update({ where: { id }, data })
        : await prisma.store.create({ data });
    refresh(store.id);
    redirect(`/admin/stores/${store.id}?saved=1`);
}

// Logs a visit, call or message, and moves the store along
export async function logVisit(formData: FormData) {
    const admin = await requireAdmin();
    const storeId = Number(formData.get("storeId"));
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) redirect("/admin/stores");

    const kind = VISIT_KINDS.some((k) => k.key === text(formData, "kind")) ? text(formData, "kind") : "visit";
    const samplesGiven = text(formData, "samplesGiven") || null;
    const spokeWith = text(formData, "spokeWith") || null;
    const spokeWithRole = text(formData, "spokeWithRole") || null;
    const decisionMaker = formData.get("decisionMaker") === "on";

    // The stage you picked, or move it forward automatically (never backwards)
    const chosen = text(formData, "stage");
    let stage = store.stage;
    if (isStage(chosen)) stage = chosen;
    else if (samplesGiven && ["new", "visited"].includes(store.stage)) stage = "samples";
    else if (store.stage === "new") stage = "visited";

    const nextStep = text(formData, "nextStep");
    const followUpOn = day(text(formData, "followUpOn"));

    await prisma.$transaction([
        prisma.storeVisit.create({
            data: {
                storeId,
                kind,
                date: day(text(formData, "date")) ?? new Date(),
                spokeWith,
                spokeWithRole,
                decisionMaker,
                samplesGiven,
                outcome: text(formData, "outcome") || null,
                notes: text(formData, "notes") || null,
                author: admin,
            },
        }),
        prisma.store.update({
            where: { id: storeId },
            data: {
                stage,
                // Only replace the next step / follow-up date when you entered new ones
                ...(nextStep ? { nextStep } : {}),
                ...(followUpOn ? { followUpOn } : {}),
                // Remember the person in charge if we didn't have them yet
                ...(decisionMaker && spokeWith && !store.contactName ? { contactName: spokeWith, contactRole: spokeWithRole } : {}),
            },
        }),
    ]);

    refresh(storeId);
    redirect(`/admin/stores/${storeId}?logged=1`);
}

// Quick stage buttons on a store's page
export async function setStage(formData: FormData) {
    await requireAdmin();
    const storeId = Number(formData.get("storeId"));
    const stage = text(formData, "stage");
    if (isStage(stage)) await prisma.store.update({ where: { id: storeId }, data: { stage } });
    refresh(storeId);
}

// Mark the follow-up as done (clears the next step and date)
export async function clearFollowUp(formData: FormData) {
    await requireAdmin();
    const storeId = Number(formData.get("storeId"));
    await prisma.store.update({ where: { id: storeId }, data: { nextStep: null, followUpOn: null } });
    refresh(storeId);
}

export async function deleteVisit(formData: FormData) {
    await requireAdmin();
    const visit = await prisma.storeVisit.delete({ where: { id: Number(formData.get("visitId")) } });
    refresh(visit.storeId);
}

export async function deleteStore(formData: FormData) {
    await requireAdmin();
    const store = await prisma.store.delete({ where: { id: Number(formData.get("storeId")) } });
    refresh();
    redirect(`/admin/stores?deleted=${encodeURIComponent(store.name)}`);
}
