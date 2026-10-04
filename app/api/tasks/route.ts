import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date?: string | null;
  created_at: number;
  updated_at: number;
  deleted_at?: number | null;
  device_id: string;
  clock: number;
  field_versions: Record<string, number>;
};

function toRow(t: any) {
  return {
    id: t.id,
    title: t.title,
    description: t.description ?? "",
    status: t.status,
    priority: t.priority,
    due_date: t.dueDate ?? null,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
    deleted_at: t.deletedAt ?? null,
    device_id: t.deviceId,
    clock: t.clock,
    field_versions: t.fieldVersions ?? {},
  };
}

function fromRow(r: any) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    status: r.status,
    priority: r.priority,
    dueDate: r.due_date ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at ?? undefined,
    deviceId: r.device_id,
    clock: r.clock,
    fieldVersions: r.field_versions ?? {},
    syncState: "synced" as const,
  };
}

export async function GET() {
  if (!supabase) return NextResponse.json({ tasks: [] });

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .is("deleted_at", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tasks: (data || []).map(fromRow) });
}

export async function POST(req: NextRequest) {
  if (!supabase) return NextResponse.json({ accepted: 0 });

  const body = await req.json();
  const incoming = Array.isArray(body) ? body : [body.task];
  const rows = incoming.map(toRow);

  const { error } = await supabase
    .from("tasks")
    .upsert(rows, { onConflict: "id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ accepted: rows.length });
}

export async function DELETE(req: NextRequest) {
  if (!supabase) return NextResponse.json({ ok: false });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabase
    .from("tasks")
    .update({ deleted_at: Date.now(), updated_at: Date.now() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}