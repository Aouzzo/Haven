// Client-rendered behind mock auth; opt out of instant-navigation validation.
export const instant = false;

import { Overview } from "./overview";

export default function DashboardPage() {
  return <Overview />;
}
