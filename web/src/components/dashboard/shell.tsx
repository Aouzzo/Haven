"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, BellOff, Flame, LogOut, Menu, Moon, Sun } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { AlertCenter } from "@/components/dashboard/alert-center";
import { DemoControls } from "@/components/dashboard/demo-controls";
import { DASHBOARD_NAV } from "@/components/dashboard/nav";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { signOut, useSession, type Role, type Session } from "@/lib/auth";
import { site } from "@/lib/site";
import { unlockAudio } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { FacilityDataProvider, useFacilityData } from "@/providers/facility-data-provider";

export function DashboardShell({ children, requireRole }: { children: React.ReactNode; requireRole?: Role }) {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session === null) router.replace("/login");
  }, [session, router]);

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <LogoMark className="animate-pulse" /> Loading dashboard…
        </div>
      </div>
    );
  }

  return (
    <FacilityDataProvider actorLabel={`${session.displayName} (${session.roleLabel})`}>
      <ShellFrame session={session} requireRole={requireRole}>
        {children}
      </ShellFrame>
    </FacilityDataProvider>
  );
}

function ThemeSync() {
  const { settings } = useFacilityData();
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", settings.darkMode);
    return () => root.classList.remove("dark");
  }, [settings.darkMode]);
  return null;
}

function ShellFrame({ session, requireRole, children }: { session: Session; requireRole?: Role; children: React.ReactNode }) {
  const { ready } = useFacilityData();
  const [mobileOpen, setMobileOpen] = useState(false);
  const allowed = !requireRole || session.role === requireRole;

  return (
    <div className="min-h-screen bg-background text-foreground" onPointerDown={unlockAudio}>
      <ThemeSync />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
        <SidebarContent role={session.role} />
      </aside>
      <div className="lg:pl-64">
        <Header session={session} mobileNav={
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-lg" className="lg:hidden" aria-label="Open navigation">
                <Menu className="size-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0" showCloseButton={false}>
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarContent role={session.role} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
        } />
        {ready ? (
          <AlertCenter>
            <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:py-8">
              {allowed ? children : <RoleGate role={requireRole!} />}
            </main>
            <DemoControls />
          </AlertCenter>
        ) : (
          <main className="mx-auto w-full max-w-[1500px] space-y-4 px-4 py-6 sm:px-6 lg:py-8">
            <Skeleton className="h-9 w-64" />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-96 rounded-2xl" />
          </main>
        )}
      </div>
    </div>
  );
}

/** Renders children only for the given role (mock auth). */
export function RequireRole({ role, children }: { role: Role; children: React.ReactNode }) {
  const session = useSession();
  if (!session) return null;
  return session.role === role ? <>{children}</> : <RoleGate role={role} />;
}

function RoleGate({ role }: { role: Role }) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center">
      <h1 className="text-2xl font-bold">Director access only</h1>
      <p className="mt-2 text-muted-foreground">
        This page is available to the {role === "director" ? "Director / Admin" : role} role. Sign out and use the
        director demo account to view it.
      </p>
      <Button asChild className="mt-6" size="lg">
        <Link href="/dashboard">Back to overview</Link>
      </Button>
    </div>
  );
}

function SidebarContent({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { openAlerts, evacuation } = useFacilityData();
  const items = DASHBOARD_NAV.filter((i) => !i.roles || i.roles.includes(role));

  return (
    <div className="flex h-full flex-col">
      <Link href="/dashboard" onClick={onNavigate} className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5 font-heading font-bold">
        <LogoMark />
        <span className="truncate">{site.name}</span>
      </Link>
      <nav aria-label="Dashboard" className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              <Icon className={cn("size-5", active && "text-primary")} />
              <span className="flex-1">{item.label}</span>
              {item.badge === "alerts" && openAlerts.length > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">
                  {openAlerts.length}
                </span>
              )}
              {item.href === "/dashboard/evacuation" && evacuation.active && (
                <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[0.65rem] font-bold text-white uppercase">On</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-4 text-xs leading-relaxed text-muted-foreground">
        <p className="font-semibold text-foreground/80">{site.medicalDisclaimer}</p>
        <p className="mt-1">Rooms by number only. No video, audio, or identity.</p>
      </div>
    </div>
  );
}

function Header({ session, mobileNav }: { session: Session; mobileNav: React.ReactNode }) {
  const { facilityName, settings, actions, now, sourceKind, evacuation, ready } = useFacilityData();
  const router = useRouter();
  const badge = sourceKind === "live" ? "LIVE" : sourceKind === "replay" ? "REPLAY" : "SAMPLE DATA";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/90 px-3 backdrop-blur-md sm:gap-3 sm:px-6">
      {mobileNav}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <p className="truncate font-heading text-base font-bold sm:text-lg">{facilityName || site.tenantName}</p>
        <span
          className={cn(
            "shrink-0 rounded-md px-2 py-1 text-[0.7rem] font-extrabold tracking-wider sm:text-xs",
            sourceKind === "live"
              ? "bg-emerald-600 text-white"
              : "bg-amber-400 text-amber-950 ring-1 ring-amber-500"
          )}
        >
          {badge}
        </span>
        {evacuation.active && (
          <Link
            href="/dashboard/evacuation"
            className="hidden shrink-0 items-center gap-1 rounded-md bg-orange-600 px-2 py-1 text-xs font-bold text-white uppercase sm:inline-flex"
          >
            <Flame className="size-3.5" /> Evacuation mode
          </Link>
        )}
      </div>
      <p className="hidden font-mono text-sm font-semibold text-muted-foreground tabular md:block" suppressHydrationWarning>
        {ready && now ? new Date(now).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" }) : ""}
      </p>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label={settings.soundEnabled ? "Mute alert sound" : "Unmute alert sound"}
            aria-pressed={!settings.soundEnabled}
            onClick={() => actions.updateSettings({ soundEnabled: !settings.soundEnabled })}
            className={cn(!settings.soundEnabled && "text-red-600")}
          >
            {settings.soundEnabled ? <Bell className="size-5" /> : <BellOff className="size-5" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{settings.soundEnabled ? "Sound on" : "Sound muted"}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label={settings.darkMode ? "Switch to light mode" : "Switch to dark mode"}
            className="hidden sm:inline-flex"
            onClick={() => actions.updateSettings({ darkMode: !settings.darkMode })}
          >
            {settings.darkMode ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{settings.darkMode ? "Light mode" : "Nurse-station dark mode"}</TooltipContent>
      </Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-10 gap-2 rounded-full pr-2 pl-1" aria-label="Account">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {session.role === "director" ? "D" : "C"}
            </span>
            <span className="hidden text-left text-sm leading-tight xl:block">
              <span className="block font-semibold">{session.displayName}</span>
              <span className="block text-xs text-muted-foreground">{session.roleLabel}</span>
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="font-semibold">{session.displayName}</p>
            <p className="text-xs font-normal text-muted-foreground">{session.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings">Settings</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/">Back to website</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              signOut();
              router.push("/login");
            }}
          >
            <LogOut className="size-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
