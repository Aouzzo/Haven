// Client-rendered behind mock auth; opt out of instant-navigation validation.
export const instant = false;

import { SensorsView } from "./sensors-view";

export default function Page() {
  return <SensorsView />;
}
