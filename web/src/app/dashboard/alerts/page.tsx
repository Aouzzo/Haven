// Client-rendered behind mock auth; opt out of instant-navigation validation.
export const instant = false;

import { AlertsView } from "./alerts-view";

export default function Page() {
  return <AlertsView />;
}
