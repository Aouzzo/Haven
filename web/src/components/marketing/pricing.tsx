import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, SectionHeading } from "@/components/marketing/section";
import { site } from "@/lib/site";

export function Pricing() {
  return (
    <Section id="pricing" className="bg-secondary/50">
      <SectionHeading eyebrow="Pricing" title="Start small with a pilot" center lead="Simple per-room pricing. No cameras or pendants to buy." />
      <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
        <div className="relative flex flex-col rounded-3xl border-2 border-primary bg-card p-8 shadow-lg">
          <span className="absolute -top-3.5 left-8 rounded-full bg-primary px-3 py-1 text-xs font-bold tracking-wide text-primary-foreground uppercase">
            Now enrolling
          </span>
          <h3 className="text-2xl font-bold">Pilot program</h3>
          <p className="mt-1 text-muted-foreground">One wing or unit, for memory care and assisted living.</p>
          <p className="mt-6 rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 px-4 py-3 font-heading text-lg font-bold text-amber-950">
            {site.pilotPrice}
          </p>
          <ul className="mt-6 flex-1 space-y-3">
            {["Caregiver dashboard and phone alerts", "Stillness timer and automatic escalation", "Fire-evacuation occupancy view", "Weekly response-time reports", "Hands-on setup with your team"].map((f) => (
              <li key={f} className="flex gap-3">
                <Check className="mt-0.5 size-5 shrink-0 text-primary" /> {f}
              </li>
            ))}
          </ul>
          <Button asChild size="xl" className="mt-8">
            <Link href="/#pilot">
              Request a pilot <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="flex flex-col rounded-3xl border border-border bg-card p-8">
          <h3 className="text-2xl font-bold">Enterprise</h3>
          <p className="mt-1 text-muted-foreground">Multiple communities and nurse-call partners.</p>
          <p className="mt-6 font-heading text-4xl font-extrabold">Contact us</p>
          <ul className="mt-6 flex-1 space-y-3">
            {["Everything in the pilot", "Multi-community dashboards", "Nurse-call system integration (planned)", "Custom reporting for leadership"].map((f) => (
              <li key={f} className="flex gap-3">
                <Check className="mt-0.5 size-5 shrink-0 text-primary" /> {f}
              </li>
            ))}
          </ul>
          <Button asChild size="xl" variant="outline" className="mt-8">
            <Link href="/#pilot">Contact us</Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}
