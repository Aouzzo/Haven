"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BellRing,
  Check,
  CircleCheck,
  Footprints,
  HandHelping,
  ShieldAlert,
  Siren,
  Timer,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { SampleTag } from "@/components/dashboard/page-header";
import { mmss, pct, timeOfDay } from "@/lib/format";
import type { AlertOutcome, FallAlert } from "@/lib/facility/types";
import { cn } from "@/lib/utils";
import { useFacilityData } from "@/providers/facility-data-provider";

interface AlertUI {
  openAlert(id: string): void;
}

const AlertUIContext = createContext<AlertUI>({ openAlert: () => {} });
export const useAlertUI = () => useContext(AlertUIContext);

/** Owns the alert banner + modal. Auto-opens the modal when a new alert arrives. */
export function AlertCenter({ children }: { children: React.ReactNode }) {
  const { openAlerts } = useFacilityData();
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (seen.current === null) {
      seen.current = new Set(openAlerts.map((a) => a.id));
      return;
    }
    const fresh = openAlerts.filter((a) => !seen.current!.has(a.id));
    fresh.forEach((a) => seen.current!.add(a.id));
    if (fresh.length) setFocusedId(fresh[fresh.length - 1].id);
  }, [openAlerts]);

  const focused = openAlerts.find((a) => a.id === focusedId) ?? null;

  return (
    <AlertUIContext.Provider value={{ openAlert: setFocusedId }}>
      <AlertBanner onOpen={setFocusedId} />
      {children}
      <AlertModal alert={focused} others={openAlerts.filter((a) => a.id !== focusedId)} onClose={() => setFocusedId(null)} onSwitch={setFocusedId} />
    </AlertUIContext.Provider>
  );
}

export function stageLabel(a: FallAlert) {
  if (a.stage === "en_route") return "Staff on the way";
  if (a.stage === "acknowledged") return "Acknowledged";
  if (a.stage === "resolved") return "Resolved";
  return a.escalated ? "Escalated to Director of Nursing" : "Waiting for acknowledgment";
}

function AlertBanner({ onOpen }: { onOpen: (id: string) => void }) {
  const { openAlerts, latest, roomsById } = useFacilityData();
  if (!openAlerts.length) return null;
  const a = openAlerts[0];
  const still = latest[a.room_id]?.still_seconds ?? 0;
  const unacked = a.stage === "active";
  return (
    <div
      role="alert"
      className={cn(
        "sticky top-16 z-20 border-b text-white",
        unacked ? "border-red-800 bg-red-600" : "border-red-900 bg-red-700"
      )}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <span className="flex items-center gap-2 font-heading text-lg font-bold">
          <span className="relative flex size-3">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-70" />
            <span className="relative inline-flex size-3 rounded-full bg-white" />
          </span>
          Possible fall · {roomsById[a.room_id]?.label ?? a.room_id}
        </span>
        <span className="tabular text-[0.98rem] font-medium text-white/95">
          No movement for <strong>{mmss(still)}</strong> · {stageLabel(a)}
        </span>
        {a.escalated && a.stage === "active" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-0.5 text-sm font-bold text-red-700">
            <ShieldAlert className="size-4" /> Escalated
          </span>
        )}
        {openAlerts.length > 1 && (
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-sm font-semibold">+{openAlerts.length - 1} more</span>
        )}
        <Button
          size="lg"
          onClick={() => onOpen(a.id)}
          className="ml-auto bg-white font-semibold text-red-700 hover:bg-white/90"
        >
          View alert <ArrowRight />
        </Button>
      </div>
    </div>
  );
}

const STEPS: { key: string; label: string }[] = [
  { key: "detected", label: "Detected" },
  { key: "acknowledged", label: "Acknowledged" },
  { key: "en_route", label: "On the way" },
  { key: "resolved", label: "Resolved" },
];

