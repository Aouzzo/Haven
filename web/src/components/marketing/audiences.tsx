import { Building2, Cable, HeartHandshake } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { Section, SectionHeading } from "@/components/marketing/section";

const AUDIENCES = [
  {
    icon: Building2,
    who: "Executive Directors",
    pitch: "Fewer surprises, better records.",
    points: [
      "Help reduce unwitnessed long lies",
      "Timestamped incident documentation for every alert",
      "Response-time reports by week, shift, and room",
    ],
  },
  {
    icon: HeartHandshake,
    who: "Directors of Nursing & caregivers",
    pitch: "Know where to go, right away.",
    points: [
      "Instant alerts with room number and stillness timer",
      "Less burden from hourly checks",
      "One-tap acknowledge, on my way, and resolve",
    ],
  },
  {
    icon: Cable,
    who: "Nurse-call integrators",
    pitch: "A new sensing layer for systems you already sell.",
    points: [
      "Adds passive fall detection to existing nurse-call",
      "No camera installs and no per-room pendants",
      "Integration API for your platform (planned)",
    ],
  },
];

export function Audiences() {
  return (
    <Section id="who" className="bg-secondary/50">
      <SectionHeading eyebrow="Who it's for" title="Built with senior living teams in mind" center />
      <ul className="mt-14 grid gap-6 lg:grid-cols-3">
        {AUDIENCES.map(({ icon: Icon, who, pitch, points }, i) => (
          <Reveal as="li" key={who} delay={i * 100} className="flex">
            <div className="flex w-full flex-col rounded-3xl border border-border bg-card p-7">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <Icon className="size-6" />
              </span>
              <h3 className="mt-5 text-xl font-bold">{who}</h3>
              <p className="mt-1 font-medium text-primary">{pitch}</p>
              <ul className="mt-5 space-y-3">
                {points.map((p) => (
                  <li key={p} className="flex gap-3 leading-relaxed text-foreground/85">
                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
