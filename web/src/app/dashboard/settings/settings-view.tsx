"use client";

import { useState } from "react";
import { Bell, Moon, Plus, RotateCcw, Trash2, Volume2 } from "lucide-react";
import { PageHeader, Panel } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { mmss } from "@/lib/format";
import { playChime } from "@/lib/sound";
import { DEFAULT_SETTINGS, useFacilityData } from "@/providers/facility-data-provider";

export function SettingsView() {
  const { settings, actions } = useFacilityData();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  function addContact(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;
    actions.updateSettings({
      contacts: [...settings.contacts, { id: `c${Date.now()}`, name: name.trim().slice(0, 60), role: role.trim().slice(0, 60) }],
    });
    setName("");
    setRole("");
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Alert thresholds and preferences. Saved in this browser for the demo."
        actions={
          <Button variant="outline" size="lg" onClick={() => actions.updateSettings(DEFAULT_SETTINGS)}>
            <RotateCcw /> Restore defaults
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Alert timing" description="How long to wait before alerting and escalating">
          <div className="space-y-8">
            <div>
              <div className="flex items-baseline justify-between">
                <Label className="text-base font-semibold">Stillness threshold</Label>
                <span className="font-heading text-2xl font-bold tabular">{settings.stillThresholdSeconds}s</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                After a possible fall, how many seconds without movement before staff are alerted.
              </p>
              <Slider
                className="mt-4"
                min={5}
                max={120}
                step={5}
                value={[settings.stillThresholdSeconds]}
                onValueChange={([v]) => actions.updateSettings({ stillThresholdSeconds: v })}
                aria-label="Stillness threshold in seconds"
              />
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <Label className="text-base font-semibold">Escalation timer</Label>
                <span className="font-heading text-2xl font-bold tabular">{mmss(settings.escalationSeconds)}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                If nobody acknowledges an alert within this time, it escalates to the Director of Nursing.
              </p>
              <Slider
                className="mt-4"
                min={30}
                max={300}
                step={15}
                value={[settings.escalationSeconds]}
                onValueChange={([v]) => actions.updateSettings({ escalationSeconds: v })}
                aria-label="Escalation timer in seconds"
              />
            </div>
          </div>
        </Panel>

        <Panel title="Display & sound">
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between gap-4 pb-5">
              <div className="flex gap-3">
                <Bell className="mt-0.5 size-5 text-primary" />
                <div>
                  <Label htmlFor="sound" className="text-base font-semibold">Alert sound</Label>
                  <p className="text-sm text-muted-foreground">Chime on new alerts and escalations</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => playChime("alert")}>
                  <Volume2 /> Test
                </Button>
                <Switch id="sound" checked={settings.soundEnabled} onCheckedChange={(v) => actions.updateSettings({ soundEnabled: v })} />
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 pt-5">
              <div className="flex gap-3">
                <Moon className="mt-0.5 size-5 text-primary" />
                <div>
                  <Label htmlFor="dark" className="text-base font-semibold">Dark mode</Label>
                  <p className="text-sm text-muted-foreground">Easier on the eyes for a nurse-station screen at night</p>
                </div>
              </div>
              <Switch id="dark" checked={settings.darkMode} onCheckedChange={(v) => actions.updateSettings({ darkMode: v })} />
            </div>
          </div>
        </Panel>

        <Panel title="Notification contacts" description="Who gets alerts and escalations. Name and role only." className="xl:col-span-2">
          <ul className="divide-y divide-border rounded-xl border border-border">
            {settings.contacts.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex-1">
                  <span className="block font-semibold">{c.name}</span>
                  <span className="text-sm text-muted-foreground">{c.role}</span>
                </span>
                <Button
                  variant="ghost"
                  size="icon-lg"
                  aria-label={`Remove ${c.name}`}
                  onClick={() => actions.updateSettings({ contacts: settings.contacts.filter((x) => x.id !== c.id) })}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
            {!settings.contacts.length && <li className="px-4 py-3 text-muted-foreground">No contacts yet.</li>}
          </ul>
          <form onSubmit={addContact} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (e.g., Night shift lead)" className="h-11 rounded-xl" aria-label="Contact name" />
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (e.g., Charge nurse)" className="h-11 rounded-xl" aria-label="Contact role" />
            <Button type="submit" size="lg" className="h-11">
              <Plus /> Add contact
            </Button>
          </form>
        </Panel>
      </div>
    </>
  );
}
