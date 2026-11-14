"use client";

import Link from "next/link";
import { ChevronRight, ClipboardPlus, Wifi } from "lucide-react";
import { StatusDot } from "@/components/dashboard/status-pill";
import { ago, humanDuration, mmss } from "@/lib/format";
import type { Room, RoomStatusUpdate, TimelineEvent } from "@/lib/facility/types";
import { STATUS_META } from "@/lib/status";
import { cn } from "@/lib/utils";
import { useFacilityData } from "@/providers/facility-data-provider";

export function lastChangeByRoom(timeline: TimelineEvent[]) {
  const map: Record<string, TimelineEvent> = {};
  for (const e of timeline) if (!map[e.room_id]) map[e.room_id] = e;
  return map;
}

export function activityText(u: RoomStatusUpdate | undefined, last: TimelineEvent | undefined, now: number) {
  if (!u) return "No data";
  switch (u.status) {
    case "possible_fall":
      return `No movement ${mmss(u.still_seconds)}`;
    case "moving":
      return "Moving now";
    case "still":
      return `Still for ${humanDuration(u.still_seconds)}`;
    case "empty":
      return last ? `Empty since ${ago(last.timestamp, now)}` : "Empty";
  }
}

/** Stylized floor plan grid shared by the overview and evacuation views. */
export function FloorGrid({
  rooms,
  renderRoom,
  className,
  large = false,
}: {
  rooms: Room[];
  renderRoom: (room: Room) => React.ReactNode;
  className?: string;
  large?: boolean;
}) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <div
        className={cn(
          "grid min-w-[680px] grid-cols-6 gap-2.5 rounded-2xl border border-border bg-grid bg-muted/40 p-3",
          large ? "grid-rows-[minmax(150px,auto)_48px_minmax(150px,auto)]" : "grid-rows-[minmax(124px,auto)_40px_minmax(124px,auto)]"
        )}
      >
        {rooms.map((room) => (
          <div key={room.id} style={{ gridColumn: room.grid.col, gridRow: room.grid.row }} className="flex">
            {renderRoom(room)}
          </div>
        ))}
        <div
          style={{ gridColumn: 6, gridRow: 1 }}
          className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-card/60 p-2 text-center text-muted-foreground"
        >
          <ClipboardPlus className="size-5" />
          <span className="text-xs font-semibold">Nurse station</span>
        </div>
        <div
          style={{ gridColumn: "1 / span 6", gridRow: 2 }}
          className="flex items-center justify-between rounded-lg bg-card/70 px-4 text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase ring-1 ring-border"
        >
          <Wifi className="size-4 text-primary/70" />
          Corridor · North wing
          <Wifi className="size-4 text-primary/70" />
        </div>
      </div>
    </div>
  );
}

export function FloorMap() {
  const { rooms, latest, timeline, now } = useFacilityData();
  const last = lastChangeByRoom(timeline);

  return (
    <FloorGrid
      rooms={rooms}
      renderRoom={(room) => {
        const u = latest[room.id];
        const status = u?.status ?? "empty";
        const meta = STATUS_META[status];
        const Icon = meta.icon;
        const number = room.kind === "resident" ? room.id : room.label;
        return (
          <Link
            href={`/dashboard/rooms/${room.id}`}
            aria-label={`${room.label}: ${meta.label}. ${activityText(u, last[room.id], now)}`}
            className={cn(
              "group flex w-full flex-col rounded-xl border-2 p-3 transition-[background-color,border-color,box-shadow,transform] duration-500 hover:-translate-y-0.5 hover:shadow-md",
              meta.tile
            )}
          >
            <div className="flex items-start justify-between">
              <span className="text-[0.7rem] font-bold tracking-wider uppercase opacity-70">
                {room.kind === "resident" ? "Room" : "Common"}
              </span>
              <Icon className="size-5" />
            </div>
            <p className={cn("font-heading font-bold leading-none", room.kind === "resident" ? "mt-1 text-3xl" : "mt-2 text-xl")}>{number}</p>
            <p className="mt-auto pt-2 text-sm font-bold">{meta.short}</p>
            <p className="tabular text-xs font-medium opacity-80">{activityText(u, last[room.id], now)}</p>
          </Link>
        );
      }}
    />
  );
}

/** Compact list for phones. */
export function RoomList() {
  const { rooms, latest, timeline, now } = useFacilityData();
  const last = lastChangeByRoom(timeline);
  const order = { possible_fall: 0, still: 1, moving: 2, empty: 3 } as const;
  const sorted = [...rooms].sort(
    (a, b) => order[latest[a.id]?.status ?? "empty"] - order[latest[b.id]?.status ?? "empty"] || a.id.localeCompare(b.id)
  );
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
      {sorted.map((room) => {
        const u = latest[room.id];
        const status = u?.status ?? "empty";
        return (
          <li key={room.id}>
            <Link
              href={`/dashboard/rooms/${room.id}`}
              className={cn(
                "flex min-h-14 items-center gap-3 px-4 py-3 active:bg-muted",
                status === "possible_fall" && "bg-red-50 dark:bg-red-500/15"
              )}
            >
              <StatusDot status={status} className="size-3.5" />
              <span className="w-24 font-heading text-lg font-bold">{room.label}</span>
              <span className="flex-1 text-sm">
                <span className="font-semibold">{STATUS_META[status].short}</span>
                <span className="block text-xs text-muted-foreground tabular">{activityText(u, last[room.id], now)}</span>
              </span>
              <ChevronRight className="size-5 text-muted-foreground" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
