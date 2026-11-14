import { createSampleSource } from "@/lib/facility/sample-data";
import type { FacilityDataSource } from "@/lib/facility/types";

/**
 * THE SWAP POINT. Tonight this returns simulated sample data.
 * Tomorrow, return a source that implements `FacilityDataSource` over the live
 * sensor feed (e.g. a WebSocket client) and every dashboard page follows.
 */
export function createFacilitySource(): FacilityDataSource {
  return createSampleSource();
}
