"use client";

import { Radio, Router, WifiOff } from "lucide-react";
import { PageHeader, Panel, SampleTag } from "@/components/dashboard/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ago } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useFacilityData } from "@/providers/facility-data-provider";

function SignalBars({ value, online }: { value: number; online: boolean }) {
  const level = online ? Math.ceil(value / 25) : 0;
  return (
    <span className="flex items-end gap-0.5" aria-label={online ? `Signal ${value}%` : "No signal"}>
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={cn("w-1.5 rounded-sm", i <= level ? (value >= 75 ? "bg-emerald-600" : "bg-amber-500") : "bg-muted")}
          style={{ height: 4 + i * 4 }}
        />
      ))}
    </span>
  );
}

export function SensorsView() {
  const { sensors, roomsById, now } = useFacilityData();
  const online = sensors.filter((s) => s.online).length;

  return (
    <>
      <PageHeader
        title="Sensors"
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            WiFi sensing nodes, their health, and the rooms they cover <SampleTag />
          </span>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-medium text-muted-foreground">Online</p>
          <p className="mt-1 font-heading text-3xl font-bold tabular text-emerald-700 dark:text-emerald-300">{online}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-medium text-muted-foreground">Offline</p>
          <p className="mt-1 font-heading text-3xl font-bold tabular">{sensors.length - online}</p>
        </div>
        <div className="col-span-2 rounded-2xl border border-border bg-card p-5 sm:col-span-1">
          <p className="text-sm font-medium text-muted-foreground">Average signal quality</p>
          <p className="mt-1 font-heading text-3xl font-bold tabular">
            {Math.round(sensors.filter((s) => s.online).reduce((a, s) => a + s.signal_quality, 0) / Math.max(1, online))}%
          </p>
        </div>
      </div>
      <Panel bodyClassName="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Node</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Signal quality</TableHead>
                <TableHead>Rooms</TableHead>
                <TableHead className="pr-5">Last update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sensors.map((s) => (
                <TableRow key={s.id} className="text-[0.95rem]">
                  <TableCell className="pl-5">
                    <span className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                        {s.type === "Access point" ? <Router className="size-4" /> : <Radio className="size-4" />}
                      </span>
                      <span>
                        <span className="block font-semibold">{s.name}</span>
                        <span className="text-xs text-muted-foreground">{s.type}</span>
                      </span>
                    </span>
                  </TableCell>
                  <TableCell>
                    {s.online ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-sm font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
                        <span className="size-2 rounded-full bg-emerald-600" /> Online
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-semibold text-slate-700 dark:bg-slate-500/20 dark:text-slate-200">
                        <WifiOff className="size-3.5" /> Offline
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2.5">
                      <SignalBars value={s.signal_quality} online={s.online} />
                      <span className="tabular">{s.online ? `${s.signal_quality}%` : "—"}</span>
                    </span>
                  </TableCell>
                  <TableCell>{s.room_ids.map((id) => roomsById[id]?.label ?? id).join(", ")}</TableCell>
                  <TableCell className="pr-5 tabular text-muted-foreground">{ago(s.last_update, now)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Panel>
      <p className="mt-4 text-sm text-muted-foreground">
        The goal is to sense from existing access points. Prototype nodes are ESP32 boards used as WiFi receivers.
      </p>
    </>
  );
}
