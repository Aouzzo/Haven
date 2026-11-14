"use client";

/** Soft alert chimes generated with Web Audio (no audio files needed). */
let ctx: AudioContext | null = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Call from any user gesture so later chimes are allowed to play. */
export function unlockAudio() {
  getCtx();
}

function tone(c: AudioContext, freq: number, start: number, dur: number, gain = 0.18) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

export function playChime(kind: "alert" | "escalation" = "alert") {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime + 0.02;
  if (kind === "alert") {
    tone(c, 880, t, 0.35);
    tone(c, 660, t + 0.22, 0.45);
    tone(c, 880, t + 0.7, 0.35);
    tone(c, 660, t + 0.92, 0.5);
  } else {
    for (let i = 0; i < 3; i++) {
      tone(c, 988, t + i * 0.3, 0.22, 0.22);
      tone(c, 740, t + i * 0.3 + 0.13, 0.22, 0.22);
    }
  }
}
