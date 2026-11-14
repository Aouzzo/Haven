"use client";

import { useState } from "react";
import { ChevronDown, CircleCheck, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LEAD_ROLES, validateLead, type LeadErrors } from "@/lib/leads/schema";
import { cn } from "@/lib/utils";

type State = "idle" | "submitting" | "success" | "error";

export function PilotForm() {
  const [state, setState] = useState<State>("idle");
  const [errors, setErrors] = useState<LeadErrors>({});
  const [serverError, setServerError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    const check = validateLead(data);
    if (!check.ok) {
      setErrors(check.errors);
      const first = Object.keys(check.errors)[0];
      document.getElementById(`lead-${first}`)?.focus();
      return;
    }
    setErrors({});
    setServerError("");
    setState("submitting");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...check.value, website: data.website ?? "" }),
      });
      const json = (await res.json()) as { ok: boolean; errors?: LeadErrors; error?: string };
      if (!res.ok || !json.ok) {
        if (json.errors) setErrors(json.errors);
        setServerError(json.error ?? "Something went wrong. Please try again.");
        setState("error");
        return;
      }
      setState("success");
    } catch {
      setServerError("Network error. Please try again.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-border bg-card p-10 text-center shadow-sm animate-fade-up" role="status">
        <span className="flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CircleCheck className="size-9" />
        </span>
        <h3 className="mt-6 text-2xl font-bold">Thanks, we got your request.</h3>
        <p className="mt-3 max-w-sm text-lg leading-relaxed text-muted-foreground">
          We&apos;ll reach out by email to set up a short call about a pilot at your community.
        </p>
        <Button variant="outline" size="lg" className="mt-8" onClick={() => setState("idle")}>
          Submit another request
        </Button>
      </div>
    );
  }

  const field = (name: keyof LeadErrors) => ({
    id: `lead-${name}`,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `lead-${name}-error` : undefined,
  });

  const Err = ({ name }: { name: keyof LeadErrors }) =>
    errors[name] ? (
      <p id={`lead-${name}-error`} className="text-sm font-medium text-destructive">
        {errors[name]}
      </p>
    ) : null;

  const inputCls = "h-12 rounded-xl bg-background px-4 text-base";

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="lead-name" className="text-[0.95rem]">Your name</Label>
          <Input {...field("name")} autoComplete="name" className={inputCls} />
          <Err name="name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lead-email" className="text-[0.95rem]">Work email</Label>
          <Input {...field("email")} type="email" autoComplete="email" className={inputCls} />
          <Err name="email" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="lead-facility" className="text-[0.95rem]">Facility name</Label>
          <Input {...field("facility")} autoComplete="organization" className={inputCls} />
          <Err name="facility" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lead-role" className="text-[0.95rem]">Your role</Label>
          <div className="relative">
            <select
              {...field("role")}
              defaultValue=""
              className={cn(
                "w-full appearance-none rounded-xl border border-input pr-10 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive",
                inputCls
              )}
            >
              <option value="" disabled>
                Choose one
              </option>
              {LEAD_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
          </div>
          <Err name="role" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lead-rooms" className="text-[0.95rem]">Number of rooms</Label>
          <Input {...field("rooms")} type="number" inputMode="numeric" min={1} max={5000} className={inputCls} />
          <Err name="rooms" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="lead-message" className="text-[0.95rem]">
            Message <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            {...field("message")}
            rows={4}
            className="rounded-xl bg-background px-4 py-3 text-base"
            placeholder="Anything we should know? Please don't include resident information."
          />
          <Err name="message" />
        </div>
        {/* Honeypot */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
      </div>
      {serverError && (
        <p className="mt-5 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive" role="alert">
          {serverError}
        </p>
      )}
      <div className="mt-7 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">We only use this to contact you about a pilot.</p>
        <Button type="submit" size="xl" disabled={state === "submitting"}>
          {state === "submitting" ? <Loader2 className="animate-spin" /> : <Send />}
          {state === "submitting" ? "Sending…" : "Request a pilot"}
        </Button>
      </div>
    </form>
  );
}
