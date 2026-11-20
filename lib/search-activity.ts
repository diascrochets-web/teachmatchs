import { createClient } from "@/lib/supabase/client";

export type ActivityCategory = "search" | "job" | "location" | "school";

function makeVisitorId() {
  if (typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
  const bytes = window.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function getVisitorId() {
  const storageKey = "teachmatch-trend-visitor";
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored && /^[0-9a-f-]{36}$/i.test(stored)) return stored;
    const created = makeVisitorId();
    window.localStorage.setItem(storageKey, created);
    return created;
  } catch {
    return makeVisitorId();
  }
}

export async function recordActivity(category: ActivityCategory, input: string) {
  if (typeof window === "undefined") return;

  const term = input.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().toLocaleLowerCase("en-NG").slice(0, 100);
  const digits = term.replace(/\D/g, "");
  if (term.length < 2 || term.includes("@") || digits.length >= 8) return;

  try {
    const visitorId = getVisitorId();
    const day = new Date().toISOString().slice(0, 10);
    const dedupeKey = `teachmatch-trend:${day}:${category}:${term}`;
    if (window.localStorage.getItem(dedupeKey)) return;

    const { error } = await createClient().from("search_activity").insert({
      visitor_id: visitorId,
      category,
      term,
    });

    if (!error || error.code === "23505") window.localStorage.setItem(dedupeKey, "1");
  } catch {
    // Search should keep working when analytics storage is unavailable.
  }
}
