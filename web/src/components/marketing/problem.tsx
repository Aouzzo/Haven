import { ArrowUpRight, CameraOff, ClipboardList, Watch } from "lucide-react";
import { CountUp } from "@/components/count-up";
import { Reveal } from "@/components/marketing/reveal";
import { Section, SectionHeading } from "@/components/marketing/section";
import { stats } from "@/lib/site";

const GAPS = [
  {
    icon: Watch,
    title: "Pendants and call buttons",
    body: "They only help if they're worn and pressed. Residents take them off to shower or sleep, forget them on the nightstand, or can't press them after a fall, especially in memory care.",
  },
  {
    icon: CameraOff,
    title: "Cameras",
    body: "Bedrooms and bathrooms are where residents most expect privacy. Video there is a hard no for many residents, families, and staff, and it puts dignity at risk.",
  },
  {
    icon: ClipboardList,
    title: "Hourly checks",
    body: "Rounds take staff time and only catch what happens near a check. A fall just after a round can go unnoticed until the next one.",
  },
];

export function Problem() {
  return (
    <Section id="problem">
      <SectionHeading
        eyebrow="The problem"
        title="Falls are common. Lying on the floor for a long time, unnoticed, is the danger."
        lead="When an older adult falls and can't get up, staff can only help once they know. Today, they often find out late."
      />

      <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal as="li" key={s.id} delay={i * 90} className="flex">
            <div className="flex w-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
              <p className="font-heading text-5xl font-extrabold tracking-tight text-primary sm:text-[3.4rem]">
                <CountUp value={s.value} suffix={s.suffix} className="tabular" />
              </p>
              <p className="mt-3 flex-1 text-[0.98rem] leading-relaxed text-foreground/85">{s.label}</p>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                Source: {s.source}
                <ArrowUpRight className="size-4" />
              </a>
            </div>
          </Reveal>
        ))}
      </ul>

      <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <Reveal>
          <div className="rounded-3xl bg-accent p-8 sm:p-10">
            <h3 className="text-2xl font-bold text-accent-foreground">What is a &ldquo;long lie&rdquo;?</h3>
            <p className="mt-4 text-lg leading-relaxed text-foreground/85">
              A long lie is when someone falls and stays on the floor for a long time, often an hour or more,
              because they can&apos;t get up and can&apos;t call for help. It happens most when nobody sees the
              fall: at night, in a bedroom, in a bathroom.
            </p>
            <p className="mt-4 text-lg font-semibold leading-relaxed text-accent-foreground">
              The goal is simple: let staff know sooner.
            </p>
          </div>
        </Reveal>
        <div>
          <h3 className="text-2xl font-bold">Why today&apos;s tools miss it</h3>
          <ul className="mt-6 space-y-4">
            {GAPS.map(({ icon: Icon, title, body }, i) => (
              <Reveal as="li" key={title} delay={i * 80}>
                <div className="flex gap-4 rounded-2xl border border-border bg-card p-5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground/80">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <p className="text-lg font-semibold">{title}</p>
                    <p className="mt-1 leading-relaxed text-muted-foreground">{body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
