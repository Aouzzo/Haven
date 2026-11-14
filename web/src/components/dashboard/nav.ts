import {
  BellRing,
  BrainCircuit,
  ChartColumn,
  Flame,
  Inbox,
  LayoutGrid,
  Radio,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/auth";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: Role[];
  badge?: "alerts";
}

export const DASHBOARD_NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/alerts", label: "Alerts", icon: BellRing, badge: "alerts" },
  { href: "/dashboard/evacuation", label: "Fire evacuation", icon: Flame },
  { href: "/dashboard/reports", label: "Reports", icon: ChartColumn, roles: ["director"] },
  { href: "/dashboard/model", label: "AI model", icon: BrainCircuit },
  { href: "/dashboard/sensors", label: "Sensors", icon: Radio },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/admin/leads", label: "Pilot leads", icon: Inbox, roles: ["director"] },
];
