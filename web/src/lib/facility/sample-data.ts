/**
 * SAMPLE DATA. Everything in this file is simulated for the demo.
 *
 * This is the ONLY place dashboard data is generated. Pages read it through
 * `useFacilityData()` (src/providers/facility-data-provider.tsx). To go live,
 * implement `FacilityDataSource` over the real sensor feed and return it from
 * `createFacilitySource()` in src/lib/facility/source.ts.
 */
import { site } from "@/lib/site";
import type {
  ActivityProbabilities,
  AlertOutcome,
  FacilityDataSource,
  FacilitySnapshot,
  FallAlert,
  MotionSample,
  Room,
  RoomStatus,
  RoomStatusUpdate,
  SensorNode,
  TimelineEvent,
} from "@/lib/facility/types";

// ---------------------------------------------------------------------------
// Static layout (rooms by number only, never resident names)
// ---------------------------------------------------------------------------

export const SAMPLE_ROOMS: Room[] = [
  { id: "101", label: "Room 101", kind: "resident", grid: { col: 1, row: 1 } },
  { id: "102", label: "Room 102", kind: "resident", grid: { col: 2, row: 1 } },
  { id: "103", label: "Room 103", kind: "resident", grid: { col: 3, row: 1 } },
  { id: "104", label: "Room 104", kind: "resident", grid: { col: 4, row: 1 } },
  { id: "105", label: "Room 105", kind: "resident", grid: { col: 5, row: 1 } },
  { id: "110", label: "Room 110", kind: "resident", grid: { col: 1, row: 3 } },
  { id: "109", label: "Room 109", kind: "resident", grid: { col: 2, row: 3 } },
  { id: "108", label: "Room 108", kind: "resident", grid: { col: 3, row: 3 } },
  { id: "107", label: "Room 107", kind: "resident", grid: { col: 4, row: 3 } },
  { id: "106", label: "Room 106", kind: "resident", grid: { col: 5, row: 3 } },
  { id: "lounge", label: "Lounge", kind: "common", grid: { col: 6, row: 3 } },
];

