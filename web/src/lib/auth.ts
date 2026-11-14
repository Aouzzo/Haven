"use client";

import { useSyncExternalStore } from "react";

/**
 * MOCK AUTH ONLY. No real auth provider; the session lives in localStorage.
 * The demo password is intentionally public (it's shown on the login page).
 */
export type Role = "caregiver" | "director";

export interface Session {
  email: string;
  role: Role;
  displayName: string;
  roleLabel: string;
  signedInAt: string;
}

export const DEMO_PASSWORD = "demo1234";

export const DEMO_ACCOUNTS: Omit<Session, "signedInAt">[] = [
  { email: "caregiver@demo.com", role: "caregiver", displayName: "Demo Caregiver", roleLabel: "Caregiver" },
  { email: "director@demo.com", role: "director", displayName: "Demo Director", roleLabel: "Director / Admin" },
];

const KEY = "demo-session-v1";
const EVENT = "demo-session-change";

export function signIn(email: string, password: string): Session | null {
  const account = DEMO_ACCOUNTS.find((a) => a.email === email.trim().toLowerCase());
  if (!account || password !== DEMO_PASSWORD) return null;
  const session: Session = { ...account, signedInAt: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // Storage unavailable (private mode). Session won't persist.
  }
  window.dispatchEvent(new Event(EVENT));
  return session;
}

export function signOut() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

let cachedRaw: string | null | undefined;
let cachedSession: Session | null = null;

function readSession(): Session | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw === cachedRaw) return cachedSession;
  cachedRaw = raw;
  try {
    cachedSession = raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    cachedSession = null;
  }
  return cachedSession;
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** `undefined` while loading (server render / before hydration), else the session or null. */
export function useSession(): Session | null | undefined {
  return useSyncExternalStore(subscribe, readSession, () => undefined);
}