function AlertModal({
  alert,
  others,
  onClose,
  onSwitch,
}: {
  alert: FallAlert | null;
  others: FallAlert[];
  onClose: () => void;
  onSwitch: (id: string) => void;
}) {
  const { latest, roomsById, settings, now, actions } = useFacilityData();
  const open = alert !== null;
  const a = alert;

  const still = a ? latest[a.room_id]?.still_seconds ?? 0 : 0;
  const elapsed = a ? Math.max(0, (now - Date.parse(a.detected_at)) / 1000) : 0;
  const escalateIn = Math.max(0, settings.escalationSeconds - elapsed);
  const stepIndex = !a ? 0 : a.stage === "active" ? 0 : a.stage === "acknowledged" ? 1 : a.stage === "en_route" ? 2 : 3;
  const roomLabel = a ? roomsById[a.room_id]?.label ?? a.room_id : "";
  const moving = a ? latest[a.room_id]?.status !== "possible_fall" : false;

  const resolve = (outcome: AlertOutcome) => {
    if (!a) return;
    actions.resolve(a.id, outcome);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[94vh] w-[calc(100%-1.5rem)] max-w-xl gap-0 overflow-y-auto rounded-3xl border-2 border-red-500 p-0 sm:max-w-xl"
      >
        {a && (
          <>
            <div className="relative bg-red-600 px-6 pt-6 pb-5 text-white">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 rounded-lg p-1.5 text-white/90 hover:bg-white/15"
                aria-label="Minimize alert"
              >
                <X className="size-5" />
              </button>
              <div className="flex items-center gap-2 text-sm font-semibold tracking-wide text-white/90 uppercase">
                <Siren className="size-4" /> Possible fall detected
                <SampleTag className="ml-1 bg-white/20 text-white">Sample</SampleTag>
              </div>
              <DialogTitle className="mt-2 font-heading text-4xl font-extrabold text-white sm:text-5xl">{roomLabel}</DialogTitle>
              <DialogDescription className="mt-1 text-base text-white/90">
                Detected at <span className="font-semibold tabular">{timeOfDay(a.detected_at)}</span>
              </DialogDescription>
            </div>

            <div className="grid grid-cols-2 gap-px border-b border-border bg-border">
              <div className="bg-card px-6 py-4">
                <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <Timer className="size-4" /> No movement for
                </p>
                <p className="mt-1 font-heading text-4xl font-bold text-red-700 tabular dark:text-red-300">{mmss(still)}</p>
                {moving && <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">Movement detected since</p>}
              </div>
              <div className="bg-card px-6 py-4">
                <p className="text-sm font-medium text-muted-foreground">AI confidence (fall)</p>
                <p className="mt-1 font-heading text-4xl font-bold tabular">{pct(a.confidence)}</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-red-600 transition-all duration-700" style={{ width: pct(a.confidence) }} />
                </div>
              </div>
            </div>

            <div className="space-y-5 px-6 py-5">
              {/* Escalation */}
              {a.stage === "active" && !a.escalated && (
                <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-[0.95rem] font-medium text-amber-900 dark:bg-amber-400/10 dark:text-amber-200">
                  <BellRing className="size-5 shrink-0" />
                  Escalates to Director of Nursing in <span className="font-bold tabular">{mmss(escalateIn)}</span> if not acknowledged
                </p>
              )}
              {a.escalated && (
                <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-[0.95rem] font-semibold text-red-800 ring-1 ring-red-300 dark:bg-red-500/15 dark:text-red-200 dark:ring-red-500/40">
                  <ShieldAlert className="size-5 shrink-0" />
                  Escalated to Director of Nursing{a.escalated_at ? ` at ${timeOfDay(a.escalated_at)}` : ""}
                </p>
              )}

              {/* Progress */}
              <ol className="grid grid-cols-4 gap-2">
                {STEPS.map((s, i) => (
                  <li key={s.key} className="flex flex-col items-center gap-1.5 text-center">
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full text-sm font-bold transition-colors",
                        i <= stepIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {i < stepIndex || (i === stepIndex && i > 0) ? <Check className="size-4" /> : i + 1}
                    </span>
                    <span className={cn("text-xs font-semibold", i <= stepIndex ? "text-foreground" : "text-muted-foreground")}>{s.label}</span>
                  </li>
                ))}
              </ol>
              {a.acknowledged_by && (
                <p className="text-center text-sm text-muted-foreground">
                  Acknowledged by <span className="font-semibold text-foreground">{a.acknowledged_by}</span>
                  {a.acknowledged_at && <> at {timeOfDay(a.acknowledged_at)}</>}
                </p>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  size="xl"
                  className="h-14 text-base"
                  disabled={a.stage !== "active"}
                  onClick={() => actions.acknowledge(a.id)}
                >
                  <Check /> {a.stage === "active" ? "Acknowledge" : "Acknowledged"}
                </Button>
                <Button
                  size="xl"
                  variant="outline"
                  className={cn("h-14 text-base", a.stage === "en_route" && "border-primary bg-accent text-accent-foreground")}
                  disabled={a.stage === "en_route"}
                  onClick={() => actions.markEnRoute(a.id)}
                >
                  <Footprints /> {a.stage === "en_route" ? "On my way ✓" : "On my way"}
                </Button>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-muted-foreground">Resolve</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Button variant="outline" size="lg" className="h-12" onClick={() => resolve("false_alarm")}>
                    <X /> False alarm
                  </Button>
                  <Button variant="outline" size="lg" className="h-12" onClick={() => resolve("resident_ok")}>
                    <CircleCheck /> Resident OK
                  </Button>
                  <Button variant="outline" size="lg" className="h-12" onClick={() => resolve("assistance_given")}>
                    <HandHelping /> Assistance given
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
                <Link
                  href={`/dashboard/rooms/${a.room_id}`}
                  onClick={onClose}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  Open {roomLabel} detail <ArrowRight className="size-4" />
                </Link>
                {others.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-sm">
                    <span className="text-muted-foreground">Also open:</span>
                    {others.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => onSwitch(o.id)}
                        className="rounded-full bg-red-100 px-2.5 py-0.5 font-semibold text-red-800 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-200"
                      >
                        {roomsById[o.room_id]?.label ?? o.room_id}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
