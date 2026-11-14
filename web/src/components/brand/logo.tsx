import Link from "next/link";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path
        d="M8.5 13.5a10.6 10.6 0 0 1 15 0"
        className="stroke-primary-foreground"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      />
      <path
        d="M11.6 16.9a6.2 6.2 0 0 1 8.8 0"
        className="stroke-primary-foreground"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      />
      <circle cx="16" cy="21.2" r="2.2" className="fill-primary-foreground" />
    </svg>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn("flex shrink-0 items-center gap-2.5 whitespace-nowrap font-heading text-[1.05rem] font-bold tracking-tight", className)}
    >
      <LogoMark />
      <span>{site.name}</span>
    </Link>
  );
}
