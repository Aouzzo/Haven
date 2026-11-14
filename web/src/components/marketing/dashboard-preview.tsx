import Link from "next/link";
import { ArrowRight, Check, Footprints, Siren, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";
import { Section, SectionHeading } from "@/components/marketing/section";
import { STATUS_META } from "@/lib/status";
import type { RoomStatus } from "@/lib/facility/types";
import { cn } from "@/lib/utils";

// Static illustration only (not live data).
const TILES: { n: string; s: RoomStatus; t: string }[] = [
  { n: "101", s: "still", t: "Still for 4m" },
  { n: "102", s: "moving", t: "Moving now" },
  { n: "103", s: "empty", t: "Empty" },
  { n: "104", s: "possible_fall", t: "No movement 0:42" },
  { n: "105", s: "moving", t: "Moving now" },
  { n: "106", s: "still", t: "Still for 12m" },
  { n: "107", s: "empty", t: "Empty" },
  { n: "108", s: "still", t: "Still for 1m" },
];

export function DashboardPreview() {
  return (
    <Section id="dashboard">
      <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <SectionHeading
            eyebrow="The dashboard"
            title="Calm until it matters. Then impossible to miss."
            lead="Every room at a glance, color-coded the same way everywhere. When a possible fall turns into stillness, a red alert takes over with everything staff need to respond."
          />
          <ul className="mt-8 space-y-3 text-[1.02rem]">
            {["Room number, time detected, and a live stillness timer", "One tap to acknowledge or say you're on the way", "Unacknowledged alerts escalate automatically", "A phone-friendly view for caregivers on the floor"].map((x) => (
              <li key={x} className="flex gap-3">
                <Check className="mt-0.5 size-5 shrink-0 text-primary" />
                {x}
              </li>
            ))}
          </ul>
          <Button asChild size="xl" className="mt-9">
            <Link href="/login">
              Open the live demo <ArrowRight />
            </Link>
          </Button>
        </div>

        <Reveal>
          <div className="relative rounded-3xl border border-border bg-card p-4 shadow-[0_30px_80px_-30px_rgba(15,60,70,0.3)] sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-heading font-bold">North wing</p>
              <span className="rounded-md bg-amber-400 px-2 py-0.5 text-xs font-extrabold tracking-wider text-amber-950">ILLUSTRATION</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {TILES.map(({ n, s, t }) => {
                const meta = STATUS_META[s];
                const Icon = meta.icon;
                return (
                  <div key={n} className={cn("rounded-xl border-2 p-2.5 sm:p-3", meta.tile)}>
                    <div className="flex items-start justify-between">
                      <p className="font-heading text-xl font-bold sm:text-2xl">{n}</p>
                      <Icon className="size-4" />
                    </div>
                    <p className="mt-1 text-xs font-bold sm:text-sm">{meta.short}</p>
                    <p className="hidden text-xs opacity-80 sm:block">{t}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 rounded-2xl border-2 border-red-500 bg-card p-4 xl:absolute xl:right-[-1.5rem] xl:bottom-[-2rem] xl:mt-0 xl:w-80 xl:shadow-2xl">
              <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-red-700 uppercase">
                <Siren className="size-4" /> Possible fall detected
              </p>
              <p className="mt-1 font-heading text-3xl font-extrabold">Room 104</p>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 font-semibold text-red-700">
                  <Timer className="size-4" /> 0:42 still
                </span>
                <span className="text-muted-foreground">AI confidence 91%</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <span className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                  <Check className="size-4" /> Acknowledge
                </span>
                <span className="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border text-sm font-semibold">
                  <Footprints className="size-4" /> On my way
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
