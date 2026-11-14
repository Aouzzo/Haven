import { cn } from "@/lib/utils";
import { STATUS_META } from "@/lib/status";
import type { RoomStatus } from "@/lib/facility/types";

export function StatusPill({ status, className, size = "md" }: { status: RoomStatus; className?: string; size?: "sm" | "md" | "lg" }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap ring-1 transition-colors duration-500",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-2.5 py-1 text-sm",
        size === "lg" && "px-3.5 py-1.5 text-base",
        meta.pill,
        status === "possible_fall" && "animate-fall-pulse",
        className
      )}
    >
      <Icon className={cn(size === "lg" ? "size-5" : "size-4")} />
      {meta.label}
    </span>
  );
}

export function StatusDot({ status, className }: { status: RoomStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block size-2.5 shrink-0 rounded-full",
        STATUS_META[status].dot,
        status === "possible_fall" && "animate-soft-blink",
        className
      )}
    />
  );
}

export function StatusLegend({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-muted-foreground", className)}>
      {(Object.keys(STATUS_META) as RoomStatus[]).map((s) => (
        <li key={s} className="flex items-center gap-1.5">
          <StatusDot status={s} />
          {STATUS_META[s].label}
        </li>
      ))}
    </ul>
  );
}
