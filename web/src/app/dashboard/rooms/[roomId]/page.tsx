// Client-rendered behind mock auth; opt out of instant-navigation validation.
export const instant = false;

import { Suspense } from "react";
import { RoomDetail } from "./room-detail";

export default function RoomPage() {
  return (
    <Suspense fallback={null}>
      <RoomDetail />
    </Suspense>
  );
}
