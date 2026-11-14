import Link from "next/link";
import { ArrowRight, CameraOff, MicOff, PlayCircle, ShieldCheck, Watch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { site } from "@/lib/site";

const CHIPS = [
  { icon: CameraOff, label: "No cameras" },
  { icon: MicOff, label: "No microphones" },
  { icon: Watch, label: "No wearables" },
  { icon: ShieldCheck, label: "Alerts only" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Soft background waves */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-40 -z-10 h-[760px] w-[760px] text-primary/10"
        viewBox="0 0 760 760"
        fill="none"
      >
        {[120, 200, 280, 360].map((r) => (
          <circle key={r} cx="380" cy="380" r={r} stroke="currentColor" strokeWidth="1.5" />
        ))}
      </svg>
      <div className="absolute inset-x-0 top-0 -z-20 h-[620px] bg-gradient-to-b from-accent/60 to-transparent" />

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-10 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-16 lg:pb-28">
        <div className="animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card px-3 py-1.5 text-sm font-semibold text-accent-foreground shadow-sm">
            <span className="size-2 rounded-full bg-primary" />
            For memory care &amp; assisted living
          </p>
          <h1 className="mt-6 text-balance text-[2.6rem] font-extrabold leading-[1.05] sm:text-6xl lg:text-[4.1rem]">
            Know right away when a resident falls and doesn&apos;t get up.
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-xl leading-relaxed text-muted-foreground">{site.pitch}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="xl">
              <Link href="/#pilot">
                Request a pilot <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline" className="bg-card">
              <Link href="/login">
                <PlayCircle /> Try the demo
              </Link>
            </Button>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
            {CHIPS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-[0.95rem] font-medium text-foreground/80">
                <Icon className="size-5 text-primary" />
                {label}
              </li>
            ))}
          </ul>
        </div>
        <div className="animate-fade-up [animation-delay:150ms]">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
