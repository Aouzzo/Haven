import type { LucideIcon } from "lucide-react";
import { CountUp } from "@/components/count-up";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  suffix,
  prefix,
  decimals,
  sub,
  icon: Icon,
  tone = "default",
  display,
}: {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  sub?: React.ReactNode;
  icon: LucideIcon;
  tone?: "default" | "alert" | "good";
  /** Override the animated number with custom text. */
  display?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-4 shadow-xs transition-colors duration-500 sm:p-5",
        tone === "alert" ? "border-red-400 bg-red-50 dark:border-red-500/60 dark:bg-red-500/10" : "border-border"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-xl",
            tone === "alert" ? "bg-red-600 text-white" : tone === "good" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-accent text-accent-foreground"
          )}
        >
          <Icon className="size-[1.1rem]" />
        </span>
      </div>
      <p className={cn("mt-2 font-heading text-3xl font-bold tabular sm:text-[2.1rem]", tone === "alert" && "text-red-700 dark:text-red-300")}>
        {display ?? <CountUp value={value} suffix={suffix} prefix={prefix} decimals={decimals} duration={700} />}
      </p>
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}
