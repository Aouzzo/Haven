import {
  Armchair,
  CircleDashed,
  PersonStanding,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { Activity, RoomStatus } from "@/lib/facility/types";

/**
 * Single source of truth for status colors.
 * empty = gray, occupied/still = blue, moving = green, possible fall = red (pulsing).
 * Text/background pairs are chosen for WCAG AA contrast in light and dark mode.
 */
export const STATUS_META: Record<
  RoomStatus,
  {
    label: string;
    short: string;
    icon: LucideIcon;
    /** Solid dot / bar color */
    dot: string;
    /** Tinted tile: background, border, text */
    tile: string;
    /** Small pill */
    pill: string;
    /** Hex for charts (light / dark friendly) */
    hex: string;
  }
> = {
  empty: {
    label: "Empty",
    short: "Empty",
    icon: CircleDashed,
    dot: "bg-slate-400 dark:bg-slate-500",
    tile: "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-500/10 dark:border-slate-500/30 dark:text-slate-300",
    pill: "bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-500/15 dark:text-slate-200 dark:ring-slate-500/40",
    hex: "#94a3b8",
  },
  still: {
    label: "Occupied · still",
    short: "Still",
    icon: Armchair,
    dot: "bg-blue-600 dark:bg-blue-400",
    tile: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-500/15 dark:border-blue-400/40 dark:text-blue-100",
    pill: "bg-blue-50 text-blue-800 ring-blue-300 dark:bg-blue-500/20 dark:text-blue-100 dark:ring-blue-400/50",
    hex: "#2563eb",
  },
  moving: {
    label: "Moving",
    short: "Moving",
    icon: PersonStanding,
    dot: "bg-emerald-600 dark:bg-emerald-400",
    tile: "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-500/15 dark:border-emerald-400/40 dark:text-emerald-100",
    pill: "bg-emerald-50 text-emerald-800 ring-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-100 dark:ring-emerald-400/50",
    hex: "#059669",
  },
  possible_fall: {
    label: "Possible fall",
    short: "Possible fall",
    icon: TriangleAlert,
    dot: "bg-red-600 dark:bg-red-500",
    tile: "bg-red-50 border-red-400 text-red-900 animate-fall-pulse dark:bg-red-500/20 dark:border-red-500 dark:text-red-100",
    pill: "bg-red-600 text-white ring-red-700 dark:bg-red-600 dark:text-white dark:ring-red-400",
    hex: "#dc2626",
  },
};

export const ACTIVITY_META: Record<Activity, { label: string; hex: string; status: RoomStatus }> = {
  walking: { label: "Walking", hex: "#059669", status: "moving" },
  sitting: { label: "Sitting", hex: "#3b82f6", status: "still" },
  lying: { label: "Lying", hex: "#1d4ed8", status: "still" },
  fall: { label: "Fall", hex: "#dc2626", status: "possible_fall" },
  empty: { label: "Empty", hex: "#94a3b8", status: "empty" },
};

export const ACTIVITIES: Activity[] = ["walking", "sitting", "lying", "fall", "empty"];
