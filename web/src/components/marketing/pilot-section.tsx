import { PilotForm } from "@/components/marketing/pilot-form";
import { Section, SectionHeading } from "@/components/marketing/section";

const NEXT_STEPS = [
  { title: "A short intro call", body: "We learn about your community, your current fall response, and your nurse-call setup." },
  { title: "A WiFi walkthrough", body: "We check coverage in the rooms you'd like to start with." },
  { title: "A pilot on one wing", body: "Your staff use the dashboard for real shifts, and we review response times together." },
];

export function PilotSection() {
  return (
    <Section id="pilot" className="bg-secondary/50">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <SectionHeading
            eyebrow="Request a pilot"
            title="Try it on one wing of your community"
            lead="We're looking for memory care and assisted living teams to shape this with us."
          />
          <ol className="mt-10 space-y-6">
            {NEXT_STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-primary font-heading font-bold text-primary">
                  {i + 1}
                </span>
                <div>
                  <p className="text-lg font-semibold">{s.title}</p>
                  <p className="mt-0.5 leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <PilotForm />
      </div>
    </Section>
  );
}
