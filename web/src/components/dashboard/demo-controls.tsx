"use client";

import { useEffect, useState } from "react";
import { FlaskConical, RotateCcw, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useFacilityData } from "@/providers/facility-data-provider";

/** Hidden presenter controls. Open with Ctrl+Shift+D. */
export function DemoControls() {
  const { rooms, actions, autoFalls, sourceKind } = useFacilityData();
  const [open, setOpen] = useState(false);
  const [room, setRoom] = useState("104");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FlaskConical className="size-5 text-primary" /> Demo controls
          </DialogTitle>
          <DialogDescription>
            Presenter-only tools for the {sourceKind} data source. Toggle with Ctrl+Shift+D.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="demo-room">Trigger a sample fall in</Label>
            <div className="flex gap-2">
              <select
                id="demo-room"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="h-11 flex-1 rounded-xl border border-input bg-background px-3 text-base"
              >
                <option value="">Random occupied room</option>
                {rooms
                  .filter((r) => r.kind === "resident")
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
              </select>
              <Button
                size="lg"
                className="h-11 bg-red-600 text-white hover:bg-red-700"
                onClick={() => {
                  actions.demoTriggerFall(room || undefined);
                  setOpen(false);
                }}
              >
                <Siren /> Trigger
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The alert appears once the stillness threshold passes.
            </p>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <div>
              <Label htmlFor="auto-falls">Automatic sample falls</Label>
              <p className="text-xs text-muted-foreground">About one every 60 seconds</p>
            </div>
            <Switch id="auto-falls" checked={autoFalls} onCheckedChange={(v) => actions.demoSetAutoFalls(v)} />
          </div>
          <Button
            variant="outline"
            size="lg"
            className="h-11 w-full"
            onClick={() => {
              actions.demoResetAlerts();
              setOpen(false);
            }}
          >
            <RotateCcw /> Reset all open alerts
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
