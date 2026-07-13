import type { WorldPosition } from "../types";
import { WEBSITE_MAP_ANCHORS } from "./generated/terminalDashboardMap";

export type LabKind = "energy" | "bioglass" | "robotics" | "fabrication";

export interface LabSite {
  id: string;
  name: string;
  kind: LabKind;
  position: WorldPosition;
  accent: string;
  footprint: Readonly<{ halfWidth: number; halfDepth: number }>;
}

export const LAB_SITES: readonly LabSite[] = Object.freeze([
  {
    id: "helio-metrics",
    name: "Helio Metrics Lab",
    kind: "energy",
    position: WEBSITE_MAP_ANCHORS.labs["helio-metrics"],
    accent: "#9bd42b",
    footprint: { halfWidth: 3.2, halfDepth: 2.45 }
  },
  {
    id: "mossglass",
    name: "Mossglass Research Lab",
    kind: "bioglass",
    position: WEBSITE_MAP_ANCHORS.labs.mossglass,
    accent: "#25c8d1",
    footprint: { halfWidth: 3.2, halfDepth: 2.45 }
  },
  {
    id: "courier-robotics",
    name: "Courier Robotics Lab",
    kind: "robotics",
    position: WEBSITE_MAP_ANCHORS.labs["courier-robotics"],
    accent: "#dd8615",
    footprint: { halfWidth: 3.35, halfDepth: 2.55 }
  },
  {
    id: "local-systems",
    name: "Local Systems Lab",
    kind: "fabrication",
    position: WEBSITE_MAP_ANCHORS.labs["local-systems"],
    accent: "#8537da",
    footprint: { halfWidth: 3.35, halfDepth: 2.55 }
  }
]);
