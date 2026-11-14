import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/shell";

export const metadata: Metadata = { title: "Admin" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell requireRole="director">{children}</DashboardShell>;
}
