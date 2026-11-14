"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BrainCircuit, FileWarning, Layers, Split } from "lucide-react";
import { AXIS_TICK, ChartTooltipBox, GRID_STROKE } from "@/components/dashboard/charts";
import { PageHeader, Panel } from "@/components/dashboard/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ACTIVITY_META } from "@/lib/status";
import type { Activity } from "@/lib/facility/types";
import { cn } from "@/lib/utils";
import { useFacilityData } from "@/providers/facility-data-provider";

function Watermark() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      <span className="-rotate-12 rounded-lg border-2 border-dashed border-amber-500/60 px-4 py-1 font-heading text-2xl font-extrabold tracking-widest text-amber-600/50 uppercase dark:text-amber-300/40">
        Placeholder
      </span>
    </div>
  );
}

const label = (c: string) => ACTIVITY_META[c as Activity]?.label ?? c;

export function ModelView() {
  const { modelMetrics: m, modelMetricsError } = useFacilityData();

  if (modelMetricsError) {
    return <p className="text-destructive">Could not load /model_metrics.json.</p>;
  }
  if (!m) {
    return <Skeleton className="h-96 rounded-2xl" />;
  }

  const isPlaceholder = /placeholder/i.test(m.notice);
  const maxCell = Math.max(1, ...m.confusion_matrix.flat());
  const rowTotals = m.confusion_matrix.map((r) => r.reduce((a, b) => a + b, 0));

  return (
    <>
      <PageHeader title="AI model" description="How the activity classifier works and how well it performs on held-out data." />

      {isPlaceholder && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 text-amber-950 dark:bg-amber-400/10 dark:text-amber-100" role="note">
          <FileWarning className="mt-0.5 size-6 shrink-0" />
          <div>
            <p className="font-heading text-lg font-bold">{m.notice}</p>
            <p className="mt-0.5 text-sm">
              Every number on this page is a placeholder loaded from <code className="font-mono">/public/model_metrics.json</code>. Replace it
              with results from the real test set before showing accuracy to anyone.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: BrainCircuit, title: "Model type", body: m.model_type },
          { icon: Layers, title: "Input", body: m.input },
          { icon: Split, title: "Train / test split", body: m.split_method },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-2xl border border-border bg-card p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Icon className="size-4 text-primary" /> {title}
            </p>
            <p className="mt-2 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      <Panel title="Activities it recognizes" className="mt-6">
        <ul className="flex flex-wrap gap-3">
          {m.classes.map((c) => (
            <li key={c} className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-[0.95rem] font-semibold">
              <span className="size-3 rounded-full" style={{ background: ACTIVITY_META[c as Activity]?.hex }} />
              {label(c)}
            </li>
          ))}
        </ul>
      </Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Test accuracy" description="Per class, on recordings the model never saw during training">
          <div className="relative">
            {isPlaceholder && <Watermark />}
            <p className="font-heading text-5xl font-extrabold tabular">
              {(m.test_accuracy * 100).toFixed(1)}%
              <span className="ml-2 align-middle text-sm font-semibold text-muted-foreground">overall</span>
            </p>
            <ul className="mt-5 space-y-3">
              {Object.entries(m.per_class_accuracy).map(([c, v]) => (
                <li key={c} className="grid grid-cols-[80px_1fr_56px] items-center gap-3 text-sm">
                  <span className="font-semibold">{label(c)}</span>
                  <span className="h-3 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full rounded-full transition-all duration-700" style={{ width: `${v * 100}%`, background: ACTIVITY_META[c as Activity]?.hex }} />
                  </span>
                  <span className="text-right font-semibold tabular">{(v * 100).toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        <Panel title="Training curve" description="Accuracy by epoch (train vs. held-out test)">
          <div className="relative">
            {isPlaceholder && <Watermark />}
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={m.training_curve} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
                <XAxis dataKey="epoch" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload, label: l }) =>
                    active && payload?.length ? (
                      <ChartTooltipBox
                        title={`Epoch ${l}`}
                        rows={payload.map((p) => ({ label: String(p.name), value: `${(Number(p.value) * 100).toFixed(1)}%`, color: String(p.color) }))}
                      />
                    ) : null
                  }
                />
                <Legend wrapperStyle={{ fontSize: 13 }} />
                <Line type="monotone" dataKey="train_accuracy" name="Train" stroke="var(--chart-2)" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="test_accuracy" name="Test" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Confusion matrix" description="Rows are the true activity, columns are what the model predicted (test set counts)" className="mt-6">
        <div className="relative overflow-x-auto">
          {isPlaceholder && <Watermark />}
          <table className="mx-auto border-separate border-spacing-1 text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left text-xs font-semibold text-muted-foreground">True ↓ / Predicted →</th>
                {m.classes.map((c) => (
                  <th key={c} className="w-20 p-2 text-center font-semibold">
                    {label(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {m.confusion_matrix.map((row, i) => (
                <tr key={m.classes[i]}>
                  <th className="p-2 text-left font-semibold">{label(m.classes[i])}</th>
                  {row.map((v, j) => {
                    const share = v / maxCell;
                    return (
                      <td
                        key={j}
                        title={`${label(m.classes[i])} → ${label(m.classes[j])}: ${v}${rowTotals[i] ? ` (${((v / rowTotals[i]) * 100).toFixed(0)}% of row)` : ""}`}
                        className={cn(
                          "h-14 w-20 rounded-lg text-center font-semibold tabular",
                          i === j && "ring-2 ring-primary/40",
                          share > 0.55 ? "text-white" : "text-foreground"
                        )}
                        style={{ background: `color-mix(in oklch, var(--chart-1) ${Math.round(8 + share * 85)}%, var(--card))` }}
                      >
                        {v}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Last updated: {m.updated}</p>
      </Panel>
    </>
  );
}
