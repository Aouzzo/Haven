"use client";

import { ChevronRight, CircleCheck, ShieldAlert, Timer } from "lucide-react";
import { stageLabel, useAlertUI } from "@/components/dashboard/alert-center";
import { mmss, timeOfDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useFacilityData } from "@/providers/facility-data-provider";

/** Big-tap-target list of open alerts (used on phones and in the overview sidebar). */
export function ActiveAlertList({ emptyHint = true }: { emptyHint?: boolean }) {
  const { openAlerts, latest, roomsById } = useFacilityData();
  const { openAlert } = useAlertUI();

  if (!openAlerts.length) {
    return emptyHint ? (
      <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-4 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200">
        <CircleCheck className="size-6 shrink-0" />
        <div>
          <p className="font-semibold">No active alerts</p>
          <p className="text-sm opacity-80">You&apos;ll hear a chime and see a red banner if one comes in.</p>
        </div>
      </div>
    ) : null;
  }

  return (
    <ul className="space-y-3">
      {openAlerts.map((a) => {
        const still = latest[a.room_id]?.still_seconds ?? 0;
        return (
          <li key={a.id}>
            <button
              onClick={() => openAlert(a.id)}
              className={cn(
                "flex min-h-20 w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-colors",
                a.stage === "active"
                  ? "animate-fall-pulse border-red-500 bg-red-50 dark:bg-red-500/15"
                  : "border-red-300 bg-card dark:border-red-500/40"
              )}
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
                {a.escalated && a.stage === "active" ? <ShieldAlert className="size-6" /> : <Timer className="size-6" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-xl font-bold text-red-700 dark:text-red-300">
                  {roomsById[a.room_id]?.label ?? a.room_id}
                </span>
                <span className="block text-sm font-medium tabular">
                  Still {mmss(still)} · since {timeOfDay(a.detected_at, false)}
                </span>
                <span className="block text-sm text-muted-foreground">{stageLabel(a)}</span>
              </span>
              <ChevronRight className="size-6 shrink-0 text-muted-foreground" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
