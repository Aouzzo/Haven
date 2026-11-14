"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BrainCircuit, Gauge, Radio, Timer } from "lucide-react";
import { useAlertUI } from "@/components/dashboard/alert-center";
import { ConfidenceChart, MotionChart } from "@/components/dashboard/charts";
import { PageHeader, Panel, SampleTag } from "@/components/dashboard/page-header";
import { StatusDot, StatusPill } from "@/components/dashboard/status-pill";
import { Button } from "@/components/ui/button";
import { ago, dateTime, humanDuration, mmss, OUTCOME_LABEL, pct, responseSeconds, timeOfDay } from "@/lib/format";
import { ACTIVITIES, ACTIVITY_META, STATUS_META } from "@/lib/status";
import { cn } from "@/lib/utils";
import { useFacilityData } from "@/providers/facility-data-provider";

export function RoomDetail() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;
  const { roomsById, latest, motionHistory, timeline, alerts, sensors, now, openAlerts } = useFacilityData();
  const { openAlert } = useAlertUI();
  const room = roomsById[roomId];
  const u = latest[roomId];

  if (!room || !u) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-2xl font-bold">Room not found</h1>
        <p className="mt-2 text-muted-foreground">There&apos;s no monitored space with ID “{roomId}”.</p>
        <Button asChild className="mt-6" size="lg">
          <Link href="/dashboard">Back to overview</Link>
        </Button>
      </div>
    );
  }

  const meta = STATUS_META[u.status];
  const top = ACTIVITIES.reduce((best, a) => (u.probabilities[a] > u.probabilities[best] ? a : best), ACTIVITIES[0]);
  const events = timeline.filter((e) => e.room_id === roomId).slice(0, 12);
  const roomAlerts = alerts.filter((a) => a.room_id === roomId).slice(0, 6);
  const roomSensors = sensors.filter((s) => s.room_ids.includes(roomId));
  const open = openAlerts.find((a) => a.room_id === roomId);
  const motionColor = u.status === "possible_fall" ? "#dc2626" : u.status === "moving" ? "#059669" : u.status === "still" ? "#2563eb" : "#64748b";

  return (
    <>
      <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Overview
      </Link>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {room.label} <StatusPill status={u.status} size="lg" />
          </span>
        }
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            What the AI is detecting right now, from WiFi signal changes only <SampleTag />
          </span>
        }
        actions={
          open ? (
            <Button size="xl" className="bg-red-600 text-white hover:bg-red-700" onClick={() => openAlert(open.id)}>
              Respond to alert
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className={cn("rounded-2xl border-2 p-4 transition-colors duration-500 sm:p-5", meta.tile)}>
          <p className="text-sm font-semibold opacity-80">Current state</p>
          <p className="mt-2 flex items-center gap-2 font-heading text-2xl font-bold sm:text-3xl">
            <meta.icon className="size-7" /> {meta.short}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Timer className="size-4" /> Stillness timer
          </p>
          <p className={cn("mt-2 font-heading text-3xl font-bold tabular sm:text-4xl", u.status === "possible_fall" && "text-red-700 dark:text-red-300")}>
            {u.status === "empty" ? "—" : mmss(u.still_seconds)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Seconds without meaningful motion</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <BrainCircuit className="size-4" /> Top prediction
          </p>
          <p className="mt-2 font-heading text-2xl font-bold sm:text-3xl">{ACTIVITY_META[top].label}</p>
          <p className="mt-1 text-sm font-semibold tabular text-muted-foreground">{pct(u.probabilities[top], 1)} confidence</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Gauge className="size-4" /> Motion level
          </p>
          <p className="mt-2 font-heading text-3xl font-bold tabular sm:text-4xl">{u.motion_level.toFixed(2)}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${u.motion_level * 100}%`, background: motionColor }} />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel
          title="AI confidence by activity"
          description={`Classifier output for the latest window · updated ${timeOfDay(u.timestamp)}`}
        >
          <ConfidenceChart probabilities={u.probabilities} />
        </Panel>
        <Panel title="Motion level · last 60 seconds" description="Normalized change in the WiFi signal caused by movement">
          <MotionChart samples={motionHistory[roomId] ?? []} now={Date.parse(u.timestamp)} color={motionColor} />
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Panel title="State timeline" description="Every change the AI detected in this room" bodyClassName="p-0">
          {events.length ? (
            <ol className="relative px-5 py-4">
              {events.map((e, i) => (
                <li key={e.id} className="relative flex gap-4 pb-5 last:pb-0">
                  {i < events.length - 1 && <span className="absolute top-5 left-[6px] h-full w-px bg-border" />}
                  <StatusDot status={e.to} className="relative mt-1.5 size-3.5 ring-4 ring-card" />
                  <div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-3">
                    <p className="font-medium">
                      {e.from && <span className="text-muted-foreground">{STATUS_META[e.from].short} → </span>}
                      <span className="font-semibold">{STATUS_META[e.to].label}</span>
                    </p>
                    <time className="text-sm text-muted-foreground tabular">
                      {timeOfDay(e.timestamp)} · {ago(e.timestamp, now)}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="p-5 text-muted-foreground">No state changes yet.</p>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Recent alerts in this room" bodyClassName="p-0">
            {roomAlerts.length ? (
              <ul className="divide-y divide-border">
                {roomAlerts.map((a) => {
                  const rs = responseSeconds(a);
                  return (
                    <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                      <span>
                        <span className="block font-semibold">{dateTime(a.detected_at)}</span>
                        <span className="text-muted-foreground">
                          {a.outcome ? OUTCOME_LABEL[a.outcome] : "Open"} {rs !== null && `· responded in ${humanDuration(rs)}`}
                        </span>
                      </span>
                      <span className="font-semibold tabular">{pct(a.confidence)}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="p-5 text-muted-foreground">No alerts for this room in the last 8 weeks.</p>
            )}
          </Panel>
          <Panel title="Sensing nodes" bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {roomSensors.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <Radio className={cn("size-4", s.online ? "text-emerald-600" : "text-muted-foreground")} />
                  <span className="flex-1">
                    <span className="block font-semibold">{s.name}</span>
                    <span className="text-muted-foreground">{s.type}</span>
                  </span>
                  <span className={cn("font-semibold", s.online ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground")}>
                    {s.online ? `${s.signal_quality}% signal` : "Offline"}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
