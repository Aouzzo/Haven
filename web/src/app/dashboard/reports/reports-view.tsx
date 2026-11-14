"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BellRing, CircleSlash, ShieldAlert, Timer } from "lucide-react";
import { AXIS_TICK, ChartTooltipBox, GRID_STROKE } from "@/components/dashboard/charts";
import { PageHeader, Panel, SampleTag } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { humanDuration, responseSeconds } from "@/lib/format";
import { useFacilityData } from "@/providers/facility-data-provider";

const WEEK = 7 * 86_400_000;

function median(xs: number[]) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function ReportsView() {
  const { alerts, now } = useFacilityData();

  const report = useMemo(() => {
    const resolved = alerts.filter((a) => a.stage === "resolved");
    const start = now - 8 * WEEK;
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const from = start + i * WEEK;
      const inWeek = resolved.filter((a) => {
        const t = Date.parse(a.detected_at);
        return t >= from && t < from + WEEK;
      });
      const rts = inWeek.map((a) => responseSeconds(a)).filter((x): x is number => x !== null);
      return {
        week: new Date(from).toLocaleDateString([], { month: "short", day: "numeric" }),
        alerts: inWeek.length,
        median: Math.round(median(rts)),
        falseRate: inWeek.length ? Math.round((inWeek.filter((a) => a.outcome === "false_alarm").length / inWeek.length) * 100) : 0,
      };
    });
    const buckets = ["12a–3a", "3a–6a", "6a–9a", "9a–12p", "12p–3p", "3p–6p", "6p–9p", "9p–12a"].map((label) => ({ label, alerts: 0 }));
    const recent = resolved.filter((a) => Date.parse(a.detected_at) >= start);
    for (const a of recent) buckets[Math.floor(new Date(a.detected_at).getHours() / 3)].alerts++;
    const allRts = recent.map((a) => responseSeconds(a)).filter((x): x is number => x !== null);
    return {
      weeks,
      buckets,
      total: recent.length,
      medianAll: median(allRts),
      falseRate: recent.length ? recent.filter((a) => a.outcome === "false_alarm").length / recent.length : 0,
      escalationRate: recent.length ? recent.filter((a) => a.escalated).length / recent.length : 0,
    };
    // Recompute when the alert list changes, not every clock tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts]);

  const tooltip = (fmt: (v: number) => string, name: string) =>
    function TooltipContent({ active, payload, label }: { active?: boolean; payload?: readonly { value?: unknown }[]; label?: unknown }) {
      return active && payload?.length ? <ChartTooltipBox title={String(label)} rows={[{ label: name, value: fmt(Number(payload[0].value)) }]} /> : null;
    };

  return (
    <>
      <PageHeader
        title="Reports"
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            Last 8 weeks of alerts and response times for leadership and incident review <SampleTag />
          </span>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Alerts (8 weeks)" value={report.total} icon={BellRing} />
        <StatCard label="Median response" value={report.medianAll} display={humanDuration(report.medianAll)} icon={Timer} />
        <StatCard label="False-alarm rate" value={report.falseRate * 100} suffix="%" icon={CircleSlash} />
        <StatCard label="Escalated" value={report.escalationRate * 100} suffix="%" icon={ShieldAlert} sub="Not acknowledged in time" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Alerts per week" description="Possible-fall alerts, all outcomes">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={report.weeks} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
              <XAxis dataKey="week" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.6 }} content={tooltip((v) => String(v), "Alerts")} />
              <Bar dataKey="alerts" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Median response time" description="Detection to acknowledgment, by week">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={report.weeks} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
              <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
              <XAxis dataKey="week" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${v}s`} tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip content={tooltip((v) => humanDuration(v), "Median")} />
              <Line type="monotone" dataKey="median" stroke="var(--chart-2)" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Alerts by time of day" description="When possible falls were detected (8 weeks)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={report.buckets} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.6 }} content={tooltip((v) => String(v), "Alerts")} />
              <Bar dataKey="alerts" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="False-alarm rate" description="Share of alerts resolved as false alarm, by week">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={report.weeks} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
              <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
              <XAxis dataKey="week" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip content={tooltip((v) => `${v}%`, "False alarms")} />
              <Line type="monotone" dataKey="falseRate" stroke="var(--chart-4)" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </>
  );
}
