"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server/requireAdmin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { DataQuality } from "@/lib/supabase/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const URL_RE = /^https?:\/\//i;
const QUALITY_VALUES: readonly DataQuality[] = ["verified", "tmdb_only", "partial"];

function trim(raw: FormDataEntryValue | null): string {
  return typeof raw === "string" ? raw.trim() : "";
}

function nullableTrim(raw: FormDataEntryValue | null): string | null {
  const v = trim(raw);
  return v.length === 0 ? null : v;
}

function parseNumber(raw: FormDataEntryValue | null): number | null {
  const v = trim(raw);
  if (v.length === 0) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function saveFilm(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) throw new Error("invalid_id");

  const quality = trim(formData.get("data_quality")) as DataQuality;
  if (!QUALITY_VALUES.includes(quality)) throw new Error("invalid_data_quality");

  const whereToWatch = nullableTrim(formData.get("where_to_watch_url"));
  if (whereToWatch && !URL_RE.test(whereToWatch)) {
    throw new Error("where_to_watch_url_must_be_http");
  }

  const update = {
    trivia: trim(formData.get("trivia")),
    tagline: trim(formData.get("tagline")),
    where_to_watch_url: whereToWatch,
    banner_parent: nullableTrim(formData.get("banner_parent")),
    box_office_cr: parseNumber(formData.get("box_office_cr")),
    imdb_score: parseNumber(formData.get("imdb_score")),
    data_quality: quality,
  };

  const db = supabaseAdmin();
  const { error } = await db.from("movies").update(update).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/films/${id}`);
  revalidatePath("/admin/films");
  redirect(`/admin/films/${id}?saved=1`);
}