const STAFF_ROLES = ["Caregiver (day)", "Caregiver (night)", "Charge nurse", "Caregiver (evening)"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const iso = (ms: number) => new Date(ms).toISOString();
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const between = (rand: () => number, lo: number, hi: number) => lo + rand() * (hi - lo);
const pick = <T,>(rand: () => number, arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];

function normalize(p: ActivityProbabilities): ActivityProbabilities {
  const sum = Object.values(p).reduce((a, b) => a + b, 0) || 1;
  return {
    walking: p.walking / sum,
    sitting: p.sitting / sum,
    lying: p.lying / sum,
    fall: p.fall / sum,
    empty: p.empty / sum,
  };
}

// ---------------------------------------------------------------------------
// Seeded alert history (last 8 weeks) for the alerts table and reports
// ---------------------------------------------------------------------------

function buildAlertHistory(now: number): FallAlert[] {
  const rand = mulberry32(20261114);
  const residentRooms = SAMPLE_ROOMS.filter((r) => r.kind === "resident");
  const alerts: FallAlert[] = [];
  const DAY = 86_400_000;
  // Hour-of-day weights: more events overnight and early morning.
  const hourWeights = [5, 5, 6, 6, 5, 4, 4, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 4, 4, 5, 5];
  const totalW = hourWeights.reduce((a, b) => a + b, 0);
  const sampleHour = () => {
    let r = rand() * totalW;
    for (let h = 0; h < 24; h++) {
      r -= hourWeights[h];
      if (r <= 0) return h;
    }
    return 23;
  };

  for (let day = 56; day >= 0; day--) {
    const count = rand() < 0.35 ? 0 : rand() < 0.75 ? 1 : 2;
    for (let i = 0; i < count; i++) {
      const date = new Date(now - day * DAY);
      date.setHours(sampleHour(), Math.floor(rand() * 60), Math.floor(rand() * 60), 0);
      const detected = date.getTime();
      if (detected > now - 5 * 60_000) continue;
      // Response time trends down slightly over the 8 weeks (sample).
      const trend = 1 - (56 - day) / 56 * 0.35;
      const responseSec = Math.round(clamp(between(rand, 22, 95) * trend + (rand() < 0.12 ? between(rand, 40, 120) : 0), 15, 300));
      const escalated = responseSec > 60;
      const outcomeRoll = rand();
      const outcome: AlertOutcome = outcomeRoll < 0.28 ? "false_alarm" : outcomeRoll < 0.64 ? "resident_ok" : "assistance_given";
      const ackAt = detected + responseSec * 1000;
      const resolvedAt = ackAt + between(rand, 90, 540) * 1000;
      const by = escalated && rand() < 0.5 ? "Director of Nursing" : pick(rand, STAFF_ROLES);
      alerts.push({
        id: `hist-${day}-${i}`,
        room_id: pick(rand, residentRooms).id,
        detected_at: iso(detected),
        confidence: Number(between(rand, 0.71, 0.97).toFixed(2)),
        stage: "resolved",
        escalated,
        escalated_at: escalated ? iso(detected + 60_000) : undefined,
        acknowledged_by: by,
        acknowledged_at: iso(ackAt),
        en_route_at: iso(ackAt + 5_000),
        resolved_at: iso(Math.min(resolvedAt, now - 60_000)),
        resolved_by: by,
        outcome,
      });
    }
  }
  return alerts.sort((a, b) => b.detected_at.localeCompare(a.detected_at));
}

// ---------------------------------------------------------------------------
// Sensors
// ---------------------------------------------------------------------------

function buildSensors(now: number): SensorNode[] {
  return [
    { id: "ap-n1", name: "AP North 1", type: "Access point", room_ids: ["101", "102"], online: true, signal_quality: 92, last_update: iso(now) },
    { id: "ap-n2", name: "AP North 2", type: "Access point", room_ids: ["103", "104"], online: true, signal_quality: 88, last_update: iso(now) },
    { id: "ap-n3", name: "AP North 3", type: "Access point", room_ids: ["105"], online: true, signal_quality: 84, last_update: iso(now) },
    { id: "ap-s1", name: "AP South 1", type: "Access point", room_ids: ["110", "109"], online: true, signal_quality: 90, last_update: iso(now) },
    { id: "ap-s2", name: "AP South 2", type: "Access point", room_ids: ["108", "107"], online: true, signal_quality: 79, last_update: iso(now) },
    { id: "ap-s3", name: "AP South 3", type: "Access point", room_ids: ["106", "lounge"], online: true, signal_quality: 86, last_update: iso(now) },
    { id: "rx-1", name: "Receiver RX-1", type: "ESP32 receiver (prototype)", room_ids: ["104"], online: true, signal_quality: 74, last_update: iso(now) },
    { id: "rx-2", name: "Receiver RX-2", type: "ESP32 receiver (prototype)", room_ids: ["108"], online: false, signal_quality: 0, last_update: iso(now - 47 * 60_000) },
  ];
}

// ---------------------------------------------------------------------------
// Live simulation
// ---------------------------------------------------------------------------

type Mode = "empty" | "moving" | "still" | "fall";

interface SimRoom {
  mode: Mode;
  posture: "sitting" | "lying";
  until: number;
  stillSince: number;
  fallAt: number;
  fallConfidence: number;
  motion: number;
}

const MODE_STATUS: Record<Mode, RoomStatus> = {
  empty: "empty",
  moving: "moving",
  still: "still",
  fall: "possible_fall",
};

const FIRST_FALL_DELAY = 15_000;
const FALL_INTERVAL = 60_000;
const MAX_CONCURRENT_FALLS = 2;

export function createSampleSource(): FacilityDataSource {
  const rand = Math.random;
  const sim = new Map<string, SimRoom>();
  const listeners = new Set<(u: RoomStatusUpdate[]) => void>();
  const sensorListeners = new Set<(s: SensorNode[]) => void>();
  let timer: ReturnType<typeof setInterval> | undefined;
  let tickCount = 0;
  let nextFallAt = 0;
  let autoFalls = true;
  let sensors: SensorNode[] = [];

  function enter(room: SimRoom, mode: Mode, now: number) {
    room.mode = mode;
    if (mode === "moving") room.until = now + between(rand, 6_000, 16_000);
    if (mode === "empty") room.until = now + between(rand, 14_000, 40_000);
    if (mode === "still") {
      room.until = now + between(rand, 12_000, 34_000);
      room.stillSince = now;
      room.posture = rand() < 0.6 ? "sitting" : "lying";
    }
    if (mode === "fall") {
      room.fallAt = now;
      room.fallConfidence = Number(between(rand, 0.82, 0.97).toFixed(2));
      room.until = Number.POSITIVE_INFINITY;
    }
  }

  function initialSim(now: number) {
    const initial: Record<string, Mode> = {
      "101": "still", "102": "moving", "103": "empty", "104": "still", "105": "moving",
      "110": "still", "109": "empty", "108": "moving", "107": "still", "106": "empty", lounge: "moving",
    };
    for (const room of SAMPLE_ROOMS) {
      const s: SimRoom = { mode: "empty", posture: "sitting", until: 0, stillSince: now, fallAt: 0, fallConfidence: 0, motion: 0 };
      enter(s, initial[room.id] ?? "empty", now);
      s.until = now + between(rand, 3_000, 20_000);
      s.stillSince = now - between(rand, 20_000, 400_000);
      sim.set(room.id, s);
    }
  }

  function probabilities(s: SimRoom, now: number): ActivityProbabilities {
    const n = () => rand() * 0.05;
    switch (s.mode) {
      case "empty":
        return normalize({ walking: 0.02 + n(), sitting: 0.02 + n(), lying: 0.02 + n(), fall: 0.005, empty: 0.9 + n() });
      case "moving":
        return normalize({ walking: 0.78 + n() * 2, sitting: 0.07 + n(), lying: 0.03 + n(), fall: 0.015 + n() / 3, empty: 0.06 + n() });
      case "still":
        return s.posture === "sitting"
          ? normalize({ walking: 0.05 + n(), sitting: 0.76 + n() * 2, lying: 0.12 + n(), fall: 0.01, empty: 0.04 + n() })
          : normalize({ walking: 0.03 + n(), sitting: 0.1 + n(), lying: 0.8 + n() * 2, fall: 0.015, empty: 0.03 + n() });
      case "fall": {
        const since = now - s.fallAt;
        return since < 3_000
          ? normalize({ walking: 0.04, sitting: 0.02, lying: 0.08 + n(), fall: s.fallConfidence, empty: 0.01 })
          : normalize({ walking: 0.01, sitting: 0.03 + n(), lying: 0.5 + n() * 2, fall: 0.4 + n(), empty: 0.02 });
      }
    }
  }

  function motionTarget(s: SimRoom, now: number) {
    switch (s.mode) {
      case "empty":
        return rand() * 0.04;
      case "moving":
        return 0.45 + rand() * 0.45;
      case "still":
        return 0.04 + rand() * 0.09;
      case "fall":
        return now - s.fallAt < 1_500 ? 0.95 : 0.01 + rand() * 0.03;
    }
  }

  function step(now: number): RoomStatusUpdate[] {
    // Schedule sample falls.
    if (autoFalls && now >= nextFallAt) {
      const falling = [...sim.values()].filter((s) => s.mode === "fall").length;
      if (falling < MAX_CONCURRENT_FALLS) startFall(undefined, now);
      nextFallAt = now + FALL_INTERVAL + between(rand, -5_000, 5_000);
    }

    const out: RoomStatusUpdate[] = [];
    for (const room of SAMPLE_ROOMS) {
      const s = sim.get(room.id)!;
      if (s.mode !== "fall" && now >= s.until) {
        if (s.mode === "empty") enter(s, "moving", now);
        else if (s.mode === "moving") enter(s, room.kind === "common" || rand() < 0.65 ? "still" : "empty", now);
        else if (s.mode === "still") enter(s, "moving", now);
      }
      const target = motionTarget(s, now);
      s.motion = s.mode === "fall" && now - s.fallAt < 1_500 ? target : s.motion * 0.45 + target * 0.55;

      const still_seconds =
        s.mode === "still"
          ? Math.floor((now - s.stillSince) / 1000)
          : s.mode === "fall"
            ? Math.max(0, Math.floor((now - s.fallAt - 1_500) / 1000))
            : 0;

      const update: RoomStatusUpdate = {
        room_id: room.id,
        timestamp: iso(now),
        status: MODE_STATUS[s.mode],
        probabilities: probabilities(s, now),
        motion_level: Number(clamp(s.motion).toFixed(3)),
        still_seconds,
      };
      if (s.mode === "fall") {
        update.alert = { type: "possible_fall", confidence: s.fallConfidence, detected_at: iso(s.fallAt) };
      }
      out.push(update);
    }
    return out;
  }

  function startFall(roomId: string | undefined, now: number) {
    let id = roomId;
    if (!id) {
      const candidates = SAMPLE_ROOMS.filter((r) => r.kind === "resident" && sim.get(r.id)!.mode !== "fall");
      const occupied = candidates.filter((r) => sim.get(r.id)!.mode !== "empty");
      const pool = occupied.length ? occupied : candidates;
      if (!pool.length) return;
      id = pick(rand, pool).id;
    }
    const s = sim.get(id);
    if (!s || s.mode === "fall") return;
    enter(s, "fall", now);
  }

  function emit() {
    const updates = step(Date.now());
    listeners.forEach((l) => l(updates));
    tickCount++;
    if (tickCount % 5 === 0) {
      const now = Date.now();
      sensors = sensors.map((n) =>
        n.online
          ? { ...n, last_update: iso(now - Math.floor(rand() * 2000)), signal_quality: Math.round(clamp(n.signal_quality + between(rand, -3, 3), 60, 99)) }
          : n
      );
      sensorListeners.forEach((l) => l(sensors));
    }
  }

  function ensureRunning() {
    if (timer || listeners.size === 0) return;
    timer = setInterval(emit, 1000);
  }

  function maybeStop() {
    if (listeners.size === 0 && sensorListeners.size === 0 && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  }

  return {
    kind: "sample",

    async getSnapshot(): Promise<FacilitySnapshot> {
      const now = Date.now();
      if (sim.size === 0) {
        initialSim(now);
        nextFallAt = now + FIRST_FALL_DELAY;
        sensors = buildSensors(now);
      }
      // Backfill 60 s of motion history and a short timeline so charts aren't empty.
      const motionHistory: Record<string, MotionSample[]> = {};
      const timeline: TimelineEvent[] = [];
      const hrand = mulberry32(7);
      for (const room of SAMPLE_ROOMS) {
        const s = sim.get(room.id)!;
        const samples: MotionSample[] = [];
        let m = s.motion;
        for (let i = 60; i > 0; i--) {
          m = m * 0.5 + motionTarget(s, now) * 0.5;
          samples.push({ t: now - i * 1000, motion: Number(clamp(m).toFixed(3)) });
        }
        motionHistory[room.id] = samples;
        // A few plausible earlier state changes.
        const seq: RoomStatus[] = ["empty", "moving", "still", "moving", MODE_STATUS[s.mode]];
        let t = now - between(hrand, 40, 70) * 60_000;
        for (let i = 1; i < seq.length; i++) {
          if (seq[i] === seq[i - 1]) continue;
          timeline.push({ id: `seed-${room.id}-${i}`, room_id: room.id, timestamp: iso(t), from: seq[i - 1], to: seq[i] });
          t += between(hrand, 4, 15) * 60_000;
          if (t > now - 30_000) t = now - 30_000 - i * 1000;
        }
      }
      timeline.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      const first = step(now);
      return {
        facilityName: site.tenantName,
        rooms: SAMPLE_ROOMS,
        sensors,
        latest: Object.fromEntries(first.map((u) => [u.room_id, u])),
        motionHistory,
        timeline,
        alertHistory: buildAlertHistory(now),
      };
    },

    subscribe(listener) {
      listeners.add(listener);
      ensureRunning();
      return () => {
        listeners.delete(listener);
        maybeStop();
      };
    },

    subscribeSensors(listener) {
      sensorListeners.add(listener);
      return () => {
        sensorListeners.delete(listener);
        maybeStop();
      };
    },

    onAlertResolved(roomId: string, outcome: AlertOutcome) {
      const s = sim.get(roomId);
      if (!s || s.mode !== "fall") return;
      enter(s, outcome === "assistance_given" ? "still" : "moving", Date.now());
    },

    demo: {
      triggerFall(roomId?: string) {
        startFall(roomId, Date.now());
      },
      reset() {
        const now = Date.now();
        for (const s of sim.values()) if (s.mode === "fall") enter(s, "moving", now);
        nextFallAt = now + FALL_INTERVAL;
      },
      setAutoFalls(on: boolean) {
        autoFalls = on;
        if (on) nextFallAt = Date.now() + FIRST_FALL_DELAY;
      },
      isAutoFalls() {
        return autoFalls;
      },
    },
  };
}
