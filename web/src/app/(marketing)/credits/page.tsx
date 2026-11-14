import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { ProsePage, ProseSection } from "@/components/marketing/prose-page";

export const metadata: Metadata = { title: "Credits" };

const LIBRARIES = [
  { name: "Next.js", href: "https://nextjs.org", license: "MIT", use: "Web framework (App Router)" },
  { name: "React", href: "https://react.dev", license: "MIT", use: "UI library" },
  { name: "Tailwind CSS", href: "https://tailwindcss.com", license: "MIT", use: "Styling" },
  { name: "shadcn/ui", href: "https://ui.shadcn.com", license: "MIT", use: "UI component recipes (and the cn helper)" },
  { name: "Radix UI", href: "https://www.radix-ui.com", license: "MIT", use: "Accessible primitives behind shadcn/ui" },
  { name: "Recharts", href: "https://recharts.org", license: "MIT", use: "Charts" },
  { name: "Lucide", href: "https://lucide.dev", license: "ISC", use: "Icons (lucide-react)" },
  { name: "class-variance-authority", href: "https://cva.style", license: "Apache-2.0", use: "Component variants" },
  { name: "tw-animate-css", href: "https://github.com/Wombosvideo/tw-animate-css", license: "MIT", use: "Animation utilities" },
  { name: "Inter", href: "https://rsms.me/inter/", license: "SIL Open Font License 1.1", use: "Body font (via Google Fonts)" },
  { name: "Plus Jakarta Sans", href: "https://github.com/tokotype/PlusJakartaSans", license: "SIL Open Font License 1.1", use: "Heading font (via Google Fonts)" },
];

// PLACEHOLDER: the team must list every AI tool used and what it did, honestly.
const AI_TOOLS = [
  { tool: "[TOOL]", what: "[what it did]" },
  { tool: "[TOOL]", what: "[what it did]" },
  { tool: "[TOOL]", what: "[what it did]" },
];

export default function CreditsPage() {
  return (
    <ProsePage eyebrow="Credits" title="Built on open source" lead="Thank you to the projects that made this possible.">
      <ProseSection title="Open-source libraries">
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[520px] text-left text-[0.95rem]">
            <thead>
              <tr className="border-b border-border text-sm text-muted-foreground">
                <th className="p-4 font-semibold">Library</th>
                <th className="p-4 font-semibold">Used for</th>
                <th className="p-4 font-semibold">License</th>
              </tr>
            </thead>
            <tbody>
              {LIBRARIES.map((l) => (
                <tr key={l.name} className="border-b border-border last:border-0">
                  <td className="p-4">
                    <a href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                      {l.name} <ArrowUpRight className="size-4" />
                    </a>
                  </td>
                  <td className="p-4 text-muted-foreground">{l.use}</td>
                  <td className="p-4 font-medium">{l.license}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ProseSection>
      <ProseSection title="AI tools used">
        <ul className="space-y-2">
          {AI_TOOLS.map((t, i) => (
            <li key={i} className="rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 px-4 py-3 font-medium text-amber-950">
              <span className="font-bold">{t.tool}</span>: {t.what}
            </li>
          ))}
        </ul>
      </ProseSection>
      <ProseSection title="Data & statistics">
        <p>
          Statistics on the homepage link to their original sources (CDC; Fleming &amp; Brayne, BMJ 2008). All dashboard
          data in the demo is simulated sample data.
        </p>
      </ProseSection>
    </ProsePage>
  );
}
