"use client";

import { useMemo, useState } from "react";
import { Download, ShieldAlert } from "lucide-react";
import { ActiveAlertList } from "@/components/dashboard/active-alerts";
import { stageLabel, useAlertUI } from "@/components/dashboard/alert-center";
import { FilterSelect } from "@/components/dashboard/filter-select";
import { PageHeader, Panel, SampleTag } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dateTime, humanDuration, OUTCOME_LABEL, pct, responseSeconds } from "@/lib/format";
import type { FallAlert } from "@/lib/facility/types";
import { cn } from "@/lib/utils";
import { useFacilityData } from "@/providers/facility-data-provider";

const RANGES = [
  { value: "1", label: "Last 24 hours" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "all", label: "All (8 weeks)" },
];

function toCsv(rows: FallAlert[], roomLabel: (id: string) => string) {
  const header = ["Room", "Detected", "AI confidence", "Acknowledged by", "Response time (s)", "Escalated", "Outcome", "Resolved"];
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = rows.map((a) => {
    const rs = responseSeconds(a);
    return [
      roomLabel(a.room_id),
      a.detected_at,
      pct(a.confidence),
      a.acknowledged_by ?? "",
      rs === null ? "" : String(Math.round(rs)),
      a.escalated ? "yes" : "no",
      a.outcome ? OUTCOME_LABEL[a.outcome] : "Open",
      a.resolved_at ?? "",
    ]
      .map(esc)
      .join(",");
  });
  return ["# SAMPLE DATA: simulated alerts for demo purposes", header.map(esc).join(","), ...lines].join("\n");
}

export function AlertsView() {
  const { alerts, openAlerts, rooms, roomsById, now } = useFacilityData();
  const { openAlert } = useAlertUI();
  const [room, setRoom] = useState("all");
  const [outcome, setOutcome] = useState("all");
  const [range, setRange] = useState("30");
  const [escalated, setEscalated] = useState("all");

  const history = useMemo(() => {
    const since = range === "all" ? 0 : now - Number(range) * 86_400_000;
    return alerts.filter(
      (a) =>
        a.stage === "resolved" &&
        Date.parse(a.detected_at) >= since &&
        (room === "all" || a.room_id === room) &&
        (outcome === "all" || a.outcome === outcome) &&
        (escalated === "all" || (escalated === "yes") === a.escalated)
    );
    // `now` changes every second; recompute only when the filters or data change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts, room, outcome, range, escalated]);

  const label = (id: string) => roomsById[id]?.label ?? id;

  function exportCsv() {
    const blob = new Blob([toCsv(history, label)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alerts-sample-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        title="Alerts"
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            Every possible-fall alert, who responded, and how fast <SampleTag />
          </span>
        }
      />
      <Tabs defaultValue={openAlerts.length ? "active" : "history"}>
        <TabsList className="h-11 rounded-xl p-1">
          <TabsTrigger value="active" className="h-9 rounded-lg px-4 text-[0.95rem]">
            Active
            {openAlerts.length > 0 && (
              <span className="ml-1.5 rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">{openAlerts.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="h-9 rounded-lg px-4 text-[0.95rem]">
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <Panel>
            <div className="max-w-2xl">
              <ActiveAlertList />
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Panel bodyClassName="p-0">
            <div className="flex flex-wrap items-end gap-3 border-b border-border p-4">
              <FilterSelect label="Time range" value={range} onChange={setRange} options={RANGES} className="w-44" />
              <FilterSelect
                label="Room"
                value={room}
                onChange={setRoom}
                options={[{ value: "all", label: "All rooms" }, ...rooms.map((r) => ({ value: r.id, label: r.label }))]}
                className="w-40"
              />
              <FilterSelect
                label="Outcome"
                value={outcome}
                onChange={setOutcome}
                options={[
                  { value: "all", label: "All outcomes" },
                  ...Object.entries(OUTCOME_LABEL).map(([value, l]) => ({ value, label: l })),
                ]}
                className="w-44"
              />
              <FilterSelect
                label="Escalated"
                value={escalated}
                onChange={setEscalated}
                options={[
                  { value: "all", label: "Any" },
                  { value: "yes", label: "Escalated only" },
                  { value: "no", label: "Not escalated" },
                ]}
                className="w-40"
              />
              <Button variant="outline" size="lg" className="ml-auto h-10" onClick={exportCsv} disabled={!history.length}>
                <Download /> Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Room</TableHead>
                    <TableHead>Detected</TableHead>
                    <TableHead>Acknowledged by</TableHead>
                    <TableHead>Response time</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead className="pr-5 text-right">AI confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((a) => {
                    const rs = responseSeconds(a);
                    return (
                      <TableRow key={a.id} className="text-[0.95rem]">
                        <TableCell className="pl-5 font-semibold">{label(a.room_id)}</TableCell>
                        <TableCell className="tabular">{dateTime(a.detected_at)}</TableCell>
                        <TableCell>{a.acknowledged_by ?? "—"}</TableCell>
                        <TableCell className="tabular">
                          <span className="inline-flex items-center gap-1.5">
                            {rs === null ? "—" : humanDuration(rs)}
                            {a.escalated && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-500/20 dark:text-red-200">
                                <ShieldAlert className="size-3" /> Escalated
                              </span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-sm font-semibold",
                              a.outcome === "false_alarm" && "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200",
                              a.outcome === "resident_ok" && "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200",
                              a.outcome === "assistance_given" && "bg-blue-50 text-blue-800 dark:bg-blue-500/15 dark:text-blue-200"
                            )}
                          >
                            {a.outcome ? OUTCOME_LABEL[a.outcome] : stageLabel(a)}
                          </span>
                        </TableCell>
                        <TableCell className="pr-5 text-right tabular">{pct(a.confidence)}</TableCell>
                      </TableRow>
                    );
                  })}
                  {!history.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        No alerts match these filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="border-t border-border px-5 py-3 text-sm text-muted-foreground">
              {history.length} alert{history.length === 1 ? "" : "s"} shown. Response time = detection to acknowledgment.
              {openAlerts.length > 0 && (
                <button className="ml-2 font-semibold text-red-700 hover:underline" onClick={() => openAlert(openAlerts[0].id)}>
                  {openAlerts.length} open now →
                </button>
              )}
            </p>
          </Panel>
        </TabsContent>
      </Tabs>
    </>
  );
}
