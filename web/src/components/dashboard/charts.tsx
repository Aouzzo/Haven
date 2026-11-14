"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ActivityProbabilities, MotionSample } from "@/lib/facility/types";
import { ACTIVITIES, ACTIVITY_META } from "@/lib/status";

export const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 12 };
export const GRID_STROKE = "var(--border)";

export function ChartTooltipBox({ title, rows }: { title?: string; rows: { label: string; value: string; color?: string }[] }) {
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lg">
      {title && <p className="mb-1 font-semibold">{title}</p>}
      {rows.map((r) => (
        <p key={r.label} className="flex items-center gap-2 tabular">
          {r.color && <span className="size-2.5 rounded-full" style={{ background: r.color }} />}
          <span className="text-muted-foreground">{r.label}</span>
          <span className="ml-auto pl-3 font-semibold">{r.value}</span>
        </p>
      ))}
    </div>
  );
}

/** Horizontal bars: the classifier's probability for each activity. */
export function ConfidenceChart({ probabilities, height = 260 }: { probabilities: ActivityProbabilities; height?: number }) {
  const data = ACTIVITIES.map((a) => ({
    key: a,
    label: ACTIVITY_META[a].label,
    value: Math.round(probabilities[a] * 1000) / 10,
    color: ACTIVITY_META[a].hex,
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 48, bottom: 4, left: 4 }} barCategoryGap={10}>
        <CartesianGrid horizontal={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 100]} tick={AXIS_TICK} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="label"
          width={72}
          tick={{ fill: "var(--foreground)", fontSize: 14, fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.6 }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <ChartTooltipBox
                rows={[{ label: String(payload[0].payload.label), value: `${payload[0].payload.value}%`, color: payload[0].payload.color }]}
              />
            ) : null
          }
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} animationDuration={600} animationEasing="ease-out">
          {data.map((d) => (
            <Cell key={d.key} fill={d.color} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            formatter={(v: unknown) => `${Number(v).toFixed(0)}%`}
            style={{ fill: "var(--foreground)", fontSize: 13, fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Motion level over the last 60 seconds. */
export function MotionChart({
  samples,
  now,
  color = "var(--chart-1)",
  height = 240,
  stillLine = 0.15,
}: {
  samples: MotionSample[];
  now: number;
  color?: string;
  height?: number;
  stillLine?: number;
}) {
  const data = samples.map((s) => ({ x: Math.round((s.t - now) / 1000), motion: s.motion }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id="motion-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
        <XAxis
          dataKey="x"
          type="number"
          domain={[-60, 0]}
          ticks={[-60, -45, -30, -15, 0]}
          tickFormatter={(v) => (v === 0 ? "now" : `${v}s`)}
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
        />
        <YAxis domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} tickFormatter={(v) => v.toFixed(2)} tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <ReferenceLine
          y={stillLine}
          stroke="var(--muted-foreground)"
          strokeDasharray="4 4"
          label={{ value: "still below", position: "insideTopRight", fill: "var(--muted-foreground)", fontSize: 11 }}
        />
        <Tooltip
          cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <ChartTooltipBox
                title={payload[0].payload.x === 0 ? "Now" : `${Math.abs(payload[0].payload.x)}s ago`}
                rows={[{ label: "Motion level", value: Number(payload[0].payload.motion).toFixed(2), color }]}
              />
            ) : null
          }
        />
        <Area
          type="monotone"
          dataKey="motion"
          stroke={color}
          strokeWidth={2}
          fill="url(#motion-fill)"
          isAnimationActive={false}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
