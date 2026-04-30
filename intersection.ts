import { TrafficLane } from "./trafficLane";
import { Crosswalk } from "./crosswalk";
import { VehicleSignal } from "./enums/vehicleSignal";
import { LaneDirection } from "./enums/laneDirection";
import { LaneType } from "./enums/laneType";
import { Vehicle } from "./vehicle";
import { PedestrianSignal } from "./enums/pedestrianSignal";

export class Intersection {
  trafficLanes: TrafficLane[];
  crosswalks: Crosswalk[];

  initializeTraffic() {
    // Initialize North-South travel with left turn lights set to RED, 
    // straight and right lights are set to GREEN and all East-West traffic lights set to RED
    // Pedestrian signals are all said to RAISED HAND - no walks requested
    const laneDirections: LaneDirection[] = [
      LaneDirection.NORTH,
      LaneDirection.SOUTH,
      LaneDirection.EAST,
      LaneDirection.WEST,
    ];

    const laneTypes: LaneType[] = [
      LaneType.LEFT,
      LaneType.STRAIGHT,
      LaneType.STRAIGHT,
      LaneType.RIGHT,
    ];

    const northSouthDirections = new Set<LaneDirection>([
      LaneDirection.NORTH,
      LaneDirection.SOUTH,
    ]);

    const createVehicles = (laneType: LaneType): Vehicle[] => {
      const vehicleCount = Math.floor(Math.random() * 6) + 5;

      return Array.from(
        { length: vehicleCount },
        (index: number) => new Vehicle(index, laneType),
      );
    };

    this.trafficLanes = laneDirections.flatMap(
      (laneDirections: LaneDirection) =>
        laneTypes.map((laneType: LaneType) => {
          const vehicleSignal =
            northSouthDirections.has(laneDirections) &&
            laneType !== LaneType.LEFT
              ? VehicleSignal.GREEN
              : VehicleSignal.RED;

          return new TrafficLane(
            createVehicles(laneType),
            laneDirections,
            laneType,
            vehicleSignal,
          );
        }),
    );

    this.crosswalks = laneDirections.map(
      (laneDirections: LaneDirection) =>
        new Crosswalk(laneDirections, PedestrianSignal.RAISED_HAND, false),
    );
  }

  constructor(trafficLanes: TrafficLane[], crosswalks: Crosswalk[]) {
    this.trafficLanes = trafficLanes;
    this.crosswalks = crosswalks;
  }
}
