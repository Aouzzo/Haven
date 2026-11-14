"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createFacilitySource } from "@/lib/facility/source";
import type {
  AlertOutcome,
  FacilityDataSource,
  FacilitySettings,
  FallAlert,
  MotionSample,
  ModelMetrics,
  Room,
  RoomStatusUpdate,
  SensorNode,
  TimelineEvent,
} from "@/lib/facility/types";
import { playChime } from "@/lib/sound";

/**
 * The single provider every dashboard page reads from (via `useFacilityData`).
 * It owns alert lifecycle, settings, and evacuation state; raw room data comes
 * from the `FacilityDataSource` returned by `createFacilitySource()`.
 */

export const DEFAULT_SETTINGS: FacilitySettings = {
  stillThresholdSeconds: 10,
  escalationSeconds: 60,
  soundEnabled: true,
  darkMode: false,
  contacts: [
    { id: "c1", name: "Night shift lead", role: "Charge nurse" },
    { id: "c2", name: "Nursing office", role: "Director of Nursing" },
  ],
};

const SETTINGS_KEY = "facility-settings-v1";
const MOTION_WINDOW = 60;
const TIMELINE_CAP = 400;

interface CoreState {
  facilityName: string;
  rooms: Room[];
  latest: Record<string, RoomStatusUpdate>;
  motionHistory: Record<string, MotionSample[]>;
  timeline: TimelineEvent[];
  alerts: FallAlert[];
  sensors: SensorNode[];
}

export interface EvacuationState {
  active: boolean;
  startedAt?: string;
  cleared: Record<string, string>;
}

export interface FacilityData {
  ready: boolean;
  sourceKind: FacilityDataSource["kind"];
  facilityName: string;
  rooms: Room[];
  roomsById: Record<string, Room>;
  latest: Record<string, RoomStatusUpdate>;
  motionHistory: Record<string, MotionSample[]>;
  timeline: TimelineEvent[];
  /** All alerts, newest first. */
  alerts: FallAlert[];
  /** Alerts not yet resolved, oldest first (most urgent first). */
  openAlerts: FallAlert[];
  sensors: SensorNode[];
  settings: FacilitySettings;
  evacuation: EvacuationState;
  modelMetrics: ModelMetrics | null;
  modelMetricsError: boolean;
  /** Ticks every second; use for live counters. */
  now: number;
  autoFalls: boolean;
  actions: {
    acknowledge(alertId: string): void;
    markEnRoute(alertId: string): void;
    resolve(alertId: string, outcome: AlertOutcome): void;
    updateSettings(patch: Partial<FacilitySettings>): void;
    setEvacuation(active: boolean): void;
    markCleared(roomId: string, cleared: boolean): void;
    demoTriggerFall(roomId?: string): void;
    demoResetAlerts(): void;
    demoSetAutoFalls(on: boolean): void;
  };
}

const FacilityContext = createContext<FacilityData | null>(null);

function loadSettings(): FacilitySettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<FacilitySettings>) };
  } catch {}
  return DEFAULT_SETTINGS;
}

