// Client-rendered behind mock auth; opt out of instant-navigation validation.
export const instant = false;

import { RequireRole } from "@/components/dashboard/shell";
import { ReportsView } from "./reports-view";

export default function Page() {
  return (
    <RequireRole role="director">
      <ReportsView />
    </RequireRole>
  );
}
