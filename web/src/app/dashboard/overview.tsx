"use client";

import Link from "next/link";
import { useState } from "react";
import { BellRing, DoorOpen, Flame, Map as MapIcon, Radio, Timer } from "lucide-react";
import { ActiveAlertList } from "@/components/dashboard/active-alerts";
import { FloorMap, RoomList } from "@/components/dashboard/floor-map";
import { PageHeader, Panel, SampleTag } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusDot, StatusLegend } from "@/components/dashboard/status-pill";
import { Button } from "@/components/ui/button";
import { ago, humanDuration, responseSeconds, timeOfDay } from "@/lib/format";
import { STATUS_META } from "@/lib/status";
import { useFacilityData } from "@/providers/facility-data-provider";

export function Overview() {
  const { rooms, latest, openAlerts, alerts, sensors, timeline, roomsById, now, actions } = useFacilityData();
  const [showMapMobile, setShowMapMobile] = useState(false);

  const occupied = rooms.filter((r) => (latest[r.id]?.status ?? "empty") !== "empty").length;
  const dayAgo = now - 86_400_000;
  const responded = alerts
    .filter((a) => a.acknowledged_at && Date.parse(a.detected_at) >= dayAgo)
    .map((a) => responseSeconds(a)!)
    .filter((s) => s !== null);
  const avgResponse = responded.length ? responded.reduce((x, y) => x + y, 0) / responded.length : null;
  const online = sensors.filter((s) => s.online).length;

  return (
    <>
      <PageHeader
        title="Overview"
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            Room status for the North wing, updated every second <SampleTag />
          </span>
        }
        actions={
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-orange-300 text-orange-800 hover:bg-orange-50 dark:border-orange-500/50 dark:text-orange-200"
          >
            <Link href="/dashboard/evacuation" onClick={() => actions.setEvacuation(true)}>
              <Flame /> Fire evacuation mode
            </Link>
          </Button>
        }
      />

      {/* Phones: active alerts first, big tap targets */}
      <section className="mb-6 md:hidden" aria-label="Active alerts">
        <h2 className="mb-3 text-lg font-semibold">Active alerts</h2>
        <ActiveAlertList />
      </section>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Rooms occupied" value={occupied} icon={DoorOpen} sub={`of ${rooms.length} monitored spaces`} />
        <StatCard
          label="Active alerts"
          value={openAlerts.length}
          icon={BellRing}
          tone={openAlerts.length ? "alert" : "good"}
          sub={openAlerts.length ? "Needs attention" : "All clear"}
        />
        <StatCard
          label="Avg response (24h)"
          value={avgResponse ?? 0}
          display={avgResponse === null ? "—" : humanDuration(avgResponse)}
          icon={Timer}
          sub={`${responded.length} alert${responded.length === 1 ? "" : "s"} acknowledged`}
        />
        <StatCard label="Sensors online" value={online} suffix={`/${sensors.length}`} icon={Radio} tone={online === sensors.length ? "good" : "default"} sub={online === sensors.length ? "All nodes reporting" : `${sensors.length - online} offline`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel
          title="Floor map · North wing"
          description="Select a room to see what the AI is detecting."
          actions={<StatusLegend className="hidden md:flex" />}
          bodyClassName="p-3 sm:p-5"
        >
          <div className="md:hidden">
            <StatusLegend className="mb-3" />
            {showMapMobile ? <FloorMap /> : <RoomList />}
            <Button variant="ghost" size="lg" className="mt-3 w-full" onClick={() => setShowMapMobile((v) => !v)}>
              <MapIcon /> {showMapMobile ? "Show room list" : "Show floor map"}
            </Button>
          </div>
          <div className="hidden md:block">
            <FloorMap />
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Active alerts" className="hidden md:block">
            <ActiveAlertList />
          </Panel>
          <Panel title="Recent activity" description="State changes across all rooms" bodyClassName="p-0">
            <ul className="max-h-[420px] divide-y divide-border overflow-y-auto">
              {timeline.slice(0, 14).map((e) => (
                <li key={e.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                  <StatusDot status={e.to} />
                  <Link href={`/dashboard/rooms/${e.room_id}`} className="w-20 font-semibold hover:underline">
                    {roomsById[e.room_id]?.label ?? e.room_id}
                  </Link>
                  <span className="flex-1 text-muted-foreground">
                    {e.from ? `${STATUS_META[e.from].short} → ` : ""}
                    <span className="font-medium text-foreground">{STATUS_META[e.to].short}</span>
                  </span>
                  <time className="text-xs text-muted-foreground tabular" title={timeOfDay(e.timestamp)}>
                    {ago(e.timestamp, now)}
                  </time>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
