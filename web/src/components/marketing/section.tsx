import { cn } from "@/lib/utils";

export function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("scroll-mt-20 py-20 sm:py-28", className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  center = false,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  center?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("max-w-3xl", center && "mx-auto text-center", className)}>
      {eyebrow && (
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
      )}
      <h2 className="text-balance text-3xl font-bold leading-tight sm:text-[2.6rem] sm:leading-[1.12]">{title}</h2>
      {lead && <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">{lead}</p>}
    </div>
  );
}
