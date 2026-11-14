import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Lead } from "@/lib/leads/schema";

/**
 * Lead storage.
 * - If KV_REST_API_URL and KV_REST_API_TOKEN are set (Vercel KV / Upstash Redis),
 *   leads are stored in a Redis list via the REST API.
 * - Otherwise they go to a local JSON file (.data/leads.json). On Vercel without
 *   KV this falls back to /tmp, which is temporary. Configure KV before relying on it.
 */
const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const KEY = "pilot_leads";

function filePath() {
  return process.env.VERCEL ? "/tmp/leads.json" : path.join(process.cwd(), ".data", "leads.json");
}

async function kv(command: (string | number)[]) {
  const res = await fetch(KV_URL!, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`KV request failed: ${res.status}`);
  return (await res.json()) as { result: unknown };
}

async function readFile(): Promise<Lead[]> {
  try {
    return JSON.parse(await fs.readFile(filePath(), "utf8")) as Lead[];
  } catch {
    return [];
  }
}

export function storageKind() {
  if (KV_URL && KV_TOKEN) return "kv" as const;
  return process.env.VERCEL ? ("tmp" as const) : ("file" as const);
}

export async function saveLead(lead: Lead) {
  if (KV_URL && KV_TOKEN) {
    await kv(["LPUSH", KEY, JSON.stringify(lead)]);
    return;
  }
  const leads = await readFile();
  leads.unshift(lead);
  await fs.mkdir(path.dirname(filePath()), { recursive: true });
  await fs.writeFile(filePath(), JSON.stringify(leads, null, 2), "utf8");
}

export async function listLeads(): Promise<Lead[]> {
  if (KV_URL && KV_TOKEN) {
    const { result } = await kv(["LRANGE", KEY, 0, 999]);
    return ((result as string[]) ?? []).map((s) => JSON.parse(s) as Lead);
  }
  return readFile();
}
