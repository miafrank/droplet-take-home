import { LaneDirection } from "./enums/laneDirection";
import { PedestrianSignal } from "./enums/pedestrianSignal";

export class Crosswalk {
  laneDirection: LaneDirection;
  pedestrianSignal: PedestrianSignal;
  walkRequested: boolean;

  constructor(
    laneDirection: LaneDirection,
    pedestrianSignal: PedestrianSignal,
    walkRequested: boolean,
  ) {
    this.laneDirection = laneDirection;
    this.pedestrianSignal = pedestrianSignal;
    this.walkRequested = walkRequested;
  }

  requestWalk() {
    this.walkRequested = true;
    return this.walkRequested;
  }
}
