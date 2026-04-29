import { LaneDirection } from "./enums/laneDirection";
import { PedestrianSignal } from "./enums/pedestrianSignal";

export class Crosswalk {
  laneDirection: LaneDirection;
  pedestrianSignal: PedestrianSignal;

  constructor(
    laneDirection: LaneDirection,
    pedestrianSignal: PedestrianSignal,
  ) {
    this.laneDirection = laneDirection;
    this.pedestrianSignal = pedestrianSignal;
  }
}
