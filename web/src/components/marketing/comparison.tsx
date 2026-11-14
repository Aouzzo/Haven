import { Check, Minus, X } from "lucide-react";
import { Section, SectionHeading } from "@/components/marketing/section";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

type Mark = "good" | "bad" | "mixed";
type CellV = { mark: Mark; text: string };

const COLUMNS = ["Needs to be worn or pressed?", "Uses a camera?", "New hardware per room?", "Privacy"];

const ROWS: { name: string; sub?: string; ours?: boolean; cells: CellV[] }[] = [
  {
    name: site.name,
    sub: "WiFi sensing + AI",
    ours: true,
    cells: [
      { mark: "good", text: "No" },
      { mark: "good", text: "No" },
      { mark: "good", text: "No: uses existing WiFi*" },
      { mark: "good", text: "No images, no identity, alerts only" },
    ],
  },
  {
    name: "Pendants & call buttons",
    cells: [
      { mark: "bad", text: "Yes" },
      { mark: "good", text: "No" },
      { mark: "mixed", text: "A device per resident" },
      { mark: "good", text: "High" },
    ],
  },
  {
    name: "Cameras",
    sub: "including AI video",
    cells: [
      { mark: "good", text: "No" },
      { mark: "bad", text: "Yes" },
      { mark: "bad", text: "Yes, a camera per room" },
      { mark: "bad", text: "Captures images in private rooms" },
    ],
  },
  {
    name: "Dedicated radar or thermal sensors",
    sub: "e.g., Vayyar, Butlr",
    cells: [
      { mark: "good", text: "No" },
      { mark: "good", text: "No" },
      { mark: "bad", text: "Yes, a sensor per room" },
      { mark: "good", text: "No identifiable images" },
    ],
  },
  {
    name: "Other WiFi-sensing companies",
    sub: "e.g., Cognitive Systems, Origin Wireless",
    cells: [
      { mark: "good", text: "No" },
      { mark: "good", text: "No" },
      { mark: "mixed", text: "Varies by product" },
      { mark: "good", text: "No images" },
    ],
  },
];

function MarkIcon({ mark }: { mark: Mark }) {
  if (mark === "good") return <Check className="size-4 shrink-0 text-emerald-700" aria-label="Advantage" />;
  if (mark === "bad") return <X className="size-4 shrink-0 text-red-600" aria-label="Drawback" />;
  return <Minus className="size-4 shrink-0 text-amber-600" aria-label="Depends" />;
}

export function Comparison() {
  return (
    <Section id="compare">
      <SectionHeading
        eyebrow="Compare"
        title="How this compares to other ways of catching falls"
        lead="Every approach has tradeoffs. Ours is built for one job: alerting staff to a possible fall without cameras, wearables, or a new device in every room."
      />
      <div className="mt-12 overflow-x-auto rounded-3xl border border-border bg-card">
        <table className="w-full min-w-[820px] text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="p-5 text-sm font-semibold text-muted-foreground">Approach</th>
              {COLUMNS.map((c) => (
                <th key={c} className="p-5 text-sm font-semibold text-muted-foreground">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.name} className={cn("border-b border-border last:border-0", r.ours && "bg-accent/70")}>
                <th scope="row" className="p-5 align-top">
                  <span className={cn("block font-semibold", r.ours && "font-heading text-lg text-accent-foreground")}>{r.name}</span>
                  {r.sub && <span className="text-sm font-normal text-muted-foreground">{r.sub}</span>}
                </th>
                {r.cells.map((cell, i) => (
                  <td key={i} className="p-5 align-top">
                    <span className="flex items-start gap-2 text-[0.95rem]">
                      <span className="mt-0.5">
                        <MarkIcon mark={cell.mark} />
                      </span>
                      <span className={cn(r.ours && "font-semibold")}>{cell.text}</span>
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-5 space-y-1.5 text-sm text-muted-foreground">
        <p>
          * Our prototype uses low-cost ESP32 boards as WiFi receivers for testing. The product goal is to sense from a
          building&apos;s existing access points.
        </p>
        <p>
          Competitor categories are described in general terms. Capabilities vary by product and change over time; check
          each vendor for current details.
        </p>
      </div>
    </Section>
  );
}
