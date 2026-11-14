import { connection } from "next/server";
import { validateLead, type Lead } from "@/lib/leads/schema";
import { listLeads, saveLead, storageKind } from "@/lib/leads/store";

/** POST /api/leads: store a pilot request. */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  // Honeypot: real people never fill this hidden field.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return Response.json({ ok: true });
  }

  const result = validateLead(body);
  if (!result.ok) {
    return Response.json({ ok: false, errors: result.errors }, { status: 422 });
  }

  const lead: Lead = {
    ...result.value,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };

  try {
    await saveLead(lead);
  } catch (err) {
    console.error("Failed to save lead", err);
    return Response.json({ ok: false, error: "Could not save your request. Please try again." }, { status: 500 });
  }
  return Response.json({ ok: true });
}

/**
 * GET /api/leads: list pilot requests for the admin page.
 * Requires the `x-admin-key` header to match LEADS_ADMIN_KEY.
 * In local development without LEADS_ADMIN_KEY set, access is open.
 */
export async function GET(request: Request) {
  await connection();
  const expected = process.env.LEADS_ADMIN_KEY;
  const provided = request.headers.get("x-admin-key") ?? "";

  if (expected) {
    if (provided !== expected) {
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return Response.json(
      { ok: false, error: "not_configured", message: "Set LEADS_ADMIN_KEY to enable the leads page in production." },
      { status: 401 }
    );
  }

  const leads = await listLeads();
  return Response.json({ ok: true, storage: storageKind(), leads });
}
