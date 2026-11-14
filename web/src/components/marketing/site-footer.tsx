import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { site } from "@/lib/site";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#privacy", label: "Privacy by design" },
      { href: "/#pricing", label: "Pilot program" },
      { href: "/login", label: "Try the demo" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About & team" },
      { href: "/credits", label: "Credits" },
      { href: "/privacy", label: "Privacy note" },
      { href: "/#pilot", label: "Request a pilot" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-secondary/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-sm text-[0.95rem] leading-relaxed text-muted-foreground">
            Camera-free, wearable-free fall alerts for senior living. Built by students at {site.school} at the{" "}
            {site.event}.
          </p>
          <p className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-900">
            {site.medicalDisclaimer}
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{col.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[0.95rem] font-medium hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            Privacy note: no cameras, no microphones, no wearables, no resident identity. Alerts only.
          </p>
          <p className="font-medium">© 2026 {site.name} · {site.medicalDisclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
