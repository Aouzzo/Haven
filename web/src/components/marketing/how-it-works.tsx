import { BellRing, BrainCircuit, Wifi } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { Section, SectionHeading } from "@/components/marketing/section";

function WaveArt() {
  return (
    <svg viewBox="0 0 200 110" className="h-28 w-full" aria-hidden="true">
      {[18, 36, 54, 72].map((r, i) => (
        <path
          key={r}
          d={`M ${100 - r} 92 A ${r} ${r} 0 0 1 ${100 + r} 92`}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          className="stroke-primary"
          opacity={1 - i * 0.2}
        />
      ))}
      <circle cx="100" cy="92" r="7" className="fill-primary" />
    </svg>
  );
}

function BarsArt() {
  const bars = [
    { l: "Walk", v: 0.08, c: "#059669" },
    { l: "Sit", v: 0.05, c: "#3b82f6" },
    { l: "Lie", v: 0.12, c: "#1d4ed8" },
    { l: "Fall", v: 0.72, c: "#dc2626" },
    { l: "Empty", v: 0.03, c: "#94a3b8" },
  ];
  return (
    <div className="flex h-28 items-end justify-center gap-3 px-2" aria-hidden="true">
      {bars.map((b) => (
        <div key={b.l} className="flex flex-col items-center gap-1.5">
          <div className="w-7 rounded-md" style={{ height: `${Math.max(6, b.v * 84)}px`, background: b.c }} />
          <span className="text-[0.7rem] font-semibold text-muted-foreground">{b.l}</span>
        </div>
      ))}
    </div>
  );
}

function AlertArt() {
  return (
    <div className="flex h-28 items-center justify-center" aria-hidden="true">
      <div className="w-full max-w-[220px] rounded-xl border-2 border-red-500 bg-card p-3 shadow-md">
        <p className="text-sm font-bold text-red-700">Possible fall · Room 104</p>
        <p className="tabular mt-0.5 text-xs text-muted-foreground">No movement for 0:42</p>
        <div className="mt-2 flex gap-1.5">
          <span className="h-6 flex-1 rounded-md bg-primary" />
          <span className="h-6 flex-1 rounded-md border border-border" />
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  {
    icon: Wifi,
    art: WaveArt,
    title: "Existing WiFi senses motion",
    body: "WiFi already fills every room. When people move, they change how that signal travels. We measure those changes, called channel state information. No video, no audio.",
  },
  {
    icon: BrainCircuit,
    art: BarsArt,
    title: "AI recognizes what's happening",
    body: "An AI classifier turns signal patterns into activity: walking, sitting, lying, empty, or a possible fall. Every prediction comes with a confidence score.",
  },
  {
    icon: BellRing,
    art: AlertArt,
    title: "Staff get an instant alert",
    body: "If a possible fall is followed by stillness, staff get an alert with the room number, the time, and a live stillness timer. Alerts nobody acknowledges escalate automatically.",
  },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works" className="bg-secondary/50">
      <SectionHeading
        eyebrow="How it works"
        title="Three steps from a signal to a caregiver at the door"
        lead="Nothing to wear, nothing to press, no cameras to install. The AI does the noticing; your team does the caring."
        center
      />
      <ol className="mt-16 grid gap-6 lg:grid-cols-3">
        {STEPS.map(({ icon: Icon, art: Art, title, body }, i) => (
          <Reveal as="li" key={title} delay={i * 120} className="flex">
            <div className="relative flex w-full flex-col rounded-3xl border border-border bg-card p-7 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary font-heading text-lg font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <Icon className="size-6 text-primary" />
              </div>
              <div className="my-6 rounded-2xl bg-secondary/70 p-4">
                <Art />
              </div>
              <h3 className="text-xl font-bold">{title}</h3>
              <p className="mt-2 text-[1.02rem] leading-relaxed text-muted-foreground">{body}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
