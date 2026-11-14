// Client-rendered behind mock auth; opt out of instant-navigation validation.
export const instant = false;

import { EvacuationView } from "./evacuation-view";

export default function Page() {
  return <EvacuationView />;
}
