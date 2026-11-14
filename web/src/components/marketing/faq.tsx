"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Section, SectionHeading } from "@/components/marketing/section";

const FAQS = [
  {
    q: "Does it identify people?",
    a: "No. The system never knows who is in a room. It doesn't capture faces, voices, or names. Rooms are identified by number only, and the dashboard shows room status and alerts, nothing else.",
  },
  {
    q: "What happens on a false alarm?",
    a: "Staff resolve the alert as \"False alarm\" with one tap. Every outcome is logged, so you can see the false-alarm rate in reports and we can tune the model and the stillness threshold for your community.",
  },
  {
    q: "Does it replace our nurse-call system?",
    a: "No. It adds a sensing layer next to it. Nurse-call still handles resident-initiated calls; this catches possible falls when nobody presses a button. We plan to route alerts into existing nurse-call systems through integration partners.",
  },
  {
    q: "What WiFi is needed?",
    a: "Standard 2.4 GHz WiFi coverage in the rooms you want to monitor. Today's prototype uses small ESP32 boards as WiFi receivers; the goal is to sense from your existing access points. A pilot starts with a short coverage walkthrough.",
  },
  {
    q: "Is this a medical device?",
    a: "No. This is a prototype and not a medical device. It doesn't diagnose anything. It detects possible falls and alerts staff faster, and it doesn't replace clinical judgment, care plans, or emergency services.",
  },
  {
    q: "What data do you store?",
    a: "Room status, alert times, who acknowledged (by staff role), and the outcome. No video, no audio, and no resident identity or health information.",
  },
];

export function Faq() {
  return (
    <Section id="faq">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading eyebrow="FAQ" title="Questions we hear a lot" lead="Have another one? Ask us in the pilot form." />
        <Accordion type="single" collapsible className="rounded-3xl border border-border bg-card px-6">
          {FAQS.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className="py-5 text-left text-lg font-semibold hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="pb-5 text-[1.02rem] leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}
