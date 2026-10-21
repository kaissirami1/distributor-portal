import { NextRequest, NextResponse } from "next/server";
import { STATUSES, type Status } from "@/lib/status";
import { changeSubmissionStatus } from "@/lib/submissions";
import { isAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const { ids, status } = (await req.json()) as { ids: number[]; status: string };

    if (!ids?.length || !STATUSES.includes(status as Status)) {
        return NextResponse.json({ error: "Missing ids or invalid status" }, { status: 400 });
    }

    const updated = await changeSubmissionStatus(ids, status as Status);
    return NextResponse.json({ ok: true, updated });
}
