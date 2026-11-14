// Client-rendered behind mock auth; opt out of instant-navigation validation.
export const instant = false;

import { ModelView } from "./model-view";

export default function Page() {
  return <ModelView />;
}
