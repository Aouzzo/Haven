/**
 * Data contract between the sensing pipeline and the dashboard.
 *
 * Tomorrow's live feed only has to emit `RoomStatusUpdate` objects (one per room
 * per tick) through a `FacilityDataSource`; every dashboard page reads from
 * `useFacilityData()` and never generates data itself.
 */

/** Room-level status shown on the floor map. */
export type RoomStatus = "empty" | "still" | "moving" | "possible_fall";

/** Activities the classifier recognizes. */
export type Activity = "walking" | "sitting" | "lying" | "fall" | "empty";

/** Classifier output: probability per activity, summing to ~1. */
export type ActivityProbabilities = Record<Activity, number>;

/** One status update for one room, produced by the classifier pipeline. */
export interface RoomStatusUpdate {
  room_id: string;
  /** ISO 8601 timestamp of the classified window. */
  timestamp: string;
  status: RoomStatus;
  probabilities: ActivityProbabilities;
  /** Normalized motion energy from the WiFi signal, 0 (none) to 1 (high). */
  motion_level: number;
  /** Seconds since meaningful motion was last observed in the room. */
  still_seconds: number;
  /** Present when the pipeline flags a possible fall. */
  alert?: {
    type: "possible_fall";
    /** Model confidence for the fall event, 0 to 1. */
    confidence: number;
    /** ISO 8601 time the fall event was detected. */
    detected_at: string;
  };
}

export type RoomKind = "resident" | "common";

/** Static layout info for one monitored space. Rooms are identified by number only. */
export interface Room {
  id: string;
  label: string;
  kind: RoomKind;
  /** Position on the stylized floor plan (CSS grid columns/rows, 1-based). */
  grid: { col: number; row: number; colSpan?: number; rowSpan?: number };
}

/** A WiFi sensing node (an access point or prototype receiver). */
export interface SensorNode {
  id: string;
  name: string;
  type: "Access point" | "ESP32 receiver (prototype)";
  room_ids: string[];
  online: boolean;
  /** 0 to 100 */
  signal_quality: number;
  /** ISO 8601 */
  last_update: string;
}

export type AlertStage = "active" | "acknowledged" | "en_route" | "resolved";
export type AlertOutcome = "false_alarm" | "resident_ok" | "assistance_given";

export interface FallAlert {
  id: string;
  room_id: string;
  detected_at: string;
  confidence: number;
  stage: AlertStage;
  escalated: boolean;
  escalated_at?: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  en_route_at?: string;
  resolved_at?: string;
  resolved_by?: string;
  outcome?: AlertOutcome;
}

export interface TimelineEvent {
  id: string;
  room_id: string;
  timestamp: string;
  from?: RoomStatus;
  to: RoomStatus;
}

export interface MotionSample {
  /** epoch ms */
  t: number;
  motion: number;
}

export interface NotificationContact {
  id: string;
  name: string;
  role: string;
}

export interface FacilitySettings {
  /** Seconds of stillness after a detected fall before an alert is raised. */
  stillThresholdSeconds: number;
  /** Seconds before an unacknowledged alert escalates. */
  escalationSeconds: number;
  soundEnabled: boolean;
  darkMode: boolean;
  contacts: NotificationContact[];
}

/** Everything a source provides up front. */
export interface FacilitySnapshot {
  facilityName: string;
  rooms: Room[];
  sensors: SensorNode[];
  latest: Record<string, RoomStatusUpdate>;
  motionHistory: Record<string, MotionSample[]>;
  timeline: TimelineEvent[];
  alertHistory: FallAlert[];
}

/**
 * Where dashboard data comes from. Tonight: `createSampleSource()`.
 * Tomorrow: implement this interface over the live sensor feed and swap it
 * into `FacilityDataProvider`.
 */
export interface FacilityDataSource {
  kind: "sample" | "live" | "replay";
  getSnapshot(): Promise<FacilitySnapshot>;
  /** Called with a batch of updates (typically one per room) on every tick. */
  subscribe(listener: (updates: RoomStatusUpdate[]) => void): () => void;
  subscribeSensors?(listener: (sensors: SensorNode[]) => void): () => void;
  /** Lets a simulated source return a room to normal after staff resolve an alert. */
  onAlertResolved?(roomId: string, outcome: AlertOutcome): void;
  /** Demo-only hooks (Ctrl+Shift+D). */
  demo?: {
    triggerFall(roomId?: string): void;
    reset(): void;
    setAutoFalls?(on: boolean): void;
    isAutoFalls?(): boolean;
  };
}

/** Placeholder model metrics loaded from /public/model_metrics.json. */
export interface ModelMetrics {
  notice: string;
  model_type: string;
  input: string;
  split_method: string;
  classes: string[];
  test_accuracy: number;
  per_class_accuracy: Record<string, number>;
  training_curve: { epoch: number; train_accuracy: number; test_accuracy: number }[];
  confusion_matrix: number[][];
  updated: string;
}
