/** Formatting helpers (client-side; never call during server render). */

export function mmss(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

export function humanDuration(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, "0")}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${String(m % 60).padStart(2, "0")}m`;
}

export function timeOfDay(iso: string, seconds = true) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", ...(seconds ? { second: "2-digit" } : {}) });
}

export function dateTime(iso: string) {
  return new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function ago(iso: string, now: number) {
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function pct(v: number, digits = 0) {
  return `${(v * 100).toFixed(digits)}%`;
}

/** Seconds between detection and acknowledgment, or null. */
export function responseSeconds(a: { detected_at: string; acknowledged_at?: string }) {
  return a.acknowledged_at ? (Date.parse(a.acknowledged_at) - Date.parse(a.detected_at)) / 1000 : null;
}

export const OUTCOME_LABEL = {
  false_alarm: "False alarm",
  resident_ok: "Resident OK",
  assistance_given: "Assistance given",
} as const;
