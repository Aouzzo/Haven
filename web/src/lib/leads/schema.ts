/**
 * Pilot request form. Collects ONLY: name, work email, facility name, role,
 * number of rooms, and an optional message. Do not add fields that collect
 * resident or health information.
 */
export const LEAD_ROLES = [
  "Executive Director",
  "Director of Nursing",
  "Caregiver / Nurse",
  "Nurse-call integrator",
  "Other",
] as const;

export interface LeadInput {
  name: string;
  email: string;
  facility: string;
  role: string;
  rooms: number;
  message?: string;
}

export interface Lead extends LeadInput {
  id: string;
  created_at: string;
}

export type LeadErrors = Partial<Record<keyof LeadInput, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateLead(raw: Record<string, unknown>): { ok: true; value: LeadInput } | { ok: false; errors: LeadErrors } {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const name = str(raw.name);
  const email = str(raw.email).toLowerCase();
  const facility = str(raw.facility);
  const role = str(raw.role);
  const message = str(raw.message);
  const rooms = Number(raw.rooms);
  const errors: LeadErrors = {};

  if (name.length < 2 || name.length > 100) errors.name = "Please enter your name.";
  if (!EMAIL_RE.test(email) || email.length > 200) errors.email = "Please enter a valid work email.";
  if (facility.length < 2 || facility.length > 150) errors.facility = "Please enter your facility name.";
  if (!(LEAD_ROLES as readonly string[]).includes(role)) errors.role = "Please choose your role.";
  if (!Number.isInteger(rooms) || rooms < 1 || rooms > 5000) errors.rooms = "Enter a number of rooms between 1 and 5,000.";
  if (message.length > 1000) errors.message = "Please keep the message under 1,000 characters.";

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { name, email, facility, role, rooms, ...(message ? { message } : {}) } };
}
