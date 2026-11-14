"use client";

import { Check, CircleDashed, Flame, RotateCcw, TriangleAlert, Users } from "lucide-react";
import { FloorGrid } from "@/components/dashboard/floor-map";
import { PageHeader, SampleTag } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ago, timeOfDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useFacilityData } from "@/providers/facility-data-provider";

export function EvacuationView() {
  const { rooms, latest, evacuation, actions, now } = useFacilityData();
  const occupied = (id: string) => (latest[id]?.status ?? "empty") !== "empty";
  const needsCheck = rooms.filter((r) => occupied(r.id) && !evacuation.cleared[r.id]);
  const cleared = rooms.filter((r) => evacuation.cleared[r.id]);
  const empty = rooms.filter((r) => !occupied(r.id) && !evacuation.cleared[r.id]);

  return (
    <>
      <PageHeader
        title="Fire evacuation"
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            Which rooms still have someone in them, in high contrast <SampleTag />
          </span>
        }
        actions={
          <label className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 font-semibold">
            Evacuation mode
            <Switch checked={evacuation.active} onCheckedChange={actions.setEvacuation} aria-label="Evacuation mode" />
          </label>
        }
      />

      {!evacuation.active ? (
        <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-8 text-center sm:p-12">
          <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
            <Flame className="size-8" />
          </span>
          <h2 className="mt-6 text-2xl font-bold">Evacuation mode is off</h2>
          <p className="mx-auto mt-3 max-w-md text-lg text-muted-foreground">
            Turn it on during a fire alarm or drill. The floor map switches to a high-contrast view of occupied vs. empty
            rooms, and staff can mark each room cleared.
          </p>
          <Button size="xl" className="mt-8 bg-orange-600 text-white hover:bg-orange-700" onClick={() => actions.setEvacuation(true)}>
            <Flame /> Start evacuation mode
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-5 rounded-2xl bg-zinc-950 p-5 text-white ring-4 ring-orange-500 sm:p-6">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <p className="flex items-center gap-2 font-heading text-xl font-extrabold tracking-wide text-orange-400 uppercase">
                <Flame className="size-6" /> Evacuation in progress
              </p>
              <p className="text-sm text-zinc-300">
                Started {evacuation.startedAt ? `${timeOfDay(evacuation.startedAt)} (${ago(evacuation.startedAt, now)})` : ""}
              </p>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-yellow-300 p-4 text-zinc-950">
                <p className="font-heading text-4xl font-extrabold tabular sm:text-5xl">{needsCheck.length}</p>
                <p className="mt-1 text-sm font-bold sm:text-base">Need a check</p>
              </div>
              <div className="rounded-xl bg-emerald-500 p-4 text-zinc-950">
                <p className="font-heading text-4xl font-extrabold tabular sm:text-5xl">{cleared.length}</p>
                <p className="mt-1 text-sm font-bold sm:text-base">Cleared</p>
              </div>
              <div className="rounded-xl bg-zinc-700 p-4 text-white">
                <p className="font-heading text-4xl font-extrabold tabular sm:text-5xl">{empty.length}</p>
                <p className="mt-1 text-sm font-bold sm:text-base">Appear empty</p>
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <FloorGrid
              large
              rooms={rooms}
              renderRoom={(room) => <EvacTile roomId={room.id} label={room.label} />}
            />
          </div>
          <ul className="space-y-2 md:hidden">
            {[...needsCheck, ...empty, ...cleared].map((r) => (
              <li key={r.id}>
                <EvacTile roomId={r.id} label={r.label} row />
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Occupancy comes from WiFi motion sensing and may miss someone who is very still. Always follow your fire
              plan and check every room.
            </p>
            <Button variant="outline" size="lg" onClick={() => actions.setEvacuation(false)}>
              <RotateCcw /> End evacuation mode
            </Button>
          </div>
        </>
      )}
    </>
  );
}

function EvacTile({ roomId, label, row = false }: { roomId: string; label: string; row?: boolean }) {
  const { latest, evacuation, actions } = useFacilityData();
  const status = latest[roomId]?.status ?? "empty";
  const isCleared = Boolean(evacuation.cleared[roomId]);
  const isOccupied = status !== "empty";
  const isFall = status === "possible_fall";

  const tone = isCleared
    ? "bg-emerald-600 text-white border-emerald-800"
    : isFall
      ? "bg-red-600 text-white border-red-900 animate-fall-pulse"
      : isOccupied
        ? "bg-blue-700 text-white border-blue-950"
        : "bg-zinc-200 text-zinc-800 border-zinc-400 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-600";

  const stateText = isCleared ? "Cleared" : isFall ? "Possible fall" : isOccupied ? "Occupied · check" : "Appears empty";
  const Icon = isCleared ? Check : isFall ? TriangleAlert : isOccupied ? Users : CircleDashed;

  return (
    <div className={cn("flex w-full gap-3 rounded-xl border-4 p-3", row ? "items-center" : "flex-col", tone)}>
      <div className={cn("flex items-start justify-between", row && "flex-1 items-center justify-start gap-3")}>
        <p className="font-heading text-2xl font-extrabold">{label.replace("Room ", "")}</p>
        <Icon className="size-6" />
        {row && <p className="text-base font-bold">{stateText}</p>}
      </div>
      {!row && <p className="text-base font-extrabold uppercase">{stateText}</p>}
      <Button
        size="lg"
        onClick={() => actions.markCleared(roomId, !isCleared)}
        className={cn(
          "h-11 font-bold",
          !row && "mt-auto w-full",
          isCleared ? "bg-white/20 text-white hover:bg-white/30" : "bg-white text-zinc-950 hover:bg-white/90"
        )}
      >
        {isCleared ? "Undo" : "Mark cleared"}
      </Button>
    </div>
  );
}
