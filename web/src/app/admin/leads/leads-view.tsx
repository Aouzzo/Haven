"use client";

import { useCallback, useEffect, useState } from "react";
import { Inbox, KeyRound, RefreshCw } from "lucide-react";
import { PageHeader, Panel } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { dateTime } from "@/lib/format";
import type { Lead } from "@/lib/leads/schema";

const KEY_STORAGE = "leads-admin-key";

type State =
  | { kind: "loading" }
  | { kind: "ok"; leads: Lead[]; storage: string }
  | { kind: "auth"; message: string }
  | { kind: "error"; message: string };

export function LeadsView() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [keyInput, setKeyInput] = useState("");

  const load = useCallback(async () => {
    let key = "";
    try {
      key = sessionStorage.getItem(KEY_STORAGE) ?? "";
    } catch {}
    try {
      const res = await fetch("/api/leads", { headers: key ? { "x-admin-key": key } : {}, cache: "no-store" });
      const json = (await res.json()) as { ok: boolean; leads?: Lead[]; storage?: string; error?: string; message?: string };
      if (res.status === 401) {
        setState({
          kind: "auth",
          message: json.error === "not_configured" ? "LEADS_ADMIN_KEY isn't set on this deployment yet." : "Enter the admin key to view leads.",
        });
        return;
      }
      if (!json.ok) throw new Error(json.error);
      setState({ kind: "ok", leads: json.leads ?? [], storage: json.storage ?? "" });
    } catch {
      setState({ kind: "error", message: "Couldn't load leads." });
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  return (
    <>
      <PageHeader
        title="Pilot leads"
        description="Requests from the website's pilot form. Real submissions, not sample data."
        actions={
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              setState({ kind: "loading" });
              void load();
            }}
          >
            <RefreshCw /> Refresh
          </Button>
        }
      />
      {state.kind === "auth" && (
        <Panel className="max-w-lg">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              try {
                sessionStorage.setItem(KEY_STORAGE, keyInput);
              } catch {}
              void load();
            }}
          >
            <p className="flex items-center gap-2 font-semibold">
              <KeyRound className="size-4 text-primary" /> {state.message}
            </p>
            <Input type="password" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} placeholder="Admin key" className="h-11 rounded-xl" aria-label="Admin key" />
            <Button type="submit" size="lg">Unlock</Button>
          </form>
        </Panel>
      )}
      {state.kind === "error" && <p className="text-destructive">{state.message}</p>}
      {state.kind === "loading" && <p className="text-muted-foreground">Loading…</p>}
      {state.kind === "ok" && (
        <Panel bodyClassName="p-0">
          {state.leads.length ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[860px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Received</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Work email</TableHead>
                    <TableHead>Facility</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Rooms</TableHead>
                    <TableHead className="pr-5">Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.leads.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="pl-5 tabular">{dateTime(l.created_at)}</TableCell>
                      <TableCell className="font-semibold">{l.name}</TableCell>
                      <TableCell>
                        <a href={`mailto:${l.email}`} className="text-primary hover:underline">{l.email}</a>
                      </TableCell>
                      <TableCell>{l.facility}</TableCell>
                      <TableCell>{l.role}</TableCell>
                      <TableCell className="text-right tabular">{l.rooms}</TableCell>
                      <TableCell className="max-w-xs pr-5 whitespace-normal text-muted-foreground">{l.message ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
              <Inbox className="size-10" />
              <p className="font-semibold text-foreground">No pilot requests yet</p>
              <p className="text-sm">Submissions from the homepage form will appear here.</p>
            </div>
          )}
          <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
            Storage: {state.storage === "kv" ? "Vercel KV" : state.storage === "tmp" ? "temporary (/tmp). Configure KV to keep leads." : "local JSON file (.data/leads.json)"}
          </p>
        </Panel>
      )}
    </>
  );
}
