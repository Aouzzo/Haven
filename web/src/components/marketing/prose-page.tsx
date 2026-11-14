export function ProsePage({ eyebrow, title, lead, children }: { eyebrow: string; title: string; lead?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-12 pb-24 sm:px-6 sm:pt-20">
      <p className="text-sm font-semibold tracking-[0.14em] text-primary uppercase">{eyebrow}</p>
      <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">{title}</h1>
      {lead && <p className="mt-5 text-xl leading-relaxed text-muted-foreground">{lead}</p>}
      <div className="mt-12 space-y-12">{children}</div>
    </div>
  );
}

export function ProseSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="mt-4 space-y-4 text-[1.05rem] leading-relaxed text-foreground/85">{children}</div>
    </section>
  );
}