export function FacilityDataProvider({
  children,
  actorLabel,
}: {
  children: React.ReactNode;
  /** Who is acting (shown as "acknowledged by"). Role label only, never a resident. */
  actorLabel: string;
}) {
  const [source] = useState<FacilityDataSource>(() => createFacilitySource());
  const [core, setCore] = useState<CoreState | null>(null);
  const coreRef = useRef<CoreState | null>(null);
  // Provider only renders on the client (behind the mock-auth gate), so localStorage is available.
  const [settings, setSettings] = useState<FacilitySettings>(() => loadSettings());
  const settingsRef = useRef(settings);
  const [evacuation, setEvacuationState] = useState<EvacuationState>({ active: false, cleared: {} });
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics | null>(null);
  const [modelMetricsError, setModelMetricsError] = useState(false);
  const [now, setNow] = useState(0);
  const [autoFalls, setAutoFalls] = useState(true);
  const actorRef = useRef(actorLabel);

  useEffect(() => {
    actorRef.current = actorLabel;
  }, [actorLabel]);

  const commit = useCallback((next: CoreState) => {
    coreRef.current = next;
    setCore(next);
  }, []);

  const updateSettings = useCallback((patch: Partial<FacilitySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      settingsRef.current = next;
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Snapshot + live updates from the source.
  useEffect(() => {
    let cancelled = false;
    let unsub: (() => void) | undefined;
    let unsubSensors: (() => void) | undefined;

    source.getSnapshot().then((snap) => {
      if (cancelled) return;
      commit({
        facilityName: snap.facilityName,
        rooms: snap.rooms,
        latest: snap.latest,
        motionHistory: snap.motionHistory,
        timeline: snap.timeline,
        alerts: snap.alertHistory,
        sensors: snap.sensors,
      });
      setNow(Date.now());
      setAutoFalls(source.demo?.isAutoFalls?.() ?? false);

      unsub = source.subscribe((updates) => {
        const prev = coreRef.current;
        if (!prev) return;
        const latest = { ...prev.latest };
        const motionHistory = { ...prev.motionHistory };
        let timeline = prev.timeline;
        let alerts = prev.alerts;
        let raised = false;
        const threshold = settingsRef.current.stillThresholdSeconds;

        for (const u of updates) {
          const before = prev.latest[u.room_id];
          latest[u.room_id] = u;
          const hist = motionHistory[u.room_id] ?? [];
          motionHistory[u.room_id] = [...hist, { t: Date.parse(u.timestamp), motion: u.motion_level }].slice(-MOTION_WINDOW);

          if (!before || before.status !== u.status) {
            timeline = [
              { id: `${u.room_id}-${u.timestamp}`, room_id: u.room_id, timestamp: u.timestamp, from: before?.status, to: u.status },
              ...timeline,
            ].slice(0, TIMELINE_CAP);
          }

          if (u.status === "possible_fall" && u.still_seconds >= threshold) {
            const open = alerts.some((a) => a.room_id === u.room_id && a.stage !== "resolved");
            if (!open) {
              const detected = u.alert?.detected_at ?? u.timestamp;
              alerts = [
                {
                  id: `alert-${u.room_id}-${Date.parse(detected)}`,
                  room_id: u.room_id,
                  detected_at: detected,
                  confidence: u.alert?.confidence ?? u.probabilities.fall,
                  stage: "active",
                  escalated: false,
                },
                ...alerts,
              ];
              raised = true;
            }
          }
        }

        commit({ ...prev, latest, motionHistory, timeline, alerts });
        if (raised && settingsRef.current.soundEnabled) playChime("alert");
      });

      unsubSensors = source.subscribeSensors?.((sensors) => {
        const prev = coreRef.current;
        if (prev) commit({ ...prev, sensors });
      });
    });

    return () => {
      cancelled = true;
      unsub?.();
      unsubSensors?.();
    };
  }, [source, commit]);

  // 1 s clock for counters + escalation.
  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      const prev = coreRef.current;
      if (!prev) return;
      const limit = settingsRef.current.escalationSeconds * 1000;
      let changed = false;
      const alerts = prev.alerts.map((a) => {
        if (a.stage === "active" && !a.escalated && t - Date.parse(a.detected_at) >= limit) {
          changed = true;
          return { ...a, escalated: true, escalated_at: new Date(t).toISOString() };
        }
        return a;
      });
      if (changed) {
        commit({ ...prev, alerts });
        if (settingsRef.current.soundEnabled) playChime("escalation");
      }
    }, 1000);
    return () => clearInterval(id);
  }, [commit]);

  // Placeholder model metrics.
  useEffect(() => {
    fetch("/model_metrics.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((m: ModelMetrics) => setModelMetrics(m))
      .catch(() => setModelMetricsError(true));
  }, []);

  const patchAlert = useCallback(
    (alertId: string, fn: (a: FallAlert, nowIso: string) => FallAlert) => {
      const prev = coreRef.current;
      if (!prev) return;
      const nowIso = new Date().toISOString();
      commit({ ...prev, alerts: prev.alerts.map((a) => (a.id === alertId ? fn(a, nowIso) : a)) });
    },
    [commit]
  );

  const withAck = (a: FallAlert, nowIso: string): FallAlert =>
    a.acknowledged_at ? a : { ...a, acknowledged_at: nowIso, acknowledged_by: actorRef.current };

  const actions = useMemo<FacilityData["actions"]>(
    () => ({
      acknowledge: (id) =>
        patchAlert(id, (a, n) => (a.stage === "active" ? { ...withAck(a, n), stage: "acknowledged" } : a)),
      markEnRoute: (id) =>
        patchAlert(id, (a, n) => (a.stage === "resolved" ? a : { ...withAck(a, n), stage: "en_route", en_route_at: n })),
      resolve: (id, outcome) => {
        const alert = coreRef.current?.alerts.find((a) => a.id === id);
        patchAlert(id, (a, n) => ({ ...withAck(a, n), stage: "resolved", resolved_at: n, resolved_by: actorRef.current, outcome }));
        if (alert) source.onAlertResolved?.(alert.room_id, outcome);
      },
      updateSettings,
      setEvacuation: (active) =>
        setEvacuationState((prev) =>
          active ? { active: true, startedAt: prev.startedAt ?? new Date().toISOString(), cleared: prev.active ? prev.cleared : {} } : { active: false, cleared: {} }
        ),
      markCleared: (roomId, cleared) =>
        setEvacuationState((prev) => {
          const next = { ...prev.cleared };
          if (cleared) next[roomId] = new Date().toISOString();
          else delete next[roomId];
          return { ...prev, cleared: next };
        }),
      demoTriggerFall: (roomId) => source.demo?.triggerFall(roomId),
      demoResetAlerts: () => {
        source.demo?.reset();
        const prev = coreRef.current;
        if (prev) commit({ ...prev, alerts: prev.alerts.filter((a) => a.stage === "resolved") });
      },
      demoSetAutoFalls: (on) => {
        source.demo?.setAutoFalls?.(on);
        setAutoFalls(on);
      },
    }),
    [patchAlert, source, updateSettings, commit]
  );

  const value = useMemo<FacilityData>(() => {
    const rooms = core?.rooms ?? [];
    const alerts = core?.alerts ?? [];
    return {
      ready: core !== null,
      sourceKind: source.kind,
      facilityName: core?.facilityName ?? "",
      rooms,
      roomsById: Object.fromEntries(rooms.map((r) => [r.id, r])),
      latest: core?.latest ?? {},
      motionHistory: core?.motionHistory ?? {},
      timeline: core?.timeline ?? [],
      alerts,
      openAlerts: alerts.filter((a) => a.stage !== "resolved").sort((a, b) => a.detected_at.localeCompare(b.detected_at)),
      sensors: core?.sensors ?? [],
      settings,
      evacuation,
      modelMetrics,
      modelMetricsError,
      now,
      autoFalls,
      actions,
    };
  }, [core, source.kind, settings, evacuation, modelMetrics, modelMetricsError, now, autoFalls, actions]);

  return <FacilityContext.Provider value={value}>{children}</FacilityContext.Provider>;
}

export function useFacilityData(): FacilityData {
  const ctx = useContext(FacilityContext);
  if (!ctx) throw new Error("useFacilityData must be used inside <FacilityDataProvider>");
  return ctx;
}
