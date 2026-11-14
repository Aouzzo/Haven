import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProsePage, ProseSection } from "@/components/marketing/prose-page";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "About & team" };

export default function AboutPage() {
  return (
    <ProsePage
      eyebrow="About"
      title="Why we're building this"
      lead={`${site.name} is a student project from ${site.school}, built at the ${site.event}. We want staff to know about a fall in minutes, not hours, without putting cameras in bedrooms or asking residents to wear anything.`}
    >
      <ProseSection title="The team">
        <ul className="grid gap-4 sm:grid-cols-3">
          {site.team.map((m, i) => (
            <li key={i} className="rounded-2xl border border-border bg-card p-5">
              <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <UserRound className="size-6" />
              </span>
              <p className="mt-4 font-semibold">{m.name}</p>
              <p className="text-sm text-muted-foreground">{m.role}</p>
            </li>
          ))}
        </ul>
        <p className="flex items-center gap-2 text-muted-foreground">
          <GraduationCap className="size-5 text-primary" /> {site.school} · Built at the {site.event}
        </p>
      </ProseSection>
      <ProseSection title="Where we are">
        <p>
          This is a working prototype. The sensing pipeline uses ESP32 boards to read WiFi channel state information, and
          an AI classifier labels activity in each room. The dashboard you can try today runs on sample data, clearly
          labeled as such.
        </p>
        <p className="font-semibold">{site.medicalDisclaimer}</p>
      </ProseSection>
      <Button asChild size="xl">
        <Link href="/#pilot">Talk to us about a pilot</Link>
      </Button>
    </ProsePage>
  );
}
