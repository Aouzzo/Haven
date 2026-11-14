import { BellRing, CameraOff, MicOff, UserX, Watch } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

const ITEMS = [
  { icon: CameraOff, title: "No cameras", body: "Nothing records images. Not in bedrooms, not in bathrooms, not anywhere." },
  { icon: MicOff, title: "No microphones", body: "No audio is captured or stored." },
  { icon: Watch, title: "No wearables", body: "Nothing to charge, forget, or remember to press." },
  { icon: UserX, title: "No identity", body: "Rooms are known by number only. The system never knows who someone is." },
  { icon: BellRing, title: "Alerts only", body: "There's no feed to watch. It speaks up only when something looks wrong." },
];

export function Privacy() {
  return (
    <section id="privacy" className="scroll-mt-20 py-6 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-14 text-primary-foreground sm:px-12 sm:py-20">
          <svg
            aria-hidden="true"
            viewBox="0 0 600 600"
            className="pointer-events-none absolute -right-32 -bottom-40 h-[520px] w-[520px] text-primary-foreground/10"
            fill="none"
          >
            {[90, 160, 230, 300].map((r) => (
              <circle key={r} cx="300" cy="300" r={r} stroke="currentColor" strokeWidth="2" />
            ))}
          </svg>
          <div className="relative max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground/75">Privacy first</p>
            <h2 className="mt-3 text-balance text-3xl font-bold leading-tight sm:text-[2.6rem] sm:leading-[1.12]">
              Privacy by design, not by policy.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-primary-foreground/85 sm:text-xl">
              We built this for the rooms where privacy matters most. The system collects as little as it can and
              still does its one job: telling staff when someone may need help.
            </p>
          </div>
          <ul className="relative mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {ITEMS.map(({ icon: Icon, title, body }, i) => (
              <Reveal as="li" key={title} delay={i * 70}>
                <div className="h-full rounded-2xl bg-primary-foreground/10 p-5 ring-1 ring-primary-foreground/15 backdrop-blur-sm">
                  <Icon className="size-7" />
                  <p className="mt-4 text-lg font-semibold">{title}</p>
                  <p className="mt-1.5 leading-relaxed text-primary-foreground/80">{body}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
