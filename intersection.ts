import { TrafficLane } from "./trafficLane";
import { Crosswalk } from "./crosswalk";

export class Intersection {
  trafficLanes: TrafficLane[];
  crosswalks: Crosswalk[];

  constructor(
    trafficLanes: TrafficLane[],
    crosswalks: Crosswalk[],
  ) {
    this.trafficLanes = trafficLanes;
    this.crosswalks = crosswalks;
  }
}
