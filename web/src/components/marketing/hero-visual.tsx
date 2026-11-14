"use client";

import { useEffect, useRef, useState } from "react";
import { BellRing, Check, Timer, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

type Phase = "walk" | "fall" | "still" | "alert" | "reset";

const ROUTER = { x: 418, y: 64 };

/**
 * Illustrative animation: WiFi waves fill a room, an abstract figure walks,
 * falls, stays still, and the scene turns into a caregiver alert card.
 * Purely decorative; not real data.
 */
export function HeroVisual() {
  const [phase, setPhase] = useState<Phase>("reset");
  const [still, setStill] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setPhase("alert");
      setStill(14);
      return;
    }
    const schedule = (fn: () => void, ms: number) => {
      timers.current.push(window.setTimeout(fn, ms));
    };
    const cycle = () => {
      setStill(0);
      setPhase("reset");
      schedule(() => setPhase("walk"), 80);
      schedule(() => setPhase("fall"), 3900);
      schedule(() => setPhase("still"), 4500);
      schedule(() => setPhase("alert"), 6300);
      schedule(cycle, 12500);
    };
    cycle();
    const t = timers.current;
    return () => t.forEach((id) => window.clearTimeout(id));
  }, []);

  useEffect(() => {
    if (phase !== "still" && phase !== "alert") return;
    const id = window.setInterval(() => setStill((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  const fallen = phase === "fall" || phase === "still" || phase === "alert";
  const walking = phase === "walk";
  const x = phase === "reset" ? 0 : 168;
  const danger = phase === "still" || phase === "alert";

  return (
    <div className="relative mx-auto w-full max-w-[540px]">
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-accent via-transparent to-transparent blur-2xl" />
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-[0_30px_80px_-30px_rgba(15,60,70,0.35)]">
        {/* Card chrome */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex size-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Wifi className="size-4" />
            </span>
            Room 104
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 transition-colors duration-500",
              danger
                ? "bg-red-600 text-white ring-red-700"
                : fallen
                  ? "bg-amber-50 text-amber-900 ring-amber-300"
                  : "bg-emerald-50 text-emerald-800 ring-emerald-300"
            )}
          >
            <span
              className={cn(
                "size-2 rounded-full",
                danger ? "animate-soft-blink bg-white" : fallen ? "bg-amber-500" : "bg-emerald-600"
              )}
            />
            {danger ? "Possible fall" : fallen ? "Analyzing…" : "Moving"}
          </span>
        </div>

        <svg viewBox="0 0 480 360" className="block h-auto w-full" role="img" aria-label="Illustration: WiFi signals in a room detect a person falling">
          <defs>
            <clipPath id="room-clip">
              <rect x="24" y="20" width="432" height="320" rx="18" />
            </clipPath>
            <pattern id="floor-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M24 0H0V24" fill="none" stroke="currentColor" strokeWidth="0.6" className="text-border" />
            </pattern>
          </defs>

          {/* Room */}
          <rect x="24" y="20" width="432" height="320" rx="18" fill="url(#floor-grid)" />
          <rect x="24" y="20" width="432" height="320" rx="18" fill="none" strokeWidth="2" className="stroke-border" />

          {/* Furniture (abstract) */}
          <rect x="48" y="44" width="112" height="70" rx="12" className="fill-secondary stroke-border" strokeWidth="1.5" />
          <rect x="56" y="52" width="34" height="54" rx="8" className="fill-card stroke-border" strokeWidth="1.2" />
          <rect x="300" y="250" width="60" height="60" rx="10" className="fill-secondary stroke-border" strokeWidth="1.5" />
          {/* Door gap */}
          <line x1="456" y1="230" x2="456" y2="292" strokeWidth="6" className="stroke-card" />

          {/* WiFi waves */}
          <g clipPath="url(#room-clip)">
            {[0, 1, 2, 3].map((i) => (
              <circle
                key={i}
                cx={ROUTER.x}
                cy={ROUTER.y}
                r="260"
                fill="none"
                strokeWidth="2"
                className={cn(
                  "animate-wave transition-colors duration-700",
                  danger ? "stroke-red-500/60" : "stroke-primary/45"
                )}
                style={{ animationDelay: `${i * 0.8}s`, transformOrigin: `${ROUTER.x}px ${ROUTER.y}px` }}
              />
            ))}
          </g>

          {/* Router */}
          <g transform={`translate(${ROUTER.x - 18} ${ROUTER.y - 14})`}>
            <rect width="36" height="24" rx="7" className="fill-primary" />
            <circle cx="10" cy="12" r="2.4" className="fill-primary-foreground" />
            <circle cx="18" cy="12" r="2.4" className="fill-primary-foreground/70" />
            <line x1="8" y1="0" x2="4" y2="-10" strokeWidth="2.5" strokeLinecap="round" className="stroke-primary" />
            <line x1="28" y1="0" x2="32" y2="-10" strokeWidth="2.5" strokeLinecap="round" className="stroke-primary" />
          </g>

          {/* Disturbance ring where the figure fell */}
          {danger && (
            <circle
              cx={120 + 168 + 34}
              cy={176}
              r="34"
              fill="none"
              strokeWidth="2.5"
              className="animate-wave stroke-red-500"
              style={{ transformOrigin: `${120 + 168 + 34}px 176px`, animationDuration: "1.8s" }}
            />
          )}

          {/* Figure (abstract) */}
          <g
            style={{
              transform: `translate(${x}px, -52px)`,
              transition: phase === "walk" ? "transform 3.6s linear" : "none",
            }}
          >
            <g
              className={cn(walking && "animate-bob")}
              style={{
                transformBox: "fill-box",
                transformOrigin: "50% 100%",
                transform: fallen ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 0.55s cubic-bezier(0.55, 0, 0.9, 0.45)",
                opacity: phase === "reset" ? 0 : 1,
              }}
            >
              <g
                strokeLinecap="round"
                strokeWidth="8"
                fill="none"
                className={cn("transition-colors duration-500", danger ? "stroke-red-600" : "stroke-ink")}
              >
                <line x1="120" y1="186" x2="120" y2="212" />
                <line x1="120" y1="192" x2="109" y2="207" />
                <line x1="120" y1="192" x2="131" y2="207" />
                <line
                  x1="120" y1="212" x2="113" y2="238"
                  className={cn(walking && "animate-stride")}
                  style={{ transformOrigin: "120px 212px" }}
                />
                <line
                  x1="120" y1="212" x2="127" y2="238"
                  className={cn(walking && "animate-stride [animation-direction:alternate-reverse]")}
                  style={{ transformOrigin: "120px 212px" }}
                />
              </g>
              <circle cx="120" cy="171" r="10" className={cn("transition-colors duration-500", danger ? "fill-red-600" : "fill-ink")} />
            </g>
          </g>
        </svg>

        {/* Stillness chip */}
        <div
          className={cn(
            "absolute top-[4.6rem] left-5 flex items-center gap-1.5 rounded-full bg-card/95 px-3 py-1.5 text-sm font-semibold shadow-md ring-1 ring-border transition-all duration-500",
            phase === "still" || phase === "alert" ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
          )}
        >
          <Timer className="size-4 text-red-600" />
          <span className="tabular">No movement · 0:{String(still).padStart(2, "0")}</span>
        </div>

        {/* Alert card */}
        <div
          className={cn(
            "absolute inset-x-4 bottom-4 rounded-2xl border-2 border-red-500 bg-card p-4 shadow-2xl transition-all duration-500 sm:inset-x-6",
            phase === "alert" ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
          )}
          aria-hidden={phase !== "alert"}
        >
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
              <BellRing className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="font-heading text-lg font-bold text-red-700">Possible fall · Room 104</p>
                <p className="text-xs font-medium text-muted-foreground">Illustration</p>
              </div>
              <p className="tabular text-sm text-muted-foreground">
                No movement for <span className="font-semibold text-foreground">0:{String(still).padStart(2, "0")}</span> · AI confidence{" "}
                <span className="font-semibold text-foreground">94%</span>
              </p>
              <div className="mt-3 flex gap-2">
                <span className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground">
                  <Check className="size-4" /> Acknowledge
                </span>
                <span className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm font-semibold">
                  On my way
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
