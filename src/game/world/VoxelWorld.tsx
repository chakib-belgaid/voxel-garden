import type { MutableRefObject } from "react";
import { DroneFleet } from "../entities/DroneFleet";
import { Player } from "../entities/Player";
import { RobotSwarm } from "../entities/RobotSwarm";
import type { ThirdPersonCameraState } from "../types";
import { DroneWorksites } from "./DroneWorksites";
import { GardenParticles } from "./GardenParticles";
import { WorldLandmarks } from "./Landmarks";
import { LabSites } from "./LabSites";
import { ProceduralTerrain } from "./ProceduralTerrain";
import { WebsiteSectionHotspots } from "./WebsiteSectionHotspots";

export function VoxelWorld({ cameraStateRef }: { cameraStateRef: MutableRefObject<ThirdPersonCameraState> }) {
  return (
    <group dispose={null}>
      <ProceduralTerrain />
      <WorldLandmarks />
      <LabSites />
      <DroneWorksites />
      <RobotSwarm />
      <DroneFleet />
      <GardenParticles />
      <Player cameraStateRef={cameraStateRef} />
      <WebsiteSectionHotspots />
    </group>
  );
}
