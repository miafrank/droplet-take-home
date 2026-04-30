import { TrafficLane } from "./trafficLane";
import { Crosswalk } from "./crosswalk";
import { TrafficLightSignal } from "./enums/trafficLightSignal";
import { LaneDirection } from "./enums/laneDirection";
import { LaneType } from "./enums/laneType";
import { Vehicle } from "./vehicle";
import { PedestrianSignal } from "./enums/pedestrianSignal";

export class Intersection {
  trafficLanes: TrafficLane[];
  crosswalks: Crosswalk[];

  constructor(trafficLanes: TrafficLane[], crosswalks: Crosswalk[]) {
    this.trafficLanes = trafficLanes;
    this.crosswalks = crosswalks;
  }

  laneDirections: LaneDirection[] = [
    LaneDirection.NORTH,
    LaneDirection.SOUTH,
    LaneDirection.EAST,
    LaneDirection.WEST,
  ];

  laneTypes: LaneType[] = [
    LaneType.LEFT,
    LaneType.STRAIGHT,
    LaneType.STRAIGHT,
    LaneType.RIGHT,
  ];

  northSouthDirections = new Set<LaneDirection>([
    LaneDirection.NORTH,
    LaneDirection.SOUTH,
  ]);

  eastWestDirections = new Set<LaneDirection>([
    LaneDirection.EAST,
    LaneDirection.WEST,
  ]);

  createVehicles = (laneType: LaneType): Vehicle[] => {
    const vehicleCount = Math.floor(Math.random() * 6) + 5;

    return Array.from(
      { length: vehicleCount },
      (index: number) => new Vehicle(index, laneType),
    );
  };

  initializeTraffic() {
    // Initialize North-South travel with left turn lights set to RED,
    // Straight and right lights are set to GREEN and all East-West traffic lights set to RED
    // Pedestrian signals are all said to RAISED HAND - no walks requested

    this.trafficLanes = this.laneDirections.flatMap(
      (laneDirections: LaneDirection) =>
        this.laneTypes.map((laneType: LaneType) => {
          const vehicleSignal =
            this.northSouthDirections.has(laneDirections) &&
            laneType !== LaneType.LEFT
              ? TrafficLightSignal.GREEN
              : TrafficLightSignal.RED;

          return new TrafficLane(
            this.createVehicles(laneType),
            laneDirections,
            laneType,
            vehicleSignal,
          );
        }),
    );

    this.crosswalks = this.laneDirections.map(
      (laneDirections: LaneDirection) =>
        new Crosswalk(laneDirections, PedestrianSignal.RAISED_HAND, false),
    );
  }

  isEastWestPedestrianCrossing(crossingDirection: LaneDirection) {
    return (
      crossingDirection === LaneDirection.EAST ||
      crossingDirection === LaneDirection.WEST
    );
  }

  isNorthSouthPedestrianCrossing(crossingDirection: LaneDirection) {
    return (
      crossingDirection === LaneDirection.NORTH ||
      crossingDirection === LaneDirection.SOUTH
    );
  }

  fetchBlockedDirections(crossingDirection: LaneDirection) {
    const isEastWestPedestrianCrossing =
      this.isEastWestPedestrianCrossing(crossingDirection);

    const isNorthSouthPedestrianCrossing =
      this.isNorthSouthPedestrianCrossing(crossingDirection);

    if (isEastWestPedestrianCrossing) {
      const blockedDirections: LaneDirection[] = [
        LaneDirection.NORTH,
        LaneDirection.SOUTH,
      ];

      return blockedDirections;
    }

    if (isNorthSouthPedestrianCrossing) {
      const blockedDirections: LaneDirection[] = [
        LaneDirection.EAST,
        LaneDirection.WEST,
      ];

      return blockedDirections;
    }

    // If no pedestrians crossing
    return [];
  }

  fetchParallelDirections(crossingDirection: LaneDirection) {
    const isEastWestPedestrianCrossing =
      this.isEastWestPedestrianCrossing(crossingDirection);

    const isNorthSouthPedestrianCrossing =
      this.isNorthSouthPedestrianCrossing(crossingDirection);

    if (isEastWestPedestrianCrossing) {
      const parallelDirections: LaneDirection[] = [
        LaneDirection.EAST,
        LaneDirection.WEST,
      ];

      return parallelDirections;
    }

    if (isNorthSouthPedestrianCrossing) {
      const parallelDirections: LaneDirection[] = [
        LaneDirection.NORTH,
        LaneDirection.SOUTH,
      ];

      return parallelDirections;
    }
    // If no pedestrians crossing
    return [];
  }

  updateTrafficSignalsOnPedestrianCrossing(
    parallelDirections: LaneDirection[],
    blockedDirections: LaneDirection[],
  ) {
    const previousSignals = new Map<TrafficLane, TrafficLightSignal>();

    this.trafficLanes.forEach((lane: TrafficLane) => {
      previousSignals.set(lane, lane.trafficLightSignal);

      // Check if traffic flow same direction as pedestrian flow for straight lanes only
      const shouldAllowStraightTraffic =
        parallelDirections.includes(lane.laneDirection) &&
        lane.laneType === LaneType.STRAIGHT;

      const shouldStopTraffic = blockedDirections.includes(lane.laneDirection);

      // Update blocked directions traffic lights to RED
      if (shouldStopTraffic) {
        lane.trafficLightSignal = TrafficLightSignal.RED;
        return;
      }

      // Change traffic light for left and right to RED and straight to GREEN on ped-xing
      lane.trafficLightSignal = shouldAllowStraightTraffic
        ? TrafficLightSignal.GREEN
        : TrafficLightSignal.RED;
    });

    return previousSignals;
  }

  requestPedestrianCrossing(crossingDirection: LaneDirection): void {
    // _TODO_: Account for multiple walks requested in non-parallel directions

    const crosswalk = this.crosswalks.find(
      // Find first occurence of requested walk
      (cw: Crosswalk) => cw.laneDirection === crossingDirection,
    );

    if (!crosswalk) {
      return;
    }

    const blockedDirections: LaneDirection[] =
      this.fetchBlockedDirections(crossingDirection);

    const parallelDirections: LaneDirection[] =
      this.fetchParallelDirections(crossingDirection);

    const previousSignals = this.updateTrafficSignalsOnPedestrianCrossing(
      parallelDirections,
      blockedDirections,
    );

    // TODO: What logic can we move to CrossWalk

    // simulate ped x-ing request, 30 second phase
    if (crosswalk.requestWalk()) {
      crosswalk.pedestrianSignal = PedestrianSignal.WALKING_PERSON;

      setTimeout(() => {
        crosswalk.pedestrianSignal = PedestrianSignal.RAISED_HAND;
        crosswalk.walkRequested = false;

        this.trafficLanes.forEach((lane: TrafficLane) => {
          const previousSignal = previousSignals.get(lane);

          if (previousSignal) {
            lane.trafficLightSignal = previousSignal;
          }
        });
      }, 30_000);
    }
  }
}
