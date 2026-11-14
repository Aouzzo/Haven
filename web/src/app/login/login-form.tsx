"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Info, ShieldCheck, Stethoscope, UserRound } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, signIn, useSession } from "@/lib/auth";
import { site } from "@/lib/site";
import { unlockAudio } from "@/lib/sound";

export function LoginForm() {
  const router = useRouter();
  const session = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (session) router.replace("/dashboard");
  }, [session, router]);

  function go(e?: string, p?: string) {
    unlockAudio();
    const s = signIn(e ?? email, p ?? password);
    if (!s) {
      setError("That email and password don't match a demo account. Use one of the demo buttons above.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col">
        <svg aria-hidden="true" viewBox="0 0 600 600" className="absolute -right-40 -bottom-40 h-[640px] w-[640px] text-primary-foreground/10" fill="none">
          {[80, 150, 220, 290].map((r) => (
            <circle key={r} cx="300" cy="300" r={r} stroke="currentColor" strokeWidth="2" />
          ))}
        </svg>
        <Logo className="text-primary-foreground [&_rect]:fill-primary-foreground [&_path]:stroke-primary [&_circle]:fill-primary" />
        <div className="relative mt-auto max-w-md">
          <h1 className="text-4xl font-bold leading-tight">The caregiver dashboard</h1>
          <p className="mt-4 text-lg leading-relaxed text-primary-foreground/85">
            Live room status, instant possible-fall alerts with a stillness timer, and a fire-evacuation view, all
            without cameras or wearables.
          </p>
          <p className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary-foreground/10 px-4 py-2.5 text-sm font-semibold ring-1 ring-primary-foreground/20">
            <ShieldCheck className="size-4" /> Rooms by number only. No names, no video.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-col px-4 py-8 sm:px-10">
        <div className="flex items-center justify-between lg:justify-end">
          <Logo className="lg:hidden" />
          <Link href="/" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
            ← Back to site
          </Link>
        </div>
        <div className="mx-auto my-auto w-full max-w-md py-10">
          <p className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold tracking-wide text-amber-900 uppercase">
            Demo · Sample data
          </p>
          <h2 className="mt-4 text-3xl font-bold">Sign in to {site.tenantName}</h2>
          <p className="mt-2 text-muted-foreground">This is a demo tenant with simulated data. Pick a role to explore.</p>

          <div className="mt-8 grid gap-3">
            {DEMO_ACCOUNTS.map((a) => (
              <Button
                key={a.email}
                size="xl"
                variant={a.role === "caregiver" ? "default" : "outline"}
                className="h-16 justify-between rounded-2xl px-5 text-left"
                onClick={() => go(a.email, DEMO_PASSWORD)}
              >
                <span className="flex items-center gap-3">
                  {a.role === "caregiver" ? <UserRound className="size-5" /> : <Stethoscope className="size-5" />}
                  <span className="flex flex-col leading-tight">
                    <span>Use demo account: {a.roleLabel}</span>
                    <span className="text-sm font-normal opacity-80">{a.email}</span>
                  </span>
                </span>
                <ArrowRight />
              </Button>
            ))}
          </div>

          <div className="my-8 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or sign in manually <span className="h-px flex-1 bg-border" />
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              go();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[0.95rem]">Email</Label>
              <Input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl px-4 text-base" placeholder="caregiver@demo.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[0.95rem]">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl px-4 text-base" />
            </div>
            {error && (
              <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" size="xl" variant="secondary" className="w-full">
              Sign in
            </Button>
          </form>

          <div className="mt-6 flex gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
            <Info className="mt-0.5 size-5 shrink-0 text-primary" />
            <div className="space-y-1">
              <p className="font-semibold">Demo accounts (mock sign-in, no real auth)</p>
              <p className="text-muted-foreground">
                <code className="font-mono text-foreground">caregiver@demo.com</code> (Caregiver) ·{" "}
                <code className="font-mono text-foreground">director@demo.com</code> (Director/Admin)
              </p>
              <p className="text-muted-foreground">
                Password: <code className="font-mono font-semibold text-foreground">{DEMO_PASSWORD}</code>
              </p>
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground">{site.medicalDisclaimer}</p>
      </div>
    </div>
  );
}
